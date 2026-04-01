const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient, Prisma } = require('@prisma/client');
const ApiError = require('../../utils/ApiError');
const { jwtSecret, jwtExpiresIn } = require('../../config/env');
const messages = require('../../constants/messages');

const prisma = new PrismaClient();

const register = async ({ name, email, password }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: 'VIEWER', status: 'ACTIVE' },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    });
    return user;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw ApiError.conflict(messages.EMAIL_EXISTS);
    }
    throw err;
  }
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw ApiError.unauthorized(messages.INVALID_CREDENTIALS);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized(messages.INVALID_CREDENTIALS);

  if (user.status !== 'ACTIVE') throw ApiError.forbidden(messages.INACTIVE_USER);

  const payload = { id: user.id, email: user.email, role: user.role, status: user.status };
  const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });

  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

module.exports = { register, login };
