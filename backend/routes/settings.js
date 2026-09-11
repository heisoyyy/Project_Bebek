const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all settings
router.get('/', async (req, res) => {
  try {
    const rows = await db.query("SELECT * FROM settings");
    const settingsMap = {};
    rows.forEach(r => { settingsMap[r.setting_key] = r.setting_value; });
    res.json({ success: true, settings: settingsMap, list: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update settings
router.post('/', async (req, res) => {
  try {
    const settings = req.body;
    for (const key of Object.keys(settings)) {
      await db.query(
        `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, String(settings[key])]
      );
    }
    res.json({ success: true, message: 'Pengaturan berhasil disimpan' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reset Database (Hapus SEMUA data — database kosong total)
router.post('/reset', async (req, res) => {
  try {
    await db.query("SET FOREIGN_KEY_CHECKS = 0");
    await db.query("TRUNCATE TABLE duck_population_logs");
    await db.query("TRUNCATE TABLE egg_productions");
    await db.query("TRUNCATE TABLE egg_inventory");
    await db.query("TRUNCATE TABLE feed_purchases");
    await db.query("TRUNCATE TABLE feed_usages");
    await db.query("TRUNCATE TABLE financial_transactions");
    await db.query("TRUNCATE TABLE feed_items");
    await db.query("SET FOREIGN_KEY_CHECKS = 1");

    await db.query("DELETE FROM coops WHERE id > 1");
    await db.query("INSERT INTO coops (id, name, current_ducks, capacity, status) VALUES (1, 'Kandang Bebek Utama', 526, 600, 'active') ON DUPLICATE KEY UPDATE current_ducks = 526");

    await db.query(`
      INSERT INTO feed_items (id, name, stock_kg, min_stock_alert_kg, unit_type, price_per_kg) VALUES
      (1, 'Vitamin', 0.00, 10.00, 'botol / kg', 15000.00),
      (2, 'Pakan Mix', 0.00, 30.00, 'karung_50kg', 7500.00)
    `);

    res.json({ success: true, message: 'Seluruh data berhasil dihapus. Database kosong & siap diisi data baru!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Export 1-Click JSON Backup
router.get('/backup', async (req, res) => {
  try {
    const [coops, duckLogs, eggProductions, eggInventory, feedItems, feedPurchases, feedUsages, financialTransactions, settings] =
      await Promise.all([
        db.query("SELECT * FROM coops"),
        db.query("SELECT * FROM duck_population_logs"),
        db.query("SELECT * FROM egg_productions"),
        db.query("SELECT * FROM egg_inventory"),
        db.query("SELECT * FROM feed_items"),
        db.query("SELECT * FROM feed_purchases"),
        db.query("SELECT * FROM feed_usages"),
        db.query("SELECT * FROM financial_transactions"),
        db.query("SELECT * FROM settings")
      ]);

    const backupData = {
      backup_date: new Date().toISOString(),
      app: 'Sistem Kandang Bebek',
      version: '2.0',
      data: { coops, duck_population_logs: duckLogs, egg_productions: eggProductions, egg_inventory: eggInventory, feed_items: feedItems, feed_purchases: feedPurchases, feed_usages: feedUsages, financial_transactions: financialTransactions, settings }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=backup-kandang-bebek-${new Date().toISOString().split('T')[0]}.json`);
    res.json(backupData);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
