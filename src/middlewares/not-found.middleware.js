const ApiError = require('../utils/ApiError');
const messages = require('../constants/messages');

const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = notFound;
