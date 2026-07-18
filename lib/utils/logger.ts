/**
 * Centralized Application Logger
 * Used to log events, errors, and standard requests.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  message: string;
  context?: string;
  error?: any;
  [key: string]: any;
}

class Logger {
  private formatLog(level: LogLevel, payload: LogPayload) {
    const timestamp = new Date().toISOString();
    
    // In production, we typically format as JSON for logging aggregators (e.g., Datadog, AWS CloudWatch)
    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify({ timestamp, level, ...payload });
    }
    
    // In development, we format for readability
    const ctx = payload.context ? `[${payload.context}]` : '';
    const msg = `${timestamp} ${level.toUpperCase()} ${ctx} ${payload.message}`;
    
    if (payload.error) {
      return `${msg}\n${payload.error.stack || payload.error}`;
    }
    
    const { message, context, error, ...extra } = payload;
    
    if (Object.keys(extra).length > 0) {
      return `${msg} ${JSON.stringify(extra)}`;
    }
    
    return msg;
  }

  info(message: string, meta?: Omit<LogPayload, 'message'>) {
    console.info(this.formatLog('info', { message, ...meta }));
  }

  warn(message: string, meta?: Omit<LogPayload, 'message'>) {
    console.warn(this.formatLog('warn', { message, ...meta }));
  }

  error(message: string, error?: any, meta?: Omit<LogPayload, 'message' | 'error'>) {
    console.error(this.formatLog('error', { message, error, ...meta }));
  }

  debug(message: string, meta?: Omit<LogPayload, 'message'>) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatLog('debug', { message, ...meta }));
    }
  }
}

export const logger = new Logger();
