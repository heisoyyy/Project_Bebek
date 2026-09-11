const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get coop & total population
router.get('/', async (req, res) => {
  try {
    const coops = await db.query("SELECT * FROM coops ORDER BY id ASC");
    const totalDucks = coops
      .filter(c => c.status === 'active')
      .reduce((sum, c) => sum + (c.current_ducks || 0), 0) || 526;

    res.json({ success: true, coops, total_ducks: totalDucks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update coop info
router.put('/:id', async (req, res) => {
  try {
    const { name, capacity, status } = req.body;
    await db.query("UPDATE coops SET name = ?, capacity = ?, status = ? WHERE id = ?", [name, capacity, status, req.params.id]);
    res.json({ success: true, message: 'Data kandang berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Log population change
router.post('/population', async (req, res) => {
  try {
    const { log_date, change_type, quantity, reason, notes } = req.body;
    const coop_id = 1;

    const coopRows = await db.query("SELECT current_ducks FROM coops WHERE id = ?", [coop_id]);
    const currentDucks = coopRows[0] ? coopRows[0].current_ducks : 526;
    const qty = parseInt(quantity);
    let population_after = currentDucks;

    if (change_type === 'add') {
      population_after += qty;
    } else {
      population_after = Math.max(0, population_after - qty);
    }

    await db.query("UPDATE coops SET current_ducks = ? WHERE id = ?", [population_after, coop_id]);

    await db.query(
      `INSERT INTO duck_population_logs (coop_id, log_date, change_type, quantity, reason, population_after, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [coop_id, log_date, change_type, qty, reason, population_after, notes || '']
    );

    res.json({ success: true, message: 'Perubahan populasi bebek berhasil dicatat', population_after });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get population change logs
router.get('/population/logs', async (req, res) => {
  try {
    const logs = await db.query(
      `SELECT dpl.*, c.name AS coop_name 
       FROM duck_population_logs dpl 
       JOIN coops c ON dpl.coop_id = c.id 
       ORDER BY dpl.log_date DESC, dpl.id DESC`
    );
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
