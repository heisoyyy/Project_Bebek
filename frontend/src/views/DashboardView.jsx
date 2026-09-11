import React, { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { dashboardApi } from '../services/api';

export default function DashboardView({ onNavigate, openModal }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getOverview();
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', fontWeight: 600 }}>Memuat data dashboard...</p>
      </div>
    );
  }

  const { metrics, chart_data, alerts } = data || {};
  const totalUnpaidFeed = metrics?.feed?.total_unpaid_feed || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>Dashboard Utama</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.2rem' }}>Ringkasan kondisi operasional & keuangan kandang saat ini</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => openModal('egg')} className="btn btn-primary">
            + Input Telur H-1
          </button>
          <button onClick={() => openModal('feedUsage')} className="btn btn-secondary">
            + Pemakaian Pakan
          </button>
          <button onClick={() => openModal('sale')} className="btn btn-outline">
            + Penjualan Telur
          </button>
        </div>
      </div>

      {/* Unpaid Feed Debt Card (If Any) */}
      {totalUnpaidFeed > 0 && (
        <div 
          className="glass-card" 
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.05))',
            borderLeft: '4px solid #f59e0b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TAGIHAN UTANG PAKAN BELUM DIBAYAR
            </span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', marginTop: '0.25rem' }}>
              Rp {totalUnpaidFeed.toLocaleString('id-ID')}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.15rem' }}>
              Terdapat pembelian pakan yang belum dilunasi. Pembayaran belum memotong saldo keuangan.
            </p>
          </div>
          <button onClick={() => onNavigate('feed')} className="btn btn-secondary">
            Pelunasan Pakan
          </button>
        </div>
      )}

      {/* Alerts Bar */}
      {alerts && alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {alerts.filter(a => a.title !== 'Utang Pakan Belum Dibayar!').map((alert, index) => (
            <div 
              key={index} 
              className="glass-card" 
              style={{
                padding: '1rem 1.25rem',
                borderLeft: `4px solid ${alert.type === 'danger' ? '#ef4444' : alert.type === 'warning' ? '#f59e0b' : '#10b981'}`,
                background: alert.type === 'danger' ? 'rgba(239,68,68,0.1)' : alert.type === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)'
              }}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white' }}>{alert.title}</h4>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem' }}>{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
        
        {/* Card 1: Total Bebek */}
        <div className="glass-card" style={{ borderTop: '3px solid #3b82f6' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>POPULASI BEBEK</span>
          <div style={{ marginTop: '0.75rem' }}>
            <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
              {metrics?.total_ducks || 526} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>ekor</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '0.35rem', fontWeight: 600 }}>Kandang Bebek Utama</p>
          </div>
        </div>

        {/* Card 2: Produksi Telur H-1 */}
        <div className="glass-card" style={{ borderTop: '3px solid #f59e0b' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>PRODUKSI TELUR H-1</span>
          <div style={{ marginTop: '0.75rem' }}>
            <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
              {metrics?.latest_egg?.total_eggs || 0} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>butir</span>
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
              <span className="badge badge-warning">{metrics?.latest_egg?.formatted_total || '0 Trai'}</span>
              {metrics?.latest_egg?.change_pct !== undefined && (
                <span className={`badge ${metrics.latest_egg.change_pct >= 0 ? 'badge-success' : 'badge-danger'}`}>
                  {metrics.latest_egg.change_pct >= 0 ? `+${metrics.latest_egg.change_pct}%` : `${metrics.latest_egg.change_pct}%`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Produktivitas % */}
        <div className="glass-card" style={{ borderTop: '3px solid #10b981' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>PRODUKTIVITAS</span>
          <div style={{ marginTop: '0.75rem' }}>
            <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
              {metrics?.latest_egg?.productivity_pct || 0}%
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.35rem' }}>
              Persentase bertelur harian
            </p>
          </div>
        </div>

        {/* Card 4: Stok Pakan Tersisa */}
        <div className="glass-card" style={{ borderTop: '3px solid #8b5cf6' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>STOK PAKAN</span>
          <div style={{ marginTop: '0.75rem' }}>
            <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
              {metrics?.feed?.total_stock_kg || 0} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>KG</span>
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>({metrics?.feed?.karung_count} Karung)</span>
              <span className={`badge ${metrics?.feed?.is_low ? 'badge-danger' : 'badge-success'}`}>
                ± {metrics?.feed?.est_days_remaining} Hari
              </span>
            </div>
          </div>
        </div>

        {/* Card 5: Untung Bersih Bulan Ini */}
        <div className="glass-card" style={{ borderLeft: '4px solid #10b981', gridColumn: 'span 1' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>UNTUNG BERSIH (BULAN INI)</span>
          <div style={{ marginTop: '0.5rem' }}>
            <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: (metrics?.finance?.month_net_profit || 0) >= 0 ? '#34d399' : '#f87171', letterSpacing: '-0.02em' }}>
              Rp {(metrics?.finance?.month_net_profit || 0).toLocaleString('id-ID')}
            </h3>
            
            {/* Side-by-Side Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.65rem', background: '#0f172a', padding: '0.65rem 0.85rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#94a3b8' }}>Pemasukan Telur:</span>
                <span style={{ fontWeight: 700, color: '#34d399' }}>Rp {(metrics?.finance?.egg_sales_income || 0).toLocaleString('id-ID')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#94a3b8' }}>Biaya Pakan:</span>
                <span style={{ fontWeight: 700, color: '#f87171' }}>Rp {(metrics?.finance?.feed_expense_month || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Production Chart Section */}
      <div className="glass-card" style={{ marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>Grafik Perkembangan Produksi Telur (H-1)</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.15rem' }}>Perbandingan jumlah telur dan persentase produktivitas</p>
          </div>
          <button onClick={() => onNavigate('eggs')} className="btn btn-outline" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
            Lihat Tabel
          </button>
        </div>

        {chart_data && chart_data.length > 0 ? (
          <div style={{ width: '100%', height: 330 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart_data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="eggGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="prodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis yAxisId="left" stroke="#f59e0b" domain={[0, 'dataMax + 50']} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" unit="%" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.12)', borderRadius: 14, color: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                  formatter={(value, name) => [name === 'telur' ? `${value} Butir` : `${value}%`, name === 'telur' ? 'Jumlah Telur' : 'Produktivitas']}
                />
                <Area yAxisId="left" type="monotone" dataKey="telur" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#eggGradient)" />
                <Area yAxisId="right" type="monotone" dataKey="produktivitas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#prodGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#cbd5e1' }}>Belum ada data produksi telur</div>
            <p style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>Klik tombol "+ Input Telur H-1" di atas untuk mulai mencatat hasil panen harian.</p>
          </div>
        )}
      </div>

    </div>
  );
}
