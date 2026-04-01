const ApiError = require('../utils/ApiError');
const messages = require('../constants/messages');

/**
 * Validates request body using a Joi schema.
 * Usage: validate(schema) as middleware
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const { error } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
  if (!error) return next();

  const errors = error.details.map((d) => d.message);
  return next(ApiError.badRequest(messages.VALIDATION_FAILED, errors));
};

module.exports = validate;
