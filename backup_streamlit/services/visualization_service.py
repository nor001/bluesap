"""
Visualization Service for SAP Gestion
Operational Layer - AI-Optimized Charts & Analytics
"""

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from typing import Dict, Any, Optional, List
import numpy as np

from core.exceptions import DataProcessingError
from core.config import AppConfig

class VisualizationService:
    """AI-optimized visualization service with security validation"""
    
    def __init__(self):
        self.app_config = AppConfig()
    
    def create_resource_distribution(self, df: pd.DataFrame, plan_config) -> go.Figure:
        """Create resource distribution chart with AI optimization"""
        try:
            if df.empty or plan_config.resource_col not in df.columns:
                return self._create_empty_chart("No data available")
            
            # Count assignments per resource
            resource_counts = df[plan_config.resource_col].value_counts()
            
            # Get resource colors from config
            colors = []
            for resource in resource_counts.index:
                color = self._get_resource_color(resource, plan_config)
                colors.append(color)
            
            # Create bar chart
            fig = go.Figure(data=[
                go.Bar(
                    x=resource_counts.index,
                    y=resource_counts.values,
                    marker_color=colors,
                    text=resource_counts.values,
                    textposition='auto',
                    hovertemplate='<b>%{x}</b><br>Tasks: %{y}<extra></extra>'
                )
            ])
            
            fig.update_layout(
                title=f"{plan_config.resources_title} Distribution",
                xaxis_title=plan_config.resource_title,
                yaxis_title="Number of Tasks",
                showlegend=False,
                height=500
            )
            
            return fig
            
        except Exception as e:
            raise DataProcessingError(f"Failed to create resource distribution: {e}")
    
    def create_timeline(
        self, 
        df: pd.DataFrame, 
        plan_config, 
        extra_hover_cols: Optional[List[str]] = None,
        precise_hours: bool = False
    ) -> go.Figure:
        """Create timeline chart using the proven approach from the old version"""
        try:
            if df.empty:
                return self._create_empty_chart("No data available")
            
            start_date_col = plan_config.start_date_col
            end_date_col = plan_config.end_date_col
            resource_col = plan_config.resource_col
            hours_col = plan_config.hours_col

            if start_date_col not in df.columns or end_date_col not in df.columns:
                return self._create_empty_chart(f"Missing date columns: {start_date_col}, {end_date_col}")

            # Create Gantt data like the old version
            gantt_data = []
            for _, row in df.iterrows():
                if (pd.notna(row[start_date_col]) and 
                    pd.notna(row[end_date_col]) and 
                    pd.notna(row[resource_col])):
                    
                    start = row[start_date_col]
                    end = row[end_date_col]
                    
                    # If precise_hours, set start to 09:00 and end to 18:00 for the last day
                    if precise_hours:
                        start = pd.to_datetime(start).replace(hour=9, minute=0, second=0)
                        end = pd.to_datetime(end).replace(hour=18, minute=0, second=0)
                    
                    gantt_data.append({
                        "Task": row.get("ID", f"Task_{len(gantt_data)}"),
                        "Start": start,
                        "Finish": end,
                        "Resource": row[resource_col],
                        "Hours": row.get(hours_col, 8.0),
                        "dev_group": str(row.get("grupo_dev", "N/A")),
                        # Add extra hover columns if provided
                        **({col: row.get(col, "") for col in extra_hover_cols} if extra_hover_cols else {})
                    })

            if not gantt_data:
                return self._create_empty_chart("No data with valid dates and assigned resources")

            # Create hover columns
            hover_cols = ["Hours", "dev_group"]
            if extra_hover_cols:
                hover_cols += extra_hover_cols

            # Get color mapping from resource configuration
            if "Developer" in plan_config.resource_title:
                resource_config = self.app_config._get_all_developers_config()
            else:
                resource_config = self.app_config.TESTERS_CONFIG
            
            color_map = {resource: config["color"] for resource, config in resource_config.items()}

            # Use px.timeline like the old version
            fig = px.timeline(
                pd.DataFrame(gantt_data),
                x_start="Start", x_end="Finish", y="Task",
                color="Resource", hover_data=hover_cols,
                color_discrete_map=color_map
            )
            
            fig.update_yaxes(autorange="reversed")
            fig.update_layout(
                title=f"📅 Planning Timeline ({plan_config.resource_title})", 
                height=600
            )
            
            return fig
            
        except Exception as e:
            raise DataProcessingError(f"Failed to create timeline: {e}")
    
    def create_resource_summary(self, df: pd.DataFrame, plan_config) -> pd.DataFrame:
        """Create resource summary with AI optimization"""
        try:
            if df.empty or plan_config.resource_col not in df.columns:
                return pd.DataFrame()
            
            # Group by resource and calculate metrics
            summary = df.groupby(plan_config.resource_col).agg({
                'PROY': 'count',
                plan_config.hours_col: ['sum', 'mean'] if plan_config.hours_col in df.columns else 'count'
            }).round(2)
            
            # Flatten column names
            summary.columns = ['_'.join(col).strip() if isinstance(col, tuple) else col for col in summary.columns]
            
            # Add conflicts column (placeholder for future implementation)
            summary['Conflicts'] = 0
            
            return summary.reset_index()
            
        except Exception as e:
            raise DataProcessingError(f"Failed to create resource summary: {e}")
    
    def create_group_assignment_stats(self, df: pd.DataFrame, plan_config) -> Optional[go.Figure]:
        """Create group assignment statistics chart"""
        try:
            if df.empty or 'grupo_dev' not in df.columns:
                return None
            
            # Count assignments per group
            group_counts = df['grupo_dev'].value_counts()
            
            # Create pie chart
            fig = go.Figure(data=[
                go.Pie(
                    labels=group_counts.index,
                    values=group_counts.values,
                    hole=0.3,
                    textinfo='label+percent',
                    textposition='inside'
                )
            ])
            
            fig.update_layout(
                title="Assignments by Development Group",
                height=500
            )
            
            return fig
            
        except Exception as e:
            raise DataProcessingError(f"Failed to create group assignment stats: {e}")
    
    def show_metrics(self, df: pd.DataFrame, plan_config):
        """Display key metrics with AI optimization"""
        try:
            if df.empty:
                st.info("No data available for metrics")
                return
            
            # Calculate metrics
            total_tasks = len(df)
            assigned_tasks = df[plan_config.resource_col].notna().sum()
            assignment_rate = (assigned_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
            # Display metrics
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                st.metric("Total Tasks", total_tasks)
            
            with col2:
                st.metric("Assigned Tasks", assigned_tasks)
            
            with col3:
                st.metric("Assignment Rate", f"{assignment_rate:.1f}%")
            
            with col4:
                if plan_config.hours_col in df.columns:
                    total_hours = df[plan_config.hours_col].sum()
                    st.metric("Total Hours", f"{total_hours:.0f}")
                else:
                    st.metric("Groups", df['grupo_dev'].nunique() if 'grupo_dev' in df.columns else 0)
                    
        except Exception as e:
            raise DataProcessingError(f"Failed to show metrics: {e}")
    
    def _get_resource_color(self, resource_name: str, plan_config) -> str:
        """Get resource color from configuration"""
        try:
            # Get resource configuration
            if "Developer" in plan_config.resource_title:
                all_config = self.app_config._get_all_developers_config()
            else:
                all_config = self.app_config.TESTERS_CONFIG
            
            # Return color if found, otherwise use default
            if resource_name in all_config:
                return all_config[resource_name]['color']
            else:
                return "#808080"  # Default gray color
                
        except Exception:
            return "#808080"  # Default gray color
    
    def _create_hover_text(self, row: pd.Series, plan_config, extra_hover_cols: Optional[List[str]] = None) -> str:
        """Create hover text for timeline"""
        try:
            hover_text = f"<b>{row.get('PROY', 'N/A')} - {row.get('Módulo', 'N/A')}</b><br>"
            
            # Add start and end dates if available
            start_date = row.get(plan_config.start_date_col)
            end_date = row.get(plan_config.end_date_col)
            
            if pd.notna(start_date):
                hover_text += f"Start: {start_date.strftime('%Y-%m-%d')}<br>"
            if pd.notna(end_date):
                hover_text += f"End: {end_date.strftime('%Y-%m-%d')}<br>"
            
            if extra_hover_cols:
                for col in extra_hover_cols:
                    if col in row and pd.notna(row[col]):
                        hover_text += f"{col}: {row[col]}<br>"
            
            return hover_text
            
        except Exception:
            return "No details available"
    
    def _create_empty_chart(self, message: str) -> go.Figure:
        """Create empty chart with message"""
        fig = go.Figure()
        fig.add_annotation(
            text=message,
            xref="paper", yref="paper",
            x=0.5, y=0.5,
            showarrow=False,
            font=dict(size=16)
        )
        fig.update_layout(
            xaxis=dict(visible=False),
            yaxis=dict(visible=False),
            height=400
        )
        return fig 