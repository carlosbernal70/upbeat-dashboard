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
    ['marts_stg', 'upbeat_wh_inventory'],
    ['raw_lobsang', 'upbeat_purchase'],
    ['raw_lobsang', 'upbeat_sale'],
  ];
  for (const [schema, table] of tables) {
    try {
      const r = await pool.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position`,
        [schema, table]
      );
      results[`cols_${schema}.${table}`] = r.rows;
    } catch (err) {
      results[`cols_${schema}.${table}`] = { error: err.message };
    }
  }
  try {
    const r = await pool.query(`SELECT * FROM marts_stg.upbeat_wh_invoice_line LIMIT 2`);
    results['sample_invoice_line'] = r.rows;
  } catch(err) { results['sample_invoice_line'] = { error: err.message }; }
  try {
    const r = await pool.query(`SELECT * FROM marts_stg.upbeat_wh_inventory LIMIT 1`);
    results['sample_inventory'] = r.rows;
  } catch(err) { results['sample_inventory'] = { error: err.message }; }
  try {
    const r = await pool.query(`SELECT * FROM raw_lobsang.upbeat_purchase LIMIT 1`);
    results['sample_raw_purchase'] = r.rows;
  } catch(err) { results['sample_raw_purchase'] = { error: err.message }; }
  try {
    const r = await pool.query(`SELECT * FROM raw_lobsang.upbeat_sale LIMIT 1`);
    results['sample_raw_sale'] = r.rows;
  } catch(err) { results['sample_raw_sale'] = { error: err.message }; }
  return Response.json(results);
}
