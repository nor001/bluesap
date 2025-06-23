"""
AI Configuration for SAP Gestion
Operational Layer - AI Development & Optimization Settings
"""

import os
from typing import Dict, Any

class AIConfig:
    """AI-specific configuration for development and optimization"""
    
    # AI Development Settings
    AI_DEBUG_MODE = os.getenv("AI_DEBUG_MODE", "False").lower() == "true"
    AI_LOG_LEVEL = os.getenv("AI_LOG_LEVEL", "INFO")
    AI_PERFORMANCE_MONITORING = os.getenv("AI_PERFORMANCE_MONITORING", "True").lower() == "true"
    
    # AI Optimization Settings
    AI_CACHE_ENABLED = os.getenv("AI_CACHE_ENABLED", "True").lower() == "true"
    AI_CACHE_TTL = int(os.getenv("AI_CACHE_TTL", "3600"))  # 1 hour default
    AI_BATCH_SIZE = int(os.getenv("AI_BATCH_SIZE", "100"))
    
    # AI Service Settings
    AI_SERVICE_TIMEOUT = int(os.getenv("AI_SERVICE_TIMEOUT", "30"))
    AI_MAX_RETRIES = int(os.getenv("AI_MAX_RETRIES", "3"))
    
    # AI Data Processing Settings
    AI_DATA_VALIDATION_STRICT = os.getenv("AI_DATA_VALIDATION_STRICT", "False").lower() == "true"
    AI_AUTO_CORRECT_DATA = os.getenv("AI_AUTO_CORRECT_DATA", "True").lower() == "true"
    AI_DATA_SANITIZATION = os.getenv("AI_DATA_SANITIZATION", "True").lower() == "true"
    
    # AI User Experience Settings
    AI_SHOW_PROGRESS_BARS = os.getenv("AI_SHOW_PROGRESS_BARS", "True").lower() == "true"
    AI_SHOW_PERFORMANCE_METRICS = os.getenv("AI_SHOW_PERFORMANCE_METRICS", "False").lower() == "true"
    AI_SHOW_DEBUG_INFO = os.getenv("AI_SHOW_DEBUG_INFO", "False").lower() == "true"
    
    # AI Error Handling Settings
    AI_GRACEFUL_ERROR_HANDLING = os.getenv("AI_GRACEFUL_ERROR_HANDLING", "True").lower() == "true"
    AI_ERROR_RECOVERY = os.getenv("AI_ERROR_RECOVERY", "True").lower() == "true"
    AI_ERROR_NOTIFICATION = os.getenv("AI_ERROR_NOTIFICATION", "False").lower() == "true"
    
    # AI Security Settings
    AI_SECURITY_LOGGING = os.getenv("AI_SECURITY_LOGGING", "True").lower() == "true"
    AI_INPUT_VALIDATION = os.getenv("AI_INPUT_VALIDATION", "True").lower() == "true"
    AI_OUTPUT_SANITIZATION = os.getenv("AI_OUTPUT_SANITIZATION", "True").lower() == "true"
    
    @classmethod
    def get_all_settings(cls) -> Dict[str, Any]:
        """Get all AI configuration settings"""
        return {
            'debug_mode': cls.AI_DEBUG_MODE,
            'log_level': cls.AI_LOG_LEVEL,
            'performance_monitoring': cls.AI_PERFORMANCE_MONITORING,
            'cache_enabled': cls.AI_CACHE_ENABLED,
            'cache_ttl': cls.AI_CACHE_TTL,
            'batch_size': cls.AI_BATCH_SIZE,
            'service_timeout': cls.AI_SERVICE_TIMEOUT,
            'max_retries': cls.AI_MAX_RETRIES,
            'data_validation_strict': cls.AI_DATA_VALIDATION_STRICT,
            'auto_correct_data': cls.AI_AUTO_CORRECT_DATA,
            'data_sanitization': cls.AI_DATA_SANITIZATION,
            'show_progress_bars': cls.AI_SHOW_PROGRESS_BARS,
            'show_performance_metrics': cls.AI_SHOW_PERFORMANCE_METRICS,
            'show_debug_info': cls.AI_SHOW_DEBUG_INFO,
            'graceful_error_handling': cls.AI_GRACEFUL_ERROR_HANDLING,
            'error_recovery': cls.AI_ERROR_RECOVERY,
            'error_notification': cls.AI_ERROR_NOTIFICATION,
            'security_logging': cls.AI_SECURITY_LOGGING,
            'input_validation': cls.AI_INPUT_VALIDATION,
            'output_sanitization': cls.AI_OUTPUT_SANITIZATION
        }
    
    @classmethod
    def validate_settings(cls) -> bool:
        """Validate AI configuration settings"""
        try:
            # Validate numeric settings
            assert cls.AI_CACHE_TTL > 0, "Cache TTL must be positive"
            assert cls.AI_BATCH_SIZE > 0, "Batch size must be positive"
            assert cls.AI_SERVICE_TIMEOUT > 0, "Service timeout must be positive"
            assert cls.AI_MAX_RETRIES >= 0, "Max retries must be non-negative"
            
            # Validate log level
            valid_log_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
            assert cls.AI_LOG_LEVEL.upper() in valid_log_levels, f"Invalid log level: {cls.AI_LOG_LEVEL}"
            
            return True
        except AssertionError as e:
            print(f"AI Configuration validation failed: {e}")
            return False
    
    @classmethod
    def get_optimization_recommendations(cls) -> list:
        """Get AI optimization recommendations based on current settings"""
        recommendations = []
        
        if not cls.AI_PERFORMANCE_MONITORING:
            recommendations.append("Enable performance monitoring for better AI optimization")
        
        if not cls.AI_CACHE_ENABLED:
            recommendations.append("Enable caching for improved performance")
        
        if cls.AI_BATCH_SIZE < 50:
            recommendations.append("Consider increasing batch size for better throughput")
        
        if cls.AI_SERVICE_TIMEOUT < 10:
            recommendations.append("Consider increasing service timeout for complex operations")
        
        if not cls.AI_GRACEFUL_ERROR_HANDLING:
            recommendations.append("Enable graceful error handling for better user experience")
        
        return recommendations 