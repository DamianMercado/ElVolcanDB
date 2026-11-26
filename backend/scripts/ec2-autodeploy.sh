#!/usr/bin/env bash
# =============================================================================
# El Volcán — Auto-arranque y Auto-actualización Docker en AWS EC2
# -----------------------------------------------------------------------------
# Modos de uso:
#   ./ec2-autodeploy.sh --boot     -> Ejecutado al iniciar la instancia EC2 (systemd)
#   ./ec2-autodeploy.sh --cron     -> Ejecutado todos los días a las 03:00 AM Chile
#   ./ec2-autodeploy.sh --force    -> Fuerza actualización, rebuild Docker y sync de IP
#   ./ec2-autodeploy.sh --sync-ip  -> Solo detecta y sincroniza la IP pública con Render/DuckDNS
# =============================================================================

set -euo pipefail

export TZ="America/Santiago"
export HOME="${HOME:-/root}"
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export COMPOSE_PARALLEL_LIMIT="${COMPOSE_PARALLEL_LIMIT:-2}"
export GIT_CONFIG_COUNT=1
export GIT_CONFIG_KEY_0="safe.directory"
export GIT_CONFIG_VALUE_0="*"

MODO="${1:---cron}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="${ELVOLCAN_REPO_DIR:-$(cd "${SCRIPT_DIR}/../.." && pwd)}"
BACKEND_DIR="${REPO_DIR}/backend"
BRANCH="${ELVOLCAN_BRANCH:-main}"
LOG_FILE="${ELVOLCAN_LOG_FILE:-/var/log/elvolcan-autodeploy.log}"
LOCK_FILE="/var/lock/elvolcan-autodeploy.lock"

mkdir -p "$(dirname "${LOG_FILE}")" /var/lock

log() {
  local ts
  ts="$(TZ="America/Santiago" date '+%Y-%m-%d %H:%M:%S %Z')"
  echo "[${ts}] [elvolcan-autodeploy:${MODO}] $*" | tee -a "${LOG_FILE}"
}

# Evitar ejecuciones simultáneas (ej: reinicio justo a las 03:00 AM)
exec 9>"${LOCK_FILE}"
if ! flock -n 9; then
  log "Otra instancia de autodeploy ya está en ejecución. Saliendo sin conflicto."
  exit 0
fi

log "==================================================================="
log "Iniciando proceso en ${REPO_DIR} (rama: ${BRANCH})"

if [[ "${MODO}" == "--sync-ip" ]]; then
  if [[ -f "${SCRIPT_DIR}/ec2-sync-ip.sh" ]]; then
    ELVOLCAN_REPO_DIR="${REPO_DIR}" ELVOLCAN_LOG_FILE="${LOG_FILE}" bash "${SCRIPT_DIR}/ec2-sync-ip.sh" --force
  else
    log "ERROR: No se encontró ${SCRIPT_DIR}/ec2-sync-ip.sh"
    exit 1
  fi
  exit 0
fi

# 1. Asegurar que el demonio de Docker esté activo
if ! systemctl is-active --quiet docker; then
  log "Docker no está activo. Iniciando servicio docker..."
  systemctl start docker
fi

for i in $(seq 1 30); do
  if docker info >/dev/null 2>&1; then
    break
  fi
  log "Esperando disponibilidad del daemon de Docker (${i}/30)..."
  sleep 2
done

if ! docker info >/dev/null 2>&1; then
  log "ERROR: Docker no respondió tras esperar 60 segundos."
  exit 1
fi

# 2. Verificar existencia de repositorio y backend
if [[ ! -d "${REPO_DIR}/.git" ]]; then
  log "ERROR: No se encontró un repositorio Git válido en ${REPO_DIR}."
  exit 1
fi

if [[ ! -f "${BACKEND_DIR}/docker-compose.yml" ]]; then
  log "ERROR: No se encontró ${BACKEND_DIR}/docker-compose.yml."
  exit 1
fi

if [[ ! -f "${BACKEND_DIR}/.env" && -z "${MONGO_URI:-}" ]]; then
  log "ERROR: No existe ${BACKEND_DIR}/.env ni la variable MONGO_URI. Crea ${BACKEND_DIR}/.env con tu MONGO_URI de MongoDB Atlas."
  exit 1
fi

# Permitir operaciones git aunque el servicio corra como root (systemd/cron) sobre un repo de ubuntu
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

cd "${REPO_DIR}"

LOCAL_SHA="$(git_repo rev-parse HEAD)"
HAY_CAMBIOS=false

# 3. Consultar cambios en GitHub
log "Consultando cambios remotos en origin/${BRANCH} (commit local: ${LOCAL_SHA:0:7})..."
if git_repo fetch origin "${BRANCH}" --quiet; then
  REMOTE_SHA="$(git_repo rev-parse "origin/${BRANCH}")"
  if [[ "${LOCAL_SHA}" != "${REMOTE_SHA}" ]]; then
    HAY_CAMBIOS=true
    log "Cambios detectados en GitHub: ${LOCAL_SHA:0:7} -> ${REMOTE_SHA:0:7}"
    git_repo log --oneline "${LOCAL_SHA}..${REMOTE_SHA}" | while IFS= read -r linea; do
      log "  + ${linea}"
    done
  else
    log "Repositorio actualizado. Sin cambios nuevos en origin/${BRANCH} (${LOCAL_SHA:0:7})."
  fi
else
  log "ADVERTENCIA: No se pudo consultar GitHub (posible sin conexión momentánea). Se continúa con la versión local."
fi

# 4. Aplicar cambios y reconstruir / levantar Docker Compose
cd "${BACKEND_DIR}"

if [[ "${HAY_CAMBIOS}" == "true" || "${MODO}" == "--force" ]]; then
  if [[ "${HAY_CAMBIOS}" == "true" ]]; then
    log "Actualizando clon local a origin/${BRANCH} (manteniendo backend/.env intacto)..."
    git_repo reset --hard "origin/${BRANCH}" >>"${LOG_FILE}" 2>&1
    chmod +x "${REPO_DIR}"/backend/scripts/*.sh 2>/dev/null || true
  fi

  restaurar_dueno_repo
  log "Reconstruyendo y actualizando contenedores Docker (sigue el progreso en vivo con: tail -f ${LOG_FILE})..."
  docker compose up --build -d --remove-orphans >>"${LOG_FILE}" 2>&1

  log "Limpiando imágenes Docker huérfanas para preservar espacio en disco..."
  docker image prune -f >>"${LOG_FILE}" 2>&1 || true
else
  restaurar_dueno_repo
  # En arranque (--boot) o cron sin cambios, asegurar que todos los contenedores estén arriba
  log "Verificando y asegurando ejecución de todos los contenedores Docker..."
  docker compose up -d --remove-orphans >>"${LOG_FILE}" 2>&1
fi

# 5. Sincronizar IP pública dinámica de AWS EC2 con Render y/o DuckDNS (en paralelo mientras levanta Spring Boot)
if [[ -f "${SCRIPT_DIR}/ec2-sync-ip.sh" ]]; then
  SYNC_ARG="auto"
  if [[ "${MODO}" == "--force" ]]; then
    SYNC_ARG="--force"
  fi
  if ! ELVOLCAN_REPO_DIR="${REPO_DIR}" ELVOLCAN_LOG_FILE="${LOG_FILE}" bash "${SCRIPT_DIR}/ec2-sync-ip.sh" "${SYNC_ARG}"; then
    log "ADVERTENCIA: La sincronización automática de IP pública reportó un problema (los contenedores Docker siguen operando normalmente)."
  fi
fi

# 6. Verificación de estado del API Gateway
log "Verificando salud del API Gateway en http://localhost:8080/actuator/health..."
GATEWAY_OK=false
for intento in $(seq 1 24); do
  if curl -sf "http://localhost:8080/actuator/health" >/dev/null 2>&1; then
    GATEWAY_OK=true
    log "API Gateway respondió UP correctamente (intento ${intento}/24)."
    break
  fi
  sleep 5
done

if [[ "${GATEWAY_OK}" != "true" ]]; then
  log "AVISO: El API Gateway aún está iniciando o esperando registro en Eureka. Estado actual de contenedores:"
fi

docker compose ps | while IFS= read -r linea; do
  log "  ${linea}"
done

log "Proceso finalizado correctamente."
log "==================================================================="
