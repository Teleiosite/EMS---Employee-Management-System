def audit_action(action_name: str):
    def wrapper(func):
        func.audit_action = action_name
        return func
    return wrapper
