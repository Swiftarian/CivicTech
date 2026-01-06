"""
認證 Session 管理模組
使用 Cookie 實現持久化登入狀態
"""
import streamlit as st
import extra_streamlit_components as stx
import hashlib
import time
from datetime import datetime, timedelta
import db_manager

# Cookie Manager (stored in session_state to avoid duplicate keys)
def get_cookie_manager():
    """Get or create CookieManager instance stored in session_state"""
    if 'cookie_manager' not in st.session_state:
        st.session_state.cookie_manager = stx.CookieManager()
    return st.session_state.cookie_manager

def generate_session_token(username):
    """產生 session token"""
    timestamp = str(time.time())
    raw = f"{username}:{timestamp}:fire_dept_secret_key"
    return hashlib.sha256(raw.encode()).hexdigest()

def save_login_session(username, role):
    """
    儲存登入 session 至 cookie 與 session_state
    
    Args:
        username: 使用者帳號
        role: 使用者角色
    """
    # Save to session_state immediately
    st.session_state.logged_in = True
    st.session_state.username = username
    st.session_state.role = role
    
    # Fetch user object
    user = db_manager.get_user(username)
    if user:
        st.session_state.user = dict(user)
    
    # Flag to save cookies on next render (to avoid duplicate key errors)
    st.session_state.pending_cookie_save = {
        'username': username,
        'role': role
    }

def clear_login_session():
    """清除登入 session (登出)"""
    cookie_manager = get_cookie_manager()
    
    # Clear cookies
    cookie_manager.delete('session_token')
    cookie_manager.delete('username')
    cookie_manager.delete('role')
    
    # Clear session_state
    st.session_state.logged_in = False
    st.session_state.username = None
    st.session_state.role = None
    st.session_state.user = None
    if 'awaiting_2fa' in st.session_state:
        st.session_state.awaiting_2fa = False
    
    # Set flag to prevent immediate auto-login on rerun
    st.session_state.just_logged_out = True

def check_auto_login():
    """
    檢查 cookie 並自動登入
    
    Returns:
        bool: 是否成功自動登入
    """
    # If already logged in, skip
    if st.session_state.get('logged_in'):
        return True
    
    # Check if just logged out to prevent immediate re-login loop
    if st.session_state.get('just_logged_out', False):
         st.session_state.just_logged_out = False
         return False

    cookie_manager = get_cookie_manager()
    
    # Get cookies
    session_token = cookie_manager.get('session_token')
    username = cookie_manager.get('username')
    role = cookie_manager.get('role')
    
    # Validate
    if not all([session_token, username, role]):
        return False
    
    # Verify user exists in DB
    user = db_manager.get_user(username)
    if not user:
        # User deleted, clear invalid cookie
        clear_login_session()
        return False
    
    # Verify token (basic check)
    expected_token_prefix = hashlib.sha256(f"{username}:".encode()).hexdigest()[:10]
    if not session_token.startswith(expected_token_prefix[:5]):
        # Token seems invalid
        clear_login_session()
        return False
    
    # Auto-login successful
    st.session_state.logged_in = True
    st.session_state.username = username
"""
認證 Session 管理模組
使用 Cookie 實現持久化登入狀態
"""
import streamlit as st
import extra_streamlit_components as stx
import hashlib
import time
from datetime import datetime, timedelta
import db_manager

# Cookie Manager (stored in session_state to avoid duplicate keys)
def get_cookie_manager():
    """Get or create CookieManager instance stored in session_state"""
    if 'cookie_manager' not in st.session_state:
        st.session_state.cookie_manager = stx.CookieManager()
    return st.session_state.cookie_manager

def generate_session_token(username):
    """產生 session token"""
    timestamp = str(time.time())
    raw = f"{username}:{timestamp}:fire_dept_secret_key"
    return hashlib.sha256(raw.encode()).hexdigest()

def save_login_session(username, role):
    """
    儲存登入 session 至 cookie 與 session_state
    
    Args:
        username: 使用者帳號
        role: 使用者角色
    """
    # Save to session_state immediately
    st.session_state.logged_in = True
    st.session_state.username = username
    st.session_state.role = role
    
    # Fetch user object
    user = db_manager.get_user(username)
    if user:
        st.session_state.user = dict(user)
    
    # Flag to save cookies on next render (to avoid duplicate key errors)
    st.session_state.pending_cookie_save = {
        'username': username,
        'role': role
    }

def clear_login_session():
    """清除登入 session (登出)"""
    cookie_manager = get_cookie_manager()
    
    # Clear cookies
    # Clear cookies (ignore errors if cookie already missing)
    try:
        cookie_manager.delete('session_token')
    except:
        pass
        
    try:
        cookie_manager.delete('username')
    except:
        pass
        
    try:
        cookie_manager.delete('role')
    except:
        pass
    
    # Clear session_state
    st.session_state.logged_in = False
    st.session_state.username = None
    st.session_state.role = None
    st.session_state.user = None
    if 'awaiting_2fa' in st.session_state:
        st.session_state.awaiting_2fa = False

def check_auto_login():
    """
    檢查 cookie 並自動登入
    
    Returns:
        bool: 是否成功自動登入
    """
    # If already logged in, skip
    if st.session_state.get('logged_in'):
        return True
    
    cookie_manager = get_cookie_manager()
    
    # Get cookies
    session_token = cookie_manager.get('session_token')
    username = cookie_manager.get('username')
    role = cookie_manager.get('role')
    
    # Validate
    if not all([session_token, username, role]):
        return False
    
    # Verify user exists in DB
    user = db_manager.get_user(username)
    if not user:
        # User deleted, clear invalid cookie
        clear_login_session()
        return False
    
    # Verify token (basic check)
    expected_token_prefix = hashlib.sha256(f"{username}:".encode()).hexdigest()[:10]
    if not session_token.startswith(expected_token_prefix[:5]):
        # Token seems invalid
        clear_login_session()
        return False
    
    # Auto-login successful
    st.session_state.logged_in = True
    st.session_state.username = username
    st.session_state.role = role
    st.session_state.user = dict(user)
    
    return True

def initialize_auth_state():
    """初始化認證相關的 session state"""
    if 'logged_in' not in st.session_state:
        st.session_state.logged_in = False
    if 'user' not in st.session_state:
        st.session_state.user = None
    if 'username' not in st.session_state:
        st.session_state.username = None
    if 'role' not in st.session_state:
        st.session_state.role = None
    if 'awaiting_2fa' not in st.session_state:
        st.session_state.awaiting_2fa = False
    if 'just_logged_out' not in st.session_state:
        st.session_state.just_logged_out = False

def process_pending_cookie_save():
    """處理待儲存的 cookie (在 rerun 後執行)"""
    if 'pending_cookie_save' in st.session_state:
        data = st.session_state.pending_cookie_save
        cookie_manager = get_cookie_manager()
        
        # Generate session token
        session_token = generate_session_token(data['username'])
        
        # Save to cookies (expires in 7 days)
        expires_at = datetime.now() + timedelta(days=7)
        cookie_manager.set('session_token', session_token, expires_at=expires_at, key="set_token")
        cookie_manager.set('username', data['username'], expires_at=expires_at, key="set_username")
        cookie_manager.set('role', data['role'], expires_at=expires_at, key="set_role")
        
        # Clear the pending flag
        del st.session_state.pending_cookie_save
