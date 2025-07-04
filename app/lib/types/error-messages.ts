// Centralized Error Messages
export const ERROR_MESSAGES = {
  // General errors
  REQUIRED: 'Este campo es obligatorio',
  INVALID_EMAIL: 'Correo inválido',
  NOT_FOUND: 'No encontrado',
  UNKNOWN_ERROR: 'Error desconocido',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  UNEXPECTED_ERROR: 'Error inesperado',
  
  // Network errors
  CONNECTION_TIMEOUT: 'Connection timeout or network error',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  
  // Authentication errors
  AUTH_ERROR: 'Authentication error. Please log in again.',
  CONFIG_ERROR: 'Error de configuración. Por favor, contacta al administrador.',
  USER_ERROR: 'User error occurred',
  USER_NOT_FOUND: 'User not found',
  NOT_INVITED: 'User not invited to this application',
  
  // Database errors
  DB_CONNECTION_ERROR: 'Database connection error. Using local storage.',
  
  // Storage errors
  STORAGE_ERROR: 'Storage error. Please try again.',
  
  // Processing errors
  PROCESSING_ERROR: 'Processing error. Please try again.',
  CSV_PROCESSING_ERROR: 'Error processing CSV file. Please try again.',
  FILE_PROCESSING_ERROR: 'Error al procesar archivo',
  
  // Bucket errors
  BUCKET_LIST_ERROR: 'Error al listar buckets',
  BUCKET_CREATE_ERROR: 'Error al crear bucket',
  
  // Validation errors
  VALIDATION_ERROR: 'Error durante la validación',
  
  // Login errors
  LOGIN_ERROR: 'Error desconocido durante el login',
  
  // Generic fallback
  GENERIC_ERROR: 'An error occurred',
  GENERIC_FALLBACK: 'An unexpected error occurred. Please try again.',
}; 