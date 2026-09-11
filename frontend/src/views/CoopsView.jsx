import React, { useEffect, useState } from 'react';
import { coopsApi } from '../services/api';

export default function CoopsView() {
  const [coops, setCoops] = useState([]);
  const [totalDucks, setTotalDucks] = useState(526);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);

  const [logForm, setLogForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    change_type: 'subtract', // subtract or add
    quantity: '1',
    reason: 'Kematian Alami',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coopsRes, logsRes] = await Promise.all([
        coopsApi.getAll(),
        coopsApi.getLogs()
      ]);

      if (coopsRes.data.success) {
        setCoops(coopsRes.data.coops);
        setTotalDucks(coopsRes.data.total_ducks);
      }
      if (logsRes.data.success) setLogs(logsRes.data.logs);
    } catch (err) {
      console.error('Error fetching coops:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    try {
      await coopsApi.logPopulation(logForm);
      alert('Perubahan populasi bebek berhasil dicatat!');
      setShowLogModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal merekam perubahan populasi');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>Pengelolaan Kandang Bebek (526 Ekor)</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Monitor populasi bebek aktif dan catat riwayat kematian/penambahan</p>
        </div>
        <button onClick={() => setShowLogModal(true)} className="btn btn-primary">
          + Catat Perubahan Populasi
        </button>
      </div>

      {/* Total Population Banner */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(16,185,129,0.05))', borderLeft: '4px solid #3b82f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>TOTAL POPULASI BEBEK AKTIF</span>
            <h3 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'white', marginTop: '0.25rem' }}>
              {totalDucks} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>ekor</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#34d399', marginTop: '0.25rem' }}>Kandang Bebek Utama</p>
          </div>
        </div>
      </div>

      {/* Population Change History Table */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>Riwayat Perubahan Populasi Bebek</h3>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>TANGGAL</th>
                <th>KANDANG</th>
                <th>TIPE PERUBAHAN</th>
                <th>JUMLAH</th>
                <th>ALASAN</th>
                <th>POPULASI SETELAHNYA</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((l) => (
                  <tr key={l.id}>
                    <td>{new Date(l.log_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td style={{ fontWeight: 600, color: 'white' }}>{l.coop_name}</td>
                    <td>
                      <span className={`badge ${l.change_type === 'add' ? 'badge-success' : 'badge-danger'}`}>
                        {l.change_type === 'add' ? '+ Penambahan' : '- Pengurangan'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: l.change_type === 'add' ? '#34d399' : '#f87171' }}>
                      {l.change_type === 'add' ? `+${l.quantity}` : `-${l.quantity}`} ekor
                    </td>
                    <td style={{ color: 'white' }}>{l.reason}</td>
                    <td style={{ fontWeight: 700, color: '#fbbf24' }}>{l.population_after} ekor</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8' }}>Belum ada riwayat perubahan populasi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Log Population */}
      {showLogModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginBottom: '1.25rem' }}>Catat Perubahan Populasi Bebek</h3>
            <form onSubmit={handleLogSubmit}>
              <div className="form-group">
                <label className="form-label">Jenis Perubahan</label>
                <select className="form-select" value={logForm.change_type} onChange={(e) => setLogForm({ ...logForm, change_type: e.target.value })}>
                  <option value="subtract">Pengurangan (- Kematian / Penjualan / Afkir)</option>
                  <option value="add">Penambahan (+ Pembelian / Penetasan)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Perubahan</label>
                <input type="date" className="form-input" value={logForm.log_date} onChange={(e) => setLogForm({ ...logForm, log_date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Jumlah Bebek (Ekor)</label>
                <input type="number" className="form-input" placeholder="Contoh: 2" value={logForm.quantity} onChange={(e) => setLogForm({ ...logForm, quantity: e.target.value })} required min="1" />
              </div>
              <div className="form-group">
                <label className="form-label">Alasan Perubahan</label>
                <input type="text" className="form-input" placeholder="Contoh: Kematian Alami / Sakit / Pembelian Baru" value={logForm.reason} onChange={(e) => setLogForm({ ...logForm, reason: e.target.value })} required />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowLogModal(false)} className="btn btn-outline">Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
