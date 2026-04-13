class AppError extends Error {
  constructor(statusCode, intOpCode, message, details = null) {
    super(message);

    this.statusCode = statusCode;
    this.intOpCode = intOpCode;
    this.details = details;
  }
}

module.exports = AppError;
