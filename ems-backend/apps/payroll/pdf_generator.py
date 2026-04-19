import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_payslip_pdf(payslip):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#EA580C'), # Orange-600
        alignment=1, # Center
        spaceAfter=20
    )
    
    label_style = ParagraphStyle(
        'LabelStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.gray,
        fontWeight='Bold'
    )
    
    value_style = ParagraphStyle(
        'ValueStyle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.black
    )

    content = []

    # 1. Header: Company & Title
    tenant_name = payslip.tenant.name if payslip.tenant else "HireWix System"
    content.append(Paragraph(tenant_name.upper(), styles['Heading3']))
    content.append(Paragraph("EMPLOYEE PAYSLIP", title_style))
    content.append(Spacer(1, 0.2 * inch))

    # 2. Employee Info Grid
    emp = payslip.employee
    period = payslip.payroll_run.month.strftime('%B %Y') if payslip.payroll_run else 'N/A'
    
    info_data = [
        [Paragraph("EMPLOYEE", label_style), Paragraph("STAFF ID", label_style), Paragraph("PERIOD", label_style)],
        [Paragraph(emp.full_name, value_style), Paragraph(emp.employee_id, value_style), Paragraph(period, value_style)],
        [Spacer(1, 0.1 * inch), Spacer(1, 0.1 * inch), Spacer(1, 0.1 * inch)],
        [Paragraph("DEPARTMENT", label_style), Paragraph("DESIGNATION", label_style), Paragraph("STATUS", label_style)],
        [Paragraph(emp.department.name if emp.department else 'N/A', value_style), 
         Paragraph(emp.designation.title if getattr(emp, 'designation', None) else 'N/A', value_style),
         Paragraph("PAID", value_style)]
    ]
    
    info_table = Table(info_data, colWidths=[2.3 * inch, 1.8 * inch, 1.5 * inch])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    content.append(info_table)
    content.append(Spacer(1, 0.4 * inch))

    # 3. Earnings & Deductions Table
    # Calculate Base Salary
    earnings_list = payslip.breakdown.filter(component_type='EARNING')
    deductions_list = payslip.breakdown.filter(component_type='DEDUCTION')
    
    total_earnings_val = sum(c.value for c in earnings_list)
    base_salary_val = payslip.gross_salary - total_earnings_val

    # Table Header
    pay_data = [
        [Paragraph("DESCRIPTION", label_style), Paragraph("TYPE", label_style), Paragraph("AMOUNT", label_style)],
    ]
    
    # Base Salary Row
    pay_data.append(["Basic Salary", "EARNING", f"${base_salary_val:,.2f}"])
    
    # Earnings Rows
    for earn in earnings_list:
        pay_data.append([earn.name, "EARNING", f"+${earn.value:,.2f}"])
        
    # Deductions Rows
    for ded in deductions_list:
        pay_data.append([ded.name, "DEDUCTION", f"-${ded.value:,.2f}"])
        
    # Tax Row
    if payslip.tax_deduction > 0:
        pay_data.append(["Income Tax", "DEDUCTION", f"-${payslip.tax_deduction:,.2f}"])

    pay_table = Table(pay_data, colWidths=[3 * inch, 1.2 * inch, 1.4 * inch])
    pay_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F9FAFB')), # Gray-50
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#6B7280')), # Gray-500
        ('ALIGN', (0,0), (-1,0), 'LEFT'),
        ('ALIGN', (2,0), (2,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 10),
        ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#F3F4F6')), # Gray-100
    ]))
    content.append(pay_table)
    content.append(Spacer(1, 0.3 * inch))

    # 4. Summary Totals
    summary_data = [
        ["", "TOTAL GROSS SALARY", f"${payslip.gross_salary:,.2f}"],
        ["", "TOTAL DEDUCTIONS", f"-${payslip.total_deductions + payslip.tax_deduction:,.2f}"],
        ["", Paragraph("NET PAYOUT", ParagraphStyle('NetStyle', fontSize=12, fontWeight='Bold')), 
         Paragraph(f"${payslip.net_salary:,.2f}", ParagraphStyle('NetVal', fontSize=14, fontWeight='Bold', textColor=colors.HexColor('#16A34A')))]
    ]
    
    summary_table = Table(summary_data, colWidths=[2.5 * inch, 1.7 * inch, 1.4 * inch])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (1,0), (1,-1), 'LEFT'),
        ('ALIGN', (2,0), (2,-1), 'RIGHT'),
        ('FONTNAME', (1,0), (1,-2), 'Helvetica'),
        ('FONTNAME', (1,2), (1,2), 'Helvetica-Bold'),
        ('LINEABOVE', (1,2), (2,2), 1, colors.black),
        ('TOPPADDING', (1,0), (-1,-1), 4),
    ]))
    content.append(summary_table)

    # 5. Footer
    content.append(Spacer(1, 1 * inch))
    content.append(Paragraph("This is a computer generated document and does not require a physical signature.", 
                            ParagraphStyle('Footer', fontSize=8, textColor=colors.gray, alignment=1)))
    content.append(Paragraph(f"Generated via {tenant_name} Employee Management System", 
                            ParagraphStyle('FooterSm', fontSize=7, textColor=colors.lightgrey, alignment=1)))

    # Build PDF
    doc.build(content)
    
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
