'use client';
import { useEffect, useState } from 'react';
import styles from './page.module.css';

function fmt(value) {
  if (value === null || value === undefined) return '—';
  return '$' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtPct(value) {
  if (value === null || value === undefined) return '—';
  return Number(value).toFixed(2) + '%';
}

function fmtQty(value) {
  if (value === null || value === undefined) return '—';
  return Number(value).toLocaleString('en-US');
}

function Row({ label, value }) {
  return (
    <tr>
      <td className={styles.label}>{label}</td>
      <td className={styles.value}>{value}</td>
    </tr>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/report');
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);
    } catch (e) {
      setError('Could not load data. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.title}>Upbeat</h1>
        <button className={styles.refresh} onClick={fetchData} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      {lastUpdated && <p className={styles.updated}>Last updated: {lastUpdated}</p>}
      {error && <p className={styles.error}>{error}</p>}
      {data && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Activity</th>
              <th className={styles.th}>Upbeat</th>
            </tr>
          </thead>
          <tbody>
            <Row label="Previous Day Purchases" value={fmt(data.prevDayPurchases)} />
            <Row label="MTD Purchases" value={fmt(data.mtdPurchases)} />
            <Row label="YTD Purchases" value={fmt(data.ytdPurchases)} />
            <Row label="Quantity Tickets Purchased" value={fmtQty(data.qtyTicketsPurchased)} />
            <Row label="Previous Day Sales" value={fmt(data.prevDaySales)} />
            <Row label="Previous Day Profit" value={fmt(data.prevDayProfit)} />
            <Row label="Previous Day Profit %" value={fmtPct(data.prevDayProfitPct)} />
            <Row label="MTD Sales" value={fmt(data.mtdSales)} />
            <Row label="MTD Profit" value={fmt(data.mtdProfit)} />
            <Row label="MTD Profit %" value={fmtPct(data.mtdProfitPct)} />
            <Row label="YTD Sales" value={fmt(data.ytdSales)} />
            <Row label="YTD Profit" value={fmt(data.ytdProfit)} />
            <Row label="YTD Profit %" value={fmtPct(data.ytdProfitPct)} />
            <Row label="Quantity Tickets Sold" value={fmtQty(data.qtyTicketsSold)} />
          </tbody>
        </table>
      )}
    </main>
  );
}
