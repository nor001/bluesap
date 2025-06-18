import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import os
from datetime import datetime, timedelta
from pathlib import Path
import sys

# Agregar el directorio padre al path para imports
current_dir = Path(__file__).parent.parent
sys.path.append(str(current_dir))

CSV_FILENAME = "Matriz de RICEFWs(Plan de ESFU).csv"

# Configuración de desarrolladores para grupo_dev GRID
DESARROLLADORES_CONFIG_GRID = {
    "Fabricio Sánchez": {"nivel": "SENIOR", "max_tareas": 15, "color": "#FF6B6B"},
    "Oscar Castellanos": {"nivel": "SENIOR", "max_tareas": 15, "color": "#4ECDC4"},
    "Gabriel Huamani": {"nivel": "SENIOR", "max_tareas": 15, "color": "#45B7D1"},
    "Luiggi Gonzales": {"nivel": "SENIOR", "max_tareas": 15, "color": "#96CEB4"},
    "Norman Tinco": {"nivel": "SENIOR", "max_tareas": 4, "color": "#FFEAA7"},
    "senior6": {"nivel": "SENIOR", "max_tareas": 15, "color": "#DDA0DD"},
    "senior7": {"nivel": "SENIOR", "max_tareas": 15, "color": "#98D8C8"},
}

# Configuración de desarrolladores para grupo_dev FSM
DESARROLLADORES_CONFIG_FSM = {
    "FSM1": {"nivel": "SENIOR", "max_tareas": 15, "color": "#9370DB"},
    "FSM2": {"nivel": "SENIOR", "max_tareas": 15, "color": "#32CD32"},
}

# Configuración de desarrolladores para grupo_dev C4E
DESARROLLADORES_CONFIG_C4E = {
    "c4e1": {"nivel": "SENIOR", "max_tareas": 15, "color": "#FF6347"},
}

# Configuración de desarrolladores para grupo_dev ERP
DESARROLLADORES_CONFIG_ERP = {
    "Luis Ore": { "nivel": "SENIOR", "max_tareas": 6, "color": "#FF4500", },
    "Angel Burga": {"nivel": "SENIOR", "max_tareas": 15, "color": "#1E90FF"},
    "Richard Galán": {"nivel": "SEMI_SENIOR", "max_tareas": 12, "color": "#32CD32"},
    "Cesar Rivero": { "nivel": "SENIOR", "max_tareas": 7, "color": "#27AE60", },
}

# Configuración de desarrolladores para grupo_dev LOC
DESARROLLADORES_CONFIG_LOC = {
    "Jhonatan Colina": { "nivel": "PLENO", "max_tareas": 6, "color": "#FF7F50", },
    "Jose Aguilar": {"nivel": "PLENO", "max_tareas": 12, "color": "#20B2AA"},
}

# Configuración de desarrolladores para grupo_dev PORTAL
DESARROLLADORES_CONFIG_PORTAL = {
    "Jhonatan Colina": { "nivel": "PLENO", "max_tareas": 6, "color": "#FF7F50", },
    "Jorge Clemente": {"nivel": "JUNIOR", "max_tareas": 8, "color": "#FFB347"},
    "Jose Urbina": {"nivel": "JUNIOR", "max_tareas": 8, "color": "#87CEEB"},
}

# Configuración de desarrolladores para grupo_dev HCM
DESARROLLADORES_CONFIG_HCM = {
    "Cesar Rivero": { "nivel": "SENIOR", "max_tareas": 7, "color": "#27AE60", },
    "Katheryn Quiroz": { "nivel": "SEMI_SENIOR", "max_tareas": 12, "color": "#E91E63", },
}

# Configuración de desarrolladores para otros grupos
OTROS_DESARROLLADORES_CONFIG = {
    "junior1": {"nivel": "JUNIOR", "max_tareas": 10, "color": "#FF9999"},
    "junior2": {"nivel": "JUNIOR", "max_tareas": 10, "color": "#FFCC99"},
    "pleno1": {"nivel": "PLENO", "max_tareas": 12, "color": "#99CCFF"},
    "pleno2": {"nivel": "PLENO", "max_tareas": 12, "color": "#CC99FF"},
    "senior1": {"nivel": "SENIOR", "max_tareas": 15, "color": "#99FF99"},
    "senior2": {"nivel": "SENIOR", "max_tareas": 15, "color": "#FFFF99"},
}

# Configuración de fechas festivas en Perú
FECHAS_FESTIVAS_PERU = {
    "2025-07-28": "Día de la Independencia del Perú",
    "2025-07-29": "Día de las Glorias del Ejército",
    "2025-01-01": "Año Nuevo",
    "2025-05-01": "Día del Trabajador",
    "2025-12-08": "Inmaculada Concepción",
    "2025-12-25": "Navidad",
}

@st.cache_data
def procesar_csv_data(csv_data, source_name="archivo"):
    """Procesa datos CSV desde diferentes fuentes"""
    try:        # Intentar leer CSV con diferentes codificaciones y configuraciones
        df_original = None
        encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                # Primero intentar leer sin saltar filas (archivo ya procesado)
                df_test = pd.read_csv(csv_data, encoding=encoding, nrows=5)
                df_test.columns = df_test.columns.str.strip()
                
                # Verificar si tiene las columnas esperadas (ya procesado)
                columnas_esperadas = ['fecha_inicio_real', 'horas_abap_dev', 'grupo_dev', 'ID']
                tiene_columnas_esperadas = any(col in df_test.columns for col in columnas_esperadas)
                
                if tiene_columnas_esperadas:
                    # Archivo ya procesado, leer desde la fila 1
                    df_original = pd.read_csv(csv_data, encoding=encoding)
                else:
                    # Archivo original, leer saltando las primeras 3 filas
                    df_original = pd.read_csv(csv_data, skiprows=3, encoding=encoding)
                break
                
            except UnicodeDecodeError:
                continue
            except Exception as e:
                # Si falla la lectura sin skiprows, intentar con skiprows=3
                try:
                    df_original = pd.read_csv(csv_data, skiprows=3, encoding=encoding)
                    break
                except:
                    continue
                
        if df_original is None:
            st.error("❌ No se pudo leer el archivo CSV con ninguna codificación compatible")
            return pd.DataFrame()
        
        # Limpiar nombres de columnas (eliminar espacios extra y caracteres especiales)
        df_original.columns = df_original.columns.str.strip()
        
        # Conversión de fechas
        if "fecha_inicio_real" in df_original.columns:
            # Reemplazar valores problemáticos comunes
            df_original["fecha_inicio_real"] = df_original["fecha_inicio_real"].replace(
                ["#N/A", "nan", "", "NaN", "#VALUE!", "NULL", None], pd.NaT
            )

            # Intentar múltiples formatos de fecha
            fecha_original = df_original["fecha_inicio_real"].copy()

            # Formato DD/MM/YYYY
            df_original["fecha_inicio_real"] = pd.to_datetime(
                df_original["fecha_inicio_real"], format="%d/%m/%Y", errors="coerce"
            )

            # Si no funcionó, intentar DD-MM-YYYY
            if df_original["fecha_inicio_real"].isna().all():
                df_original["fecha_inicio_real"] = pd.to_datetime(
                    fecha_original, format="%d-%m-%Y", errors="coerce"
                )

            # Si no funcionó, intentar YYYY-MM-DD
            if df_original["fecha_inicio_real"].isna().all():
                df_original["fecha_inicio_real"] = pd.to_datetime(
                    fecha_original, format="%Y-%m-%d", errors="coerce"
                )

            # Si no funcionó, intentar formato automático
            if df_original["fecha_inicio_real"].isna().all():
                df_original["fecha_inicio_real"] = pd.to_datetime(
                    fecha_original, errors="coerce"
                )
            # Crear fechas por defecto si no hay fechas válidas
            if df_original["fecha_inicio_real"].isna().all():
                st.warning(
                    "⚠️ No se encontraron fechas válidas. Se usará fecha por defecto (hoy) para permitir asignaciones."
                )
                df_original["fecha_inicio_real"] = pd.Timestamp.now().date()
        else:
            # Si no existe la columna, crearla con fecha por defecto
            st.warning(
                "⚠️ No se encontró la columna 'fecha_inicio_real'. Se creará con fecha por defecto."
            )
            df_original["fecha_inicio_real"] = pd.Timestamp.now().date()

        # Conversión de horas (para todos los grupo_dev)
        if "horas_abap_dev" in df_original.columns:
            df_original["horas_abap_dev"] = pd.to_numeric(
                df_original["horas_abap_dev"], errors="coerce"
            ).fillna(
                8.0
            )  # Para grupo_dev que no sean GRID/HCM/ERP, usar columna de horas diferente si existe
        if "horas_desarrollo" in df_original.columns:
            df_original["horas_desarrollo"] = pd.to_numeric(
                df_original["horas_desarrollo"], errors="coerce"
            ).fillna(8.0)

        # Eliminar filas completamente vacías
        df_original = df_original.dropna(how="all")

        # Excluir filas con fecha_inicio_real anterior al 1 de enero de 2025 (datos erróneos)
        if "fecha_inicio_real" in df_original.columns:
            fecha_limite = pd.Timestamp("2025-01-01")

            # Identificar filas con fechas válidas pero anteriores a 2025
            fechas_validas = df_original["fecha_inicio_real"].notna()
            fechas_anteriores = df_original["fecha_inicio_real"] < fecha_limite
            filas_a_excluir = fechas_validas & fechas_anteriores

            if filas_a_excluir.sum() > 0:
                df_original = df_original[~filas_a_excluir]

        # Filtro final: ser más permisivo con las fechas
        if "fecha_inicio_real" in df_original.columns:
            # Solo eliminar filas si NO hay fechas válidas Y el DataFrame tiene más de 10 filas
            fechas_validas = df_original["fecha_inicio_real"].notna().sum()
            if fechas_validas > 0:
                df_final = (
                    df_original  # Mantener todas las filas, incluso las sin fecha
                )
            else:
                df_final = df_original  # Si no hay fechas válidas, mantener todo
        else:
            df_final = df_original

        return df_final

    except Exception as e:
        st.error(f"Error procesando CSV: {e}")
        return pd.DataFrame()


def cargar_datos_csv():
    """Carga datos CSV desde archivo local o permite subir archivo"""
    # Intentar cargar archivo por defecto
    csv_file = os.path.join(os.path.dirname(__file__), "..", CSV_FILENAME)
    
    if os.path.exists(csv_file):
        return procesar_csv_data(csv_file, "archivo por defecto")
    else:
        # Archivo no encontrado, usar session_state para manejar el estado
        if 'uploaded_csv_data' not in st.session_state:
            # Mostrar interfaz de subida solo si no hay archivo cargado
            st.warning(f"⚠️ No se encontró el archivo '{CSV_FILENAME}' en el directorio.")
            st.info("📤 Por favor, sube tu archivo CSV:")
            
            uploaded_file = st.file_uploader(
                "Selecciona el archivo CSV",
                type=['csv'],
                help="El archivo debe tener las mismas columnas que el archivo de ejemplo",
                key="csv_uploader"
            )
            
            if uploaded_file is not None:
                # Verificar que el archivo tenga contenido
                if uploaded_file.size > 0:
                    # Procesar y guardar en session_state
                    df_result = procesar_csv_data(uploaded_file, f"archivo subido '{uploaded_file.name}'")
                    if not df_result.empty:
                        # Guardar datos procesados en session_state
                        st.session_state['uploaded_csv_data'] = df_result
                        st.session_state['uploaded_csv_name'] = uploaded_file.name
                        st.rerun()  # Refrescar para limpiar la interfaz
                    return df_result
                else:
                    st.error("❌ El archivo está vacío")
                    return pd.DataFrame()
            else:
                st.info("👆 Selecciona un archivo CSV para continuar")
                return pd.DataFrame()
        else:
            # Ya hay un archivo cargado, mostrar solo mensaje limpio
            st.success(f"📁 Archivo cargado: {st.session_state.get('uploaded_csv_name', 'archivo CSV')}")
            return st.session_state['uploaded_csv_data']


def asignar_desarrolladores_por_grupo_dev(df):
    """Asignación inteligente separando PM/PS de otros grupo_dev"""
    # Crear una copia para trabajar sin afectar el original
    df_trabajo = df.copy()

    # Verificar si existe la columna abap_asignado, si no, crearla
    if "abap_asignado" not in df_trabajo.columns:
        df_trabajo["abap_asignado"] = None

    # Verificar si existen las columnas de fechas, si no, crearlas
    if "fecha_inicio_plan" not in df_trabajo.columns:
        df_trabajo["fecha_inicio_plan"] = None
    if "fecha_fin_plan" not in df_trabajo.columns:
        df_trabajo["fecha_fin_plan"] = None

    # PASO 1: Identificar qué filas YA TIENEN asignación y NUNCA las tocaremos
    mask_ya_asignadas = (
        df_trabajo["abap_asignado"].notna()
        & (df_trabajo["abap_asignado"] != "")
        & (df_trabajo["abap_asignado"] != "None")
        & (df_trabajo["abap_asignado"] != "nan")
    )
    # PASO 2: Calcular fechas para las tareas YA asignadas (solo si no tienen fechas)
    for idx in df_trabajo[mask_ya_asignadas].index:
        row = df_trabajo.loc[idx]
        if pd.isna(row.get("fecha_inicio_plan")) or pd.isna(row.get("fecha_fin_plan")):
            horas = row.get("horas_abap_dev", row.get("horas_desarrollo", 8.0))
            fecha_inicio = row.get("fecha_inicio_real")
            if pd.notna(fecha_inicio):
                inicio, fin = calcular_fechas_trabajo(fecha_inicio, horas)
                if inicio:
                    df_trabajo.loc[idx, "fecha_inicio_plan"] = inicio
                    df_trabajo.loc[idx, "fecha_fin_plan"] = (
                        fin  # PASO 3: Separar por grupo_dev y asignar
                    )
    indices_sin_asignar = df_trabajo[~mask_ya_asignadas].index
    df_sin_asignar = df_trabajo.loc[
        indices_sin_asignar
    ].copy()  # Ordenar por fecha_inicio_real si existe la columna y tiene datos válidos
    if "fecha_inicio_real" in df_sin_asignar.columns:
        try:
            # Intentar convertir a datetime si no lo está ya
            if not pd.api.types.is_datetime64_any_dtype(
                df_sin_asignar["fecha_inicio_real"]
            ):
                df_sin_asignar["fecha_inicio_real"] = pd.to_datetime(
                    df_sin_asignar["fecha_inicio_real"], errors="coerce"
                )
            # Ordenar solo si hay fechas válidas
            fechas_validas = df_sin_asignar["fecha_inicio_real"].notna().sum()
            if fechas_validas > 0:
                df_sin_asignar = df_sin_asignar.sort_values(
                    "fecha_inicio_real", na_last=True
                )
        except Exception as e:
            # Si no se puede ordenar, continuar sin ordenar
            pass

    # PASO 4: Asignar según tipo de grupo_dev
    for idx in df_sin_asignar.index:
        row = df_sin_asignar.loc[idx]
        grupo_dev = row.get("grupo_dev", "")

        # Determinar qué configuración usar según el grupo_dev
        if grupo_dev in ["grid"]:
            config_actual = DESARROLLADORES_CONFIG_GRID
            horas = row.get("horas_abap_dev", 8.0)
        elif grupo_dev == "hcm":
            config_actual = DESARROLLADORES_CONFIG_HCM
            horas = row.get("horas_abap_dev", 8.0)
        elif grupo_dev == "erp":
            config_actual = DESARROLLADORES_CONFIG_ERP
            horas = row.get("horas_abap_dev", 8.0)
        elif grupo_dev == "loc":
            config_actual = DESARROLLADORES_CONFIG_LOC
            horas = row.get("horas_desarrollo", row.get("horas_abap_dev", 8.0))
        elif grupo_dev == "portal":
            config_actual = DESARROLLADORES_CONFIG_PORTAL
            horas = row.get("horas_desarrollo", row.get("horas_abap_dev", 8.0))
        elif grupo_dev == "fsm":
            config_actual = DESARROLLADORES_CONFIG_FSM
            horas = row.get("horas_desarrollo", row.get("horas_abap_dev", 8.0))
        elif grupo_dev == "c4e":
            config_actual = DESARROLLADORES_CONFIG_C4E
            horas = row.get("horas_desarrollo", row.get("horas_abap_dev", 8.0))
        else:
            config_actual = OTROS_DESARROLLADORES_CONFIG
            horas = row.get(
                "horas_desarrollo", row.get("horas_abap_dev", 8.0)
            )  # Obtener fecha de inicio de manera segura
        fecha_inicio = row.get("fecha_inicio_real")
        if pd.isna(fecha_inicio):
            # Si no hay fecha, usar fecha por defecto (hoy)
            fecha_inicio = pd.Timestamp.now().date()

        inicio, fin = calcular_fechas_trabajo(fecha_inicio, horas)
        if not inicio:
            # Si aún no se puede calcular, usar fechas por defecto
            inicio = pd.Timestamp.now().date()
            fin = inicio + pd.Timedelta(days=max(1, round(horas / 8)))

        # Buscar mejor desarrollador considerando TODAS las asignaciones actuales
        mejor_desarrollador = None
        menor_carga = float("inf")

        for desarrollador, config in config_actual.items():
            # Contar TODAS las tareas asignadas a este desarrollador (previas + nuevas)
            tareas_dev = df_trabajo[df_trabajo["abap_asignado"] == desarrollador]
            # Verificar capacidad
            if len(tareas_dev) < config["max_tareas"]:
                # Verificar conflictos de tiempo
                if not hay_conflicto(inicio, fin, tareas_dev):
                    # Calcular carga usando la columna correcta según el grupo_dev
                    if grupo_dev in ["grid", "c4e", "fsm", "erp", "loc", "portal", "hcm",]:
                        carga = (
                            tareas_dev["horas_abap_dev"].sum()
                            if not tareas_dev.empty
                            else 0
                        )
                    else:  # LOC, PORTAL, FSM y otros grupo_dev
                        carga = tareas_dev.get(
                            "horas_desarrollo",
                            tareas_dev.get("horas_abap_dev", pd.Series([0])),
                        ).sum()

                    if carga < menor_carga:
                        menor_carga, mejor_desarrollador = carga, desarrollador

        # Asignar si se encontró un desarrollador disponible
        if mejor_desarrollador:
            df_trabajo.loc[idx, "abap_asignado"] = mejor_desarrollador
            df_trabajo.loc[idx, "fecha_inicio_plan"] = inicio
            df_trabajo.loc[idx, "fecha_fin_plan"] = fin

    # VERIFICACIÓN FINAL: Asegurar que las asignaciones previas no cambiaron
    for idx in df_trabajo[mask_ya_asignadas].index:
        original_asignado = (
            df.loc[idx, "abap_asignado"] if "abap_asignado" in df.columns else None
        )
        if (
            original_asignado
            and original_asignado != df_trabajo.loc[idx, "abap_asignado"]
        ):
            # Restaurar la asignación original
            df_trabajo.loc[idx, "abap_asignado"] = original_asignado

    return df_trabajo


def crear_timeline(df):
    """Timeline Gantt optimizado"""
    if df.empty or "fecha_inicio_plan" not in df.columns:
        return go.Figure()

    gantt_data = []
    for _, row in df.iterrows():
        if pd.notna(row["fecha_inicio_plan"]) and pd.notna(row["fecha_fin_plan"]):
            gantt_data.append(
                {
                    "Task": row["ID"],
                    "Start": row["fecha_inicio_plan"],
                    "Finish": row["fecha_fin_plan"],
                    "Resource": row["abap_asignado"],
                    "Horas": row.get("horas_abap_dev", 8.0),
                    "grupo_dev": (
                        str(row.get("grupo_dev", "N/A"))
                        if pd.notna(row.get("grupo_dev"))
                        else "N/A"
                    ),
                }
            )

    if not gantt_data:
        return go.Figure()

    fig = px.timeline(
        pd.DataFrame(gantt_data),
        x_start="Start",
        x_end="Finish",
        y="Task",
        color="Resource",
        hover_data=["Horas", "grupo_dev"],
    )
    fig.update_yaxes(autorange="reversed")
    fig.update_layout(title="📅 Timeline de Planificación", height=600)
    return fig


def crear_distribucion_desarrolladores(df):
    """Crea gráfico de distribución de tareas por desarrollador (PM/PS y otros grupo_dev)"""
    if df.empty or "abap_asignado" not in df.columns:
        return go.Figure()

    # Filtrar solo las filas con desarrollador asignado
    df_con_asignado = df[df["abap_asignado"].notna() & (df["abap_asignado"] != "")]

    if df_con_asignado.empty:
        return go.Figure()

    fig = go.Figure()  # Combinar todas las configuraciones
    todas_configuraciones = {
        **DESARROLLADORES_CONFIG_GRID,
        **DESARROLLADORES_CONFIG_HCM,
        **DESARROLLADORES_CONFIG_ERP,
        **DESARROLLADORES_CONFIG_LOC,
        **DESARROLLADORES_CONFIG_PORTAL,
        **DESARROLLADORES_CONFIG_FSM,
        **DESARROLLADORES_CONFIG_C4E,
    }

    for desarrollador, config in todas_configuraciones.items():
        df_dev = df_con_asignado[df_con_asignado["abap_asignado"] == desarrollador]

        if not df_dev.empty:  # Determinar qué columna de horas usar según el grupo_dev
            horas_mostrar = []
            for _, row in df_dev.iterrows():
                if row.get("grupo_dev", "") in ["grid", "c4e", "fsm", "erp", "loc", "portal", "hcm",]:
                    horas_mostrar.append(row.get("horas_abap_dev", 8.0))
                else:  # LOC, PORTAL, FSM y otros grupo_dev
                    horas_mostrar.append(
                        row.get("horas_desarrollo", row.get("horas_abap_dev", 8.0))
                    )
            # Obtener el grupo_dev de manera segura
            grupo_dev_info = (
                df_dev["grupo_dev"].iloc[0]
                if "grupo_dev" in df_dev.columns and not df_dev.empty
                else "N/A"
            )

            fig.add_trace(
                go.Bar(
                    name=f"{desarrollador} ({config['nivel']})",
                    y=df_dev["ID"],
                    x=horas_mostrar,
                    orientation="h",
                    marker_color=config["color"],
                    text=[f"{h}h" for h in horas_mostrar],
                    textposition="auto",
                    hovertemplate="<b>%{y}</b><br>"
                    + "Desarrollador: "
                    + desarrollador
                    + "<br>"
                    + "Horas: %{x}<br>"
                    + "Grupo: "
                    + str(grupo_dev_info)
                    + "<br>"
                    + "<extra></extra>",
                )
            )

    fig.update_layout(
        title="📊 Distribución de Tareas por Desarrollador",
        xaxis_title="Horas de Desarrollo",
        yaxis_title="Tareas (GAPs)",
        height=600,
        barmode="group",
        showlegend=True,
    )

    return fig


def crear_resumen_desarrolladores(df):
    """Resumen con detección de conflictos para todos los desarrolladores"""
    if df.empty or "abap_asignado" not in df.columns:
        return pd.DataFrame()

    # Filtrar solo las filas con desarrollador asignado
    df_con_asignado = df[df["abap_asignado"].notna() & (df["abap_asignado"] != "")]

    if df_con_asignado.empty:
        return pd.DataFrame()

    # Crear resumen agrupando por desarrollador
    resumen_data = []
    for desarrollador in df_con_asignado["abap_asignado"].unique():
        df_dev = df_con_asignado[
            df_con_asignado["abap_asignado"] == desarrollador
        ]  # Calcular horas totales según el tipo de grupo_dev
        horas_totales = 0
        for _, row in df_dev.iterrows():
            if row.get("grupo_dev", "") in ["grid", "c4e", "fsm", "erp", "loc", "portal", "hcm",]:
                horas_totales += row.get("horas_abap_dev", 8.0)
            else:  # LOC, PORTAL, FSM y otros grupo_dev
                horas_totales += row.get(
                    "horas_desarrollo", row.get("horas_abap_dev", 8.0)
                )

        # Buscar configuración del desarrollador
        todas_configuraciones = {
            **DESARROLLADORES_CONFIG_GRID,
            **DESARROLLADORES_CONFIG_HCM,
            **DESARROLLADORES_CONFIG_ERP,
            **DESARROLLADORES_CONFIG_LOC,
            **DESARROLLADORES_CONFIG_PORTAL,
            **DESARROLLADORES_CONFIG_FSM,
            **DESARROLLADORES_CONFIG_C4E,
        }
        config = todas_configuraciones.get(desarrollador, {})

        # Detectar conflictos
        conflictos = 0
        if "fecha_inicio_plan" in df.columns and "fecha_fin_plan" in df.columns:
            conflictos = sum(
                1
                for i, t1 in df_dev.iterrows()
                for j, t2 in df_dev.iterrows()
                if i < j
                and pd.notna(t1["fecha_inicio_plan"])
                and pd.notna(t2["fecha_inicio_plan"])
                and t1["fecha_inicio_plan"] <= t2["fecha_fin_plan"]
                and t1["fecha_fin_plan"] >= t2["fecha_inicio_plan"]
            )

        resumen_data.append(
            {
                "Desarrollador": desarrollador,
                "Nivel": config.get("nivel", "N/A"),
                "Tareas": len(df_dev),
                "Max": config.get("max_tareas", 0),
                "%": (
                    round(len(df_dev) / config.get("max_tareas", 1) * 100, 1)
                    if config.get("max_tareas", 0) > 0
                    else 0
                ),
                "Horas": horas_totales,
                "grupo_dev": (
                    ", ".join(
                        [str(x) for x in df_dev["grupo_dev"].unique() if pd.notna(x)]
                    )
                    if "grupo_dev" in df_dev.columns
                    and not df_dev["grupo_dev"].isna().all()
                    else "N/A"
                ),
                "Conflictos": conflictos,
            }
        )

    if resumen_data:
        resumen_df = pd.DataFrame(resumen_data)
        resumen_df.set_index("Desarrollador", inplace=True)
        return resumen_df[
            ["Nivel", "Tareas", "Max", "%", "Horas", "grupo_dev", "Conflictos"]
        ]

    return pd.DataFrame()


def mostrar_metricas(df):
    """Muestra métricas principales"""
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("📋 Total Tareas", len(df))
    with col2:
        st.metric("⏰ Total Horas", f"{df['horas_abap_dev'].sum():.0f}h")
    with col3:
        st.metric("📊 Promedio Horas", f"{df['horas_abap_dev'].mean():.1f}h")
    with col4:
        abaps_asignados = (
            df["abap_asignado"].nunique() if "abap_asignado" in df.columns else 0
        )
        st.metric("👥 ABAPs Asignados", abaps_asignados)


def guardar_cambios_csv(df, filename=CSV_FILENAME):
    """Guarda cambios en el CSV original"""
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(script_dir)
        csv_file = os.path.join(parent_dir, filename)
        df.to_csv(csv_file, index=False, encoding='utf-8-sig')
        return True
    except Exception as e:
        st.error(f"Error guardando: {e}")
        return False


def es_dia_festivo(fecha):
    """Verifica si una fecha es festiva en Perú"""
    if pd.isna(fecha):
        return False

    try:
        # Asegurar que la fecha es un objeto datetime
        if isinstance(fecha, str):
            fecha = pd.to_datetime(fecha)
        elif not isinstance(fecha, (pd.Timestamp, datetime)):
            fecha = pd.to_datetime(fecha)

        fecha_str = fecha.strftime("%Y-%m-%d")
        return fecha_str in FECHAS_FESTIVAS_PERU
    except:
        return False


def calcular_fechas_trabajo(fecha_base, horas):
    """Calcula fechas laborables excluyendo weekends y fiestas patrias del Perú"""
    if pd.isna(fecha_base) or horas <= 0:
        return None, None

    # Asegurar que fecha_base es un objeto datetime
    try:
        if isinstance(fecha_base, str):
            fecha_base = pd.to_datetime(fecha_base)
        elif not isinstance(fecha_base, (pd.Timestamp, datetime)):
            fecha_base = pd.to_datetime(fecha_base)
    except:
        return None, None

    dias = max(1, round(horas / 8))
    fecha_fin = fecha_base

    # Verificar si la fecha base es fin de semana o festivo
    while fecha_fin.weekday() >= 5 or es_dia_festivo(
        fecha_fin
    ):  # Skip weekends y festivos
        fecha_fin += timedelta(days=1)

    # Calcular fecha fin considerando días laborables
    dias_contados = 1  # Ya contamos el primer día

    for _ in range(dias - 1):
        fecha_fin += timedelta(days=1)
        while fecha_fin.weekday() >= 5 or es_dia_festivo(
            fecha_fin
        ):  # Skip weekends y festivos
            fecha_fin += timedelta(days=1)
        dias_contados += 1

    return fecha_base, fecha_fin


def hay_conflicto(inicio_new, fin_new, tareas_existentes):
    """Detecta solapamientos temporales"""
    if tareas_existentes.empty:
        return False

    for _, tarea in tareas_existentes.iterrows():
        if (
            pd.notna(tarea["fecha_inicio_plan"])
            and pd.notna(tarea["fecha_fin_plan"])
            and inicio_new <= tarea["fecha_fin_plan"]
            and fin_new >= tarea["fecha_inicio_plan"]
        ):
            return True
    return False


def mostrar_fechas_festivas():
    """Muestra las fechas festivas configuradas"""
    st.markdown("**📅 Fechas Festivas Excluidas**")
    st.write("**Las siguientes fechas están configuradas como no laborables:**")

    # Convertir a DataFrame para mejor visualización
    fechas_df = []
    for fecha_str, descripcion in FECHAS_FESTIVAS_PERU.items():
        try:
            fecha_obj = datetime.strptime(fecha_str, "%Y-%m-%d")
            fechas_df.append(
                {
                    "Fecha": fecha_obj.strftime("%d/%m/%Y"),
                    "Día": fecha_obj.strftime("%A"),
                    "Descripción": descripcion,
                }
            )
        except:
            continue

    if fechas_df:
        df_festivos = pd.DataFrame(fechas_df)
        st.dataframe(df_festivos, use_container_width=True)

        # Destacar fiestas patrias
        st.info(
            "🇵🇪 **Fiestas Patrias del Perú (28 y 29 de julio)** están automáticamente excluidas de la planificación de tareas."
        )
    else:
        st.write("No hay fechas festivas configuradas.")


def validar_tareas_en_festivos(df):
    """Valida si hay tareas programadas en fechas festivas y muestra alertas"""
    if df.empty or "fecha_inicio_real" not in df.columns:
        return

    # Convertir fechas si no están ya convertidas
    df_temp = df.copy()
    if not pd.api.types.is_datetime64_any_dtype(df_temp["fecha_inicio_real"]):
        df_temp["fecha_inicio_real"] = pd.to_datetime(
            df_temp["fecha_inicio_real"], errors="coerce"
        )

    # Filtrar tareas válidas con fechas
    df_validas = df_temp.dropna(subset=["fecha_inicio_real"])

    if df_validas.empty:
        return

    # Buscar tareas en fechas festivas
    tareas_festivos = []
    for idx, row in df_validas.iterrows():
        fecha = row["fecha_inicio_real"]
        if es_dia_festivo(fecha):
            fecha_str = fecha.strftime("%Y-%m-%d")
            tareas_festivos.append(
                {
                    "GAP ID": row.get("ID", "N/A"),
                    "Título": (
                        row.get("Titulo", "N/A")[:50] + "..."
                        if len(str(row.get("Titulo", ""))) > 50
                        else row.get("Titulo", "N/A")
                    ),
                    "Fecha": fecha.strftime("%d/%m/%Y"),
                    "Festivo": FECHAS_FESTIVAS_PERU.get(fecha_str, "Fecha festiva"),                }
            )

    if tareas_festivos:
        st.warning(
            f"⚠️ Se encontraron {len(tareas_festivos)} tareas programadas en fechas festivas:"
        )

        st.markdown("**📅 Ver tareas en fechas festivas:**")
        df_festivos = pd.DataFrame(tareas_festivos)
        st.dataframe(df_festivos, use_container_width=True)

        st.info(
            "💡 **Recomendación:** Estas tareas serán automáticamente reprogramadas para el siguiente día laborable cuando se use la funcionalidad de cálculo de fechas."
        )
    else:
        st.success("✅ No hay tareas programadas en fechas festivas.")


def main():
    """Función principal de la página de planificación"""
      # Header principal
    st.title("📅 Planificación ABAP")
    
    # Cargar datos
    with st.spinner("Cargando datos del CSV..."):
        df = cargar_datos_csv()

    if df.empty:
        st.warning("📋 No hay datos cargados. Sube un archivo CSV para continuar.")
        st.info("💡 **Instrucciones:**\n"
                "1. El archivo debe tener el formato correcto con headers en la fila 4\n"
                "2. Debe incluir las columnas necesarias como 'fecha_inicio_real', 'grupo_dev', etc.")
        st.stop()

    # Sidebar controls
    with st.sidebar:
        st.header("⚙️ Configuración")

        # Filtros
        st.subheader("🔍 Filtros")
        
        # Filtro por PROY
        proy_options = ["Todos"]
        if "PROY" in df.columns:
            proy_values = df["PROY"].dropna().unique().tolist()
            proy_options.extend(sorted(proy_values))
        selected_proy = st.selectbox("Proyecto (PROY):", proy_options)
        
        # Filtro por Módulo
        modulo_options = ["Todos"]
        if "Módulo" in df.columns:
            modulo_values = df["Módulo"].dropna().unique().tolist()
            modulo_options.extend(sorted(modulo_values))
        selected_modulo = st.selectbox("Módulo:", modulo_options)

        # Botón asignar
        if st.button("🚀 Asignar Desarrolladores", type="primary"):
            with st.spinner("Asignando ABAPs..."):
                # Asignar ABAPs y guardar en session_state
                df_actualizado = asignar_desarrolladores_por_grupo_dev(df.copy())

                # Actualizar el DataFrame original con las nuevas asignaciones
                for idx, row in df_actualizado.iterrows():
                    if "abap_asignado" in df_actualizado.columns and pd.notna(
                        row["abap_asignado"]
                    ):
                        # Encontrar la fila correspondiente en el df original
                        mask = df["ID"] == row["ID"]
                        if mask.any():
                            df.loc[mask, "abap_asignado"] = row["abap_asignado"]
                            if pd.notna(row.get("fecha_inicio_plan")):
                                df.loc[mask, "fecha_inicio_plan"] = row[
                                    "fecha_inicio_plan"
                                ]
                            if pd.notna(row.get("fecha_fin_plan")):
                                df.loc[mask, "fecha_fin_plan"] = row["fecha_fin_plan"]

                # Guardar en session_state para persistencia
                st.session_state["df_con_asignaciones"] = df
                st.success("✅ Asignación completada!")

        # Mostrar información sobre filtros aplicados en sidebar
        if selected_proy != "Todos" or selected_modulo != "Todos":
            filtros_aplicados = []
            if selected_proy != "Todos":
                filtros_aplicados.append(f"PROY: {selected_proy}")
            if selected_modulo != "Todos":
                filtros_aplicados.append(f"Módulo: {selected_modulo}")
            
            st.markdown("---")
            st.caption(f"🔍 **Filtros activos:**")
            for filtro in filtros_aplicados:
                st.caption(f"• {filtro}")
            st.caption(f"📊 **Registros mostrados**")
        
        # Información sobre archivo cargado
        st.markdown("---")
        st.subheader("📄 Archivo CSV")
        if len(df) > 0:
            st.success(f"✅ {len(df)} registros cargados")
            st.caption(f"Columnas detectadas: {len(df.columns)}")
          # Opción para recargar archivo
        if st.button("🔄 Recargar Archivo", help="Limpiar caché y cargar nuevo archivo"):
            st.cache_data.clear()
            # Limpiar datos de archivo subido
            if 'uploaded_csv_data' in st.session_state:
                del st.session_state['uploaded_csv_data']
            if 'uploaded_csv_name' in st.session_state:
                del st.session_state['uploaded_csv_name']
            st.rerun()
        
        st.info("💡 **Tip:** Si cambias el archivo CSV en el directorio o quieres subir uno nuevo, usa 'Recargar Archivo'")

    # Usar datos de session_state si existen
    if "df_con_asignaciones" in st.session_state:
        df = st.session_state["df_con_asignaciones"]

    # Aplicar filtros seleccionados
    df_filtered = df.copy()
    
    # Aplicar filtro de PROY
    if selected_proy != "Todos" and "PROY" in df_filtered.columns:
        df_filtered = df_filtered[df_filtered["PROY"] == selected_proy]
      # Aplicar filtro de Módulo
    if selected_modulo != "Todos" and "Módulo" in df_filtered.columns:
        df_filtered = df_filtered[df_filtered["Módulo"] == selected_modulo]

    # Tabs para diferentes vistas
    tab1, tab2, tab3, tab4 = st.tabs(
        ["📊 Distribución", "📅 Timeline", "📋 Resumen", "📄 Datos"]
    )

    with tab1:
        st.subheader("Distribución de Tareas por ABAP")
        if "abap_asignado" in df_filtered.columns:
            fig_dist = crear_distribucion_desarrolladores(df_filtered)
            st.plotly_chart(fig_dist, use_container_width=True)
        else:
            st.info("👆 Haz clic en 'Asignar ABAPs' para ver la distribución")

    with tab2:
        st.subheader("Timeline de Planificación")
        if "fecha_inicio_plan" in df_filtered.columns:
            fig_timeline = crear_timeline(df_filtered)
            st.plotly_chart(fig_timeline, use_container_width=True)
        else:
            st.info("👆 Asigna ABAPs primero para ver el timeline")

    with tab3:
        st.subheader("Resumen por ABAP")
        resumen = crear_resumen_desarrolladores(df_filtered)
        if not resumen.empty:
            # Estilo para conflictos
            def colorear_conflictos(val):
                if isinstance(val, (int, float)) and val > 0:
                    return "background-color: #ffcccc"
                return ""

            styled_df = resumen.style.applymap(
                colorear_conflictos, subset=["Conflictos"]
            )
            st.dataframe(styled_df, use_container_width=True)

            # Alertas
            total_conflictos = resumen["Conflictos"].sum()
            if total_conflictos > 0:
                st.warning(f"⚠️ {total_conflictos} conflictos detectados")
            else:
                st.success("✅ Sin conflictos")
        else:
            st.info("👆 Asigna ABAPs primero para ver el resumen")

    with tab4:
        st.subheader("Datos Cargados")

        # Editor simple
        if st.button("✏️ Modo Edición"):
            st.session_state.modo_edicion = not st.session_state.get(
                "modo_edicion", False
            )

        if st.session_state.get("modo_edicion", False):
            st.warning("⚠️ Modo edición activado")
            # Editor de datos
            df_editado = st.data_editor(
                df_filtered,
                use_container_width=True,
                num_rows="dynamic",
                column_config={
                    "fecha_inicio_real": st.column_config.DateColumn("Fecha ESFU"),
                    "horas_abap_dev": st.column_config.NumberColumn(
                        "Horas ABAP", min_value=0, max_value=200
                    ),
                    "horas_desarrollo": st.column_config.NumberColumn(
                        "Horas Desarrollo", min_value=0, max_value=200
                    ),
                    "abap_asignado": st.column_config.SelectboxColumn(
                        "Desarrollador Asignado",
                        options=list(
                            {
                                **DESARROLLADORES_CONFIG_GRID,
                                **DESARROLLADORES_CONFIG_HCM,
                                **DESARROLLADORES_CONFIG_ERP,
                                **DESARROLLADORES_CONFIG_LOC,
                                **DESARROLLADORES_CONFIG_PORTAL,
                                **DESARROLLADORES_CONFIG_FSM,
                                **DESARROLLADORES_CONFIG_C4E,
                                **OTROS_DESARROLLADORES_CONFIG,
                            }.keys()
                        ),
                        required=False,
                    ),
                },
            )

            col1, col2 = st.columns(2)
            with col1:
                if st.button("💾 Guardar Cambios", type="primary"):
                    if guardar_cambios_csv(df_editado):
                        st.success("✅ Cambios guardados")
                        st.cache_data.clear()
                        st.rerun()

            with col2:
                if st.button("❌ Cancelar"):
                    st.session_state.modo_edicion = False
                    st.rerun()
        else:
            # Vista normal
            st.dataframe(df_filtered, use_container_width=True)

        # Download
        if "abap_asignado" in df_filtered.columns:
            csv_resultado = df_filtered.to_csv(index=False)
            st.download_button(
                label="💾 Descargar Resultado CSV",
                data=csv_resultado,
                file_name=f"grid_asignado_{datetime.now().strftime('%Y%m%d_%H%M')}.csv",
                mime="text/csv",            )    # === INFORMACIÓN ADICIONAL ===
    st.markdown("---")
    
    with st.expander("📋 Información Adicional", expanded=False):
        # Información resumida
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Total Tareas", len(df))
        with col2:
            if "abap_asignado" in df.columns:
                asignadas = df[df["abap_asignado"].notna() & (df["abap_asignado"] != "")].shape[0]
                st.metric("Asignadas", asignadas)
            else:
                st.metric("Asignadas", 0)
        with col3:
            # Contar tareas festivas de forma rápida
            festivos_count = 0
            if "fecha_inicio_real" in df.columns:
                for fecha_str in FECHAS_FESTIVAS_PERU.keys():
                    festivos_count += (
                        df["fecha_inicio_real"]
                        .astype(str)
                        .str.contains(fecha_str, na=False)
                        .sum()
                    )
            st.metric("En Festivos", festivos_count)        # Información detallada
        st.markdown("**ℹ️ Información Detallada**")
        st.success(f"✅ Cargadas {len(df)} tareas de GRIDS (todos los grupo_dev)")
        
        # Mostrar información sobre asignaciones previas
        if "abap_asignado" in df.columns:
            asignaciones_previas = df[
                df["abap_asignado"].notna()
                & (df["abap_asignado"] != "")
                & (df["abap_asignado"] != "None")
            ]
            if not asignaciones_previas.empty:
                st.info(
                    f"📋 Se encontraron {len(asignaciones_previas)} tareas con asignaciones previas que serán respetadas"
                )
        
        # Validar si hay tareas en fechas festivas
        validar_tareas_en_festivos(df)
          # Mostrar fechas festivas configuradas
        mostrar_fechas_festivas()


# Ejecutar la función principal cuando se importa la página
try:
    main()
except Exception as e:
    import traceback
    st.error(f"Error en la página de planificación: {e}")
    st.error(f"Traceback: {traceback.format_exc()}")
    st.title("📅 Planificación ABAP")
    st.info("La página tiene problemas técnicos. Por favor, revisa los errores arriba.")
