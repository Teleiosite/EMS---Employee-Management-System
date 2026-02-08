def mask_email(email: str) -> str:
    user, domain = email.split('@')
    return f"{user[:2]}***@{domain}"
