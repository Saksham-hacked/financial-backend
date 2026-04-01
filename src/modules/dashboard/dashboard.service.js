const { PrismaClient, Prisma } = require('@prisma/client');

const prisma = new PrismaClient();

const toNum = (val) => parseFloat(val?.toString() || '0');

const getSummary = async () => {
  const [incomeAgg, expenseAgg, totalRecords, recentRecords] = await Promise.all([
    prisma.financialRecord.aggregate({
      where: { isDeleted: false, type: 'INCOME' },
      _sum: { amount: true },
    }),
    prisma.financialRecord.aggregate({
      where: { isDeleted: false, type: 'EXPENSE' },
      _sum: { amount: true },
    }),
    prisma.financialRecord.count({ where: { isDeleted: false } }),
    prisma.financialRecord.findMany({
      where: { isDeleted: false },
      orderBy: { date: 'desc' },
      take: 5,
      select: { id: true, amount: true, type: true, category: true, date: true, note: true },
    }),
  ]);

  const totalIncome = toNum(incomeAgg._sum.amount);
  const totalExpenses = toNum(expenseAgg._sum.amount);

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    totalRecords,
    recentActivity: recentRecords.map((r) => ({ ...r, amount: toNum(r.amount) })),
  };
};

const getCategoryBreakdown = async () => {
  const results = await prisma.financialRecord.groupBy({
    by: ['category', 'type'],
    where: { isDeleted: false },
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { category: 'asc' },
  });

  // Group by category → { income, expense, total }
  const map = {};
  for (const row of results) {
    if (!map[row.category]) {
      map[row.category] = { category: row.category, income: 0, expense: 0, total: 0, count: 0 };
    }
    const amount = toNum(row._sum.amount);
    map[row.category].count += row._count.id;
    if (row.type === 'INCOME') {
      map[row.category].income += amount;
    } else {
      map[row.category].expense += amount;
    }
    map[row.category].total += amount;
  }

  return Object.values(map).sort((a, b) => b.total - a.total);
};

const getMonthlyTrends = async (year) => {
  const targetYear = parseInt(year) || new Date().getFullYear();
  const startDate = new Date(`${targetYear}-01-01`);
  const endDate = new Date(`${targetYear}-12-31T23:59:59`);

  const records = await prisma.financialRecord.findMany({
    where: { isDeleted: false, date: { gte: startDate, lte: endDate } },
    select: { amount: true, type: true, date: true },
  });

  // Build month buckets
  const months = {};
  for (let m = 1; m <= 12; m++) {
    const key = `${targetYear}-${String(m).padStart(2, '0')}`;
    months[key] = { month: key, income: 0, expense: 0, net: 0 };
  }

  for (const r of records) {
    const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`;
    if (!months[key]) continue;
    const amount = toNum(r.amount);
    if (r.type === 'INCOME') {
      months[key].income += amount;
    } else {
      months[key].expense += amount;
    }
    months[key].net = months[key].income - months[key].expense;
  }

  return { year: targetYear, trends: Object.values(months) };
};

const getRecentActivity = async (limit = 10) => {
  const records = await prisma.financialRecord.findMany({
    where: { isDeleted: false },
    orderBy: { date: 'desc' },
    take: Math.min(limit, 50),
    select: { id: true, amount: true, type: true, category: true, date: true, note: true, createdAt: true },
  });
  return records.map((r) => ({ ...r, amount: toNum(r.amount) }));
};

module.exports = { getSummary, getCategoryBreakdown, getMonthlyTrends, getRecentActivity };
