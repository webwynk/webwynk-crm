const { Client } = require('pg');

async function checkConnection(url, name) {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log(`✅ Success connecting to ${name}`);
    await client.end();
  } catch (err) {
    console.log(`❌ Failed connecting to ${name}:`, err.message);
  }
}

async function main() {
  const dbUrl = "postgresql://postgres.tktixhrjtltuhvbhuvoo:133223CrMWB@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require";
  const directUrl = "postgresql://postgres.tktixhrjtltuhvbhuvoo:133223CrMWB@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require";
  
  await checkConnection(dbUrl, "Transaction Pooler (6543)");
  await checkConnection(directUrl, "Session Pooler (5432)");
}

main();
