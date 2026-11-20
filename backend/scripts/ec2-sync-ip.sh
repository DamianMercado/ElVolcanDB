#!/usr/bin/env bash
# =============================================================================
# El Volcán — Detección y Sincronización Automática de IP Pública de AWS EC2
# -----------------------------------------------------------------------------
# Cuando AWS Academy apaga y vuelve a encender el laboratorio, la instancia EC2
# recibe una nueva IP pública. Este script:
#   1. Detecta la IP pública real desde EC2 Metadata (IMDSv2) con respaldo HTTP.
#   2. Compara contra la última IP sincronizada (/var/lib/elvolcan/last_public_ip).
#   3. Si cambió (o si se pasa --force):
#      - Actualiza automáticamente VITE_API_URL en Render (Render REST API) y
#        dispara el redespliegue del Static Site sin tocar VITE_CARTO_API_KEY.
#      - Opcionalmente actualiza DuckDNS si se configuraron DUCKDNS_DOMAIN/TOKEN.
#
# Modos de uso:
#   ./ec2-sync-ip.sh          -> Sincroniza solo si la IP pública cambió
#   ./ec2-sync-ip.sh --force  -> Fuerza actualización aunque la IP no haya cambiado
# =============================================================================

set -euo pipefail

export TZ="America/Santiago"
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

MODO="${1:-auto}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="${ELVOLCAN_REPO_DIR:-$(cd "${SCRIPT_DIR}/../.." && pwd)}"
ENV_FILE="${ELVOLCAN_ENV_FILE:-${REPO_DIR}/backend/.env}"
LOG_FILE="${ELVOLCAN_LOG_FILE:-/var/log/elvolcan-autodeploy.log}"
STATE_DIR="/var/lib/elvolcan"
STATE_FILE="${STATE_DIR}/last_public_ip"

mkdir -p "$(dirname "${LOG_FILE}")" "${STATE_DIR}"

log() {
  local ts
  ts="$(TZ="America/Santiago" date '+%Y-%m-%d %H:%M:%S %Z')"
  echo "[${ts}] [elvolcan-sync-ip] $*" | tee -a "${LOG_FILE}"
}

es_ipv4_valida() {
  local ip="$1"
  if [[ ! "${ip}" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
    return 1
  fi
  local IFS='.'
  read -r o1 o2 o3 o4 <<< "${ip}"
  (( o1 <= 255 && o2 <= 255 && o3 <= 255 && o4 <= 255 ))
}

# Lectura segura de clave desde backend/.env sin usar 'source' (evita problemas con '&' o '$' en MONGO_URI)
leer_env_var() {
  local clave="$1"
  local actual="${!clave:-}"
  if [[ -n "${actual}" ]]; then
    echo "${actual}"
    return 0
  fi

  if [[ ! -f "${ENV_FILE}" ]]; then
    echo ""
    return 0
  fi

  local linea valor
  linea="$(grep -E "^[[:space:]]*${clave}[[:space:]]*=" "${ENV_FILE}" | tail -n 1 || true)"
  if [[ -z "${linea}" ]]; then
    echo ""
    return 0
  fi

  valor="${linea#*=}"
  # Eliminar retorno de carro Windows (\r), espacios en extremos y comillas simples/dobles envolventes
  valor="${valor//$'\r'/}"
  valor="$(echo "${valor}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  if [[ "${valor}" =~ ^\"(.*)\"$ ]]; then
    valor="${BASH_REMATCH[1]}"
  elif [[ "${valor}" =~ ^\'(.*)\'$ ]]; then
    valor="${BASH_REMATCH[1]}"
  fi
  echo "${valor}"
}

detectar_ip_publica() {
  local ip=""
  local token=""

  # 1. AWS EC2 Instance Metadata Service v2 (IMDSv2 - método oficial en AWS EC2)
  token="$(curl -sf --max-time 3 -X PUT "http://169.254.169.254/latest/api/token" \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 60" 2>/dev/null || true)"
  if [[ -n "${token}" ]]; then
    ip="$(curl -sf --max-time 3 -H "X-aws-ec2-metadata-token: ${token}" \
      "http://169.254.169.254/latest/meta-data/public-ipv4" 2>/dev/null | tr -d '[:space:]' || true)"
    if es_ipv4_valida "${ip}"; then
      echo "${ip}"
      return 0
    fi
  fi

  # 2. Respaldo IMDSv1
  ip="$(curl -sf --max-time 3 "http://169.254.169.254/latest/meta-data/public-ipv4" 2>/dev/null | tr -d '[:space:]' || true)"
  if es_ipv4_valida "${ip}"; then
    echo "${ip}"
    return 0
  fi

  # 3. Respaldo externo oficial de AWS y ipify
  for url in "https://checkip.amazonaws.com" "https://api.ipify.org"; do
    ip="$(curl -sf --max-time 5 "${url}" 2>/dev/null | tr -d '[:space:]' || true)"
    if es_ipv4_valida "${ip}"; then
      echo "${ip}"
      return 0
    fi
  done

  return 1
}

construir_api_url() {
  local ip="$1"
  local scheme="$2"
  local port="$3"
  local path="$4"

  # Asegurar que path comience con '/' si no está vacío y sin '/' al final
  if [[ -n "${path}" && "${path}" != /* ]]; then
    path="/${path}"
  fi
  path="${path%/}"

  if [[ -z "${port}" || ( "${scheme}" == "http" && "${port}" == "80" ) || ( "${scheme}" == "https" && "${port}" == "443" ) ]]; then
    echo "${scheme}://${ip}${path}"
  else
    echo "${scheme}://${ip}:${port}${path}"
  fi
}

sincronizar_render() {
  local api_key="$1"
  local service_id="$2"
  local env_key="$3"
  local nueva_url="$4"

  local intento http_code body_file
  body_file="$(mktemp)"
  trap 'rm -f "${body_file}"' RETURN

  for intento in $(seq 1 5); do
    log "Render API: actualizando ${env_key}=${nueva_url} en servicio ${service_id} (intento ${intento}/5)..."
    http_code="$(curl -sS --max-time 20 -o "${body_file}" -w "%{http_code}" \
      -X PUT "https://api.render.com/v1/services/${service_id}/env-vars/${env_key}" \
      -H "Authorization: Bearer ${api_key}" \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      -d "{\"value\":\"${nueva_url}\"}" || echo "000")"

    if [[ "${http_code}" == "200" || "${http_code}" == "201" ]]; then
      log "Render API: variable ${env_key} actualizada correctamente (HTTP ${http_code})."
      break
    fi

    log "ADVERTENCIA: Render devolvió HTTP ${http_code} al actualizar ${env_key}: $(head -c 240 "${body_file}")"
    if [[ "${intento}" -eq 5 ]]; then
      return 1
    fi
    sleep $((intento * 3))
  done

  # Disparar redespliegue del Static Site para que Vite tome la nueva VITE_API_URL
  for intento in $(seq 1 5); do
    log "Render API: solicitando nuevo deploy del frontend en ${service_id} (intento ${intento}/5)..."
    http_code="$(curl -sS --max-time 20 -o "${body_file}" -w "%{http_code}" \
      -X POST "https://api.render.com/v1/services/${service_id}/deploys" \
      -H "Authorization: Bearer ${api_key}" \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      -d '{"clearCache":"do_not_clear"}' || echo "000")"

    if [[ "${http_code}" == "200" || "${http_code}" == "201" || "${http_code}" == "202" ]]; then
      log "Render API: redespliegue del frontend disparado correctamente (HTTP ${http_code})."
      return 0
    fi

    log "ADVERTENCIA: Render devolvió HTTP ${http_code} al disparar deploy: $(head -c 240 "${body_file}")"
    if [[ "${intento}" -eq 5 ]]; then
      return 1
    fi
    sleep $((intento * 3))
  done

  return 1
}

sincronizar_duckdns() {
  local domain="$1"
  local token="$2"
  local ip="$3"
  local respuesta intento

  # Permitir tanto "elvolcan-api" como "elvolcan-api.duckdns.org"
  domain="${domain%.duckdns.org}"

  for intento in $(seq 1 5); do
    log "DuckDNS: actualizando ${domain}.duckdns.org -> ${ip} (intento ${intento}/5)..."
    respuesta="$(curl -sS --max-time 15 \
      "https://www.duckdns.org/update?domains=${domain}&token=${token}&ip=${ip}" || echo "ERR")"

    if [[ "${respuesta}" == "OK" ]]; then
      log "DuckDNS: dominio ${domain}.duckdns.org actualizado correctamente a ${ip}."
      return 0
    fi

    log "ADVERTENCIA: DuckDNS respondió '${respuesta}'."
    if [[ "${intento}" -eq 5 ]]; then
      return 1
    fi
    sleep $((intento * 3))
  done

  return 1
}

# 1. Detectar IP pública actual (con espera breve si la red recién levanta al iniciar EC2)
IP_ACTUAL=""
for intento in $(seq 1 10); do
  if IP_ACTUAL="$(detectar_ip_publica)"; then
    break
  fi
  log "Esperando detección de IP pública de EC2 (${intento}/10)..."
  sleep 3
done

if [[ -z "${IP_ACTUAL}" ]]; then
  log "ERROR: No se pudo detectar la IP pública IPv4 de la instancia EC2."
  exit 1
fi

IP_ANTERIOR=""
if [[ -f "${STATE_FILE}" ]]; then
  IP_ANTERIOR="$(tr -d '[:space:]' < "${STATE_FILE}" || true)"
fi

log "IP pública actual de EC2: ${IP_ACTUAL} (última sincronizada: ${IP_ANTERIOR:-ninguna})"

# 2. Leer credenciales de sincronización desde backend/.env
RENDER_API_KEY="$(leer_env_var "RENDER_API_KEY")"
RENDER_SERVICE_ID="$(leer_env_var "RENDER_SERVICE_ID")"
RENDER_API_ENV_KEY="$(leer_env_var "RENDER_API_ENV_KEY")"
RENDER_API_ENV_KEY="${RENDER_API_ENV_KEY:-VITE_API_URL}"

PUBLIC_API_SCHEME="$(leer_env_var "PUBLIC_API_SCHEME")"
PUBLIC_API_SCHEME="${PUBLIC_API_SCHEME:-http}"
PUBLIC_API_PORT="$(leer_env_var "PUBLIC_API_PORT")"
PUBLIC_API_PORT="${PUBLIC_API_PORT:-8080}"
PUBLIC_API_PATH="$(leer_env_var "PUBLIC_API_PATH")"
PUBLIC_API_PATH="${PUBLIC_API_PATH:-/api/v1}"

DUCKDNS_DOMAIN="$(leer_env_var "DUCKDNS_DOMAIN")"
DUCKDNS_TOKEN="$(leer_env_var "DUCKDNS_TOKEN")"

TIENE_RENDER=false
TIENE_DUCKDNS=false

if [[ -n "${RENDER_API_KEY}" && -n "${RENDER_SERVICE_ID}" ]]; then
  TIENE_RENDER=true
fi
if [[ -n "${DUCKDNS_DOMAIN}" && -n "${DUCKDNS_TOKEN}" ]]; then
  TIENE_DUCKDNS=true
fi

if [[ "${TIENE_RENDER}" == "false" && "${TIENE_DUCKDNS}" == "false" ]]; then
  log "Sincronización remota desactivada (agrega RENDER_API_KEY + RENDER_SERVICE_ID o DUCKDNS_DOMAIN + DUCKDNS_TOKEN en backend/.env para habilitarla)."
  exit 0
fi

if [[ "${IP_ACTUAL}" == "${IP_ANTERIOR}" && "${MODO}" != "--force" ]]; then
  log "La IP pública de EC2 no cambió (${IP_ACTUAL}). No se requiere actualizar Render ni DuckDNS."
  exit 0
fi

# 3. Ejecutar sincronizaciones configuradas
TODO_OK=true

if [[ "${TIENE_DUCKDNS}" == "true" ]]; then
  if ! sincronizar_duckdns "${DUCKDNS_DOMAIN}" "${DUCKDNS_TOKEN}" "${IP_ACTUAL}"; then
    TODO_OK=false
  fi
fi

if [[ "${TIENE_RENDER}" == "true" ]]; then
  NUEVA_API_URL="$(construir_api_url "${IP_ACTUAL}" "${PUBLIC_API_SCHEME}" "${PUBLIC_API_PORT}" "${PUBLIC_API_PATH}")"
  if ! sincronizar_render "${RENDER_API_KEY}" "${RENDER_SERVICE_ID}" "${RENDER_API_ENV_KEY}" "${NUEVA_API_URL}"; then
    TODO_OK=false
  fi
fi

if [[ "${TODO_OK}" == "true" ]]; then
  echo "${IP_ACTUAL}" > "${STATE_FILE}"
  log "Sincronización automática de IP pública completada y guardada en ${STATE_FILE}."
  exit 0
else
  log "ADVERTENCIA: Una o más sincronizaciones fallaron. No se actualizará ${STATE_FILE} para reintentar automáticamente."
  exit 1
fi
