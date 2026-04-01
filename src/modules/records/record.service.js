const { PrismaClient } = require('@prisma/client');
const ApiError = require('../../utils/ApiError');
const { paginate } = require('../../utils/pagination');
const { parseRecordQuery } = require('../../utils/queryParser');
const messages = require('../../constants/messages');

const prisma = new PrismaClient();

// Prisma returns Decimal for amount — convert to plain float for JSON
const serializeRecord = (record) => ({
  ...record,
  amount: record.amount ? parseFloat(record.amount.toString()) : null,
});

const listRecords = async (query, role) => {
  const { where, orderBy, page, limit } = parseRecordQuery(query, role);

  const totalItems = await prisma.financialRecord.count({ where });
  const { skip, take, meta } = paginate(page, limit, totalItems);

  const records = await prisma.financialRecord.findMany({
    where,
    orderBy,
    skip,
    take,
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });

  return { records: records.map(serializeRecord), meta };
};

const getRecordById = async (id) => {
  const record = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });
  if (!record) throw ApiError.notFound(messages.RECORD_NOT_FOUND);
  return serializeRecord(record);
};

const createRecord = async (data, userId) => {
  // Joi date().iso() already parses the string into a JS Date — use it directly
  const record = await prisma.financialRecord.create({
    data: {
      amount:      data.amount,
      type:        data.type,
      category:    data.category,
      date:        new Date(data.date),   // ensure it's a proper Date object
      note:        data.note ?? null,
      createdById: userId,
    },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });
  return serializeRecord(record);
};

const updateRecord = async (id, data) => {
  const existing = await prisma.financialRecord.findFirst({ where: { id, isDeleted: false } });
  if (!existing) throw ApiError.notFound(messages.RECORD_NOT_FOUND);

  const updateData = { ...data };
  if (data.date) updateData.date = new Date(data.date);

  const record = await prisma.financialRecord.update({
    where: { id },
    data: updateData,
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });
  return serializeRecord(record);
};

const softDeleteRecord = async (id) => {
  const existing = await prisma.financialRecord.findFirst({ where: { id, isDeleted: false } });
  if (!existing) throw ApiError.notFound(messages.RECORD_NOT_FOUND);

  await prisma.financialRecord.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

module.exports = { listRecords, getRecordById, createRecord, updateRecord, softDeleteRecord };
