import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def generate_payslip_pdf(payslip):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    
    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 750, "PAYSLIP")
    
    # Employee Info
    c.setFont("Helvetica", 12)
    emp = payslip.employee
    c.drawString(50, 700, f"Employee Name: {emp.full_name if hasattr(emp, 'full_name') else str(emp)}")
    c.drawString(50, 680, f"Department: {emp.department.name if emp.department else 'N/A'}")
    c.drawString(50, 660, f"Designation: {emp.designation.title if getattr(emp, 'designation', None) else 'N/A'}")
    c.drawString(50, 640, f"Payroll Month: {payslip.payroll_run.month.strftime('%B %Y') if payslip.payroll_run else 'N/A'}")
    
    # Salary Info
    c.drawString(50, 600, f"Gross Salary: ${payslip.gross_salary}")
    c.drawString(50, 580, f"Total Deductions: ${payslip.total_deductions}")
    c.drawString(50, 560, f"Tax Deduction: ${payslip.tax_deduction}")
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 520, f"Net Salary: ${payslip.net_salary}")
    
    # Footer
    c.setFont("Helvetica", 10)
    c.drawString(50, 50, "This is a computer generated document.")
    
    c.showPage()
    c.save()
    
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
