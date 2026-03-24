from django.core.management.base import BaseCommand
from apps.payroll.models import SalaryComponent
from apps.core.models import Tenant

class Command(BaseCommand):
    help = 'Initialize common salary components'

    def handle(self, *args, **options):
        # We'll assume a single tenant or global components for now
        # In this multi-tenant setup, we might need to apply to all tenants
        tenants = Tenant.objects.all()
        
        common_components = [
            # Earnings
            {'name': 'Basic Pay', 'component_type': 'EARNING', 'is_default': True},
            {'name': 'Housing Allowance', 'component_type': 'EARNING', 'is_default': False},
            {'name': 'Transport Allowance', 'component_type': 'EARNING', 'is_default': False},
            {'name': 'Meal Subsidy', 'component_type': 'EARNING', 'is_default': False},
            {'name': 'Medical Allowance', 'component_type': 'EARNING', 'is_default': False},
            
            # Deductions
            {'name': 'Pension', 'component_type': 'DEDUCTION', 'is_default': False},
            {'name': 'Health Insurance (NHIS)', 'component_type': 'DEDUCTION', 'is_default': False},
            {'name': 'Income Tax (PAYE)', 'component_type': 'DEDUCTION', 'is_default': False},
            {'name': 'Union Dues', 'component_type': 'DEDUCTION', 'is_default': False},
        ]

        # If no tenants exist, just create without tenant (global-ish)
        if not tenants.exists():
            for comp in common_components:
                SalaryComponent.objects.get_or_create(name=comp['name'], defaults=comp)
            self.stdout.write(self.style.SUCCESS('Successfully initialized global components'))
        else:
            for tenant in tenants:
                for comp in common_components:
                    SalaryComponent.objects.get_or_create(
                        tenant=tenant, 
                        name=comp['name'], 
                        defaults=comp
                    )
                self.stdout.write(self.style.SUCCESS(f'Successfully initialized components for tenant: {tenant.name}'))
