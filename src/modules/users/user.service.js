const bcrypt = require('bcrypt');
const { PrismaClient, Prisma } = require('@prisma/client');
const ApiError = require('../../utils/ApiError');
const messages = require('../../constants/messages');

const prisma = new PrismaClient();

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

const listUsers = async () => {
  return prisma.user.findMany({ select: userSelect, orderBy: { createdAt: 'desc' } });
};

const getUserById = async (id) => {
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) throw ApiError.notFound(messages.USER_NOT_FOUND);
  return user;
};

const createUser = async ({ name, email, password, role }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    return await prisma.user.create({
      data: { name, email, passwordHash, role, status: 'ACTIVE' },
      select: userSelect,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw ApiError.conflict(messages.EMAIL_EXISTS);
    }
    throw err;
  }
};

const updateUser = async (id, data) => {
  await getUserById(id);
  return prisma.user.update({ where: { id }, data, select: userSelect });
};

const updateStatus = async (id, status) => {
  await getUserById(id);
  return prisma.user.update({ where: { id }, data: { status }, select: userSelect });
};

module.exports = { listUsers, getUserById, createUser, updateUser, updateStatus };
