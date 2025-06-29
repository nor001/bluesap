// Types for SAP Gestion application
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
}

export interface FilterState {
  selected_proy: string;
  selected_modulo: string;
  selected_grupo: string;
  id_filter: string;
  consultor_ntt: string;
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
  total_projects: number;
  total_tasks: number;
  assigned_tasks: number;
  unassigned_tasks: number;
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
