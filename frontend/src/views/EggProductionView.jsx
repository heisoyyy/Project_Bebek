import React, { useEffect, useState } from 'react';
import { eggsApi } from '../services/api';

export default function EggProductionView() {
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const getYesterdayString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    production_date: getYesterdayString(),
    good_eggs: '',
    cracked_eggs: '0',
    notes: ''
  });

  const fetchProductions = async () => {
    try {
      setLoading(true);
      const res = await eggsApi.getAll();
      if (res.data.success) {
        setProductions(res.data.productions);
      }
    } catch (err) {
      console.error('Error fetching eggs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductions();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateTraiPreview = () => {
    const good = parseInt(formData.good_eggs) || 0;
    const cracked = parseInt(formData.cracked_eggs) || 0;
    const total = good + cracked;
    const trai = Math.floor(total / 30);
    const remaining = total % 30;
    if (trai === 0) return `${total} Butir`;
    if (remaining === 0) return `${trai} Trai (${total} Butir)`;
    return `${trai} Trai + ${remaining} Butir (${total} Butir)`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await eggsApi.update(editingId, formData);
        alert('Data produksi berhasil diperbarui!');
      } else {
        await eggsApi.create(formData);
        alert('Data produksi H-1 berhasil disimpan!');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        production_date: getYesterdayString(),
        good_eggs: '',
        cracked_eggs: '0',
        notes: ''
      });
      fetchProductions();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan data');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      production_date: item.production_date.split('T')[0],
      good_eggs: item.good_eggs,
      cracked_eggs: item.cracked_eggs,
      notes: item.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data produksi tanggal ini?')) {
      try {
        await eggsApi.delete(id);
        fetchProductions();
      } catch (err) {
        alert('Gagal menghapus data');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>Pencatatan Produksi Telur (H-1)</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.2rem' }}>Catat hasil produksi harian dan persentase produktivitas bebek</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({
              production_date: getYesterdayString(),
              good_eggs: '',
              cracked_eggs: '0',
              notes: ''
            });
            setShowForm(!showForm);
          }} 
          className="btn btn-primary"
        >
          {showForm ? 'Tutup Form' : '+ Catat Telur H-1'}
        </button>
      </div>

      {/* Form Input Container */}
      {showForm && (
        <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white', marginBottom: '1.25rem' }}>
            {editingId ? 'Edit Data Produksi Telur' : 'Form Input Telur H-1'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              
              <div className="form-group">
                <label className="form-label">Tanggal Produksi (H-1)</label>
                <input 
                  type="date" 
                  name="production_date" 
                  className="form-input" 
                  value={formData.production_date} 
                  onChange={handleInputChange} 
                  required 
                  disabled={editingId !== null}
                />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem', display: 'block' }}>
                  *Telur diambil pagi hari dianggap produksi kemarin
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Telur Utuh / Bagus (Butir)</label>
                <input 
                  type="number" 
                  name="good_eggs" 
                  className="form-input" 
                  placeholder="Contoh: 400" 
                  value={formData.good_eggs} 
                  onChange={handleInputChange} 
                  min="0" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telur Retak / Pecah (Butir)</label>
                <input 
                  type="number" 
                  name="cracked_eggs" 
                  className="form-input" 
                  placeholder="Contoh: 10" 
                  value={formData.cracked_eggs} 
                  onChange={handleInputChange} 
                  min="0" 
                />
              </div>

            </div>

            {/* Trai Preview Banner */}
            <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))', border: '1px solid rgba(245,158,11,0.3)', padding: '0.9rem 1.1rem', borderRadius: 14, marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 700 }}>Hasil Konversi Trai:</span>
              <span style={{ fontSize: '1.1rem', color: 'white', fontWeight: 800 }}>{calculateTraiPreview()}</span>
            </div>

            <div className="form-group" style={{ marginTop: '1.25rem' }}>
              <label className="form-label">Keterangan / Catatan (Opsional)</label>
              <input 
                type="text" 
                name="notes" 
                className="form-input" 
                placeholder="Contoh: Tambahan konsentrat pakan" 
                value={formData.notes} 
                onChange={handleInputChange} 
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">Batal</button>
              <button type="submit" className="btn btn-primary">Simpan Data Produksi</button>
            </div>
          </form>
        </div>
      )}

      {/* Production History Table */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white', marginBottom: '1.25rem' }}>Riwayat Produksi Telur</h3>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>TANGGAL (H-1)</th>
                <th>POPULASI BEBEK</th>
                <th>TELUR UTUH</th>
                <th>TELUR RETAK</th>
                <th>TOTAL TELUR</th>
                <th>PRODUKTIVITAS</th>
                <th>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {productions.length > 0 ? (
                productions.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, color: 'white' }}>
                      {new Date(p.production_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>{p.duck_population} ekor</td>
                    <td>{p.good_eggs} butir</td>
                    <td style={{ color: p.cracked_eggs > 0 ? '#f87171' : '#94a3b8' }}>{p.cracked_eggs} butir</td>
                    <td style={{ fontWeight: 700, color: '#fbbf24' }}>
                      {p.total_eggs} butir <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', fontWeight: 500 }}>({p.formatted_total})</span>
                    </td>
                    <td>
                      <span className={`badge ${parseFloat(p.productivity_pct) >= 75 ? 'badge-success' : parseFloat(p.productivity_pct) >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                        {p.productivity_pct}%
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleEdit(p)} className="btn btn-outline" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="btn btn-outline" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: '#ef4444' }}>
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1' }}>Belum ada riwayat produksi telur</div>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Klik "+ Catat Telur H-1" di atas untuk menambah data baru.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
