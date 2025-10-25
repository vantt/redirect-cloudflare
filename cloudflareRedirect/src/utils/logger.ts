/**
 * Structured Logger Utility
 * 
 * Provides JSON-structured logging for Cloudflare Workers environment.
 * Note: Using custom implementation instead of Hono's built-in logger
 * because @hono/logger is not available in Workers runtime.
 * 
 * Uses standard console.log/error for compatibility with Cloudflare Workers.
 */

interface LogMetadata {
  [key: string]: any
}

interface LogEntry {
  level: 'info' | 'error'
  message: string
  timestamp: string
  [key: string]: any
}

class StructuredLogger {
  private createLogEntry(level: 'info' | 'error', message: string, metadata?: LogMetadata): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString()
    }
    
    if (metadata) {
      Object.assign(entry, metadata)
    }
    
    return entry
  }

  info(message: string, metadata?: LogMetadata): void {
    const entry = this.createLogEntry('info', message, metadata)
    console.log(JSON.stringify(entry))
  }

  error(message: string, metadata?: LogMetadata): void {
    const entry = this.createLogEntry('error', message, metadata)
    console.error(JSON.stringify(entry))
  }
}

export const appLogger = new StructuredLogger()