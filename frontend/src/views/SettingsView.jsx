import React, { useEffect, useState } from 'react';
import { settingsApi } from '../services/api';

export default function SettingsView() {
  const [settings, setSettings] = useState({
    egg_price_per_piece: '2200',
    egg_price_per_trai: '66000',
    min_feed_alert_days: '3',
    production_alert_threshold: '10'
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await settingsApi.getAll();
      if (res.data.success && res.data.settings) {
        setSettings(prev => ({ ...prev, ...res.data.settings }));
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await settingsApi.update(settings);
      alert('Pengaturan sistem berhasil disimpan!');
    } catch (err) {
      alert('Gagal menyimpan pengaturan');
    }
  };

  const handleBackupDownload = () => {
    window.open(settingsApi.getBackupUrl(), '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>Pengaturan System & Backup Data</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Konfigurasi master harga, threshold notifikasi, dan salinan cadangan (backup) data</p>
      </div>

      {/* 1-Click Backup Card */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.05))', borderLeft: '4px solid #10b981' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Salinan Cadangan (1-Click Data Backup)</h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
              Unduh file backup JSON untuk mengamankan seluruh data produksi, pakan, & keuangan Anda.
            </p>
          </div>
          <button onClick={handleBackupDownload} className="btn btn-primary">
            Unduh File Backup JSON
          </button>
        </div>
      </div>

      {/* Settings Form */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '1.25rem' }}>Master Pengaturan Sistem</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            
            <div className="form-group">
              <label className="form-label">Harga Standar Telur / Butir (Rp)</label>
              <input 
                type="number" 
                className="form-input" 
                value={settings.egg_price_per_piece} 
                onChange={(e) => setSettings({ ...settings, egg_price_per_piece: e.target.value })} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Harga Standar Telur / Trai (Rp)</label>
              <input 
                type="number" 
                className="form-input" 
                value={settings.egg_price_per_trai} 
                onChange={(e) => setSettings({ ...settings, egg_price_per_trai: e.target.value })} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Batas Minimum Peringatan Pakan (Hari)</label>
              <input 
                type="number" 
                className="form-input" 
                value={settings.min_feed_alert_days} 
                onChange={(e) => setSettings({ ...settings, min_feed_alert_days: e.target.value })} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Threshold Notifikasi Perubahan Produksi (%)</label>
              <input 
                type="number" 
                className="form-input" 
                value={settings.production_alert_threshold} 
                onChange={(e) => setSettings({ ...settings, production_alert_threshold: e.target.value })} 
                required 
              />
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary">
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
