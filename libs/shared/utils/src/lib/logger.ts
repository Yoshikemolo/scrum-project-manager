export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  timestamp?: boolean;
  colors?: boolean;
}

export class Logger {
  private level: LogLevel;
  private prefix: string;
  private timestamp: boolean;
  private colors: boolean;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? LogLevel.INFO;
    this.prefix = options.prefix ?? '';
    this.timestamp = options.timestamp ?? true;
    this.colors = options.colors ?? true;
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const parts = [];
    
    if (this.timestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    
    if (this.prefix) {
      parts.push(`[${this.prefix}]`);
    }
    
    parts.push(`[${level}]`);
    parts.push(message);
    
    return parts.join(' ');
  }

  private getColor(level: LogLevel): string {
    if (!this.colors) return '';
    
    switch (level) {
      case LogLevel.DEBUG:
        return '\x1b[36m'; // Cyan
      case LogLevel.INFO:
        return '\x1b[32m'; // Green
      case LogLevel.WARN:
        return '\x1b[33m'; // Yellow
      case LogLevel.ERROR:
        return '\x1b[31m'; // Red
      case LogLevel.FATAL:
        return '\x1b[35m'; // Magenta
      default:
        return '\x1b[0m'; // Reset
    }
  }

  private log(level: LogLevel, levelName: string, message: string, ...args: any[]): void {
    if (level < this.level) return;
    
    const formattedMessage = this.formatMessage(levelName, message, ...args);
    const color = this.getColor(level);
    const reset = this.colors ? '\x1b[0m' : '';
    
    const output = `${color}${formattedMessage}${reset}`;
    
    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(output, ...args);
        break;
      case LogLevel.WARN:
        console.warn(output, ...args);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(output, ...args);
        break;
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, 'INFO', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, 'WARN', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, 'ERROR', message, ...args);
  }

  fatal(message: string, ...args: any[]): void {
    this.log(LogLevel.FATAL, 'FATAL', message, ...args);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  child(prefix: string): Logger {
    return new Logger({
      level: this.level,
      prefix: this.prefix ? `${this.prefix}:${prefix}` : prefix,
      timestamp: this.timestamp,
      colors: this.colors,
    });
  }
}

export const logger = new Logger();
