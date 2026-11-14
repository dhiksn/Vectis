#!/usr/bin/env bash
# ==============================================================================
# VPS Control Center - Privileged Systemd Service Helper
# Location: /usr/local/bin/vps-service-helper
# Owner: root:root, Mode: 0750
# ==============================================================================
set -euo pipefail

# 1. Allowed actions strictly whitelist
ACTION="${1:-}"
case "$ACTION" in
    start|stop|restart|status)
        ;;
    *)
        echo "[SECURITY] Invalid action: $ACTION. Allowed: start, stop, restart, status" >&2
        exit 1
        ;;
esac

# 2. Service name validation (alphanumeric, dashes, dots, underscores only)
SERVICE="${2:-}"
if [[ ! "$SERVICE" =~ ^[a-zA-Z0-9_\-\.]+(@[a-zA-Z0-9_\-\.]*)?(\.service)?$ ]]; then
    echo "[SECURITY] Invalid service name pattern: $SERVICE" >&2
    exit 1
fi

# Strip trailing .service for allowlist matching
BASE_SERVICE="${SERVICE%.service}"

# 3. Server-side allowlist
ALLOWLIST_FILE="/etc/vps-control-center/service.allowlist"
DEFAULT_ALLOWLIST=("nginx" "ssh" "sshd" "docker" "cron" "ufw" "mysql" "postgresql" "ollama" "redis" "systemd-journald")

IS_ALLOWED=0

if [[ -f "$ALLOWLIST_FILE" ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
        line="$(echo "$line" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
        [[ -z "$line" || "$line" =~ ^# ]] && continue
        if [[ "$line" == "$BASE_SERVICE" ]]; then
            IS_ALLOWED=1
            break
        fi
    done < "$ALLOWLIST_FILE"
else
    for item in "${DEFAULT_ALLOWLIST[@]}"; do
        if [[ "$item" == "$BASE_SERVICE" ]]; then
            IS_ALLOWED=1
            break
        fi
    done
fi

if [[ $IS_ALLOWED -ne 1 ]]; then
    echo "[SECURITY] Service '$BASE_SERVICE' is not in server allowlist" >&2
    exit 2
fi

# 4. Safe direct invocation of systemctl
exec /bin/systemctl "$ACTION" "${BASE_SERVICE}.service"
