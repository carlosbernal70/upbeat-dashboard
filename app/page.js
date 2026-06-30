'use client';
import { useEffect, useState } from 'react';
import styles from './page.module.css';

function fmt(value) {
  if (value === null || value === undefined) return '—';
  const n = Number(value);
  const formatted = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return n < 0 ? `$(${formatted})` : `$${formatted}`;
}

function fmtPct(value) {
  if (value === null || value === undefined) return '—';
  return Number(value).toFixed(2) + '%';
}

function fmtQty(value) {
  if (value === null || value === undefined) return '—';
  return Number(value).toLocaleString('en-US');
}

function today() {
  return new Date().toISOString().split('T')[0];
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
  const [asOf, setAsOf] = useState(today());
  const [lastUpdated, setLastUpdated] = useState(null);

  async function fetchData(date) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/report?asOf=${date}`);
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      setError(e.message || 'Could not load data. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(asOf); }, []);

  function handleDateChange(e) {
    setAsOf(e.target.value);
  }

  function handleApply() {
    fetchData(asOf);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') fetchData(asOf);
  }

  const prevDayLabel = asOf
    ? `Previous Day (${new Date(asOf + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
    : 'Previous Day';

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.title}>Upbeat</h1>
        <div className={styles.controls}>
          <label className={styles.dateLabel}>As of:</label>
          <input
            type="date"
            className={styles.datePicker}
            value={asOf}
            onChange={handleDateChange}
            onKeyDown={handleKeyDown}
          />
          <button className={styles.applyBtn} onClick={handleApply} disabled={loading}>
            {loading ? 'Loading...' : 'Apply'}
          </button>
          <button className={styles.refresh} onClick={() => fetchData(asOf)} disabled={loading}>
            Refresh
          </button>
        </div>
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
            <Row label="Previous Day Purchases"       value={fmt(data.prevDayPurchases)} />
            <Row label="MTD Purchases"                value={fmt(data.mtdPurchases)} />
            <Row label="YTD Purchases"                value={fmt(data.ytdPurchases)} />
            <Row label="Quantity Tickets Purchased"   value={fmtQty(data.qtyTicketsPurchased)} />
            <Row label="Previous Day Sales"           value={fmt(data.prevDaySales)} />
            <Row label="Previous Day Profit"          value={fmt(data.prevDayProfit)} />
            <Row label="Previous Day Profit %"        value={fmtPct(data.prevDayProfitPct)} />
            <Row label="MTD Sales"                    value={fmt(data.mtdSales)} />
            <Row label="MTD Profit"                   value={fmt(data.mtdProfit)} />
            <Row label="MTD Profit %"                 value={fmtPct(data.mtdProfitPct)} />
            <Row label="YTD Sales"                    value={fmt(data.ytdSales)} />
            <Row label="YTD Profit"                   value={fmt(data.ytdProfit)} />
            <Row label="YTD Profit %"                 value={fmtPct(data.ytdProfitPct)} />
            <Row label="Quantity Tickets Sold"        value={fmtQty(data.qtyTicketsSold)} />
          </tbody>
        </table>
      )}
    </main>
  );
}
