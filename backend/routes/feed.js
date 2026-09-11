const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all feed items
router.get('/items', async (req, res) => {
  try {
    const items = await db.query("SELECT * FROM feed_items ORDER BY id ASC");
    const totalStockRows = await db.query("SELECT SUM(stock_kg) AS total_stock FROM feed_items");
    const totalStockKg = parseFloat(totalStockRows[0]?.total_stock || 0);

    const usageRows = await db.query(
      "SELECT SUM(quantity_kg) AS total_usage FROM feed_usages WHERE usage_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
    );
    const totalUsage7d = parseFloat(usageRows[0]?.total_usage || 0);
    const dailyAvgUsage = totalUsage7d > 0 ? totalUsage7d / 7 : 70.0;
    const estDaysRemaining = dailyAvgUsage > 0 ? parseFloat((totalStockKg / dailyAvgUsage).toFixed(1)) : 0;

    res.json({
      success: true,
      items: items.map(item => ({
        ...item,
        stock_kg: parseFloat(item.stock_kg),
        price_per_kg: parseFloat(item.price_per_kg),
        karung_count: (item.stock_kg / 50).toFixed(1)
      })),
      total_stock_kg: totalStockKg,
      daily_avg_usage_kg: parseFloat(dailyAvgUsage.toFixed(1)),
      est_days_remaining: parseFloat(estDaysRemaining),
      is_low_stock: parseFloat(estDaysRemaining) <= 3 && totalStockKg > 0
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Record Feed Purchase
router.post('/purchase', async (req, res) => {
  try {
    const { purchase_date, feed_item_id, quantity_kg, price_per_kg, supplier, notes, payment_status } = req.body;
    const qty = parseFloat(quantity_kg);
    const price = parseFloat(price_per_kg);
    const totalPrice = qty * price;
    const payStatus = payment_status === 'unpaid' ? 'unpaid' : 'lunas';

    const itemRows = await db.query("SELECT * FROM feed_items WHERE id = ?", [feed_item_id]);
    if (!itemRows.length) return res.status(404).json({ success: false, message: 'Item pakan tidak ditemukan' });
    const item = itemRows[0];

    const result = await db.query(
      `INSERT INTO feed_purchases (purchase_date, feed_item_id, quantity_kg, price_per_kg, total_price, payment_status, supplier, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [purchase_date, feed_item_id, qty, price, totalPrice, payStatus, supplier || '', notes || '']
    );

    // Update feed stock
    await db.query(
      "UPDATE feed_items SET stock_kg = stock_kg + ?, price_per_kg = ? WHERE id = ?",
      [qty, price, feed_item_id]
    );

    // If lunas, record financial expense
    if (payStatus === 'lunas') {
      await db.query(
        `INSERT INTO financial_transactions (transaction_date, type, category, amount, reference_type, reference_id, description)
         VALUES (?, 'expense', 'pakan', ?, 'feed_purchase', ?, ?)`,
        [purchase_date, totalPrice, result.insertId, `Pembelian ${qty} KG ${item.name} (Lunas)`]
      );
    }

    res.json({
      success: true,
      message: payStatus === 'lunas'
        ? 'Pembelian pakan berhasil dicatat dan transaksi pengeluaran keuangan tersimpan'
        : 'Pembelian pakan berhasil dicatat (Status: Belum Bayar). Belum masuk ke laporan keuangan.',
      total_price: totalPrice,
      payment_status: payStatus
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Toggle Payment to Lunas
router.put('/purchases/:id/pay', async (req, res) => {
  try {
    const purchaseRows = await db.query(
      `SELECT fp.*, fi.name as feed_name 
       FROM feed_purchases fp 
       JOIN feed_items fi ON fp.feed_item_id = fi.id 
       WHERE fp.id = ?`,
      [req.params.id]
    );

    if (!purchaseRows.length) return res.status(404).json({ success: false, message: 'Data pembelian pakan tidak ditemukan' });
    const purchase = purchaseRows[0];
    if (purchase.payment_status === 'lunas') return res.status(400).json({ success: false, message: 'Pembelian pakan ini sudah berstatus Lunas' });

    await db.query("UPDATE feed_purchases SET payment_status = 'lunas' WHERE id = ?", [req.params.id]);

    const today = new Date().toISOString().split('T')[0];
    await db.query(
      `INSERT INTO financial_transactions (transaction_date, type, category, amount, reference_type, reference_id, description)
       VALUES (?, 'expense', 'pakan', ?, 'feed_purchase', ?, ?)`,
      [today, purchase.total_price, purchase.id, `Pelunasan Pembelian ${purchase.quantity_kg} KG ${purchase.feed_name}`]
    );

    res.json({ success: true, message: 'Status pembelian berhasil diubah menjadi Lunas dan pengeluaran telah dicatat ke Keuangan!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Record Feed Usage
router.post('/usage', async (req, res) => {
  try {
    const { usage_date, feed_item_id, quantity_kg, notes } = req.body;
    const qty = parseFloat(quantity_kg);

    const itemRows = await db.query("SELECT * FROM feed_items WHERE id = ?", [feed_item_id]);
    if (!itemRows.length) return res.status(404).json({ success: false, message: 'Item pakan tidak ditemukan' });
    const item = itemRows[0];

    if (parseFloat(item.stock_kg) < qty) {
      return res.status(400).json({ success: false, message: `Stok pakan ${item.name} tidak cukup (Tersisa: ${item.stock_kg} KG)` });
    }

    await db.query(
      `INSERT INTO feed_usages (usage_date, coop_id, feed_item_id, quantity_kg, notes)
       VALUES (?, 1, ?, ?, ?)`,
      [usage_date, feed_item_id, qty, notes || '']
    );

    await db.query(
      "UPDATE feed_items SET stock_kg = GREATEST(0, stock_kg - ?) WHERE id = ?",
      [qty, feed_item_id]
    );

    res.json({ success: true, message: 'Pemakaian pakan berhasil dicatat' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get Feed Purchase History
router.get('/purchases', async (req, res) => {
  try {
    const purchases = await db.query(
      `SELECT fp.*, fi.name AS feed_name 
       FROM feed_purchases fp 
       JOIN feed_items fi ON fp.feed_item_id = fi.id 
       ORDER BY fp.purchase_date DESC, fp.id DESC`
    );
    res.json({ success: true, purchases });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get Feed Usage History
router.get('/usages', async (req, res) => {
  try {
    const usages = await db.query(
      `SELECT fu.*, fi.name AS feed_name 
       FROM feed_usages fu 
       JOIN feed_items fi ON fu.feed_item_id = fi.id 
       ORDER BY fu.usage_date DESC, fu.id DESC`
    );
    res.json({ success: true, usages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete Feed Purchase Record
router.delete('/purchases/:id', async (req, res) => {
  try {
    const purchaseRows = await db.query("SELECT * FROM feed_purchases WHERE id = ?", [req.params.id]);
    if (!purchaseRows.length) return res.status(404).json({ success: false, message: 'Data pembelian pakan tidak ditemukan' });
    const purchase = purchaseRows[0];

    // Subtract purchased quantity from stock
    await db.query(
      "UPDATE feed_items SET stock_kg = GREATEST(0, stock_kg - ?) WHERE id = ?",
      [purchase.quantity_kg, purchase.feed_item_id]
    );

    // Delete associated financial transaction if paid
    await db.query(
      "DELETE FROM financial_transactions WHERE reference_type = 'feed_purchase' AND reference_id = ?",
      [purchase.id]
    );

    // Delete purchase record
    await db.query("DELETE FROM feed_purchases WHERE id = ?", [req.params.id]);

    res.json({ success: true, message: 'Riwayat pembelian pakan berhasil dihapus dan stok telah disesuaikan' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete Feed Usage Record
router.delete('/usages/:id', async (req, res) => {
  try {
    const usageRows = await db.query("SELECT * FROM feed_usages WHERE id = ?", [req.params.id]);
    if (!usageRows.length) return res.status(404).json({ success: false, message: 'Data pemakaian pakan tidak ditemukan' });
    const usage = usageRows[0];

    // Restore used quantity back to stock
    await db.query(
      "UPDATE feed_items SET stock_kg = stock_kg + ? WHERE id = ?",
      [usage.quantity_kg, usage.feed_item_id]
    );

    // Delete usage record
    await db.query("DELETE FROM feed_usages WHERE id = ?", [req.params.id]);

    res.json({ success: true, message: 'Riwayat pemakaian pakan berhasil dihapus dan stok telah dikembalikan' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
