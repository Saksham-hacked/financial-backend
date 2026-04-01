const { Router } = require('express');
const controller = require('./dashboard.controller');
const authenticate = require('../../middlewares/auth.middleware');
const ensureActive = require('../../middlewares/active-user.middleware');
const authorizeRoles = require('../../middlewares/role.middleware');

const router = Router();

router.use(authenticate, ensureActive);

/**
 * @openapi
 * /dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Basic summary — totalIncome, totalExpenses, netBalance, recentActivity (all roles)
 *     responses:
 *       200:
 *         description: Summary data
 */
router.get('/summary', authorizeRoles('VIEWER', 'ANALYST', 'ADMIN'), controller.getSummary);

/**
 * @openapi
 * /dashboard/category-breakdown:
 *   get:
 *     tags: [Dashboard]
 *     summary: Category-wise income/expense breakdown (Analyst, Admin)
 *     responses:
 *       200:
 *         description: Category breakdown
 */
router.get('/category-breakdown', authorizeRoles('ANALYST', 'ADMIN'), controller.getCategoryBreakdown);

/**
 * @openapi
 * /dashboard/monthly-trends:
 *   get:
 *     tags: [Dashboard]
 *     summary: Monthly income/expense trends (Analyst, Admin)
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *         description: Year to query (defaults to current year)
 *     responses:
 *       200:
 *         description: Monthly trends
 */
router.get('/monthly-trends', authorizeRoles('ANALYST', 'ADMIN'), controller.getMonthlyTrends);

/**
 * @openapi
 * /dashboard/recent-activity:
 *   get:
 *     tags: [Dashboard]
 *     summary: Recent financial activity (Analyst, Admin)
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Recent records
 */
router.get('/recent-activity', authorizeRoles('ANALYST', 'ADMIN'), controller.getRecentActivity);

module.exports = router;
