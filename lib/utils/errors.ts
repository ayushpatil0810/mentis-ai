export class ApplicationError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message = "Not Found") {
    super(message, 404);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message = "Validation Error") {
    super(message, 400);
  }
}
