#!/usr/bin/env bash
# =============================================================================
# El Volcán — Instalador y User-Data para AWS EC2 (Ubuntu 22.04 / 24.04 LTS)
# -----------------------------------------------------------------------------
# Uso 1 (Al lanzar la instancia EC2):
#   Pegar este archivo en "Advanced Details -> User data" en AWS EC2.
#
# Uso 2 (En una instancia EC2 ya creada):
#   sudo bash backend/scripts/ec2-userdata-setup.sh
#
# Qué configura automáticamente:
#   1. Zona horaria del sistema operativo: America/Santiago
#   2. Memoria SWAP de 4 GB (vital en t3.medium para compilar 8 servicios Java)
#   3. Instalación de Docker, Docker Compose v2, Git, Curl, Cron y tzdata
#   4. Clonación del repositorio GitHub (si no existe todavía)
#   5. Servicio systemd (elvolcan-docker.service) -> inicia Docker solo al prender EC2
#      y sincroniza automáticamente la nueva IP pública de EC2 con Render y/o DuckDNS
#   6. Cron diario a las 03:00 AM hora Santiago de Chile -> detecta cambios en GitHub
#      y actualiza clon + reconstruye contenedores automáticamente
#   7. Rotación automática de logs (logrotate)
# =============================================================================

set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

REPO_URL="${ELVOLCAN_REPO_URL:-https://github.com/DamianMercado/ElVolcanDB.git}"
BRANCH="${ELVOLCAN_BRANCH:-main}"

# Detectar si el script se ejecuta desde dentro de un clon existente (ej: /home/ubuntu/ElVolcanDB)
SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}" 2>/dev/null || echo "")"
if [[ -n "${SCRIPT_PATH}" && "${SCRIPT_PATH}" == *"/backend/scripts/"* ]]; then
  DEFAULT_REPO_DIR="$(cd "$(dirname "${SCRIPT_PATH}")/../.." && pwd)"
else
  DEFAULT_REPO_DIR="/opt/ElVolcanDB"
fi

REPO_DIR="${ELVOLCAN_REPO_DIR:-${DEFAULT_REPO_DIR}}"
LOG_FILE="/var/log/elvolcan-autodeploy.log"

echo ">>> [1/7] Configurando zona horaria del servidor a America/Santiago..."
apt-get update -y
apt-get install -y tzdata cron curl git logrotate ca-certificates
timedatectl set-timezone America/Santiago || ln -sf /usr/share/zoneinfo/America/Santiago /etc/localtime
echo "America/Santiago" > /etc/timezone
export TZ="America/Santiago"
echo "    Hora actual del servidor: $(date '+%Y-%m-%d %H:%M:%S %Z')"

echo ">>> [2/7] Verificando memoria SWAP (4 GB recomendados para t3.medium)..."
if ! swapon --show | grep -q "/swapfile"; then
  if [[ ! -f /swapfile ]]; then
    fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
    chmod 600 /swapfile
    mkswap /swapfile
  fi
  swapon /swapfile
  if ! grep -q "^/swapfile " /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  echo "    SWAP de 4 GB activada."
else
  echo "    SWAP ya se encontraba configurada."
fi

echo ">>> [3/7] Instalando y habilitando Docker + Docker Compose v2..."
apt-get install -y docker.io docker-compose-v2
systemctl enable --now docker
systemctl enable --now cron

if id "ubuntu" >/dev/null 2>&1; then
  usermod -aG docker ubuntu || true
fi

echo ">>> [4/7] Preparando repositorio en ${REPO_DIR}..."
if [[ ! -d "${REPO_DIR}/.git" ]]; then
  mkdir -p "$(dirname "${REPO_DIR}")"
  git clone --branch "${BRANCH}" "${REPO_URL}" "${REPO_DIR}"
  if id "ubuntu" >/dev/null 2>&1; then
    chown -R ubuntu:ubuntu "${REPO_DIR}"
  fi
fi

git config --system --add safe.directory "${REPO_DIR}" >/dev/null 2>&1 || true
git config --global --add safe.directory "${REPO_DIR}" >/dev/null 2>&1 || true
chmod +x "${REPO_DIR}/backend/scripts/ec2-autodeploy.sh"
chmod +x "${REPO_DIR}/backend/scripts/ec2-sync-ip.sh"
chmod +x "${REPO_DIR}/backend/scripts/ec2-userdata-setup.sh"

# Si se pasaron variables por User Data, crear backend/.env automáticamente si no existe
if [[ ! -f "${REPO_DIR}/backend/.env" && -n "${MONGO_URI:-}" ]]; then
  cat > "${REPO_DIR}/backend/.env" <<EOF
MONGO_URI=${MONGO_URI}
MONGO_DB=${MONGO_DB:-el_volcan_db}
CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:-*}
JWT_SECRET=${JWT_SECRET:-ElVolcanSecretKeyParaAutenticacionMicroserviciosJWT2026Segura123456}
JWT_EXPIRATION=${JWT_EXPIRATION:-86400000}
EUREKA_URL=http://eureka-server:8761/eureka/
TZ=America/Santiago
RENDER_API_KEY=${RENDER_API_KEY:-}
RENDER_SERVICE_ID=${RENDER_SERVICE_ID:-}
RENDER_API_ENV_KEY=${RENDER_API_ENV_KEY:-VITE_API_URL}
PUBLIC_API_SCHEME=${PUBLIC_API_SCHEME:-http}
PUBLIC_API_PORT=${PUBLIC_API_PORT:-8080}
PUBLIC_API_PATH=${PUBLIC_API_PATH:-/api/v1}
DUCKDNS_DOMAIN=${DUCKDNS_DOMAIN:-}
DUCKDNS_TOKEN=${DUCKDNS_TOKEN:-}
EOF
  chmod 600 "${REPO_DIR}/backend/.env"
  echo "    Archivo ${REPO_DIR}/backend/.env creado desde variables de entorno."
fi

echo ">>> [5/7] Creando servicio systemd (arranque automático al encender EC2)..."
cat > /etc/systemd/system/elvolcan-docker.service <<EOF
[Unit]
Description=El Volcan Microservicios Docker Auto-Start & Sync
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
Environment=HOME=/root
Environment=TZ=America/Santiago
Environment=ELVOLCAN_REPO_DIR=${REPO_DIR}
Environment=ELVOLCAN_BRANCH=${BRANCH}
Environment=ELVOLCAN_LOG_FILE=${LOG_FILE}
WorkingDirectory=${REPO_DIR}/backend
ExecStart=${REPO_DIR}/backend/scripts/ec2-autodeploy.sh --boot
ExecStop=/usr/bin/docker compose -f ${REPO_DIR}/backend/docker-compose.yml down
TimeoutStartSec=900

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable elvolcan-docker.service
echo "    Servicio systemd elvolcan-docker.service habilitado."

echo ">>> [6/7] Configurando tarea programada Cron (todos los días a las 03:00 AM America/Santiago)..."
cat > /etc/cron.d/elvolcan-autodeploy <<EOF
SHELL=/bin/bash
HOME=/root
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
CRON_TZ=America/Santiago
TZ=America/Santiago
ELVOLCAN_REPO_DIR=${REPO_DIR}
ELVOLCAN_BRANCH=${BRANCH}
ELVOLCAN_LOG_FILE=${LOG_FILE}

# Detecta cambios en GitHub y actualiza Docker todos los días a las 03:00 AM hora de Santiago de Chile
0 3 * * * root ${REPO_DIR}/backend/scripts/ec2-autodeploy.sh --cron
EOF
chmod 644 /etc/cron.d/elvolcan-autodeploy
systemctl restart cron
echo "    Cron instalado en /etc/cron.d/elvolcan-autodeploy (0 3 * * * America/Santiago)."

echo ">>> [7/7] Configurando rotación de logs..."
cat > /etc/logrotate.d/elvolcan-autodeploy <<EOF
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

echo ""
echo "==================================================================="
echo " Instalación finalizada exitosamente."
echo " - Zona horaria: $(timedatectl show --property=Timezone --value 2>/dev/null || cat /etc/timezone)"
echo " - Repositorio:  ${REPO_DIR}"
echo " - Auto-arranque EC2: systemctl status elvolcan-docker.service"
echo " - Auto-update 03:00 AM Chile: /etc/cron.d/elvolcan-autodeploy"
echo " - Logs: tail -f ${LOG_FILE}"
echo "==================================================================="

if [[ -f "${REPO_DIR}/backend/.env" ]]; then
  echo ">>> Archivo backend/.env detectado. Iniciando microservicios ahora..."
  systemctl start elvolcan-docker.service
else
  echo ">>> SIGUIENTE PASO: Crea ${REPO_DIR}/backend/.env con tu MONGO_URI de Atlas y ejecuta:"
  echo "    sudo systemctl start elvolcan-docker.service"
fi
