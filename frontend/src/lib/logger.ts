/**
 * Sistema de logging para el frontend
 * Proporciona logging estructurado con niveles y contexto
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private static instance: Logger;
  private isDevelopment: boolean;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  private constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    };
  }

  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, message, context } = entry;
    const time = new Date(timestamp).toLocaleTimeString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${time}] ${level} | ${message}${contextStr}`;
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  private getStyle(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'color: cyan';
      case LogLevel.INFO:
        return 'color: green';
      case LogLevel.WARN:
        return 'color: orange';
      case LogLevel.ERROR:
        return 'color: red; font-weight: bold';
      default:
        return '';
    }
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    const entry = this.createLogEntry(level, message, context, error);
    this.addToHistory(entry);

    // Solo mostrar logs en desarrollo o errores siempre
    if (this.isDevelopment || level === LogLevel.ERROR) {
      const consoleMethod = this.getConsoleMethod(level);
      const style = this.getStyle(level);
      
      consoleMethod(
        `%c${entry.level}`,
        style,
        `| ${message}`,
        context ? context : '',
        error ? error : ''
      );
    }
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  public info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  public error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  public logApiRequest(method: string, url: string, data?: any): void {
    this.info(`API Request: ${method} ${url}`, { data });
  }

  public logApiResponse(method: string, url: string, status: number, duration?: number): void {
    const context: Record<string, any> = { status };
    if (duration !== undefined) {
      context.duration = `${duration.toFixed(2)}ms`;
    }
    this.info(`API Response: ${method} ${url}`, context);
  }

  public logApiError(method: string, url: string, error: any): void {
    this.error(
      `API Error: ${method} ${url}`,
      error instanceof Error ? error : new Error(String(error)),
      { url, method }
    );
  }

  public logNavigation(from: string, to: string): void {
    this.info(`Navegación: ${from} → ${to}`);
  }

  public logUserAction(action: string, details?: Record<string, any>): void {
    this.info(`Acción de usuario: ${action}`, details);
  }

  public logAuthEvent(event: string, userId?: string): void {
    this.info(`Evento de autenticación: ${event}`, userId ? { userId } : undefined);
  }

  public getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  public clearHistory(): void {
    this.logHistory = [];
  }

  public exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }
}

// Exportar instancia singleton
export const logger = Logger.getInstance();

// Exportar funciones auxiliares para uso rápido
export const logDebug = (message: string, context?: Record<string, any>) =>
  logger.debug(message, context);

export const logInfo = (message: string, context?: Record<string, any>) =>
  logger.info(message, context);

export const logWarn = (message: string, context?: Record<string, any>) =>
  logger.warn(message, context);

export const logError = (message: string, error?: Error, context?: Record<string, any>) =>
  logger.error(message, error, context);
