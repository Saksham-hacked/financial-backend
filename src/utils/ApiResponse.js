class ApiResponse {
  static success(res, statusCode, message, data = null, meta = null) {
    const body = { success: true, message };
    if (data !== null) body.data = data;
    if (meta !== null) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static created(res, message, data) {
    return ApiResponse.success(res, 201, message, data);
  }

  static ok(res, message, data, meta) {
    return ApiResponse.success(res, 200, message, data, meta);
  }
}

module.exports = ApiResponse;
