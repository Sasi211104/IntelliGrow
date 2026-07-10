const { createClient } = require('@supabase/supabase-js');

if (!process.env.DATABASE_URL) {
    console.warn('Warning: DATABASE_URL is not set. Supabase client might fail.');
}

// Access Supabase functionality via the postgres connection string or direct client if using Supabase Auth/Storage
// For this project, we are using standard Postgres queries via 'pg' or Supabase JS client for storage/realtime if needed.
// This config initializes the Supabase JS client for potential Storage/Realtime usage.
// Note: using service role key is preferred on backend for admin access if bypassing RLS, 
// but for this "free" setup, we might rely on the public URL/Anon key if user didn't provide service key.
// However, the standard way to connect to Supabase DB from Node is often just 'pg'.
// Let's stick to 'supabase-js' for simplicity in Storage/Auth management if we need it,
// but for data, we'll try to use it as an ORM-lite or just use raw SQL via 'pg' if complex.
// For now, let's assume we use supabase-js for data operations for simplicity.

const supabaseUrl = process.env.SUPABASE_URL; // User might need to add this if they only added DATABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// If the user only provided DATABASE_URL (postgres connection string), we might use 'pg' instead.
// But the user prompt asked for Supabase. Let's assume standard Supabase setup.
// Wait, the user instructions said "Supabase (Postgres, Storage, Realtime)".
// So we definitely need the SB client.

// Let's try to infer or fallback.
// Actually, I'll use the 'pg' library for robust SQL interactions as per the schema, 
// but 'supabase-js' is easier for rapid prototyping. I'll support both conceptually.
// For the requested "Core APIs", I will use `supabase-js` as it is easier for "Get/Insert".

// Re-reading user instructions: "Supabase (Postgres, Storage, Realtime)"
// I'll assume they have SUPABASE_URL and SUPABASE_KEY in .env or I should ask for it.
// The .env.example I gave had DATABASE_URL (postgres setup). 
// I should probably switch to 'pg' to match the DATABASE_URL variable, OR update .env.example to ask for URL/KEY.
// The user confirmed "done" based on my previous .env.example which only had DATABASE_URL.
// So I will use 'pg' for the database interactions to be safe and consistent with what I asked.

const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL;
console.log(`db.js loaded. DATABASE_URL is ${dbUrl ? 'DEFINED' : 'UNDEFINED'}: ${dbUrl ? dbUrl.substring(0, 20) + '...' : ''}`);

const pool = new Pool({
    connectionString: dbUrl,
});

module.exports = { pool };
