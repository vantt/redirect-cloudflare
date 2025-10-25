/**
 * Custom error class for redirect-related errors
 * Extends Error with statusCode and code properties for proper HTTP response handling
 */
export class RedirectError extends Error {
  public readonly statusCode: number
  public readonly code: string

  constructor(message: string, statusCode: number = 400, code: string = 'REDIRECT_ERROR') {
    super(message)
    this.name = 'RedirectError'
    this.statusCode = statusCode
    this.code = code
  }
}