#!/bin/bash
# ============================================================
# EMS Deploy Script — Oracle Cloud Ubuntu 22.04
# Run this script on your Oracle VM after SSHing in.
# Usage: bash deploy.sh
# ============================================================

set -e  # Exit on any error

echo "=============================="
echo "  EMS — Oracle Cloud Deploy"
echo "=============================="

EMS_DIR="/opt/ems"
BACKEND_DIR="$EMS_DIR/backend"
FRONTEND_DIR="$EMS_DIR/frontend"
REPO_URL="https://github.com/Teleiosite/EMS---Employee-Management-System.git"
BRANCH="main"

# ─── 1. System Dependencies ───────────────────────────────
if [[ "$1" == "--quick" ]]; then
    echo "[1/8] Skipping system packages (quick mode)..."
else
    echo "[1/8] Installing system packages..."
    sudo apt-get update -y
    sudo apt-get install -y \
        python3 python3-pip python3-venv \
        git curl nodejs npm \
        nginx postgresql postgresql-contrib libpq-dev \
        build-essential
fi

# ─── 2. Clone / Update Repo ───────────────────────────────
echo "[2/8] Cloning/updating repository..."
if [ -d "$EMS_DIR/.git" ]; then
    # Keep repo writable by the deployment user (avoid root-owned .git/FETCH_HEAD errors)
    sudo chown -R "$USER":"$USER" "$EMS_DIR"
    cd "$EMS_DIR"
    git fetch origin "$BRANCH"
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
else
    # Create /opt/ems with deploy-user ownership so future pulls work without sudo
    sudo mkdir -p "$(dirname "$EMS_DIR")"
    sudo chown -R "$USER":"$USER" "$(dirname "$EMS_DIR")"
    git clone "$REPO_URL" "$EMS_DIR"
    cd "$EMS_DIR"
fi

# ─── 3. Backend Setup ─────────────────────────────────────
echo "[3/8] Setting up Django backend..."
sudo mkdir -p "$BACKEND_DIR"
# Copy backend source to deploy dir first (without local venv/cache artifacts)
sudo rsync -a --exclude='venv' --exclude='__pycache__' --exclude='*.pyc' --exclude='*.sqlite3' \
    "$EMS_DIR/ems-backend/" "$BACKEND_DIR/"

# Create virtualenv directly inside deploy dir to avoid broken absolute shebangs
cd "$BACKEND_DIR"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

# ─── 4. Configure Backend ─────────────────────────────────
echo "[4/8] Configuring backend..."
if [ ! -f "$BACKEND_DIR/.env" ]; then
    sudo cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    echo "⚠️  IMPORTANT: Edit /opt/ems/backend/.env and fill in your values!"
    echo "   Especially: SECRET_KEY, ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS"
fi

cd "$BACKEND_DIR"
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=ems_core.settings.production

# Load .env so management commands use the exact same DB settings as systemd/gunicorn
set -a
source "$BACKEND_DIR/.env"
set +a

# Ensure sqlite directory/file exists with writable ownership for gunicorn when sqlite is used
if [[ "${DB_ENGINE:-}" == "django.db.backends.sqlite3" ]] && [[ -n "${DB_NAME:-}" ]]; then
    sudo mkdir -p "$(dirname "$DB_NAME")"
    sudo touch "$DB_NAME"
    sudo chown -R ubuntu:www-data "$(dirname "$DB_NAME")"
    sudo chmod -R 775 "$(dirname "$DB_NAME")"
fi

# Run migrations and collect static
python manage.py migrate --noinput
python manage.py collectstatic --noinput
python manage.py setup_admin 2>/dev/null || true  # Create default admin if command exists

# Fail fast if key auth table does not exist after migrations (prevents runtime JSON parse errors)
python manage.py shell -c "from django.db import connection; tables=connection.introspection.table_names(); assert 'authentication_customuser' in tables, 'authentication_customuser table missing after deploy'"

# ─── 5. Frontend Build ────────────────────────────────────
echo "[5/8] Building React frontend..."
cd "$EMS_DIR"
npm install --legacy-peer-deps
npm run build

# Copy built frontend to serve location
sudo mkdir -p "$FRONTEND_DIR"
sudo cp -r dist/* "$FRONTEND_DIR/"

# ─── 6. Nginx Configuration ───────────────────────────────
echo "[6/8] Configuring Nginx..."
sudo cp "$BACKEND_DIR/config/nginx.conf" /etc/nginx/sites-available/ems
sudo ln -sf /etc/nginx/sites-available/ems /etc/nginx/sites-enabled/ems
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t

# ─── 7. Gunicorn systemd Service ──────────────────────────
echo "[7/8] Installing systemd services..."
sudo mkdir -p /var/log/gunicorn
sudo chown ubuntu:www-data /var/log/gunicorn

sudo cp "$BACKEND_DIR/config/systemd/gunicorn.service" /etc/systemd/system/ems-gunicorn.service
sudo systemctl daemon-reload
sudo systemctl enable ems-gunicorn
sudo systemctl restart ems-gunicorn

# ─── 8. Start Services ────────────────────────────────────
echo "[8/8] Starting services..."
sudo chown -R ubuntu:www-data "$BACKEND_DIR"
sudo chmod -R 775 "$BACKEND_DIR"
sudo systemctl restart nginx
sudo systemctl enable nginx

# Fail fast if web stack is not healthy (prevents silent "success" with ERR_CONNECTION_REFUSED)
sudo systemctl is-active --quiet ems-gunicorn || { echo "❌ ems-gunicorn is not active"; sudo journalctl -u ems-gunicorn -n 80 --no-pager; exit 1; }
sudo systemctl is-active --quiet nginx || { echo "❌ nginx is not active"; sudo journalctl -u nginx -n 80 --no-pager; exit 1; }

echo ""
echo "=============================="
echo "  ✅ EMS Deployed Successfully!"
echo "=============================="
echo ""
echo "Next steps:"
echo " 1. Edit /opt/ems/backend/.env with your real values"
echo " 2. Restart backend: sudo systemctl restart ems-gunicorn"
echo " 3. Open your Oracle VM public IP in the browser"
echo ""
echo "Check logs:"
echo "  Backend: sudo journalctl -fu ems-gunicorn"
echo "  Nginx:   sudo tail -f /var/log/nginx/ems_error.log"
echo "  Quick recovery: /opt/ems/scripts/oracle-recover.sh"
