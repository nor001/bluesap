import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import os
import sys
from pathlib import Path
import traceback
import streamlit_authenticator as stauth

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
from utils.user_prefs import save_filters_to_supabase, load_filters_from_supabase, save_filters, load_filters
from utils.supabase_auth import login_with_google


def main():
    """Main function for the planning page."""
    user = st.session_state.get("user", None)
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
        plan_config = get_plan_config(plan_type)
        
        # Filters
        st.subheader("🔍 Filters")
        proy_options = ["Todos"] + sorted(df_original["PROY"].dropna().unique())
        modulo_options = ["Todos"] + sorted(df_original["Módulo"].dropna().unique())
        if "grupo_dev" in df_original.columns:
            grupo_options = ["Todos"] + sorted(df_original["grupo_dev"].dropna().unique())
        else:
            grupo_options = ["Todos"]

        if user:
            selected_proy, selected_modulo, selected_grupo = load_filters_from_supabase(
                user["email"], proy_options, modulo_options, grupo_options
            )
        else:
            selected_proy, selected_modulo, selected_grupo = load_filters(
                proy_options, modulo_options, grupo_options
            )

        # Initialize filter session_state keys if not present
        if "selected_proy" not in st.session_state:
            st.session_state["selected_proy"] = proy_options[0]
        if "selected_modulo" not in st.session_state:
            st.session_state["selected_modulo"] = modulo_options[0]
        if "selected_grupo" not in st.session_state:
            st.session_state["selected_grupo"] = grupo_options[0]

        def on_filter_change():
            if user:
                save_filters_to_supabase(user["email"], st.session_state.selected_proy, st.session_state.selected_modulo, st.session_state.selected_grupo)
            else:
                save_filters(st.session_state.selected_proy, st.session_state.selected_modulo, st.session_state.selected_grupo)
            # No st.rerun() here

        st.selectbox("Project (PROY):", proy_options, index=proy_options.index(selected_proy) if selected_proy in proy_options else 0, key="selected_proy", on_change=on_filter_change)
        st.selectbox("Module:", modulo_options, index=modulo_options.index(selected_modulo) if selected_modulo in modulo_options else 0, key="selected_modulo", on_change=on_filter_change)
        if "grupo_dev" in df_original.columns:
            st.selectbox("Development Group:", grupo_options, index=grupo_options.index(selected_grupo) if selected_grupo in grupo_options else 0, key="selected_grupo", on_change=on_filter_change)
        
        st.markdown("---")
        if st.button("🔄 Reload File"):
            st.cache_data.clear()
            st.session_state.pop('uploaded_csv_data', None)
            st.session_state.pop('uploaded_csv_name', None)
            st.session_state.pop('df_con_asignaciones', None)
            st.rerun()

    # --- Automatic Assignment ---
    if "df_con_asignaciones" not in st.session_state or st.session_state.get("_auto_assign_plan_type") != plan_type:
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
            st.session_state["_auto_assign_plan_type"] = plan_type

    # Use session_state data if exists, otherwise use original data
    df = st.session_state.get("df_con_asignaciones", df_original)

    # Apply filters
    df_filtered = df.copy()
    if st.session_state.selected_proy != "Todos":
        df_filtered = df_filtered[df_filtered["PROY"] == st.session_state.selected_proy]
    if st.session_state.selected_modulo != "Todos":
        df_filtered = df_filtered[df_filtered["Módulo"] == st.session_state.selected_modulo]
    if st.session_state.selected_grupo != "Todos" and "grupo_dev" in df_filtered.columns:
        df_filtered = df_filtered[df_filtered["grupo_dev"] == st.session_state.selected_grupo]

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
        # Add Titulo as hover detail if present, and use precise_hours for visualization only
        if 'Titulo' in df_filtered.columns:
            fig_timeline = create_timeline(df_filtered, plan_config, extra_hover_cols=['Titulo'], precise_hours=True)  # precise_hours for visual clarity
        else:
            fig_timeline = create_timeline(df_filtered, plan_config, precise_hours=True)
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
        # Show Titulo as a visible column if present
        if 'Titulo' in df_filtered.columns:
            st.dataframe(df_filtered[[col for col in df_filtered.columns if col == 'Titulo' or col != 'Titulo']])
        else:
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