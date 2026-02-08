from decimal import Decimal


def compute_component_amount(base_salary: Decimal, calculation_type: str, value: Decimal) -> Decimal:
    if calculation_type == 'PERCENTAGE':
        return (base_salary * value) / Decimal('100')
    return value


def calculate_tax(income: Decimal, tax_slabs) -> Decimal:
    tax = Decimal('0')
    for slab in tax_slabs:
        if income <= slab.min_income:
            continue

        upper = slab.max_income if slab.max_income is not None else income
        taxable_chunk = min(income, upper) - slab.min_income
        if taxable_chunk > 0:
            tax += (taxable_chunk * slab.rate_percent) / Decimal('100')

    return tax.quantize(Decimal('0.01'))


def calculate_payroll(component_rows, base_salary=Decimal('0'), tax_slabs=()):
    earnings = Decimal('0')
    deductions = Decimal('0')
    for row in component_rows:
        calculation_type = getattr(row.component, 'calculation_type', 'FIXED')
        amount = compute_component_amount(base_salary, calculation_type, row.value)
        if row.component.component_type == 'EARNING':
            earnings += amount
        else:
            deductions += amount

    gross = (base_salary + earnings).quantize(Decimal('0.01'))
    tax = calculate_tax(gross, tax_slabs)
    total_deductions = (deductions + tax).quantize(Decimal('0.01'))
    return {
        'gross': gross,
        'deductions': total_deductions,
        'tax': tax,
        'net': (gross - total_deductions).quantize(Decimal('0.01')),
    }
