"""
Deep Diagnostic Tool for SMTP Connectivity
"""
import smtplib
import socket
import os
import sys

# Get the parent directory (fire_dept_automation root)
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def check_dns(hostname):
    print(f"\n🔍 [DNS] Resolving {hostname}...")
    try:
        ip_list = socket.gethostbyname_ex(hostname)
        print(f"✅ Resolved: {ip_list}")
        return ip_list[2] # Return list of IPs
    except socket.gaierror as e:
        print(f"❌ DNS Resolution Failed: {e}")
        return []

def check_proxy():
    print(f"\n🔍 [PROXY] Checking Environment Variables...")
    proxies = {k: os.environ.get(k) for k in ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy'] if os.environ.get(k)}
    if proxies:
        print(f"⚠️ Proxy detected: {proxies}")
    else:
        print("✅ No Proxy environment variables found.")

def test_connection_ipv4_only(hostname, port):
    print(f"\n🔍 [CONNECT] Testing connection to {hostname}:{port} (Force IPv4)...")
    try:
        # Create a socket explicitly using IPv4
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        sock.connect((hostname, port))
        print(f"✅ Socket connection successful to {hostname}:{port}")
        sock.close()
        return True
    except Exception as e:
        print(f"❌ Socket connection failed: {e}")
        return False

def debug_smtp(hostname, port, sender_email, sender_password):
    print(f"\n🔍 [SMTP] Starting Full Debug Session ({hostname}:{port})...")
    try:
        if port == 465:
            server = smtplib.SMTP_SSL(hostname, port, timeout=15)
        else:
            server = smtplib.SMTP(hostname, port, timeout=15)
            
        server.set_debuglevel(1) # Enable verbose output
        
        if port == 587:
            print("--- Sending EHLO ---")
            server.ehlo()
            print("--- Sending STARTTLS ---")
            server.starttls()
            print("--- Sending EHLO (Again) ---")
            server.ehlo()
            
        print("--- Logging in ---")
        server.login(sender_email, sender_password)
        print("✅ Login Successful!")
        server.quit()
        
    except Exception as e:
        print(f"\n❌ SMTP Session Failed: {e}")

def main():
    print("="*60)
    print("🚀 Deep SMTP Diagnostic Tool")
    print("="*60)
    
    # Load Secrets
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    secrets_path = os.path.join(base_dir, '.streamlit/secrets.toml')
    sender_email = None
    sender_password = None
    
    try:
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
    except:
        print("❌ Failed to load secrets.")
        return

    check_proxy()
    ips = check_dns('smtp.gmail.com')
    
    if ips:
        # Try connecting to the first IP directly to bypass DNS issues during connect
        target_ip = ips[0]
        print(f"\nTargeting IP: {target_ip}")
        success_465 = test_connection_ipv4_only(target_ip, 465)
        
        if success_465:
            debug_smtp('smtp.gmail.com', 465, sender_email, sender_password)
        else:
            print("⚠️ Skipping Port 465 SMTP Debug due to socket failure.")
            
            # Try Port 587
            success_587 = test_connection_ipv4_only(target_ip, 587)
            if success_587:
                debug_smtp('smtp.gmail.com', 587, sender_email, sender_password)
            else:
                 print("⚠️ Skipping Port 587 SMTP Debug due to socket failure.")
                 print("\n🔴 CONCLUSION: Both ports are blocked at the TCP/IP level.")

if __name__ == "__main__":
    main()
