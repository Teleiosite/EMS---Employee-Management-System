def resolve_client_ip(request):
    # SECURITY: Do NOT trust HTTP_X_FORWARDED_FOR — it is client-controlled and spoofable.
    # Use REMOTE_ADDR only. Nginx/load-balancer sets this to the real client IP.
    return request.META.get('REMOTE_ADDR', '0.0.0.0')
