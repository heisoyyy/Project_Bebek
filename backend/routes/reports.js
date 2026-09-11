const express = require('express');
const router = express.Router();
const db = require('../config/db');

function formatTrai(totalEggs) {
  const trai = Math.floor(totalEggs / 30);
  const remaining = totalEggs % 30;
  if (trai === 0) return `${totalEggs} Butir`;
  if (remaining === 0) return `${trai} Trai`;
  return `${trai} Trai + ${remaining} Butir`;
}

// Monthly Recap
router.get('/monthly', async (req, res) => {
  try {
    const year = parseInt(req.query.year || new Date().getFullYear());
    const month = parseInt(req.query.month || (new Date().getMonth() + 1));

    const eggRows = await db.query(
      "SELECT * FROM egg_productions WHERE MONTH(production_date) = ? AND YEAR(production_date) = ?",
      [month, year]
    );

    const feedRows = await db.query(
      "SELECT * FROM feed_usages WHERE MONTH(usage_date) = ? AND YEAR(usage_date) = ?",
      [month, year]
    );

    const financeRows = await db.query(
      "SELECT * FROM financial_transactions WHERE MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?",
      [month, year]
    );

    const dailyList = await db.query(
      "SELECT * FROM egg_productions WHERE MONTH(production_date) = ? AND YEAR(production_date) = ? ORDER BY production_date ASC",
      [month, year]
    );

    const totalEggs = eggRows.reduce((s, e) => s + parseInt(e.total_eggs), 0);
    const totalGoodEggs = eggRows.reduce((s, e) => s + parseInt(e.good_eggs), 0);
    const totalCrackedEggs = eggRows.reduce((s, e) => s + parseInt(e.cracked_eggs), 0);
    const avgProductivity = eggRows.length > 0
      ? parseFloat((eggRows.reduce((s, e) => s + parseFloat(e.productivity_pct), 0) / eggRows.length).toFixed(2))
      : 0;
    const maxEggs = eggRows.length > 0 ? Math.max(...eggRows.map(e => parseInt(e.total_eggs))) : 0;
    const minEggs = eggRows.length > 0 ? Math.min(...eggRows.map(e => parseInt(e.total_eggs))) : 0;

    const totalFeedKg = feedRows.reduce((s, f) => s + parseFloat(f.quantity_kg), 0);

    let totalIncome = 0, totalExpense = 0;
    financeRows.forEach(t => {
      const amt = parseFloat(t.amount);
      if (t.type === 'income') totalIncome += amt;
      else totalExpense += amt;
    });

    res.json({
      success: true,
      period: { year, month },
      summary: {
        total_eggs: totalEggs,
        formatted_total_eggs: formatTrai(totalEggs),
        total_good_eggs: totalGoodEggs,
        total_cracked_eggs: totalCrackedEggs,
        avg_productivity: avgProductivity,
        max_eggs: maxEggs,
        min_eggs: minEggs,
        days_recorded: eggRows.length,
        total_feed_kg: totalFeedKg,
        total_feed_karung: parseFloat((totalFeedKg / 50).toFixed(1)),
        total_income: totalIncome,
        total_expense: totalExpense,
        net_profit: totalIncome - totalExpense
      },
      daily_list: dailyList.map(item => ({ ...item, formatted_total: formatTrai(item.total_eggs) }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Yearly Recap
router.get('/yearly', async (req, res) => {
  try {
    const year = parseInt(req.query.year || new Date().getFullYear());

    const eggRows = await db.query(
      `SELECT MONTH(production_date) as month, 
              SUM(total_eggs) as total_eggs, 
              AVG(productivity_pct) as avg_productivity,
              COUNT(id) as count
       FROM egg_productions 
       WHERE YEAR(production_date) = ?
       GROUP BY MONTH(production_date)`,
      [year]
    );

    const feedRows = await db.query(
      `SELECT MONTH(usage_date) as month, SUM(quantity_kg) as total_feed_kg 
       FROM feed_usages 
       WHERE YEAR(usage_date) = ?
       GROUP BY MONTH(usage_date)`,
      [year]
    );

    const financeRows = await db.query(
      `SELECT MONTH(transaction_date) as month, type, SUM(amount) as total 
       FROM financial_transactions 
       WHERE YEAR(transaction_date) = ?
       GROUP BY MONTH(transaction_date), type`,
      [year]
    );

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthlyMap = {};

    for (let m = 1; m <= 12; m++) {
      monthlyMap[m] = { total_eggs: 0, avg_productivity: 0, total_feed_kg: 0, income: 0, expense: 0 };
    }

    eggRows.forEach(row => {
      monthlyMap[row.month].total_eggs = parseInt(row.total_eggs || 0);
      monthlyMap[row.month].avg_productivity = parseFloat((row.avg_productivity || 0).toFixed(2));
    });

    feedRows.forEach(row => {
      monthlyMap[row.month].total_feed_kg = parseFloat(row.total_feed_kg || 0);
    });

    financeRows.forEach(row => {
      const amt = parseFloat(row.total || 0);
      if (row.type === 'income') monthlyMap[row.month].income = amt;
      else monthlyMap[row.month].expense = amt;
    });

    const formattedMonths = Object.entries(monthlyMap)
      .filter(([, v]) => v.total_eggs > 0 || v.income > 0 || v.expense > 0)
      .map(([month, v]) => {
        const m = parseInt(month);
        return {
          month: m,
          month_name: monthNames[m - 1],
          total_eggs: v.total_eggs,
          formatted_eggs: formatTrai(v.total_eggs),
          avg_productivity: v.avg_productivity,
          total_feed_kg: v.total_feed_kg,
          income: v.income,
          expense: v.expense,
          net_profit: v.income - v.expense
        };
      });

    res.json({ success: true, year, monthly_breakdown: formattedMonths });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
