#!/usr/bin/env bash
# =============================================================================
# El Volcán — Auto-deploy, Build y Configuración Nginx Frontend en AWS EC2
# -----------------------------------------------------------------------------
# Modos de uso:
#   ./ec2-autodeploy.sh --boot          -> Ejecutado al iniciar la instancia EC2 (systemd)
#   ./ec2-autodeploy.sh --cron          -> Ejecutado todos los días a las 03:00 AM Chile
#   ./ec2-autodeploy.sh --force         -> Fuerza actualización, npm ci, build y reload Nginx
#   ./ec2-autodeploy.sh --reload-nginx  -> Solo regenera Nginx (útil si cambió IP del backend)
# =============================================================================

set -euo pipefail

export TZ="America/Santiago"
export HOME="${HOME:-/root}"
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export GIT_CONFIG_COUNT=1
export GIT_CONFIG_KEY_0="safe.directory"
export GIT_CONFIG_VALUE_0="*"

MODO="${1:---cron}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_REPO_DIR="/opt/ElVolcanDB"
if [[ "${SCRIPT_DIR}" == *"/frontend/scripts" ]]; then
  DEFAULT_REPO_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
fi

REPO_DIR="${ELVOLCAN_REPO_DIR:-${DEFAULT_REPO_DIR}}"
FRONTEND_DIR="${REPO_DIR}/frontend"
BRANCH="${ELVOLCAN_BRANCH:-main}"
CONFIG_FILE="${ELVOLCAN_FRONTEND_CONFIG:-/etc/elvolcan-frontend.env}"
NGINX_SITE="/etc/nginx/sites-available/elvolcan-frontend"
NGINX_ENABLED="/etc/nginx/sites-enabled/elvolcan-frontend"
LOG_FILE="${ELVOLCAN_LOG_FILE:-/var/log/elvolcan-frontend-autodeploy.log}"
LOCK_FILE="/var/lock/elvolcan-frontend-autodeploy.lock"

mkdir -p "$(dirname "${LOG_FILE}")" /var/lock

log() {
  local ts
  ts="$(TZ="America/Santiago" date '+%Y-%m-%d %H:%M:%S %Z')"
  echo "[${ts}] [elvolcan-frontend:${MODO}] $*" | tee -a "${LOG_FILE}"
}

# Evitar ejecuciones simultáneas
exec 9>"${LOCK_FILE}"
if ! flock -n 9; then
  log "Otra instancia de autodeploy del frontend ya está en ejecución. Saliendo sin conflicto."
  exit 0
fi

# Cargar configuración persistente si existe
if [[ -f "${CONFIG_FILE}" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "${CONFIG_FILE}"
  set +a
fi

BACKEND_UPSTREAM="${BACKEND_UPSTREAM:-}"
FRONTEND_DOMAIN="${FRONTEND_DOMAIN:-_}"
VITE_API_URL="${VITE_API_URL:-/api/v1}"
VITE_CARTO_API_KEY="${VITE_CARTO_API_KEY:-}"

# Normalizar BACKEND_UPSTREAM (quitar barra final)
BACKEND_UPSTREAM="${BACKEND_UPSTREAM%/}"

generar_nginx_conf() {
  log "Generando configuración de Nginx en ${NGINX_SITE}..."

  local proxy_block=""
  if [[ -n "${BACKEND_UPSTREAM}" ]]; then
    proxy_block=$(cat <<EOF
    # Proxy inverso hacia Spring Cloud Gateway (:8080) en la EC2 del Backend
    location /api/v1/ {
        proxy_pass ${BACKEND_UPSTREAM}/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
EOF
)
    log "  Upstream API Gateway configurado: ${BACKEND_UPSTREAM}/api/v1/"
  else
    log "  AVISO: BACKEND_UPSTREAM está vacío en ${CONFIG_FILE}. Se omite bloque proxy /api/v1/ (modo VITE_API_URL directo)."
  fi

  cat > "${NGINX_SITE}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${FRONTEND_DOMAIN};

    root ${FRONTEND_DIR}/dist;
    index index.html;

    # Compresión Gzip para acelerar carga de React y Leaflet
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    # Caché larga para assets con hash generados por Vite
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    # Soporte para rutas SPA de React Router (/productos, /seguimiento, /administradora, etc.)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

${proxy_block}
}
EOF

  rm -f /etc/nginx/sites-enabled/default
  ln -sf "${NGINX_SITE}" "${NGINX_ENABLED}"

  if nginx -t >>"${LOG_FILE}" 2>&1; then
    systemctl enable nginx >/dev/null 2>&1 || true
    if systemctl is-active --quiet nginx; then
      systemctl reload nginx
      log "Nginx recargado correctamente."
    else
      systemctl start nginx
      log "Nginx iniciado correctamente."
    fi
  else
    log "ERROR: La validación 'nginx -t' falló. Revisa ${LOG_FILE}."
    exit 1
  fi
}

escribir_env_frontend() {
  cat > "${FRONTEND_DIR}/.env" <<EOF
# Generado automáticamente desde ${CONFIG_FILE}
VITE_API_URL=${VITE_API_URL}
EOF
  if [[ -n "${VITE_CARTO_API_KEY}" ]]; then
    echo "VITE_CARTO_API_KEY=${VITE_CARTO_API_KEY}" >> "${FRONTEND_DIR}/.env"
  fi
  chmod 640 "${FRONTEND_DIR}/.env"
  log "Archivo ${FRONTEND_DIR}/.env sincronizado (VITE_API_URL=${VITE_API_URL})."
}

compilar_frontend() {
  log "Compilando frontend React + Vite en ${FRONTEND_DIR}..."
  cd "${FRONTEND_DIR}"
  escribir_env_frontend
  npm ci --no-audit --no-fund >>"${LOG_FILE}" 2>&1
  npm run build >>"${LOG_FILE}" 2>&1
  chmod -R a+rX "${FRONTEND_DIR}/dist"
  log "Build de producción completado exitosamente en ${FRONTEND_DIR}/dist."
}

verificar_salud() {
  log "Verificando respuesta local de Nginx en http://127.0.0.1/..."
  if curl -sfI "http://127.0.0.1/" >/dev/null 2>&1; then
    log "Frontend SPA respondiendo HTTP 200 OK."
  else
    log "ADVERTENCIA: Nginx no respondió 200 en http://127.0.0.1/."
  fi

  if [[ -n "${BACKEND_UPSTREAM}" ]]; then
    log "Verificando conectividad hacia Backend (${BACKEND_UPSTREAM}/actuator/health)..."
    if curl -sf --max-time 5 "${BACKEND_UPSTREAM}/actuator/health" >/dev/null 2>&1; then
      log "Conectividad con API Gateway OK (${BACKEND_UPSTREAM})."
    else
      log "ADVERTENCIA: No se pudo contactar ${BACKEND_UPSTREAM}/actuator/health. Revisa Security Group (puerto 8080) o estado del backend."
    fi
  fi
}

log "==================================================================="
log "Iniciando despliegue Frontend en ${REPO_DIR} (rama: ${BRANCH})"

if [[ "${MODO}" == "--reload-nginx" ]]; then
  generar_nginx_conf
  verificar_salud
  log "Recarga de Nginx finalizada."
  log "==================================================================="
  exit 0
fi

if [[ ! -d "${REPO_DIR}/.git" ]]; then
  log "ERROR: No se encontró un repositorio Git válido en ${REPO_DIR}."
  exit 1
fi

if [[ ! -f "${FRONTEND_DIR}/package.json" ]]; then
  log "ERROR: No se encontró ${FRONTEND_DIR}/package.json."
  exit 1
fi

REPO_OWNER="$(stat -c '%U:%G' "${REPO_DIR}" 2>/dev/null || echo "")"
git config --system --add safe.directory "${REPO_DIR}" >/dev/null 2>&1 || true
git config --global --add safe.directory "${REPO_DIR}" >/dev/null 2>&1 || true

git_repo() {
  git -c "safe.directory=*" -c "safe.directory=${REPO_DIR}" -C "${REPO_DIR}" "$@"
}

restaurar_dueno_repo() {
  if [[ -n "${REPO_OWNER}" && "${REPO_OWNER}" != "root:root" ]]; then
    chown -R "${REPO_OWNER}" "${REPO_DIR}/.git" 2>/dev/null || true
    if [[ "${HAY_CAMBIOS:-false}" == "true" ]]; then
      chown -R "${REPO_OWNER}" "${REPO_DIR}" 2>/dev/null || true
    fi
  fi
}

LOCAL_SHA="$(git_repo rev-parse HEAD)"
HAY_CAMBIOS=false
CAMBIOS_FRONTEND=false

log "Consultando cambios remotos en origin/${BRANCH} (commit local: ${LOCAL_SHA:0:7})..."
if git_repo fetch origin "${BRANCH}" --quiet; then
  REMOTE_SHA="$(git_repo rev-parse "origin/${BRANCH}")"
  if [[ "${LOCAL_SHA}" != "${REMOTE_SHA}" ]]; then
    HAY_CAMBIOS=true
    log "Cambios detectados en GitHub: ${LOCAL_SHA:0:7} -> ${REMOTE_SHA:0:7}"
    if git_repo diff --name-only "${LOCAL_SHA}..${REMOTE_SHA}" | grep -q "^frontend/"; then
      CAMBIOS_FRONTEND=true
      log "Se detectaron modificaciones dentro de frontend/."
    else
      log "Los cambios remotos no afectan a frontend/. Se actualizará el repositorio sin recompilar Vite."
    fi
  else
    log "Repositorio actualizado. Sin cambios nuevos en origin/${BRANCH} (${LOCAL_SHA:0:7})."
  fi
else
  log "ADVERTENCIA: No se pudo consultar GitHub. Se continúa con la versión local."
fi

NECESITA_BUILD=false
if [[ ! -f "${FRONTEND_DIR}/dist/index.html" ]]; then
  NECESITA_BUILD=true
  log "No existe ${FRONTEND_DIR}/dist/index.html. Se ejecutará compilación inicial."
elif [[ "${MODO}" == "--force" || "${CAMBIOS_FRONTEND}" == "true" ]]; then
  NECESITA_BUILD=true
fi

if [[ "${HAY_CAMBIOS}" == "true" ]]; then
  log "Actualizando clon local a origin/${BRANCH}..."
  git_repo reset --hard "origin/${BRANCH}" >>"${LOG_FILE}" 2>&1
  chmod +x "${REPO_DIR}"/frontend/scripts/*.sh 2>/dev/null || true
fi

if [[ "${NECESITA_BUILD}" == "true" ]]; then
  compilar_frontend
fi

restaurar_dueno_repo
generar_nginx_conf
verificar_salud

log "Proceso finalizado correctamente."
log "==================================================================="
