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

router.get('/', async (req, res) => {
  try {
    // 1. Total Ducks
    const duckRows = await db.query("SELECT SUM(current_ducks) AS total_ducks FROM coops WHERE status = 'active'");
    const totalDucks = duckRows[0]?.total_ducks || 526;

    // 2. Latest Egg Production
    const latestEggRows = await db.query(
      "SELECT * FROM egg_productions ORDER BY production_date DESC LIMIT 2"
    );
    const latestEgg = latestEggRows[0] || null;
    const prevEgg = latestEggRows[1] || null;

    let prodChangePct = 0;
    if (latestEgg && prevEgg && prevEgg.total_eggs > 0) {
      prodChangePct = parseFloat((((latestEgg.total_eggs - prevEgg.total_eggs) / prevEgg.total_eggs) * 100).toFixed(2));
    }

    // 3. Feed Stock
    const feedStockRows = await db.query("SELECT SUM(stock_kg) AS total_stock FROM feed_items");
    const totalStockKg = parseFloat(feedStockRows[0]?.total_stock || 0);

    const usageRows = await db.query(
      "SELECT SUM(quantity_kg) AS total_usage FROM feed_usages WHERE usage_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
    );
    const totalUsage7d = parseFloat(usageRows[0]?.total_usage || 0);
    const dailyFeedUsage = totalUsage7d > 0 ? totalUsage7d / 7 : 70.0;
    const estDaysFeed = dailyFeedUsage > 0 ? parseFloat((totalStockKg / dailyFeedUsage).toFixed(1)) : 0;

    // 3b. Unpaid Feed Debt
    const unpaidRows = await db.query(
      "SELECT SUM(total_price) AS total_unpaid FROM feed_purchases WHERE payment_status = 'unpaid'"
    );
    const totalUnpaidFeed = parseFloat(unpaidRows[0]?.total_unpaid || 0);

    // 4. Egg Inventory
    const prodSum = await db.query("SELECT COALESCE(SUM(good_eggs), 0) AS total_prod FROM egg_productions");
    const outSum = await db.query("SELECT COALESCE(SUM(sold_butir + damaged_butir + consumed_butir), 0) AS total_out FROM egg_inventory");
    const unsoldEggsButir = Math.max(0, (parseInt(prodSum[0]?.total_prod) || 0) - (parseInt(outSum[0]?.total_out) || 0));

    // 5. Finance - Current Month
    const financeRows = await db.query(
      `SELECT type, category, SUM(amount) AS total 
       FROM financial_transactions 
       WHERE MONTH(transaction_date) = MONTH(CURRENT_DATE()) 
         AND YEAR(transaction_date) = YEAR(CURRENT_DATE())
       GROUP BY type, category`
    );

    let monthIncome = 0;
    let monthExpense = 0;
    let eggSalesIncome = 0;
    let feedExpenseMonth = 0;

    financeRows.forEach(row => {
      const amt = parseFloat(row.total);
      if (row.type === 'income') {
        monthIncome += amt;
        if (row.category === 'penjualan_telur') eggSalesIncome += amt;
      } else if (row.type === 'expense') {
        monthExpense += amt;
        if (row.category === 'pakan') feedExpenseMonth += amt;
      }
    });

    const monthNetProfit = monthIncome - monthExpense;

    // 6. Chart Data (last 14 records)
    const chartRows = await db.query(
      "SELECT * FROM (SELECT * FROM egg_productions ORDER BY production_date DESC LIMIT 14) AS sub ORDER BY production_date ASC"
    );

    // 7. Alerts
    const alerts = [];
    if (totalUnpaidFeed > 0) {
      alerts.push({
        type: 'warning',
        title: 'Utang Pakan Belum Dibayar!',
        message: `Terdapat tagihan pembelian pakan belum dibayar sebesar Rp ${totalUnpaidFeed.toLocaleString('id-ID')}. Periksa menu Stok Pakan untuk melakukan pelunasan.`
      });
    }
    if (estDaysFeed <= 3 && totalStockKg > 0) {
      alerts.push({
        type: 'warning',
        title: 'Stok Pakan Menipis!',
        message: `Stok pakan tersisa ${totalStockKg} KG (diperkirakan cukup untuk ±${estDaysFeed} hari). Segera lakukan pembelian pakan baru.`
      });
    }
    if (prodChangePct <= -10) {
      alerts.push({
        type: 'danger',
        title: 'Penurunan Produksi Telur!',
        message: `Produksi telur H-1 mengalami penurunan sebesar ${Math.abs(prodChangePct)}% dibandingkan hari sebelumnya.`
      });
    }

    res.json({
      success: true,
      metrics: {
        total_ducks: totalDucks,
        latest_egg: latestEgg ? {
          date: latestEgg.production_date,
          total_eggs: latestEgg.total_eggs,
          good_eggs: latestEgg.good_eggs,
          cracked_eggs: latestEgg.cracked_eggs,
          formatted_total: formatTrai(latestEgg.total_eggs),
          productivity_pct: parseFloat(latestEgg.productivity_pct),
          change_pct: prodChangePct
        } : null,
        feed: {
          total_stock_kg: totalStockKg,
          karung_count: parseFloat((totalStockKg / 50).toFixed(1)),
          est_days_remaining: estDaysFeed,
          total_unpaid_feed: totalUnpaidFeed,
          is_low: estDaysFeed <= 3 && totalStockKg > 0
        },
        inventory: {
          unsold_butir: unsoldEggsButir,
          formatted_unsold: formatTrai(unsoldEggsButir)
        },
        finance: {
          month_income: monthIncome,
          month_expense: monthExpense,
          egg_sales_income: eggSalesIncome,
          feed_expense_month: feedExpenseMonth,
          month_net_profit: monthNetProfit
        }
      },
      chart_data: chartRows.map(item => ({
        date: new Date(item.production_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        telur: item.total_eggs,
        produktivitas: parseFloat(item.productivity_pct)
      })),
      alerts
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
