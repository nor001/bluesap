import { logError } from './error-handler';
import { PlanConfig } from './types';

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
  } catch (error) {
    logError(
      {
        type: 'processing',
        message: 'Failed to calculate assignments',
        details: error,
        timestamp: Date.now(),
        userFriendly: true,
      },
      'assignment-calculator'
    );
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

interface ABAPResource {
  name: string;
  availableHours: number;
  assignedHours: number;
  skills: string[];
  currentLoad: number;
}

interface ProjectTask {
  id: string;
  project: string;
  module: string;
  hours: number;
  priority: number;
  startDate: Date;
  endDate: Date;
  assignedResource?: string;
}

/**
 * Calculates optimal resource assignments for SAP projects
 * Special cases: Handles different plan types, resource availability, and skill matching
 */
export function calculateAssignments(
  csvData: Array<Record<string, unknown>>,
  planType: string
): Array<Record<string, unknown>> {
  if (!csvData || csvData.length === 0) {
    return [];
  }

  // Get plan configuration based on type
  const planConfig = getPlanConfiguration(planType);
  
  // Extract and validate ABAP resources
  const abapResources = extractABAPResources(csvData, planConfig);
  
  // Extract project tasks
  const projectTasks = extractProjectTasks(csvData, planConfig);
  
  // Perform assignment calculation
  const assignments = performResourceAssignment(projectTasks, abapResources, planConfig);
  
  // Convert back to original format
  return convertToOriginalFormat(assignments, csvData);
}

/**
 * Get plan configuration based on plan type
 */
function getPlanConfiguration(planType: string): PlanConfig {
  const configs: Record<string, PlanConfig> = {
    'Plan de Desarrollo': {
      start_date_col: 'plan_abap_dev_ini',
      end_date_col: 'plan_abap_dev_fin',
      resource_col: 'abap_asignado',
      hours_col: 'plan_abap_dev_time',
      resource_title: 'ABAP Developer',
      resources_title: 'ABAP Developers',
      assigned_title: 'Asignado',
      available_date_col: 'esfu_disponible',
      plan_date_col: 'plan_abap_dev_ini',
      use_group_based_assignment: false,
      module_col: 'modulo',
      project_col: 'proyecto',
    },
    'Plan de PU': {
      start_date_col: 'plan_abap_pu_ini',
      end_date_col: 'plan_abap_pu_fin',
      resource_col: 'abap_asignado',
      hours_col: 'plan_abap_pu_time',
      resource_title: 'ABAP PU',
      resources_title: 'ABAP PUs',
      assigned_title: 'Asignado',
      available_date_col: 'esfu_disponible',
      plan_date_col: 'plan_abap_pu_ini',
      use_group_based_assignment: false,
      module_col: 'modulo',
      project_col: 'proyecto',
    },
    'Plan de Test': {
      start_date_col: 'available_test_date',
      end_date_col: 'available_test_date',
      resource_col: 'abap_asignado',
      hours_col: 'plan_abap_dev_time',
      resource_title: 'ABAP Test',
      resources_title: 'ABAP Testers',
      assigned_title: 'Asignado',
      available_date_col: 'esfu_disponible',
      plan_date_col: 'available_test_date',
      use_group_based_assignment: false,
      module_col: 'modulo',
      project_col: 'proyecto',
    },
  };

  return configs[planType] || configs['Plan de Desarrollo'];
}

/**
 * Extract ABAP resources from CSV data
 */
function extractABAPResources(
  csvData: Array<Record<string, unknown>>,
  planConfig: PlanConfig
): ABAPResource[] {
  const resourceMap = new Map<string, ABAPResource>();

  csvData.forEach((row) => {
    const resourceName = String(row[planConfig.resource_col] || '');
    const availableHours = Number(row[planConfig.available_date_col]) || 0;
    const grupo = String(row.grupo_dev || '');

    if (resourceName && resourceName !== '' && resourceName !== 'None' && resourceName !== 'nan') {
      if (!resourceMap.has(resourceName)) {
        resourceMap.set(resourceName, {
          name: resourceName,
          availableHours: availableHours,
          assignedHours: 0,
          skills: [grupo],
          currentLoad: 0,
        });
      } else {
        // Update existing resource with additional skills
        const existing = resourceMap.get(resourceName)!;
        if (!existing.skills.includes(grupo)) {
          existing.skills.push(grupo);
        }
        // Use the highest available hours
        if (availableHours > existing.availableHours) {
          existing.availableHours = availableHours;
        }
      }
    }
  });

  return Array.from(resourceMap.values());
}

/**
 * Extract project tasks from CSV data
 */
function extractProjectTasks(
  csvData: Array<Record<string, unknown>>,
  planConfig: PlanConfig
): ProjectTask[] {
  return csvData
    .filter((row) => {
      const project = planConfig.project_col ? String(row[planConfig.project_col] || '') : '';
      const hours = Number(row[planConfig.hours_col]) || 0;
      return project && project !== '' && hours > 0;
    })
    .map((row, index) => {
      const startDate = new Date(row[planConfig.start_date_col] as string);
      const endDate = new Date(row[planConfig.end_date_col] as string);
      
      return {
        id: String(row.id || index),
        project: planConfig.project_col ? String(row[planConfig.project_col]) : '',
        module: planConfig.module_col ? String(row[planConfig.module_col] || '') : '',
        hours: Number(row[planConfig.hours_col]),
        priority: calculatePriority(row),
        startDate,
        endDate,
        assignedResource: String(row[planConfig.resource_col] || ''),
      };
    })
    .sort((a, b) => {
      // Sort by priority (higher first), then by start date
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.startDate.getTime() - b.startDate.getTime();
    });
}

/**
 * Calculate task priority based on business rules
 */
function calculatePriority(row: Record<string, unknown>): number {
  let priority = 0;

  // Higher priority for projects with specific modules
  const module = String(row.modulo || '').toLowerCase();
  if (module.includes('core') || module.includes('critical')) {
    priority += 10;
  }

  // Higher priority for projects with more hours
  const hours = Number(row.plan_abap_dev_time) || 0;
  if (hours > 40) {
    priority += 5;
  }

  // Higher priority for projects starting soon
  const startDate = new Date(row.plan_abap_dev_ini as string);
  const daysUntilStart = Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysUntilStart <= 7) {
    priority += 15;
  } else if (daysUntilStart <= 30) {
    priority += 10;
  }

  return priority;
}

/**
 * Perform resource assignment using greedy algorithm
 */
function performResourceAssignment(
  tasks: ProjectTask[],
  resources: ABAPResource[],
  planConfig: PlanConfig
): ProjectTask[] {
  const assignedTasks: ProjectTask[] = [];
  const resourceMap = new Map(resources.map(r => [r.name, { ...r }]));

  for (const task of tasks) {
    // Skip if already assigned
    if (task.assignedResource && task.assignedResource !== '' && task.assignedResource !== 'None') {
      assignedTasks.push(task);
      continue;
    }

    // Find best available resource
    const bestResource = findBestResource(task, Array.from(resourceMap.values()));
    
    if (bestResource) {
      // Assign task to resource
      task.assignedResource = bestResource.name;
      bestResource.assignedHours += task.hours;
      bestResource.currentLoad = (bestResource.assignedHours / bestResource.availableHours) * 100;
      
      assignedTasks.push(task);
    } else {
      // No available resource found
      assignedTasks.push(task);
    }
  }

  return assignedTasks;
}

/**
 * Find the best available resource for a task
 */
function findBestResource(task: ProjectTask, resources: ABAPResource[]): ABAPResource | null {
  const availableResources = resources.filter(r => {
    const hasCapacity = r.assignedHours + task.hours <= r.availableHours;
    const hasSkill = r.skills.some(skill => 
      skill.toLowerCase().includes(task.module.toLowerCase()) ||
      task.module.toLowerCase().includes(skill.toLowerCase())
    );
    return hasCapacity && (hasSkill || r.skills.length === 0);
  });

  if (availableResources.length === 0) {
    return null;
  }

  // Sort by load (prefer less loaded resources)
  availableResources.sort((a, b) => a.currentLoad - b.currentLoad);
  
  return availableResources[0];
}

/**
 * Convert assignments back to original CSV format
 */
function convertToOriginalFormat(
  assignments: ProjectTask[],
  originalData: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  const assignmentMap = new Map(assignments.map(a => [a.id, a.assignedResource]));

  return originalData.map(row => ({
    ...row,
    abap_asignado: assignmentMap.get(String(row.id || '')) || row.abap_asignado || '',
  }));
}
