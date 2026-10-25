#!/usr/bin/env bash
# Webtool: clone + docker compose build (geen GHCR / geen pull-only image).

source /dev/stdin <<<"$FUNCTIONS_FILE_PATH"
# shellcheck source=/dev/null
source <(curl -fsSL "${COMMUNITY_SCRIPTS_URL:-https://raw.githubusercontent.com/s4ndyp/scripts/main}/lib/xdio-motd.sh")
color
verb_ip6
catch_errors
setting_up_container
network_check
update_os

WEBTOOL_DIR="/opt/webtool"
WEBTOOL_REPO="${WEBTOOL_REPO_URL:-https://github.com/s4ndyp/webtool.git}"
WEBTOOL_BRANCH="${WEBTOOL_BRANCH:-main}"

setup_docker

msg_info "Installing git"
$STD apt install -y git
msg_ok "Installed git"

msg_info "Cloning Webtool (${WEBTOOL_BRANCH})"
rm -rf "${WEBTOOL_DIR}"
$STD git clone --depth 1 --branch "${WEBTOOL_BRANCH}" "${WEBTOOL_REPO}" "${WEBTOOL_DIR}"
msg_ok "Cloned Webtool"

msg_info "Configuring Webtool (poort 80 op LXC)"
cat >"${WEBTOOL_DIR}/.env" <<EOF
WEBTOOL_PORT=80
EOF
msg_ok "Configured Webtool"

msg_info "Building Webtool Docker image (Patience)"
cd "${WEBTOOL_DIR}"
if ! $STD docker compose build; then
  msg_error "Docker build failed. Check disk/RAM in the LXC (default: 2 CPU, 2 GB RAM, 10 GB disk)."
  exit 1
fi
msg_ok "Built Webtool image"

msg_info "Starting Webtool"
$STD docker compose up -d
msg_ok "Started Webtool"

cat <<EOF >~/webtool.creds
Webtool (subsite-portal)
========================
App URL:      http://${LOCAL_IP}
Data volume:  webtool_data (Docker volume, PocketBase + uploads)
Source:       ${WEBTOOL_DIR} (${WEBTOOL_BRANCH})
Compose:      ${WEBTOOL_DIR}/docker-compose.yml
EOF

motd_ssh
customize
cleanup_lxc
