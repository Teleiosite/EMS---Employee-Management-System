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
echo "[1/8] Installing system packages..."
sudo apt-get update -y
sudo apt-get install -y \
    python3 python3-pip python3-venv \
    git curl nodejs npm \
    nginx postgresql postgresql-contrib libpq-dev \
    build-essential

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
cd "$EMS_DIR/ems-backend"

# Create virtualenv
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

# Copy to deploy dir
sudo rsync -a --exclude='venv' --exclude='__pycache__' --exclude='*.pyc' \
    "$EMS_DIR/ems-backend/" "$BACKEND_DIR/"

# Copy venv
sudo cp -r venv "$BACKEND_DIR/"

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

# Run migrations and collect static
python manage.py migrate --noinput
python manage.py collectstatic --noinput
python manage.py setup_admin 2>/dev/null || true  # Create default admin if command exists

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
sudo systemctl restart nginx
sudo systemctl enable nginx

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
