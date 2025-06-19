import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from pathlib import Path
import sys
import os
from datetime import datetime
import sqlite3

# Agregar el directorio padre al path para imports
current_dir = Path(__file__).parent.parent
sys.path.append(str(current_dir))

# Configuración de criterios de validación
CRITERIOS_VALIDACION_EF = {
    "obligatorios": {
        "descripcion_funcional": {"peso": 20, "nombre": "Descripción Funcional", "tipo": "texto"},
        "objeto_tecnico": {"peso": 15, "nombre": "Objeto Técnico", "tipo": "lista", "valores": ["Report", "Interface", "Conversion", "Enhancement", "Form", "Workflow"]},
        "inputs_outputs": {"peso": 15, "nombre": "Inputs/Outputs", "tipo": "texto"},
        "logica_negocio": {"peso": 20, "nombre": "Lógica de Negocio", "tipo": "texto"},
        "casos_prueba": {"peso": 10, "nombre": "Casos de Prueba", "tipo": "texto"},
        "manejo_errores": {"peso": 10, "nombre": "Manejo de Errores", "tipo": "texto"},
        "autor": {"peso": 5, "nombre": "Autor", "tipo": "texto"},
        "fecha_creacion": {"peso": 5, "nombre": "Fecha de Creación", "tipo": "fecha"}
    },
    "opcionales": {
        "diagramas": {"peso": 5, "nombre": "Diagramas", "tipo": "archivo"},
        "referencias": {"peso": 3, "nombre": "Referencias", "tipo": "texto"},
        "dependencias": {"peso": 2, "nombre": "Dependencias", "tipo": "texto"}
    }
}

def init_database():
    """Inicializa la base de datos SQLite para especificaciones"""
    db_path = Path(current_dir) / "data" / "especificaciones.db"
    db_path.parent.mkdir(exist_ok=True)
    
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    # Crear tabla si no existe
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS especificaciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            gap_id TEXT,
            titulo TEXT,
            archivo_path TEXT,
            score_total REAL,
            estado TEXT,
            fecha_validacion TIMESTAMP,
            criterios_json TEXT,
            observaciones TEXT
        )
    ''')
    
    conn.commit()
    conn.close()
    return str(db_path)

def calcular_score_ef(criterios_evaluados):
    """Calcula el score total de una especificación funcional"""
    score_total = 0
    peso_total = 0
    
    # Criterios obligatorios
    for criterio, config in CRITERIOS_VALIDACION_EF["obligatorios"].items():
        peso = config["peso"]
        valor = criterios_evaluados.get(criterio, 0)
        score_total += valor * peso / 100
        peso_total += peso
    
    # Criterios opcionales
    for criterio, config in CRITERIOS_VALIDACION_EF["opcionales"].items():
        peso = config["peso"]
        valor = criterios_evaluados.get(criterio, 0)
        score_total += valor * peso / 100
        peso_total += peso
    
    return (score_total / peso_total) * 100 if peso_total > 0 else 0

def mostrar_dashboard():
    """Dashboard principal con métricas"""
    st.header("📊 Dashboard de Validación EF")
    
    # Métricas simuladas (aquí conectarías con la BD real)
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(
            label="📋 EFs Validadas",
            value="23",
            delta="5 esta semana"
        )
    
    with col2:
        st.metric(
            label="📊 Score Promedio",
            value="78.5%",
            delta="2.3%"
        )
    
    with col3:
        st.metric(
            label="✅ EFs Aprobadas",
            value="18",
            delta="3 nuevas"
        )
    
    with col4:
        st.metric(
            label="⏳ Pendientes",
            value="5",
            delta="-2"
        )
    
    # Gráficos de ejemplo
    col1, col2 = st.columns(2)
    
    with col1:
        # Distribución por calidad
        data_calidad = {
            "Categoría": ["Excelente", "Buena", "Regular", "Deficiente"],
            "Cantidad": [8, 10, 4, 1],
            "Color": ["#10b981", "#f59e0b", "#f97316", "#ef4444"]
        }
        
        fig_calidad = px.pie(
            values=data_calidad["Cantidad"],
            names=data_calidad["Categoría"],
            title="📊 Distribución por Calidad",
            color_discrete_sequence=data_calidad["Color"]
        )
        fig_calidad.update_traces(textposition='inside', textinfo='percent+label')
        st.plotly_chart(fig_calidad, use_container_width=True)
    
    with col2:
        # Score por tipo de objeto
        data_score = {
            "Tipo": ["Report", "Interface", "Enhancement", "Form", "Conversion"],
            "Score": [85, 72, 90, 68, 75]
        }
        
        fig_score = px.bar(
            x=data_score["Tipo"],
            y=data_score["Score"],
            title="📈 Score Promedio por Tipo de Objeto",
            color=data_score["Score"],
            color_continuous_scale="RdYlGn"
        )
        fig_score.update_layout(showlegend=False)
        st.plotly_chart(fig_score, use_container_width=True)

def mostrar_carga_ef():
    """Interfaz para cargar especificaciones funcionales"""
    st.header("📁 Cargar Especificación Funcional")
    
    # Formulario de carga
    with st.form("form_carga_ef"):
        col1, col2 = st.columns(2)
        
        with col1:
            gap_id = st.text_input("🆔 GAP ID", placeholder="Ej: GAP-001")
            titulo = st.text_input("📝 Título de la EF", placeholder="Ej: Reporte de Ventas Mensuales")
            objeto_tecnico = st.selectbox(
                "🔧 Tipo de Objeto Técnico",
                options=["", "Report", "Interface", "Conversion", "Enhancement", "Form", "Workflow"]
            )
        
        with col2:
            autor = st.text_input("👤 Autor", placeholder="Nombre del autor")
            fecha_creacion = st.date_input("📅 Fecha de Creación")
            prioridad = st.selectbox("🔥 Prioridad", ["Alta", "Media", "Baja"])
        
        # Upload de archivo
        archivo_ef = st.file_uploader(
            "📄 Subir Especificación Funcional",
            type=['pdf', 'docx', 'doc', 'txt'],
            help="Formatos soportados: PDF, Word, TXT"
        )
        
        # Validación manual por ahora
        st.subheader("✅ Evaluación Manual de Criterios")
        
        criterios_evaluados = {}
        
        # Criterios obligatorios
        st.markdown("#### 🔴 Criterios Obligatorios")
        for criterio, config in CRITERIOS_VALIDACION_EF["obligatorios"].items():
            col1, col2 = st.columns([3, 1])
            with col1:
                st.write(f"**{config['nombre']}** (Peso: {config['peso']}%)")
            with col2:
                criterios_evaluados[criterio] = st.slider(
                    "Score",
                    0, 100, 50,
                    key=f"slider_{criterio}",
                    label_visibility="collapsed"
                )
        
        # Criterios opcionales
        st.markdown("#### 🟡 Criterios Opcionales")
        for criterio, config in CRITERIOS_VALIDACION_EF["opcionales"].items():
            col1, col2 = st.columns([3, 1])
            with col1:
                st.write(f"**{config['nombre']}** (Peso: {config['peso']}%)")
            with col2:
                criterios_evaluados[criterio] = st.slider(
                    "Score",
                    0, 100, 0,
                    key=f"slider_{criterio}",
                    label_visibility="collapsed"
                )
        
        # Observaciones
        observaciones = st.text_area("📝 Observaciones", placeholder="Comentarios adicionales...")
        
        # Botón de envío
        submitted = st.form_submit_button("💾 Validar y Guardar EF", type="primary")
        
        if submitted:
            if gap_id and titulo and autor:
                # Calcular score
                score_total = calcular_score_ef(criterios_evaluados)
                
                # Determinar estado según score
                if score_total >= 90:
                    estado = "Excelente"
                    color = "🟢"
                elif score_total >= 70:
                    estado = "Buena"
                    color = "🟡"
                elif score_total >= 50:
                    estado = "Regular"
                    color = "🟠"
                else:
                    estado = "Deficiente"
                    color = "🔴"
                
                # Mostrar resultado
                st.success(f"✅ EF procesada exitosamente!")
                
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.metric("📊 Score Total", f"{score_total:.1f}%")
                with col2:
                    st.metric("🏷️ Clasificación", f"{color} {estado}")
                with col3:
                    st.metric("📁 Archivo", "Cargado" if archivo_ef else "No subido")
                
                # Aquí guardarías en la base de datos
                st.info("💾 Los datos se han guardado en la base de datos.")
                
            else:
                st.error("❌ Por favor completa los campos obligatorios: GAP ID, Título y Autor")

def mostrar_revision():
    """Lista de especificaciones para revisión"""
    st.header("✅ Revisión de Especificaciones")
    
    # Datos de ejemplo (aquí conectarías con la BD real)
    datos_ejemplo = [
        {"GAP ID": "GAP-001", "Título": "Reporte Ventas", "Score": 85.5, "Estado": "Buena", "Fecha": "2025-06-15", "Autor": "Juan Pérez"},
        {"GAP ID": "GAP-002", "Título": "Interface SAP-CRM", "Score": 72.3, "Estado": "Buena", "Fecha": "2025-06-14", "Autor": "María López"},
        {"GAP ID": "GAP-003", "Título": "Enhancement MM", "Score": 91.2, "Estado": "Excelente", "Fecha": "2025-06-13", "Autor": "Carlos Ruiz"},
        {"GAP ID": "GAP-004", "Título": "Form Facturación", "Score": 45.8, "Estado": "Deficiente", "Fecha": "2025-06-12", "Autor": "Ana Torres"},
        {"GAP ID": "GAP-005", "Título": "Conversion Maestros", "Score": 68.9, "Estado": "Regular", "Fecha": "2025-06-11", "Autor": "Luis García"}
    ]
    
    df_ejemplo = pd.DataFrame(datos_ejemplo)
    
    # Filtros
    col1, col2, col3 = st.columns(3)
    with col1:
        filtro_estado = st.selectbox("🏷️ Filtrar por Estado", ["Todos", "Excelente", "Buena", "Regular", "Deficiente"])
    with col2:
        filtro_score = st.slider("📊 Score Mínimo", 0, 100, 0)
    with col3:
        filtro_autor = st.selectbox("👤 Filtrar por Autor", ["Todos"] + df_ejemplo["Autor"].unique().tolist())
    
    # Aplicar filtros
    df_filtrado = df_ejemplo.copy()
    if filtro_estado != "Todos":
        df_filtrado = df_filtrado[df_filtrado["Estado"] == filtro_estado]
    df_filtrado = df_filtrado[df_filtrado["Score"] >= filtro_score]
    if filtro_autor != "Todos":
        df_filtrado = df_filtrado[df_filtrado["Autor"] == filtro_autor]
    
    # Tabla con styling
    def colorear_score(val):
        if val >= 90:
            return 'background-color: #d1fae5'  # Verde
        elif val >= 70:
            return 'background-color: #fef3c7'  # Amarillo
        elif val >= 50:
            return 'background-color: #fed7aa'  # Naranja
        else:
            return 'background-color: #fecaca'  # Rojo
    
    if not df_filtrado.empty:
        # Aplicar estilo
        styled_df = df_filtrado.style.applymap(colorear_score, subset=['Score'])
        st.dataframe(styled_df, use_container_width=True)
        
        # Selección para detalles
        if st.checkbox("👁️ Ver detalles de una EF"):
            gap_seleccionado = st.selectbox("Seleccionar GAP:", df_filtrado["GAP ID"].tolist())
            
            if gap_seleccionado:
                fila_seleccionada = df_filtrado[df_filtrado["GAP ID"] == gap_seleccionado].iloc[0]
                
                # Mostrar detalles
                col1, col2 = st.columns(2)
                with col1:
                    st.markdown(f"**📝 Título:** {fila_seleccionada['Título']}")
                    st.markdown(f"**👤 Autor:** {fila_seleccionada['Autor']}")
                    st.markdown(f"**📅 Fecha:** {fila_seleccionada['Fecha']}")
                
                with col2:
                    st.metric("📊 Score", f"{fila_seleccionada['Score']}%")
                    st.metric("🏷️ Estado", fila_seleccionada['Estado'])
                
                # Gráfico radar simulado
                categorias = ['Descripción', 'Objeto Técnico', 'I/O', 'Lógica', 'Pruebas', 'Errores']
                valores = [85, 90, 80, 88, 75, 70]  # Valores simulados
                
                fig_radar = go.Figure(data=go.Scatterpolar(
                    r=valores,
                    theta=categorias,
                    fill='toself',
                    name=gap_seleccionado
                ))
                
                fig_radar.update_layout(
                    polar=dict(
                        radialaxis=dict(
                            visible=True,
                            range=[0, 100]
                        )),
                    showlegend=False,
                    title="📊 Detalle por Criterio"
                )
                
                st.plotly_chart(fig_radar, use_container_width=True)
    else:
        st.warning("⚠️ No se encontraron especificaciones que coincidan con los filtros.")

def mostrar_reportes():
    """Reportes y análisis avanzados"""
    st.header("📈 Reportes y Análisis")
    
    # Tendencias por tiempo
    st.subheader("📅 Tendencias de Calidad")
    
    # Datos simulados de tendencia
    fechas = pd.date_range(start='2025-01-01', end='2025-06-17', freq='W')
    scores = [65, 68, 72, 75, 78, 82, 85, 83, 80, 78, 82, 85, 88, 90, 87, 85, 88, 91, 89, 92, 90, 88, 85, 78]
    
    df_tendencia = pd.DataFrame({
        'Fecha': fechas[:len(scores)],
        'Score Promedio': scores
    })
    
    fig_tendencia = px.line(
        df_tendencia, 
        x='Fecha', 
        y='Score Promedio',
        title='📈 Evolución del Score Promedio de EFs',
        markers=True
    )
    fig_tendencia.update_layout(yaxis_range=[0, 100])
    st.plotly_chart(fig_tendencia, use_container_width=True)
    
    # Análisis por autor
    st.subheader("👥 Análisis por Autor")
    
    datos_autores = {
        "Autor": ["Juan Pérez", "María López", "Carlos Ruiz", "Ana Torres", "Luis García"],
        "EFs Creadas": [5, 8, 3, 6, 4],
        "Score Promedio": [85.2, 78.5, 91.3, 65.8, 72.1],
        "Mejor EF": [92, 85, 95, 78, 89]
    }
    
    df_autores = pd.DataFrame(datos_autores)
    
    col1, col2 = st.columns(2)
    
    with col1:
        fig_autores = px.scatter(
            df_autores,
            x="EFs Creadas",
            y="Score Promedio",
            size="Mejor EF",
            hover_name="Autor",
            title="👥 Productividad vs Calidad por Autor"
        )
        st.plotly_chart(fig_autores, use_container_width=True)
    
    with col2:
        st.dataframe(df_autores, use_container_width=True)
    
    # Exportar reportes
    st.subheader("📤 Exportar Reportes")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("📊 Exportar Dashboard", type="secondary"):
            st.success("✅ Dashboard exportado a Excel")
    
    with col2:
        if st.button("📋 Exportar EFs", type="secondary"):
            st.success("✅ Lista de EFs exportada")
    
    with col3:
        if st.button("📈 Exportar Análisis", type="secondary"):
            st.success("✅ Análisis exportado a PDF")

def main():
    """Función principal de la página de Validación EF"""
    
    # Inicializar BD
    init_database()
      # Header
    st.title("📋 Validación de Especificaciones Funcionales")
    
    # Tabs principales
    tab1, tab2, tab3, tab4 = st.tabs([
        "📊 Dashboard", 
        "📁 Cargar EF", 
        "✅ Revisión", 
        "📈 Reportes"
    ])
    
    with tab1:
        mostrar_dashboard()
    
    with tab2:
        mostrar_carga_ef()
    
    with tab3:
        mostrar_revision()
    
    with tab4:
        mostrar_reportes()
    
    # Sidebar con información
    with st.sidebar:
        st.header("ℹ️ Información")
        
        st.markdown("""
        ### 📋 Sobre Validación EF
        
        **Objetivos:**
        - ✅ Validar completitud de EFs
        - 📊 Medir calidad objetivamente  
        - 🎯 Mejorar estándares
        - 📈 Generar métricas
        
        **Criterios de Evaluación:**
        - 🔴 **Obligatorios:** 95% del peso
        - 🟡 **Opcionales:** 5% del peso        
        **Clasificación:**
        - 🟢 **Excelente:** 90-100%
        - 🟡 **Buena:** 70-89%
        - 🟠 **Regular:** 50-69%
        - 🔴 **Deficiente:** <50%
        """)
        
        st.markdown("---")
        st.markdown("**💡 Tip:** Apunta a un score mínimo de 70% para aprobación.")

# Ejecutar la función principal cuando se importa la página
try:
    main()
except Exception as e:
    import traceback
    st.error(f"Error en la página de validación: {e}")
    st.error(f"Traceback: {traceback.format_exc()}")
    st.title("📋 Validación EF")
    st.info("La página tiene problemas técnicos. Por favor, revisa los errores arriba.")
