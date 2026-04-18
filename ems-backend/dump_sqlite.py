import sqlite3

try:
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()

    print("=== USERS ===")
    try:
        cursor.execute("SELECT id, email, role, tenant_id FROM authentication_customuser WHERE is_active=1")
        users = cursor.fetchall()
        for u in users:
            print(f"ID: {u[0]} | Email: {u[1]} | Role: {u[2]} | Tenant ID: {u[3]}")
    except Exception as e:
        print("Error fetching users:", e)

    print("\n=== JOBS ===")
    try:
        cursor.execute("SELECT id, role_name, tenant_id FROM recruitment_jobposting")
        jobs = cursor.fetchall()
        for j in jobs:
            print(f"ID: {j[0]} | Title: {j[1]} | Tenant ID: {j[2]}")
    except Exception as e:
        print("Error fetching jobs:", e)
        
    conn.close()
except Exception as e:
    print("Database error:", e)
