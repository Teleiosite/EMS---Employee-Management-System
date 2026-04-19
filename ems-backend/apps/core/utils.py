def chunked(seq, size):
    for i in range(0, len(seq), size):
        yield seq[i : i + size]

from .tenancy import resolve_tenant

def increment_feature_usage(request, feature_key):
    """
    Increments the usage count for a specific feature for the current tenant.
    Only increments if the tenant is on a tier that requires a trial count.
    """
    tenant = resolve_tenant(request)
    if not tenant:
        return
    
    # We only track usage if they are NOT on the tier that unlocks it fully
    business_features = {'payroll_runs', 'ai_resumes'}
    enterprise_features = {'workforce_analytics', 'audit_logs'}
    
    tier = tenant.subscription_tier
    should_increment = False
    
    if feature_key in business_features and tier in {'FREE', 'STARTER'}:
        should_increment = True
    elif feature_key in enterprise_features and tier in {'FREE', 'STARTER', 'BUSINESS'}:
        should_increment = True
        
    if should_increment:
        usage = tenant.feature_usage or {}
        usage[feature_key] = usage.get(feature_key, 0) + 1
        tenant.feature_usage = usage
        tenant.save(update_fields=['feature_usage'])
