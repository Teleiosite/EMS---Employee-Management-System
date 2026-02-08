from datetime import timedelta


def business_days(start_date, end_date):
    days = 0
    cur = start_date
    while cur <= end_date:
        if cur.weekday() < 5:
            days += 1
        cur += timedelta(days=1)
    return days
