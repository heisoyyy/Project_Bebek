import React, { useEffect, useState } from 'react';
import { feedApi } from '../services/api';

export default function FeedView() {
  const [feedItems, setFeedItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);

  const [purchaseForm, setPurchaseForm] = useState({
    purchase_date: new Date().toISOString().split('T')[0],
    feed_item_id: '1',
    quantity_kg: '',
    price_per_kg: '',
    payment_status: 'unpaid', // default Belum Bayar or Lunas
    supplier: '',
    notes: ''
  });

  const [usageForm, setUsageForm] = useState({
    usage_date: new Date().toISOString().split('T')[0],
    feed_item_id: '1',
    quantity_kg: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, purchasesRes, usagesRes] = await Promise.all([
        feedApi.getItems(),
        feedApi.getPurchases(),
        feedApi.getUsages()
      ]);

      if (itemsRes.data.success) {
        setFeedItems(itemsRes.data.items);
        setSummary({
          total_stock_kg: itemsRes.data.total_stock_kg,
          daily_avg_usage_kg: itemsRes.data.daily_avg_usage_kg,
          est_days_remaining: itemsRes.data.est_days_remaining,
          is_low_stock: itemsRes.data.is_low_stock
        });
      }
      if (purchasesRes.data.success) setPurchases(purchasesRes.data.purchases);
      if (usagesRes.data.success) setUsages(usagesRes.data.usages);
    } catch (err) {
      console.error('Error fetching feed data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await feedApi.purchase(purchaseForm);
      alert(res.data.message);
      setShowPurchaseModal(false);
      setPurchaseForm({
        purchase_date: new Date().toISOString().split('T')[0],
        feed_item_id: '1',
        quantity_kg: '',
        price_per_kg: '',
        payment_status: 'unpaid',
        supplier: '',
        notes: ''
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan pembelian pakan');
    }
  };

  const handleMarkAsPaid = async (id, feedName, totalPrice) => {
    const formattedPrice = parseFloat(totalPrice).toLocaleString('id-ID');
    if (window.confirm(`Tandai pembelian ${feedName} (Rp ${formattedPrice}) ini sebagai Sudah Bayar?\n\nPengeluaran akan otomatis dicatat ke Modul Keuangan.`)) {
      try {
        const res = await feedApi.markPurchaseAsPaid(id);
        alert(res.data.message);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Gagal merubah status pembayaran');
      }
    }
  };

  const handleUsageSubmit = async (e) => {
    e.preventDefault();
    try {
      await feedApi.use(usageForm);
      alert('Pemakaian pakan berhasil dicatat!');
      setShowUsageModal(false);
      setUsageForm({
        usage_date: new Date().toISOString().split('T')[0],
        feed_item_id: '1',
        quantity_kg: '',
        notes: ''
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan pemakaian pakan');
    }
  };

  const handleDeletePurchase = async (id, feedName, quantity) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data pembelian ${quantity} KG ${feedName} ini?\n\nStok pakan akan otomatis dikurangi kembali.`)) {
      try {
        const res = await feedApi.deletePurchase(id);
        alert(res.data.message || 'Riwayat pembelian berhasil dihapus');
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Gagal menghapus riwayat pembelian');
      }
    }
  };

  const handleDeleteUsage = async (id, feedName, quantity) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data pemakaian ${quantity} KG ${feedName} ini?\n\nStok pakan akan otomatis dikembalikan.`)) {
      try {
        const res = await feedApi.deleteUsage(id);
        alert(res.data.message || 'Riwayat pemakaian berhasil dihapus');
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Gagal menghapus riwayat pemakaian');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>Pengelolaan & Stok Pakan</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Kelola stok pakan, status pembayaran pakan, dan estimasi hari tersisa</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setShowUsageModal(true)} className="btn btn-secondary">
            - Pemakaian Pakan
          </button>
          <button onClick={() => setShowPurchaseModal(true)} className="btn btn-primary">
            + Beli Pakan Baru
          </button>
        </div>
      </div>

      {/* Burn Rate Banner */}
      <div className="glass-card" style={{ background: summary?.is_low_stock ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.05))', borderLeft: `4px solid ${summary?.is_low_stock ? '#ef4444' : '#8b5cf6'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>ESTIMASI SISA PAKAN KANDANG</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginTop: '0.25rem' }}>
              {summary?.total_stock_kg || 0} KG <span style={{ fontSize: '1rem', color: '#94a3b8' }}>(± {((summary?.total_stock_kg || 0) / 50).toFixed(1)} Karung)</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
              Rata-rata konsumsi harian: <strong>{summary?.daily_avg_usage_kg || 0} KG/hari</strong>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={`badge ${summary?.is_low_stock ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '1.1rem', padding: '0.5rem 1rem' }}>
              ± {summary?.est_days_remaining || 0} Hari Tersisa
            </span>
          </div>
        </div>
      </div>

      {/* Feed Items Stock Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {feedItems.map((item) => (
          <div key={item.id} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white' }}>{item.name}</h4>
              <span className={`badge ${parseFloat(item.stock_kg) <= parseFloat(item.min_stock_alert_kg) ? 'badge-danger' : 'badge-success'}`}>
                {parseFloat(item.stock_kg) <= parseFloat(item.min_stock_alert_kg) ? 'Menipis' : 'Aman'}
              </span>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white' }}>{item.stock_kg} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>KG</span></h3>
              <p style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '0.25rem' }}>Setara ± {item.karung_count} Karung (50 KG)</p>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Harga: Rp {parseFloat(item.price_per_kg).toLocaleString('id-ID')}/KG</p>
            </div>
          </div>
        ))}
      </div>

      {/* Usage & Purchase Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Table 1: Pemakaian Pakan */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>Riwayat Pemakaian Pakan</h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>TANGGAL</th>
                  <th>BAHAN PAKAN</th>
                  <th>JUMLAH (KG)</th>
                  <th>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {usages.length > 0 ? (
                  usages.map((u) => (
                    <tr key={u.id}>
                      <td>{new Date(u.usage_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
                      <td style={{ fontWeight: 600, color: 'white' }}>{u.feed_name}</td>
                      <td style={{ fontWeight: 700, color: '#f87171' }}>-{u.quantity_kg} KG</td>
                      <td>
                        <button 
                          onClick={() => handleDeleteUsage(u.id, u.feed_name, u.quantity_kg)} 
                          className="btn btn-outline" 
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: '#ef4444' }}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8' }}>Belum ada pemakaian pakan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Pembelian Pakan (With Payment Status Toggle) */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>Riwayat Pembelian Pakan</h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>TANGGAL</th>
                  <th>BAHAN PAKAN</th>
                  <th>JUMLAH</th>
                  <th>TOTAL HARGA</th>
                  <th>STATUS BAYAR</th>
                  <th>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length > 0 ? (
                  purchases.map((p) => (
                    <tr key={p.id}>
                      <td>{new Date(p.purchase_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
                      <td style={{ fontWeight: 600, color: 'white' }}>{p.feed_name}</td>
                      <td style={{ color: '#34d399', fontWeight: 700 }}>+{p.quantity_kg} KG</td>
                      <td style={{ color: 'white', fontWeight: 600 }}>Rp {parseFloat(p.total_price).toLocaleString('id-ID')}</td>
                      <td>
                        {p.payment_status === 'unpaid' ? (
                          <button 
                            onClick={() => handleMarkAsPaid(p.id, p.feed_name, p.total_price)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', background: '#f59e0b' }}
                            title="Klik untuk mengubah menjadi Sudah Bayar & catat ke Keuangan"
                          >
                            Belum Bayar (Klik Utk Bayar)
                          </button>
                        ) : (
                          <span className="badge badge-success">Sudah Bayar</span>
                        )}
                      </td>
                      <td>
                        <button 
                          onClick={() => handleDeletePurchase(p.id, p.feed_name, p.quantity_kg)} 
                          className="btn btn-outline" 
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: '#ef4444' }}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8' }}>Belum ada pembelian pakan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal Purchase */}
      {showPurchaseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginBottom: '1.25rem' }}>Form Pembelian Pakan Baru</h3>
            <form onSubmit={handlePurchaseSubmit}>
              <div className="form-group">
                <label className="form-label">Tanggal Pembelian</label>
                <input type="date" className="form-input" value={purchaseForm.purchase_date} onChange={(e) => setPurchaseForm({ ...purchaseForm, purchase_date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Jenis Bahan Pakan</label>
                <select className="form-select" value={purchaseForm.feed_item_id} onChange={(e) => setPurchaseForm({ ...purchaseForm, feed_item_id: e.target.value })}>
                  {feedItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Jumlah Pembelian (KG)</label>
                <input type="number" step="0.1" className="form-input" placeholder="Contoh: 100" value={purchaseForm.quantity_kg} onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity_kg: e.target.value })} required />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>*1 Karung = 50 KG (2 Karung = 100 KG)</span>
              </div>
              <div className="form-group">
                <label className="form-label">Harga Satuan per KG (Rp)</label>
                <input type="number" className="form-input" placeholder="Contoh: 8000" value={purchaseForm.price_per_kg} onChange={(e) => setPurchaseForm({ ...purchaseForm, price_per_kg: e.target.value })} required />
              </div>
              
              <div className="form-group">
                <label className="form-label">Status Pembayaran</label>
                <select className="form-select" value={purchaseForm.payment_status} onChange={(e) => setPurchaseForm({ ...purchaseForm, payment_status: e.target.value })}>
                  <option value="unpaid">🔴 Belum Bayar (Belum Masuk Keuangan)</option>
                  <option value="lunas">🟢 Sudah Bayar / Lunas (Langsung Masuk Keuangan)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Supplier / Toko (Opsional)</label>
                <input type="text" className="form-input" placeholder="Contoh: Toko Pakan Pak Haji" value={purchaseForm.supplier} onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowPurchaseModal(false)} className="btn btn-outline">Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Pembelian</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Usage */}
      {showUsageModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginBottom: '1.25rem' }}>Catat Pemakaian Pakan Harian</h3>
            <form onSubmit={handleUsageSubmit}>
              <div className="form-group">
                <label className="form-label">Tanggal Pemakaian</label>
                <input type="date" className="form-input" value={usageForm.usage_date} onChange={(e) => setUsageForm({ ...usageForm, usage_date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Bahan Pakan yang Digunakan</label>
                <select className="form-select" value={usageForm.feed_item_id} onChange={(e) => setUsageForm({ ...usageForm, feed_item_id: e.target.value })}>
                  {feedItems.map(item => <option key={item.id} value={item.id}>{item.name} (Tersisa: {item.stock_kg} KG)</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Jumlah Pemakaian Total (KG)</label>
                <input type="number" step="0.1" className="form-input" placeholder="Contoh: 70" value={usageForm.quantity_kg} onChange={(e) => setUsageForm({ ...usageForm, quantity_kg: e.target.value })} required />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowUsageModal(false)} className="btn btn-outline">Batal</button>
                <button type="submit" className="btn btn-secondary">Simpan Pemakaian</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
