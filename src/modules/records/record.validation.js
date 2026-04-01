const Joi = require('joi');

const createRecordSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  type: Joi.string().valid('INCOME', 'EXPENSE').required(),
  category: Joi.string().trim().min(1).max(100).required(),
  date: Joi.date().iso().required(),
  note: Joi.string().trim().max(500).allow('', null).optional(),
});

const updateRecordSchema = Joi.object({
  amount: Joi.number().positive().precision(2),
  type: Joi.string().valid('INCOME', 'EXPENSE'),
  category: Joi.string().trim().min(1).max(100),
  date: Joi.date().iso(),
  note: Joi.string().trim().max(500).allow('', null),
}).min(1);

module.exports = { createRecordSchema, updateRecordSchema };
