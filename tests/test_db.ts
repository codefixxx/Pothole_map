import { Client } from 'pg';

async function testUri(uri: string, name: string) {
  console.log(`Testing ${name}...`);
  const client = new Client({
    connectionString: uri
  });
  try {
    await client.connect();
    console.log(`Connected to ${name}`);
    const res = await client.query('SELECT postgis_version();');
    console.log(`${name} PostGIS Version:`, res.rows[0]);
    await client.end();
    return true;
  } catch (err: any) {
    console.error(`Failed to connect to ${name}:`, err.message);
    try { await client.end(); } catch {}
    return false;
  }
}

async function main() {
  const uri1 = "postgresql://postgres.xhgkejifgvkrjydyaiau:EYPuA7JaSmXIM5KG@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
  const uri2 = "postgresql://postgres.xhgkejifgvkrjydyaiau:EYPuA7JaSmXIM5KG@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres";
  
  await testUri(uri1, "Pooler (6543)");
  await testUri(uri2, "Direct (5432)");
}

main().catch(console.error);
