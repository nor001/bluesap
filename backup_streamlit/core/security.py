"""
Security Validator for SAP Gestion
Operational Layer - Security-First Validation
"""

import re
import html
from typing import Any, Dict, List, Optional
from pathlib import Path
import pandas as pd
from .exceptions import SecurityError, ValidationError

class SecurityValidator:
    """Security-first input validation and sanitization"""
    
    # Security patterns
    ALLOWED_FILE_EXTENSIONS = {'.csv', '.xlsx', '.xls'}
    MAX_FILE_SIZE_MB = 50
    ALLOWED_COLUMNS = {
        # Core columns
        'PROY', 'Módulo', 'grupo_dev', 'plan_abap_dev_time', 'esfu_disponible',
        'plan_abap_dev_ini', 'plan_abap_dev_fin', 'plan_abap_pu_time',
        'available_test_date', 'plan_abap_pu_ini', 'plan_abap_pu_fin',
        'Titulo', 'abap_asignado', 'real_abap_dev_ini', 'real_abap_pu_ini',
        
        # Additional project columns
        'Frente', 'Mesa Principal', 'Mesas Adicionales', 'Bloque', 'Orden', 'ID',
        'Descripción', 'Tiempo Consultor Funcional', 'Tipo de Desarrollo',
        'Sistema Destino / Origen', 'Tipos desarrollo 2', 'Criticidad',
        'Estatus RFP', 'Go Live', 'TI', 'PO', 'Key User ',
        
        # Date columns
        'Fecha Inicio Plan', 'Fecha Fin Plan', ' Fecha Fin Replan ',
        'Fecha Fin Real', 'Fecha Inicio Plan Desarrollo', 'Fecha Fin Plan Desarrollo',
        'Fecha Fin Desarrollo', 'Fecha Fin Plan v2 Dev', 'Fecha Aprobacion Plan *',
        'Fecha Aprobacion Real', 'Fecha Aprobacion Real *', 'Fecha de probación Replan',
        'Fecha envío a Pluz Plan', 'Fech envío a Pluz Real',
        
        # Consultant columns
        'Consultor NTT', 'Fech. Ini. Plan Consultor', 'Fech. Fin Plan Consultor',
        'Fech. Fin Replan Consultor',
        
        # Status and observations
        'Estatus REQ', 'Estatus Final EF', 'Estatus Desarrollo',
        'Observaciones/Comentarios1', 'Observaciones', 'Observaciones2',
        'Comentario',
        
        # Resource and assignment
        'Recurso ABAP', 'abap_asignado', 'real_abap_dev_fin',
        
        # CPI columns
        'plan_cpi_dev_time', 'plan_cpi_pu_time', 'plan_cpi_dev_ini',
        'plan_cpi_dev_fin', 'real_cpi_pu_ini', 'real_cpi_pu_fin',
        
        # Additional fields
        'Semana', 'Transacción', 'Clave', 'pu_ini'
    }
    
    @staticmethod
    def validate_file_upload(uploaded_file) -> bool:
        """Validate uploaded file security"""
        if not uploaded_file:
            raise SecurityError("No file provided")
        
        # Check file extension
        file_extension = Path(uploaded_file.name).suffix.lower()
        if file_extension not in SecurityValidator.ALLOWED_FILE_EXTENSIONS:
            raise SecurityError(f"Invalid file type: {file_extension}")
        
        # Check file size (50MB limit)
        file_size_mb = len(uploaded_file.getvalue()) / (1024 * 1024)
        if file_size_mb > SecurityValidator.MAX_FILE_SIZE_MB:
            raise SecurityError(f"File too large: {file_size_mb:.1f}MB (max {SecurityValidator.MAX_FILE_SIZE_MB}MB)")
        
        return True
    
    @staticmethod
    def validate_dataframe(df: pd.DataFrame) -> bool:
        """Validate dataframe security and structure"""
        if df is None or df.empty:
            raise ValidationError("DataFrame is empty or None")
        
        # Check for required columns
        required_columns = {'PROY', 'Módulo'}
        missing_columns = required_columns - set(df.columns)
        if missing_columns:
            raise ValidationError(f"Missing required columns: {missing_columns}")
        
        # Check for suspicious columns (only flag truly suspicious ones)
        suspicious_columns = set(df.columns) - SecurityValidator.ALLOWED_COLUMNS
        # Only raise error for columns that are clearly suspicious (containing script patterns)
        truly_suspicious = set()
        for col in suspicious_columns:
            if any(pattern in col.lower() for pattern in ['script', 'javascript', 'onclick', 'onload', 'eval']):
                truly_suspicious.add(col)
        
        if truly_suspicious:
            raise SecurityError(f"Suspicious columns detected: {truly_suspicious}")
        
        # Validate data types and content
        for col in df.columns:
            if col in ['PROY', 'Módulo', 'grupo_dev']:
                SecurityValidator._validate_text_column(df[col], col)
        
        return True
    
    @staticmethod
    def _validate_text_column(series: pd.Series, column_name: str) -> None:
        """Validate text column content"""
        for value in series.dropna():
            if not isinstance(value, str):
                raise ValidationError(f"Invalid data type in {column_name}: {type(value)}")
            
            # Check for suspicious patterns
            if len(value) > 1000:  # Prevent extremely long strings
                raise SecurityError(f"Value too long in {column_name}")
            
            # Check for script injection patterns
            suspicious_patterns = [
                r'<script', r'javascript:', r'on\w+\s*=', r'data:text/html',
                r'vbscript:', r'<iframe', r'<object', r'<embed'
            ]
            
            for pattern in suspicious_patterns:
                if re.search(pattern, str(value), re.IGNORECASE):
                    raise SecurityError(f"Suspicious content detected in {column_name}")
    
    @staticmethod
    def sanitize_input(value: Any) -> str:
        """Sanitize user input"""
        if value is None:
            return ""
        
        # Convert to string and escape HTML
        sanitized = html.escape(str(value))
        
        # Remove null bytes and control characters
        sanitized = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', sanitized)
        
        return sanitized.strip()
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        if not email:
            return False
        
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(email_pattern, email))
    
    @staticmethod
    def validate_user_permissions(user: Dict[str, Any], required_permission: str) -> bool:
        """Validate user permissions"""
        if not user or not user.get('is_authenticated'):
            return False
        
        permissions = user.get('permissions', [])
        return required_permission in permissions or 'admin' in permissions 