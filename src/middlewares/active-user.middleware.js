const ApiError = require('../utils/ApiError');
const messages = require('../constants/messages');

const ensureActiveUser = (req, res, next) => {
  if (req.user.status !== 'ACTIVE') {
    return next(ApiError.forbidden(messages.INACTIVE_USER));
  }
  next();
};

module.exports = ensureActiveUser;
