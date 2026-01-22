/**
 * Supabase Admin Script - Full Database Management
 * 
 * Script ini untuk operasi admin Supabase:
 * - Menjalankan SQL migrations (CREATE TABLE, ALTER, dll)
 * - Membuat bucket storage
 * - Mengatur RLS policies
 * - Inspeksi database
 * 
 * Usage: node scripts/supabase-admin.js [command]
 * Commands:
 *   - inspect       : Lihat struktur database
 *   - run-sql       : Jalankan file SQL (DDL supported!)
 *   - create-bucket : Buat bucket storage
 *   - list-buckets  : List semua buckets
 *   - migrate-qris  : Jalankan migrasi QRIS
 *   - tables        : List semua tabel
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

// Load environment from .env.local
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

// Database connection with Service Role Key
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || 'BismillahSukses100%';

// Extract project ref from URL (e.g., iazhrskfoqipajchjnhi)
const PROJECT_REF = SUPABASE_URL ? SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] : null;

// PostgreSQL connection string - Direct Connection format
// Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
const PG_CONNECTION_STRING = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${PROJECT_REF}.supabase.co:5432/postgres`;

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local');
    process.exit(1);
}

// Admin client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

// Colors for console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// ============================================
// DATABASE INSPECTION
// ============================================

async function getTableColumns(tableName) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
        
        if (data && data.length > 0) {
            return Object.keys(data[0]);
        }
        return [];
    } catch (err) {
        return [];
    }
}

async function inspectDatabase() {
    log('\n🔍 DATABASE INSPECTOR', 'bold');
    log('=' .repeat(50), 'cyan');
    log(`📍 URL: ${SUPABASE_URL}`, 'dim');
    
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
            log('   (kosong atau tidak ada akses)', 'red');
        }
    }
}

// ============================================
// SQL EXECUTION (Direct PostgreSQL Connection)
// ============================================

async function runSQL(sqlContent) {
    log('\n🚀 RUNNING SQL (Direct PostgreSQL)', 'bold');
    log('=' .repeat(50), 'cyan');
    log(`📍 Connecting to: ${PROJECT_REF}.supabase.co`, 'dim');
    
    const client = new Client({
        connectionString: PG_CONNECTION_STRING,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        log('✅ Connected to PostgreSQL', 'green');
        
        // Split SQL into statements (basic split by semicolon)
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        log(`📊 Found ${statements.length} SQL statement(s)`, 'dim');
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            // Skip pure comments
            if (stmt.split('\n').every(line => line.trim().startsWith('--') || line.trim() === '')) {
                continue;
            }
            
            try {
                const result = await client.query(stmt);
                successCount++;
                
                // Show result for SELECT queries
                if (stmt.toUpperCase().startsWith('SELECT')) {
                    if (result.rows && result.rows.length > 0) {
                        console.table(result.rows.slice(0, 10));
                    }
                } else {
                    const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
                    log(`  ✓ ${preview}...`, 'green');
                }
            } catch (stmtErr) {
                errorCount++;
                const preview = stmt.substring(0, 40).replace(/\n/g, ' ');
                log(`  ✗ ${preview}... → ${stmtErr.message}`, 'red');
            }
        }
        
        log(`\n📈 Results: ${successCount} success, ${errorCount} errors`, successCount > 0 ? 'green' : 'yellow');
        return errorCount === 0;
        
    } catch (err) {
        log(`❌ Connection Error: ${err.message}`, 'red');
        log('\n💡 Check your database password in .env.local (SUPABASE_DB_PASSWORD)', 'yellow');
        return false;
    } finally {
        await client.end();
    }
}

async function runSQLFile(filename) {
    const filePath = path.join(__dirname, '..', filename);
    
    if (!fs.existsSync(filePath)) {
        log(`❌ File tidak ditemukan: ${filename}`, 'red');
        return;
    }
    
    log(`📄 Loading: ${filename}`, 'cyan');
    const sqlContent = fs.readFileSync(filePath, 'utf-8');
    
    log(`📊 SQL Length: ${sqlContent.length} chars`, 'dim');
    
    await runSQL(sqlContent);
}

// ============================================
// STORAGE BUCKETS
// ============================================

async function listBuckets() {
    log('\n📦 STORAGE BUCKETS', 'bold');
    log('=' .repeat(50), 'cyan');
    
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
        log(`❌ Error: ${error.message}`, 'red');
        return;
    }
    
    if (data && data.length > 0) {
        log(`Found ${data.length} bucket(s):`, 'green');
        data.forEach(bucket => {
            const publicStatus = bucket.public ? '🌐 Public' : '🔒 Private';
            log(`  - ${bucket.name} (${publicStatus})`, 'cyan');
        });
    } else {
        log('  Tidak ada bucket', 'yellow');
    }
    
    return data;
}

async function createBucket(bucketName, isPublic = true) {
    log(`\n➕ Creating bucket: ${bucketName}`, 'bold');
    
    const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: isPublic,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/*', 'video/*', 'application/pdf']
    });
    
    if (error) {
        if (error.message.includes('already exists')) {
            log(`⚠️ Bucket "${bucketName}" sudah ada`, 'yellow');
        } else {
            log(`❌ Error: ${error.message}`, 'red');
        }
        return null;
    }
    
    log(`✅ Bucket "${bucketName}" berhasil dibuat!`, 'green');
    return data;
}

async function setBucketPolicy(bucketName) {
    log(`\n🔐 Setting policy for: ${bucketName}`, 'bold');
    
    // Policies are typically set via SQL, but we can make bucket public
    const { data, error } = await supabase.storage.updateBucket(bucketName, {
        public: true
    });
    
    if (error) {
        log(`❌ Error: ${error.message}`, 'red');
        return;
    }
    
    log(`✅ Bucket "${bucketName}" is now public`, 'green');
}

// ============================================
// QRIS MIGRATION CHECK
// ============================================

async function checkQrisMigration() {
    log('\n📊 QRIS MIGRATION STATUS', 'bold');
    log('=' .repeat(50), 'cyan');
    
    const columns = await getTableColumns('orders');
    
    const qrisColumns = [
        'ongkirPaymentMethod',
        'ongkirPaymentStatus', 
        'ongkirPaidAt'
    ];
    
    let allExist = true;
    
    for (const col of qrisColumns) {
        if (columns.includes(col)) {
            log(`  ✅ ${col}`, 'green');
        } else {
            log(`  ❌ ${col} - MISSING`, 'red');
            allExist = false;
        }
    }
    
    if (allExist) {
        log('\n✅ Semua kolom QRIS sudah ada!', 'green');
    } else {
        log('\n⚠️ Beberapa kolom belum ada. Jalankan migrasi:', 'yellow');
        log('   node scripts/supabase-admin.js run-sql supabase-migration-qris-payment.sql', 'dim');
    }
    
    return allExist;
}

// ============================================
// MAIN CLI
// ============================================

// List all tables via PostgreSQL
async function listTables() {
    log('\n📋 DATABASE TABLES', 'bold');
    log('=' .repeat(50), 'cyan');
    
    const sql = `
        SELECT table_name, 
               (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    `;
    
    const client = new Client({
        connectionString: PG_CONNECTION_STRING,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        const result = await client.query(sql);
        
        if (result.rows.length > 0) {
            log(`Found ${result.rows.length} table(s):`, 'green');
            result.rows.forEach(row => {
                log(`  - ${row.table_name} (${row.column_count} columns)`, 'cyan');
            });
        } else {
            log('  No tables found', 'yellow');
        }
    } catch (err) {
        log(`❌ Error: ${err.message}`, 'red');
    } finally {
        await client.end();
    }
}

// Run inline SQL query
async function runQuery(sql) {
    log('\n📝 RUNNING QUERY', 'bold');
    log('=' .repeat(50), 'cyan');
    log(`SQL: ${sql.substring(0, 80)}...`, 'dim');
    
    await runSQL(sql);
}

async function main() {
    const command = process.argv[2] || 'help';
    const arg = process.argv.slice(3).join(' '); // Join all remaining args
    
    log('\n🔧 SUPABASE ADMIN CLI', 'bold');
    log(`   Mode: Service Role + Direct PostgreSQL`, 'dim');
    
    switch (command) {
        case 'inspect':
            await inspectDatabase();
            break;
            
        case 'tables':
            await listTables();
            break;
            
        case 'run-sql':
            if (!arg) {
                log('❌ Usage: node scripts/supabase-admin.js run-sql <filename.sql>', 'red');
                break;
            }
            await runSQLFile(arg);
            break;
            
        case 'query':
            if (!arg) {
                log('❌ Usage: node scripts/supabase-admin.js query "SELECT * FROM orders LIMIT 5"', 'red');
                break;
            }
            await runQuery(arg);
            break;
            
        case 'list-buckets':
            await listBuckets();
            break;
            
        case 'create-bucket':
            if (!arg) {
                log('❌ Usage: node scripts/supabase-admin.js create-bucket <bucket-name>', 'red');
                break;
            }
            await createBucket(arg, true);
            await listBuckets();
            break;
            
        case 'migrate-qris':
            await checkQrisMigration();
            break;
            
        case 'help':
        default:
            log('\n📖 Available Commands:', 'cyan');
            log('  inspect          - Lihat struktur database via API');
            log('  tables           - List semua tabel via PostgreSQL');
            log('  run-sql <file>   - Jalankan file SQL (CREATE TABLE, ALTER, dll)');
            log('  query "<sql>"    - Jalankan SQL query langsung');
            log('  list-buckets     - List semua storage buckets');
            log('  create-bucket    - Buat bucket baru');
            log('  migrate-qris     - Cek status migrasi QRIS');
            log('\n📌 Examples:', 'dim');
            log('  node scripts/supabase-admin.js tables');
            log('  node scripts/supabase-admin.js run-sql supabase-migration-qris.sql');
            log('  node scripts/supabase-admin.js query "SELECT COUNT(*) FROM orders"');
            log('  node scripts/supabase-admin.js create-bucket pod-photos');
    }
    
    log('\n✨ Done!\n', 'green');
}

main().catch(err => {
    log(`\n❌ Fatal Error: ${err.message}`, 'red');
    process.exit(1);
});
