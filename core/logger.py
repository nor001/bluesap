"""
Logger for SAP Gestion
Operational Layer - AI-Optimized Logging
"""

import logging
import streamlit as st
from typing import Dict, Any, Optional
from datetime import datetime
import traceback
from .config import AppConfig

class AILogger:
    """AI-optimized logging system for better debugging and monitoring"""
    
    _instance = None
    _log_buffer = []
    _max_buffer_size = 100
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AILogger, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, '_initialized'):
            self._setup_logging()
            self._initialized = True
    
    def _setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO if AppConfig.DEBUG else logging.WARNING,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('SAP_Gestion')
    
    def log_operation(self, operation: str, details: Dict[str, Any] = None, 
                     level: str = "INFO"):
        """Log operation with structured details for AI analysis"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'operation': operation,
            'details': details or {},
            'level': level,
            'session_id': id(st.session_state) if 'st' in globals() else None
        }
        
        # Add to buffer for UI display
        self._log_buffer.append(log_entry)
        if len(self._log_buffer) > self._max_buffer_size:
            self._log_buffer.pop(0)
        
        # Log to standard logger
        message = f"Operation: {operation}"
        if details:
            message += f" | Details: {details}"
        
        if level == "ERROR":
            self.logger.error(message)
        elif level == "WARNING":
            self.logger.warning(message)
        else:
            self.logger.info(message)
    
    def log_service_call(self, service_name: str, method_name: str, 
                        params: Dict[str, Any] = None, result: Any = None):
        """Log service method calls for AI analysis"""
        self.log_operation(
            f"Service Call: {service_name}.{method_name}",
            {
                'service': service_name,
                'method': method_name,
                'params': params,
                'result_type': type(result).__name__ if result is not None else None,
                'success': result is not None
            }
        )
    
    def log_error(self, error: Exception, context: str = None):
        """Log errors with full context for AI debugging"""
        error_details = {
            'error_type': type(error).__name__,
            'error_message': str(error),
            'traceback': traceback.format_exc(),
            'context': context
        }
        
        self.log_operation(f"Error in {context or 'unknown'}", error_details, "ERROR")
    
    def log_performance(self, operation: str, duration: float, 
                       data_size: int = None):
        """Log performance metrics for AI optimization"""
        self.log_operation(
            f"Performance: {operation}",
            {
                'duration_seconds': duration,
                'data_size': data_size,
                'performance_level': 'GOOD' if duration < 1.0 else 'SLOW' if duration < 5.0 else 'VERY_SLOW'
            }
        )
    
    def get_recent_logs(self, count: int = 10) -> list:
        """Get recent log entries for UI display"""
        return self._log_buffer[-count:] if self._log_buffer else []
    
    def clear_logs(self):
        """Clear log buffer"""
        self._log_buffer.clear()
    
    def export_logs(self) -> str:
        """Export logs for AI analysis"""
        import json
        return json.dumps(self._log_buffer, indent=2, default=str)
    
    def log_data_operation(self, operation: str, data_shape: tuple = None, 
                          columns: list = None, filters: Dict[str, Any] = None):
        """Log data operations for AI analysis"""
        self.log_operation(
            f"Data Operation: {operation}",
            {
                'data_shape': data_shape,
                'columns_count': len(columns) if columns else None,
                'filters_applied': filters,
                'operation_type': 'data_processing'
            }
        )
    
    def log_user_action(self, action: str, user_id: str = None, 
                       page: str = None, details: Dict[str, Any] = None):
        """Log user actions for AI analysis"""
        log_details = {
            'user_id': user_id,
            'page': page,
            'action_type': 'user_interaction'
        }
        
        if details:
            log_details.update(details)
        
        self.log_operation(
            f"User Action: {action}",
            log_details
        ) 