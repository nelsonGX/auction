import config from '../config/env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private log(level: LogLevel, message: string, meta?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const logObject = {
      timestamp,
      level,
      message,
      ...meta,
    };

    // In production, we would use a proper logging library
    // For simplicity, we're just using console
    switch (level) {
      case 'info':
        console.info(JSON.stringify(logObject));
        break;
      case 'warn':
        console.warn(JSON.stringify(logObject));
        break;
      case 'error':
        console.error(JSON.stringify(logObject));
        break;
      case 'debug':
        if (!config.isProduction) {
          console.debug(JSON.stringify(logObject));
        }
        break;
    }
  }

  public info(message: string, meta?: Record<string, any>) {
    this.log('info', message, meta);
  }

  public warn(message: string, meta?: Record<string, any>) {
    this.log('warn', message, meta);
  }

  public error(message: string, meta?: Record<string, any>) {
    this.log('error', message, meta);
  }

  public debug(message: string, meta?: Record<string, any>) {
    this.log('debug', message, meta);
  }
}

export default new Logger();