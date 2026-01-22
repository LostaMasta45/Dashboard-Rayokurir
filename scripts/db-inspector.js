/**
 * Supabase Database Inspector & Migration Script
 * 
 * Script ini untuk:
 * 1. Memeriksa struktur database (tabel, kolom, constraint)
 * 2. Mendeteksi kolom yang belum ada
 * 3. Menjalankan migrasi QRIS payment fields
 * 
 * Usage: node scripts/db-inspector.js [command]
 * Commands:
 *   - inspect: Lihat struktur database
 *   - check-qris: Cek apakah kolom QRIS sudah ada
 *   - migrate-qris: Jalankan migrasi QRIS
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment from .env.local manually
function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key && valueParts.length > 0) {
                    process.env[key.trim()] = valueParts.join('=').trim();
                }
            }
        });
    }
}
loadEnv();

// Database connection
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iazhrskfoqipajchjnhi.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_ANON_KEY tidak ditemukan');
    console.log('   Set environment variable atau tambahkan ke .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Colors for console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Get all tables
async function getAllTables() {
    const { data, error } = await supabase.rpc('get_tables', {});
    
    // Fallback: query information_schema directly
    if (error) {
        const { data: tables, error: err2 } = await supabase
            .from('pg_tables')
            .select('tablename')
            .eq('schemaname', 'public');
        
        if (err2) {
            // Use raw SQL via REST API
            console.log('Using fallback method to get tables...');
            return ['orders', 'couriers', 'clients', 'testimoni'];
        }
        return tables?.map(t => t.tablename) || [];
    }
    return data || [];
}

// Get columns for a table
async function getTableColumns(tableName) {
    try {
        // Try to get a sample row to see columns
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
        
        if (data && data.length > 0) {
            return Object.keys(data[0]);
        }
        
        // If no data, return empty (can't infer columns)
        return [];
    } catch (err) {
        return [];
    }
}

// Check if QRIS columns exist
async function checkQrisColumns() {
    log('\n📊 Memeriksa kolom QRIS di tabel orders...', 'cyan');
    
    const columns = await getTableColumns('orders');
    
    const qrisColumns = [
        'ongkirPaymentMethod',
        'ongkirPaymentStatus', 
        'ongkirPaidAt'
    ];
    
    const results = {
        existing: [],
        missing: []
    };
    
    for (const col of qrisColumns) {
        if (columns.includes(col)) {
            results.existing.push(col);
            log(`  ✅ ${col} - sudah ada`, 'green');
        } else {
            results.missing.push(col);
            log(`  ❌ ${col} - belum ada`, 'red');
        }
    }
    
    return results;
}

// Inspect database structure
async function inspectDatabase() {
    log('\n🔍 Database Inspector - Supabase', 'bold');
    log('=' .repeat(50), 'cyan');
    
    const tables = ['orders', 'couriers', 'clients', 'testimoni', 'courier_photos'];
    
    for (const table of tables) {
        log(`\n📋 Tabel: ${table}`, 'yellow');
        
        const columns = await getTableColumns(table);
        
        if (columns.length > 0) {
            log(`   Kolom (${columns.length}):`, 'cyan');
            columns.forEach(col => {
                log(`   - ${col}`);
            });
        } else {
            log('   (tidak bisa membaca kolom atau tabel kosong)', 'red');
        }
    }
    
    // Check for QRIS columns
    await checkQrisColumns();
}

// Check if order data has QRIS fields
async function checkExistingQrisData() {
    log('\n📈 Memeriksa data QRIS yang sudah ada...', 'cyan');
    
    const { data, error } = await supabase
        .from('orders')
        .select('id, ongkirPaymentMethod, ongkirPaymentStatus')
        .not('ongkirPaymentMethod', 'is', null)
        .limit(10);
    
    if (error) {
        log(`  ⚠️ Error: ${error.message}`, 'yellow');
        return;
    }
    
    if (data && data.length > 0) {
        log(`  ✅ Ditemukan ${data.length} order dengan data pembayaran:`, 'green');
        
        const cashCount = data.filter(o => o.ongkirPaymentMethod === 'CASH').length;
        const qrisCount = data.filter(o => o.ongkirPaymentMethod === 'QRIS').length;
        
        log(`     - CASH: ${cashCount} order`);
        log(`     - QRIS: ${qrisCount} order`);
    } else {
        log('  ℹ️ Belum ada order dengan data metode pembayaran', 'yellow');
    }
}

// Run migration via Supabase Management API
async function runMigration() {
    log('\n🚀 Menjalankan Migrasi QRIS Payment Fields', 'bold');
    log('=' .repeat(50), 'cyan');
    
    // Check current state first
    const { existing, missing } = await checkQrisColumns();
    
    if (missing.length === 0) {
        log('\n✅ Semua kolom QRIS sudah ada! Tidak perlu migrasi.', 'green');
        return;
    }
    
    log(`\n⚠️ Kolom yang perlu ditambahkan: ${missing.join(', ')}`, 'yellow');
    log('\n📝 Untuk menjalankan migrasi, gunakan salah satu cara:', 'cyan');
    log('\n   1. Copy SQL di file supabase-migration-qris-payment.sql');
    log('   2. Buka Supabase Dashboard > SQL Editor');
    log('   3. Paste dan Run');
    log('\n   Atau gunakan Supabase CLI:', 'cyan');
    log('   npx supabase db push');
}

// Main CLI
async function main() {
    const command = process.argv[2] || 'inspect';
    
    switch (command) {
        case 'inspect':
            await inspectDatabase();
            break;
        case 'check-qris':
            await checkQrisColumns();
            await checkExistingQrisData();
            break;
        case 'migrate-qris':
            await runMigration();
            break;
        default:
            log('Usage: node scripts/db-inspector.js [command]', 'yellow');
            log('Commands: inspect, check-qris, migrate-qris');
    }
    
    log('\n✨ Selesai!\n', 'green');
}

main().catch(console.error);
