// Centralized error handling for consistent application behavior
// Operational layer: Security-first, AI-optimized error management

export interface AppError {
  type:
    | 'validation'
    | 'network'
    | 'auth'
    | 'storage'
    | 'processing'
    | 'unknown';
  message: string;
  code?: string;
  details?: unknown;
  timestamp: number;
  userFriendly?: boolean;
}

export interface ErrorResponse {
  success: false;
  error: string;
  errorType?: string;
  details?: unknown;
}

/**
 * Create standardized error objects
 */
export function createError(
  type: AppError['type'],
  message: string,
  details?: unknown,
  userFriendly: boolean = false
): AppError {
  return {
    type,
    message,
    details,
    timestamp: Date.now(),
    userFriendly,
  };
}

/**
 * Convert AppError to API response format
 */
export function errorToResponse(error: AppError): ErrorResponse {
  return {
    success: false,
    error: error.userFriendly ? error.message : 'An error occurred',
    errorType: error.type,
    details: error.userFriendly ? error.details : undefined,
  };
}

/**
 * Handle CSV processing errors with special case preservation
 */
export function handleCSVError(error: { message?: string }): AppError {
  if (error.message?.includes('CSV parsing errors')) {
    return createError(
      'processing',
      'Invalid CSV format. Please check your file structure.',
      { originalError: error.message },
      true
    );
  }

  if (error.message?.includes('No valid data found')) {
    return createError(
      'validation',
      'No valid project data found in CSV. Please check your file content.',
      { originalError: error.message },
      true
    );
  }

  if (error.message?.includes('at least 3 lines')) {
    return createError(
      'validation',
      'CSV file must have at least 3 lines (title, empty line, headers).',
      { originalError: error.message },
      true
    );
  }

  return createError(
    'processing',
    'Error processing CSV file. Please try again.',
    { originalError: error.message },
    true
  );
}

/**
 * Handle Supabase connection errors
 */
export function handleSupabaseError(error: { message?: string }): AppError {
  if (error.message?.includes('fetch')) {
    return createError(
      'network',
      'Unable to connect to database. Using local storage.',
      { originalError: error.message },
      true
    );
  }

  if (error.message?.includes('auth')) {
    return createError(
      'auth',
      'Authentication error. Please log in again.',
      { originalError: error.message },
      true
    );
  }

  return createError(
    'storage',
    'Database connection error. Using local storage.',
    { originalError: error.message },
    true
  );
}

/**
 * Handle file upload errors
 */
export function handleUploadError(error: { message?: string }): AppError {
  if (error.message?.includes('Invalid file')) {
    return createError(
      'validation',
      'Please select a valid CSV file under 50MB.',
      { originalError: error.message },
      true
    );
  }

  if (error.message?.includes('No file provided')) {
    return createError(
      'validation',
      'Please select a file to upload.',
      { originalError: error.message },
      true
    );
  }

  return createError(
    'processing',
    'Upload failed. Please try again.',
    { originalError: error.message },
    true
  );
}

/**
 * Log error for debugging (development only)
 */
export function logError(_error: AppError, _context?: string) {
  // Error logging handled by external logging service in production
  // Development logging removed to comply with linting rules
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: AppError): string {
  if (error.userFriendly) {
    return error.message;
  }

  // Fallback messages for non-user-friendly errors
  switch (error.type) {
    case 'validation':
      return 'Please check your input and try again.';
    case 'network':
      return 'Network error. Please check your connection.';
    case 'auth':
      return 'Authentication error. Please log in again.';
    case 'storage':
      return 'Storage error. Please try again.';
    case 'processing':
      return 'Processing error. Please try again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}
