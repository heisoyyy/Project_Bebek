import React, { useEffect, useState } from 'react';
import { financeApi } from '../services/api';

export default function FinanceView() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [txForm, setTxForm] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    type: 'expense',
    category: 'obat_vitamin',
    amount: '',
    description: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, txRes] = await Promise.all([
        financeApi.getSummary(),
        financeApi.getTransactions({ type: filterType })
      ]);

      if (summaryRes.data.success) setSummary(summaryRes.data);
      if (txRes.data.success) setTransactions(txRes.data.transactions);
    } catch (err) {
      console.error('Error fetching finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterType]);

  const handleTxSubmit = async (e) => {
    e.preventDefault();
    try {
      await financeApi.createTransaction(txForm);
      alert('Transaksi keuangan berhasil disimpan!');
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert('Gagal menyimpan transaksi');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        await financeApi.deleteTransaction(id);
        fetchData();
      } catch (err) {
        alert('Gagal menghapus transaksi');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>Pemasukan & Pengeluaran Keuangan</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Monitor porsi pemasukan dari penjualan telur dan pengeluaran pakan / operasional</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + Catat Transaksi Manual
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card">
          <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL PEMASUKAN (BULAN INI)</span>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', marginTop: '0.5rem' }}>
            Rp {(summary?.month?.total_income || 0).toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="glass-card">
          <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL PENGELUARAN (BULAN INI)</span>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f87171', marginTop: '0.5rem' }}>
            Rp {(summary?.month?.total_expense || 0).toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>KEUNTUNGAN BERSIH (BULAN INI)</span>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: (summary?.month?.net_profit || 0) >= 0 ? '#34d399' : '#f87171', marginTop: '0.5rem' }}>
            Rp {(summary?.month?.net_profit || 0).toLocaleString('id-ID')}
          </h3>
        </div>
      </div>

      {/* Transactions Table & Filter */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Riwayat Transaksi Keuangan</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setFilterType('')} className={`btn ${filterType === '' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>Semua</button>
            <button onClick={() => setFilterType('income')} className={`btn ${filterType === 'income' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>Pemasukan</button>
            <button onClick={() => setFilterType('expense')} className={`btn ${filterType === 'expense' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>Pengeluaran</button>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>TANGGAL</th>
                <th>TIPE</th>
                <th>KATEGORI</th>
                <th>NOMINAL</th>
                <th>DESKRIPSI / KETERANGAN</th>
                <th>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{new Date(t.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>
                      <span className={`badge ${t.type === 'income' ? 'badge-success' : 'badge-danger'}`}>
                        {t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </td>
                    <td style={{ textTransform: 'capitalize', color: 'white', fontWeight: 600 }}>
                      {t.category.replace('_', ' ')}
                    </td>
                    <td style={{ fontWeight: 700, color: t.type === 'income' ? '#34d399' : '#f87171' }}>
                      {t.type === 'income' ? '+' : '-'} Rp {parseFloat(t.amount).toLocaleString('id-ID')}
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{t.description || '-'}</td>
                    <td>
                      <button onClick={() => handleDelete(t.id)} className="btn btn-outline" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', color: '#ef4444' }}>
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8' }}>Belum ada transaksi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Transaction */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginBottom: '1.25rem' }}>Catat Transaksi Manual</h3>
            <form onSubmit={handleTxSubmit}>
              <div className="form-group">
                <label className="form-label">Tipe Transaksi</label>
                <select className="form-select" value={txForm.type} onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}>
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select className="form-select" value={txForm.category} onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}>
                  <option value="pakan">Pakan Bebek</option>
                  <option value="obat_vitamin">Obat & Vitamin</option>
                  <option value="perawatan">Perawatan & Peralatan</option>
                  <option value="operasional">Operasional Kandang</option>
                  <option value="penjualan_telur">Penjualan Telur</option>
                  <option value="lainnya">Lain-lain</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Transaksi</label>
                <input type="date" className="form-input" value={txForm.transaction_date} onChange={(e) => setTxForm({ ...txForm, transaction_date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nominal (Rp)</label>
                <input type="number" className="form-input" placeholder="Contoh: 150000" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} required min="1" />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi / Catatan</label>
                <input type="text" className="form-input" placeholder="Contoh: Beli Vitamin Anti Stres Bebek" value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Transaksi</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
