import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.REDSHIFT_HOST,
  port: parseInt(process.env.REDSHIFT_PORT || '5439'),
  database: process.env.REDSHIFT_DATABASE,
  user: process.env.REDSHIFT_USER,
  password: process.env.REDSHIFT_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        SUM(CASE WHEN date = CURRENT_DATE - 1 THEN purchase_amount ELSE 0 END) AS prev_day_purchases,
        SUM(CASE WHEN date >= DATE_TRUNC('month', CURRENT_DATE) THEN purchase_amount ELSE 0 END) AS mtd_purchases,
        SUM(purchase_amount) AS ytd_purchases,
        SUM(CASE WHEN date >= DATE_TRUNC('month', CURRENT_DATE) THEN quantity_purchased ELSE 0 END) AS qty_tickets_purchased,

        SUM(CASE WHEN date = CURRENT_DATE - 1 THEN sale_amount ELSE 0 END) AS prev_day_sales,
        SUM(CASE WHEN date = CURRENT_DATE - 1 THEN profit ELSE 0 END) AS prev_day_profit,
        SUM(CASE WHEN date >= DATE_TRUNC('month', CURRENT_DATE) THEN sale_amount ELSE 0 END) AS mtd_sales,
        SUM(CASE WHEN date >= DATE_TRUNC('month', CURRENT_DATE) THEN profit ELSE 0 END) AS mtd_profit,
        SUM(sale_amount) AS ytd_sales,
        SUM(profit) AS ytd_profit,
        SUM(CASE WHEN date >= DATE_TRUNC('month', CURRENT_DATE) THEN quantity_sold ELSE 0 END) AS qty_tickets_sold
      FROM your_table_name
      WHERE date >= DATE_TRUNC('year', CURRENT_DATE)
    `);

    const r = result.rows[0];

    const prevDayProfit = parseFloat(r.prev_day_profit) || 0;
    const prevDaySales = parseFloat(r.prev_day_sales) || 0;
    const mtdProfit = parseFloat(r.mtd_profit) || 0;
    const mtdSales = parseFloat(r.mtd_sales) || 0;
    const ytdProfit = parseFloat(r.ytd_profit) || 0;
    const ytdSales = parseFloat(r.ytd_sales) || 0;

    return Response.json({
      prevDayPurchases: parseFloat(r.prev_day_purchases) || 0,
      mtdPurchases: parseFloat(r.mtd_purchases) || 0,
      ytdPurchases: parseFloat(r.ytd_purchases) || 0,
      qtyTicketsPurchased: parseInt(r.qty_tickets_purchased) || 0,
      prevDaySales,
      prevDayProfit,
      prevDayProfitPct: prevDaySales ? (prevDayProfit / prevDaySales) * 100 : 0,
      mtdSales,
      mtdProfit,
      mtdProfitPct: mtdSales ? (mtdProfit / mtdSales) * 100 : 0,
      ytdSales,
      ytdProfit,
      ytdProfitPct: ytdSales ? (ytdProfit / ytdSales) * 100 : 0,
      qtyTicketsSold: parseInt(r.qty_tickets_sold) || 0,
    });
  } catch (err) {
    console.error('Redshift query error:', err);
    return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
