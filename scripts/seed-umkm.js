const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
    }
});

const supabase = createClient(
    envVars['NEXT_PUBLIC_SUPABASE_URL'],
    envVars['SUPABASE_SERVICE_ROLE_KEY']
);

const INITIAL_DATA = [
    // ZONA KANAN (46 items)
    { nama: "Es Jeruk / Es Teh", zona: "KANAN" },
    { nama: "Seblak Jeng Frisca", zona: "KANAN" },
    { nama: "Es Oyen", zona: "KANAN" },
    { nama: "Soto Daging Cak Ndut", zona: "KANAN" },
    { nama: "Kacang Godog", zona: "KANAN" },
    { nama: "Mie Goceng", zona: "KANAN" },
    { nama: "Warmindo", zona: "KANAN" },
    { nama: "Penjual Mainan", zona: "KANAN" },
    { nama: "Mie Ayam Semarang", zona: "KANAN" },
    { nama: "Es Degan Ijo Asli 5000", zona: "KANAN" },
    { nama: "Batagor Kaki Lima", zona: "KANAN" },
    { nama: "Angsle", zona: "KANAN" },
    { nama: "Jus Buah", zona: "KANAN" },
    { nama: "Es Teh Poci", zona: "KANAN" },
    { nama: "Lalapan Lele dll", zona: "KANAN" },
    { nama: "Es Podeng Manten", zona: "KANAN" },
    { nama: "Es Buah / Es Oyen", zona: "KANAN" },
    { nama: "Nasi Goreng", zona: "KANAN" },
    { nama: "Roti Bakar", zona: "KANAN" },
    { nama: "Gorengan Aneka Rasa", zona: "KANAN" },
    { nama: "Sosis Bakar, Kebab Sosis", zona: "KANAN" },
    { nama: "Martabak / Terang Bulan", zona: "KANAN" },
    { nama: "Arimusik Elektronik", zona: "KANAN" },
    { nama: "Es Manado", zona: "KANAN" },
    { nama: "Pentol Bakar", zona: "KANAN" },
    { nama: "DND Fried Chicken", zona: "KANAN" },
    { nama: "Bakwan Malang", zona: "KANAN" },
    { nama: "Seblak Mbak Puput", zona: "KANAN" },
    { nama: "Toko Komar", zona: "KANAN" },
    { nama: "Sempol Ayam", zona: "KANAN" },
    { nama: "Nita Elektronik", zona: "KANAN" },
    { nama: "Rocket Chicken", zona: "KANAN" },
    { nama: "Sate Kambing & Ayam Wetan Kali", zona: "KANAN" },
    { nama: "Mie Daily", zona: "KANAN" },
    { nama: "Onde Onde Ungu", zona: "KANAN" },
    { nama: "Nabihan Rumah Baju Anak Keren", zona: "KANAN" },
    { nama: "DMK ( Donat Mini Kentang )", zona: "KANAN" },
    { nama: "Es Kuwut", zona: "KANAN" },
    { nama: "Batagor & Gorengan", zona: "KANAN" },
    { nama: "Lalapan Purnama", zona: "KANAN" },
    { nama: "Roti Bakar 99", zona: "KANAN" },
    { nama: "Pisang Molen", zona: "KANAN" },
    { nama: "INDOMARET", zona: "KANAN" },
    { nama: "POM Bensin", zona: "KANAN" },
    { nama: "KOPSO ( Kopi Susu ) Dimsum", zona: "KANAN" },
    { nama: "Martabak Boss Que", zona: "KANAN" },
    // ZONA KIRI (93 items)
    { nama: "BRI Link", zona: "KIRI" },
    { nama: "Roti Bakar", zona: "KIRI" },
    { nama: "Batagor", zona: "KIRI" },
    { nama: "Warung Unyil Pecel", zona: "KIRI" },
    { nama: "Penjual Ikan Hias", zona: "KIRI" },
    { nama: "Gorengan", zona: "KIRI" },
    { nama: "Sate Kambing", zona: "KIRI" },
    { nama: "Bengkel", zona: "KIRI" },
    { nama: "Penjual Buah dan Krupuk", zona: "KIRI" },
    { nama: "Penjual Sandal", zona: "KIRI" },
    { nama: "Toko Spiritual", zona: "KIRI" },
    { nama: "Toko Klontong", zona: "KIRI" },
    { nama: "Barbershop", zona: "KIRI" },
    { nama: "Tahu Tek", zona: "KIRI" },
    { nama: "ALFAMART", zona: "KIRI" },
    { nama: "Es Nyoklat", zona: "KIRI" },
    { nama: "Kebab Mitra Kebab", zona: "KIRI" },
    { nama: "Sempol Ayam", zona: "KIRI" },
    { nama: "Tahu Tek (2)", zona: "KIRI" },
    { nama: "Toko Pakan KUD", zona: "KIRI" },
    { nama: "Toko Undangan", zona: "KIRI" },
    { nama: "Barbershop (2)", zona: "KIRI" },
    { nama: "Es Capcin", zona: "KIRI" },
    { nama: "Bakso Urat Kikil 1", zona: "KIRI" },
    { nama: "INDOMARET", zona: "KIRI" },
    { nama: "Bengkel Sparepart Sepeda Motor", zona: "KIRI" },
    { nama: "Toko Kosmetik BELEZA", zona: "KIRI" },
    { nama: "Warkop Gajah Mada", zona: "KIRI" },
    { nama: "Toko Kabul Sparepart", zona: "KIRI" },
    { nama: "Warung Sayur", zona: "KIRI" },
    { nama: "Toko Ban", zona: "KIRI" },
    { nama: "Warung Bebek David", zona: "KIRI" },
    { nama: "Toko Parfum La Zasbia", zona: "KIRI" },
    { nama: "Konter HP Ari Cell / DAP", zona: "KIRI" },
    { nama: "Toko Sparepart", zona: "KIRI" },
    { nama: "Toko Jamu Jago", zona: "KIRI" },
    { nama: "Toko Madura", zona: "KIRI" },
    { nama: "Warung Sayur (2)", zona: "KIRI" },
    { nama: "Toko Madura (2)", zona: "KIRI" },
    { nama: "Puhung Keju", zona: "KIRI" },
    { nama: "Toko Peralatan Rumah Tangga", zona: "KIRI" },
    { nama: "Rumah Makan Padang Surya Minang", zona: "KIRI" },
    { nama: "Sego Babat", zona: "KIRI" },
    { nama: "Ganti Baterai Jam / Service Jam, Jahit Pakaian", zona: "KIRI" },
    { nama: "Proxy Cetak Foto", zona: "KIRI" },
    { nama: "MIXUE", zona: "KIRI" },
    { nama: "Kebab Turki", zona: "KIRI" },
    { nama: "Planet Ban", zona: "KIRI" },
    { nama: "ES Teh Presiden", zona: "KIRI" },
    { nama: "Konter Duta Phone", zona: "KIRI" },
    { nama: "Toko ATK Isi Joyo", zona: "KIRI" },
    { nama: "Es Degan", zona: "KIRI" },
    { nama: "Konter Laris Cell", zona: "KIRI" },
    { nama: "PS 3", zona: "KIRI" },
    { nama: "Rumah Makan Padang Minang Maimbau", zona: "KIRI" },
    { nama: "Martabak / Terang Bulan", zona: "KIRI" },
    { nama: "Pisang Goreng Coklat", zona: "KIRI" },
    { nama: "Ayam Geprek Jober", zona: "KIRI" },
    { nama: "ABG Aksesoris", zona: "KIRI" },
    { nama: "Soto Ayam Lamongan Cak Ipul", zona: "KIRI" },
    { nama: "Mie Ayam", zona: "KIRI" },
    { nama: "Toko Jaya Agung", zona: "KIRI" },
    { nama: "Toserba ROCKET", zona: "KIRI" },
    { nama: "Toserba Saudara Jaya", zona: "KIRI" },
    { nama: "Es Teh Poci", zona: "KIRI" },
    { nama: "Bakso Rakyat 99", zona: "KIRI" },
    { nama: "Seblak Ndower 99", zona: "KIRI" },
    { nama: "Dimsum Mentai 99", zona: "KIRI" },
    { nama: "Apotek Sumobito Farma", zona: "KIRI" },
    { nama: "KSP Podo Joyo", zona: "KIRI" },
    { nama: "Toko Nayla Snack", zona: "KIRI" },
    { nama: "Toko Hidayah Plastik", zona: "KIRI" },
    { nama: "Kidz Eduplay Playground", zona: "KIRI" },
    { nama: "Seblak Tomyum", zona: "KIRI" },
    { nama: "Takoyaki, Sosis Bakar Jumbo", zona: "KIRI" },
    { nama: "Tahu Tek (3)", zona: "KIRI" },
    { nama: "Toko Sandal", zona: "KIRI" },
    { nama: "Toko Roti Mutiara", zona: "KIRI" },
    { nama: "Puhung Keju (2)", zona: "KIRI" },
    { nama: "STMJ", zona: "KIRI" },
    { nama: "Es Oyen / Es Buah", zona: "KIRI" },
    { nama: "Sate Ayam", zona: "KIRI" },
    { nama: "Bengkel Sepeda Motor", zona: "KIRI" },
    { nama: "Toko Buah Firda Fruit", zona: "KIRI" },
    { nama: "Mie Jades", zona: "KIRI" },
    { nama: "ES Teh Point", zona: "KIRI" },
    { nama: "Sambelan Seafood", zona: "KIRI" },
    { nama: "FB Fashion Toko Baju Anak", zona: "KIRI" },
    { nama: "Warung Sate Mirasa 2", zona: "KIRI" },
    { nama: "Mie Ayam Cak eko", zona: "KIRI" },
    { nama: "Toko Nafisa Plastik", zona: "KIRI" },
    { nama: "Seblak Merdeka Bang Arif", zona: "KIRI" },
];

async function seedData() {
    console.log('🌱 Seeding UMKM data...');
    console.log(`   Total: ${INITIAL_DATA.length} items`);
    
    const { data, error } = await supabase.from('umkm').insert(
        INITIAL_DATA.map(item => ({
            nama: item.nama,
            zona: item.zona,
            brosur_disebar: false,
            daftar_mitra: false,
            wa: '',
            catatan: ''
        }))
    );
    
    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log('✅ Data berhasil ditambahkan!');
        
        // Verify
        const { count } = await supabase.from('umkm').select('*', { count: 'exact', head: true });
        console.log(`📊 Total UMKM di database: ${count}`);
    }
}

seedData();
