const { Prisma } = require('@prisma/client');
const ApiError = require('../utils/ApiError');
const { nodeEnv } = require('../config/env');
const messages = require('../constants/messages');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || messages.INTERNAL_ERROR;
  let errors = err.errors || [];

  // Handle Prisma unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'A record with this value already exists.';
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found.';
    }
  }

  // Hide unexpected errors in production
  if (!err.isOperational && nodeEnv === 'production') {
    statusCode = 500;
    message = messages.INTERNAL_ERROR;
    errors = [];
  }

  const body = { success: false, message };
  if (errors.length > 0) body.errors = errors;
  if (nodeEnv !== 'production' && !err.isOperational) body.stack = err.stack;

  return res.status(statusCode).json(body);
};

module.exports = errorHandler;
