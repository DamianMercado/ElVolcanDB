#!/usr/bin/env bash
# =============================================================================
# El Volcán — Auto-arranque y Auto-actualización Docker en AWS EC2
# -----------------------------------------------------------------------------
# Modos de uso:
#   ./ec2-autodeploy.sh --boot   -> Ejecutado al iniciar la instancia EC2 (systemd)
#   ./ec2-autodeploy.sh --cron   -> Ejecutado todos los días a las 03:00 AM Chile
#   ./ec2-autodeploy.sh --force  -> Fuerza actualización y rebuild manual
# =============================================================================

set -euo pipefail

export TZ="America/Santiago"
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

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

if [[ ! -f "${BACKEND_DIR}/.env" ]]; then
  log "ADVERTENCIA: No existe ${BACKEND_DIR}/.env. Se usarán valores por defecto (MongoDB local). Crea ${BACKEND_DIR}/.env con tu MONGO_URI de Atlas."
fi

# Permitir operaciones git aunque el servicio corra como root sobre un repo de ubuntu
git config --global --add safe.directory "${REPO_DIR}" >/dev/null 2>&1 || true

cd "${REPO_DIR}"

LOCAL_SHA="$(git rev-parse HEAD)"
HAY_CAMBIOS=false

# 3. Consultar cambios en GitHub
log "Consultando cambios remotos en origin/${BRANCH} (commit local: ${LOCAL_SHA:0:7})..."
if git fetch origin "${BRANCH}" --quiet; then
  REMOTE_SHA="$(git rev-parse "origin/${BRANCH}")"
  if [[ "${LOCAL_SHA}" != "${REMOTE_SHA}" ]]; then
    HAY_CAMBIOS=true
    log "Cambios detectados en GitHub: ${LOCAL_SHA:0:7} -> ${REMOTE_SHA:0:7}"
    git log --oneline "${LOCAL_SHA}..${REMOTE_SHA}" | while IFS= read -r linea; do
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
    git -C "${REPO_DIR}" reset --hard "origin/${BRANCH}" >>"${LOG_FILE}" 2>&1
    chmod +x "${REPO_DIR}"/backend/scripts/*.sh 2>/dev/null || true
  fi

  log "Reconstruyendo y actualizando contenedores Docker..."
  docker compose up --build -d --remove-orphans >>"${LOG_FILE}" 2>&1

  log "Limpiando imágenes Docker huérfanas para preservar espacio en disco..."
  docker image prune -f >>"${LOG_FILE}" 2>&1 || true
else
  # En arranque (--boot) o cron sin cambios, asegurar que todos los contenedores estén arriba
  log "Verificando y asegurando ejecución de todos los contenedores Docker..."
  docker compose up -d --remove-orphans >>"${LOG_FILE}" 2>&1
fi

# 5. Verificación de estado del API Gateway
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
