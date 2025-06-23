"""
Custom Exceptions for SAP Gestion
Operational Layer - Security-First Error Handling
"""

class SecurityError(Exception):
    """Raised when security validation fails"""
    pass

class ValidationError(Exception):
    """Raised when data validation fails"""
    pass

class ConfigError(Exception):
    """Raised when configuration is invalid"""
    pass

class ResourceError(Exception):
    """Raised when resource operations fail"""
    pass

class DataProcessingError(Exception):
    """Raised when data processing fails"""
    pass 