const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envLocalPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const envVars = envContent.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
}, {});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Error: Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function linkAdmin() {
    const email = 'rayokurir@gmail.com';
    
    console.log('🔍 Finding auth user...');
    
    // Get auth user ID
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('Error listing users:', listError.message);
        return;
    }
    
    const authUser = users.find(u => u.email === email);
    if (!authUser) {
        console.error('Auth user not found:', email);
        console.log('Available users:', users.map(u => u.email).join(', '));
        return;
    }
    
    console.log('✅ Found auth user:', authUser.id);
    
    // Update users table directly via Supabase client
    console.log('🔄 Updating users table...');
    
    // First, try to update existing admin by username
    const { data: updated, error: updateError } = await supabase
        .from('users')
        .update({ 
            auth_id: authUser.id,
            email: email 
        })
        .eq('username', 'admin')
        .select();
    
    if (updateError) {
        console.error('Update error:', updateError.message);
        
        // Try insert instead
        console.log('📝 Trying insert...');
        const { data: inserted, error: insertError } = await supabase
            .from('users')
            .insert({
                auth_id: authUser.id,
                email: email,
                username: 'admin',
                name: 'Super Admin',
                role: 'ADMIN'
            })
            .select();
        
        if (insertError) {
            console.error('Insert error:', insertError.message);
        } else {
            console.log('✅ Admin inserted:', inserted);
        }
    } else {
        console.log('✅ Admin updated:', updated);
    }
    
    // Verify
    const { data: verify } = await supabase
        .from('users')
        .select('username, email, role, auth_id')
        .eq('role', 'ADMIN');
    
    console.log('\n📊 Current ADMIN users:', verify);
}

linkAdmin();
