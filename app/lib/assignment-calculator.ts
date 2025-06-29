import { AppConfig } from './config';
import { ResourceConfig } from './types';

// Helper functions for assignment calculation
function isHoliday(date: Date, holidays: Record<string, string>): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return dateStr in holidays;
}

function isWorkingDay(date: Date, holidays: Record<string, string>): boolean {
  const dayOfWeek = date.getDay();
  // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHolidayDate = isHoliday(date, holidays);

  return !isWeekend && !isHolidayDate;
}

function getNextWorkingDay(date: Date, holidays: Record<string, string>): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  while (!isWorkingDay(nextDay, holidays)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  return nextDay;
}

function calculateWorkingDates(
  baseDate: string,
  hours: number,
  holidays: Record<string, string>
): [Date | null, Date | null] {
  if (!baseDate || hours <= 0) {
    return [null, null];
  }

  try {
    let startDate = new Date(baseDate);

    // Adjust start date if it falls on a non-working day
    if (!isWorkingDay(startDate, holidays)) {
      startDate = getNextWorkingDay(startDate, holidays);
    }

    const days = Math.max(1, Math.ceil(hours / 8));
    let endDate = new Date(startDate);

    for (let i = 1; i < days; i++) {
      endDate.setDate(endDate.getDate() + 1);
      // Adjust end date if it falls on a non-working day
      if (!isWorkingDay(endDate, holidays)) {
        endDate = getNextWorkingDay(endDate, holidays);
      }
    }

    // Adjust start date if it falls on weekend
    if (startDate.getDay() === 0 || startDate.getDay() === 6) {
      // Move to next Monday
      const daysToAdd = startDate.getDay() === 0 ? 1 : 2;
      startDate.setDate(startDate.getDate() + daysToAdd);
    }

    // Adjust end date if it falls on weekend
    if (endDate.getDay() === 0 || endDate.getDay() === 6) {
      // Move to previous Friday
      const daysToSubtract = endDate.getDay() === 0 ? 2 : 1;
      endDate.setDate(endDate.getDate() - daysToSubtract);
    }

    // Ensure end date is not before start date
    if (endDate < startDate) {
      endDate = new Date(startDate);
    }

    return [startDate, endDate];
  } catch {
    console.error('Failed to calculate assignments');
    return [null, null];
  }
}

function checkConflict(
  startNew: Date,
  endNew: Date,
  existingTasks: Array<Record<string, unknown>>,
  startDateCol: string,
  endDateCol: string
): boolean {
  if (existingTasks.length === 0) return false;

  for (const task of existingTasks) {
    const taskStart = task[startDateCol];
    const taskEnd = task[endDateCol];

    if (taskStart && taskEnd) {
      const taskStartDate = new Date(taskStart as string);
      const taskEndDate = new Date(taskEnd as string);

      if (startNew <= taskEndDate && endNew >= taskStartDate) {
        return true;
      }
    }
  }

  return false;
}

export function calculateAssignments(
  data: Array<Record<string, unknown>>,
  planType: string
): Array<Record<string, unknown>> {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  const planConfig = AppConfig.getPlanConfig(planType);
  const holidays = AppConfig.PERU_HOLIDAYS;

  // Create working copy
  const workingData = [...data];

  // Ensure required columns exist
  if (!workingData[0][planConfig.resource_col]) {
    workingData.forEach(row => (row[planConfig.resource_col] = null));
  }
  if (!workingData[0][planConfig.start_date_col]) {
    workingData.forEach(row => (row[planConfig.start_date_col] = null));
  }
  if (!workingData[0][planConfig.end_date_col]) {
    workingData.forEach(row => (row[planConfig.end_date_col] = null));
  }

  // Process already assigned tasks
  const alreadyAssigned = workingData.filter(
    row =>
      row[planConfig.resource_col] &&
      row[planConfig.resource_col] !== '' &&
      row[planConfig.resource_col] !== 'None' &&
      row[planConfig.resource_col] !== 'nan'
  );

  for (const row of alreadyAssigned) {
    if (!row[planConfig.start_date_col] || !row[planConfig.end_date_col]) {
      const hours = (row[planConfig.hours_col] as number) || 8.0;
      const baseDate =
        row[planConfig.available_date_col] || row[planConfig.plan_date_col];

      if (baseDate) {
        const [start, end] = calculateWorkingDates(
          baseDate as string,
          hours,
          holidays
        );
        if (start && end) {
          row[planConfig.start_date_col] = start.toISOString();
          row[planConfig.end_date_col] = end.toISOString();
        }
      }
    }
  }

  // Process unassigned tasks
  const unassigned = workingData.filter(
    row =>
      !row[planConfig.resource_col] ||
      row[planConfig.resource_col] === '' ||
      row[planConfig.resource_col] === 'None' ||
      row[planConfig.resource_col] === 'nan'
  );

  // Sort by priority (hours descending)
  unassigned.sort(
    (a, b) =>
      ((b[planConfig.hours_col] as number) || 0) -
      ((a[planConfig.hours_col] as number) || 0)
  );

  let dynamicConsultantIndex = 1;

  for (const row of unassigned) {
    const hours = (row[planConfig.hours_col] as number) || 8.0;
    const baseDate =
      row[planConfig.available_date_col] || row[planConfig.plan_date_col];

    if (!baseDate) {
      continue;
    }

    // Determine which resource configuration to use
    let currentResourceConfig: Record<string, ResourceConfig>;
    if (planConfig.use_group_based_assignment && row.grupo_dev) {
      currentResourceConfig = AppConfig.getGroupConfig(row.grupo_dev as string);
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
      const currentTasks = workingData.filter(
        row =>
          row[planConfig.resource_col] === resource &&
          row[planConfig.resource_col] != null
      );

      if (currentTasks.length >= maxTasks) {
        continue;
      }

      // Check for conflicts with existing tasks
      const [startDate, endDate] = calculateWorkingDates(
        baseDate as string,
        hours,
        holidays
      );

      if (!startDate || !endDate) {
        continue;
      }

      if (
        !checkConflict(
          startDate,
          endDate,
          currentTasks,
          planConfig.start_date_col,
          planConfig.end_date_col
        )
      ) {
        bestResource = resource;
        bestStartDate = startDate;
        bestEndDate = endDate;
        break;
      }
    }

    // If no resource found, create a dynamic senior consultant
    if (!bestResource) {
      const dynamicConsultantName = `Senior_${dynamicConsultantIndex.toString().padStart(2, '0')}`;

      // Generate dynamic consultant config
      const dynamicConfig: ResourceConfig = {
        level: 'SENIOR',
        max_tasks: 15,
      };

      // Add to current resource config
      currentResourceConfig[dynamicConsultantName] = dynamicConfig;

      // Calculate dates for the new consultant
      const [startDate, endDate] = calculateWorkingDates(
        baseDate as string,
        hours,
        holidays
      );

      if (startDate && endDate) {
        bestResource = dynamicConsultantName;
        bestStartDate = startDate;
        bestEndDate = endDate;
        dynamicConsultantIndex++;
      }
    }

    // Assign the task if a resource was found
    if (bestResource) {
      row[planConfig.resource_col] = bestResource;
      row[planConfig.start_date_col] = bestStartDate!.toISOString();
      row[planConfig.end_date_col] = bestEndDate!.toISOString();
    }
  }

  return workingData;
}
