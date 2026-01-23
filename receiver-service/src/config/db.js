const pgp = require('pg-promise')();
const db = pgp(process.env.DATABASE_URL);

const initDb = async () => {
  const schema = `
    -- 1. Users Table (Must be created first)
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      customer_id VARCHAR(64) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 2. Receivers Table
    CREATE TABLE IF NOT EXISTS receivers (
      receiver_id VARCHAR(32) PRIMARY KEY,
      customer_id VARCHAR(64) NOT NULL REFERENCES users(customer_id), 
      name VARCHAR(200) NOT NULL,
      ifsc VARCHAR(11) NOT NULL,
      account_number_enc TEXT NOT NULL,
      account_last4 CHAR(4) NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('PENDING_OTP_VERIFICATION', 'VERIFIED')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      dedupe_hash CHAR(64) NOT NULL UNIQUE
    );

    -- 3. OTP Requests Table
    CREATE TABLE IF NOT EXISTS otp_requests (
      otp_request_id VARCHAR(32) PRIMARY KEY,
      receiver_id VARCHAR(32) REFERENCES receivers(receiver_id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      otp_code VARCHAR(6),
      expires_at TIMESTAMPTZ NOT NULL,
      one_time_use BOOLEAN DEFAULT TRUE
    );
  `;

  try {
    await db.none(schema);
    const testEmail = 'test@example.com';
    const existingUser = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [testEmail]);

    if (!existingUser) {
      console.log("🌱 Seeding initial admin user...");
      const hashedPassword = await bcrypt.hash('password123', 10);
      const customerId = `cust_${crypto.randomBytes(3).toString('hex')}`;
      
      await db.none(
        'INSERT INTO users(username, email, password_hash, customer_id) VALUES($1, $2, $3, $4)',
        ['AdminUser', testEmail, hashedPassword, customerId]
      );
      console.log(`✅ Seed user created: ${testEmail} / password123`);
    }
    
    console.log("✅ Database Schema Initialized Successfully");
  } catch (error) {
    console.error("❌ Database Initialization Error:", error);
    throw error;
  }
};

initDb().catch(console.error);

module.exports = db;