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
    const hedgeFunds = await pool.query(`SELECT DISTINCT hedge_fund FROM killshot_historical LIMIT 50`);
    const purchaseTags = await pool.query(`SELECT DISTINCT tags FROM purchase LIMIT 50`);
    const invoiceTags = await pool.query(`SELECT DISTINCT tags FROM invoice LIMIT 50`);
    return Response.json({
      hedgeFunds: hedgeFunds.rows,
      purchaseTags: purchaseTags.rows,
      invoiceTags: invoiceTags.rows,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
