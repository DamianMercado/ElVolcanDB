#!/usr/bin/env bash
# =============================================================================
# El Volcán — Instalador y User-Data Frontend para AWS EC2 (Ubuntu 22.04 / 24.04 LTS)
# -----------------------------------------------------------------------------
# Uso 1 (Al lanzar la instancia EC2):
#   Pegar este archivo en "Advanced Details -> User data" en AWS EC2.
#   (Opcional: edita las variables de la sección "CONFIGURACIÓN INICIAL" abajo
#    antes de pegarlo en User Data, especialmente BACKEND_UPSTREAM).
#
# Uso 2 (En una instancia EC2 ya creada):
#   sudo BACKEND_UPSTREAM="http://172.31.X.X:8080" bash frontend/scripts/ec2-userdata-setup.sh
#
# Qué configura automáticamente:
#   1. Zona horaria del sistema operativo: America/Santiago
#   2. Memoria SWAP de 2 GB (evita errores OOM en t3.micro durante npm run build)
#   3. Instalación de Node.js 22 LTS, Nginx, Git, Curl, Cron y logrotate
#   4. Clonación del repositorio GitHub (si no existe todavía)
#   5. Archivo de configuración persistente /etc/elvolcan-frontend.env
#   6. Nginx con soporte SPA (React Router) + Proxy inverso /api/v1/ -> Backend EC2
#   7. Servicio systemd (elvolcan-frontend.service) -> auto-arranque al encender EC2
#   8. Cron diario a las 03:00 AM hora Santiago de Chile -> detecta cambios en GitHub
#      y recompila el frontend automáticamente
#   9. (Opcional) Certificado HTTPS automático con Certbot si defines dominio y correo
# =============================================================================

set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

# =============================================================================
# CONFIGURACIÓN INICIAL (Edita estos valores antes de pegar en EC2 User Data)
# =============================================================================
REPO_URL="${ELVOLCAN_REPO_URL:-https://github.com/DamianMercado/ElVolcanDB.git}"
BRANCH="${ELVOLCAN_BRANCH:-main}"

# IP Privada (misma VPC, recomendado) o Pública de la EC2 Backend con puerto 8080
# Ejemplo: BACKEND_UPSTREAM="http://172.31.12.34:8080"
BACKEND_UPSTREAM="${BACKEND_UPSTREAM:-}"

# Dominio del frontend (deja "_" si accederás solo por IP pública de EC2)
# Ejemplo: FRONTEND_DOMAIN="app.elvolcan.cl"
FRONTEND_DOMAIN="${FRONTEND_DOMAIN:-_}"

# URL base que usará Vite al compilar:
#   - "/api/v1" (RECOMENDADO con Proxy Nginx: evita CORS y Mixed Content)
#   - "http://<IP_PUBLICA_BACKEND>:8080/api/v1" (si NO usas proxy inverso)
VITE_API_URL="${VITE_API_URL:-/api/v1}"

# Opcional: clave privada de CARTO Basemaps
VITE_CARTO_API_KEY="${VITE_CARTO_API_KEY:-}"

# Opcional: correo para activar HTTPS automático con Let's Encrypt (requiere FRONTEND_DOMAIN != "_")
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"

# Opcional: activar firewall local UFW además del Security Group de AWS ("true" o "false")
ENABLE_UFW="${ENABLE_UFW:-false}"
# =============================================================================

# Detectar si el script se ejecuta desde dentro de un clon existente (ej: /home/ubuntu/ElVolcanDB)
SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}" 2>/dev/null || echo "")"
if [[ -n "${SCRIPT_PATH}" && "${SCRIPT_PATH}" == *"/frontend/scripts/"* ]]; then
  DEFAULT_REPO_DIR="$(cd "$(dirname "${SCRIPT_PATH}")/../.." && pwd)"
else
  DEFAULT_REPO_DIR="/opt/ElVolcanDB"
fi

REPO_DIR="${ELVOLCAN_REPO_DIR:-${DEFAULT_REPO_DIR}}"
CONFIG_FILE="/etc/elvolcan-frontend.env"
LOG_FILE="/var/log/elvolcan-frontend-autodeploy.log"
FALLBACK_DEPLOY_SCRIPT="/usr/local/bin/elvolcan-frontend-autodeploy.sh"

echo ">>> [1/9] Configurando zona horaria a America/Santiago e instalando utilidades..."
apt-get update -y
apt-get install -y tzdata cron curl git logrotate ca-certificates gnupg nginx ufw
timedatectl set-timezone America/Santiago || ln -sf /usr/share/zoneinfo/America/Santiago /etc/localtime
echo "America/Santiago" > /etc/timezone
export TZ="America/Santiago"
echo "    Hora actual del servidor: $(date '+%Y-%m-%d %H:%M:%S %Z')"

echo ">>> [2/9] Verificando memoria SWAP (2 GB recomendados para t3.micro / Vite build)..."
if ! swapon --show | grep -q "/swapfile"; then
  if [[ ! -f /swapfile ]]; then
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
  fi
  swapon /swapfile
  if ! grep -q "^/swapfile " /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  echo "    SWAP de 2 GB activada."
else
  echo "    SWAP ya se encontraba configurada."
fi

echo ">>> [3/9] Instalando Node.js 22 LTS y habilitando Nginx + Cron..."
NODE_MAJOR="$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/' || echo "0")"
if [[ "${NODE_MAJOR}" -lt 22 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
echo "    Node.js $(node -v) / npm $(npm -v)"
systemctl enable --now nginx
systemctl enable --now cron

if [[ "${ENABLE_UFW}" == "true" ]]; then
  echo ">>>     Configurando firewall UFW (SSH 22, HTTP 80, HTTPS 443)..."
  ufw allow OpenSSH
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
fi

echo ">>> [4/9] Preparando repositorio en ${REPO_DIR}..."
if [[ ! -d "${REPO_DIR}/.git" ]]; then
  mkdir -p "$(dirname "${REPO_DIR}")"
  git clone --branch "${BRANCH}" "${REPO_URL}" "${REPO_DIR}"
  if id "ubuntu" >/dev/null 2>&1; then
    chown -R ubuntu:ubuntu "${REPO_DIR}"
  fi
fi

git config --system --add safe.directory "${REPO_DIR}" >/dev/null 2>&1 || true
git config --system --add safe.directory '*' >/dev/null 2>&1 || true
git config --global --add safe.directory "${REPO_DIR}" >/dev/null 2>&1 || true

# Asegurar permisos de acceso de Nginx (www-data) hasta /dist
chmod o+x "$(dirname "${REPO_DIR}")" "${REPO_DIR}" "${REPO_DIR}/frontend" 2>/dev/null || true

echo ">>> [5/9] Guardando configuración persistente en ${CONFIG_FILE}..."
if [[ ! -f "${CONFIG_FILE}" ]]; then
  cat > "${CONFIG_FILE}" <<EOF
# Configuración Frontend El Volcán en AWS EC2
# Tras editar BACKEND_UPSTREAM o FRONTEND_DOMAIN ejecuta:
#   sudo ${FALLBACK_DEPLOY_SCRIPT} --reload-nginx
# Tras editar VITE_API_URL o VITE_CARTO_API_KEY ejecuta:
#   sudo ${FALLBACK_DEPLOY_SCRIPT} --force

ELVOLCAN_REPO_DIR=${REPO_DIR}
ELVOLCAN_BRANCH=${BRANCH}
BACKEND_UPSTREAM=${BACKEND_UPSTREAM}
FRONTEND_DOMAIN=${FRONTEND_DOMAIN}
VITE_API_URL=${VITE_API_URL}
VITE_CARTO_API_KEY=${VITE_CARTO_API_KEY}
EOF
  chmod 640 "${CONFIG_FILE}"
  echo "    Archivo ${CONFIG_FILE} creado."
else
  echo "    Archivo ${CONFIG_FILE} ya existía (se conserva intacto)."
fi

echo ">>> [6/9] Instalando script de auto-deploy..."
if [[ -f "${REPO_DIR}/frontend/scripts/ec2-autodeploy.sh" ]]; then
  chmod +x "${REPO_DIR}/frontend/scripts/"*.sh
  ln -sf "${REPO_DIR}/frontend/scripts/ec2-autodeploy.sh" "${FALLBACK_DEPLOY_SCRIPT}"
  DEPLOY_SCRIPT="${REPO_DIR}/frontend/scripts/ec2-autodeploy.sh"
else
  # Modo autónomo: permite usar este script en User Data antes de subir ec2-autodeploy.sh a GitHub
  cat > "${FALLBACK_DEPLOY_SCRIPT}" <<'AUTODEPLOY_EOF'
#!/usr/bin/env bash
set -euo pipefail
export TZ="America/Santiago"
export HOME="${HOME:-/root}"
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export GIT_CONFIG_COUNT=1
export GIT_CONFIG_KEY_0="safe.directory"
export GIT_CONFIG_VALUE_0="*"

MODO="${1:---cron}"
CONFIG_FILE="${ELVOLCAN_FRONTEND_CONFIG:-/etc/elvolcan-frontend.env}"
LOG_FILE="${ELVOLCAN_LOG_FILE:-/var/log/elvolcan-frontend-autodeploy.log}"
LOCK_FILE="/var/lock/elvolcan-frontend-autodeploy.lock"
NGINX_SITE="/etc/nginx/sites-available/elvolcan-frontend"
NGINX_ENABLED="/etc/nginx/sites-enabled/elvolcan-frontend"

mkdir -p "$(dirname "${LOG_FILE}")" /var/lock
log() { echo "[$(TZ="America/Santiago" date '+%Y-%m-%d %H:%M:%S %Z')] [elvolcan-frontend:${MODO}] $*" | tee -a "${LOG_FILE}"; }

exec 9>"${LOCK_FILE}"
flock -n 9 || { log "Otra instancia en ejecución. Saliendo."; exit 0; }

if [[ -f "${CONFIG_FILE}" ]]; then
  set -a; source "${CONFIG_FILE}"; set +a
fi

REPO_DIR="${ELVOLCAN_REPO_DIR:-/opt/ElVolcanDB}"
FRONTEND_DIR="${REPO_DIR}/frontend"
BRANCH="${ELVOLCAN_BRANCH:-main}"
BACKEND_UPSTREAM="${BACKEND_UPSTREAM:-}"
BACKEND_UPSTREAM="${BACKEND_UPSTREAM%/}"
FRONTEND_DOMAIN="${FRONTEND_DOMAIN:-_}"
VITE_API_URL="${VITE_API_URL:-/api/v1}"
VITE_CARTO_API_KEY="${VITE_CARTO_API_KEY:-}"

generar_nginx_conf() {
  local proxy_block=""
  if [[ -n "${BACKEND_UPSTREAM}" ]]; then
    proxy_block=$(cat <<EOF
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
  fi
  cat > "${NGINX_SITE}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${FRONTEND_DOMAIN};
    root ${FRONTEND_DIR}/dist;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

${proxy_block}
}
EOF
  rm -f /etc/nginx/sites-enabled/default
  ln -sf "${NGINX_SITE}" "${NGINX_ENABLED}"
  nginx -t >>"${LOG_FILE}" 2>&1
  systemctl reload-or-restart nginx
  log "Nginx configurado y recargado correctamente."
}

if [[ "${MODO}" == "--reload-nginx" ]]; then
  generar_nginx_conf
  exit 0
fi

git_repo() { git -c "safe.directory=*" -C "${REPO_DIR}" "$@"; }
LOCAL_SHA="$(git_repo rev-parse HEAD)"
HAY_CAMBIOS=false
CAMBIOS_FRONTEND=false

if git_repo fetch origin "${BRANCH}" --quiet; then
  REMOTE_SHA="$(git_repo rev-parse "origin/${BRANCH}")"
  if [[ "${LOCAL_SHA}" != "${REMOTE_SHA}" ]]; then
    HAY_CAMBIOS=true
    if git_repo diff --name-only "${LOCAL_SHA}..${REMOTE_SHA}" | grep -q "^frontend/"; then
      CAMBIOS_FRONTEND=true
    fi
    git_repo reset --hard "origin/${BRANCH}" >>"${LOG_FILE}" 2>&1
  fi
fi

if [[ ! -f "${FRONTEND_DIR}/dist/index.html" || "${MODO}" == "--force" || "${CAMBIOS_FRONTEND}" == "true" ]]; then
  cd "${FRONTEND_DIR}"
  printf "VITE_API_URL=%s\n" "${VITE_API_URL}" > "${FRONTEND_DIR}/.env"
  [[ -n "${VITE_CARTO_API_KEY}" ]] && printf "VITE_CARTO_API_KEY=%s\n" "${VITE_CARTO_API_KEY}" >> "${FRONTEND_DIR}/.env"
  npm ci --no-audit --no-fund >>"${LOG_FILE}" 2>&1
  npm run build >>"${LOG_FILE}" 2>&1
  chmod -R a+rX "${FRONTEND_DIR}/dist"
  log "Build completado en ${FRONTEND_DIR}/dist."
fi

generar_nginx_conf
AUTODEPLOY_EOF
  chmod +x "${FALLBACK_DEPLOY_SCRIPT}"
  DEPLOY_SCRIPT="${FALLBACK_DEPLOY_SCRIPT}"
fi
echo "    Script activo: ${DEPLOY_SCRIPT}"

echo ">>> [7/9] Creando servicio systemd (arranque automático al encender EC2)..."
cat > /etc/systemd/system/elvolcan-frontend.service <<EOF
[Unit]
Description=El Volcan Frontend SPA Build & Nginx Auto-Start
Requires=nginx.service
After=nginx.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
Environment=HOME=/root
Environment=TZ=America/Santiago
Environment=ELVOLCAN_REPO_DIR=${REPO_DIR}
Environment=ELVOLCAN_BRANCH=${BRANCH}
Environment=ELVOLCAN_FRONTEND_CONFIG=${CONFIG_FILE}
Environment=ELVOLCAN_LOG_FILE=${LOG_FILE}
WorkingDirectory=${REPO_DIR}/frontend
ExecStart=${DEPLOY_SCRIPT} --boot
TimeoutStartSec=600

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable elvolcan-frontend.service
echo "    Servicio systemd elvolcan-frontend.service habilitado."

echo ">>> [8/9] Configurando Cron (03:00 AM America/Santiago) y logrotate..."
cat > /etc/cron.d/elvolcan-frontend-autodeploy <<EOF
SHELL=/bin/bash
HOME=/root
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
CRON_TZ=America/Santiago
TZ=America/Santiago
ELVOLCAN_REPO_DIR=${REPO_DIR}
ELVOLCAN_BRANCH=${BRANCH}
ELVOLCAN_FRONTEND_CONFIG=${CONFIG_FILE}
ELVOLCAN_LOG_FILE=${LOG_FILE}

# Detecta cambios en GitHub y recompila el frontend a las 03:00 AM hora de Santiago de Chile
0 3 * * * root ${DEPLOY_SCRIPT} --cron
EOF
chmod 644 /etc/cron.d/elvolcan-frontend-autodeploy
systemctl restart cron

cat > /etc/logrotate.d/elvolcan-frontend-autodeploy <<EOF
${LOG_FILE} {
    weekly
    rotate 4
    compress
    missingok
    notifempty
    create 0644 root root
}
EOF
touch "${LOG_FILE}"

echo ">>> [9/9] Ejecutando build inicial y levantando Nginx..."
systemctl start elvolcan-frontend.service

# HTTPS automático con Certbot si el usuario configuró dominio real y correo
if [[ "${FRONTEND_DOMAIN}" != "_" && -n "${CERTBOT_EMAIL}" ]]; then
  echo ">>> Configurando certificado HTTPS Let's Encrypt para ${FRONTEND_DOMAIN}..."
  apt-get install -y certbot python3-certbot-nginx
  certbot --nginx --non-interactive --agree-tos --redirect -m "${CERTBOT_EMAIL}" -d "${FRONTEND_DOMAIN}" || \
    echo "    ADVERTENCIA: Certbot falló (verifica que el DNS tipo A ya apunte a esta EC2 y el puerto 80 esté abierto)."
fi

PUBLIC_IP="$(curl -sf --max-time 3 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "<IP_PUBLICA_EC2>")"

echo ""
echo "==================================================================="
echo " Instalación del Frontend El Volcán finalizada exitosamente."
echo " - Zona horaria:      $(timedatectl show --property=Timezone --value 2>/dev/null || cat /etc/timezone)"
echo " - Repositorio:       ${REPO_DIR}"
echo " - Configuración:     ${CONFIG_FILE}"
echo " - URL Frontend:      http://${PUBLIC_IP}/"
echo " - Upstream Backend:  ${BACKEND_UPSTREAM:-'(SIN CONFIGURAR - editar /etc/elvolcan-frontend.env)'}"
echo " - Auto-arranque EC2: systemctl status elvolcan-frontend.service"
echo " - Auto-update 03:00: /etc/cron.d/elvolcan-frontend-autodeploy"
echo " - Logs:              tail -f ${LOG_FILE}"
echo "==================================================================="

if [[ -z "${BACKEND_UPSTREAM}" && "${VITE_API_URL}" == "/api/v1" ]]; then
  echo ""
  echo ">>> SIGUIENTE PASO IMPORTANTE:"
  echo "    Edita ${CONFIG_FILE} y coloca la IP privada de tu EC2 Backend:"
  echo "      BACKEND_UPSTREAM=http://<IP_PRIVADA_BACKEND>:8080"
  echo "    Luego recarga Nginx sin recompilar:"
  echo "      sudo ${DEPLOY_SCRIPT} --reload-nginx"
fi
