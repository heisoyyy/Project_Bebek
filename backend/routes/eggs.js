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

// Get egg productions
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let sql = "SELECT * FROM egg_productions";
    const params = [];
    if (startDate && endDate) {
      sql += " WHERE production_date BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }
    sql += " ORDER BY production_date DESC";

    const rows = await db.query(sql, params);
    const productions = rows.map(row => ({
      ...row,
      formatted_total: formatTrai(row.total_eggs),
      formatted_good: formatTrai(row.good_eggs),
      formatted_cracked: formatTrai(row.cracked_eggs)
    }));
    res.json({ success: true, productions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get latest production
router.get('/latest', async (req, res) => {
  try {
    const rows = await db.query("SELECT * FROM egg_productions ORDER BY production_date DESC LIMIT 2");
    const latest = rows[0] || null;
    const previous = rows[1] || null;

    if (!latest) return res.json({ success: true, latest: null, change_pct: 0 });

    let change_pct = 0;
    if (previous && previous.total_eggs > 0) {
      change_pct = (((latest.total_eggs - previous.total_eggs) / previous.total_eggs) * 100).toFixed(2);
    }

    res.json({
      success: true,
      latest: { ...latest, formatted_total: formatTrai(latest.total_eggs), formatted_good: formatTrai(latest.good_eggs), formatted_cracked: formatTrai(latest.cracked_eggs) },
      previous: previous ? { ...previous, formatted_total: formatTrai(previous.total_eggs) } : null,
      change_pct: parseFloat(change_pct)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add / Upsert Egg Production
router.post('/', async (req, res) => {
  try {
    const { production_date, good_eggs, cracked_eggs, notes } = req.body;
    const good = parseInt(good_eggs) || 0;
    const cracked = parseInt(cracked_eggs) || 0;
    const total = good + cracked;

    const duckRows = await db.query("SELECT SUM(current_ducks) AS total_ducks FROM coops WHERE status = 'active'");
    const population = duckRows[0]?.total_ducks || 526;
    const productivity = population > 0 ? parseFloat(((total / population) * 100).toFixed(2)) : 0;

    await db.query(
      `INSERT INTO egg_productions (production_date, good_eggs, cracked_eggs, total_eggs, duck_population, productivity_pct, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE good_eggs=?, cracked_eggs=?, total_eggs=?, duck_population=?, productivity_pct=?, notes=?`,
      [production_date, good, cracked, total, population, productivity, notes || '', good, cracked, total, population, productivity, notes || '']
    );

    res.json({
      success: true,
      message: 'Data produksi telur H-1 berhasil disimpan',
      data: { production_date, total_eggs: total, formatted_total: formatTrai(total), productivity_pct: productivity }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Egg Production by ID
router.put('/:id', async (req, res) => {
  try {
    const { good_eggs, cracked_eggs, notes } = req.body;
    const good = parseInt(good_eggs) || 0;
    const cracked = parseInt(cracked_eggs) || 0;
    const total = good + cracked;

    const prodRows = await db.query("SELECT duck_population FROM egg_productions WHERE id = ?", [req.params.id]);
    if (!prodRows.length) return res.status(404).json({ success: false, message: 'Data produksi tidak ditemukan' });

    const population = prodRows[0].duck_population || 526;
    const productivity = population > 0 ? parseFloat(((total / population) * 100).toFixed(2)) : 0;

    await db.query(
      `UPDATE egg_productions SET good_eggs = ?, cracked_eggs = ?, total_eggs = ?, productivity_pct = ?, notes = ? WHERE id = ?`,
      [good, cracked, total, productivity, notes || '', req.params.id]
    );

    res.json({ success: true, message: 'Data produksi berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete Egg Production
router.delete('/:id', async (req, res) => {
  try {
    await db.query("DELETE FROM egg_productions WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Data produksi berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
