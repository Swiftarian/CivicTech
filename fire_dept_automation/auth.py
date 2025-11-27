import hashlib
import os
import secrets

def hash_password(password, salt=None):
    """Hash a password using PBKDF2 with HMAC-SHA256."""
    if salt is None:
        salt = os.urandom(32)  # Generate a new salt
    else:
        # Ensure salt is bytes
        if isinstance(salt, str):
            salt = bytes.fromhex(salt)
            
    # PBKDF2 with SHA256, 100,000 iterations
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        100000
    )
    
    # Return salt and hash as hex strings
    return salt.hex(), pwd_hash.hex()

def verify_password(stored_salt, stored_hash, input_password):
    """Verify a stored password against an input password."""
    salt = bytes.fromhex(stored_salt)
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        input_password.encode('utf-8'),
        salt,
        100000
    )
    return pwd_hash.hex() == stored_hash

def generate_temp_password(length=6):
    """Generate a random temporary password."""
    return secrets.token_hex(length // 2)
