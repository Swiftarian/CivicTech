"""
認證 Session 管理模組
使用 Cookie 實現持久化登入狀態
"""
import streamlit as st
import extra_streamlit_components as stx
import hashlib
import time
import db_manager

# Cookie Manager (Singleton Pattern)
@st.cache_resource
def get_cookie_manager():
    return stx.CookieManager()

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
    cookie_manager = get_cookie_manager()
    
    # Generate session token
    session_token = generate_session_token(username)
    
    # Save to cookies (expires in 7 days)
    cookie_manager.set('session_token', session_token, expires_at=time.time() + 7*24*60*60)
    cookie_manager.set('username', username, expires_at=time.time() + 7*24*60*60)
    cookie_manager.set('role', role, expires_at=time.time() + 7*24*60*60)
    
    # Save to session_state
    st.session_state.logged_in = True
    st.session_state.username = username
    st.session_state.role = role
    
    # Fetch user object
    user = db_manager.get_user(username)
    if user:
        st.session_state.user = dict(user)

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
