# ============================================================
# Oracle Cloud Deployment Guide for EMS
# ============================================================

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

## Useful Commands

```bash
# Restart backend after code changes
sudo systemctl restart ems-gunicorn

# Rebuild and redeploy frontend
cd /opt/ems && git pull
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
