const userService = require('./user.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const listUsers = asyncHandler(async (req, res) => {
  const users = await userService.listUsers();
  return ApiResponse.ok(res, 'Users fetched successfully.', users);
});

const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return ApiResponse.ok(res, 'User fetched successfully.', user);
});

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  return ApiResponse.created(res, 'User created successfully.', user);
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  return ApiResponse.ok(res, 'User updated successfully.', user);
});

const updateStatus = asyncHandler(async (req, res) => {
  const user = await userService.updateStatus(req.params.id, req.body.status);
  return ApiResponse.ok(res, 'User status updated successfully.', user);
});

module.exports = { listUsers, getUser, createUser, updateUser, updateStatus };
