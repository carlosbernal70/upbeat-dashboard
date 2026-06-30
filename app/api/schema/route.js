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
  const results = {};
  const tables = [
    ['marts_stg', 'upbeat_wh_purchase'],
    ['marts_stg', 'upbeat_wh_invoice'],
    ['marts_stg', 'upbeat_wh_invoice_line'],
    ['marts_stg', 'stg_lbs_upbeat_purchase'],
    ['marts_stg', 'stg_lbs_upbeat_sale'],
  ];
  for (const [schema, table] of tables) {
    try {
      const r = await pool.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position`,
        [schema, table]
      );
      results[`${schema}.${table}`] = r.rows;
    } catch (err) {
      results[`${schema}.${table}`] = { error: err.message };
    }
  }
  // also get a sample row from the two most promising ones
  try {
    const r = await pool.query(`SELECT * FROM marts_stg.upbeat_wh_purchase LIMIT 1`);
    results['sample_purchase'] = r.rows;
  } catch(err) { results['sample_purchase'] = { error: err.message }; }
  try {
    const r = await pool.query(`SELECT * FROM marts_stg.upbeat_wh_invoice LIMIT 1`);
    results['sample_invoice'] = r.rows;
  } catch(err) { results['sample_invoice'] = { error: err.message }; }
  return Response.json(results);
}
