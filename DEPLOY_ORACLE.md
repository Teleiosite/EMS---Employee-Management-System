# ============================================================
# Oracle Cloud Deployment Guide for EMS
# ============================================================


## Optional: Auto Deploy on Every GitHub Push (Recommended)

If you want Oracle to update automatically whenever code is pushed to `main`, use the included GitHub Actions workflow:

- Workflow file: `.github/workflows/deploy-oracle.yml`
- Trigger: every push to `main` (and manual run from Actions tab)
- Deploy method: SSH into your Oracle VM and run pull + migrate + build + restart

### 1) Create required GitHub Secrets

In GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

- `ORACLE_VM_HOST` → your VM public IP or DNS
- `ORACLE_VM_USER` → typically `ubuntu`
- `ORACLE_VM_SSH_KEY` → private key content (entire PEM, including BEGIN/END lines)
- `VITE_API_BASE_URL` → e.g. `https://yourems.duckdns.org/api`
- Note: if secrets are missing, the `deploy-oracle` workflow will be skipped until all required secrets are configured.

### 2) Allow passwordless restart commands on VM

The GitHub SSH session needs to restart services without interactive sudo prompts:

```bash
sudo visudo -f /etc/sudoers.d/ems-deploy
```

Add:

```bash
ubuntu ALL=(ALL) NOPASSWD:/bin/systemctl restart ems-gunicorn,/bin/systemctl restart nginx,/bin/cp
```

### 3) First-time VM prep

Run one-time on VM:

```bash
sudo chown -R ubuntu:ubuntu /opt/ems
```

### 4) Deploy automatically

Push to `main` and GitHub Actions will deploy:

```bash
git push origin main
```

You can also trigger it manually from **Actions → deploy-oracle → Run workflow**.

## Step 1: Create an Oracle Cloud Free VM

1. Go to https://cloud.oracle.com and sign up (free, credit card for identity)
2. Click **Create Instance** → Choose "Always Free" eligible shape:
   - Image: **Ubuntu 22.04**
   - Shape: `VM.Standard.E2.1.Micro` (Always Free, 1 GB RAM)
3. Click **Add SSH Keys** → paste your SSH public key (or download the generated one)
4. Click **Create** and wait ~2 minutes for the VM to be provisioned
5. Note your **Public IP address** from the instance details

## Step 2: Open Required Firewall Ports (Important!)

In OCI Console → Instance → **Virtual Cloud Network** → Security Lists → Default Security List:

Add ingress rules for:
| Port | Protocol | Source |
|------|----------|--------|
| 80   | TCP      | 0.0.0.0/0 |
| 443  | TCP      | 0.0.0.0/0 |
| 22   | TCP      | 0.0.0.0/0 |

**Also open ports on Ubuntu firewall (run on the VM after SSH):**
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## Step 3: SSH Into Your VM

```bash
# Replace with YOUR Oracle VM public IP and your SSH key path
ssh -i ~/your_oracle_key.pem ubuntu@YOUR_ORACLE_VM_IP
```

> ⚠️ Security: Never paste private keys into chat, git, or public notes. Keep the `.pem` only on devices you trust.

## Step 4: Run the Deploy Script

```bash
# Download and run the automated deploy script
curl -s https://raw.githubusercontent.com/Teleiosite/EMS---Employee-Management-System/main/deploy.sh | bash
```

Or manually:
```bash
git clone https://github.com/Teleiosite/EMS---Employee-Management-System.git /opt/ems
bash /opt/ems/deploy.sh
```

## Step 5: Configure the Backend .env

```bash
sudo nano /opt/ems/backend/.env
```

Fill in these values:
```env
SECRET_KEY=some_random_50_char_string_here
ALLOWED_HOSTS=YOUR_ORACLE_VM_PUBLIC_IP
CORS_ALLOWED_ORIGINS=http://YOUR_ORACLE_VM_PUBLIC_IP
CSRF_TRUSTED_ORIGINS=http://YOUR_ORACLE_VM_PUBLIC_IP
CELERY_TASK_ALWAYS_EAGER=True
```

**Generate a SECRET_KEY:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

Then restart the backend:
```bash
sudo systemctl restart ems-gunicorn
```

## Step 6: Rebuild Frontend With Production API URL

The React app needs to know where the backend is. Run this on the VM:
```bash
cd /opt/ems
VITE_API_BASE_URL=http://YOUR_ORACLE_VM_PUBLIC_IP/api npm run build
sudo cp -r dist/* /opt/ems/frontend/
sudo systemctl restart nginx
```

## Step 7: Verify Everything Works

Open in your browser: `http://YOUR_ORACLE_VM_PUBLIC_IP`

- Login: `admin@ems.com` / `admin123`

**Check service status:**
```bash
sudo systemctl status ems-gunicorn   # Django backend
sudo systemctl status nginx          # Frontend server
```

**View Logs:**
```bash
sudo journalctl -fu ems-gunicorn     # Backend live logs
sudo tail -f /var/log/nginx/ems_error.log  # Nginx errors
```


## Emergency Fix: Site Not Opening (`ERR_CONNECTION_REFUSED`)

If your browser shows `ERR_CONNECTION_REFUSED`, run this on the VM to recover quickly:

```bash
# 1) Verify services
sudo systemctl status nginx --no-pager
sudo systemctl status ems-gunicorn --no-pager

# 2) Validate nginx config then restart
sudo nginx -t
sudo systemctl restart ems-gunicorn
sudo systemctl restart nginx

# 3) Confirm ports are listening
sudo ss -tulpn | grep -E ':80|:443|:8000' || true

# 4) Read recent logs
sudo journalctl -u ems-gunicorn -n 120 --no-pager
sudo journalctl -u nginx -n 120 --no-pager
sudo tail -n 120 /var/log/nginx/ems_error.log
```

If services are running but site is still unreachable, verify OCI Security List ingress rules for ports `80` and `443`, and confirm the VM public IP has not changed.

## Useful Commands

```bash
# Restart backend after code changes
sudo systemctl restart ems-gunicorn

# Rebuild and redeploy frontend
cd /opt/ems && git pull
# If git pull fails with ".git/FETCH_HEAD: Permission denied"
sudo chown -R ubuntu:ubuntu /opt/ems
cd /opt/ems && git pull origin main
VITE_API_BASE_URL=http://YOUR_ORACLE_VM_PUBLIC_IP/api npm run build
sudo cp -r dist/* /opt/ems/frontend/

# Run Django management commands
cd /opt/ems/backend
source venv/bin/activate
DJANGO_SETTINGS_MODULE=ems_core.settings.production python manage.py <command>
```

## Demo Credentials (after deploy)

| Portal | Email | Password |
|--------|-------|----------|
| Admin | admin@ems.com | admin123 |
| Employee | john.doe@ems.com | 123 |
| Applicant | Sign up from the app | — |
