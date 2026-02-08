import re


def extract_email(text: str):
    match = re.search(r'([\w.]+@[\w.]+)', text)
    return match.group(1) if match else None
