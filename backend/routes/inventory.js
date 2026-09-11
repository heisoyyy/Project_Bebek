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

// Calculate master egg stock statistics dynamically
async function getStockStats() {
  const prodRows = await db.query("SELECT COALESCE(SUM(good_eggs), 0) AS total_produced FROM egg_productions");
  const totalProduced = parseInt(prodRows[0]?.total_produced) || 0;

  const outRows = await db.query("SELECT COALESCE(SUM(sold_butir + damaged_butir + consumed_butir), 0) AS total_out FROM egg_inventory");
  const totalOut = parseInt(outRows[0]?.total_out) || 0;

  const currentStock = Math.max(0, totalProduced - totalOut);
  return { totalProduced, totalOut, currentStock };
}

// Get current egg inventory stock
router.get('/status', async (req, res) => {
  try {
    const { currentStock, totalProduced, totalOut } = await getStockStats();
    res.json({
      success: true,
      current_stock_butir: currentStock,
      formatted_stock: formatTrai(currentStock),
      total_produced: totalProduced,
      total_out: totalOut
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Record Egg Sale
router.post('/sale', async (req, res) => {
  try {
    const { sale_date, amount, butir_terjual, buyer_name, notes } = req.body;
    const nominal = parseFloat(amount) || 0;
    const soldButir = parseInt(butir_terjual) || 0;

    if (nominal <= 0) return res.status(400).json({ success: false, message: 'Nominal penjualan harus lebih besar dari 0' });
    if (soldButir <= 0) return res.status(400).json({ success: false, message: 'Jumlah telur yang dijual harus diisi (dalam butir)' });

    const { currentStock } = await getStockStats();

    if (soldButir > currentStock) {
      return res.status(400).json({
        success: false,
        message: `Stok telur tidak cukup! Stok gudang saat ini hanya ${currentStock} Butir (${formatTrai(currentStock)}), tidak bisa menjual ${soldButir} Butir.`
      });
    }

    const finalStockAfterSale = currentStock - soldButir;
    const soldTrai = Math.floor(soldButir / 30);
    const soldRemaining = soldButir % 30;
    const formattedSold = soldTrai > 0
      ? (soldRemaining > 0 ? `${soldTrai} Trai + ${soldRemaining} Butir` : `${soldTrai} Trai`)
      : `${soldButir} Butir`;

    const description = `Penjualan Telur ${formattedSold} = Rp ${nominal.toLocaleString('id-ID')}${buyer_name ? ` (Pembeli: ${buyer_name})` : ''}`;

    await db.query(
      `INSERT INTO financial_transactions (transaction_date, type, category, amount, reference_type, description)
       VALUES (?, 'income', 'penjualan_telur', ?, 'egg_sale', ?)`,
      [sale_date, nominal, description]
    );

    await db.query(
      `INSERT INTO egg_inventory (record_date, initial_stock_butir, added_production_butir, sold_butir, damaged_butir, consumed_butir, final_stock_butir, notes)
       VALUES (?, ?, 0, ?, 0, 0, ?, ?)`,
      [sale_date, currentStock, soldButir, finalStockAfterSale, notes || description]
    );

    res.json({
      success: true,
      message: `Penjualan ${formattedSold} (Rp ${nominal.toLocaleString('id-ID')}) berhasil dicatat! Stok gudang tersisa: ${formatTrai(finalStockAfterSale)}.`,
      amount: nominal,
      sold_butir: soldButir,
      remaining_stock: finalStockAfterSale
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get Egg Inventory & Sales History (Unified Timeline)
router.get('/history', async (req, res) => {
  try {
    const productions = await db.query(
      "SELECT id, production_date AS record_date, good_eggs AS added_production_butir, notes FROM egg_productions WHERE good_eggs > 0"
    );
    const sales = await db.query(
      "SELECT id, record_date, sold_butir, notes FROM egg_inventory WHERE sold_butir > 0 OR damaged_butir > 0 OR consumed_butir > 0"
    );

    const events = [];

    productions.forEach(p => {
      events.push({
        id: `prod_${p.id}`,
        raw_id: p.id,
        source: 'production',
        record_date: p.record_date,
        record_type: 'masuk',
        added_production_butir: parseInt(p.added_production_butir) || 0,
        sold_butir: 0,
        notes: p.notes ? `Produksi: ${p.notes}` : 'Produksi Telur Harian'
      });
    });

    sales.forEach(s => {
      events.push({
        id: `inv_${s.id}`,
        raw_id: s.id,
        source: 'inventory',
        record_date: s.record_date,
        record_type: 'keluar',
        added_production_butir: 0,
        sold_butir: parseInt(s.sold_butir) || 0,
        notes: s.notes || 'Penjualan Telur'
      });
    });

    // Chronological sorting (oldest first)
    events.sort((a, b) => {
      const dateDiff = new Date(a.record_date) - new Date(b.record_date);
      if (dateDiff !== 0) return dateDiff;
      if (a.source === 'production' && b.source === 'inventory') return -1;
      if (a.source === 'inventory' && b.source === 'production') return 1;
      return a.raw_id - b.raw_id;
    });

    let runningStock = 0;
    const historyWithStock = events.map(e => {
      if (e.record_type === 'masuk') {
        runningStock += e.added_production_butir;
      } else {
        runningStock = Math.max(0, runningStock - e.sold_butir);
      }

      return {
        ...e,
        initial_stock_butir: e.record_type === 'masuk' ? runningStock - e.added_production_butir : runningStock + e.sold_butir,
        final_stock_butir: runningStock,
        formatted_initial: formatTrai(e.record_type === 'masuk' ? runningStock - e.added_production_butir : runningStock + e.sold_butir),
        formatted_added: formatTrai(e.added_production_butir),
        formatted_sold: formatTrai(e.sold_butir),
        formatted_final: formatTrai(runningStock)
      };
    });

    // Reverse (newest first) for frontend table display
    historyWithStock.sort((a, b) => {
      const dateDiff = new Date(b.record_date) - new Date(a.record_date);
      if (dateDiff !== 0) return dateDiff;
      return b.raw_id - a.raw_id;
    });

    res.json({
      success: true,
      history: historyWithStock
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete Egg Inventory Record
router.delete('/history/:id', async (req, res) => {
  try {
    const rawId = req.params.id;
    if (typeof rawId === 'string' && rawId.startsWith('prod_')) {
      const prodId = rawId.replace('prod_', '');
      await db.query("DELETE FROM egg_productions WHERE id = ?", [prodId]);
    } else if (typeof rawId === 'string' && rawId.startsWith('inv_')) {
      const invId = rawId.replace('inv_', '');
      await db.query("DELETE FROM egg_inventory WHERE id = ?", [invId]);
    } else {
      await db.query("DELETE FROM egg_inventory WHERE id = ?", [rawId]);
    }
    res.json({ success: true, message: 'Riwayat stok & penjualan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
