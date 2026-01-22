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
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function createAdmin() {
    const email = 'rayokurir@gmail.com';
    const password = 'adminrayokurir'; // Default password, user should change it

    console.log(`Creating admin user: ${email}...`);

    // 1. Create auth user
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: 'Super Admin' }
    });

    if (createError) {
        console.error('Error creating user:', createError.message);
        if (createError.message.includes('already')) {
             console.log("User already exists, fetching ID...");
             const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
             if (listError) {
                 console.error("Could not list users:", listError);
                 return;
             }
             const existingUser = users.find(u => u.email === email);
             if (existingUser) {
                 console.log(`\n✅ USER ID found: ${existingUser.id}`);
                 console.log(`\nPlease run the following SQL manually to link the user:`);
                 console.log(`
UPDATE users SET auth_id = '${existingUser.id}' WHERE email = '${email}';
INSERT INTO users (auth_id, email, username, name, role)
SELECT '${existingUser.id}', '${email}', 'admin', 'Super Admin', 'ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = '${email}');
                 `);
             } else {
                 console.log("User not found in list despite 'already registered' error.");
             }
        }
        return;
    }

    if (user) {
        console.log(`\n✅ USER CREATED with ID: ${user.id}`);
        console.log(`\nPlease run the following SQL manually to link the user:`);
        console.log(`
UPDATE users SET auth_id = '${user.id}' WHERE email = '${email}';
INSERT INTO users (auth_id, email, username, name, role)
SELECT '${user.id}', '${email}', 'admin', 'Super Admin', 'ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = '${email}');
        `);
    }
}

createAdmin();
