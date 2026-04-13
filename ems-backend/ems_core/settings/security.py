from decouple import config

# -----------------------------------------------------------------------
# SSL — default is ON for production Oracle VM.
# Override with SECURE_SSL_REDIRECT=False in your .env for local HTTP dev.
# -----------------------------------------------------------------------
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Cookie security — only set Secure flag when HTTPS is active
JWT_COOKIE_SECURE = SECURE_SSL_REDIRECT   # httpOnly JWT cookie: Secure in prod, not in dev
SESSION_COOKIE_SECURE = SECURE_SSL_REDIRECT
CSRF_COOKIE_SECURE = SECURE_SSL_REDIRECT
CSRF_COOKIE_HTTPONLY = True  # Defense-in-depth against XSS stealing CSRF token

# HSTS — only enable when SSL is active
SECURE_HSTS_SECONDS = 31536000 if SECURE_SSL_REDIRECT else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = SECURE_SSL_REDIRECT
SECURE_HSTS_PRELOAD = SECURE_SSL_REDIRECT
