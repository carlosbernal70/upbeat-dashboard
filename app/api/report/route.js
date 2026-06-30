import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.REDSHIFT_HOST,
  port: parseInt(process.env.REDSHIFT_PORT || '5439'),
  database: process.env.REDSHIFT_DATABASE,
  user: process.env.REDSHIFT_USER,
  password: process.env.REDSHIFT_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const asOf = searchParams.get('asOf'); // YYYY-MM-DD

  // Default to today if no date provided
  const asOfDate = asOf ? new Date(asOf) : new Date();
  const asOfStr = asOfDate.toISOString().split('T')[0];

  try {
    const result = await pool.query(`
      WITH
      prev_day_purchases AS (
        SELECT
          COALESCE(SUM(total_amount), 0) AS amount,
          COALESCE(SUM(quantity), 0)     AS qty
        FROM raw_lobsang.upbeat_purchase
        WHERE cancelled = 0
          AND DATE(purchase_datetime) = DATE($1) - INTERVAL '1 day'
      ),
      mtd_purchases AS (
        SELECT
          COALESCE(SUM(total_amount), 0) AS amount,
          COALESCE(SUM(quantity), 0)     AS qty
        FROM raw_lobsang.upbeat_purchase
        WHERE cancelled = 0
          AND DATE_TRUNC('month', DATE(purchase_datetime)) = DATE_TRUNC('month', DATE($1))
          AND DATE(purchase_datetime) < DATE($1)
      ),
      ytd_purchases AS (
        SELECT
          COALESCE(SUM(total_amount), 0) AS amount,
          COALESCE(SUM(quantity), 0)     AS qty
        FROM raw_lobsang.upbeat_purchase
        WHERE cancelled = 0
          AND DATE_TRUNC('year', DATE(purchase_datetime)) = DATE_TRUNC('year', DATE($1))
          AND DATE(purchase_datetime) < DATE($1)
      ),
      prev_day_sales AS (
        SELECT
          COALESCE(SUM(total_amount), 0) AS amount,
          COALESCE(SUM(profit), 0)       AS profit,
          COALESCE(SUM(quantity), 0)     AS qty
        FROM raw_lobsang.upbeat_sale
        WHERE cancelled = 0
          AND DATE(invoice_datetime) = DATE($1) - INTERVAL '1 day'
      ),
      mtd_sales AS (
        SELECT
          COALESCE(SUM(total_amount), 0) AS amount,
          COALESCE(SUM(profit), 0)       AS profit,
          COALESCE(SUM(quantity), 0)     AS qty
        FROM raw_lobsang.upbeat_sale
        WHERE cancelled = 0
          AND DATE_TRUNC('month', DATE(invoice_datetime)) = DATE_TRUNC('month', DATE($1))
          AND DATE(invoice_datetime) < DATE($1)
      ),
      ytd_sales AS (
        SELECT
          COALESCE(SUM(total_amount), 0) AS amount,
          COALESCE(SUM(profit), 0)       AS profit,
          COALESCE(SUM(quantity), 0)     AS qty
        FROM raw_lobsang.upbeat_sale
        WHERE cancelled = 0
          AND DATE_TRUNC('year', DATE(invoice_datetime)) = DATE_TRUNC('year', DATE($1))
          AND DATE(invoice_datetime) < DATE($1)
      )
      SELECT
        pp.amount  AS prev_day_purchases,
        pp.qty     AS prev_day_qty_purchased,
        mp.amount  AS mtd_purchases,
        mp.qty     AS mtd_qty_purchased,
        yp.amount  AS ytd_purchases,
        yp.qty     AS ytd_qty_purchased,
        ps.amount  AS prev_day_sales,
        ps.profit  AS prev_day_profit,
        ps.qty     AS prev_day_qty_sold,
        ms.amount  AS mtd_sales,
        ms.profit  AS mtd_profit,
        ms.qty     AS mtd_qty_sold,
        ys.amount  AS ytd_sales,
        ys.profit  AS ytd_profit,
        ys.qty     AS ytd_qty_sold
      FROM prev_day_purchases pp
      CROSS JOIN mtd_purchases mp
      CROSS JOIN ytd_purchases yp
      CROSS JOIN prev_day_sales ps
      CROSS JOIN mtd_sales ms
      CROSS JOIN ytd_sales ys
    `, [asOfStr]);

    const r = result.rows[0];

    const prevDaySales   = parseFloat(r.prev_day_sales)  || 0;
    const prevDayProfit  = parseFloat(r.prev_day_profit) || 0;
    const mtdSales       = parseFloat(r.mtd_sales)       || 0;
    const mtdProfit      = parseFloat(r.mtd_profit)      || 0;
    const ytdSales       = parseFloat(r.ytd_sales)       || 0;
    const ytdProfit      = parseFloat(r.ytd_profit)      || 0;

    return Response.json({
      asOf: asOfStr,
      prevDayPurchases:     parseFloat(r.prev_day_purchases)   || 0,
      mtdPurchases:         parseFloat(r.mtd_purchases)        || 0,
      ytdPurchases:         parseFloat(r.ytd_purchases)        || 0,
      qtyTicketsPurchased:  parseInt(r.ytd_qty_purchased)      || 0,
      prevDaySales,
      prevDayProfit,
      prevDayProfitPct:     prevDaySales ? (prevDayProfit / prevDaySales) * 100 : 0,
      mtdSales,
      mtdProfit,
      mtdProfitPct:         mtdSales ? (mtdProfit / mtdSales) * 100 : 0,
      ytdSales,
      ytdProfit,
      ytdProfitPct:         ytdSales ? (ytdProfit / ytdSales) * 100 : 0,
      qtyTicketsSold:       parseInt(r.ytd_qty_sold)           || 0,
    });
  } catch (err) {
    console.error('Redshift query error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
