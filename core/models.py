"""
Data Models for SAP Gestion
Operational Layer - Type Safety & Validation
"""

from pydantic import BaseModel, Field, validator
from typing import Dict, List, Optional, Any
from datetime import datetime, date
import re

class BaseModel(BaseModel):
    """Base model with security-first validation"""
    
    class Config:
        validate_assignment = True
        extra = "forbid"  # Security: reject unknown fields

class ResourceConfig(BaseModel):
    """Resource configuration with validation"""
    name: str = Field(..., min_length=1, max_length=100)
    level: str = Field(..., pattern="^(SENIOR|SEMI_SENIOR|PLENO|JUNIOR)$")
    max_tasks: int = Field(..., ge=1, le=50)
    color: str = Field(..., pattern="^#[0-9A-Fa-f]{6}$")
    
    @validator('name')
    def validate_name(cls, v):
        # Allow letters, numbers, spaces, and common special characters for development names
        if not re.match(r'^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_]+$', v):
            raise ValueError('Name contains invalid characters')
        return v.strip()

class PlanConfig(BaseModel):
    """Plan configuration with validation"""
    resource_col: str = Field(..., min_length=1)
    hours_col: str = Field(..., min_length=1)
    available_date_col: str = Field(..., min_length=1)
    plan_date_col: str = Field(..., min_length=1)
    start_date_col: str = Field(..., min_length=1)
    end_date_col: str = Field(..., min_length=1)
    resource_title: str = Field(..., min_length=1)
    resources_title: str = Field(..., min_length=1)
    assigned_title: str = Field(..., min_length=1)
    use_group_based_assignment: bool = True

class UserSession(BaseModel):
    """User session data with validation"""
    email: str = Field(..., pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    name: Optional[str] = Field(None, max_length=100)
    is_authenticated: bool = False
    permissions: List[str] = Field(default_factory=list)
    
    @validator('permissions')
    def validate_permissions(cls, v):
        allowed_permissions = ['read', 'write', 'admin', 'export']
        for perm in v:
            if perm not in allowed_permissions:
                raise ValueError(f'Invalid permission: {perm}')
        return v

class FilterState(BaseModel):
    """Filter state with validation"""
    selected_proy: str = Field(default="Todos", max_length=50)
    selected_modulo: str = Field(default="Todos", max_length=50)
    selected_grupo: str = Field(default="Todos", max_length=50)
    
    @validator('selected_proy', 'selected_modulo', 'selected_grupo')
    def validate_filter_values(cls, v):
        if v and not re.match(r'^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_]+$', v):
            raise ValueError('Filter value contains invalid characters')
        return v 