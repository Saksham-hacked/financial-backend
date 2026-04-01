/**
 * Builds pagination metadata and Prisma skip/take values.
 * @param {number} page
 * @param {number} limit
 * @param {number} totalItems
 */
function paginate(page, limit, totalItems) {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    skip: (page - 1) * limit,
    take: limit,
    meta: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

module.exports = { paginate };
