const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'foodshare_okc',
  user: process.env.USER, // Uses your system username automatically
  // No password needed for local macOS connections (uses Unix socket)
});

async function runMigration() {
  try {
    console.log('📂 Reading migration file...');
    const sql = fs.readFileSync(
      path.join(__dirname, '001_create_transactions.sql'),
      'utf8'
    );
    
    console.log('🔄 Running migration...');
    await pool.query(sql);
    console.log('✅ Transactions table created successfully');
    
    // Verify
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transactions'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Created columns:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

