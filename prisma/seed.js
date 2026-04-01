const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hash = await bcrypt.hash('password123', 10);

  // Emails stored lowercase to match Joi's .lowercase() transform on login
  const admin = await prisma.user.upsert({
    where: { email: 'admin@finance.local' },
    update: {},
    create: { name: 'Admin User', email: 'admin@finance.local', passwordHash: hash, role: 'ADMIN', status: 'ACTIVE' },
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@finance.local' },
    update: {},
    create: { name: 'Analyst User', email: 'analyst@finance.local', passwordHash: hash, role: 'ANALYST', status: 'ACTIVE' },
  });

  await prisma.user.upsert({
    where: { email: 'viewer@finance.local' },
    update: {},
    create: { name: 'Viewer User', email: 'viewer@finance.local', passwordHash: hash, role: 'VIEWER', status: 'ACTIVE' },
  });

  console.log('Users created.');

  await prisma.financialRecord.deleteMany({});

  const records = [
    { amount: 85000, type: 'INCOME',  category: 'Salary',        date: new Date('2024-01-01'), note: 'January salary',        createdById: admin.id },
    { amount: 12000, type: 'INCOME',  category: 'Freelance',     date: new Date('2024-01-10'), note: 'Logo design project',   createdById: admin.id },
    { amount: 18000, type: 'EXPENSE', category: 'Rent',          date: new Date('2024-01-05'), note: 'Monthly rent',          createdById: admin.id },
    { amount: 4500,  type: 'EXPENSE', category: 'Food',          date: new Date('2024-01-15'),                                createdById: admin.id },
    { amount: 2200,  type: 'EXPENSE', category: 'Utilities',     date: new Date('2024-01-20'), note: 'Electricity + WiFi',    createdById: admin.id },
    { amount: 85000, type: 'INCOME',  category: 'Salary',        date: new Date('2024-02-01'), note: 'February salary',       createdById: admin.id },
    { amount: 8000,  type: 'INCOME',  category: 'Freelance',     date: new Date('2024-02-12'), note: 'Web dev project',       createdById: analyst.id },
    { amount: 18000, type: 'EXPENSE', category: 'Rent',          date: new Date('2024-02-05'),                                createdById: admin.id },
    { amount: 5200,  type: 'EXPENSE', category: 'Food',          date: new Date('2024-02-14'),                                createdById: admin.id },
    { amount: 3500,  type: 'EXPENSE', category: 'Entertainment', date: new Date('2024-02-20'), note: 'OTT + movies',          createdById: admin.id },
    { amount: 85000, type: 'INCOME',  category: 'Salary',        date: new Date('2024-03-01'),                                createdById: admin.id },
    { amount: 25000, type: 'INCOME',  category: 'Investments',   date: new Date('2024-03-08'), note: 'Mutual fund returns',   createdById: admin.id },
    { amount: 18000, type: 'EXPENSE', category: 'Rent',          date: new Date('2024-03-05'),                                createdById: admin.id },
    { amount: 6000,  type: 'EXPENSE', category: 'Transport',     date: new Date('2024-03-12'), note: 'Fuel + cab',            createdById: admin.id },
    { amount: 4800,  type: 'EXPENSE', category: 'Food',          date: new Date('2024-03-18'),                                createdById: admin.id },
    { amount: 85000, type: 'INCOME',  category: 'Salary',        date: new Date('2024-04-01'),                                createdById: admin.id },
    { amount: 15000, type: 'INCOME',  category: 'Freelance',     date: new Date('2024-04-09'), note: 'Mobile app UI',         createdById: admin.id },
    { amount: 18000, type: 'EXPENSE', category: 'Rent',          date: new Date('2024-04-05'),                                createdById: admin.id },
    { amount: 9500,  type: 'EXPENSE', category: 'Entertainment', date: new Date('2024-04-15'), note: 'Travel weekend',        createdById: admin.id },
    { amount: 2100,  type: 'EXPENSE', category: 'Utilities',     date: new Date('2024-04-22'),                                createdById: admin.id },
    { amount: 85000, type: 'INCOME',  category: 'Salary',        date: new Date('2024-05-01'),                                createdById: admin.id },
    { amount: 30000, type: 'INCOME',  category: 'Investments',   date: new Date('2024-05-10'), note: 'Stock dividends',       createdById: admin.id },
    { amount: 18000, type: 'EXPENSE', category: 'Rent',          date: new Date('2024-05-05'),                                createdById: admin.id },
    { amount: 5500,  type: 'EXPENSE', category: 'Food',          date: new Date('2024-05-16'),                                createdById: admin.id },
    { amount: 7200,  type: 'EXPENSE', category: 'Transport',     date: new Date('2024-05-20'), note: 'Flight tickets',        createdById: admin.id },
    { amount: 85000, type: 'INCOME',  category: 'Salary',        date: new Date('2024-06-01'),                                createdById: admin.id },
    { amount: 18000, type: 'EXPENSE', category: 'Rent',          date: new Date('2024-06-05'),                                createdById: admin.id },
    { amount: 4200,  type: 'EXPENSE', category: 'Food',          date: new Date('2024-06-14'),                                createdById: admin.id },
    { amount: 99999, type: 'EXPENSE', category: 'Miscellaneous', date: new Date('2024-06-20'), note: 'Duplicate - deleted',   createdById: admin.id, isDeleted: true, deletedAt: new Date() },
  ];

  await prisma.financialRecord.createMany({ data: records });

  console.log(`Seeded ${records.length} financial records.`);
  console.log('\nDemo credentials:');
  console.log('  admin@finance.local   / password123  (ADMIN)');
  console.log('  analyst@finance.local / password123  (ANALYST)');
  console.log('  viewer@finance.local  / password123  (VIEWER)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
