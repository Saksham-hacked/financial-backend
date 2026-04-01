const Joi = require('joi');

// Allow .local and other non-standard TLDs used in dev/seed data
const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .lowercase()
  .required();

const registerSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  email: emailSchema,
  password: Joi.string().min(6).max(72).required(),
});

const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().required(),
});

module.exports = { registerSchema, loginSchema };
