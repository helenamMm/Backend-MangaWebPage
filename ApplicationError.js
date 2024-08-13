class ApplicationError extends Error {
  constructor(message, status) {
    super();
    
    Error.captureStackTrace(this, this.constructor);
    
    this.name = this.constructor.name;
    
    this.message = message || 
        'Something went wrong. Please try again.';
    
    this.status = status || 500;
}}

class UserNotFoundError extends ApplicationError {
  constructor(message) {
    super(message || 'No User found.', 404);
  }
}

class ContraNoValida extends ApplicationError {
  constructor(message) {
    super(message || 'Contra no valida.', 401);
  }
}

module.exports = {UserNotFoundError: UserNotFoundError, ContraNoValida: ContraNoValida};
