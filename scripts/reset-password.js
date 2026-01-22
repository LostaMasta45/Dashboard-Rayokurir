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

const supabase = createClient(supabaseUrl, serviceKey);

async function resetPassword() {
    const email = 'rayokurir@gmail.com';
    const newPassword = 'RayoKurir2026!'; // Secure password
    
    console.log(`🔑 Resetting password for: ${email}`);
    
    // Get user ID first
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('Error:', listError.message);
        return;
    }
    
    const user = users.find(u => u.email === email);
    if (!user) {
        console.error('User not found');
        return;
    }
    
    // Update password
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword
    });
    
    if (error) {
        console.error('Error resetting password:', error.message);
    } else {
        console.log('✅ Password reset successfully!');
        console.log('');
        console.log('=== LOGIN CREDENTIALS ===');
        console.log(`Email: ${email}`);
        console.log(`Password: ${newPassword}`);
        console.log('=========================');
    }
}

resetPassword();
