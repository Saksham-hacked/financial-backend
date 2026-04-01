const Joi = require('joi');

// tlds: { allow: false } permits .local and other non-standard TLDs
const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .lowercase()
  .required();

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  email: emailSchema,
  password: Joi.string().min(6).max(72).required(),
  role: Joi.string().valid('VIEWER', 'ANALYST', 'ADMIN').required(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100),
  role: Joi.string().valid('VIEWER', 'ANALYST', 'ADMIN'),
}).min(1);

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE').required(),
});

module.exports = { createUserSchema, updateUserSchema, updateStatusSchema };
