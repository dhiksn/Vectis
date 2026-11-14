# Vectis · Cobalt Edition

A high-performance, self-hosted Linux VPS monitoring and management control center. Combines real-time telemetry like Netdata with a modern server management interface built on the **Hallmark Cobalt** design system.

---

## 1. Features & Architecture

### Monitoring & Telemetry
- **Real-Time CPU Monitoring**: Overall usage %, per-core breakdown, physical & logical core count, frequency, live Recharts area chart.
- **Real-Time Memory & Swap**: RAM used, available, total, percentage, swap memory breakdown, live area chart.
- **Storage Subsystem**: Aggregated disk usage %, mounted partitions and filesystems, used/free gauges, error handling for inaccessible mounts.
- **Delta-Calculated Network I/O**: Real-time upload and download transfer speeds (computed from byte counter deltas), cumulative transfer counters (RX/TX), individual network interface status.
- **Host Diagnostics**: Uptime, load averages (1m, 5m, 15m), kernel version, OS release, and architecture.
- **Process Activity**: Live table of running processes with PID, executable name, CPU %, RAM %, memory RSS, threads, and user; search and sorting by CPU, RAM, or name.

### Secure Systemd Management
- **Allowlist Enforcement**: Only server-side allowed services can be controlled (e.g. `nginx`, `ssh`, `docker`, `cron`, `ufw`, `mysql`, `postgresql`, `ollama`, `redis`, etc.).
- **Strict Name Regex**: Validates unit names against `^[a-zA-Z0-9_\-\.]+(@[a-zA-Z0-9_\-\.]*)?(\.service)?$`.
- **Zero Shell Injection**: No `shell=True` execution. Subprocess arguments passed strictly as structured arrays.
- **Non-Root Agent Security**: The agent daemon runs under a dedicated, unprivileged system user (`vps-agent`). Privileged operations invoke `/usr/local/bin/vps-service-helper` via tightly constrained sudoers permissions.
- **Full Audit Logging**: Every service start, stop, and restart attempt is logged with timestamp, user, client IP, action, and outcome into SQLite.
- **Confirmation Safeguards**: UI requires explicit user confirmation dialogs before initiating state changes.

### Hallmark Cobalt Design System
- **Theme**: Cobalt (Genre: `modern-minimal`).
- **Typography**: `Familjen Grotesk` (display, headings, keycaps, and metrics), `IBM Plex Sans` (body), and `JetBrains Mono` (machine values, PIDs, IP addresses, ASCII status canvas).
- **Surfaces & Controls**:
  - Keycap buttons (`.key`, `.key--primary`) featuring a 3px tactile edge (`--shadow-key`, `--shadow-key-accent`), 1px hover lift, and press sink.
  - Cut-corner panels (`.cut`) edged with 1px hairline rules (`oklch(26% 0.015 255)` on dark).
  - Graphite terminal surfaces for code and telemetry data.
  - Text-and-icon status indicators (no filled blob chips).
- **Responsive Layout**: Collapsible sidebar on desktop with quick host stats; slide-out drawer on mobile screens; full PWA support with manifest and icons.

---

## 2. Directory Structure

```
dashboard-server/
├── frontend/                     # Next.js 14 App Router + Tailwind CSS
│   ├── app/                      # Routes: /, /services, /processes, /storage, /network, /system, /settings, /login
│   ├── components/               # Layout, Dashboard, Charts, UI keycaps, Cut cards
│   ├── hooks/                    # useWebSocketMetrics with auto-reconnect
│   ├── lib/                      # API client, formatters, tokens
│   ├── types/                    # TypeScript interfaces
│   └── public/                   # PWA manifest, SVG icons
│
├── agent/                        # FastAPI Python 3.11+ Telemetry Agent
│   ├── app/
│   │   ├── main.py               # FastAPI application & lifespan
│   │   ├── config.py             # Pydantic Settings configuration
│   │   ├── api/                  # REST endpoints: auth, metrics, services, processes, system
│   │   ├── collectors/           # psutil & systemctl collectors (cpu, memory, disk, network, etc.)
│   │   ├── security/             # bcrypt hashing, JWT tokens, allowlist checks
│   │   ├── database/             # aiosqlite rolling metrics & audit log storage
│   │   └── websocket/            # Real-time WebSocket connection manager & broadcast loop
│   ├── tests/                    # Automated unit & security test suite
│   └── requirements.txt
│
├── deployment/                   # Production Debian Deployment Artifacts
│   ├── scripts/
│   │   ├── install-debian.sh     # One-command automated Debian installer
│   │   └── vps-service-helper.sh # Privileged root helper with strict allowlist
│   ├── systemd/
│   │   ├── vps-agent.service     # Systemd service unit for backend agent
│   │   └── vps-frontend.service  # Systemd service unit for frontend Next.js
│   ├── sudoers/
│   │   └── 010_vps-control-center# Sudoers rule allowing helper execution only
│   └── nginx/
│       └── vps-control-center.conf # Nginx reverse proxy with WebSocket upgrade
│
├── .env.example                  # Environment configuration template
├── README.md                     # Documentation
└── docker-compose.yml            # Docker container orchestration
```

---

## 3. Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ (tested on Node 20 / 24)
- npm or pnpm

### Step 1: Run the Backend Agent
```bash
# Navigate to agent folder
cd agent

# Create and activate Python virtual environment
python -m venv venv

# On Linux/macOS:
source venv/bin/activate
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run automated tests
pytest tests/test_agent.py -v

# Start FastAPI agent (Option A - simple launcher):
python run.py

# Or Start with Uvicorn CLI directly (Option B):
python -m uvicorn agent.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Agent Swagger docs are available at `http://127.0.0.1:8000/docs`.

### Step 2: Run the Frontend
In a new terminal window:
```bash
cd frontend

# Install npm dependencies
npm install

# Start Next.js development server
npm run dev
```

Open `http://localhost:3000` in your browser.
- **Default Username**: `admin`
- **Default Password**: `admin123`

---

## 4. Production Deployment on Debian Linux

### Automated Installation (Recommended)
We provide an automated installer script that handles system dependencies, Node 22 compatibility, the `vps-agent` system user, Python virtual environment, production frontend build, systemd services, privileged helper, and Nginx configuration.

By default, the frontend runs on port **3001** to avoid conflicts with existing services running on port 3000:

```bash
# Clone the repository to your VPS
git clone <your-repository-url> /opt/vps-control-center
cd /opt/vps-control-center

# Run installation script with sudo (uses default port 3001)
sudo bash deployment/scripts/install-debian.sh

# Or specify a custom frontend port (e.g. 3050):
# sudo FRONTEND_PORT=3050 bash deployment/scripts/install-debian.sh
```

### Manual Step-by-Step Installation

#### 1. System Dependencies & User
```bash
sudo apt-get update
sudo apt-get install -y python3 python3-venv python3-pip curl git sudo sqlite3 nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# Create non-root system user
sudo useradd -r -s /usr/sbin/nologin -d /opt/vps-control-center -m vps-agent
```

#### 2. Install Backend Agent
```bash
cd /opt/vps-control-center/agent
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt
sudo chown -R vps-agent:vps-agent /opt/vps-control-center/agent
```

#### 3. Build Frontend
```bash
cd /opt/vps-control-center/frontend
npm ci
npm run build
sudo chown -R vps-agent:vps-agent /opt/vps-control-center/frontend
```

#### 4. Configure Privileged Helper & Sudoers
```bash
sudo cp /opt/vps-control-center/deployment/scripts/vps-service-helper.sh /usr/local/bin/vps-service-helper
sudo chmod 0750 /usr/local/bin/vps-service-helper
sudo chown root:vps-agent /usr/local/bin/vps-service-helper

sudo cp /opt/vps-control-center/deployment/sudoers/010_vps-control-center /etc/sudoers.d/010_vps-control-center
sudo chmod 0440 /etc/sudoers.d/010_vps-control-center
sudo chown root:root /etc/sudoers.d/010_vps-control-center
```

#### 5. Configure Systemd Services
```bash
sudo cp /opt/vps-control-center/deployment/systemd/vps-agent.service /etc/systemd/system/
sudo cp /opt/vps-control-center/deployment/systemd/vps-frontend.service /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable --now vps-agent.service
sudo systemctl enable --now vps-frontend.service
```

#### 6. Configure Nginx Reverse Proxy & SSL
```bash
sudo cp /opt/vps-control-center/deployment/nginx/vps-control-center.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/vps-control-center.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Optional: Obtain Free SSL with Certbot
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d vps.yourdomain.com
```

---

## 5. Security & Verification Tests

The test suite thoroughly verifies security boundaries, injection protection, and collector integrity:

```bash
.\agent\venv\Scripts\python -m pytest agent/tests/test_agent.py -v
```

### Verified Test Cases:
1. `test_cpu_collector`: Actual CPU percent, core count, frequency.
2. `test_memory_collector`: Actual RAM usage, used bytes, total bytes, swap memory.
3. `test_disk_collector`: Actual disk usage, partition detection, permission error resilience.
4. `test_network_collector_delta_speed`: Speed calculated from delta bytes per second, non-cumulative.
5. `test_system_collector`: Hostname, OS version, kernel, uptime.
6. `test_service_name_validation`:
   - Validates correct service unit names.
   - **Rejects command injections**: `nginx; rm -rf /`, `nginx && whoami`, `nginx | cat /etc/passwd`, `$(reboot)`.
7. `test_service_allowlist_enforcement`: Only allowed services can be accessed; unlisted daemons fail with 403 Forbidden.
8. `test_service_action_safety`: Restricts actions strictly to `start`, `stop`, `restart`.
9. `test_password_hashing`: Secure bcrypt password verification.
10. `test_login_endpoint`: Issues JWT and HTTP-only cookie.
11. `test_protected_routes_require_auth`: Unauthenticated requests to API return 401 Unauthorized.
12. `test_authorized_requests`: Authenticated requests succeed.
13. `test_api_service_action_enforcement`: Rejects non-allowlisted actions and illegal service formats.
14. `test_websocket_auth`: Rejects unauthorized WebSocket connections, admits authenticated connections.

---

## 6. Resource Performance on Limited VPS (2 vCPU / ~3.8GB RAM)

- **Agent Footprint**: ~35MB RAM, negligible CPU (<0.5%).
- **Database Writes**: Batched snapshots written to SQLite every 9-10 seconds to eliminate disk write bottlenecks.
- **Data Retention**: Rolling vacuum/prune deletes records older than 48 hours automatically.
- **Process Sampling**: Top processes sampled with bounded limits (top 50-60) to prevent kernel context switch overhead.
- **WebSocket Streaming**: Single broadcast loop distributes state to all active connected browsers simultaneously without polling.

---

## 7. Current Limitations & Roadmap

### Current Limitations (v1.0 / Phase 1)
- Managing services outside the server allowlist requires an administrator to update the allowlist in `/etc/vps-control-center/service.allowlist` (by design for security).
- Process termination (killing PIDs) is disabled in v1.0 to prevent accidental administrative outages.

### Roadmap
- **Phase 2 (Advanced Monitoring)**:
  - Extended historical charts (24h / 7d / 30d aggregations).
  - Native Docker container metrics collector & logs viewer.
  - Live systemd journal logs stream for individual services.
- **Phase 3 (Advanced Management)**:
  - Webhook alerts (Telegram, Discord, Slack, Email) on high CPU / low disk space.
  - Multi-server cluster management from a single dashboard.
