// Admin Bot Webhook Handler
// Handles all incoming updates for the Admin Telegram Bot

import { NextRequest, NextResponse } from 'next/server';
import {
    sendTelegramMessage,
    answerCallbackQuery,
    editMessageText,
    getAdminBotToken,
    getAdminChatId,
    formatCurrency,
    formatDate,
    formatTime,
} from '@/lib/telegram/utils';
import {
    getAdminMainMenu,
    getOrderActions,
    getKurirListKeyboard,
    getReportsMenu,
    getConfirmKeyboard,
    getBackButton,
} from '@/lib/telegram/keyboards';
import {
    getAdminWelcomeMessage,
    getNewOrderNotification,
    getOrderAssignedMessage,
    getDailyReportMessage,
    getCODReportMessage,
} from '@/lib/telegram/messages';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Telegram update types
interface TelegramUpdate {
    update_id: number;
    message?: {
        message_id: number;
        from: { id: number; first_name: string; username?: string };
        chat: { id: number; type: string };
        date: number;
        text?: string;
    };
    callback_query?: {
        id: string;
        from: { id: number; first_name: string; username?: string };
        message: {
            message_id: number;
            chat: { id: number };
        };
        data: string;
    };
}

// POST handler for webhook
export async function POST(request: NextRequest) {
    try {
        const update: TelegramUpdate = await request.json();
        const botToken = getAdminBotToken();
        const adminChatId = getAdminChatId();

        // Handle text messages
        if (update.message?.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text;
            const userId = update.message.from.id;

            // Only allow admin
            if (chatId.toString() !== adminChatId) {
                await sendTelegramMessage(botToken, chatId, '⛔ Akses ditolak. Bot ini hanya untuk Admin.');
                return NextResponse.json({ ok: true });
            }

            // Handle commands
            if (text === '/start' || text === '/menu') {
                const stats = await getDailyStats();
                await sendTelegramMessage(
                    botToken,
                    chatId,
                    getAdminWelcomeMessage(stats),
                    { reply_markup: getAdminMainMenu() }
                );
            } else if (text === '/orders') {
                await handleOrdersCommand(chatId);
            } else if (text === '/report' || text === '/daily') {
                await handleDailyReport(chatId);
            } else if (text === '/cod') {
                await handleCODReport(chatId);
            } else if (text === '/kurir' || text === '/drivers') {
                await handleKurirListCommand(chatId);
            } else if (text === '/help') {
                await sendTelegramMessage(
                    botToken,
                    chatId,
                    `📋 <b>PERINTAH ADMIN BOT</b>\n\n` +
                    `/start - Menu utama\n` +
                    `/orders - Lihat pesanan baru\n` +
                    `/report - Laporan harian\n` +
                    `/cod - Laporan setoran COD\n` +
                    `/kurir - Kelola kurir\n` +
                    `/broadcast - Kirim pesan ke semua kurir\n` +
                    `/help - Bantuan`
                );
            }
        }

        // Handle callback queries (button clicks)
        if (update.callback_query) {
            const callbackId = update.callback_query.id;
            const chatId = update.callback_query.message.chat.id;
            const messageId = update.callback_query.message.message_id;
            const data = update.callback_query.data;

            // Acknowledge callback
            await answerCallbackQuery(botToken, callbackId);

            // Route callback
            await handleCallback(chatId, messageId, data);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Admin webhook error:', error);
        return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
    }
}

// Handle callback queries
async function handleCallback(chatId: number, messageId: number, data: string) {
    const botToken = getAdminBotToken();

    // Main menu
    if (data === 'admin_menu' || data === 'admin_refresh') {
        const stats = await getDailyStats();
        await editMessageText(
            botToken,
            chatId,
            messageId,
            getAdminWelcomeMessage(stats),
            { reply_markup: getAdminMainMenu() }
        );
    }

    // Orders
    else if (data === 'admin_orders_new') {
        await handleOrdersCallback(chatId, messageId, 'MENUNGGU');
    }
    else if (data === 'admin_orders_active') {
        await handleOrdersCallback(chatId, messageId, 'active');
    }
    else if (data === 'admin_orders_done') {
        await handleOrdersCallback(chatId, messageId, 'SELESAI');
    }

    // Assign kurir
    else if (data === 'admin_assign') {
        await handleAssignMenu(chatId, messageId);
    }
    else if (data.startsWith('assign_')) {
        const orderId = data.replace('assign_', '');
        await handleAssignOrder(chatId, messageId, orderId);
    }
    else if (data.startsWith('assignto_')) {
        const [, orderId, kurirId] = data.split('_');
        await handleAssignToKurir(chatId, messageId, orderId, kurirId);
    }

    // Reports
    else if (data === 'admin_reports') {
        await editMessageText(
            botToken,
            chatId,
            messageId,
            '📈 <b>MENU LAPORAN</b>\n\nPilih jenis laporan:',
            { reply_markup: getReportsMenu() }
        );
    }
    else if (data === 'report_daily') {
        await handleDailyReportCallback(chatId, messageId);
    }
    else if (data === 'report_cod') {
        await handleCODReportCallback(chatId, messageId);
    }

    // Kurir management
    else if (data === 'admin_kurir') {
        await handleKurirManagement(chatId, messageId);
    }

    // COD
    else if (data === 'admin_cod') {
        await handleCODReportCallback(chatId, messageId);
    }

    // Mitra
    else if (data === 'admin_mitra') {
        await handleMitraManagement(chatId, messageId);
    }

    // Order detail
    else if (data.startsWith('detail_')) {
        const orderId = data.replace('detail_', '');
        await handleOrderDetail(chatId, messageId, orderId);
    }

    // Reject order
    else if (data.startsWith('reject_')) {
        const orderId = data.replace('reject_', '');
        await handleRejectOrder(chatId, messageId, orderId);
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get daily statistics
async function getDailyStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // For now, return mock data - will connect to real DB later
    return {
        ordersNew: 15,
        ordersActive: 8,
        ordersDone: 23,
        ordersCancelled: 2,
        totalRevenue: 1250000,
        totalCOD: 4500000,
        codCollected: 3200000,
        codPending: 1300000,
    };
}

// Handle orders command
async function handleOrdersCommand(chatId: number) {
    const botToken = getAdminBotToken();

    // Fetch new orders from database
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'MENUNGGU')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error || !orders?.length) {
        await sendTelegramMessage(
            botToken,
            chatId,
            '📦 <b>Tidak ada pesanan baru saat ini</b>\n\nSemua pesanan sudah diproses! 🎉',
            { reply_markup: getBackButton('admin_menu') }
        );
        return;
    }

    for (const order of orders) {
        const orderData = {
            id: order.id,
            orderNumber: order.order_number,
            mitraName: order.mitra_name || 'Mitra',
            mitraAddress: order.pickup_address || '',
            customerName: order.customer_name,
            customerPhone: order.customer_phone,
            customerAddress: order.customer_address,
            items: order.items || [],
            subtotal: order.subtotal,
            deliveryFee: order.delivery_fee,
            total: order.total,
            codAmount: order.cod_amount,
            notes: order.notes,
            status: order.status,
            createdAt: new Date(order.created_at),
        };

        await sendTelegramMessage(
            botToken,
            chatId,
            getNewOrderNotification(orderData),
            { reply_markup: getOrderActions(order.id) }
        );
    }
}

// Handle orders callback (list by status)
async function handleOrdersCallback(chatId: number, messageId: number, status: string) {
    const botToken = getAdminBotToken();

    let statusFilter = status;
    if (status === 'active') {
        statusFilter = 'PICKUP_OTW,BARANG_DIAMBIL,DIKIRIM';
    }

    // Mock response for now
    await editMessageText(
        botToken,
        chatId,
        messageId,
        `📦 <b>DAFTAR ORDER (${status})</b>\n\n` +
        `Belum ada order dengan status ${status}.\n` +
        `Silakan cek kembali nanti.`,
        { reply_markup: getBackButton('admin_menu') }
    );
}

// Handle assign menu
async function handleAssignMenu(chatId: number, messageId: number) {
    const botToken = getAdminBotToken();

    // Fetch pending orders
    const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'MENUNGGU')
        .is('kurir_id', null)
        .limit(10);

    if (!orders?.length) {
        await editMessageText(
            botToken,
            chatId,
            messageId,
            '📦 <b>Tidak ada order menunggu assign</b>\n\nSemua order sudah di-assign ke kurir! 🎉',
            { reply_markup: getBackButton('admin_menu') }
        );
        return;
    }

    const orderButtons = orders.map((order) => [
        {
            text: `📦 ${order.order_number} - ${order.customer_name}`,
            callback_data: `assign_${order.id}`,
        },
    ]);
    orderButtons.push([{ text: '← Kembali', callback_data: 'admin_menu' }]);

    await editMessageText(
        botToken,
        chatId,
        messageId,
        `🚚 <b>ASSIGN KURIR</b>\n\nPilih order untuk di-assign:`,
        { reply_markup: { inline_keyboard: orderButtons } }
    );
}

// Handle assign order to show kurir list
async function handleAssignOrder(chatId: number, messageId: number, orderId: string) {
    const botToken = getAdminBotToken();

    // Fetch available kurir
    const { data: kurirList } = await supabase
        .from('kurir')
        .select('*')
        .eq('is_active', true)
        .order('is_online', { ascending: false });

    if (!kurirList?.length) {
        await editMessageText(
            botToken,
            chatId,
            messageId,
            '❌ <b>Tidak ada kurir tersedia</b>\n\nSilakan tambah kurir terlebih dahulu.',
            { reply_markup: getBackButton('admin_menu') }
        );
        return;
    }

    const formattedKurir = kurirList.map((k) => ({
        id: k.id,
        name: k.name,
        ordersCount: k.active_orders || 0,
        isOnline: k.is_online,
    }));

    await editMessageText(
        botToken,
        chatId,
        messageId,
        `🚚 <b>PILIH KURIR</b>\n\nKlik nama kurir untuk assign order:`,
        { reply_markup: getKurirListKeyboard(formattedKurir, orderId) }
    );
}

// Handle actual assignment
async function handleAssignToKurir(chatId: number, messageId: number, orderId: string, kurirId: string) {
    const botToken = getAdminBotToken();

    // Update order with kurir
    const { error } = await supabase
        .from('orders')
        .update({
            kurir_id: kurirId,
            status: 'PICKUP_OTW',
            updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

    if (error) {
        await editMessageText(
            botToken,
            chatId,
            messageId,
            '❌ <b>Gagal assign kurir</b>\n\nTerjadi kesalahan, silakan coba lagi.',
            { reply_markup: getBackButton('admin_menu') }
        );
        return;
    }

    // Get kurir info for notification
    const { data: kurir } = await supabase
        .from('kurir')
        .select('*')
        .eq('id', kurirId)
        .single();

    // TODO: Send notification to kurir bot

    await editMessageText(
        botToken,
        chatId,
        messageId,
        `✅ <b>ORDER BERHASIL DI-ASSIGN!</b>\n\n` +
        `🚚 Kurir: <b>${kurir?.name || 'Unknown'}</b>\n` +
        `📱 HP: ${kurir?.phone || '-'}\n\n` +
        `Notifikasi sudah dikirim ke kurir.`,
        { reply_markup: getBackButton('admin_menu') }
    );
}

// Handle daily report
async function handleDailyReport(chatId: number) {
    const botToken = getAdminBotToken();
    const stats = await getDailyStats();

    const topKurir = [
        { name: 'Budi Santoso', orders: 15, revenue: 225000 },
        { name: 'Sari Wulandari', orders: 12, revenue: 180000 },
        { name: 'Anton Wijaya', orders: 10, revenue: 150000 },
    ];

    const topMitra = [
        { name: 'Warung Madura Pak Joko', orders: 12 },
        { name: 'Kopi Kenangan', orders: 8 },
        { name: 'Apotek Sehat', orders: 6 },
    ];

    await sendTelegramMessage(
        botToken,
        chatId,
        getDailyReportMessage(new Date(), stats, topKurir, topMitra),
        { reply_markup: getBackButton('admin_menu') }
    );
}

// Handle daily report callback (edit message)
async function handleDailyReportCallback(chatId: number, messageId: number) {
    const botToken = getAdminBotToken();
    const stats = await getDailyStats();

    const topKurir = [
        { name: 'Budi Santoso', orders: 15, revenue: 225000 },
        { name: 'Sari Wulandari', orders: 12, revenue: 180000 },
        { name: 'Anton Wijaya', orders: 10, revenue: 150000 },
    ];

    const topMitra = [
        { name: 'Warung Madura Pak Joko', orders: 12 },
        { name: 'Kopi Kenangan', orders: 8 },
        { name: 'Apotek Sehat', orders: 6 },
    ];

    await editMessageText(
        botToken,
        chatId,
        messageId,
        getDailyReportMessage(new Date(), stats, topKurir, topMitra),
        { reply_markup: getBackButton('admin_reports') }
    );
}

// Handle COD report
async function handleCODReport(chatId: number) {
    const botToken = getAdminBotToken();

    const kurirCOD = [
        { name: 'Budi Santoso', collected: 1500000, setor: 1050000, pending: 450000, orders: 3 },
        { name: 'Sari Wulandari', collected: 1200000, setor: 1200000, pending: 0, orders: 0 },
        { name: 'Anton Wijaya', collected: 1000000, setor: 500000, pending: 500000, orders: 2 },
    ];

    await sendTelegramMessage(
        botToken,
        chatId,
        getCODReportMessage(new Date(), 3700000, 2750000, 950000, kurirCOD),
        { reply_markup: getBackButton('admin_menu') }
    );
}

// Handle COD report callback
async function handleCODReportCallback(chatId: number, messageId: number) {
    const botToken = getAdminBotToken();

    const kurirCOD = [
        { name: 'Budi Santoso', collected: 1500000, setor: 1050000, pending: 450000, orders: 3 },
        { name: 'Sari Wulandari', collected: 1200000, setor: 1200000, pending: 0, orders: 0 },
        { name: 'Anton Wijaya', collected: 1000000, setor: 500000, pending: 500000, orders: 2 },
    ];

    await editMessageText(
        botToken,
        chatId,
        messageId,
        getCODReportMessage(new Date(), 3700000, 2750000, 950000, kurirCOD),
        { reply_markup: getBackButton('admin_menu') }
    );
}

// Handle kurir management
async function handleKurirManagement(chatId: number, messageId: number) {
    const botToken = getAdminBotToken();

    const { data: kurirList } = await supabase
        .from('kurir')
        .select('*')
        .eq('is_active', true);

    if (!kurirList?.length) {
        await editMessageText(
            botToken,
            chatId,
            messageId,
            '👥 <b>KELOLA KURIR</b>\n\nBelum ada kurir terdaftar.',
            { reply_markup: getBackButton('admin_menu') }
        );
        return;
    }

    const kurirInfo = kurirList
        .map((k) => `${k.is_online ? '🟢' : '🔴'} <b>${k.name}</b>\n   📱 ${k.phone} | ⭐ ${k.rating || 5.0}`)
        .join('\n\n');

    await editMessageText(
        botToken,
        chatId,
        messageId,
        `👥 <b>DAFTAR KURIR</b>\n\n${kurirInfo}`,
        { reply_markup: getBackButton('admin_menu') }
    );
}

// Handle kurir list command (sends new message)
async function handleKurirListCommand(chatId: number) {
    const botToken = getAdminBotToken();

    const { data: kurirList } = await supabase
        .from('kurir')
        .select('*')
        .eq('is_active', true);

    if (!kurirList?.length) {
        await sendTelegramMessage(
            botToken,
            chatId,
            '👥 <b>KELOLA KURIR</b>\n\nBelum ada kurir terdaftar.',
            { reply_markup: getBackButton('admin_menu') }
        );
        return;
    }

    const kurirInfo = kurirList
        .map((k) => `${k.is_online ? '🟢' : '🔴'} <b>${k.name}</b>\n   📱 ${k.phone} | ⭐ ${k.rating || 5.0}`)
        .join('\n\n');

    await sendTelegramMessage(
        botToken,
        chatId,
        `👥 <b>DAFTAR KURIR</b>\n\n${kurirInfo}`,
        { reply_markup: getBackButton('admin_menu') }
    );
}

// Handle mitra management
async function handleMitraManagement(chatId: number, messageId: number) {
    const botToken = getAdminBotToken();

    const { data: mitraList } = await supabase
        .from('mitra')
        .select('*')
        .limit(10);

    if (!mitraList?.length) {
        await editMessageText(
            botToken,
            chatId,
            messageId,
            '🏪 <b>KELOLA MITRA</b>\n\nBelum ada mitra terdaftar.',
            { reply_markup: getBackButton('admin_menu') }
        );
        return;
    }

    const mitraInfo = mitraList
        .map((m) => `${m.is_open ? '🟢' : '🔴'} <b>${m.name}</b>\n   📍 ${m.address || '-'}`)
        .join('\n\n');

    await editMessageText(
        botToken,
        chatId,
        messageId,
        `🏪 <b>DAFTAR MITRA</b>\n\n${mitraInfo}`,
        { reply_markup: getBackButton('admin_menu') }
    );
}

// Handle order detail
async function handleOrderDetail(chatId: number, messageId: number, orderId: string) {
    const botToken = getAdminBotToken();

    const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (!order) {
        await editMessageText(
            botToken,
            chatId,
            messageId,
            '❌ Order tidak ditemukan',
            { reply_markup: getBackButton('admin_menu') }
        );
        return;
    }

    await editMessageText(
        botToken,
        chatId,
        messageId,
        `📦 <b>DETAIL ORDER</b>\n\n` +
        `🆔 ${order.order_number}\n` +
        `👤 ${order.customer_name}\n` +
        `📍 ${order.customer_address}\n` +
        `📱 ${order.customer_phone}\n\n` +
        `💰 Total: ${formatCurrency(order.total)}\n` +
        `📊 Status: ${order.status}`,
        { reply_markup: getOrderActions(orderId) }
    );
}

// Handle reject order
async function handleRejectOrder(chatId: number, messageId: number, orderId: string) {
    const botToken = getAdminBotToken();

    await supabase
        .from('orders')
        .update({ status: 'BATAL', updated_at: new Date().toISOString() })
        .eq('id', orderId);

    await editMessageText(
        botToken,
        chatId,
        messageId,
        '❌ <b>ORDER DIBATALKAN</b>\n\nOrder telah dibatalkan.',
        { reply_markup: getBackButton('admin_menu') }
    );
}

// GET handler (for testing)
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        bot: 'Admin Bot',
        message: 'Webhook is active',
    });
}
