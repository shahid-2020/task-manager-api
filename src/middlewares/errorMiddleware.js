const _httpError = require('http-errors');
class ErrorMiddleware {
  constructor(httpError) {
    this.httpError = httpError;
  }

  defaultError(req, res, next) {
    next(this.httpError.NotFound());
  }

  processError(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      status: 'error',
      message: err.message || 'Internal Server Error',
    });
  }
}

module.exports = new ErrorMiddleware(_httpError);
