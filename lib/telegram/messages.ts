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
    return `
🏠 <b>MENU ADMIN RAYO KURIR</b>
━━━━━━━━━━━━━━━━━━━━━━━━

📊 <b>Statistik Hari Ini:</b>
• Order Baru: <b>${stats.ordersNew}</b>
• Diproses: <b>${stats.ordersActive}</b>
• Selesai: <b>${stats.ordersDone}</b>
• Batal: <b>${stats.ordersCancelled}</b>

💰 Pendapatan: <b>${formatCurrency(stats.totalRevenue)}</b>
━━━━━━━━━━━━━━━━━━━━━━━━

Pilih menu di bawah:`;
}

// New order notification
export function getNewOrderNotification(order: Order): string {
    const itemsList = order.items
        .map((item, idx) => `  ${idx + 1}. ${escapeHtml(item.name)} x${item.qty} = ${formatCurrency(item.price * item.qty)}`)
        .join('\n');

    return `
📦 <b>ORDER BARU MASUK!</b>
━━━━━━━━━━━━━━━━━━━━

🆔 Order: <code>${order.orderNumber}</code>
📍 Mitra: <b>${escapeHtml(order.mitraName)}</b>
👤 Customer: <b>${escapeHtml(order.customerName)}</b>
📱 WA: <code>${order.customerPhone}</code>
📍 Alamat: ${escapeHtml(order.customerAddress)}

🛒 <b>Detail Pesanan:</b>
${itemsList}

💰 Subtotal: ${formatCurrency(order.subtotal)}
🚚 Ongkir: ${formatCurrency(order.deliveryFee)}
${order.codAmount ? `💵 COD: <b>${formatCurrency(order.codAmount)}</b>` : ''}

⏰ Waktu: ${formatDate(order.createdAt)}, ${formatTime(order.createdAt)} WIB
${order.notes ? `\n📝 Catatan: ${escapeHtml(order.notes)}` : ''}
━━━━━━━━━━━━━━━━━━━━`;
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
    const kurirRanking = topKurir
        .map((k, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  ';
            return `${medal} ${escapeHtml(k.name)}: ${k.orders} order (${formatCurrency(k.revenue)})`;
        })
        .join('\n');

    const mitraRanking = topMitra
        .map((m, idx) => `${idx + 1}. ${escapeHtml(m.name)} (${m.orders} order)`)
        .join('\n');

    return `
📊 <b>LAPORAN HARIAN RAYO KURIR</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 ${formatDate(date)}

📦 <b>RINGKASAN ORDER</b>
━━━━━━━━━━━━━━━━━━
✅ Selesai      : <b>${stats.ordersDone}</b> order
⏳ Diproses     : <b>${stats.ordersActive}</b> order
❌ Batal        : <b>${stats.ordersCancelled}</b> order
📥 Total Masuk  : <b>${stats.ordersNew + stats.ordersActive + stats.ordersDone + stats.ordersCancelled}</b> order

💰 <b>KEUANGAN</b>
━━━━━━━━━━━━━━━━━━
🚚 Total Ongkir    : ${formatCurrency(stats.totalRevenue)}
💵 Total COD       : ${formatCurrency(stats.totalCOD)}
💳 Sudah Setor     : ${formatCurrency(stats.codCollected)}
⏳ Belum Setor     : ${formatCurrency(stats.codPending)}

👥 <b>PERFORMA KURIR</b>
━━━━━━━━━━━━━━━━━━
${kurirRanking || 'Belum ada data'}

🏪 <b>TOP MITRA HARI INI</b>
━━━━━━━━━━━━━━━━━━
${mitraRanking || 'Belum ada data'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated: ${formatDate(new Date())}, ${formatTime(new Date())} WIB`;
}

// COD report message
export function getCODReportMessage(
    date: Date,
    totalCOD: number,
    collected: number,
    pending: number,
    kurirCOD: Array<{ name: string; collected: number; setor: number; pending: number; orders: number }>
): string {
    const kurirDetails = kurirCOD
        .map((k) => {
            const status = k.pending === 0 ? '✅' : '⚠️';
            return `
🚚 <b>${escapeHtml(k.name)}</b>
   • COD Collected  : ${formatCurrency(k.collected)}
   • Sudah Setor    : ${formatCurrency(k.setor)}
   • Sisa           : ${formatCurrency(k.pending)} ${status}
   • Order Pending  : ${k.orders}`;
        })
        .join('\n');

    return `
💰 <b>LAPORAN SETORAN COD</b>
━━━━━━━━━━━━━━━━━━━━━━━
📅 ${formatDate(date)}

👛 <b>RINGKASAN</b>
━━━━━━━━━━━━━━━━━━
💵 Total COD Hari Ini  : ${formatCurrency(totalCOD)}
✅ Sudah Disetor       : ${formatCurrency(collected)}
⏳ Belum Disetor       : ${formatCurrency(pending)}

👥 <b>DETAIL PER KURIR</b>
━━━━━━━━━━━━━━━━━━
${kurirDetails || 'Belum ada data'}

━━━━━━━━━━━━━━━━━━━━━━━`;
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
    return `
🏠 <b>MENU KURIR RAYO</b>
━━━━━━━━━━━━━━━━━━━━━━━━

👤 Halo, <b>${escapeHtml(kurir.name)}</b>!
📊 Status: ${kurir.isOnline ? '🟢 Online' : '🔴 Offline'}

📈 <b>Statistik Hari Ini:</b>
• Order Selesai: <b>${todayOrders}</b>
• Pendapatan: <b>${formatCurrency(todayEarnings)}</b>
• COD Belum Setor: <b>${formatCurrency(pendingCOD)}</b>

━━━━━━━━━━━━━━━━━━━━━━━━

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
        .map((o) => `   • ${o.orderNumber}: ${formatCurrency(o.amount)}`)
        .join('\n');

    return `
👛 <b>DOMPET KURIR</b>
━━━━━━━━━━━━━━━━━

👤 Nama: <b>${escapeHtml(kurir.name)}</b>
📅 Hari ini: ${formatDate(new Date())}

💰 <b>COD Belum Setor:</b> ${formatCurrency(pendingCOD)}
${pendingList || '   Tidak ada'}

📊 <b>Statistik Hari Ini:</b>
   • Order Selesai: ${todayOrders}
   • Total Ongkir: ${formatCurrency(todayEarnings)}
   • Bonus Express: ${formatCurrency(bonus)}

━━━━━━━━━━━━━━━━━
💵 Total Pendapatan: <b>${formatCurrency(todayEarnings + bonus)}</b>
━━━━━━━━━━━━━━━━━`;
}

// Status update confirmation
export function getStatusUpdateConfirmation(order: Order, newStatus: OrderStatusType): string {
    return `
✅ <b>STATUS DIUPDATE!</b>
━━━━━━━━━━━━━━━━━━━━

🆔 Order: <code>${order.orderNumber}</code>
${StatusEmoji[newStatus]} Status: <b>${StatusLabel[newStatus]}</b>

${newStatus === 'SELESAI' ? '🎉 Terima kasih! Order sudah selesai.' : ''}
${newStatus === 'GAGAL' ? '⚠️ Order gagal diantar. Admin akan menghubungi customer.' : ''}

━━━━━━━━━━━━━━━━━━━━`;
}

// Help message for kurir
export function getKurirHelpMessage(): string {
    return `
❓ <b>PANDUAN KURIR RAYO</b>
━━━━━━━━━━━━━━━━━━━━━━━━

📋 <b>Cara Terima Tugas:</b>
1. Pastikan status <b>Online</b>
2. Notifikasi tugas baru akan masuk
3. Klik <b>Terima</b> untuk ambil tugas

🚚 <b>Alur Pengiriman:</b>
1. <b>OTW Pickup</b> - Perjalanan ke mitra
2. <b>Barang Diambil</b> - Upload foto barang
3. <b>OTW Customer</b> - Perjalanan ke customer
4. <b>Selesai</b> - Upload bukti serah terima

💰 <b>COD & Setoran:</b>
• Collect COD dari customer
• Setor ke admin setiap hari
• Cek saldo di menu <b>Dompet</b>

📞 <b>Butuh Bantuan?</b>
Hubungi Admin: wa.me/6281234567890

━━━━━━━━━━━━━━━━━━━━━━━━`;
}
