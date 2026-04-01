const { Router } = require('express');
const controller = require('./record.controller');
const authenticate = require('../../middlewares/auth.middleware');
const ensureActive = require('../../middlewares/active-user.middleware');
const authorizeRoles = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createRecordSchema, updateRecordSchema } = require('./record.validation');

const router = Router();

// All record routes require authentication
router.use(authenticate, ensureActive);

/**
 * @openapi
 * /records:
 *   get:
 *     tags: [Records]
 *     summary: List financial records (all roles, with role-based restrictions)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [INCOME, EXPENSE] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: minAmount
 *         description: Analyst/Admin only
 *         schema: { type: number }
 *       - in: query
 *         name: maxAmount
 *         description: Analyst/Admin only
 *         schema: { type: number }
 *       - in: query
 *         name: sortBy
 *         description: Viewer limited to 'date'. Analyst/Admin can use date, amount, category, createdAt
 *         schema: { type: string }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Paginated list of records
 *   post:
 *     tags: [Records]
 *     summary: Create a financial record (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount: { type: number }
 *               type: { type: string, enum: [INCOME, EXPENSE] }
 *               category: { type: string }
 *               date: { type: string, format: date }
 *               note: { type: string }
 *     responses:
 *       201:
 *         description: Record created
 */
router.get('/', authorizeRoles('VIEWER', 'ANALYST', 'ADMIN'), controller.listRecords);
router.post('/', authorizeRoles('ADMIN'), validate(createRecordSchema), controller.createRecord);

/**
 * @openapi
 * /records/{id}:
 *   get:
 *     tags: [Records]
 *     summary: Get a single record by ID (all roles)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Record details
 *       404:
 *         description: Not found
 *   patch:
 *     tags: [Records]
 *     summary: Update a record (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number }
 *               type: { type: string, enum: [INCOME, EXPENSE] }
 *               category: { type: string }
 *               date: { type: string, format: date }
 *               note: { type: string }
 *     responses:
 *       200:
 *         description: Record updated
 *   delete:
 *     tags: [Records]
 *     summary: Soft delete a record (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Record deleted
 */
router.get('/:id', authorizeRoles('VIEWER', 'ANALYST', 'ADMIN'), controller.getRecord);
router.patch('/:id', authorizeRoles('ADMIN'), validate(updateRecordSchema), controller.updateRecord);
router.delete('/:id', authorizeRoles('ADMIN'), controller.deleteRecord);

module.exports = router;
