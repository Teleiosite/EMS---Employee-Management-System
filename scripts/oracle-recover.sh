#!/usr/bin/env bash
set -euo pipefail

echo "== EMS Oracle quick recovery =="

echo "[1/5] Service status"
sudo systemctl status nginx --no-pager || true
sudo systemctl status ems-gunicorn --no-pager || true

echo "[2/5] Validate nginx config"
sudo nginx -t

echo "[3/5] Restart services"
sudo systemctl restart ems-gunicorn
sudo systemctl restart nginx

echo "[4/5] Active checks"
sudo systemctl is-active ems-gunicorn
sudo systemctl is-active nginx

echo "[5/5] Listening ports"
sudo ss -tulpn | grep -E ':80|:443|:8000' || true

echo "Recent logs:"
sudo journalctl -u ems-gunicorn -n 80 --no-pager || true
sudo journalctl -u nginx -n 80 --no-pager || true
