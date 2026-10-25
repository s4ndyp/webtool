#!/usr/bin/env bash
# Webtool: GHCR pull + docker compose (geen git clone / geen build in LXC).

source /dev/stdin <<<"$FUNCTIONS_FILE_PATH"
# shellcheck source=/dev/null
source <(curl -fsSL "${COMMUNITY_SCRIPTS_URL:-https://raw.githubusercontent.com/s4ndyp/scripts/main}/lib/xdio-motd.sh")
color
verb_ip6
catch_errors
setting_up_container
network_check
update_os

# shellcheck source=/dev/null
source <(curl -fsSL "${COMMUNITY_SCRIPTS_URL:-https://raw.githubusercontent.com/s4ndyp/scripts/main}/lib/xdio-compose-install.sh")

COMPOSE_URL="${WEBTOOL_COMPOSE_URL:-https://raw.githubusercontent.com/s4ndyp/webtool/main/docker-compose.yml}"
WEBTOOL_DIR="/opt/webtool"

setup_docker
xdio_ghcr_login

msg_info "Preparing Webtool stack"
mkdir -p "${WEBTOOL_DIR}"
curl -fsSL "${COMPOSE_URL}" -o "${WEBTOOL_DIR}/docker-compose.yml"
xdio_compose_set_host_port "${WEBTOOL_DIR}/docker-compose.yml" "80" "3000"
msg_ok "Prepared Webtool stack"

msg_info "Pulling Webtool images"
cd "${WEBTOOL_DIR}"
if ! $STD docker compose pull; then
  msg_error "Could not pull GHCR images. Make ghcr.io/s4ndyp/webtool public or set GHCR_TOKEN on the Proxmox host."
  exit 1
fi
msg_ok "Pulled Webtool images"

msg_info "Starting Webtool"
$STD docker compose up -d
msg_ok "Started Webtool"

cat <<EOF >~/webtool.creds
Webtool (subsite-portal)
========================
App URL:      http://${LOCAL_IP}
Data volume:  webtool_data (Docker volume, PocketBase + uploads)
Compose:      ${WEBTOOL_DIR}/docker-compose.yml
Image:        ghcr.io/s4ndyp/webtool:latest
EOF

motd_ssh
customize
cleanup_lxc
