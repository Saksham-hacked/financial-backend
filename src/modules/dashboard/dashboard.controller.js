const dashboardService = require('./dashboard.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const getSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSummary();
  return ApiResponse.ok(res, 'Dashboard summary fetched.', data);
});

const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const data = await dashboardService.getCategoryBreakdown();
  return ApiResponse.ok(res, 'Category breakdown fetched.', data);
});

const getMonthlyTrends = asyncHandler(async (req, res) => {
  const data = await dashboardService.getMonthlyTrends(req.query.year);
  return ApiResponse.ok(res, 'Monthly trends fetched.', data);
});

const getRecentActivity = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const data = await dashboardService.getRecentActivity(limit);
  return ApiResponse.ok(res, 'Recent activity fetched.', data);
});

module.exports = { getSummary, getCategoryBreakdown, getMonthlyTrends, getRecentActivity };
