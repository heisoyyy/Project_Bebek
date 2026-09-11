import React, { useEffect, useState } from 'react';
import { reportsApi } from '../services/api';

export default function ReportsView() {
  const [activeTab, setActiveTab] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const [monthlyData, setMonthlyData] = useState(null);
  const [yearlyData, setYearlyData] = useState(null);
  const [loading, setLoading] = useState(true);

  const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' }
  ];

  const fetchReports = async () => {
    try {
      setLoading(true);
      if (activeTab === 'monthly') {
        const res = await reportsApi.getMonthly({ year: selectedYear, month: selectedMonth });
        if (res.data.success) setMonthlyData(res.data);
      } else {
        const res = await reportsApi.getYearly({ year: selectedYear });
        if (res.data.success) setYearlyData(res.data);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab, selectedYear, selectedMonth]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>Rekap & Laporan Periodik</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Rangkuman laporan operasional harian, bulanan, dan tahunan untuk pemilik kandang</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={handlePrint} className="btn btn-outline">
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Tab Selectors & Filter Bar */}
      <div className="glass-card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setActiveTab('monthly')} className={`btn ${activeTab === 'monthly' ? 'btn-primary' : 'btn-outline'}`}>
              Rekap Bulanan
            </button>
            <button onClick={() => setActiveTab('yearly')} className={`btn ${activeTab === 'yearly' ? 'btn-primary' : 'btn-outline'}`}>
              Rekap Tahunan
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {activeTab === 'monthly' && (
              <select className="form-select" style={{ width: 'auto' }} value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            )}
            <select className="form-select" style={{ width: 'auto' }} value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* MONTHLY RECAP VIEW */}
      {activeTab === 'monthly' && monthlyData && (
        <>
          {/* Summary Metric Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-card">
              <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL TELUR DIPRODUKSI</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.5rem' }}>
                {monthlyData.summary?.formatted_total_eggs}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                ({monthlyData.summary?.total_good_eggs} utuh, {monthlyData.summary?.total_cracked_eggs} retak)
              </p>
            </div>

            <div className="glass-card">
              <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>RATA-RATA PRODUKTIVITAS</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginTop: '0.5rem' }}>
                {monthlyData.summary?.avg_productivity}%
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                {monthlyData.summary?.days_recorded} hari dicatat bulan ini
              </p>
            </div>

            <div className="glass-card">
              <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL PAKAN TERPAKAI</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#8b5cf6', marginTop: '0.5rem' }}>
                {monthlyData.summary?.total_feed_kg} KG
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                (± {monthlyData.summary?.total_feed_karung} Karung)
              </p>
            </div>

            <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>KEUNTUNGAN BERSIH</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginTop: '0.5rem' }}>
                Rp {(monthlyData.summary?.net_profit || 0).toLocaleString('id-ID')}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Pemasukan: Rp {(monthlyData.summary?.total_income || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Daily Table List */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>
              Rincian Harian Bulan {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>TANGGAL (H-1)</th>
                    <th>TELUR UTUH</th>
                    <th>TELUR RETAK</th>
                    <th>TOTAL TELUR</th>
                    <th>PRODUKTIVITAS</th>
                    <th>CATATAN</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.daily_list.length > 0 ? (
                    monthlyData.daily_list.map((d) => (
                      <tr key={d.id}>
                        <td>{new Date(d.production_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
                        <td>{d.good_eggs} butir</td>
                        <td style={{ color: d.cracked_eggs > 0 ? '#f87171' : '#94a3b8' }}>{d.cracked_eggs} butir</td>
                        <td style={{ fontWeight: 700, color: '#fbbf24' }}>
                          {d.total_eggs} butir <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>({d.formatted_total})</span>
                        </td>
                        <td>
                          <span className={`badge ${parseFloat(d.productivity_pct) >= 75 ? 'badge-success' : 'badge-warning'}`}>
                            {d.productivity_pct}%
                          </span>
                        </td>
                        <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{d.notes || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8' }}>Tidak ada data pada bulan ini.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* YEARLY RECAP VIEW */}
      {activeTab === 'yearly' && yearlyData && (
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>
            Rangkuman Perbandingan Bulanan Tahun {selectedYear}
          </h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>BULAN</th>
                  <th>TOTAL PRODUKSI TELUR</th>
                  <th>AVG PRODUKTIVITAS</th>
                  <th>TOTAL PAKAN (KG)</th>
                  <th>PEMASUKAN (RP)</th>
                  <th>PENGELUARAN (RP)</th>
                  <th>KEUNTUNGAN BERSIH</th>
                </tr>
              </thead>
              <tbody>
                {yearlyData.monthly_breakdown.length > 0 ? (
                  yearlyData.monthly_breakdown.map((m) => (
                    <tr key={m.month}>
                      <td style={{ fontWeight: 700, color: 'white' }}>{m.month_name}</td>
                      <td style={{ fontWeight: 700, color: '#fbbf24' }}>{m.formatted_eggs}</td>
                      <td>
                        <span className="badge badge-success">{m.avg_productivity}%</span>
                      </td>
                      <td>{m.total_feed_kg} KG</td>
                      <td style={{ color: '#34d399' }}>Rp {m.income.toLocaleString('id-ID')}</td>
                      <td style={{ color: '#f87171' }}>Rp {m.expense.toLocaleString('id-ID')}</td>
                      <td style={{ fontWeight: 700, color: m.net_profit >= 0 ? '#34d399' : '#f87171' }}>
                        Rp {m.net_profit.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8' }}>Belum ada data di tahun ini.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
