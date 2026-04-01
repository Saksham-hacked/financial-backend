const { Router } = require('express');
const controller = require('./user.controller');
const authenticate = require('../../middlewares/auth.middleware');
const ensureActive = require('../../middlewares/active-user.middleware');
const authorizeRoles = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createUserSchema, updateUserSchema, updateStatusSchema } = require('./user.validation');

const router = Router();

// All user routes — admin only
router.use(authenticate, ensureActive, authorizeRoles('ADMIN'));

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (Admin only)
 *     responses:
 *       200:
 *         description: List of users
 *   post:
 *     tags: [Users]
 *     summary: Create a new user (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [VIEWER, ANALYST, ADMIN]
 *     responses:
 *       201:
 *         description: User created
 */
router.get('/', controller.listUsers);
router.post('/', validate(createUserSchema), controller.createUser);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 *   patch:
 *     tags: [Users]
 *     summary: Update user name or role (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [VIEWER, ANALYST, ADMIN]
 *     responses:
 *       200:
 *         description: User updated
 */
router.get('/:id', controller.getUser);
router.patch('/:id', validate(updateUserSchema), controller.updateUser);

/**
 * @openapi
 * /users/{id}/status:
 *   patch:
 *     tags: [Users]
 *     summary: Activate or deactivate a user (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', validate(updateStatusSchema), controller.updateStatus);

module.exports = router;
