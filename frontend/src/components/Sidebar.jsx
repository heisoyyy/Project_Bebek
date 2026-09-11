import React from 'react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'eggs', label: 'Produksi Telur' },
  { id: 'feed', label: 'Stok Pakan' },
  { id: 'inventory', label: 'Stok & Penjualan' },
  { id: 'coops', label: 'Jumlah Bebek' },
  { id: 'finance', label: 'Keuangan' },
  { id: 'reports', label: 'Rekap & Laporan' },
  { id: 'settings', label: 'Pengaturan' },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: '0.5rem 0.5rem 1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img 
              src="/logo.jpg" 
              alt="Evandika Duck Farm Logo" 
              style={{ width: 44, height: 44, borderRadius: '12px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} 
            />
            <div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                Evandika Duck Farm
              </h1>
              <p style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600, marginTop: '0.15rem' }}>ESTD 2015</p>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.65rem', fontWeight: 500 }}>Sistem Pengelolaan Internal</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '0.85rem 1.1rem',
                  borderRadius: 14,
                  border: isActive ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
                  background: isActive ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))' : 'transparent',
                  color: isActive ? '#34d399' : '#94a3b8',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isActive ? '0 4px 15px rgba(16,185,129,0.15)' : 'none'
                }}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', padding: '1rem 1.1rem', background: 'rgba(30,41,59,0.6)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Populasi Bebek:</p>
            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Aktif</span>
          </div>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem', display: 'block' }}>526 Ekor</span>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Direct Scrollable Bar) */}
      <nav className="mobile-nav">
        <div style={{ display: 'flex', width: '100%', overflowX: 'auto', gap: '0.4rem', padding: '0.25rem 0.5rem', scrollbarWidth: 'none' }}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '0.65rem 1rem',
                  borderRadius: 12,
                  border: isActive ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  background: isActive ? 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.1))' : '#1e293b',
                  color: isActive ? '#34d399' : '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
