export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context: string;
  timestamp: Date;
  data?: any;
  userId?: string;
}

export class Logger {
  private static isDevelopment = process.env.NODE_ENV === 'development';
  private static isProduction = process.env.NODE_ENV === 'production';

  static log(entry: LogEntry) {
    const logMessage = {
      ...entry,
      timestamp: entry.timestamp.toISOString(),
      environment: process.env.NODE_ENV
    };

    if (this.isDevelopment) {
      // En desarrollo: console con colores
      const colors = {
        info: '\x1b[36m', // Cyan
        warn: '\x1b[33m', // Yellow
        error: '\x1b[31m', // Red
        debug: '\x1b[35m'  // Magenta
      };
      
      console.log(
        `${colors[entry.level]}[${entry.level.toUpperCase()}]\x1b[0m ${entry.context}: ${entry.message}`,
        entry.data ? entry.data : ''
      );
    }

    if (this.isProduction) {
      // En producción: enviar a servicio externo (ej: Sentry, LogRocket)
      // Por ahora solo console pero estructurado
      console.log(JSON.stringify(logMessage));
    }
  }

  static info(message: string, context: string, data?: any) {
    this.log({ level: 'info', message, context, timestamp: new Date(), data });
  }

  static warn(message: string, context: string, data?: any) {
    this.log({ level: 'warn', message, context, timestamp: new Date(), data });
  }

  static error(message: string, context: string, data?: any) {
    this.log({ level: 'error', message, context, timestamp: new Date(), data });
  }

  static debug(message: string, context: string, data?: any) {
    if (this.isDevelopment) {
      this.log({ level: 'debug', message, context, timestamp: new Date(), data });
    }
  }
} 