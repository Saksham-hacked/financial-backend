const recordService = require('./record.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const listRecords = asyncHandler(async (req, res) => {
  const { records, meta } = await recordService.listRecords(req.query, req.user.role);
  return ApiResponse.ok(res, 'Records fetched successfully.', records, meta);
});

const getRecord = asyncHandler(async (req, res) => {
  const record = await recordService.getRecordById(req.params.id);
  return ApiResponse.ok(res, 'Record fetched successfully.', record);
});

const createRecord = asyncHandler(async (req, res) => {
  const record = await recordService.createRecord(req.body, req.user.id);
  return ApiResponse.created(res, 'Record created successfully.', record);
});

const updateRecord = asyncHandler(async (req, res) => {
  const record = await recordService.updateRecord(req.params.id, req.body);
  return ApiResponse.ok(res, 'Record updated successfully.', record);
});

const deleteRecord = asyncHandler(async (req, res) => {
  await recordService.softDeleteRecord(req.params.id);
  return ApiResponse.ok(res, 'Record deleted successfully.');
});

module.exports = { listRecords, getRecord, createRecord, updateRecord, deleteRecord };
