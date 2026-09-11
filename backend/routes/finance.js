const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get financial summary
router.get('/summary', async (req, res) => {
  try {
    const monthRows = await db.query(
      `SELECT type, SUM(amount) AS total 
       FROM financial_transactions 
       WHERE MONTH(transaction_date) = MONTH(CURRENT_DATE()) 
         AND YEAR(transaction_date) = YEAR(CURRENT_DATE())
       GROUP BY type`
    );

    const todayRows = await db.query(
      `SELECT type, SUM(amount) AS total 
       FROM financial_transactions 
       WHERE DATE(transaction_date) = CURDATE()
       GROUP BY type`
    );

    let totalIncome = 0, totalExpense = 0;
    monthRows.forEach(row => {
      if (row.type === 'income') totalIncome += parseFloat(row.total);
      else if (row.type === 'expense') totalExpense += parseFloat(row.total);
    });

    let todayIncome = 0, todayExpense = 0;
    todayRows.forEach(row => {
      if (row.type === 'income') todayIncome += parseFloat(row.total);
      else if (row.type === 'expense') todayExpense += parseFloat(row.total);
    });

    res.json({
      success: true,
      month: { total_income: totalIncome, total_expense: totalExpense, net_profit: totalIncome - totalExpense },
      today: { income: todayIncome, expense: todayExpense, net_profit: todayIncome - todayExpense }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get transactions
router.get('/transactions', async (req, res) => {
  try {
    const { type, category, startDate, endDate } = req.query;
    let sql = "SELECT * FROM financial_transactions WHERE 1=1";
    const params = [];

    if (type) {
      sql += " AND type = ?";
      params.push(type);
    }
    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }
    if (startDate && endDate) {
      sql += " AND transaction_date BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }

    sql += " ORDER BY transaction_date DESC, id DESC";

    const transactions = await db.query(sql, params);
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create manual transaction
router.post('/transactions', async (req, res) => {
  try {
    const { transaction_date, type, category, amount, description } = req.body;
    await db.query(
      `INSERT INTO financial_transactions (transaction_date, type, category, amount, reference_type, description)
       VALUES (?, ?, ?, ?, 'manual', ?)`,
      [transaction_date, type, category, parseFloat(amount), description || '']
    );
    res.json({ success: true, message: 'Transaksi keuangan berhasil dicatat' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete transaction
router.delete('/transactions/:id', async (req, res) => {
  try {
    await db.query("DELETE FROM financial_transactions WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Transaksi berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
