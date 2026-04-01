const ApiError = require('../utils/ApiError');
const messages = require('../constants/messages');

/**
 * Usage: authorizeRoles('ADMIN', 'ANALYST')
 */
const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(messages.FORBIDDEN));
  }
  next();
};

module.exports = authorizeRoles;
