from decimal import Decimal


def calculate_payroll(component_rows):
    earnings = Decimal('0')
    deductions = Decimal('0')
    for row in component_rows:
        if row.component.component_type == 'EARNING':
            earnings += row.value
        else:
            deductions += row.value
    return {'gross': earnings, 'deductions': deductions, 'net': earnings - deductions}
