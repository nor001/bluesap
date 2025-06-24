"""
SAP Gestion - Main Page
Operational Layer - Simple Welcome Page
"""

import streamlit as st

# Config
st.set_page_config(
    page_title="PLUZ SAP",
    page_icon="🏢",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Mensaje de bienvenida simple
st.title("🏢 Consultor SAP")
st.markdown("""
## Recursos útiles

- [SAP - CDS Views](https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/ee6ff9b281d8448f96b4fe6c89f2bdc8/5418de55938d1d22e10000000a44147b.html)

## Aplicaciones disponibles

- **📅 Planificación**: Gestión de proyectos y asignación de recursos
- **📊 Reportes**: Análisis y visualización de datos
- **⚙️ Configuración**: Ajustes del sistema
""")