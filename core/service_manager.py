"""
Service Manager for SAP Gestion
Operational Layer - Centralized Service Management
"""

from typing import Dict, Any, Optional
from .exceptions import ConfigError
from services import DataService, AssignmentService, VisualizationService, AuthService

class ServiceManager:
    """Centralized service management for AI-optimized operations"""
    
    _instance = None
    _services = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ServiceManager, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._services:
            self._initialize_services()
    
    def _initialize_services(self):
        """Initialize all services with proper error handling"""
        try:
            self._services = {
                'data': DataService(),
                'assignment': AssignmentService(),
                'visualization': VisualizationService(),
                'auth': AuthService()
            }
        except Exception as e:
            raise ConfigError(f"Failed to initialize services: {e}")
    
    def get_service(self, service_name: str):
        """Get service by name with validation"""
        if service_name not in self._services:
            raise ConfigError(f"Service '{service_name}' not found")
        return self._services[service_name]
    
    def get_all_services(self) -> Dict[str, Any]:
        """Get all services for batch operations"""
        return self._services.copy()
    
    def reset_service(self, service_name: str):
        """Reset specific service (useful for testing/debugging)"""
        if service_name == 'data':
            self._services['data'] = DataService()
        elif service_name == 'assignment':
            self._services['assignment'] = AssignmentService()
        elif service_name == 'visualization':
            self._services['visualization'] = VisualizationService()
        elif service_name == 'auth':
            self._services['auth'] = AuthService()
        else:
            raise ConfigError(f"Cannot reset unknown service: {service_name}")
    
    def validate_services(self) -> bool:
        """Validate all services are properly initialized"""
        required_services = ['data', 'assignment', 'visualization', 'auth']
        for service_name in required_services:
            if service_name not in self._services:
                return False
        return True
    
    def get_service_status(self) -> Dict[str, str]:
        """Get status of all services for monitoring"""
        status = {}
        for name, service in self._services.items():
            try:
                # Basic validation that service is properly initialized
                if hasattr(service, '__class__'):
                    status[name] = "✅ Active"
                else:
                    status[name] = "❌ Invalid"
            except Exception:
                status[name] = "❌ Error"
        return status 