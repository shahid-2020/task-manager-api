const _httpError = require('http-errors');
const _jwt = require('jsonwebtoken');
const _User = require('../models/userModel');

class AuthorizeMiddleware {
  constructor(User, httpError, jwt) {
    this.User = User;
    this.httpError = httpError;
    this.jwt = jwt;
    this.authorize = this.authorize.bind(this);
  }

  async authorize(req, res, next) {
    try {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findOne({
        _id: decoded._id,
        'tokens.token': token,
      });

      if (!user) {
        throw this.httpError.Unauthorized();
      }

      req.token = token;
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        next(this.httpError.Unauthorized('Token Expired'));
      }
      next(this.httpError.Unauthorized());
    }
  }
}

module.exports = new AuthorizeMiddleware(_User, _httpError, _jwt);
