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
  const checks = [
    ['schemas', `SELECT DISTINCT table_schema FROM information_schema.tables ORDER BY table_schema`],
    ['tablesWithUpbeat', `SELECT table_schema, table_name FROM information_schema.tables WHERE table_name ILIKE '%upbeat%' ORDER BY table_schema, table_name`],
    ['columnsWithUpbeat', `SELECT table_schema, table_name, column_name FROM information_schema.columns WHERE column_name ILIKE '%upbeat%' ORDER BY table_schema, table_name`],
  ];
  for (const [key, sql] of checks) {
    try {
      const r = await pool.query(sql);
      results[key] = r.rows;
    } catch (err) {
      results[key] = { error: err.message };
    }
  }
  return Response.json(results);
}
