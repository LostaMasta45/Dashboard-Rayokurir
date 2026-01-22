// Kurir Bot Webhook Handler
// Handles all incoming updates for the Kurir Telegram Bot

import { NextRequest, NextResponse } from 'next/server';
import {
    sendTelegramMessage,
    sendTelegramPhoto,
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
    // New keyboards for updated flow
    getJobCardKeyboard,
    getRejectReasonKeyboard,
    getIssueTypeKeyboard,
    getOrderListKeyboard,
    getPairingKeyboard,
    getTalanganListKeyboard,
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

// User state for tracking context (e.g., waiting for photo upload, payment method)
const userState: Map<number, { action?: string; orderId?: string; step?: string }> = new Map();

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
            } else if (text === '/setor' || text === '/ringkasan') {
                await handleDailySummary(chatId, userId);
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
        .from('couriers')
        .select('*')
        .eq('telegram_user_id', telegramId)
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
        name: kurir.nama,
        phone: kurir.wa,
        isOnline: kurir.online,
        totalOrders: kurir.total_orders || 0,
        rating: kurir.rating || 5.0,
    };

    await sendTelegramMessage(
        botToken,
        chatId,
        getKurirWelcomeMessage(kurirData, stats.todayOrders, stats.todayEarnings, stats.pendingCOD),
        { reply_markup: getKurirMainMenu(kurir.online) }
    );
}

// Handle /menu command
async function handleMenu(chatId: number, telegramId: number) {
    const botToken = getKurirBotToken();

    const { data: kurir } = await supabase
        .from('couriers')
        .select('*')
        .eq('telegram_user_id', telegramId)
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
        name: kurir.nama,
        phone: kurir.wa,
        isOnline: kurir.online,
        totalOrders: kurir.total_orders || 0,
        rating: kurir.rating || 5.0,
    };

    await sendTelegramMessage(
        botToken,
        chatId,
        getKurirWelcomeMessage(kurirData, stats.todayOrders, stats.todayEarnings, stats.pendingCOD),
        { reply_markup: getKurirMainMenu(kurir.online) }
    );
}

// Handle /setor or /ringkasan command - Daily summary
async function handleDailySummary(chatId: number, telegramId: number) {
    const botToken = getKurirBotToken();

    const { data: kurir } = await supabase
        .from('couriers')
        .select('*')
        .eq('telegram_user_id', telegramId)
        .single();

    if (!kurir) {
        await sendTelegramMessage(
            botToken,
            chatId,
            '⛔ Anda belum terdaftar. Ketik /start untuk info pendaftaran.'
        );
        return;
    }

    const today = new Date().toDateString();

    // Get courier's orders
    const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('kurirId', kurir.id);

    const courierOrders = orders || [];

    // Today's completed orders
    const todayOrders = courierOrders.filter(
        (o: { createdDate: string; status: string }) =>
            o.createdDate === today &&
            (o.status === 'DELIVERED' || o.status === 'SELESAI')
    );

    // Payment method breakdown
    const cashOrders = todayOrders.filter((o: { ongkirPaymentMethod?: string }) => o.ongkirPaymentMethod === 'CASH');
    const qrisOrders = todayOrders.filter((o: { ongkirPaymentMethod?: string }) => o.ongkirPaymentMethod === 'QRIS');

    const cashTotal = cashOrders.reduce((sum: number, o: { ongkir?: number }) => sum + (o.ongkir || 0), 0);
    const qrisTotal = qrisOrders.reduce((sum: number, o: { ongkir?: number }) => sum + (o.ongkir || 0), 0);
    const totalOngkir = cashTotal + qrisTotal;

    // Outstanding cash (COD orders with CASH payment, not yet settled)
    const outstandingCash = courierOrders
        .filter((o: { bayarOngkir?: string; ongkirPaymentMethod?: string; codSettled?: boolean; status: string }) =>
            o.bayarOngkir === 'COD' &&
            o.ongkirPaymentMethod === 'CASH' &&
            !o.codSettled &&
            (o.status === 'DELIVERED' || o.status === 'SELESAI')
        )
        .reduce((sum: number, o: { ongkir?: number }) => sum + (o.ongkir || 0), 0);

    // COD to deposit
    const pendingCOD = courierOrders
        .filter((o: { cod?: { isCOD: boolean; codPaid: boolean }; status: string }) =>
            o.cod?.isCOD &&
            !o.cod?.codPaid &&
            (o.status === 'DELIVERED' || o.status === 'SELESAI')
        )
        .reduce((sum: number, o: { cod?: { nominal: number } }) => sum + (o.cod?.nominal || 0), 0);

    let message = `📊 <b>RINGKASAN HARI INI</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📅 ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;

    message += `📦 <b>Total Order:</b> ${todayOrders.length} order\n\n`;

    message += `💰 <b>Ongkir Hari Ini:</b>\n`;
    message += `   💵 Cash: ${formatCurrency(cashTotal)} (${cashOrders.length} order)\n`;
    message += `   📱 QRIS: ${formatCurrency(qrisTotal)} (${qrisOrders.length} order)\n`;
    message += `   ━━━━━━━━━━━━━━━━\n`;
    message += `   📈 Total: <b>${formatCurrency(totalOngkir)}</b>\n\n`;

    if (outstandingCash > 0 || pendingCOD > 0) {
        message += `⚠️ <b>Perlu Disetor:</b>\n`;
        if (outstandingCash > 0) {
            message += `   💵 Cash Ongkir: ${formatCurrency(outstandingCash)}\n`;
        }
        if (pendingCOD > 0) {
            message += `   🏷️ COD: ${formatCurrency(pendingCOD)}\n`;
        }
        message += `   ━━━━━━━━━━━━━━━━\n`;
        message += `   💰 Total Setor: <b>${formatCurrency(outstandingCash + pendingCOD)}</b>\n`;
    } else {
        message += `✅ Tidak ada yang perlu disetor!`;
    }

    await sendTelegramMessage(
        botToken,
        chatId,
        message,
        { reply_markup: getBackButton('kurir_menu') }
    );
}

// Handle /tugas command
async function handleTasks(chatId: number, telegramId: number) {
    const botToken = getKurirBotToken();

    console.log('[handleTasks] telegramId:', telegramId);

    const { data: kurir, error: kurirError } = await supabase
        .from('couriers')
        .select('id, nama, telegram_user_id')
        .eq('telegram_user_id', telegramId)
        .single();

    console.log('[handleTasks] kurir:', kurir, 'error:', kurirError);

    if (!kurir) {
        await sendTelegramMessage(
            botToken,
            chatId,
            '⛔ Akun belum terhubung dengan sistem.\n\nHubungi admin untuk pairing akun.'
        );
        return;
    }

    // Query orders assigned to this courier with active statuses
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('kurirId', kurir.id)
        .in('status', ['OFFERED', 'ACCEPTED', 'OTW_PICKUP', 'PICKED', 'OTW_DROPOFF', 'NEED_POD', 'ASSIGNED', 'PICKUP', 'DIKIRIM'])
        .order('createdAt', { ascending: false });

    console.log('[handleTasks] kurirId:', kurir.id, 'orders found:', orders?.length, 'error:', ordersError);

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
        // Map from database columns (camelCase) to message format
        const orderData = {
            id: order.id,
            orderNumber: order.id.slice(-6).toUpperCase(), // Use last 6 chars of ID as order number
            mitraName: order.pengirim?.nama || 'Pengirim',
            mitraAddress: order.pickup?.alamat || '',
            customerName: order.pengirim?.nama || 'Pelanggan',
            customerPhone: order.pengirim?.wa || '',
            customerAddress: order.dropoff?.alamat || '',
            items: [],
            subtotal: order.ongkir || 0,
            deliveryFee: order.ongkir || 0,
            total: (order.ongkir || 0) + (order.cod?.nominal || 0),
            codAmount: order.cod?.nominal || 0,
            notes: order.notes || '',
            status: order.status as OrderStatusType,
            createdAt: new Date(order.createdAt),
            pickupMapsLink: order.pickup?.mapsLink,
            dropoffMapsLink: order.dropoff?.mapsLink,
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
        .from('couriers')
        .select('*')
        .eq('telegram_user_id', telegramId)
        .single();

    if (!kurir) return;

    const stats = await getKurirStats(kurir.id);

    // Get pending COD orders
    const { data: pendingOrders } = await supabase
        .from('orders')
        .select('id, cod')
        .eq('kurirId', kurir.id)
        .eq('status', 'SELESAI')
        .eq('codSettled', false);

    const pending = pendingOrders?.map((o) => ({
        orderNumber: o.id?.slice(-6).toUpperCase() || '',
        amount: o.cod?.nominal || 0,
    })) || [];

    const kurirData = {
        id: kurir.id,
        name: kurir.nama,
        phone: kurir.wa,
        isOnline: kurir.online,
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
        .from('couriers')
        .update({ online: isOnline, updated_at: new Date().toISOString() })
        .eq('telegram_user_id', telegramId);

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
        .from('couriers')
        .select('id')
        .eq('telegram_user_id', telegramId)
        .single();

    if (!kurir) return;

    const { data: orders, count } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('kurirId', kurir.id)
        .in('status', ['SELESAI', 'DELIVERED'])
        .order('createdAt', { ascending: false })
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
            const emoji = o.status === 'SELESAI' || o.status === 'DELIVERED' ? '✅' : '❌';
            return `${emoji} <code>${o.id?.slice(-6).toUpperCase() || ''}</code>\n   ${o.pengirim?.nama || o.dropoff?.nama || 'Customer'} - ${formatCurrency(o.ongkir + (o.cod?.nominal || 0))}`;
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
        .from('couriers')
        .select('id')
        .eq('telegram_user_id', telegramId)
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

    // Get kurir info
    const { data: kurir } = await supabase
        .from('couriers')
        .select('*')
        .eq('telegram_user_id', userId)
        .single();

    // Get order info before update
    const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', state.orderId)
        .single();

    if (!order) {
        await sendTelegramMessage(botToken, chatId, '❌ Order tidak ditemukan.');
        userState.delete(userId);
        return;
    }

    // Save photo to order with proper structure
    const now = new Date().toISOString();
    const currentPodPhotos = order.podPhotos || [];
    const newPodPhoto = {
        url: fileId, // Store Telegram file_id as URL (will be proxied via /api/telegram/image)
        fileId: fileId,
        uploadedAt: now,
        uploadedBy: kurir?.id || 'kurir',
    };

    const { error } = await supabase
        .from('orders')
        .update({
            podPhotos: [...currentPodPhotos, newPodPhoto], // Append new POD photo with proper structure
            status: 'DELIVERED', // Mark as delivered when POD uploaded
        })
        .eq('id', state.orderId);

    // Clear user state
    userState.delete(userId);

    if (error) {
        await sendTelegramMessage(botToken, chatId, '❌ Gagal menyimpan foto. Coba lagi.');
        return;
    }

    // Notify admin with PHOTO and complete info
    const adminBotToken = getAdminBotToken();
    const adminChatId = getAdminChatId();

    // Build complete POD notification message
    const kurirName = kurir?.nama || 'Kurir';
    const senderName = order.pengirim?.nama || order.customer_name || 'Pengirim';
    const senderWa = order.pengirim?.wa || order.customer_phone || '-';
    const pickupAddress = order.pickup?.alamat || order.pickup_address || '-';
    const dropoffAddress = order.dropoff?.alamat || order.customer_address || '-';
    const dropoffName = order.dropoff?.nama || senderName;
    const ongkir = order.ongkir || order.delivery_fee || 0;
    const codAmount = order.cod?.nominal || 0;
    const talanganAmount = order.danaTalangan || 0;

    let podCaption = `📸 <b>BUKTI FOTO DITERIMA</b>\n`;
    podCaption += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    podCaption += `📋 Order: <code>#${state.orderId.slice(-6)}</code>\n`;
    podCaption += `🚚 Kurir: <b>${kurirName}</b>\n\n`;
    podCaption += `👤 <b>Pengirim</b>\n`;
    podCaption += `   ${senderName}\n`;
    podCaption += `   📱 ${senderWa}\n\n`;
    podCaption += `📍 <b>Pickup</b>\n`;
    podCaption += `   ${pickupAddress}\n\n`;
    podCaption += `🏁 <b>Dropoff</b>\n`;
    podCaption += `   ${dropoffName}\n`;
    podCaption += `   ${dropoffAddress}\n\n`;
    podCaption += `💰 <b>Keuangan</b>\n`;
    podCaption += `   Ongkir: ${formatCurrency(ongkir)}\n`;
    if (talanganAmount > 0) {
        podCaption += `   Talangan: ${formatCurrency(talanganAmount)}\n`;
    }
    if (codAmount > 0) {
        podCaption += `   💵 COD: <b>${formatCurrency(codAmount)}</b>\n`;
    }
    podCaption += `\n✅ Status: <b>DELIVERED</b>`;

    // Send photo to admin
    await sendTelegramPhoto(
        adminBotToken,
        adminChatId,
        fileId,
        podCaption
    );

    // For COD orders, ask payment method. For non-COD, mark as paid immediately.
    const isCOD = order.bayarOngkir === 'COD';

    if (isCOD) {
        // Store order ID for payment method selection callback
        userState.set(userId, { orderId: state.orderId, step: 'awaiting_payment_method' });

        await sendTelegramMessage(
            botToken,
            chatId,
            `✅ <b>BUKTI DITERIMA!</b>\n\n` +
            `Order <code>#${state.orderId.slice(-6)}</code> sudah diantar.\n\n` +
            `💰 <b>Bagaimana customer bayar ongkir?</b>`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '💵 Cash (Tunai)', callback_data: `payment_method_CASH_${state.orderId}` },
                            { text: '📱 QRIS', callback_data: `payment_method_QRIS_${state.orderId}` }
                        ],
                        [{ text: '⬅️ Kembali ke Menu', callback_data: 'kurir_menu' }]
                    ]
                }
            }
        );
    } else {
        // Non-COD: mark payment as completed immediately
        await supabase
            .from('orders')
            .update({
                ongkirPaymentStatus: 'PAID',
                ongkirPaidAt: new Date().toISOString()
            })
            .eq('id', state.orderId);

        await sendTelegramMessage(
            botToken,
            chatId,
            `✅ <b>BUKTI DITERIMA!</b>\n\n` +
            `Order <code>#${state.orderId.slice(-6)}</code> telah selesai.\n` +
            `Foto bukti pengiriman tersimpan.\n\n` +
            `Terima kasih! 🎉`,
            { reply_markup: getBackButton('kurir_menu') }
        );
    }
}

// ============================================
// CALLBACK HANDLERS
// ============================================

async function handleCallback(chatId: number, messageId: number, userId: number, data: string) {
    const botToken = getKurirBotToken();

    // Get kurir info
    const { data: kurir } = await supabase
        .from('couriers')
        .select('*')
        .eq('telegram_user_id', userId)
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
            name: kurir.nama,
            phone: kurir.wa,
            isOnline: kurir.online,
            totalOrders: kurir.total_orders || 0,
            rating: kurir.rating || 5.0,
        };

        await editMessageText(
            botToken,
            chatId,
            messageId,
            getKurirWelcomeMessage(kurirData, stats.todayOrders, stats.todayEarnings, stats.pendingCOD),
            { reply_markup: getKurirMainMenu(kurir.online) }
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

    // Payment method selection (after POD upload for COD orders)
    else if (data.startsWith('payment_method_')) {
        const parts = data.split('_');
        const method = parts[2] as 'CASH' | 'QRIS'; // payment_method_CASH_xxx or payment_method_QRIS_xxx
        const orderId = parts.slice(3).join('_');

        // Update order with payment method
        const { error } = await supabase
            .from('orders')
            .update({
                ongkirPaymentMethod: method,
                ongkirPaymentStatus: 'PAID',
                ongkirPaidAt: new Date().toISOString()
            })
            .eq('id', orderId);

        userState.delete(userId);

        if (error) {
            await editMessageText(
                botToken,
                chatId,
                messageId,
                '❌ Gagal menyimpan metode pembayaran. Coba lagi.',
                { reply_markup: getBackButton('kurir_menu') }
            );
        } else {
            const emoji = method === 'QRIS' ? '📱' : '💵';
            await editMessageText(
                botToken,
                chatId,
                messageId,
                `✅ <b>ORDER SELESAI!</b>\n\n` +
                `Order <code>#${orderId.slice(-6)}</code> telah selesai.\n` +
                `${emoji} Pembayaran: <b>${method}</b>\n\n` +
                `Terima kasih! 🎉`,
                { reply_markup: getBackButton('kurir_menu') }
            );
        }
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

    // ============================================
    // NEW: rk: PREFIX CALLBACK HANDLERS
    // ============================================

    // rk:accept:orderId - Accept order
    else if (data.startsWith('rk:accept:')) {
        const orderId = data.split(':')[2];
        await handleRkAccept(chatId, messageId, kurir, orderId);
    }

    // rk:reject_reason:orderId - Show reject reasons
    else if (data.startsWith('rk:reject_reason:')) {
        const orderId = data.split(':')[2];
        await editMessageText(
            botToken,
            chatId,
            messageId,
            `❌ <b>TOLAK ORDER</b>\n\nPilih alasan penolakan:`,
            { reply_markup: getRejectReasonKeyboard(orderId) }
        );
    }

    // rk:reject:orderId:reason - Reject order with reason
    else if (data.startsWith('rk:reject:')) {
        const parts = data.split(':');
        const orderId = parts[2];
        const reason = parts[3] || 'tidak disebutkan';
        await handleRkReject(chatId, messageId, kurir, orderId, reason);
    }

    // rk:status:orderId:newStatus - Update order status
    else if (data.startsWith('rk:status:')) {
        const parts = data.split(':');
        const orderId = parts[2];
        const newStatus = parts[3];
        await handleRkStatusUpdate(chatId, messageId, kurir, orderId, newStatus);
    }

    // rk:pod:orderId - Request POD upload
    else if (data.startsWith('rk:pod:')) {
        const orderId = data.split(':')[2];
        userState.set(userId, { action: 'upload_pod', orderId });
        await editMessageText(
            botToken,
            chatId,
            messageId,
            `📸 <b>UPLOAD BUKTI PENGIRIMAN (POD)</b>\n\n` +
            `Kirim foto bukti pengiriman untuk order ini.\n\n` +
            `📷 Cukup kirim foto ke chat ini.\n\n` +
            `<i>Foto akan otomatis tersimpan.</i>`,
            { reply_markup: getBackButton('kurir_tasks') }
        );
    }

    // rk:issue:orderId - Show issue options
    else if (data.startsWith('rk:issue:')) {
        const orderId = data.split(':')[2];
        await editMessageText(
            botToken,
            chatId,
            messageId,
            `⚠️ <b>LAPORKAN KENDALA</b>\n\nPilih jenis kendala:`,
            { reply_markup: getIssueTypeKeyboard(orderId) }
        );
    }

    // rk:issue_send:orderId:type - Send issue report
    else if (data.startsWith('rk:issue_send:')) {
        const parts = data.split(':');
        const orderId = parts[2];
        const issueType = parts[3];
        await handleRkIssue(chatId, messageId, kurir, orderId, issueType);
    }

    // rk:detail:orderId - Show order detail
    else if (data.startsWith('rk:detail:')) {
        const orderId = data.split(':')[2];
        await handleRkOrderDetail(chatId, messageId, kurir, orderId);
    }

    // rk:pairing:enter - Enter pairing mode
    else if (data === 'rk:pairing:enter') {
        userState.set(userId, { action: 'enter_pairing_code' });
        await editMessageText(
            botToken,
            chatId,
            messageId,
            `🔗 <b>PAIRING AKUN</b>\n\n` +
            `Masukkan kode OTP 6 digit yang didapat dari Admin:\n\n` +
            `<i>Ketik kode langsung di chat ini.</i>`,
            { reply_markup: getBackButton('kurir_menu') }
        );
    }

    // rk:pairing:help - Show pairing help
    else if (data === 'rk:pairing:help') {
        await editMessageText(
            botToken,
            chatId,
            messageId,
            `❓ <b>CARA MENDAPATKAN KODE OTP</b>\n\n` +
            `1. Hubungi Admin Rayo Kurir\n` +
            `2. Minta Admin generate kode OTP untuk Anda\n` +
            `3. Masukkan kode 6 digit tersebut di bot ini\n\n` +
            `📱 Hubungi Admin: wa.me/6281234567890`,
            { reply_markup: getPairingKeyboard() }
        );
    }

    // rk:talangan:list - Show orders with pending talangan
    else if (data === 'rk:talangan:list') {
        await handleTalanganList(chatId, messageId, kurir);
    }

    // rk:talangan:confirm:orderId - Confirm talangan reimbursed
    else if (data.startsWith('rk:talangan:confirm:')) {
        const orderId = data.split(':')[3];
        await handleTalanganConfirm(chatId, messageId, kurir, orderId);
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
        .eq('kurirId', kurirId)
        .in('status', ['OFFERED', 'ACCEPTED', 'OTW_PICKUP', 'PICKED', 'OTW_DROPOFF', 'NEED_POD', 'ASSIGNED', 'PICKUP', 'DIKIRIM'])
        .order('createdAt', { ascending: false })
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
        orderNumber: order.id.slice(-6).toUpperCase(),
        mitraName: order.pengirim?.nama || 'Pengirim',
        mitraAddress: order.pickup?.alamat || '',
        customerName: order.dropoff?.nama || order.pengirim?.nama || 'Pelanggan',
        customerPhone: order.pengirim?.wa || '',
        customerAddress: order.dropoff?.alamat || '',
        items: [],
        subtotal: order.ongkir || 0,
        deliveryFee: order.ongkir || 0,
        total: (order.ongkir || 0) + (order.cod?.nominal || 0),
        codAmount: order.cod?.nominal || 0,
        notes: order.notes || '',
        status: order.status as OrderStatusType,
        createdAt: new Date(order.createdAt),
        pickupMapsLink: order.pickup?.mapsLink,
        dropoffMapsLink: order.dropoff?.mapsLink,
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
        .eq('kurirId', kurirId)
        .in('status', ['SELESAI', 'DELIVERED'])
        .order('createdAt', { ascending: false })
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
            const emoji = o.status === 'SELESAI' || o.status === 'DELIVERED' ? '✅' : '❌';
            return `${emoji} <code>${o.id?.slice(-6).toUpperCase() || ''}</code>\n   ${o.pengirim?.nama || o.dropoff?.nama || 'Customer'} - ${formatCurrency((o.ongkir || 0) + (o.cod?.nominal || 0))}`;
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
        .select('id, cod')
        .eq('kurirId', kurir.id)
        .eq('status', 'SELESAI')
        .eq('codSettled', false);

    const pending = pendingOrders?.map((o) => ({
        orderNumber: o.id?.slice(-6).toUpperCase() || '',
        amount: o.cod?.nominal || 0,
    })) || [];

    const kurirData = {
        id: kurir.id,
        name: kurir.nama,
        phone: kurir.wa,
        isOnline: kurir.online,
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
        .from('couriers')
        .update({ online: isOnline, updated_at: new Date().toISOString() })
        .eq('id', kurir.id);

    const stats = await getKurirStats(kurir.id);
    const kurirData = {
        id: kurir.id,
        name: kurir.nama,
        phone: kurir.wa,
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
            kurirId: kurir.id,
            status: 'ACCEPTED',
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
            `Order: <code>#${orderId.slice(-6)}</code>\n` +
            `Kurir: <b>${kurir.nama}</b>\n` +
            `Status: ✅ ACCEPTED`
        );
    }

    await editMessageText(
        botToken,
        chatId,
        messageId,
        `✅ <b>TUGAS DITERIMA!</b>\n\n` +
        `Order: <code>#${orderId.slice(-6)}</code>\n\n` +
        `Segera menuju lokasi pickup!`,
        { reply_markup: getStatusUpdateKeyboard(orderId, 'ACCEPTED') }
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
        `Order: <code>#${orderId.slice(-6)}</code>\n` +
        `Status: <b>${StatusLabel[newStatus]}</b>`
    );

    const orderData = {
        id: order.id,
        orderNumber: order.id.slice(-6).toUpperCase(),
        mitraName: order.pengirim?.nama || 'Pengirim',
        mitraAddress: order.pickup?.alamat || '',
        customerName: order.dropoff?.nama || order.pengirim?.nama || 'Pelanggan',
        customerPhone: order.pengirim?.wa || '',
        customerAddress: order.dropoff?.alamat || '',
        items: [],
        subtotal: order.ongkir || 0,
        deliveryFee: order.ongkir || 0,
        total: (order.ongkir || 0) + (order.cod?.nominal || 0),
        codAmount: order.cod?.nominal || 0,
        notes: order.notes || '',
        status: newStatus,
        createdAt: new Date(order.createdAt),
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
        .select('ongkir, cod, codSettled')
        .eq('kurirId', kurirId)
        .in('status', ['SELESAI', 'DELIVERED'])
        .gte('createdAt', today.toISOString());

    const completed = todayOrders || [];
    const todayCount = completed.length;
    const todayEarnings = completed.reduce((sum, o) => sum + (o.ongkir || 0), 0);

    // Get pending COD
    const { data: pendingCODOrders } = await supabase
        .from('orders')
        .select('cod')
        .eq('kurirId', kurirId)
        .in('status', ['SELESAI', 'DELIVERED'])
        .eq('codSettled', false);

    const pendingCOD = (pendingCODOrders || []).reduce((sum, o) => sum + (o.cod?.nominal || 0), 0);

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

// ============================================
// NEW: RK PREFIX HANDLER FUNCTIONS
// ============================================

// Handle rk:accept - Accept order
async function handleRkAccept(chatId: number, messageId: number, kurir: any, orderId: string) {
    const botToken = getKurirBotToken();

    // Get order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (orderError || !order) {
        await editMessageText(botToken, chatId, messageId, '❌ Order tidak ditemukan.');
        return;
    }

    // Validate order is assigned to this courier and status is OFFERED
    if (order.kurirId !== kurir.id) {
        await editMessageText(botToken, chatId, messageId, '❌ Order ini tidak ditugaskan ke Anda.');
        return;
    }

    if (order.status !== 'OFFERED') {
        await editMessageText(
            botToken, chatId, messageId,
            `❌ Order tidak bisa diterima. Status saat ini: ${order.status}`
        );
        return;
    }

    // Update order status to ACCEPTED
    const now = new Date();
    const nowIso = now.toISOString();
    const auditLog = order.auditLog || [];
    auditLog.push({
        event: 'ORDER_ACCEPTED',
        at: nowIso,
        actorType: 'COURIER',
        actorId: kurir.id,
        meta: { telegramUserId: kurir.telegram_user_id },
    });

    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'ACCEPTED', auditLog })
        .eq('id', orderId);

    if (updateError) {
        await editMessageText(botToken, chatId, messageId, '❌ Gagal menerima order. Coba lagi.');
        return;
    }

    // Build complete admin notification
    const kurirName = kurir?.nama || kurir?.name || 'Kurir';
    const senderName = order.pengirim?.nama || order.customer_name || 'Pengirim';
    const senderWa = order.pengirim?.wa || order.customer_phone || '-';
    const pickupAddress = order.pickup?.alamat || order.pickup_address || '-';
    const dropoffAddress = order.dropoff?.alamat || order.customer_address || '-';
    const ongkir = order.ongkir || order.delivery_fee || 0;
    const codAmount = order.cod?.nominal || 0;
    const talanganAmount = order.danaTalangan || 0;

    // Format time for WIB
    const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
    });

    // Notify admin with complete info
    const adminBotToken = getAdminBotToken();
    const adminChatId = getAdminChatId();

    let adminMessage = `✅ <b>ORDER DITERIMA</b>\n`;
    adminMessage += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    adminMessage += `📋 Order: <code>#${orderId.slice(-6)}</code>\n`;
    adminMessage += `🚚 Kurir: <b>${kurirName}</b>\n\n`;
    adminMessage += `👤 Pengirim: ${senderName}\n`;
    adminMessage += `📱 WA: ${senderWa}\n\n`;
    adminMessage += `📍 Pickup: ${pickupAddress}\n`;
    adminMessage += `🏁 Dropoff: ${dropoffAddress}\n\n`;
    adminMessage += `💰 Ongkir: ${formatCurrency(ongkir)}\n`;
    if (talanganAmount > 0) {
        adminMessage += `🧾 Talangan: ${formatCurrency(talanganAmount)}\n`;
    }
    if (codAmount > 0) {
        adminMessage += `💵 COD: <b>${formatCurrency(codAmount)}</b>\n`;
    }
    adminMessage += `\n📊 Status: <b>ACCEPTED</b>\n`;
    adminMessage += `⏰ Waktu: ${timeStr} WIB`;

    await sendTelegramMessage(adminBotToken, adminChatId, adminMessage);

    await editMessageText(
        botToken,
        chatId,
        messageId,
        `✅ <b>ORDER DITERIMA!</b>\n\n` +
        `Order <code>#${orderId.slice(-6)}</code> berhasil diterima.\n\n` +
        `Klik tombol di bawah saat mulai perjalanan ke lokasi pickup.`,
        { reply_markup: getStatusUpdateKeyboard(orderId, 'ACCEPTED') }
    );
}

// Handle rk:reject - Reject order
async function handleRkReject(chatId: number, messageId: number, kurir: any, orderId: string, reason: string) {
    const botToken = getKurirBotToken();

    // Get order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (orderError || !order) {
        await editMessageText(botToken, chatId, messageId, '❌ Order tidak ditemukan.');
        return;
    }

    // Validate
    if (order.kurirId !== kurir.id) {
        await editMessageText(botToken, chatId, messageId, '❌ Order ini tidak ditugaskan ke Anda.');
        return;
    }

    if (order.status !== 'OFFERED') {
        await editMessageText(
            botToken, chatId, messageId,
            `❌ Order tidak bisa ditolak. Status saat ini: ${order.status}`
        );
        return;
    }

    // Reason labels
    const reasonLabels: Record<string, string> = {
        jarak: 'Jarak terlalu jauh',
        sibuk: 'Sudah banyak order',
        sakit: 'Kondisi tidak fit',
        kendaraan: 'Kendaraan bermasalah',
        lain: 'Alasan lain',
    };

    // Update order status to NEW (return to pool)
    const now = new Date().toISOString();
    const auditLog = order.auditLog || [];
    auditLog.push({
        event: 'ORDER_REJECTED',
        at: now,
        actorType: 'COURIER',
        actorId: kurir.id,
        meta: { telegramUserId: kurir.telegram_user_id, reason: reasonLabels[reason] || reason },
    });

    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'NEW', kurirId: null, auditLog })
        .eq('id', orderId);

    if (updateError) {
        await editMessageText(botToken, chatId, messageId, '❌ Gagal menolak order. Coba lagi.');
        return;
    }

    // Notify admin
    const adminBotToken = getAdminBotToken();
    const adminChatId = getAdminChatId();
    await sendTelegramMessage(
        adminBotToken,
        adminChatId,
        `⚠️ <b>ORDER DITOLAK</b>\n\n` +
        `Order: <code>#${orderId.slice(-6)}</code>\n` +
        `Kurir: ${kurir.name}\n` +
        `Alasan: ${reasonLabels[reason] || reason}\n\n` +
        `<i>Order kembali ke pool, perlu di-assign ulang.</i>`
    );

    await editMessageText(
        botToken,
        chatId,
        messageId,
        `❌ <b>ORDER DITOLAK</b>\n\n` +
        `Order <code>#${orderId.slice(-6)}</code> ditolak.\n` +
        `Alasan: ${reasonLabels[reason] || reason}\n\n` +
        `Admin akan mencari kurir lain.`,
        { reply_markup: getBackButton('kurir_menu') }
    );
}

// Handle rk:status - Update order status
async function handleRkStatusUpdate(chatId: number, messageId: number, kurir: any, orderId: string, newStatus: string) {
    const botToken = getKurirBotToken();

    // Get order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (orderError || !order) {
        await editMessageText(botToken, chatId, messageId, '❌ Order tidak ditemukan.');
        return;
    }

    // Validate order is assigned to this courier
    if (order.kurirId !== kurir.id) {
        await editMessageText(botToken, chatId, messageId, '❌ Order ini tidak ditugaskan ke Anda.');
        return;
    }

    // Allowed transitions - more flexible
    const allowedTransitions: Record<string, string[]> = {
        // New status flow
        OFFERED: ['ACCEPTED', 'REJECTED'],
        ACCEPTED: ['OTW_PICKUP'],
        OTW_PICKUP: ['PICKED'],
        PICKED: ['OTW_DROPOFF'],
        OTW_DROPOFF: ['NEED_POD', 'DELIVERED'], // Allow direct complete if POD already uploaded
        NEED_POD: ['DELIVERED'],
        // Legacy status flow
        ASSIGNED: ['OTW_PICKUP', 'PICKUP', 'ACCEPTED'],
        PICKUP: ['OTW_DROPOFF', 'DIKIRIM', 'PICKED'],
        DIKIRIM: ['NEED_POD', 'SELESAI', 'DELIVERED'],
    };

    const allowed = allowedTransitions[order.status] || [];
    if (!allowed.includes(newStatus)) {
        await editMessageText(
            botToken, chatId, messageId,
            `❌ Transisi status tidak valid.\nDari ${order.status} hanya bisa ke: ${allowed.join(', ') || 'tidak ada'}`
        );
        return;
    }

    // Update order status
    const now = new Date();
    const nowIso = now.toISOString();
    const auditLog = order.auditLog || [];
    auditLog.push({
        event: `STATUS_${newStatus}`,
        at: nowIso,
        actorType: 'COURIER',
        actorId: kurir.id,
        meta: { telegramUserId: kurir.telegram_user_id, previousStatus: order.status },
    });

    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus, auditLog })
        .eq('id', orderId);

    if (updateError) {
        await editMessageText(botToken, chatId, messageId, '❌ Gagal update status. Coba lagi.');
        return;
    }

    // Status labels
    const statusLabels: Record<string, string> = {
        OTW_PICKUP: '🚚 OTW Jemput',
        PICKED: '📦 Sudah Jemput',
        OTW_DROPOFF: '🏃 OTW Antar',
        NEED_POD: '✅ Terkirim - Butuh POD',
        DELIVERED: '🎉 Selesai',
    };

    // Build complete admin notification
    const kurirName = kurir?.nama || kurir?.name || 'Kurir';
    const senderName = order.pengirim?.nama || order.customer_name || 'Pengirim';
    const senderWa = order.pengirim?.wa || order.customer_phone || '-';
    const pickupAddress = order.pickup?.alamat || order.pickup_address || '-';
    const dropoffAddress = order.dropoff?.alamat || order.customer_address || '-';

    // Format time for WIB
    const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
    });

    // Notify admin with complete info
    const adminBotToken = getAdminBotToken();
    const adminChatId = getAdminChatId();

    let adminMessage = `${StatusEmoji[newStatus] || '📝'} <b>UPDATE STATUS</b>\n`;
    adminMessage += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    adminMessage += `📋 Order: <code>#${orderId.slice(-6)}</code>\n`;
    adminMessage += `🚚 Kurir: <b>${kurirName}</b>\n\n`;
    adminMessage += `👤 Pengirim: ${senderName}\n`;
    adminMessage += `📱 WA: ${senderWa}\n\n`;
    adminMessage += `📍 Pickup: ${pickupAddress}\n`;
    adminMessage += `🏁 Dropoff: ${dropoffAddress}\n\n`;
    adminMessage += `📊 Status: <b>${statusLabels[newStatus] || newStatus}</b>\n`;
    adminMessage += `⏰ Waktu: ${timeStr} WIB`;

    await sendTelegramMessage(adminBotToken, adminChatId, adminMessage);

    await editMessageText(
        botToken,
        chatId,
        messageId,
        `✅ <b>STATUS DIUPDATE</b>\n\n` +
        `Order <code>#${orderId.slice(-6)}</code>\n` +
        `Status: ${statusLabels[newStatus] || newStatus}`,
        { reply_markup: getStatusUpdateKeyboard(orderId, newStatus) }
    );
}

// Handle rk:issue - Report issue
async function handleRkIssue(chatId: number, messageId: number, kurir: any, orderId: string, issueType: string) {
    const botToken = getKurirBotToken();

    // Issue type labels
    const issueLabels: Record<string, string> = {
        alamat: 'Alamat tidak ditemukan',
        kontak: 'Customer tidak bisa dihubungi',
        barang: 'Barang rusak/hilang',
        transportasi: 'Kendala transportasi',
        lain: 'Kendala lainnya',
    };

    // Get order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (orderError || !order) {
        await editMessageText(botToken, chatId, messageId, '❌ Order tidak ditemukan.');
        return;
    }

    // Add to audit log
    const now = new Date().toISOString();
    const auditLog = order.auditLog || [];
    auditLog.push({
        event: 'ISSUE_REPORTED',
        at: now,
        actorType: 'COURIER',
        actorId: kurir.id,
        meta: {
            telegramUserId: kurir.telegram_user_id,
            issueType: issueLabels[issueType] || issueType,
            orderStatus: order.status,
        },
    });

    await supabase
        .from('orders')
        .update({ auditLog })
        .eq('id', orderId);

    // Notify admin
    const adminBotToken = getAdminBotToken();
    const adminChatId = getAdminChatId();
    await sendTelegramMessage(
        adminBotToken,
        adminChatId,
        `⚠️ <b>KENDALA DILAPORKAN</b>\n\n` +
        `Order: <code>#${orderId.slice(-6)}</code>\n` +
        `Kurir: ${kurir.name}\n` +
        `Kendala: ${issueLabels[issueType] || issueType}\n` +
        `Status: ${order.status}\n\n` +
        `<i>Segera hubungi kurir untuk tindak lanjut.</i>`
    );

    await editMessageText(
        botToken,
        chatId,
        messageId,
        `⚠️ <b>KENDALA DILAPORKAN</b>\n\n` +
        `Order: <code>#${orderId.slice(-6)}</code>\n` +
        `Kendala: ${issueLabels[issueType] || issueType}\n\n` +
        `Admin akan segera menghubungi Anda.`,
        { reply_markup: getStatusUpdateKeyboard(orderId, order.status) }
    );
}

// Handle rk:detail - Show order detail
async function handleRkOrderDetail(chatId: number, messageId: number, kurir: any, orderId: string) {
    const botToken = getKurirBotToken();

    // Get order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (orderError || !order) {
        await editMessageText(botToken, chatId, messageId, '❌ Order tidak ditemukan.');
        return;
    }

    // Build order detail message
    const hasCOD = order.cod?.isCOD || order.bayarOngkir === 'COD';
    const codAmount = order.cod?.nominal || 0;
    const talanganAmount = order.danaTalangan || 0;

    let message = `📦 <b>DETAIL ORDER</b>\n\n`;
    message += `📋 Order: <code>#${orderId.slice(-6)}</code>\n`;
    message += `📊 Status: <b>${order.status}</b>\n\n`;

    message += `👤 <b>Pengirim</b>\n`;
    message += `   ${order.pengirim?.nama || order.customer_name || '-'}\n`;
    message += `   📱 ${order.pengirim?.wa || order.customer_phone || '-'}\n\n`;

    message += `📍 <b>Pickup</b>\n`;
    message += `   ${order.pickup?.alamat || order.pickup_address || '-'}\n\n`;

    message += `🏁 <b>Dropoff</b>\n`;
    message += `   ${order.dropoff?.alamat || order.customer_address || '-'}\n\n`;

    message += `💰 <b>Keuangan</b>\n`;
    message += `   Ongkir: ${formatCurrency(order.ongkir || order.delivery_fee || 0)}\n`;
    if (talanganAmount > 0) {
        message += `   Talangan: ${formatCurrency(talanganAmount)}\n`;
    }
    if (hasCOD && codAmount > 0) {
        message += `   💵 COD: <b>${formatCurrency(codAmount)}</b>\n`;
    }

    if (order.notes) {
        message += `\n📝 <b>Catatan</b>\n   ${order.notes}\n`;
    }

    await editMessageText(
        botToken,
        chatId,
        messageId,
        message,
        { reply_markup: getStatusUpdateKeyboard(orderId, order.status) }
    );
}

// ============================================
// TALANGAN HANDLER FUNCTIONS
// ============================================

// Handle talangan list - show orders with pending talangan
async function handleTalanganList(chatId: number, messageId: number, kurir: any) {
    const botToken = getKurirBotToken();

    // Get orders with pending talangan for this courier
    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, danaTalangan, talanganReimbursed, status')
        .eq('kurirId', kurir.id)
        .gt('danaTalangan', 0)
        .eq('talanganReimbursed', false)
        .in('status', ['SELESAI', 'DELIVERED'])
        .order('createdAt', { ascending: false });

    if (error || !orders?.length) {
        await editMessageText(
            botToken,
            chatId,
            messageId,
            `🧾 <b>DANA TALANGAN</b>\n\n` +
            `✅ Tidak ada dana talangan yang belum diganti.\n\n` +
            `Semua talangan sudah dikonfirmasi! 🎉`,
            { reply_markup: getBackButton('kurir_wallet') }
        );
        return;
    }

    // Calculate total pending talangan
    const totalPending = orders.reduce((sum, o) => sum + (o.danaTalangan || 0), 0);

    // Build list for keyboard
    const orderList = orders.map(o => ({
        id: o.id,
        shortId: o.id.slice(-6).toUpperCase(),
        amount: o.danaTalangan || 0
    }));

    await editMessageText(
        botToken,
        chatId,
        messageId,
        `🧾 <b>DANA TALANGAN BELUM DIGANTI</b>\n\n` +
        `Total: <b>${formatCurrency(totalPending)}</b>\n` +
        `Jumlah order: ${orders.length}\n\n` +
        `Klik order untuk konfirmasi talangan sudah diganti:`,
        { reply_markup: getTalanganListKeyboard(orderList) }
    );
}

// Handle talangan confirmation
async function handleTalanganConfirm(chatId: number, messageId: number, kurir: any, orderId: string) {
    const botToken = getKurirBotToken();

    // Get order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (orderError || !order) {
        await editMessageText(botToken, chatId, messageId, '❌ Order tidak ditemukan.');
        return;
    }

    // Validate order belongs to this courier
    if (order.kurirId !== kurir.id) {
        await editMessageText(botToken, chatId, messageId, '❌ Order ini tidak ditugaskan ke Anda.');
        return;
    }

    // Check if already reimbursed
    if (order.talanganReimbursed) {
        await editMessageText(
            botToken, chatId, messageId,
            `✅ Talangan untuk order <code>#${orderId.slice(-6)}</code> sudah dikonfirmasi sebelumnya.`,
            { reply_markup: getBackButton('rk:talangan:list') }
        );
        return;
    }

    // Update order - mark talangan as reimbursed
    const now = new Date();
    const nowIso = now.toISOString();
    const auditLog = order.auditLog || [];
    auditLog.push({
        event: 'TALANGAN_REIMBURSED',
        at: nowIso,
        actorType: 'COURIER',
        actorId: kurir.id,
        meta: {
            telegramUserId: kurir.telegram_user_id,
            amount: order.danaTalangan
        },
    });

    const { error: updateError } = await supabase
        .from('orders')
        .update({
            talanganReimbursed: true,
            auditLog
        })
        .eq('id', orderId);

    if (updateError) {
        await editMessageText(botToken, chatId, messageId, '❌ Gagal konfirmasi talangan. Coba lagi.');
        return;
    }

    // Notify admin
    const adminBotToken = getAdminBotToken();
    const adminChatId = getAdminChatId();

    const kurirName = kurir?.nama || kurir?.name || 'Kurir';
    const senderName = order.pengirim?.nama || order.customer_name || 'Pengirim';
    const talanganAmount = order.danaTalangan || 0;

    // Format time for WIB
    const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
    });

    let adminMessage = `💰 <b>TALANGAN DIGANTI</b>\n`;
    adminMessage += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    adminMessage += `📋 Order: <code>#${orderId.slice(-6)}</code>\n`;
    adminMessage += `🚚 Kurir: <b>${kurirName}</b>\n\n`;
    adminMessage += `👤 Pengirim: ${senderName}\n`;
    adminMessage += `💵 Nominal: <b>${formatCurrency(talanganAmount)}</b>\n\n`;
    adminMessage += `✅ Status: <b>SUDAH DIGANTI</b>\n`;
    adminMessage += `⏰ Waktu: ${timeStr} WIB`;

    await sendTelegramMessage(adminBotToken, adminChatId, adminMessage);

    // Confirm to courier
    await editMessageText(
        botToken,
        chatId,
        messageId,
        `✅ <b>TALANGAN DIKONFIRMASI</b>\n\n` +
        `Order: <code>#${orderId.slice(-6)}</code>\n` +
        `Nominal: <b>${formatCurrency(talanganAmount)}</b>\n\n` +
        `Dana talangan sudah dicatat sebagai diganti.\n` +
        `Data akan otomatis tersinkronisasi ke dashboard admin.`,
        { reply_markup: getBackButton('rk:talangan:list') }
    );
}
