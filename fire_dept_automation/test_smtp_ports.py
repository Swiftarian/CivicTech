"""Test SMTP with TLS on port 587"""
import smtplib
import os

secrets_path = '.streamlit/secrets.toml'
sender_email = None
sender_password = None

with open(secrets_path, 'r', encoding='utf-8') as f:
    content = f.read()
    in_email = False
    for line in content.split('\n'):
        line = line.strip()
        if line == '[email]':
            in_email = True
            continue
        elif line.startswith('['):
            in_email = False
            continue
        if in_email:
            if line.startswith('sender_email'):
                sender_email = line.split('=')[1].strip().strip('"').strip("'")
            elif line.startswith('sender_password'):
                sender_password = line.split('=')[1].strip().strip('"').strip("'")

print(f'Email: {sender_email}')
print(f'Password Length: {len(sender_password)} chars')

# 嘗試方法 1: Port 587 + STARTTLS
print('\n[TEST 1] Port 587 + STARTTLS...')
try:
    server = smtplib.SMTP('smtp.gmail.com', 587, timeout=10)
    server.starttls()
    server.login(sender_email, sender_password)
    print('SUCCESS: Port 587 works!')
    server.quit()
except Exception as e:
    print(f'FAILED: {e}')

# 嘗試方法 2: Port 465 + SSL
print('\n[TEST 2] Port 465 + SSL...')
try:
    server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=10)
    server.login(sender_email, sender_password)
    print('SUCCESS: Port 465 works!')
    server.quit()
except Exception as e:
    print(f'FAILED: {e}')
