import pandas as pd
from datetime import datetime, timedelta
import plotly.graph_objects as go


def is_holiday(date, holidays):
    """Check if a date is a holiday in Peru"""
    if pd.isna(date):
        return False

    try:
        if isinstance(date, str):
            date = pd.to_datetime(date)
        elif not isinstance(date, (pd.Timestamp, datetime)):
            date = pd.to_datetime(date)

        date_str = date.strftime("%Y-%m-%d")
        return date_str in holidays
    except:
        return False


def calculate_working_dates(base_date, hours, holidays):
    """Calculate working dates excluding weekends and holidays in Peru"""
    if pd.isna(base_date) or hours <= 0:
        return None, None

    try:
        if isinstance(base_date, str):
            base_date = pd.to_datetime(base_date)
        elif not isinstance(base_date, (pd.Timestamp, datetime)):
            base_date = pd.to_datetime(base_date)
    except:
        return None, None

    # Adjust start date if it falls on a non-working day
    while base_date.weekday() >= 5 or is_holiday(base_date, holidays):
        base_date += timedelta(days=1)

    days = max(1, round(hours / 8))
    end_date = base_date

    days_counted = 1

    for _ in range(days - 1):
        end_date += timedelta(days=1)
        while end_date.weekday() >= 5 or is_holiday(
            end_date, holidays
        ):
            end_date += timedelta(days=1)
        days_counted += 1

    return base_date, end_date


def check_conflict_generic(start_new, end_new, existing_tasks, start_date_col, end_date_col):
    """Detect temporal overlaps in a generic and robust way with date types"""
    import datetime
    if existing_tasks.empty:
        return False
    # Convert start_new and end_new to pd.Timestamp if they are datetime.date
    if isinstance(start_new, datetime.date) and not isinstance(start_new, pd.Timestamp):
        start_new = pd.Timestamp(start_new)
    if isinstance(end_new, datetime.date) and not isinstance(end_new, pd.Timestamp):
        end_new = pd.Timestamp(end_new)
    for _, task in existing_tasks.iterrows():
        task_start = task[start_date_col]
        task_end = task[end_date_col]
        if pd.notna(task_start) and pd.notna(task_end):
            # Convert task values to Timestamp if they are date
            if isinstance(task_start, datetime.date) and not isinstance(task_start, pd.Timestamp):
                task_start = pd.Timestamp(task_start)
            if isinstance(task_end, datetime.date) and not isinstance(task_end, pd.Timestamp):
                task_end = pd.Timestamp(task_end)
            if start_new <= task_end and end_new >= task_start:
                return True
    return False


def assign_resources_generic(
    df,
    resource_col,
    hours_col,
    available_date_col,
    plan_date_col,
    start_date_col,
    end_date_col,
    resource_config,
    holidays,
    use_group_based_assignment=False,
    group_col="grupo_dev"
):
    """
    Generic resource assignment (developers, testers, etc.)
    Uses available_date_col as base for calculating start dates
    Supports group-based assignment when use_group_based_assignment is True
    """
    working_df = df.copy()

    if resource_col not in working_df.columns:
        working_df[resource_col] = None
    if start_date_col not in working_df.columns:
        working_df[start_date_col] = None
    if end_date_col not in working_df.columns:
        working_df[end_date_col] = None

    already_assigned_mask = (
        working_df[resource_col].notna()
        & (working_df[resource_col] != "")
        & (working_df[resource_col] != "None")
        & (working_df[resource_col] != "nan")
    )

    for idx in working_df[already_assigned_mask].index:
        row = working_df.loc[idx]
        if pd.isna(row.get(start_date_col)) or pd.isna(row.get(end_date_col)):
            hours = row.get(hours_col, 8.0)
            # Use available date as base, fallback to plan date if not available
            base_date = row.get(available_date_col, row.get(plan_date_col))
            if pd.notna(base_date):
                start, end = calculate_working_dates(base_date, hours, holidays)
                working_df.loc[idx, start_date_col] = start
                working_df.loc[idx, end_date_col] = end

    # Process unassigned tasks
    unassigned_mask = ~already_assigned_mask
    unassigned_df = working_df[unassigned_mask].copy()

    if unassigned_df.empty:
        return working_df

    # Sort by priority (you can modify this logic)
    unassigned_df = unassigned_df.sort_values(by=[hours_col], ascending=False)

    for idx in unassigned_df.index:
        row = unassigned_df.loc[idx]
        hours = row.get(hours_col, 8.0)
        base_date = row.get(available_date_col, row.get(plan_date_col))

        if pd.isna(base_date):
            continue

        # Determine which resource configuration to use
        if use_group_based_assignment and group_col in working_df.columns:
            group_name = row.get(group_col)
            # Import here to avoid circular imports
            from utils.config import get_group_config
            current_resource_config = get_group_config(group_name)
        else:
            current_resource_config = resource_config

        # Find the best available resource
        best_resource = None
        best_start_date = None
        best_end_date = None

        for resource, config in current_resource_config.items():
            max_tasks = config.get("max_tasks", 15)
            
            # Count current tasks for this resource
            current_tasks = working_df[
                (working_df[resource_col] == resource) &
                working_df[resource_col].notna()
            ]
            
            if len(current_tasks) >= max_tasks:
                continue

            # Check for conflicts with existing tasks
            existing_tasks = current_tasks.copy()
            start_date, end_date = calculate_working_dates(base_date, hours, holidays)
            
            if start_date is None or end_date is None:
                continue

            if not check_conflict_generic(start_date, end_date, existing_tasks, start_date_col, end_date_col):
                best_resource = resource
                best_start_date = start_date
                best_end_date = end_date
                break

        # Assign the task if a resource was found
        if best_resource is not None:
            working_df.loc[idx, resource_col] = best_resource
            working_df.loc[idx, start_date_col] = best_start_date
            working_df.loc[idx, end_date_col] = best_end_date

    return working_df
