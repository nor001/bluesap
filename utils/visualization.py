import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st


def create_timeline(df, config, extra_hover_cols=None, precise_hours=False):
    """Generic Gantt timeline."""
    start_date_col = config["start_date_col"]
    end_date_col = config["end_date_col"]
    resource_col = config["resource_col"]
    hours_col = config["hours_col"]

    if df.empty or start_date_col not in df.columns or end_date_col not in df.columns:
        return go.Figure()

    gantt_data = []
    for _, row in df.iterrows():
        if pd.notna(row[start_date_col]) and pd.notna(row[end_date_col]) and pd.notna(row[resource_col]):
            start = row[start_date_col]
            end = row[end_date_col]
            # If precise_hours, set start to 09:00 and end to 18:00 for the last day
            if precise_hours:
                start = pd.to_datetime(start).replace(hour=9, minute=0, second=0)
                end = pd.to_datetime(end).replace(hour=18, minute=0, second=0)
            gantt_data.append({
                "Task": row["ID"],
                "Start": start,
                "Finish": end,
                "Resource": row[resource_col],
                "Hours": row.get(hours_col, 8.0),
                "dev_group": str(row.get("dev_group", "N/A")),
                # Add extra hover columns if provided
                **({col: row.get(col, "") for col in extra_hover_cols} if extra_hover_cols else {})
            })

    if not gantt_data:
        return go.Figure()

    hover_cols = ["Hours", "dev_group"]
    if extra_hover_cols:
        hover_cols += extra_hover_cols

    # Use the same color mapping as the resource distribution
    color_map = {resource: cfg["color"] for resource, cfg in config["resource_config"].items()}

    fig = px.timeline(
        pd.DataFrame(gantt_data),
        x_start="Start", x_end="Finish", y="Task",
        color="Resource", hover_data=hover_cols,
        color_discrete_map=color_map
    )
    fig.update_yaxes(autorange="reversed")
    fig.update_layout(title=f"📅 Planning Timeline ({config['resource_title']})", height=600)
    return fig


def create_resource_distribution(df, config):
    """Create task distribution chart by resource."""
    resource_col = config["resource_col"]
    hours_col = config["hours_col"]
    resource_config = config["resource_config"]

    if df.empty or resource_col not in df.columns:
        return go.Figure()

    df_with_assigned = df[df[resource_col].notna() & (df[resource_col] != "")]
    if df_with_assigned.empty:
        return go.Figure()

    fig = go.Figure()
    for resource, resource_cfg in resource_config.items():
        df_resource = df_with_assigned[df_with_assigned[resource_col] == resource]
        if not df_resource.empty:
            hours_to_show = df_resource[hours_col]
            fig.add_trace(go.Bar(
                name=f"{resource} ({resource_cfg['level']})",
                y=df_resource["ID"], x=hours_to_show, orientation="h",
                marker_color=resource_cfg["color"], text=[f"{h}h" for h in hours_to_show],
                textposition="auto"
            ))

    fig.update_layout(
        title=f"📊 Task Distribution by {config['resource_title']}",
        xaxis_title="Effort Hours", yaxis_title="Tasks (GAPs)",
        height=600, barmode="group", showlegend=True
    )
    return fig


def create_resource_summary(df, config):
    """Summary with conflict detection for all resources."""
    resource_col = config["resource_col"]
    hours_col = config["hours_col"]
    resource_config = config["resource_config"]
    start_date_col = config["start_date_col"]
    end_date_col = config["end_date_col"]

    if df.empty or resource_col not in df.columns:
        return pd.DataFrame()

    df_with_assigned = df[df[resource_col].notna() & (df[resource_col] != "")]
    if df_with_assigned.empty:
        return pd.DataFrame()

    summary_data = []
    for resource in df_with_assigned[resource_col].unique():
        df_resource = df_with_assigned[df_with_assigned[resource_col] == resource]
        resource_cfg = resource_config.get(resource, {})
        
        conflicts = sum(
            1 for i, t1 in df_resource.iterrows() for j, t2 in df_resource.iterrows()
            if i < j and pd.notna(t1[start_date_col]) and pd.notna(t2[start_date_col])
            and t1[start_date_col] <= t2[end_date_col] and t1[end_date_col] >= t2[start_date_col]
        )

        summary_data.append({
            config['resource_title']: resource,
            "Level": resource_cfg.get("level", "N/A"),
            "Tasks": len(df_resource),
            "Max": resource_cfg.get("max_tasks", 0),
            "%": round(len(df_resource) / resource_cfg.get("max_tasks", 1) * 100, 1) if resource_cfg.get("max_tasks", 0) > 0 else 0,
            "Hours": df_resource[hours_col].sum(),
            "Conflicts": conflicts,
        })

    if summary_data:
        summary_df = pd.DataFrame(summary_data)
        summary_df.set_index(config['resource_title'], inplace=True)
        return summary_df
    return pd.DataFrame()


def show_metrics(df, plan_config):
    """Display key metrics for the planning data"""
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        total_tasks = len(df)
        st.metric("Total Tasks", total_tasks)
    
    with col2:
        assigned_tasks = len(df[df[plan_config["resource_col"]].notna()])
        st.metric("Assigned Tasks", assigned_tasks)
    
    with col3:
        if plan_config["hours_col"] in df.columns:
            total_hours = df[plan_config["hours_col"]].sum()
            st.metric("Total Hours", f"{total_hours:.1f}")
        else:
            st.metric("Total Hours", "N/A")
    
    with col4:
        if assigned_tasks > 0:
            assignment_rate = (assigned_tasks / total_tasks) * 100
            st.metric("Assignment Rate", f"{assignment_rate:.1f}%")
        else:
            st.metric("Assignment Rate", "0%")


def create_group_assignment_stats(df, plan_config):
    """
    Create a visualization showing assignment statistics by group.
    Only works when group-based assignment is enabled and grupo_dev column exists.
    """
    if not plan_config.get("use_group_based_assignment", False) or "grupo_dev" not in df.columns:
        return None
    
    # Get group statistics
    group_stats = []
    for group in df["grupo_dev"].dropna().unique():
        group_df = df[df["grupo_dev"] == group]
        total_tasks = len(group_df)
        assigned_tasks = len(group_df[group_df[plan_config["resource_col"]].notna()])
        total_hours = group_df[plan_config["hours_col"]].sum() if plan_config["hours_col"] in group_df.columns else 0
        
        group_stats.append({
            "Group": group,
            "Total Tasks": total_tasks,
            "Assigned Tasks": assigned_tasks,
            "Assignment Rate": (assigned_tasks / total_tasks * 100) if total_tasks > 0 else 0,
            "Total Hours": total_hours
        })
    
    if not group_stats:
        return None
    
    stats_df = pd.DataFrame(group_stats)
    
    # Create bar chart for assignment rates by group
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        x=stats_df["Group"],
        y=stats_df["Assignment Rate"],
        name="Assignment Rate (%)",
        marker_color="#4ECDC4",
        text=stats_df["Assignment Rate"].round(1).astype(str) + "%",
        textposition="auto"
    ))
    
    fig.update_layout(
        title="Assignment Rate by Development Group",
        xaxis_title="Development Group",
        yaxis_title="Assignment Rate (%)",
        yaxis=dict(range=[0, 100]),
        showlegend=False,
        height=400
    )
    
    return fig 