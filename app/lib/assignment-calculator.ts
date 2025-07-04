import { PlanConfig } from './types';
import { CSV_COLUMNS } from './types/csv-columns';

// Helper functions for assignment calculation
function _isHoliday(date: Date, holidays: Record<string, string>): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return dateStr in holidays;
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
 * Calculate resource assignments using centralized column configuration
 * @ai-function Calculates resource assignments using centralized column names
 * @ai-returns Array of assigned data with resource assignments
 */
export function calculateAssignments(
  csvData: Array<Record<string, unknown>>,
  planType: string
): Array<Record<string, unknown>> {
  const planConfig = getPlanConfiguration(planType);
  
  // Extract resources using centralized column names
  const resources = extractABAPResources(csvData, planConfig);
  
  // Extract tasks using centralized column names
  const tasks = extractProjectTasks(csvData, planConfig);
  
  // Perform assignment
  const assignedTasks = performResourceAssignment(tasks, resources, planConfig);
  
  // Convert back to original format
  return convertToOriginalFormat(assignedTasks, csvData);
}

/**
 * Get plan configuration with centralized column names
 */
function getPlanConfiguration(planType: string): PlanConfig {
  const configs: Record<string, PlanConfig> = {
    'Plan de Desarrollo': {
      resource_col: CSV_COLUMNS.ABAP_ASSIGNED,
      hours_col: CSV_COLUMNS.ABAP_DEVELOPMENT_TIME,
      available_date_col: CSV_COLUMNS.PLANNED_ABAP_DEV_START,
      plan_date_col: CSV_COLUMNS.PLANNED_ABAP_DEV_END,
      start_date_col: CSV_COLUMNS.ACTUAL_ABAP_DEV_START,
      end_date_col: CSV_COLUMNS.ACTUAL_ABAP_DEV_END,
      resource_title: 'ABAP Developer',
      resources_title: 'ABAP Developers',
      assigned_title: 'ABAP Assigned',
      use_group_based_assignment: true,
      module_col: CSV_COLUMNS.MODULE,
      project_col: CSV_COLUMNS.PROJECT,
    },
    'Plan de PU': {
      resource_col: CSV_COLUMNS.ABAP_ASSIGNED,
      hours_col: CSV_COLUMNS.ABAP_DEVELOPMENT_TIME,
      available_date_col: CSV_COLUMNS.PLANNED_ABAP_DEV_START,
      plan_date_col: CSV_COLUMNS.PLANNED_ABAP_DEV_END,
      start_date_col: CSV_COLUMNS.ACTUAL_ABAP_DEV_START,
      end_date_col: CSV_COLUMNS.ACTUAL_ABAP_DEV_END,
      resource_title: 'ABAP Developer',
      resources_title: 'ABAP Developers',
      assigned_title: 'ABAP Assigned',
      use_group_based_assignment: false,
      module_col: CSV_COLUMNS.MODULE,
      project_col: CSV_COLUMNS.PROJECT,
    },
    'Plan de Test': {
      resource_col: CSV_COLUMNS.ABAP_ASSIGNED,
      hours_col: CSV_COLUMNS.ABAP_TEST_TIME,
      available_date_col: CSV_COLUMNS.PLANNED_ABAP_DEV_END,
      plan_date_col: CSV_COLUMNS.PLANNED_ABAP_DEV_END,
      start_date_col: CSV_COLUMNS.ACTUAL_ABAP_DEV_END,
      end_date_col: CSV_COLUMNS.ACTUAL_ABAP_DEV_END,
      resource_title: 'ABAP Test',
      resources_title: 'ABAP Testers',
      assigned_title: 'ABAP Assigned',
      use_group_based_assignment: false,
      module_col: CSV_COLUMNS.MODULE,
      project_col: CSV_COLUMNS.PROJECT,
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
    const grupo = String(row[CSV_COLUMNS.GROUP] || '');

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
  const moduleName = String(row[CSV_COLUMNS.MODULE] || '').toLowerCase();
  if (moduleName.includes('core') || moduleName.includes('critical')) {
    priority += 10;
  }

  // Higher priority for projects with more hours
  const hours = Number(row[CSV_COLUMNS.ABAP_DEVELOPMENT_TIME]) || 0;
  if (hours > 40) {
    priority += 5;
  }

  // Higher priority for projects starting soon
  const startDate = new Date(row[CSV_COLUMNS.PLANNED_ABAP_DEV_START] as string);
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
  _planConfig: PlanConfig
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
