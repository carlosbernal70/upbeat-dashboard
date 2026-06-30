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
    const purchaseUpbeat = await pool.query(`SELECT DISTINCT tags FROM purchase WHERE tags ILIKE '%upbeat%' LIMIT 20`);
    const invoiceUpbeat = await pool.query(`SELECT DISTINCT tags FROM invoice WHERE tags ILIKE '%upbeat%' LIMIT 20`);
    const hedgeFundCount = await pool.query(`SELECT COUNT(*) FROM killshot_historical`);
    const hedgeFundUpbeat = await pool.query(`SELECT DISTINCT hedge_fund FROM killshot_historical WHERE hedge_fund ILIKE '%upbeat%' LIMIT 20`);
    const accountUpbeat = await pool.query(`SELECT DISTINCT account FROM account_inventory_future_events_eventdate WHERE account ILIKE '%upbeat%' LIMIT 20`);
    const pricerTeams = await pool.query(`SELECT DISTINCT inv_mgmt_team, pricing_team FROM pricer_dim WHERE inv_mgmt_team ILIKE '%upbeat%' OR pricing_team ILIKE '%upbeat%' LIMIT 20`);
    return Response.json({
      purchaseUpbeat: purchaseUpbeat.rows,
      invoiceUpbeat: invoiceUpbeat.rows,
      hedgeFundTableRowCount: hedgeFundCount.rows,
      hedgeFundUpbeat: hedgeFundUpbeat.rows,
      accountUpbeat: accountUpbeat.rows,
      pricerTeams: pricerTeams.rows,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
