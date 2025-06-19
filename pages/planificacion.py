import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import os
import sys
from pathlib import Path
import traceback

# Add parent directory to path for imports
current_dir = Path(__file__).parent.parent
sys.path.append(str(current_dir))

from utils.assignment import assign_resources_generic
from utils.data_processing import load_csv_data, normalize_date_columns
from utils.visualization import (
    create_timeline,
    create_resource_distribution,
    create_resource_summary,
    show_metrics,
    create_group_assignment_stats,
)
from utils.config import get_plan_config, PERU_HOLIDAYS


def main():
    """Main function for the planning page."""
    st.title("📅 SAP Project Planning")
    
    with st.spinner("Loading CSV data..."):
        df_original = load_csv_data(get_plan_config(st.session_state.get("plan_type_selector", "Plan de Desarrollo")))

    if df_original.empty:
        st.stop()

    # --- Sidebar ---
    with st.sidebar:
        st.header("⚙️ Configuration")
        
        # Plan type selector
        plan_type = st.selectbox(
            "**Planning Type**",
            ["Plan de Desarrollo", "Plan de Pruebas"],
            key="plan_type_selector"
        )
        
        # Get configuration for selected plan
        plan_config = get_plan_config(plan_type)
        if not plan_config:
            st.error("Invalid plan type.")
            st.stop()

        st.subheader("🔍 Filters")
        proy_options = ["Todos"] + sorted(df_original["PROY"].dropna().unique())
        selected_proy = st.selectbox("Project (PROY):", proy_options)
        
        modulo_options = ["Todos"] + sorted(df_original["Módulo"].dropna().unique())
        selected_modulo = st.selectbox("Module:", modulo_options)

        # Add group filter if grupo_dev column exists
        if "grupo_dev" in df_original.columns:
            grupo_options = ["Todos"] + sorted(df_original["grupo_dev"].dropna().unique())
            selected_grupo = st.selectbox("Development Group:", grupo_options)
        else:
            selected_grupo = "Todos"
        
        if st.button(f"🚀 Assign {plan_config['resources_title']}", type="primary"):
            with st.spinner(f"Assigning {plan_config['resources_title']}..."):
                df_con_asignaciones = assign_resources_generic(
                    df_original,
                    resource_col=plan_config["resource_col"],
                    hours_col=plan_config["hours_col"],
                    available_date_col=plan_config["available_date_col"],
                    plan_date_col=plan_config["plan_date_col"],
                    start_date_col=plan_config["start_date_col"],
                    end_date_col=plan_config["end_date_col"],
                    resource_config=plan_config["resource_config"],
                    holidays=PERU_HOLIDAYS,
                    use_group_based_assignment=plan_config.get("use_group_based_assignment", False),
                    group_col="grupo_dev"
                )
                st.session_state["df_con_asignaciones"] = df_con_asignaciones
                st.rerun()
        
        st.markdown("---")
        if st.button("🔄 Reload File"):
            st.cache_data.clear()
            st.session_state.pop('uploaded_csv_data', None)
            st.session_state.pop('uploaded_csv_name', None)
            st.session_state.pop('df_con_asignaciones', None)
            st.rerun()

    # Use session_state data if exists, otherwise use original data
    df = st.session_state.get("df_con_asignaciones", df_original)

    # Apply filters
    df_filtered = df.copy()
    if selected_proy != "Todos":
        df_filtered = df_filtered[df_filtered["PROY"] == selected_proy]
    if selected_modulo != "Todos":
        df_filtered = df_filtered[df_filtered["Módulo"] == selected_modulo]
    if selected_grupo != "Todos" and "grupo_dev" in df_filtered.columns:
        df_filtered = df_filtered[df_filtered["grupo_dev"] == selected_grupo]

    # Normalize date column types to avoid pyarrow/streamlit errors
    df_filtered = normalize_date_columns(df_filtered, plan_config)

    # Metrics
    show_metrics(df_filtered, plan_config)

    # --- Tabs ---
    tab1, tab2, tab3, tab4, tab5 = st.tabs(
        [f"📊 {plan_config['resource_title']} Distribution", "📅 Timeline", "📋 Summary", "👥 Group Stats", "📄 Data"]
    )

    with tab1:
        fig_dist = create_resource_distribution(df_filtered, plan_config)
        st.plotly_chart(fig_dist, use_container_width=True)

    with tab2:
        fig_timeline = create_timeline(df_filtered, plan_config)
        st.plotly_chart(fig_timeline, use_container_width=True)

    with tab3:
        resumen = create_resource_summary(df_filtered, plan_config)
        if not resumen.empty:
            def color_conflicts(val):
                return 'background-color: #FF4B4B' if val > 0 else ''
            styled_df = resumen.style.applymap(color_conflicts, subset=["Conflicts"])
            st.dataframe(styled_df, use_container_width=True)
        else:
            st.info(f"👆 Click 'Assign {plan_config['resources_title']}' to see the summary.")

    with tab4:
        # Group assignment statistics
        if plan_config.get("use_group_based_assignment", False) and "grupo_dev" in df_filtered.columns:
            fig_group_stats = create_group_assignment_stats(df_filtered, plan_config)
            if fig_group_stats:
                st.plotly_chart(fig_group_stats, use_container_width=True)
            else:
                st.info("No group data available to display statistics.")
        else:
            st.info("Group-based assignment is not enabled or no group data available.")

    with tab5:
        st.subheader("Loaded Data")
        st.dataframe(df_filtered)
        csv = df_filtered.to_csv(index=False).encode('utf-8-sig')
        st.download_button(
            label="📥 Download CSV with Assignments",
            data=csv,
            file_name=f"planning_{plan_config['resource_col']}.csv",
            mime="text/csv",
        )

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        st.error(f"An unexpected error occurred: {e}")
        st.error(f"Traceback: {traceback.format_exc()}") 