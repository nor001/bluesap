"""
Data Service for SAP Gestion
Operational Layer - Secure Data Processing
"""

import pandas as pd
import streamlit as st
from typing import Optional, Dict, Any
from datetime import datetime
import io
from pathlib import Path

from core.security import SecurityValidator
from core.exceptions import SecurityError, ValidationError, DataProcessingError
from core.config import AppConfig

class DataService:
    """Secure data processing service with AI-optimized operations"""
    
    def __init__(self):
        self.security_validator = SecurityValidator()
    
    def load_csv_data(self, plan_config) -> pd.DataFrame:
        """Load and validate CSV data with security checks"""
        try:
            # Check if data is already in session state
            if 'uploaded_csv_data' in st.session_state and st.session_state['uploaded_csv_data'] is not None:
                df = pd.read_csv(io.StringIO(st.session_state['uploaded_csv_data']))
            else:
                # Load from default file - use the same logic as the old version
                csv_file = Path("Matriz de RICEFWs(Plan de ESFU).csv")
                
                if not csv_file.exists():
                    # If file doesn't exist, show file uploader like the old version
                    if 'uploaded_csv_data' not in st.session_state:
                        uploaded_file = st.file_uploader("📤 Upload your CSV file:", type=['csv'])
                        if uploaded_file is not None:
                            try:
                                # Try with header=3 first (like the old version)
                                df = pd.read_csv(uploaded_file, encoding='utf-8', sep=',', header=3)
                            except Exception:
                                try:
                                    df = pd.read_csv(uploaded_file, encoding='latin-1', sep=';', header=3)
                                except Exception as e:
                                    st.error(f"Error reading CSV: {e}")
                                    return pd.DataFrame()
                            
                            st.session_state['uploaded_csv_data'] = df.to_csv(index=False)
                            st.session_state['uploaded_csv_name'] = uploaded_file.name
                            st.rerun()
                        return pd.DataFrame()
                    else:
                        # Convert string back to DataFrame
                        df = pd.read_csv(io.StringIO(st.session_state['uploaded_csv_data']))
                        return df
                
                st.info(f"Loading data from: {csv_file}")
                
                # Use the same logic as the old version: header=3
                try:
                    df = pd.read_csv(csv_file, encoding='utf-8', sep=',', header=3)
                except Exception:
                    try:
                        df = pd.read_csv(csv_file, encoding='latin-1', sep=';', header=3)
                    except Exception as e:
                        st.error(f"Error reading CSV: {e}")
                        return pd.DataFrame()
                
                # Clean column names
                df.columns = df.columns.str.strip()
                
                # Remove rows where PROY is empty or contains non-data values
                df = df[df['PROY'].notna() & (df['PROY'] != '') & (df['PROY'] != 'PROY')]
                
                st.session_state['uploaded_csv_data'] = df.to_csv(index=False)
                st.session_state['uploaded_csv_name'] = csv_file.name
            
            # Security validation
            try:
                self.security_validator.validate_dataframe(df)
            except Exception as e:
                st.warning(f"Security validation warning: {e}")
            
            # Data normalization
            df = self._normalize_dataframe(df, plan_config)
            
            return df
            
        except Exception as e:
            st.error(f"Failed to load CSV data: {e}")
            return pd.DataFrame()
    
    def _normalize_dataframe(self, df: pd.DataFrame, plan_config) -> pd.DataFrame:
        """Normalize dataframe for consistent processing"""
        try:
            # Ensure required columns exist
            required_cols = ['PROY', 'Módulo']
            for col in required_cols:
                if col not in df.columns:
                    df[col] = ''
            
            # Normalize date columns with proper format handling
            date_columns = [
                plan_config.available_date_col,
                plan_config.plan_date_col,
                plan_config.start_date_col,
                plan_config.end_date_col
            ]
            
            for col in date_columns:
                if col in df.columns:
                    try:
                        # Handle dd/mm/yyyy format explicitly
                        df[col] = pd.to_datetime(df[col], format='%d/%m/%Y', errors='coerce')
                        # If that fails, try other common formats
                        if df[col].isna().all():
                            df[col] = pd.to_datetime(df[col], errors='coerce')
                        
                        valid_dates = df[col].notna().sum()
                    except Exception as e:
                        df[col] = pd.NaT
                else:
                    df[col] = ''
            
            # Normalize numeric columns
            if plan_config.hours_col in df.columns:
                df[plan_config.hours_col] = pd.to_numeric(df[plan_config.hours_col], errors='coerce').fillna(0)
            
            # Clean text columns
            text_columns = ['PROY', 'Módulo', 'grupo_dev', 'Titulo']
            for col in text_columns:
                if col in df.columns:
                    df[col] = df[col].astype(str).apply(self.security_validator.sanitize_input)
            
            return df
            
        except Exception as e:
            st.error(f"Failed to normalize dataframe: {e}")
            return pd.DataFrame()
    
    def apply_filters(self, df: pd.DataFrame, filters: Dict[str, str]) -> pd.DataFrame:
        """Apply filters with security validation"""
        try:
            df_filtered = df.copy()
            
            # Apply project filter
            if filters.get('selected_proy') and filters['selected_proy'] != "Todos":
                df_filtered = df_filtered[df_filtered["PROY"] == filters['selected_proy']]
            
            # Apply module filter
            if filters.get('selected_modulo') and filters['selected_modulo'] != "Todos":
                df_filtered = df_filtered[df_filtered["Módulo"] == filters['selected_modulo']]
            
            # Apply group filter
            if filters.get('selected_grupo') and filters['selected_grupo'] != "Todos" and "grupo_dev" in df_filtered.columns:
                df_filtered = df_filtered[df_filtered["grupo_dev"] == filters['selected_grupo']]
            
            return df_filtered
            
        except Exception as e:
            raise DataProcessingError(f"Failed to apply filters: {e}")
    
    def export_data(self, df: pd.DataFrame, filename: str) -> bytes:
        """Export data with security validation"""
        try:
            # Validate dataframe before export
            self.security_validator.validate_dataframe(df)
            
            # Export to CSV with UTF-8 BOM for Excel compatibility
            csv_data = df.to_csv(index=False, encoding='utf-8-sig')
            return csv_data.encode('utf-8-sig')
            
        except Exception as e:
            raise DataProcessingError(f"Failed to export data: {e}")
    
    def get_filter_options(self, df: pd.DataFrame) -> Dict[str, list]:
        """Get filter options with security validation"""
        try:
            options = {
                'proy_options': ["Todos"] + sorted(df["PROY"].dropna().unique().tolist()),
                'modulo_options': ["Todos"] + sorted(df["Módulo"].dropna().unique().tolist()),
            }
            
            if "grupo_dev" in df.columns:
                options['grupo_options'] = ["Todos"] + sorted(df["grupo_dev"].dropna().unique().tolist())
            else:
                options['grupo_options'] = ["Todos"]
            
            return options
            
        except Exception as e:
            raise DataProcessingError(f"Failed to get filter options: {e}") 