const ROLES = require('../constants/roles');

/**
 * Parses and enforces query params for record listing based on user role.
 * Returns a Prisma-compatible `where` object, order clause, page, and limit.
 */
function parseRecordQuery(query, role) {
  const isViewer = role === ROLES.VIEWER;

  // Page and limit
  let page = Math.max(1, parseInt(query.page) || 1);
  const maxLimit = isViewer ? 20 : 100;
  let limit = Math.min(parseInt(query.limit) || 10, maxLimit);

  // Build where clause
  const where = { isDeleted: false };

  if (query.type) where.type = query.type;
  if (query.category) where.category = { contains: query.category, mode: 'insensitive' };

  if (query.startDate || query.endDate) {
    where.date = {};
    if (query.startDate) where.date.gte = new Date(query.startDate);
    if (query.endDate) where.date.lte = new Date(query.endDate);
  }

  // Advanced filters — analysts and admins only
  if (!isViewer) {
    if (query.minAmount || query.maxAmount) {
      where.amount = {};
      if (query.minAmount) where.amount.gte = parseFloat(query.minAmount);
      if (query.maxAmount) where.amount.lte = parseFloat(query.maxAmount);
    }
  }

  // Sorting
  const allowedSortFields = isViewer ? ['date'] : ['date', 'amount', 'category', 'createdAt'];
  const sortBy = allowedSortFields.includes(query.sortBy) ? query.sortBy : 'date';
  const order = query.order === 'asc' ? 'asc' : 'desc';
  const orderBy = { [sortBy]: order };

  return { where, orderBy, page, limit };
}

module.exports = { parseRecordQuery };
