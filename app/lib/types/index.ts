// Types for SAP Gestion application

// Re-export CSV column types
export * from './csv-columns';

export interface ResourceConfig {
  level: 'SENIOR' | 'SEMI_SENIOR' | 'PLENO' | 'JUNIOR';
  max_tasks: number;
}

export interface PlanConfig {
  resource_col: string;
  hours_col: string;
  available_date_col: string;
  plan_date_col: string;
  start_date_col: string;
  end_date_col: string;
  resource_title: string;
  resources_title: string;
  assigned_title: string;
  use_group_based_assignment: boolean;
  module_col?: string;
  project_col?: string;
}

export interface FilterState {
  selectedProject: string;
  selectedModule: string;
  selectedGroup: string;
  functionalAssigned: string;
  idFilter: string;
}

export interface TimelineData {
  Task: string;
  Start: string;
  Finish: string;
  Resource: string;
  Hours: number;
  dev_group: string;
  [key: string]: unknown;
}

export interface MetricsData {
  totalProjects: number;
  totalTasks: number;
  assignedTasks: number;
  unassignedTasks: number;
}

export interface AppState {
  csvData: Array<Record<string, unknown>>;
  assignedData: Array<Record<string, unknown>>;
  filters: FilterState;
  loading: boolean;
  planType: string;
  metrics: MetricsData;
  timelineData: TimelineData[];
  csvMetadata?: CSVMetadata;
}

export interface UploadResponse {
  success: boolean;
  data?: Array<Record<string, unknown>>;
  error?: string;
  message?: string;
  metadata?: CSVMetadata;
}

export interface ProcessResponse {
  success: boolean;
  data?: Array<Record<string, unknown>>;
  assignedData?: Array<Record<string, unknown>>;
  error?: string;
}

export interface AssignmentResponse {
  success: boolean;
  data?: Array<Record<string, unknown>>;
  error?: string;
}

export interface ExportResponse {
  success: boolean;
  data?: string;
  filename?: string;
  error?: string;
}

export interface CSVMetadata {
  id: number;
  uploaded_at: string;
  file_size: number;
  uploaded_by?: string;
  row_count: number;
}

export interface MetadataResponse {
  success: boolean;
  metadata?: CSVMetadata;
  error?: string;
}

export interface CSVRowData {
  keywords: string;
  plannedAbapDevStart: string;
  plannedAbapDevEnd: string;
  abapAssigned: string;
  abapDevelopmentTime: string;
  abapTestTime: string;
  cpiDevelopmentTime: string;
  cpiTestTime: string;
  plannedAbapDevelopmentTime: string;
  effortReceivedPlan: string;
  effortReceivedReal: string;
  effortReadyDate: string;
  effortExecutionStart: string;
  effortStatus: string;
  functionalAssigned: string;
  actualAbapDevStart: string;
  actualAbapDevEnd: string;
  plannedCpiDevStart: string;
  plannedCpiDevEnd: string;
  project: string;
  module: string;
  group: string;
  id: string;
}

// Error types
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DataProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataProcessingError';
  }
}

export class ResourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceError';
  }
}

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}
