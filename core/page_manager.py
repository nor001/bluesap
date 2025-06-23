"""
Page Manager for SAP Gestion
Operational Layer - Centralized Page Management
"""

from typing import Dict, Any, Optional, Callable
import streamlit as st
from .exceptions import ConfigError

class PageManager:
    """Centralized page management for AI-optimized navigation"""
    
    _pages = {}
    _current_page = None
    
    @classmethod
    def register_page(cls, page_name: str, page_function: Callable, 
                     icon: str = "📄", title: str = None):
        """Register a page with metadata"""
        cls._pages[page_name] = {
            'function': page_function,
            'icon': icon,
            'title': title or page_name,
            'active': True
        }
    
    @classmethod
    def get_page(cls, page_name: str) -> Dict[str, Any]:
        """Get page configuration"""
        if page_name not in cls._pages:
            raise ConfigError(f"Page '{page_name}' not registered")
        return cls._pages[page_name]
    
    @classmethod
    def get_all_pages(cls) -> Dict[str, Dict[str, Any]]:
        """Get all registered pages"""
        return cls._pages.copy()
    
    @classmethod
    def set_current_page(cls, page_name: str):
        """Set current page"""
        if page_name not in cls._pages:
            raise ConfigError(f"Page '{page_name}' not registered")
        cls._current_page = page_name
    
    @classmethod
    def get_current_page(cls) -> Optional[str]:
        """Get current page name"""
        return cls._current_page
    
    @classmethod
    def render_page(cls, page_name: str, *args, **kwargs):
        """Render a specific page"""
        page_config = cls.get_page(page_name)
        if not page_config['active']:
            st.error(f"Page '{page_name}' is currently disabled")
            return
        
        try:
            page_config['function'](*args, **kwargs)
        except Exception as e:
            st.error(f"Error rendering page '{page_name}': {e}")
    
    @classmethod
    def create_navigation(cls) -> str:
        """Create navigation sidebar for Streamlit"""
        st.sidebar.title("🧭 Navigation")
        
        # Get current page from URL or session state
        current_page = st.session_state.get('current_page', list(cls._pages.keys())[0] if cls._pages else None)
        
        # Create navigation options
        page_options = []
        for name, config in cls._pages.items():
            if config['active']:
                page_options.append(f"{config['icon']} {config['title']}")
        
        if page_options:
            selected = st.sidebar.selectbox(
                "Select Page:",
                page_options,
                index=page_options.index(f"{cls._pages[current_page]['icon']} {cls._pages[current_page]['title']}") if current_page else 0
            )
            
            # Find selected page name
            for name, config in cls._pages.items():
                if f"{config['icon']} {config['title']}" == selected:
                    st.session_state['current_page'] = name
                    return name
        
        return current_page
    
    @classmethod
    def disable_page(cls, page_name: str):
        """Disable a page"""
        if page_name in cls._pages:
            cls._pages[page_name]['active'] = False
    
    @classmethod
    def enable_page(cls, page_name: str):
        """Enable a page"""
        if page_name in cls._pages:
            cls._pages[page_name]['active'] = True 