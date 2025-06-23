"""
Assignment Service for SAP Gestion
Operational Layer - AI-Optimized Resource Allocation
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta, date
import math

from core.exceptions import ResourceError, ValidationError
from core.config import AppConfig
from core.security import SecurityValidator

class AssignmentService:
    """AI-optimized resource assignment service with security validation"""
    
    def __init__(self):
        self.security_validator = SecurityValidator()
        self.app_config = AppConfig()
    
    def is_holiday(self, date, holidays):
        """Check if a date is a holiday"""
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

    def calculate_working_dates(self, base_date, hours, holidays):
        """Calculate working dates excluding weekends and holidays"""
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
        while base_date.weekday() >= 5 or self.is_holiday(base_date, holidays):
            base_date += timedelta(days=1)

        days = max(1, math.ceil(hours / 8))
        end_date = base_date

        days_counted = 1

        for _ in range(days - 1):
            end_date += timedelta(days=1)
            while end_date.weekday() >= 5 or self.is_holiday(end_date, holidays):
                end_date += timedelta(days=1)
            days_counted += 1

        return base_date, end_date

    def check_conflict_generic(self, start_new, end_new, existing_tasks, start_date_col, end_date_col):
        """Detect temporal overlaps in a generic and robust way with date types"""
        if existing_tasks.empty:
            return False
        
        # Convert start_new and end_new to pd.Timestamp if they are date
        if isinstance(start_new, date) and not isinstance(start_new, pd.Timestamp):
            start_new = pd.Timestamp(start_new)
        if isinstance(end_new, date) and not isinstance(end_new, pd.Timestamp):
            end_new = pd.Timestamp(end_new)
        
        for _, task in existing_tasks.iterrows():
            task_start = task[start_date_col]
            task_end = task[end_date_col]
            if pd.notna(task_start) and pd.notna(task_end):
                # Convert task values to Timestamp if they are date
                if isinstance(task_start, date) and not isinstance(task_start, pd.Timestamp):
                    task_start = pd.Timestamp(task_start)
                if isinstance(task_end, date) and not isinstance(task_end, pd.Timestamp):
                    task_end = pd.Timestamp(task_end)
                if start_new <= task_end and end_new >= task_start:
                    return True
        return False

    def assign_resources_generic(
        self,
        df: pd.DataFrame,
        plan_config,
        holidays: Dict[str, str],
        use_group_based_assignment: bool = False,
        group_col: str = "grupo_dev"
    ) -> pd.DataFrame:
        """Assign resources using the proven logic from the old version"""
        try:
            # Security validation
            self.security_validator.validate_dataframe(df)
            
            working_df = df.copy()

            # Ensure required columns exist
            if plan_config.resource_col not in working_df.columns:
                working_df[plan_config.resource_col] = None
            if plan_config.start_date_col not in working_df.columns:
                working_df[plan_config.start_date_col] = None
            if plan_config.end_date_col not in working_df.columns:
                working_df[plan_config.end_date_col] = None

            # Process already assigned tasks
            already_assigned_mask = (
                working_df[plan_config.resource_col].notna()
                & (working_df[plan_config.resource_col] != "")
                & (working_df[plan_config.resource_col] != "None")
                & (working_df[plan_config.resource_col] != "nan")
            )

            for idx in working_df[already_assigned_mask].index:
                row = working_df.loc[idx]
                if pd.isna(row.get(plan_config.start_date_col)) or pd.isna(row.get(plan_config.end_date_col)):
                    hours = row.get(plan_config.hours_col, 8.0)
                    # Use available date as base, fallback to plan date if not available
                    base_date = row.get(plan_config.available_date_col, row.get(plan_config.plan_date_col))
                    if pd.notna(base_date):
                        start, end = self.calculate_working_dates(base_date, hours, holidays)
                        working_df.loc[idx, plan_config.start_date_col] = start
                        working_df.loc[idx, plan_config.end_date_col] = end

            # Process unassigned tasks
            unassigned_mask = ~already_assigned_mask
            unassigned_df = working_df[unassigned_mask].copy()

            if unassigned_df.empty:
                return working_df

            # Sort by priority (hours descending)
            unassigned_df = unassigned_df.sort_values(by=[plan_config.hours_col], ascending=False)

            for idx in unassigned_df.index:
                row = unassigned_df.loc[idx]
                hours = row.get(plan_config.hours_col, 8.0)
                base_date = row.get(plan_config.available_date_col, row.get(plan_config.plan_date_col))

                if pd.isna(base_date):
                    continue

                # Determine which resource configuration to use
                if use_group_based_assignment and group_col in working_df.columns:
                    group_name = row.get(group_col)
                    current_resource_config = self.app_config.get_group_config(group_name)
                else:
                    current_resource_config = self._get_resource_config(plan_config)

                # Find the best available resource
                best_resource = None
                best_start_date = None
                best_end_date = None

                for resource, config in current_resource_config.items():
                    max_tasks = config.get("max_tasks", 15)
                    
                    # Count current tasks for this resource
                    current_tasks = working_df[
                        (working_df[plan_config.resource_col] == resource) &
                        working_df[plan_config.resource_col].notna()
                    ]
                    
                    if len(current_tasks) >= max_tasks:
                        continue

                    # Check for conflicts with existing tasks
                    existing_tasks = current_tasks.copy()
                    start_date, end_date = self.calculate_working_dates(base_date, hours, holidays)
                    
                    if start_date is None or end_date is None:
                        continue

                    if not self.check_conflict_generic(start_date, end_date, existing_tasks, plan_config.start_date_col, plan_config.end_date_col):
                        best_resource = resource
                        best_start_date = start_date
                        best_end_date = end_date
                        break

                # Assign the task if a resource was found
                if best_resource is not None:
                    working_df.loc[idx, plan_config.resource_col] = best_resource
                    working_df.loc[idx, plan_config.start_date_col] = best_start_date
                    working_df.loc[idx, plan_config.end_date_col] = best_end_date

            return working_df
            
        except Exception as e:
            raise ResourceError(f"Failed to assign resources: {e}")
    
    def _get_resource_config(self, plan_config) -> Dict[str, Any]:
        """Get resource configuration based on plan type"""
        if "Developer" in plan_config.resource_title:
            return self.app_config._get_all_developers_config()
        else:
            return self.app_config.TESTERS_CONFIG
    
    def get_assignment_summary(self, df: pd.DataFrame, plan_config) -> pd.DataFrame:
        """Generate assignment summary with security validation"""
        try:
            if df.empty or plan_config.resource_col not in df.columns:
                return pd.DataFrame()
            
            # Group by assigned resource
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
            raise ResourceError(f"Failed to generate assignment summary: {e}") 