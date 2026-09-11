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

// Get current egg inventory stock
router.get('/status', async (req, res) => {
  try {
    const rows = await db.query("SELECT * FROM egg_inventory ORDER BY record_date DESC, id DESC LIMIT 1");
    const latest = rows[0] || null;
    const currentStock = latest ? latest.final_stock_butir : 0;
    res.json({
      success: true,
      current_stock_butir: currentStock,
      formatted_stock: formatTrai(currentStock),
      latest_record: latest
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

    const rows = await db.query("SELECT final_stock_butir FROM egg_inventory ORDER BY record_date DESC, id DESC LIMIT 1");
    const currentStock = rows[0] ? parseInt(rows[0].final_stock_butir) : 0;

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

// Get Egg Inventory & Sales History
router.get('/history', async (req, res) => {
  try {
    const history = await db.query("SELECT * FROM egg_inventory ORDER BY record_date DESC, id DESC");
    res.json({
      success: true,
      history: history.map(item => {
        let recordType = 'masuk';
        if (item.sold_butir > 0) recordType = 'keluar';
        else if (item.added_production_butir > 0) recordType = 'masuk';
        return {
          ...item,
          record_type: recordType,
          formatted_initial: formatTrai(item.initial_stock_butir),
          formatted_added: formatTrai(item.added_production_butir),
          formatted_sold: formatTrai(item.sold_butir),
          formatted_final: formatTrai(item.final_stock_butir)
        };
      })
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete Egg Inventory Record
router.delete('/history/:id', async (req, res) => {
  try {
    await db.query("DELETE FROM egg_inventory WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Riwayat stok & penjualan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
