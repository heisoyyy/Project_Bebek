import React, { useEffect, useState } from 'react';
import { inventoryApi } from '../services/api';

function formatTrai(butir) {
  if (!butir || butir === 0) return '0 Butir';
  const trai = Math.floor(butir / 30);
  const remaining = butir % 30;
  if (trai === 0) return `${butir} Butir`;
  if (remaining === 0) return `${trai} Trai`;
  return `${trai} Trai + ${remaining} Butir`;
}

export default function InventoryView() {
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSaleModal, setShowSaleModal] = useState(false);

  const [saleForm, setSaleForm] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    amount: '',
    butir_terjual: '',
    buyer_name: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusRes, historyRes] = await Promise.all([
        inventoryApi.getStatus(),
        inventoryApi.getHistory()
      ]);

      if (statusRes.data.success) setStatus(statusRes.data);
      if (historyRes.data.success) setHistory(historyRes.data.history);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await inventoryApi.sell(saleForm);
      alert(res.data.message || 'Penjualan telur berhasil dicatat!');
      setShowSaleModal(false);
      setSaleForm({
        sale_date: new Date().toISOString().split('T')[0],
        amount: '',
        butir_terjual: '',
        buyer_name: '',
        notes: ''
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal merekam penjualan telur');
    }
  };

  const handleDeleteHistory = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data riwayat stok & penjualan ini?')) {
      try {
        const res = await inventoryApi.deleteHistory(id);
        alert(res.data.message || 'Data riwayat berhasil dihapus!');
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Gagal menghapus data riwayat');
      }
    }
  };

  // Auto-convert butir input to trai display preview
  const butir = parseInt(saleForm.butir_terjual) || 0;
  const traiPreview = butir > 0 ? formatTrai(butir) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>Stok Gudang & Penjualan Telur</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.2rem' }}>Pantau stok masuk/keluar telur & catat penjualan nominal uang (Rp)</p>
        </div>
        <button onClick={() => setShowSaleModal(true)} className="btn btn-primary">
          + Catat Penjualan Telur
        </button>
      </div>

      {/* Barn Egg Stock Banner */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(16,185,129,0.05))', borderLeft: '4px solid #f59e0b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>TELUR TERSISA DI GUDANG</span>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
              {status?.formatted_stock || '0 Butir'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
              Total butir aktual: <strong>{status?.current_stock_butir || 0} Butir</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', background: 'rgba(52,211,153,0.1)', borderRadius: 12, padding: '0.65rem 1.1rem', border: '1px solid rgba(52,211,153,0.3)' }}>
              <span style={{ fontSize: '0.75rem', color: '#34d399', display: 'block', fontWeight: 700 }}>STOK MASUK</span>
              <span style={{ fontSize: '0.88rem', color: 'white', fontWeight: 700 }}>Dari Produksi Telur Harian</span>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(248,113,113,0.1)', borderRadius: 12, padding: '0.65rem 1.1rem', border: '1px solid rgba(248,113,113,0.3)' }}>
              <span style={{ fontSize: '0.75rem', color: '#f87171', display: 'block', fontWeight: 700 }}>STOK KELUAR</span>
              <span style={{ fontSize: '0.88rem', color: 'white', fontWeight: 700 }}>Saat Penjualan Tercatat</span>
            </div>
          </div>
        </div>
      </div>

      {/* History Table with Stok Masuk / Keluar Labels */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>Riwayat Keluar / Masuk Stok Telur Gudang</h3>
        <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
          <span style={{ color: '#34d399', fontWeight: 600 }}>STOK MASUK</span> = Telur dari produksi kandang masuk gudang&nbsp;&nbsp;|&nbsp;&nbsp;
          <span style={{ color: '#f87171', fontWeight: 600 }}>STOK KELUAR</span> = Telur yang terjual/diambil pengepul
        </p>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>TANGGAL</th>
                <th>KETERANGAN</th>
                <th>JUMLAH STOK BERUBAH</th>
                <th>STOK SETELAH</th>
                <th>CATATAN</th>
                <th>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((h) => {
                  const isKeluar = h.record_type === 'keluar';
                  return (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 700, color: 'white' }}>{new Date(h.record_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td>
                        <span 
                          style={{ 
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem', 
                            borderRadius: 20, 
                            fontSize: '0.75rem', 
                            fontWeight: 800,
                            background: isKeluar ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)',
                            color: isKeluar ? '#f87171' : '#34d399',
                            border: `1px solid ${isKeluar ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`
                          }}
                        >
                          {isKeluar ? 'STOK KELUAR' : 'STOK MASUK'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, color: isKeluar ? '#f87171' : '#34d399', fontSize: '1rem' }}>
                        {isKeluar
                          ? `- ${h.formatted_sold}`
                          : `+ ${h.formatted_added}`}
                      </td>
                      <td style={{ fontWeight: 700, color: '#fbbf24' }}>{h.formatted_final}</td>
                      <td style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{h.notes || '-'}</td>
                      <td>
                        <button 
                          onClick={() => handleDeleteHistory(h.id)} 
                          className="btn btn-outline" 
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: '#ef4444' }}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Belum ada riwayat stok gudang.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Penjualan */}
      {showSaleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '0.25rem' }}>Form Penjualan Telur</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
              Stok gudang saat ini: <strong style={{ color: '#fbbf24' }}>{status?.formatted_stock || '0 Butir'}</strong> ({status?.current_stock_butir || 0} Butir)
            </p>
            <form onSubmit={handleSaleSubmit}>
              
              <div className="form-group">
                <label className="form-label">Tanggal Transaksi</label>
                <input type="date" className="form-input" value={saleForm.sale_date} onChange={(e) => setSaleForm({ ...saleForm, sale_date: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label">Jumlah Telur Terjual (Butir)</label>
                <input 
                  type="number" 
                  className="form-input"
                  placeholder="Contoh: 300 (= 10 Trai)"
                  value={saleForm.butir_terjual}
                  onChange={(e) => setSaleForm({ ...saleForm, butir_terjual: e.target.value })}
                  required 
                  min="1"
                />
                {traiPreview && (
                  <span style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '0.35rem', display: 'block', fontWeight: 600 }}>
                    = <strong>{traiPreview}</strong> (Stok berkurang otomatis saat disimpan)
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Total Uang Penjualan (Rp)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Contoh: 700000" 
                  value={saleForm.amount} 
                  onChange={(e) => setSaleForm({ ...saleForm, amount: e.target.value })} 
                  required 
                  min="1" 
                />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                  *Masukkan total uang yang diterima (misal: 700000)
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Nama Pembeli / Pengepul (Opsional)</label>
                <input type="text" className="form-input" placeholder="Contoh: Pak Haji / Pasar" value={saleForm.buyer_name} onChange={(e) => setSaleForm({ ...saleForm, buyer_name: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Catatan Tambahan (Opsional)</label>
                <input type="text" className="form-input" placeholder="Keterangan transaksi" value={saleForm.notes} onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowSaleModal(false)} className="btn btn-outline">Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Penjualan</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
