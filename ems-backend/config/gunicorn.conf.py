import multiprocessing

bind = '127.0.0.1:8000'  # Only accessible via nginx reverse proxy
workers = min(multiprocessing.cpu_count() * 2 + 1, 4)  # Max 4 for free tier
worker_class = 'sync'
worker_connections = 1000
timeout = 120
keepalive = 5
max_requests = 1000
max_requests_jitter = 100

# Logging
accesslog = '/var/log/gunicorn/ems_access.log'
errorlog = '/var/log/gunicorn/ems_error.log'
loglevel = 'info'
capture_output = True
enable_stdio_inheritance = True

# Process naming
proc_name = 'ems_gunicorn'
