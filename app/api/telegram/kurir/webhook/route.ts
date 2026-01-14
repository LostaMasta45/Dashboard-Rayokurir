// Kurir Bot Webhook Handler
// Handles all incoming updates for the Kurir Telegram Bot

import { NextRequest, NextResponse } from 'next/server';
import {
    sendTelegramMessage,
    answerCallbackQuery,
    editMessageText,
    getKurirBotToken,
    getAdminBotToken,
    getAdminChatId,
    formatCurrency,
    StatusEmoji,
    StatusLabel,
    OrderStatus,
    OrderStatusType,
} from '@/lib/telegram/utils';
import {
    getKurirMainMenu,
    getTaskActions,
    getStatusUpdateKeyboard,
    getWalletKeyboard,
    getBackButton,
    getPaginationKeyboard,
} from '@/lib/telegram/keyboards';
import {
    getKurirWelcomeMessage,
    getNewTaskNotification,
    getTaskDetailMessage,
    getWalletMessage,
    getStatusUpdateConfirmation,
    getKurirHelpMessage,
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
        photo?: Array<{ file_id: string; file_unique_id: string; width: number; height: number }>;
        caption?: string;
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

// User state for tracking context (e.g., waiting for photo upload)
const userState: Map<number, { action: string; orderId?: string }> = new Map();

// POST handler for webhook
export async function POST(request: NextRequest) {
    try {
        const update: TelegramUpdate = await request.json();
        const botToken = getKurirBotToken();

        // Handle photo messages (for proof uploads)
        if (update.message?.photo) {
            const chatId = update.message.chat.id;
            const userId = update.message.from.id;
            const photos = update.message.photo;
            const largestPhoto = photos[photos.length - 1]; // Get highest resolution

            await handlePhotoUpload(chatId, userId, largestPhoto.file_id);
            return NextResponse.json({ ok: true });
        }

        // Handle text messages
        if (update.message?.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text;
            const userId = update.message.from.id;
            const firstName = update.message.from.first_name;

            // Handle commands
            if (text === '/start') {
                await handleStart(chatId, userId, firstName);
            } else if (text === '/menu') {
                await handleMenu(chatId, userId);
            } else if (text === '/tugas' || text === '/tasks') {
                await handleTasks(chatId, userId);
            } else if (text === '/dompet' || text === '/wallet') {
                await handleWallet(chatId, userId);
            } else if (text === '/online') {
                await handleOnlineStatus(chatId, userId, true);
            } else if (text === '/offline') {
                await handleOnlineStatus(chatId, userId, false);
            } else if (text === '/history' || text === '/riwayat') {
                await handleHistory(chatId, userId);
            } else if (text === '/help') {
                await sendTelegramMessage(botToken, chatId, getKurirHelpMessage());
            } else if (text === '/daftar' || text === '/register') {
                await handleRegister(chatId, userId, firstName);
            }
        }

        // Handle callback queries (button clicks)
        if (update.callback_query) {
            const callbackId = update.callback_query.id;
            const chatId = update.callback_query.message.chat.id;
            const messageId = update.callback_query.message.message_id;
            const userId = update.callback_query.from.id;
            const data = update.callback_query.data;

            // Acknowledge callback
            await answerCallbackQuery(botToken, callbackId);

            // Route callback
            await handleCallback(chatId, messageId, userId, data);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Kurir webhook error:', error);
        return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
    }
}

// ============================================
// MESSAGE HANDLERS
// ============================================

// Handle /start command
async function handleStart(chatId: number, telegramId: number, firstName: string) {
    const botToken = getKurirBotToken();

    // Check if kurir is registered
    const { data: kurir } = await supabase
        .from('kurir')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();

    if (!kurir) {
        // Not registered - prompt to register
        await sendTelegramMessage(
            botToken,
            chatId,
            `👋 Halo <b>${firstName}</b>!\n\n` +
            `Selamat datang di <b>Bot Kurir Rayo</b>.\n\n` +
            `Anda belum terdaftar sebagai kurir.\n` +
            `Silakan hubungi Admin untuk mendaftar.\n\n` +
            `📱 Admin: wa.me/6281234567890\n\n` +
            `Setelah didaftarkan, ketik /start lagi.`
        );
        return;
    }

    // Registered - show main menu
    const stats = await getKurirStats(kurir.id);

    const kurirData = {
        id: kurir.id,
        name: kurir.name,
        phone: kurir.phone,
        isOnline: kurir.is_online,
        totalOrders: kurir.total_orders || 0,
        rating: kurir.rating || 5.0,
    };

    await sendTelegramMessage(
        botToken,
        chatId,
        getKurirWelcomeMessage(kurirData, stats.todayOrders, stats.todayEarnings, stats.pendingCOD),
        { reply_markup: getKurirMainMenu(kurir.is_online) }
    );
}

// Handle /menu command
async function handleMenu(chatId: number, telegramId: number) {
    const botToken = getKurirBotToken();

    const { data: kurir } = await supabase
        .from('kurir')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();

    if (!kurir) {
        await sendTelegramMessage(
            botToken,
            chatId,
            '⛔ Anda belum terdaftar. Ketik /start untuk info pendaftaran.'
        );
        return;
    }

    const stats = await getKurirStats(kurir.id);
    const kurirData = {
        id: kurir.id,
        name: kurir.name,
        phone: kurir.phone,
        isOnline: kurir.is_online,
        totalOrders: kurir.total_orders || 0,
        rating: kurir.rating || 5.0,
    };

    await sendTelegramMessage(
        botToken,
        chatId,
        getKurirWelcomeMessage(kurirData, stats.todayOrders, stats.todayEarnings, stats.pendingCOD),
        { reply_markup: getKurirMainMenu(kurir.is_online) }
    );
}

// Handle /tugas command
async function handleTasks(chatId: number, telegramId: number) {
    const botToken = getKurirBotToken();

    const { data: kurir } = await supabase
        .from('kurir')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();

    if (!kurir) return;

    const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('kurir_id', kurir.id)
        .in('status', ['PICKUP_OTW', 'BARANG_DIAMBIL', 'DIKIRIM'])
        .order('created_at', { ascending: false });

    if (!orders?.length) {
        await sendTelegramMessage(
            botToken,
            chatId,
            '📋 <b>TUGAS SAYA</b>\n\nTidak ada tugas aktif saat ini.\n\nTunggu notifikasi tugas baru! 🔔',
            { reply_markup: getBackButton('kurir_menu') }
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
            status: order.status as OrderStatusType,
            createdAt: new Date(order.created_at),
        };

        await sendTelegramMessage(
            botToken,
            chatId,
            getTaskDetailMessage(orderData),
            { reply_markup: getStatusUpdateKeyboard(order.id, order.status) }
        );
    }
}

// Handle /dompet command
async function handleWallet(chatId: number, telegramId: number) {
    const botToken = getKurirBotToken();

    const { data: kurir } = await supabase
        .from('kurir')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();

    if (!kurir) return;

    const stats = await getKurirStats(kurir.id);

    // Get pending COD orders
    const { data: pendingOrders } = await supabase
        .from('orders')
        .select('order_number, cod_amount')
        .eq('kurir_id', kurir.id)
        .eq('status', 'SELESAI')
        .eq('cod_collected', false);

    const pending = pendingOrders?.map((o) => ({
        orderNumber: o.order_number,
        amount: o.cod_amount || 0,
    })) || [];

    const kurirData = {
        id: kurir.id,
        name: kurir.name,
        phone: kurir.phone,
        isOnline: kurir.is_online,
        totalOrders: kurir.total_orders || 0,
        rating: kurir.rating || 5.0,
    };

    await sendTelegramMessage(
        botToken,
        chatId,
        getWalletMessage(kurirData, stats.pendingCOD, pending, stats.todayEarnings, stats.todayOrders, 0),
        { reply_markup: getWalletKeyboard() }
    );
}

// Handle online/offline status
async function handleOnlineStatus(chatId: number, telegramId: number, isOnline: boolean) {
    const botToken = getKurirBotToken();

    const { error } = await supabase
        .from('kurir')
        .update({ is_online: isOnline, updated_at: new Date().toISOString() })
        .eq('telegram_id', telegramId);

    if (error) {
        await sendTelegramMessage(botToken, chatId, '❌ Gagal mengubah status. Coba lagi.');
        return;
    }

    await sendTelegramMessage(
        botToken,
        chatId,
        isOnline
            ? '🟢 <b>Status: ONLINE</b>\n\nAnda sekarang akan menerima notifikasi tugas baru!'
            : '🔴 <b>Status: OFFLINE</b>\n\nAnda tidak akan menerima tugas baru.',
        { reply_markup: getBackButton('kurir_menu') }
    );
}

// Handle history
async function handleHistory(chatId: number, telegramId: number, page: number = 1) {
    const botToken = getKurirBotToken();
    const limit = 5;
    const offset = (page - 1) * limit;

    const { data: kurir } = await supabase
        .from('kurir')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();

    if (!kurir) return;

    const { data: orders, count } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('kurir_id', kurir.id)
        .in('status', ['SELESAI', 'GAGAL'])
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (!orders?.length) {
        await sendTelegramMessage(
            botToken,
            chatId,
            '📊 <b>RIWAYAT</b>\n\nBelum ada riwayat pengiriman.',
            { reply_markup: getBackButton('kurir_menu') }
        );
        return;
    }

    const historyList = orders
        .map((o) => {
            const emoji = o.status === 'SELESAI' ? '✅' : '❌';
            return `${emoji} <code>${o.order_number}</code>\n   ${o.customer_name} - ${formatCurrency(o.total)}`;
        })
        .join('\n\n');

    const totalPages = Math.ceil((count || 0) / limit);

    await sendTelegramMessage(
        botToken,
        chatId,
        `📊 <b>RIWAYAT PENGIRIMAN</b>\n\n${historyList}`,
        { reply_markup: getPaginationKeyboard(page, totalPages, 'history') }
    );
}

// Handle registration (for future use)
async function handleRegister(chatId: number, telegramId: number, firstName: string) {
    const botToken = getKurirBotToken();

    // Check if already registered
    const { data: existing } = await supabase
        .from('kurir')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();

    if (existing) {
        await sendTelegramMessage(
            botToken,
            chatId,
            '✅ Anda sudah terdaftar sebagai kurir!\n\nKetik /menu untuk melihat menu.'
        );
        return;
    }

    await sendTelegramMessage(
        botToken,
        chatId,
        `📝 <b>PENDAFTARAN KURIR</b>\n\n` +
        `Halo ${firstName}!\n\n` +
        `Untuk mendaftar sebagai kurir Rayo, silakan hubungi Admin:\n\n` +
        `📱 WhatsApp: wa.me/6281234567890\n\n` +
        `Sebutkan:\n` +
        `• Nama lengkap\n` +
        `• Nomor HP\n` +
        `• Domisili\n` +
        `• Telegram ID: <code>${telegramId}</code>`
    );
}

// Handle photo upload
async function handlePhotoUpload(chatId: number, userId: number, fileId: string) {
    const botToken = getKurirBotToken();
    const state = userState.get(userId);

    if (!state || !state.orderId) {
        await sendTelegramMessage(
            botToken,
            chatId,
            '📸 Foto diterima!\n\nUntuk upload bukti pengiriman, pilih order terlebih dahulu dari menu Tugas.'
        );
        return;
    }

    // Save photo to order (in real implementation, would upload to storage first)
    const { error } = await supabase
        .from('orders')
        .update({
            proof_photos: [fileId], // In real app, would be array of photo URLs
            updated_at: new Date().toISOString(),
        })
        .eq('id', state.orderId);

    // Clear user state
    userState.delete(userId);

    if (error) {
        await sendTelegramMessage(botToken, chatId, '❌ Gagal menyimpan foto. Coba lagi.');
        return;
    }

    // Notify admin
    const adminBotToken = getAdminBotToken();
    const adminChatId = getAdminChatId();

    const { data: order } = await supabase
        .from('orders')
        .select('order_number')
        .eq('id', state.orderId)
        .single();

    await sendTelegramMessage(
        adminBotToken,
        adminChatId,
        `📸 <b>BUKTI FOTO DITERIMA</b>\n\n` +
        `Order: <code>${order?.order_number}</code>\n` +
        `Kurir telah mengupload bukti pengiriman.`
    );

    await sendTelegramMessage(
        botToken,
        chatId,
        '✅ <b>BUKTI DITERIMA!</b>\n\nFoto tersimpan. Silakan update status order.',
        { reply_markup: getBackButton('kurir_tasks') }
    );
}

// ============================================
// CALLBACK HANDLERS
// ============================================

async function handleCallback(chatId: number, messageId: number, userId: number, data: string) {
    const botToken = getKurirBotToken();

    // Get kurir info
    const { data: kurir } = await supabase
        .from('kurir')
        .select('*')
        .eq('telegram_id', userId)
        .single();

    if (!kurir && data !== 'noop') {
        await sendTelegramMessage(botToken, chatId, '⛔ Anda belum terdaftar.');
        return;
    }

    // Main menu
    if (data === 'kurir_menu') {
        const stats = await getKurirStats(kurir.id);
        const kurirData = {
            id: kurir.id,
            name: kurir.name,
            phone: kurir.phone,
            isOnline: kurir.is_online,
            totalOrders: kurir.total_orders || 0,
            rating: kurir.rating || 5.0,
        };

        await editMessageText(
            botToken,
            chatId,
            messageId,
            getKurirWelcomeMessage(kurirData, stats.todayOrders, stats.todayEarnings, stats.pendingCOD),
            { reply_markup: getKurirMainMenu(kurir.is_online) }
        );
    }

    // Tasks
    else if (data === 'kurir_tasks') {
        await handleTasksCallback(chatId, messageId, kurir.id);
    }

    // History
    else if (data === 'kurir_history' || data.startsWith('history_page_')) {
        const page = data.startsWith('history_page_') ? parseInt(data.split('_')[2]) : 1;
        await handleHistoryCallback(chatId, messageId, kurir.id, page);
    }

    // Wallet
    else if (data === 'kurir_wallet') {
        await handleWalletCallback(chatId, messageId, kurir);
    }

    // Online/Offline toggle
    else if (data === 'kurir_online' || data === 'kurir_offline') {
        const isOnline = data === 'kurir_online';
        await handleOnlineToggle(chatId, messageId, kurir, isOnline);
    }

    // Help
    else if (data === 'kurir_help') {
        await editMessageText(
            botToken,
            chatId,
            messageId,
            getKurirHelpMessage(),
            { reply_markup: getBackButton('kurir_menu') }
        );
    }

    // Stats
    else if (data === 'kurir_stats') {
        await handleStatsCallback(chatId, messageId, kurir);
    }

    // Accept task
    else if (data.startsWith('accept_')) {
        const orderId = data.replace('accept_', '');
        await handleAcceptTask(chatId, messageId, kurir, orderId);
    }

    // Decline task
    else if (data.startsWith('decline_')) {
        const orderId = data.replace('decline_', '');
        await handleDeclineTask(chatId, messageId, orderId);
    }

    // Status update
    else if (data.startsWith('status_')) {
        const [, orderId, newStatus] = data.split('_');
        await handleStatusUpdate(chatId, messageId, orderId, newStatus as OrderStatusType);
    }

    // Upload photo
    else if (data.startsWith('upload_')) {
        const orderId = data.replace('upload_', '');
        userState.set(userId, { action: 'upload_proof', orderId });

        await editMessageText(
            botToken,
            chatId,
            messageId,
            `📸 <b>UPLOAD BUKTI FOTO</b>\n\n` +
            `Kirim foto bukti pengiriman untuk order ini.\n\n` +
            `Cukup kirim foto ke chat ini 📷`,
            { reply_markup: getBackButton('kurir_tasks') }
        );
    }

    // Navigate to pickup
    else if (data.startsWith('navigate_pickup_')) {
        const orderId = data.replace('navigate_pickup_', '');
        const { data: order } = await supabase
            .from('orders')
            .select('pickup_address')
            .eq('id', orderId)
            .single();

        if (order) {
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.pickup_address)}`;
            await sendTelegramMessage(
                botToken,
                chatId,
                `📍 <b>NAVIGASI KE PICKUP</b>\n\n` +
                `Alamat: ${order.pickup_address}\n\n` +
                `🗺️ Buka di Google Maps:\n${mapsUrl}`
            );
        }
    }

    // Call customer
    else if (data.startsWith('call_customer_')) {
        const orderId = data.replace('call_customer_', '');
        const { data: order } = await supabase
            .from('orders')
            .select('customer_name, customer_phone')
            .eq('id', orderId)
            .single();

        if (order) {
            await sendTelegramMessage(
                botToken,
                chatId,
                `📞 <b>HUBUNGI CUSTOMER</b>\n\n` +
                `👤 ${order.customer_name}\n` +
                `📱 ${order.customer_phone}\n\n` +
                `💬 WhatsApp: wa.me/${order.customer_phone.replace(/\D/g, '')}`
            );
        }
    }

    // Wallet setor
    else if (data === 'wallet_setor') {
        await editMessageText(
            botToken,
            chatId,
            messageId,
            `💳 <b>SETOR COD</b>\n\n` +
            `Untuk setor COD, silakan transfer ke:\n\n` +
            `🏦 Bank BCA\n` +
            `📝 No. Rek: 1234567890\n` +
            `👤 A/N: Rayo Kurir\n\n` +
            `Setelah transfer, kirim bukti ke Admin via WhatsApp.`,
            { reply_markup: getBackButton('kurir_wallet') }
        );
    }

    // Wallet history
    else if (data === 'wallet_history') {
        await editMessageText(
            botToken,
            chatId,
            messageId,
            `📜 <b>RIWAYAT SETORAN</b>\n\n` +
            `Fitur ini akan segera tersedia.\n` +
            `Sementara, hubungi Admin untuk info setoran.`,
            { reply_markup: getBackButton('kurir_wallet') }
        );
    }
}

// ============================================
// CALLBACK HELPER FUNCTIONS
// ============================================

async function handleTasksCallback(chatId: number, messageId: number, kurirId: string) {
    const botToken = getKurirBotToken();

    const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('kurir_id', kurirId)
        .in('status', ['PICKUP_OTW', 'BARANG_DIAMBIL', 'DIKIRIM'])
        .order('created_at', { ascending: false })
        .limit(1);

    if (!orders?.length) {
        await editMessageText(
            botToken,
            chatId,
            messageId,
            '📋 <b>TUGAS SAYA</b>\n\nTidak ada tugas aktif saat ini.\n\nTunggu notifikasi tugas baru! 🔔',
            { reply_markup: getBackButton('kurir_menu') }
        );
        return;
    }

    const order = orders[0];
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
        status: order.status as OrderStatusType,
        createdAt: new Date(order.created_at),
    };

    await editMessageText(
        botToken,
        chatId,
        messageId,
        getTaskDetailMessage(orderData),
        { reply_markup: getStatusUpdateKeyboard(order.id, order.status) }
    );
}

async function handleHistoryCallback(chatId: number, messageId: number, kurirId: string, page: number) {
    const botToken = getKurirBotToken();
    const limit = 5;
    const offset = (page - 1) * limit;

    const { data: orders, count } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('kurir_id', kurirId)
        .in('status', ['SELESAI', 'GAGAL'])
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (!orders?.length) {
        await editMessageText(
            botToken,
            chatId,
            messageId,
            '📊 <b>RIWAYAT</b>\n\nBelum ada riwayat pengiriman.',
            { reply_markup: getBackButton('kurir_menu') }
        );
        return;
    }

    const historyList = orders
        .map((o) => {
            const emoji = o.status === 'SELESAI' ? '✅' : '❌';
            return `${emoji} <code>${o.order_number}</code>\n   ${o.customer_name} - ${formatCurrency(o.total)}`;
        })
        .join('\n\n');

    const totalPages = Math.ceil((count || 0) / limit);

    await editMessageText(
        botToken,
        chatId,
        messageId,
        `📊 <b>RIWAYAT PENGIRIMAN</b>\n\n${historyList}`,
        { reply_markup: getPaginationKeyboard(page, totalPages, 'history') }
    );
}

async function handleWalletCallback(chatId: number, messageId: number, kurir: any) {
    const botToken = getKurirBotToken();
    const stats = await getKurirStats(kurir.id);

    const { data: pendingOrders } = await supabase
        .from('orders')
        .select('order_number, cod_amount')
        .eq('kurir_id', kurir.id)
        .eq('status', 'SELESAI')
        .eq('cod_collected', false);

    const pending = pendingOrders?.map((o) => ({
        orderNumber: o.order_number,
        amount: o.cod_amount || 0,
    })) || [];

    const kurirData = {
        id: kurir.id,
        name: kurir.name,
        phone: kurir.phone,
        isOnline: kurir.is_online,
        totalOrders: kurir.total_orders || 0,
        rating: kurir.rating || 5.0,
    };

    await editMessageText(
        botToken,
        chatId,
        messageId,
        getWalletMessage(kurirData, stats.pendingCOD, pending, stats.todayEarnings, stats.todayOrders, 0),
        { reply_markup: getWalletKeyboard() }
    );
}

async function handleOnlineToggle(chatId: number, messageId: number, kurir: any, isOnline: boolean) {
    const botToken = getKurirBotToken();

    await supabase
        .from('kurir')
        .update({ is_online: isOnline, updated_at: new Date().toISOString() })
        .eq('id', kurir.id);

    const stats = await getKurirStats(kurir.id);
    const kurirData = {
        id: kurir.id,
        name: kurir.name,
        phone: kurir.phone,
        isOnline: isOnline,
        totalOrders: kurir.total_orders || 0,
        rating: kurir.rating || 5.0,
    };

    await editMessageText(
        botToken,
        chatId,
        messageId,
        getKurirWelcomeMessage(kurirData, stats.todayOrders, stats.todayEarnings, stats.pendingCOD),
        { reply_markup: getKurirMainMenu(isOnline) }
    );
}

async function handleStatsCallback(chatId: number, messageId: number, kurir: any) {
    const botToken = getKurirBotToken();
    const stats = await getKurirStats(kurir.id);

    await editMessageText(
        botToken,
        chatId,
        messageId,
        `📈 <b>STATISTIK KURIR</b>\n\n` +
        `👤 ${kurir.name}\n` +
        `⭐ Rating: ${kurir.rating || 5.0}/5\n\n` +
        `📊 <b>Hari Ini:</b>\n` +
        `• Order Selesai: ${stats.todayOrders}\n` +
        `• Pendapatan: ${formatCurrency(stats.todayEarnings)}\n` +
        `• COD Pending: ${formatCurrency(stats.pendingCOD)}\n\n` +
        `📊 <b>Total:</b>\n` +
        `• Total Order: ${kurir.total_orders || 0}\n`,
        { reply_markup: getBackButton('kurir_menu') }
    );
}

async function handleAcceptTask(chatId: number, messageId: number, kurir: any, orderId: string) {
    const botToken = getKurirBotToken();

    // Update order status and assign to kurir
    const { error } = await supabase
        .from('orders')
        .update({
            kurir_id: kurir.id,
            status: 'PICKUP_OTW',
            updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

    if (error) {
        await editMessageText(
            botToken,
            chatId,
            messageId,
            '❌ Gagal menerima tugas. Coba lagi.',
            { reply_markup: getBackButton('kurir_menu') }
        );
        return;
    }

    // Notify admin
    const adminBotToken = getAdminBotToken();
    const adminChatId = getAdminChatId();

    const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (order) {
        await sendTelegramMessage(
            adminBotToken,
            adminChatId,
            `✅ <b>TUGAS DITERIMA</b>\n\n` +
            `Order: <code>${order.order_number}</code>\n` +
            `Kurir: <b>${kurir.name}</b>\n` +
            `Status: 🚚 OTW ke Pickup`
        );
    }

    await editMessageText(
        botToken,
        chatId,
        messageId,
        `✅ <b>TUGAS DITERIMA!</b>\n\n` +
        `Order: <code>${order?.order_number}</code>\n\n` +
        `Segera menuju lokasi pickup!`,
        { reply_markup: getStatusUpdateKeyboard(orderId, 'PICKUP_OTW') }
    );
}

async function handleDeclineTask(chatId: number, messageId: number, orderId: string) {
    const botToken = getKurirBotToken();

    await editMessageText(
        botToken,
        chatId,
        messageId,
        '❌ <b>TUGAS DITOLAK</b>\n\nTugas dikembalikan ke antrian.',
        { reply_markup: getBackButton('kurir_menu') }
    );
}

async function handleStatusUpdate(chatId: number, messageId: number, orderId: string, newStatus: OrderStatusType) {
    const botToken = getKurirBotToken();

    const { error } = await supabase
        .from('orders')
        .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

    if (error) {
        await editMessageText(
            botToken,
            chatId,
            messageId,
            '❌ Gagal update status. Coba lagi.',
            { reply_markup: getBackButton('kurir_tasks') }
        );
        return;
    }

    // Get order details
    const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (!order) return;

    // Notify admin
    const adminBotToken = getAdminBotToken();
    const adminChatId = getAdminChatId();

    await sendTelegramMessage(
        adminBotToken,
        adminChatId,
        `${StatusEmoji[newStatus]} <b>STATUS UPDATE</b>\n\n` +
        `Order: <code>${order.order_number}</code>\n` +
        `Status: <b>${StatusLabel[newStatus]}</b>`
    );

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
        status: newStatus,
        createdAt: new Date(order.created_at),
    };

    await editMessageText(
        botToken,
        chatId,
        messageId,
        getStatusUpdateConfirmation(orderData, newStatus),
        {
            reply_markup: newStatus === 'SELESAI' || newStatus === 'GAGAL'
                ? getBackButton('kurir_menu')
                : getStatusUpdateKeyboard(orderId, newStatus)
        }
    );
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

async function getKurirStats(kurirId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's completed orders
    const { data: todayOrders } = await supabase
        .from('orders')
        .select('delivery_fee, cod_amount, cod_collected')
        .eq('kurir_id', kurirId)
        .eq('status', 'SELESAI')
        .gte('updated_at', today.toISOString());

    const completed = todayOrders || [];
    const todayCount = completed.length;
    const todayEarnings = completed.reduce((sum, o) => sum + (o.delivery_fee || 0), 0);

    // Get pending COD
    const { data: pendingCODOrders } = await supabase
        .from('orders')
        .select('cod_amount')
        .eq('kurir_id', kurirId)
        .eq('status', 'SELESAI')
        .eq('cod_collected', false);

    const pendingCOD = (pendingCODOrders || []).reduce((sum, o) => sum + (o.cod_amount || 0), 0);

    return {
        todayOrders: todayCount,
        todayEarnings,
        pendingCOD,
    };
}

// GET handler (for testing)
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        bot: 'Kurir Bot',
        message: 'Webhook is active',
    });
}
