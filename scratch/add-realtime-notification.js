process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

async function main() {
  const directUrl = "postgresql://postgres.tktixhrjtltuhvbhuvoo:133223CrMWB@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require";
  const client = new Client({ 
    connectionString: directUrl
  });
  
  try {
    await client.connect();
    
    console.log("Adding Notification table to supabase_realtime publication...");
    await client.query(`
      ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";
    `);
    console.log("✅ Successfully added Notification table to supabase_realtime publication.");
    
    // Verify
    const res = await client.query(`
      SELECT schemaname, tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime';
    `);
    console.log("Updated publication tables:");
    console.log(res.rows);
    
    await client.end();
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
