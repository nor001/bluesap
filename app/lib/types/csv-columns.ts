/**
 * Centralized CSV Column Configuration
 * 
 * This file contains all CSV column names as constants.
 * To change a column name, update it here and it will be reflected throughout the application.
 * 
 * @ai-function Provides centralized column name management
 * @ai-returns Object with all column name constants
 */

// Core Project Fields
export const CSV_COLUMNS = {
  // Project Information
  PROJECT: 'project',
  MODULE: 'module', 
  GROUP: 'group',
  ID: 'id',
  
  // Functional Assignment
  FUNCTIONAL_ASSIGNED: 'functionalAssigned',
  
  // ABAP Development
  PLANNED_ABAP_DEV_START: 'plannedAbapDevStart',
  PLANNED_ABAP_DEV_END: 'plannedAbapDevEnd',
  ACTUAL_ABAP_DEV_START: 'actualAbapDevStart',
  ACTUAL_ABAP_DEV_END: 'actualAbapDevEnd',
  ABAP_ASSIGNED: 'abapAssigned',
  ABAP_DEVELOPMENT_TIME: 'abapDevelopmentTime',
  ABAP_TEST_TIME: 'abapTestTime',
  PLANNED_ABAP_DEVELOPMENT_TIME: 'plannedAbapDevelopmentTime',
  
  // CPI Development
  PLANNED_CPI_DEV_START: 'plannedCpiDevStart',
  PLANNED_CPI_DEV_END: 'plannedCpiDevEnd',
  CPI_DEVELOPMENT_TIME: 'cpiDevelopmentTime',
  CPI_TEST_TIME: 'cpiTestTime',
  
  // Effort Management
  EFFORT_RECEIVED_PLAN: 'effortReceivedPlan',
  EFFORT_RECEIVED_REAL: 'effortReceivedReal',
  EFFORT_READY_DATE: 'effortReadyDate',
  EFFORT_EXECUTION_START: 'effortExecutionStart',
  EFFORT_STATUS: 'effortStatus',
  
  // Additional fields
  KEYWORDS: 'keywords',
} as const;

// Type for column names
export type CSVColumnName = typeof CSV_COLUMNS[keyof typeof CSV_COLUMNS];

// Required columns for validation
export const REQUIRED_COLUMNS: CSVColumnName[] = [
  CSV_COLUMNS.PLANNED_ABAP_DEV_START,
  CSV_COLUMNS.PLANNED_ABAP_DEV_END,
  CSV_COLUMNS.ABAP_ASSIGNED,
  CSV_COLUMNS.ABAP_DEVELOPMENT_TIME,
];

// Optional columns that enhance functionality
export const OPTIONAL_COLUMNS: CSVColumnName[] = [
  CSV_COLUMNS.PROJECT,
  CSV_COLUMNS.MODULE,
  CSV_COLUMNS.GROUP,
  CSV_COLUMNS.ID,
  CSV_COLUMNS.FUNCTIONAL_ASSIGNED,
  CSV_COLUMNS.ABAP_TEST_TIME,
  CSV_COLUMNS.CPI_DEVELOPMENT_TIME,
  CSV_COLUMNS.CPI_TEST_TIME,
  CSV_COLUMNS.EFFORT_RECEIVED_PLAN,
  CSV_COLUMNS.EFFORT_RECEIVED_REAL,
  CSV_COLUMNS.EFFORT_READY_DATE,
  CSV_COLUMNS.EFFORT_EXECUTION_START,
  CSV_COLUMNS.EFFORT_STATUS,
  CSV_COLUMNS.KEYWORDS,
];

// All available columns
export const ALL_COLUMNS: CSVColumnName[] = [
  ...REQUIRED_COLUMNS,
  ...OPTIONAL_COLUMNS,
];

// Column groups for different features
export const COLUMN_GROUPS = {
  PROJECT_INFO: [
    CSV_COLUMNS.PROJECT,
    CSV_COLUMNS.MODULE,
    CSV_COLUMNS.GROUP,
    CSV_COLUMNS.ID,
  ],
  ABAP_DEVELOPMENT: [
    CSV_COLUMNS.PLANNED_ABAP_DEV_START,
    CSV_COLUMNS.PLANNED_ABAP_DEV_END,
    CSV_COLUMNS.ACTUAL_ABAP_DEV_START,
    CSV_COLUMNS.ACTUAL_ABAP_DEV_END,
    CSV_COLUMNS.ABAP_ASSIGNED,
    CSV_COLUMNS.ABAP_DEVELOPMENT_TIME,
    CSV_COLUMNS.ABAP_TEST_TIME,
  ],
  CPI_DEVELOPMENT: [
    CSV_COLUMNS.PLANNED_CPI_DEV_START,
    CSV_COLUMNS.PLANNED_CPI_DEV_END,
    CSV_COLUMNS.CPI_DEVELOPMENT_TIME,
    CSV_COLUMNS.CPI_TEST_TIME,
  ],
  EFFORT_MANAGEMENT: [
    CSV_COLUMNS.EFFORT_RECEIVED_PLAN,
    CSV_COLUMNS.EFFORT_RECEIVED_REAL,
    CSV_COLUMNS.EFFORT_READY_DATE,
    CSV_COLUMNS.EFFORT_EXECUTION_START,
    CSV_COLUMNS.EFFORT_STATUS,
  ],
} as const;

// Column display names for UI
export const COLUMN_DISPLAY_NAMES: Record<CSVColumnName, string> = {
  [CSV_COLUMNS.PROJECT]: 'Project',
  [CSV_COLUMNS.MODULE]: 'Module',
  [CSV_COLUMNS.GROUP]: 'Group',
  [CSV_COLUMNS.ID]: 'ID',
  [CSV_COLUMNS.FUNCTIONAL_ASSIGNED]: 'Functional Assigned',
  [CSV_COLUMNS.PLANNED_ABAP_DEV_START]: 'Planned ABAP Dev Start',
  [CSV_COLUMNS.PLANNED_ABAP_DEV_END]: 'Planned ABAP Dev End',
  [CSV_COLUMNS.ACTUAL_ABAP_DEV_START]: 'Actual ABAP Dev Start',
  [CSV_COLUMNS.ACTUAL_ABAP_DEV_END]: 'Actual ABAP Dev End',
  [CSV_COLUMNS.ABAP_ASSIGNED]: 'ABAP Assigned',
  [CSV_COLUMNS.ABAP_DEVELOPMENT_TIME]: 'ABAP Development Time',
  [CSV_COLUMNS.ABAP_TEST_TIME]: 'ABAP Test Time',
  [CSV_COLUMNS.PLANNED_ABAP_DEVELOPMENT_TIME]: 'Planned ABAP Development Time',
  [CSV_COLUMNS.PLANNED_CPI_DEV_START]: 'Planned CPI Dev Start',
  [CSV_COLUMNS.PLANNED_CPI_DEV_END]: 'Planned CPI Dev End',
  [CSV_COLUMNS.CPI_DEVELOPMENT_TIME]: 'CPI Development Time',
  [CSV_COLUMNS.CPI_TEST_TIME]: 'CPI Test Time',
  [CSV_COLUMNS.EFFORT_RECEIVED_PLAN]: 'Effort Received Plan',
  [CSV_COLUMNS.EFFORT_RECEIVED_REAL]: 'Effort Received Real',
  [CSV_COLUMNS.EFFORT_READY_DATE]: 'Effort Ready Date',
  [CSV_COLUMNS.EFFORT_EXECUTION_START]: 'Effort Execution Start',
  [CSV_COLUMNS.EFFORT_STATUS]: 'Effort Status',
  [CSV_COLUMNS.KEYWORDS]: 'Keywords',
};

// Helper function to get display name
export function getColumnDisplayName(columnName: CSVColumnName): string {
  return COLUMN_DISPLAY_NAMES[columnName] || columnName;
}

// Helper function to validate column name
export function isValidColumnName(columnName: string): columnName is CSVColumnName {
  return Object.values(CSV_COLUMNS).includes(columnName as CSVColumnName);
}

// Helper function to get required columns
export function getRequiredColumns(): CSVColumnName[] {
  return [...REQUIRED_COLUMNS];
}

// Helper function to get all columns
export function getAllColumns(): CSVColumnName[] {
  return [...ALL_COLUMNS];
}

// Helper function to get column group
export function getColumnGroup(groupName: keyof typeof COLUMN_GROUPS): CSVColumnName[] {
  return [...COLUMN_GROUPS[groupName]];
}
