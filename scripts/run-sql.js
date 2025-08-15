const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function runSqlFile() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const sqlContent = fs.readFileSync(path.join(__dirname, '06-add-otp-table.sql'), 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...');
        await sql`${statement}`;
      }
    }
    
    console.log('✅ OTP table created successfully!');
  } catch (error) {
    console.error('❌ Error creating OTP table:', error);
  }
}

runSqlFile();
