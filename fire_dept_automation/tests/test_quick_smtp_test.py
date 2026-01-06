"""Quick SMTP test"""
import smtplib
import os
import sys

# Get the parent directory (fire_dept_automation root)
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
secrets_path = os.path.join(base_dir, '.streamlit/secrets.toml')
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
print(f'Password (masked): {sender_password[:4]}...{sender_password[-4:]}')

try:
    print('\nTesting SMTP connection...')
    server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=10)
    server.login(sender_email, sender_password)
    print('SUCCESS: SMTP login successful!')
    server.quit()
except smtplib.SMTPAuthenticationError as e:
    print(f'FAILED: Authentication Error - {e.smtp_code}')
    print(f'Message: {e.smtp_error}')
except Exception as e:
    print(f'FAILED: {e}')
