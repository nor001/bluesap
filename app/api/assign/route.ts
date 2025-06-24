import { NextRequest, NextResponse } from 'next/server';
import { AssignmentResponse } from '@/lib/types';
import { AppConfig } from '@/lib/config';

// Helper functions from assignment_service.py
function isHoliday(date: Date, holidays: Record<string, string>): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return dateStr in holidays;
}

function calculateWorkingDates(baseDate: string, hours: number, holidays: Record<string, string>): [Date | null, Date | null] {
  if (!baseDate || hours <= 0) {
    return [null, null];
  }

  try {
    let startDate = new Date(baseDate);
    
    // Adjust start date if it falls on a non-working day
    while (startDate.getDay() >= 5 || isHoliday(startDate, holidays)) {
      startDate.setDate(startDate.getDate() + 1);
    }

    const days = Math.max(1, Math.ceil(hours / 8));
    let endDate = new Date(startDate);

    for (let i = 1; i < days; i++) {
      endDate.setDate(endDate.getDate() + 1);
      while (endDate.getDay() >= 5 || isHoliday(endDate, holidays)) {
        endDate.setDate(endDate.getDate() + 1);
      }
    }

    return [startDate, endDate];
  } catch (error) {
    return [null, null];
  }
}

function checkConflict(
  startNew: Date,
  endNew: Date,
  existingTasks: any[],
  startDateCol: string,
  endDateCol: string
): boolean {
  if (existingTasks.length === 0) return false;

  for (const task of existingTasks) {
    const taskStart = task[startDateCol];
    const taskEnd = task[endDateCol];
    
    if (taskStart && taskEnd) {
      const taskStartDate = new Date(taskStart);
      const taskEndDate = new Date(taskEnd);
      
      if (startNew <= taskEndDate && endNew >= taskStartDate) {
        return true;
      }
    }
  }
  
  return false;
}

export async function POST(request: NextRequest): Promise<NextResponse<AssignmentResponse>> {
  try {
    const { data, planType } = await request.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid data format'
      }, { status: 400 });
    }

    const planConfig = AppConfig.getPlanConfig(planType);
    const holidays = AppConfig.PERU_HOLIDAYS;

    // Create working copy
    const workingData = [...data];

    // Ensure required columns exist
    if (!workingData[0][planConfig.resource_col]) {
      workingData.forEach(row => row[planConfig.resource_col] = null);
    }
    if (!workingData[0][planConfig.start_date_col]) {
      workingData.forEach(row => row[planConfig.start_date_col] = null);
    }
    if (!workingData[0][planConfig.end_date_col]) {
      workingData.forEach(row => row[planConfig.end_date_col] = null);
    }

    // Process already assigned tasks
    const alreadyAssigned = workingData.filter(row => 
      row[planConfig.resource_col] && 
      row[planConfig.resource_col] !== '' && 
      row[planConfig.resource_col] !== 'None' && 
      row[planConfig.resource_col] !== 'nan'
    );

    for (const row of alreadyAssigned) {
      if (!row[planConfig.start_date_col] || !row[planConfig.end_date_col]) {
        const hours = row[planConfig.hours_col] || 8.0;
        const baseDate = row[planConfig.available_date_col] || row[planConfig.plan_date_col];
        
        if (baseDate) {
          const [start, end] = calculateWorkingDates(baseDate, hours, holidays);
          if (start && end) {
            row[planConfig.start_date_col] = start.toISOString();
            row[planConfig.end_date_col] = end.toISOString();
          }
        }
      }
    }

    // Process unassigned tasks
    const unassigned = workingData.filter(row => 
      !row[planConfig.resource_col] || 
      row[planConfig.resource_col] === '' || 
      row[planConfig.resource_col] === 'None' || 
      row[planConfig.resource_col] === 'nan'
    );

    // Sort by priority (hours descending)
    unassigned.sort((a, b) => (b[planConfig.hours_col] || 0) - (a[planConfig.hours_col] || 0));

    for (const row of unassigned) {
      const hours = row[planConfig.hours_col] || 8.0;
      const baseDate = row[planConfig.available_date_col] || row[planConfig.plan_date_col];

      if (!baseDate) continue;

      // Determine which resource configuration to use
      let currentResourceConfig: Record<string, any>;
      if (planConfig.use_group_based_assignment && row.grupo_dev) {
        currentResourceConfig = AppConfig.getGroupConfig(row.grupo_dev);
      } else {
        currentResourceConfig = planConfig.resource_title.includes('Developer') 
          ? AppConfig.getAllDevelopersConfig() 
          : AppConfig.TESTERS_CONFIG;
      }

      // Find the best available resource
      let bestResource: string | null = null;
      let bestStartDate: Date | null = null;
      let bestEndDate: Date | null = null;

      for (const [resource, config] of Object.entries(currentResourceConfig)) {
        const maxTasks = config.max_tasks || 15;
        
        // Count current tasks for this resource
        const currentTasks = workingData.filter(row => 
          row[planConfig.resource_col] === resource && 
          row[planConfig.resource_col] != null
        );
        
        if (currentTasks.length >= maxTasks) continue;

        // Check for conflicts with existing tasks
        const [startDate, endDate] = calculateWorkingDates(baseDate, hours, holidays);
        
        if (!startDate || !endDate) continue;

        if (!checkConflict(startDate, endDate, currentTasks, planConfig.start_date_col, planConfig.end_date_col)) {
          bestResource = resource;
          bestStartDate = startDate;
          bestEndDate = endDate;
          break;
        }
      }

      // Assign the task if a resource was found
      if (bestResource) {
        row[planConfig.resource_col] = bestResource;
        row[planConfig.start_date_col] = bestStartDate!.toISOString();
        row[planConfig.end_date_col] = bestEndDate!.toISOString();
      }
    }

    return NextResponse.json({
      success: true,
      data: workingData
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Assignment failed'
    }, { status: 500 });
  }
} 