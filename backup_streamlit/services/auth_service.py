"""
Authentication Service for SAP Gestion
Operational Layer - Security-First Authentication
"""

import streamlit as st
from typing import Optional, Dict, Any
import streamlit_authenticator as stauth
from supabase import create_client, Client
import os

from core.exceptions import SecurityError
from core.security import SecurityValidator
from core.models import UserSession

class AuthService:
    """Security-first authentication service"""
    
    def __init__(self):
        self.security_validator = SecurityValidator()
        self.supabase_client = self._initialize_supabase()
    
    def _initialize_supabase(self) -> Optional[Client]:
        """Initialize Supabase client with security validation"""
        try:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_KEY")
            
            if not supabase_url or not supabase_key:
                return None
            
            return create_client(supabase_url, supabase_key)
            
        except Exception:
            return None
    
    def login_with_google(self) -> Optional[Dict[str, Any]]:
        """Google OAuth login with security validation"""
        try:
            if not self.supabase_client:
                st.warning("Supabase not configured. Using local authentication.")
                return None
            
            # Google OAuth implementation
            # This is a placeholder - implement actual OAuth flow
            st.info("Google OAuth integration not yet implemented")
            return None
            
        except Exception as e:
            raise SecurityError(f"Login failed: {e}")
    
    def validate_user_session(self, user: Optional[Dict[str, Any]]) -> bool:
        """Validate user session with security checks"""
        try:
            if not user:
                return False
            
            # Validate email format
            email = user.get('email', '')
            if not self.security_validator.validate_email(email):
                return False
            
            # Check authentication status
            if not user.get('is_authenticated', False):
                return False
            
            return True
            
        except Exception:
            return False
    
    def get_user_permissions(self, user: Optional[Dict[str, Any]]) -> list:
        """Get user permissions with security validation"""
        try:
            if not self.validate_user_session(user):
                return []
            
            # Default permissions for authenticated users
            permissions = ['read', 'export']
            
            # Add write permission for specific users (placeholder)
            # In production, this would check against a database
            email = user.get('email', '')
            if email.endswith('@company.com'):
                permissions.append('write')
            
            return permissions
            
        except Exception:
            return []
    
    def check_permission(self, user: Optional[Dict[str, Any]], required_permission: str) -> bool:
        """Check if user has required permission"""
        try:
            permissions = self.get_user_permissions(user)
            return required_permission in permissions or 'admin' in permissions
            
        except Exception:
            return False
    
    def create_user_session(self, user_data: Dict[str, Any]) -> UserSession:
        """Create validated user session"""
        try:
            email = user_data.get('email', '')
            if not self.security_validator.validate_email(email):
                raise SecurityError("Invalid email format")
            
            permissions = self.get_user_permissions(user_data)
            
            return UserSession(
                email=email,
                name=user_data.get('name'),
                is_authenticated=True,
                permissions=permissions
            )
            
        except Exception as e:
            raise SecurityError(f"Failed to create user session: {e}")
    
    def logout(self):
        """Secure logout"""
        try:
            # Clear session state
            if 'user' in st.session_state:
                del st.session_state['user']
            
            # Clear any other sensitive data
            sensitive_keys = ['user_prefs', 'auth_token', 'user_permissions']
            for key in sensitive_keys:
                if key in st.session_state:
                    del st.session_state[key]
                    
        except Exception as e:
            raise SecurityError(f"Logout failed: {e}")
    
    def get_current_user(self) -> Optional[Dict[str, Any]]:
        """Get current user with validation"""
        try:
            user = st.session_state.get('user')
            if self.validate_user_session(user):
                return user
            return None
            
        except Exception:
            return None 