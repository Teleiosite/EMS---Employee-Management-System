import secrets

import pyotp


def mask_email(email: str) -> str:
    user, domain = email.split('@')
    return f"{user[:2]}***@{domain}"


def generate_secure_token() -> str:
    return secrets.token_urlsafe(32)


def generate_mfa_secret() -> str:
    return pyotp.random_base32()


def verify_totp_code(secret: str | None, code: str) -> bool:
    if not secret:
        return False
    return pyotp.TOTP(secret).verify(code, valid_window=1)
