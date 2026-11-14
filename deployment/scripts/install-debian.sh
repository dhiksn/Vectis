#!/usr/bin/env bash
# ==============================================================================
# VPS Control Center - Production Automated Installation for Debian Linux
# Tested on: Debian 11 (Bullseye), Debian 12 (Bookworm)
# Run as root or with sudo
# ==============================================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  VECTIS - DEBIAN INSTALLATION SCRIPT                  ${NC}"
echo -e "${BLUE}======================================================${NC}"

if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}[ERROR] This installation script must be run as root (or via sudo).${NC}" >&2
   exit 1
fi

# Configurable Ports (Port 3000 is avoided by default)
FRONTEND_PORT="${FRONTEND_PORT:-3001}"
AGENT_PORT="${AGENT_PORT:-8000}"

echo -e "Target Configuration:"
echo -e " - Frontend Internal Port: ${GREEN}${FRONTEND_PORT}${NC} (Customizable via FRONTEND_PORT env)"
echo -e " - Backend Agent Port:     ${GREEN}${AGENT_PORT}${NC} (Customizable via AGENT_PORT env)"

INSTALL_DIR="/opt/vps-control-center"
CONFIG_DIR="/etc/vps-control-center"
LOG_DIR="/var/log/vps-control-center"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo -e "\n${BLUE}1. Checking & Installing System Dependencies...${NC}"
apt-get update -y
apt-get install -y \
    python3 \
    python3-venv \
    python3-pip \
    curl \
    git \
    sudo \
    sqlite3 \
    nginx

# Check existing Node.js installation (e.g. Node 22)
if command -v node &> /dev/null; then
    NODE_VERSION="$(node -v)"
    echo -e "${GREEN}Detected existing Node.js: ${NODE_VERSION} (Skipping Node.js installation)${NC}"
else
    echo -e "${YELLOW}Node.js not detected. Installing Node.js 22 LTS from NodeSource...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi

echo -e "\n${BLUE}2. Creating Dedicated vps-agent Linux User...${NC}"
if ! id "vps-agent" &>/dev/null; then
    useradd -r -s /usr/sbin/nologin -d /opt/vps-control-center -m vps-agent
    echo -e "${GREEN}Created system user 'vps-agent'.${NC}"
else
    echo -e "${GREEN}User 'vps-agent' already exists.${NC}"
fi

echo -e "\n${BLUE}3. Creating Required Directories...${NC}"
mkdir -p "${INSTALL_DIR}"
mkdir -p "${CONFIG_DIR}"
mkdir -p "${LOG_DIR}"
chown -R vps-agent:vps-agent "${LOG_DIR}"

echo -e "\n${BLUE}4. Deploying Application Files to ${INSTALL_DIR}...${NC}"
if [[ "${ROOT_DIR}" != "${INSTALL_DIR}" ]]; then
    echo -e "Copying files from ${ROOT_DIR} to ${INSTALL_DIR}..."
    cp -ru "${ROOT_DIR}/agent" "${INSTALL_DIR}/"
    cp -ru "${ROOT_DIR}/frontend" "${INSTALL_DIR}/"
    cp -ru "${ROOT_DIR}/deployment" "${INSTALL_DIR}/"
else
    echo -e "${GREEN}Running directly inside ${INSTALL_DIR}, skipping copy.${NC}"
fi

echo -e "\n${BLUE}5. Setting Up Python Virtual Environment...${NC}"
cd "${INSTALL_DIR}/agent"
if [[ ! -d "venv" ]]; then
    python3 -m venv venv
fi
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

# Link project directory into python site-packages for clean module resolution
SITE_PACKAGES=$(./venv/bin/python3 -c "import site; print(site.getsitepackages()[0])" 2>/dev/null || echo "")
if [[ -n "${SITE_PACKAGES}" && -d "${SITE_PACKAGES}" ]]; then
    echo "${INSTALL_DIR}" > "${SITE_PACKAGES}/vectis.pth"
fi

chown -R vps-agent:vps-agent "${INSTALL_DIR}/agent"

echo -e "\n${BLUE}6. Building Frontend Production Assets (Node.js)...${NC}"
cd "${INSTALL_DIR}/frontend"
npm install --production=false
npm run build

# Standalone assets requirement: copy static and public folders into standalone build
rm -rf .next/standalone/.next/static .next/standalone/public
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/
if [[ -d "public" ]]; then
    cp -r public .next/standalone/
fi
chown -R vps-agent:vps-agent "${INSTALL_DIR}/frontend"

echo -e "\n${BLUE}7. Generating Environment Configuration Files...${NC}"
# Write frontend environment (Custom Port)
cat << EOF > "${CONFIG_DIR}/frontend.env"
NODE_ENV=production
PORT=${FRONTEND_PORT}
HOSTNAME=127.0.0.1
NEXT_PUBLIC_API_URL=http://127.0.0.1:${AGENT_PORT}
EOF
chmod 0640 "${CONFIG_DIR}/frontend.env"
chown root:vps-agent "${CONFIG_DIR}/frontend.env"

# Write agent environment
cat << EOF > "${CONFIG_DIR}/agent.env"
AGENT_HOST=127.0.0.1
AGENT_PORT=${AGENT_PORT}
ALLOWED_ORIGINS=http://localhost:${FRONTEND_PORT},http://127.0.0.1:${FRONTEND_PORT},http://localhost:3000,http://127.0.0.1:3000
DATABASE_PATH=${INSTALL_DIR}/agent/vps_control.db
EOF
chmod 0640 "${CONFIG_DIR}/agent.env"
chown root:vps-agent "${CONFIG_DIR}/agent.env"

echo -e "\n${BLUE}8. Installing Privileged Helper and Sudoers Rule...${NC}"
cp "${INSTALL_DIR}/deployment/scripts/vps-service-helper.sh" /usr/local/bin/vps-service-helper
chmod 0750 /usr/local/bin/vps-service-helper
chown root:vps-agent /usr/local/bin/vps-service-helper

cp "${INSTALL_DIR}/deployment/sudoers/010_vps-control-center" /etc/sudoers.d/010_vps-control-center
chmod 0440 /etc/sudoers.d/010_vps-control-center
chown root:root /etc/sudoers.d/010_vps-control-center

# Copy initial allowlist if not already present
if [[ ! -f "${CONFIG_DIR}/service.allowlist" ]]; then
    cat << 'EOF' > "${CONFIG_DIR}/service.allowlist"
# VPS Control Center - Permitted Systemd Services
# Add service names one per line (without .service extension)
nginx
ssh
sshd
docker
cron
ufw
mysql
postgresql
ollama
redis
systemd-journald
EOF
    chmod 0644 "${CONFIG_DIR}/service.allowlist"
    chown root:vps-agent "${CONFIG_DIR}/service.allowlist"
fi

echo -e "\n${BLUE}9. Installing & Starting Systemd Services...${NC}"
cp "${INSTALL_DIR}/deployment/systemd/vps-agent.service" /etc/systemd/system/
cp "${INSTALL_DIR}/deployment/systemd/vps-frontend.service" /etc/systemd/system/

if [[ "${AGENT_PORT}" != "8000" ]]; then
    sed -i "s|--port 8000|--port ${AGENT_PORT}|g" /etc/systemd/system/vps-agent.service
fi

systemctl daemon-reload
systemctl enable vps-agent.service
systemctl enable vps-frontend.service

systemctl restart vps-agent.service
systemctl restart vps-frontend.service

echo -e "\n${BLUE}10. Configuring Nginx Reverse Proxy...${NC}"
if [[ -d "/etc/nginx/sites-available" ]]; then
    # Generate configured Nginx conf with active ports
    sed \
        -e "s|http://127.0.0.1:300[01]|http://127.0.0.1:${FRONTEND_PORT}|g" \
        -e "s|http://127.0.0.1:8000|http://127.0.0.1:${AGENT_PORT}|g" \
        "${INSTALL_DIR}/deployment/nginx/vps-control-center.conf" > /etc/nginx/sites-available/vps-control-center.conf

    if [[ ! -f "/etc/nginx/sites-enabled/vps-control-center.conf" ]]; then
        ln -s /etc/nginx/sites-available/vps-control-center.conf /etc/nginx/sites-enabled/
    fi
    nginx -t && systemctl reload nginx || echo -e "${YELLOW}[WARNING] Nginx reload skipped. Check /etc/nginx/sites-available/vps-control-center.conf${NC}"
fi

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}  INSTALLATION COMPLETE!                              ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "Frontend Service:  systemctl status vps-frontend (Port ${FRONTEND_PORT})"
echo -e "Backend Service:   systemctl status vps-agent (Port ${AGENT_PORT})"
echo -e "Web Access:        http://<YOUR_VPS_IP>/ (via Nginx reverse proxy)"
echo -e "Direct Frontend:   http://<YOUR_VPS_IP>:${FRONTEND_PORT}"
echo -e "Default Login:     admin / admin123"
echo -e "Allowlist Config:  ${CONFIG_DIR}/service.allowlist"
echo -e "Environment:       ${CONFIG_DIR}/frontend.env and agent.env"
