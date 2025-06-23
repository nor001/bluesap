import streamlit as st
import traceback
import time
from core import AppConfig, ConfigError, ServiceManager, AILogger
import pandas as pd

def initialize_services():
    """Initialize services using ServiceManager"""
    service_manager = ServiceManager()
    return (
        service_manager.get_service('data'),
        service_manager.get_service('assignment'),
        service_manager.get_service('visualization'),
        service_manager.get_service('auth')
    )

def normalize_date_columns(df, plan_config):
    """Normalize date column types to avoid pyarrow/streamlit errors"""
    try:
        date_columns = [
            plan_config.available_date_col,
            plan_config.plan_date_col,
            plan_config.start_date_col,
            plan_config.end_date_col
        ]
        
        for col in date_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')
        
        return df
    except Exception as e:
        st.warning(f"Warning: Could not normalize date columns: {e}")
        return df

def save_filters(proy, modulo, grupo):
    """Save filters to session state"""
    st.session_state["saved_proy"] = proy
    st.session_state["saved_modulo"] = modulo
    st.session_state["saved_grupo"] = grupo

def load_filters(proy_options, modulo_options, grupo_options):
    """Load filters from session state"""
    saved_proy = st.session_state.get("saved_proy", proy_options[0])
    saved_modulo = st.session_state.get("saved_modulo", modulo_options[0])
    saved_grupo = st.session_state.get("saved_grupo", grupo_options[0])
    return saved_proy, saved_modulo, saved_grupo

def save_filters_to_supabase(user_email, proy, modulo, grupo):
    """Save filters to Supabase (placeholder for future implementation)"""
    # TODO: Implement Supabase integration
    save_filters(proy, modulo, grupo)

def load_filters_from_supabase(user_email, proy_options, modulo_options, grupo_options):
    """Load filters from Supabase (placeholder for future implementation)"""
    # TODO: Implement Supabase integration
    return load_filters(proy_options, modulo_options, grupo_options)

def main():
    """Main planning page function"""
    start_time = time.time()
    
    # Initialize logging
    logger = AILogger()
    logger.log_operation("Planning Page Started")
    
    st.set_page_config(
        page_title=f"Planificación - {AppConfig.APP_NAME}",
        page_icon="📅",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    # Initialize services
    try:
        data_service, assignment_service, visualization_service, auth_service = initialize_services()
        logger.log_service_call("ServiceManager", "get_service", result="success")
    except Exception as e:
        logger.log_error(e, "Service Initialization")
        st.error("Failed to initialize application services. Please check configuration.")
        st.stop()
    
    user = auth_service.get_current_user()
    st.title("📅 SAP Project Planning")
    
    # Load CSV data
    with st.spinner("Loading CSV data..."):
        try:
            plan_type = st.session_state.get("plan_type_selector", "Plan de Desarrollo")
            plan_config = AppConfig.get_plan_config(plan_type)
            
            logger.log_operation("Loading CSV Data", {"plan_type": plan_type})
            df_original = data_service.load_csv_data(plan_config)
            
            if df_original.empty:
                logger.log_operation("CSV Load Failed", {"reason": "empty_dataframe"})
                st.error("No data available. Please check your CSV file.")
                st.stop()
            
            logger.log_data_operation("CSV Loaded", df_original.shape, list(df_original.columns))
            
        except Exception as e:
            logger.log_error(e, "CSV Loading")
            st.error(f"Failed to load CSV data: {e}")
            st.stop()

    # Sidebar configuration
    with st.sidebar:
        st.header("⚙️ Configuration")
        
        # Plan type selector
        plan_type = st.selectbox(
            "**Planning Type**",
            ["Plan de Desarrollo", "Plan de Pruebas"],
            key="plan_type_selector"
        )
        
        try:
            plan_config = AppConfig.get_plan_config(plan_type)
        except ConfigError as e:
            logger.log_error(e, "Configuration")
            st.error(f"Configuration error: {e}")
            st.stop()
        
        # Filters section
        st.subheader("🔍 Filters")
        
        # Get filter options
        proy_options = ["Todos"] + sorted(df_original["PROY"].dropna().unique().tolist())
        modulo_options = ["Todos"] + sorted(df_original["Módulo"].dropna().unique().tolist())
        
        if "grupo_dev" in df_original.columns:
            grupo_options = ["Todos"] + sorted(df_original["grupo_dev"].dropna().unique().tolist())
        else:
            grupo_options = ["Todos"]

        # Load saved filters
        if user:
            selected_proy, selected_modulo, selected_grupo = load_filters_from_supabase(
                user.get("email", ""), proy_options, modulo_options, grupo_options
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
            logger.log_user_action("Filter Changed", user.get("email") if user else None, "planificacion", {
                "proy": st.session_state.selected_proy,
                "modulo": st.session_state.selected_modulo,
                "grupo": st.session_state.selected_grupo
            })
            
            if user:
                save_filters_to_supabase(
                    user.get("email", ""), 
                    st.session_state.selected_proy, 
                    st.session_state.selected_modulo, 
                    st.session_state.selected_grupo
                )
            else:
                save_filters(
                    st.session_state.selected_proy, 
                    st.session_state.selected_modulo, 
                    st.session_state.selected_grupo
                )

        # Filter controls
        st.selectbox(
            "Project (PROY):", 
            proy_options, 
            index=proy_options.index(selected_proy) if selected_proy in proy_options else 0, 
            key="selected_proy", 
            on_change=on_filter_change
        )
        
        st.selectbox(
            "Module:", 
            modulo_options, 
            index=modulo_options.index(selected_modulo) if selected_modulo in modulo_options else 0, 
            key="selected_modulo", 
            on_change=on_filter_change
        )
        
        if "grupo_dev" in df_original.columns:
            st.selectbox(
                "Development Group:", 
                grupo_options, 
                index=grupo_options.index(selected_grupo) if selected_grupo in grupo_options else 0, 
                key="selected_grupo", 
                on_change=on_filter_change
            )
        
        # Reload button
        st.markdown("---")
        if st.button("🔄 Reload File"):
            logger.log_user_action("Reload File", user.get("email") if user else None, "planificacion")
            st.cache_data.clear()
            st.session_state.pop('uploaded_csv_data', None)
            st.session_state.pop('uploaded_csv_name', None)
            st.session_state.pop('df_con_asignaciones', None)
            st.rerun()

    # Main content area
    try:
        # Automatic resource assignment
        if "df_con_asignaciones" not in st.session_state or st.session_state.get("_auto_assign_plan_type") != plan_type:
            with st.spinner(f"Assigning {plan_config.resources_title}..."):
                logger.log_operation("Resource Assignment Started", {"plan_type": plan_type})
                
                df_con_asignaciones = assignment_service.assign_resources_generic(
                    df_original,
                    plan_config=plan_config,
                    holidays=AppConfig.PERU_HOLIDAYS,
                    use_group_based_assignment=plan_config.use_group_based_assignment,
                    group_col="grupo_dev"
                )
                
                st.session_state["df_con_asignaciones"] = df_con_asignaciones
                st.session_state["_auto_assign_plan_type"] = plan_type
                
                logger.log_data_operation("Resource Assignment Completed", df_con_asignaciones.shape)
        
        # Apply filters
        filters = {
            "selected_proy": st.session_state.get("selected_proy", "Todos"),
            "selected_modulo": st.session_state.get("selected_modulo", "Todos"),
            "selected_grupo": st.session_state.get("selected_grupo", "Todos")
        }
        
        df_filtered = data_service.apply_filters(st.session_state["df_con_asignaciones"], filters)
        logger.log_data_operation("Filters Applied", df_filtered.shape, filters=filters)
        
        # Display metrics
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            total_projects = len(df_filtered["PROY"].unique())
            st.metric("Total Projects", total_projects)
        
        with col2:
            total_tasks = len(df_filtered)
            st.metric("Total Tasks", total_tasks)
        
        with col3:
            assigned_tasks = len(df_filtered[df_filtered[plan_config.resource_col].notna()])
            st.metric("Assigned Tasks", assigned_tasks)
        
        with col4:
            unassigned_tasks = total_tasks - assigned_tasks
            st.metric("Unassigned Tasks", unassigned_tasks)
        
        # Display timeline
        st.subheader("📊 Timeline")
        timeline_fig = visualization_service.create_timeline(df_filtered, plan_config)
        st.plotly_chart(timeline_fig, use_container_width=True)
        
        # Display detailed table
        st.subheader("📋 Detailed Assignment Table")
        
        # Prepare table data
        display_columns = [
            "PROY", "Módulo", "Titulo", plan_config.resource_col,
            plan_config.hours_col, plan_config.plan_date_col
        ]
        
        # Filter columns that exist in the dataframe
        available_columns = [col for col in display_columns if col in df_filtered.columns]
        
        if available_columns:
            df_display = df_filtered[available_columns].copy()
            
            # Add conflict highlighting
            def color_conflicts(val):
                if pd.isna(val):
                    return 'background-color: #ffcccc'
                return ''
            
            st.dataframe(
                df_display.style.map(color_conflicts, subset=[plan_config.resource_col]),
                use_container_width=True
            )
        
        # Export functionality
        st.subheader("📤 Export Data")
        col1, col2 = st.columns(2)
        
        with col1:
            if st.button("Export Filtered Data"):
                try:
                    csv_data = data_service.export_data(df_filtered, "filtered_data.csv")
                    st.download_button(
                        label="Download CSV",
                        data=csv_data,
                        file_name="filtered_data.csv",
                        mime="text/csv"
                    )
                    logger.log_user_action("Export Data", user.get("email") if user else None, "planificacion")
                except Exception as e:
                    logger.log_error(e, "Data Export")
                    st.error(f"Export failed: {e}")
        
        with col2:
            if st.button("Export All Data"):
                try:
                    csv_data = data_service.export_data(st.session_state["df_con_asignaciones"], "all_data.csv")
                    st.download_button(
                        label="Download CSV",
                        data=csv_data,
                        file_name="all_data.csv",
                        mime="text/csv"
                    )
                    logger.log_user_action("Export All Data", user.get("email") if user else None, "planificacion")
                except Exception as e:
                    logger.log_error(e, "Data Export")
                    st.error(f"Export failed: {e}")
        
        # Log performance
        duration = time.time() - start_time
        logger.log_performance("Planning Page Render", duration)
        
    except Exception as e:
        logger.log_error(e, "Planning Page Main Content")
        st.error(f"Error in planning page: {e}")
        st.stop()

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        st.error(f"An unexpected error occurred: {e}")
        st.error(f"Traceback: {traceback.format_exc()}") 