// Message Templates for Rayo Kurir Telegram Bots
// Pre-formatted messages for notifications, reports, and menus

import {
    formatCurrency,
    formatDate,
    formatTime,
    escapeHtml,
    StatusEmoji,
    StatusLabel,
    OrderStatusType
} from './utils';

// Types
interface OrderItem {
    name: string;
    qty: number;
    price: number;
}

interface Order {
    id: string;
    orderNumber: string;
    mitraName: string;
    mitraAddress: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    items: OrderItem[];
    subtotal: number;
    deliveryFee: number;
    total: number;
    codAmount?: number;
    notes?: string;
    status: OrderStatusType;
    createdAt: Date;
}

interface Kurir {
    id: string;
    name: string;
    phone: string;
    isOnline: boolean;
    totalOrders: number;
    rating: number;
}

interface DailyStats {
    ordersNew: number;
    ordersActive: number;
    ordersDone: number;
    ordersCancelled: number;
    totalRevenue: number;
    totalCOD: number;
    codCollected: number;
    codPending: number;
}

// ============================================
// ADMIN BOT MESSAGES
// ============================================

// Admin welcome/start message
export function getAdminWelcomeMessage(stats: DailyStats): string {
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? '🌅 Selamat Pagi' : hour < 18 ? '☀️ Selamat Siang' : '🌙 Selamat Malam';

    const totalOrders = stats.ordersNew + stats.ordersActive + stats.ordersDone + stats.ordersCancelled;
    const successRate = totalOrders > 0 ? Math.round((stats.ordersDone / totalOrders) * 100) : 0;
    const progressBar = '▰'.repeat(Math.floor(successRate / 10)) + '▱'.repeat(10 - Math.floor(successRate / 10));

    return `
╔═══════════════════════════════════╗
║    🏠  DASHBOARD ADMIN RAYO      ║
╚═══════════════════════════════════╝

${greeting}, Admin! 👋

📊 <b>STATISTIK HARI INI</b>
┌───────────────────────────────┐
│ 📥 Order Baru    │ <b>${String(stats.ordersNew).padStart(3)}</b> order │
│ ⏳ Sedang Proses │ <b>${String(stats.ordersActive).padStart(3)}</b> order │
│ ✅ Selesai       │ <b>${String(stats.ordersDone).padStart(3)}</b> order │
│ ❌ Dibatalkan    │ <b>${String(stats.ordersCancelled).padStart(3)}</b> order │
└───────────────────────────────┘

🎯 Success Rate: ${progressBar} <b>${successRate}%</b>

💰 <b>KEUANGAN</b>
┌───────────────────────────────┐
│ 🚚 Total Ongkir  │ ${formatCurrency(stats.totalRevenue)} │
│ 💵 COD Terkumpul │ ${formatCurrency(stats.codCollected)} │
│ ⏳ Belum Setor   │ ${formatCurrency(stats.codPending)} │
└───────────────────────────────┘

💡 <i>Tip: Gunakan /report untuk laporan lengkap</i>

Pilih menu di bawah:`;
}

// New order notification
export function getNewOrderNotification(order: Order): string {
    const itemsList = order.items
        .map((item, idx) => `  ${idx + 1}. ${escapeHtml(item.name)} x${item.qty} = ${formatCurrency(item.price * item.qty)}`)
        .join('\n');

    const isCOD = order.codAmount && order.codAmount > 0;
    const priorityBadge = isCOD ? '💵 COD ORDER' : '📦 REGULER';

    return `
╔════════════════════════════════════╗
║    🆕  ORDER BARU MASUK!           ║
╚════════════════════════════════════╝

${priorityBadge}  •  📅 ${formatDate(order.createdAt)}  •  ⏰ ${formatTime(order.createdAt)}

📋 <b>INFORMASI ORDER</b>
┌──────────────────────────────────┐
│ 🆔 No. Order : <code>${order.orderNumber}</code>
│ 🏪 Mitra     : <b>${escapeHtml(order.mitraName)}</b>
│ 📍 Pickup    : ${escapeHtml(order.mitraAddress)}
└──────────────────────────────────┘

👤 <b>DATA CUSTOMER</b>
┌──────────────────────────────────┐
│ 🧑 Nama   : <b>${escapeHtml(order.customerName)}</b>
│ 📱 WA     : <code>${order.customerPhone}</code>
│ 🏠 Alamat : ${escapeHtml(order.customerAddress)}
└──────────────────────────────────┘

🛒 <b>RINCIAN PESANAN</b>
${itemsList}

💰 <b>PEMBAYARAN</b>
┌──────────────────────────────────┐
│ Subtotal : ${formatCurrency(order.subtotal)}
│ Ongkir   : ${formatCurrency(order.deliveryFee)}
│ <b>TOTAL</b>    : <b>${formatCurrency(order.total)}</b>
${isCOD ? `│ 💵 <b>COD</b>   : <b>${formatCurrency(order.codAmount!)}</b> ⚠️` : `│ ✅ Sudah Dibayar`}
└──────────────────────────────────┘
${order.notes ? `\n📝 <b>Catatan:</b> ${escapeHtml(order.notes)}` : ''}
⏱️ <i>Target pengiriman: 45 menit</i>`;
}

// Order assigned notification
export function getOrderAssignedMessage(order: Order, kurir: Kurir): string {
    return `
✅ <b>ORDER BERHASIL DI-ASSIGN!</b>
━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Order: <code>${order.orderNumber}</code>
🚚 Kurir: <b>${escapeHtml(kurir.name)}</b>
📱 HP Kurir: <code>${kurir.phone}</code>

📍 Pickup: ${escapeHtml(order.mitraName)}
📍 Dropoff: ${escapeHtml(order.customerAddress)}

Status akan diupdate otomatis saat kurir memproses pesanan.
━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// Daily report message
export function getDailyReportMessage(
    date: Date,
    stats: DailyStats,
    topKurir: Array<{ name: string; orders: number; revenue: number }>,
    topMitra: Array<{ name: string; orders: number }>
): string {
    const totalOrders = stats.ordersNew + stats.ordersActive + stats.ordersDone + stats.ordersCancelled;
    const successRate = totalOrders > 0 ? Math.round((stats.ordersDone / totalOrders) * 100) : 0;
    const progressBar = '▰'.repeat(Math.floor(successRate / 10)) + '▱'.repeat(10 - Math.floor(successRate / 10));

    const kurirRanking = topKurir
        .map((k, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
            return `${medal} <b>${escapeHtml(k.name)}</b>\n   └─ ${k.orders} order • ${formatCurrency(k.revenue)}`;
        })
        .join('\n');

    const mitraRanking = topMitra
        .map((m, idx) => {
            const medal = idx === 0 ? '🏆' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
            return `${medal} ${escapeHtml(m.name)} (${m.orders} order)`;
        })
        .join('\n');

    const dayName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][date.getDay()];

    return `
╔═══════════════════════════════════════╗
║   📊  LAPORAN HARIAN RAYO KURIR       ║
║   ${dayName}, ${formatDate(date)}                    ║
╚═══════════════════════════════════════╝

🎯 <b>PERFORMA HARI INI</b>
${progressBar} <b>${successRate}%</b> Success Rate

📦 <b>RINGKASAN ORDER</b>
┌───────────────────────────────────┐
│ ✅ Selesai        │ <b>${String(stats.ordersDone).padStart(4)}</b> order │
│ ⏳ Sedang Proses  │ <b>${String(stats.ordersActive).padStart(4)}</b> order │
│ ❌ Dibatalkan     │ <b>${String(stats.ordersCancelled).padStart(4)}</b> order │
├───────────────────────────────────┤
│ 📥 <b>TOTAL MASUK</b>   │ <b>${String(totalOrders).padStart(4)}</b> order │
└───────────────────────────────────┘

💰 <b>RINGKASAN KEUANGAN</b>
┌───────────────────────────────────┐
│ 🚚 Total Ongkir   │ ${formatCurrency(stats.totalRevenue)}
│ 💵 Total COD      │ ${formatCurrency(stats.totalCOD)}
├───────────────────────────────────┤
│ ✅ Sudah Disetor  │ ${formatCurrency(stats.codCollected)}
│ ⏳ Belum Disetor  │ ${formatCurrency(stats.codPending)} ${stats.codPending > 0 ? '⚠️' : ''}
└───────────────────────────────────┘

👥 <b>TOP KURIR HARI INI</b>
${kurirRanking || '<i>Belum ada data</i>'}

🏪 <b>TOP MITRA HARI INI</b>
${mitraRanking || '<i>Belum ada data</i>'}

💡 <b>Insight:</b> <i>Success rate ${successRate >= 80 ? 'sangat baik! 🎉' : successRate >= 60 ? 'cukup baik' : 'perlu ditingkatkan'}</i>

───────────────────────────────────────
🤖 Generated: ${formatDate(new Date())}, ${formatTime(new Date())} WIB`;
}

// COD report message
export function getCODReportMessage(
    date: Date,
    totalCOD: number,
    collected: number,
    pending: number,
    kurirCOD: Array<{ name: string; collected: number; setor: number; pending: number; orders: number }>
): string {
    const collectionRate = totalCOD > 0 ? Math.round((collected / totalCOD) * 100) : 0;
    const progressBar = '▰'.repeat(Math.floor(collectionRate / 10)) + '▱'.repeat(10 - Math.floor(collectionRate / 10));

    const kurirDetails = kurirCOD
        .map((k) => {
            const status = k.pending === 0 ? '✅ LUNAS' : k.pending > 500000 ? '🔴 URGENT' : '🟡 PENDING';
            return `
┌─ 🚚 <b>${escapeHtml(k.name)}</b> ${status}
│  💵 Terkumpul : ${formatCurrency(k.collected)}
│  ✅ Disetor   : ${formatCurrency(k.setor)}
│  ⏳ Sisa      : ${formatCurrency(k.pending)}
└  📦 Order     : ${k.orders} pending`;
        })
        .join('\n');

    const urgentCount = kurirCOD.filter(k => k.pending > 500000).length;

    return `
╔═══════════════════════════════════════╗
║   💰  LAPORAN SETORAN COD             ║
║   📅 ${formatDate(date)}                          ║
╚═══════════════════════════════════════╝
${urgentCount > 0 ? `\n🚨 <b>ALERT:</b> ${urgentCount} kurir dengan COD pending > Rp500rb\n` : ''}
🎯 <b>TINGKAT SETORAN</b>
${progressBar} <b>${collectionRate}%</b>

💵 <b>RINGKASAN COD</b>
┌───────────────────────────────────┐
│ 💰 Total COD Hari Ini             │
│    <b>${formatCurrency(totalCOD)}</b>                   │
├───────────────────────────────────┤
│ ✅ Sudah Disetor │ ${formatCurrency(collected)}
│ ⏳ Belum Disetor │ ${formatCurrency(pending)} ${pending > 0 ? '⚠️' : ''}
└───────────────────────────────────┘

👥 <b>DETAIL PER KURIR</b>
${kurirDetails || '<i>Belum ada data</i>'}

💡 <i>Deadline setoran: 21:00 WIB</i>
───────────────────────────────────────
🤖 Generated: ${formatDate(new Date())}, ${formatTime(new Date())} WIB`;
}

// ============================================
// KURIR BOT MESSAGES
// ============================================

// Kurir welcome message
export function getKurirWelcomeMessage(
    kurir: Kurir,
    todayOrders: number,
    todayEarnings: number,
    pendingCOD: number
): string {
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? '🌅 Selamat Pagi' : hour < 18 ? '☀️ Selamat Siang' : '🌙 Selamat Malam';

    // Target 10 orders per day
    const targetOrders = 10;
    const progressPercent = Math.min(Math.round((todayOrders / targetOrders) * 100), 100);
    const progressBar = '▰'.repeat(Math.floor(progressPercent / 10)) + '▱'.repeat(10 - Math.floor(progressPercent / 10));

    const motivationalQuotes = [
        '💪 Semangat terus!',
        '🎯 Target tercapai = bonus tambahan!',
        '🚀 Ayo gas terus!',
        '⭐ Kamu hebat!',
        '🔥 Keep up the great work!'
    ];
    const quote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

    return `
╔═══════════════════════════════════════╗
║    🏠  MENU KURIR RAYO                ║
╚═══════════════════════════════════════╝

${greeting}, <b>${escapeHtml(kurir.name)}</b>! 👋

📊 Status: ${kurir.isOnline ? '🟢 ONLINE - Siap menerima order' : '🔴 OFFLINE - Tidak menerima order'}

🎯 <b>PROGRESS HARI INI</b>
${progressBar} <b>${todayOrders}/${targetOrders}</b> order (${progressPercent}%)

📈 <b>STATISTIK HARI INI</b>
┌───────────────────────────────────┐
│ ✅ Order Selesai  │ <b>${todayOrders}</b> order
│ 💵 Pendapatan     │ <b>${formatCurrency(todayEarnings)}</b>
│ 💰 COD Pending    │ ${formatCurrency(pendingCOD)} ${pendingCOD > 0 ? '⚠️' : '✅'}
└───────────────────────────────────┘

${quote}

Pilih menu di bawah:`;
}

// New task notification for kurir
export function getNewTaskNotification(order: Order): string {
    const itemsCount = order.items.reduce((acc, item) => acc + item.qty, 0);

    return `
🚚 <b>TUGAS BARU UNTUK KAMU!</b>
━━━━━━━━━━━━━━━━━━━━━━━━

🆔 Order: <code>${order.orderNumber}</code>

🏪 <b>Pickup:</b> ${escapeHtml(order.mitraName)}
   📍 ${escapeHtml(order.mitraAddress)}

📦 <b>Dropoff:</b> ${escapeHtml(order.customerName)}
   📍 ${escapeHtml(order.customerAddress)}
   📱 ${order.customerPhone}

🛒 Barang: ${itemsCount} item
${order.codAmount ? `💰 <b>Collect COD: ${formatCurrency(order.codAmount)}</b>` : ''}

⏰ Target: 45 menit
${order.notes ? `\n📝 Catatan: ${escapeHtml(order.notes)}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// Task detail for kurir
export function getTaskDetailMessage(order: Order): string {
    const itemsList = order.items
        .map((item, idx) => `  ${idx + 1}. ${escapeHtml(item.name)} x${item.qty}`)
        .join('\n');

    return `
📦 <b>DETAIL ORDER</b>
━━━━━━━━━━━━━━━━━━━━━━

🆔 Order: <code>${order.orderNumber}</code>
${StatusEmoji[order.status]} Status: <b>${StatusLabel[order.status]}</b>

🏪 <b>PICKUP</b>
${escapeHtml(order.mitraName)}
📍 ${escapeHtml(order.mitraAddress)}

📦 <b>DROPOFF</b>
${escapeHtml(order.customerName)}
📍 ${escapeHtml(order.customerAddress)}
📱 ${order.customerPhone}

🛒 <b>BARANG:</b>
${itemsList}

💰 Total: ${formatCurrency(order.total)}
${order.codAmount ? `💵 COD: <b>${formatCurrency(order.codAmount)}</b>` : ''}
${order.notes ? `\n📝 Catatan: ${escapeHtml(order.notes)}` : ''}

━━━━━━━━━━━━━━━━━━━━━━
Pilih aksi di bawah:`;
}

// Wallet message for kurir
export function getWalletMessage(
    kurir: Kurir,
    pendingCOD: number,
    pendingOrders: Array<{ orderNumber: string; amount: number }>,
    todayEarnings: number,
    todayOrders: number,
    bonus: number
): string {
    const pendingList = pendingOrders
        .map((o) => `│  • <code>${o.orderNumber}</code> : ${formatCurrency(o.amount)}`)
        .join('\n');

    const totalEarnings = todayEarnings + bonus;
    const targetDaily = 150000; // Target Rp150rb per hari
    const progressPercent = Math.min(Math.round((totalEarnings / targetDaily) * 100), 100);
    const progressBar = '▰'.repeat(Math.floor(progressPercent / 10)) + '▱'.repeat(10 - Math.floor(progressPercent / 10));

    return `
╔═══════════════════════════════════════╗
║    👛  DOMPET KURIR                   ║
╚═══════════════════════════════════════╝

👤 <b>${escapeHtml(kurir.name)}</b>
📅 ${formatDate(new Date())}

${pendingCOD > 0 ? `
⚠️ <b>COD BELUM DISETOR</b>
┌───────────────────────────────────┐
│ 💰 Total: <b>${formatCurrency(pendingCOD)}</b>
${pendingList}
└───────────────────────────────────┘
<i>Segera setor ke admin sebelum 21:00 WIB</i>
` : `
✅ <b>COD SUDAH LUNAS</b>
Tidak ada COD yang perlu disetor.
`}
🎯 <b>TARGET PENDAPATAN</b>
${progressBar} <b>${progressPercent}%</b> dari ${formatCurrency(targetDaily)}

📊 <b>PENDAPATAN HARI INI</b>
┌───────────────────────────────────┐
│ 🚚 Ongkir (${todayOrders} order)  │ ${formatCurrency(todayEarnings)}
│ ⭐ Bonus Express        │ ${formatCurrency(bonus)}
├───────────────────────────────────┤
│ 💵 <b>TOTAL</b>               │ <b>${formatCurrency(totalEarnings)}</b>
└───────────────────────────────────┘

${totalEarnings >= targetDaily ? '🎉 <b>Target tercapai! Luar biasa!</b>' : `💪 Kurang ${formatCurrency(targetDaily - totalEarnings)} lagi!`}`;
}

// Status update confirmation
export function getStatusUpdateConfirmation(order: Order, newStatus: OrderStatusType): string {
    const statusMessages: Partial<Record<OrderStatusType, string>> = {
        'OTW_PICKUP': '🚗 Sedang menuju lokasi pickup...',
        'PICKED': '📦 Barang sudah dijemput, lanjut ke dropoff!',
        'OTW_DROPOFF': '🚗 Sedang menuju lokasi customer...',
        'NEED_POD': '📸 Jangan lupa upload foto bukti pengiriman!',
        'DELIVERED': '🎉 Terima kasih! Order berhasil diantar.',
        'SELESAI': '🎉 Terima kasih! Order sudah selesai.',
        'CANCELLED': '❌ Order dibatalkan.',
        'GAGAL': '⚠️ Order gagal diantar. Admin akan follow up.'
    };

    return `
╔═══════════════════════════════════════╗
║    ✅  STATUS BERHASIL DIUPDATE       ║
╚═══════════════════════════════════════╝

🆔 Order: <code>${order.orderNumber}</code>

📊 <b>STATUS BARU</b>
┌───────────────────────────────────┐
│ ${StatusEmoji[newStatus]} <b>${StatusLabel[newStatus]}</b>
└───────────────────────────────────┘

${statusMessages[newStatus] || ''}

💡 <i>Lanjutkan ke step berikutnya!</i>`;
}

// Help message for kurir
export function getKurirHelpMessage(): string {
    return `
╔═══════════════════════════════════════╗
║    ❓  PANDUAN KURIR RAYO             ║
╚═══════════════════════════════════════╝

📋 <b>CARA TERIMA TUGAS</b>
┌───────────────────────────────────┐
│ 1. Pastikan status <b>🟢 Online</b>
│ 2. Notifikasi tugas akan masuk
│ 3. Klik <b>Terima</b> untuk ambil tugas
│ 4. Atau <b>Tolak</b> dengan alasan
└───────────────────────────────────┘

🚚 <b>ALUR PENGIRIMAN</b>
┌───────────────────────────────────┐
│ 1️⃣ <b>OTW Pickup</b> - Jalan ke mitra
│ 2️⃣ <b>Picked</b> - Barang dijemput
│ 3️⃣ <b>OTW Dropoff</b> - Jalan ke customer  
│ 4️⃣ <b>Need POD</b> - Upload foto bukti
│ 5️⃣ <b>Delivered</b> - Order selesai! 🎉
└───────────────────────────────────┘

💰 <b>COD & SETORAN</b>
┌───────────────────────────────────┐
│ • Collect COD dari customer
│ • Setor ke admin sebelum 21:00 WIB
│ • Cek saldo di menu <b>Dompet</b>
└───────────────────────────────────┘

📞 <b>BUTUH BANTUAN?</b>
Hubungi Admin: wa.me/6281234567890

💡 <i>Tip: Gunakan /menu untuk kembali ke menu utama</i>`;
}
