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
    ['invoiceCustomer', `SELECT DISTINCT customer FROM invoice WHERE customer ILIKE '%upbeat%' LIMIT 20`],
    ['invoiceNotes', `SELECT DISTINCT notes FROM invoice WHERE notes ILIKE '%upbeat%' LIMIT 20`],
    ['purchaseNotes', `SELECT DISTINCT notes FROM purchase WHERE notes ILIKE '%upbeat%' LIMIT 20`],
    ['purchaseExternalRef', `SELECT DISTINCT external_reference FROM purchase WHERE external_reference ILIKE '%upbeat%' LIMIT 20`],
    ['invoiceExternalRef', `SELECT DISTINCT external_reference FROM invoice WHERE external_reference ILIKE '%upbeat%' LIMIT 20`],
    ['eventTags', `SELECT DISTINCT tags FROM event WHERE tags ILIKE '%upbeat%' LIMIT 20`],
    ['listingNotes', `SELECT DISTINCT internal_notes FROM listing WHERE internal_notes ILIKE '%upbeat%' LIMIT 20`],
    ['killshotPricerTag', `SELECT DISTINCT pricer_tag FROM killshot_historical WHERE pricer_tag ILIKE '%upbeat%' LIMIT 20`],
    ['killshotListingTags', `SELECT DISTINCT listing_tags FROM killshot_historical WHERE listing_tags ILIKE '%upbeat%' LIMIT 20`],
    ['allInvoiceCustomers', `SELECT DISTINCT customer FROM invoice LIMIT 100`],
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
