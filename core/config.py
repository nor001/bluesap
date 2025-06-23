"""
Configuration Management for SAP Gestion
Operational Layer - Centralized & Secure Configuration
"""

import os
from typing import Dict, Any, Optional
from pathlib import Path
from .exceptions import ConfigError
from .models import ResourceConfig, PlanConfig
from .security import SecurityValidator

class AppConfig:
    """Centralized application configuration with security validation"""
    
    # Application settings
    APP_NAME = "SAP Gestion"
    APP_VERSION = "2.0.0"
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    
    # Security settings
    MAX_FILE_SIZE_MB = 50
    ALLOWED_FILE_TYPES = {'.csv', '.xlsx', '.xls'}
    SESSION_TIMEOUT_MINUTES = 60
    
    # Resource configurations with validation
    DEVELOPERS_CONFIG_GRID = {
        "Fabricio Sánchez": {"level": "SENIOR", "max_tasks": 15, "color": "#FF6B6B"},
        "Oscar Castellanos": {"level": "SENIOR", "max_tasks": 15, "color": "#4ECDC4"},
        "Gabriel Huamani": {"level": "SENIOR", "max_tasks": 15, "color": "#45B7D1"},
        "Luiggi Gonzales": {"level": "SENIOR", "max_tasks": 15, "color": "#96CEB4"},
        "Norman Tinco": {"level": "SENIOR", "max_tasks": 4, "color": "#FFEAA7"},
    }
    
    DEVELOPERS_CONFIG_FSM = {
        "FSM1": {"level": "SENIOR", "max_tasks": 15, "color": "#9370DB"},
        "FSM2": {"level": "SENIOR", "max_tasks": 15, "color": "#32CD32"},
    }
    
    DEVELOPERS_CONFIG_C4E = {
        "c4e1": {"level": "SENIOR", "max_tasks": 15, "color": "#FF6347"},
    }
    
    DEVELOPERS_CONFIG_ERP = {
        "Luis Ore": {"level": "SENIOR", "max_tasks": 6, "color": "#FF4500"},
        "Angel Burga": {"level": "SENIOR", "max_tasks": 15, "color": "#1E90FF"},
        "Richard Galán": {"level": "SEMI_SENIOR", "max_tasks": 12, "color": "#32CD32"},
        "Cesar Rivero": {"level": "SENIOR", "max_tasks": 7, "color": "#27AE60"},
    }
    
    DEVELOPERS_CONFIG_LOC = {
        "Jhonatan Colina": {"level": "PLENO", "max_tasks": 6, "color": "#FF7F50"},
        "Jose Aguilar": {"level": "PLENO", "max_tasks": 12, "color": "#20B2AA"},
    }
    
    DEVELOPERS_CONFIG_PORTAL = {
        "Jhonatan Colina": {"level": "PLENO", "max_tasks": 6, "color": "#FF7F50"},
        "Jorge Clemente": {"level": "JUNIOR", "max_tasks": 8, "color": "#FFB347"},
        "Jose Urbina": {"level": "JUNIOR", "max_tasks": 8, "color": "#87CEEB"},
    }
    
    DEVELOPERS_CONFIG_HCM = {
        "Cesar Rivero": {"level": "SENIOR", "max_tasks": 7, "color": "#27AE60"},
        "Katheryn Quiroz": {"level": "SEMI_SENIOR", "max_tasks": 12, "color": "#E91E63"},
    }
    
    TESTERS_CONFIG = {
        "Tester QA 1": {"level": "SENIOR", "max_tasks": 15, "color": "#FF6B6B"},
        "Tester QA 2": {"level": "PLENO", "max_tasks": 12, "color": "#4ECDC4"},
        "Tester QA 3": {"level": "JUNIOR", "max_tasks": 10, "color": "#45B7D1"},
    }
    
    # Group mapping
    GROUP_CONFIG_MAPPING = {
        "GRID": DEVELOPERS_CONFIG_GRID,
        "FSM": DEVELOPERS_CONFIG_FSM,
        "C4E": DEVELOPERS_CONFIG_C4E,
        "ERP": DEVELOPERS_CONFIG_ERP,
        "LOC": DEVELOPERS_CONFIG_LOC,
        "PORTAL": DEVELOPERS_CONFIG_PORTAL,
        "HCM": DEVELOPERS_CONFIG_HCM,
    }
    
    # Holiday configuration
    PERU_HOLIDAYS = {
        "2025-07-28": "Día de la Independencia del Perú",
        "2025-07-29": "Fiestas Patrias",
        "2025-01-01": "Año Nuevo",
        "2025-05-01": "Día del Trabajador",
        "2025-12-08": "Inmaculada Concepción",
        "2025-12-25": "Navidad",
    }
    
    @classmethod
    def get_plan_config(cls, plan_type: str) -> PlanConfig:
        """Get validated plan configuration"""
        if plan_type == "Plan de Desarrollo":
            return PlanConfig(
                resource_col="abap_asignado",
                hours_col="plan_abap_dev_time",
                available_date_col="esfu_disponible",
                plan_date_col="plan_abap_dev_ini",
                start_date_col="Fecha Inicio Plan",
                end_date_col="Fecha Fin Plan",
                resource_title="Developer",
                resources_title="Developers",
                assigned_title="Assigned ABAPs",
                use_group_based_assignment=True,
            )
        elif plan_type == "Plan de Pruebas":
            return PlanConfig(
                resource_col="abap_asignado",
                hours_col="plan_abap_pu_time",
                available_date_col="available_test_date",
                plan_date_col="plan_abap_pu_ini",
                start_date_col="pu_ini",
                end_date_col="Fecha Fin Real",
                resource_title="Tester",
                resources_title="Testers",
                assigned_title="Assigned Testers",
                use_group_based_assignment=False,
            )
        else:
            raise ConfigError(f"Unknown plan type: {plan_type}")
    
    @classmethod
    def get_group_config(cls, group_name: str) -> Dict[str, Any]:
        """Get group-specific configuration with validation"""
        if not group_name:
            return cls._get_all_developers_config()
        
        group_name_upper = group_name.upper()
        if group_name_upper in cls.GROUP_CONFIG_MAPPING:
            return cls.GROUP_CONFIG_MAPPING[group_name_upper]
        
        return cls._get_all_developers_config()
    
    @classmethod
    def _get_all_developers_config(cls) -> Dict[str, Any]:
        """Get all developers configuration"""
        all_config = {}
        for config in cls.GROUP_CONFIG_MAPPING.values():
            all_config.update(config)
        return all_config
    
    @classmethod
    def validate_config(cls) -> bool:
        """Validate all configuration settings"""
        try:
            # Validate resource configurations
            for group_name, config in cls.GROUP_CONFIG_MAPPING.items():
                for name, details in config.items():
                    ResourceConfig(
                        name=name,
                        level=details["level"],
                        max_tasks=details["max_tasks"],
                        color=details["color"]
                    )
            
            # Validate testers configuration
            for name, details in cls.TESTERS_CONFIG.items():
                ResourceConfig(
                    name=name,
                    level=details["level"],
                    max_tasks=details["max_tasks"],
                    color=details["color"]
                )
            
            return True
        except Exception as e:
            raise ConfigError(f"Configuration validation failed: {e}")
    
    @classmethod
    def get_data_path(cls) -> Path:
        """Get secure data directory path"""
        data_path = Path("data")
        data_path.mkdir(exist_ok=True)
        return data_path 