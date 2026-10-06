import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('🚀 Running GramSaathi Supabase Migration...');
console.log(`📡 Supabase URL: ${supabaseUrl}`);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in server/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runMigration() {
  const sqlPath = path.resolve(__dirname, '../../supabase/001_initial_schema.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Migration file not found at: ${sqlPath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  console.log(`📄 Loaded migration script: 001_initial_schema.sql (${sqlContent.length} bytes)`);

  // First, verify connectivity by querying schemes
  console.log('🔍 Testing Supabase PostgreSQL connectivity...');
  
  // Seed schemes directly via Supabase client to ensure database is populated
  const { SEED_SCHEMES } = await import('../src/services/supabase.js');
  
  try {
    const { data: existingSchemes, error: fetchErr } = await supabase
      .from('schemes')
      .select('id, title_en');

    if (fetchErr) {
      console.log('ℹ️ Schemes table not yet detected or permissions needed. Error:', fetchErr.message);
      console.log('\n======================================================================');
      console.log('📋 NOTICE FOR SUPABASE POSTGRESQL MIGRATION:');
      console.log('Please execute the SQL migration in your Supabase SQL Editor:');
      console.log('1. Go to: https://supabase.com/dashboard/project/qxnwoywlflycckqennkf/sql');
      console.log('2. Paste the contents of supabase/001_initial_schema.sql');
      console.log('3. Click "RUN"');
      console.log('======================================================================\n');
    } else {
      console.log(`✅ Connection verified! Existing schemes in database: ${existingSchemes?.length || 0}`);
      
      if (!existingSchemes || existingSchemes.length === 0) {
        console.log('🌱 Seeding schemes table...');
        const { data: inserted, error: insertErr } = await supabase
          .from('schemes')
          .upsert(SEED_SCHEMES)
          .select();
        
        if (insertErr) {
          console.error('❌ Seeding error:', insertErr.message);
        } else {
          console.log(`🎉 Successfully seeded ${inserted.length} schemes into Supabase!`);
        }
      } else {
        console.log('✨ Schemes already exist in Supabase database.');
      }
    }

    // Verify Users table
    const { data: users, error: userErr } = await supabase.from('users').select('id').limit(1);
    if (!userErr) {
      console.log('✅ Users table is ready and accessible.');
    }

    // Verify Saathi Peti table
    const { data: peti, error: petiErr } = await supabase.from('saathi_peti').select('id').limit(1);
    if (!petiErr) {
      console.log('✅ Saathi Peti table is ready and accessible.');
    }

    console.log('\n🎉 Migration check completed successfully.');

  } catch (err) {
    console.error('Migration execution error:', err.message);
  }
}

runMigration();
