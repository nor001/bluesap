import streamlit as st
import pandas as pd
import os
from pathlib import Path
import re

CSV_FILENAME = "Matriz de RICEFWs(Plan de ESFU).csv"

def parse_date_with_format(date_series, date_format='dd.mm.yyyy'):
    """
    Parse dates with a specific format and multiple possible separators.
    """
    # Define possible formats for each style
    if date_format == 'dd.mm.yyyy':
        fmts = ['%d.%m.%Y', '%d/%m/%Y', '%d-%m-%Y']
    elif date_format == 'mm.dd.yyyy':
        fmts = ['%m.%d.%Y', '%m/%d/%Y', '%m-%d-%Y']
    else:
        return pd.to_datetime(date_series, errors='coerce')

    # Try each format until one works for each value
    for fmt in fmts:
        parsed = pd.to_datetime(date_series, format=fmt, errors='coerce')
        if parsed.notna().sum() == len(date_series.dropna()):
            return parsed
    # If none worked for all, return the one with most parsed
    best = None
    best_count = -1
    for fmt in fmts:
        parsed = pd.to_datetime(date_series, format=fmt, errors='coerce')
        count = parsed.notna().sum()
        if count > best_count:
            best = parsed
            best_count = count
    return best


@st.cache_data
def process_csv_data(csv_data, plan_config, source_name="file", date_format=None):
    """Process CSV data, ensuring all necessary columns exist according to plan_config."""
    try:
        df_original = pd.read_csv(csv_data, encoding='utf-8', sep=',', header=3)
    except Exception:
        try:
            df_original = pd.read_csv(csv_data, encoding='latin-1', sep=';', header=3)
        except Exception as e:
            st.error(f"Error reading CSV: {e}")
            return pd.DataFrame()

    df_original.columns = df_original.columns.str.strip()

    # --- Column Normalization ---
    required_columns = {
        plan_config["available_date_col"]: "datetime",
        plan_config["plan_date_col"]: "datetime",
        plan_config["start_date_col"]: "datetime",
        plan_config["end_date_col"]: "datetime",
        plan_config["hours_col"]: "numeric",
        plan_config["resource_col"]: "object",
    }

    for col, col_type in required_columns.items():
        if col not in df_original.columns:
            df_original[col] = pd.NaT if col_type == "datetime" else (0 if col_type == "numeric" else None)
        if col_type == "datetime":
            df_original[col] = parse_date_with_format(df_original[col], 'dd.mm.yyyy')
        elif col_type == "numeric":
            df_original[col] = pd.to_numeric(df_original[col], errors='coerce').fillna(0)

    df_original = df_original.dropna(how="all")
    return df_original


def load_csv_data(plan_config, date_format=None):
    """Load CSV data from local file or allow file upload."""
    csv_file = os.path.join(os.path.dirname(__file__), "..", CSV_FILENAME)
    if os.path.exists(csv_file):
        return process_csv_data(csv_file, plan_config, "default file", date_format)
    else:
        if 'uploaded_csv_data' not in st.session_state:
            uploaded_file = st.file_uploader("📤 Upload your CSV file:", type=['csv'])
            if uploaded_file is not None:
                st.session_state['uploaded_csv_data'] = process_csv_data(uploaded_file, plan_config, uploaded_file.name, date_format)
                st.session_state['uploaded_csv_name'] = uploaded_file.name
                st.rerun()
            return pd.DataFrame()
        else:
            st.success(f"📁 File loaded: {st.session_state.get('uploaded_csv_name', 'CSV')}")
            return st.session_state['uploaded_csv_data']


def normalize_date_columns(df, plan_config, date_format=None):
    """Normalize date column types to avoid pyarrow/streamlit errors."""
    date_columns = [
        plan_config["available_date_col"],
        plan_config["plan_date_col"],
        plan_config["start_date_col"],
        plan_config["end_date_col"]
    ]
    for col in date_columns:
        if col in df.columns:
            df[col] = parse_date_with_format(df[col], 'dd.mm.yyyy')
    return df 