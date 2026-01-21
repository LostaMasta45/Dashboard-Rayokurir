// Telegram Bot Utilities for Rayo Kurir
// Shared utilities for both Admin and Kurir bots

export const TELEGRAM_API = 'https://api.telegram.org/bot';

// Bot tokens from environment
export const getAdminBotToken = () => process.env.TELEGRAM_ADMIN_BOT_TOKEN || '';
export const getKurirBotToken = () => process.env.TELEGRAM_KURIR_BOT_TOKEN || '';
export const getAdminChatId = () => process.env.TELEGRAM_ADMIN_CHAT_ID || '';

// Send message to Telegram
export async function sendTelegramMessage(
    botToken: string,
    chatId: string | number,
    text: string,
    options?: {
        parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
        reply_markup?: object;
        disable_web_page_preview?: boolean;
    }
) {
    const url = `${TELEGRAM_API}${botToken}/sendMessage`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: options?.parse_mode || 'HTML',
            reply_markup: options?.reply_markup,
            disable_web_page_preview: options?.disable_web_page_preview ?? true,
        }),
    });

    return response.json();
}

// Send photo to Telegram
export async function sendTelegramPhoto(
    botToken: string,
    chatId: string | number,
    photoUrl: string,
    caption?: string,
    options?: {
        parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
        reply_markup?: object;
    }
) {
    const url = `${TELEGRAM_API}${botToken}/sendPhoto`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            photo: photoUrl,
            caption,
            parse_mode: options?.parse_mode || 'HTML',
            reply_markup: options?.reply_markup,
        }),
    });

    return response.json();
}

// Answer callback query (for inline buttons)
export async function answerCallbackQuery(
    botToken: string,
    callbackQueryId: string,
    text?: string,
    showAlert?: boolean
) {
    const url = `${TELEGRAM_API}${botToken}/answerCallbackQuery`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            callback_query_id: callbackQueryId,
            text,
            show_alert: showAlert,
        }),
    });

    return response.json();
}

// Edit message text
export async function editMessageText(
    botToken: string,
    chatId: string | number,
    messageId: number,
    text: string,
    options?: {
        parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
        reply_markup?: object;
    }
) {
    const url = `${TELEGRAM_API}${botToken}/editMessageText`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text,
            parse_mode: options?.parse_mode || 'HTML',
            reply_markup: options?.reply_markup,
        }),
    });

    return response.json();
}

// Delete message
export async function deleteMessage(
    botToken: string,
    chatId: string | number,
    messageId: number
) {
    const url = `${TELEGRAM_API}${botToken}/deleteMessage`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
        }),
    });

    return response.json();
}

// Generate order number
export function generateOrderNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${dateStr}-${random}`;
}

// Format currency to IDR
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

// Format date to Indonesian
export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

// Format time
export function formatTime(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
    }).format(date);
}

// Escape HTML for Telegram
export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Order status enum
export const OrderStatus = {
    MENUNGGU: 'MENUNGGU',
    PICKUP_OTW: 'PICKUP_OTW',
    BARANG_DIAMBIL: 'BARANG_DIAMBIL',
    DIKIRIM: 'DIKIRIM',
    SELESAI: 'SELESAI',
    GAGAL: 'GAGAL',
    BATAL: 'BATAL',
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

// Status emoji mapping
export const StatusEmoji: Record<string, string> = {
    MENUNGGU: '⏳',
    PICKUP_OTW: '🚚',
    BARANG_DIAMBIL: '📦',
    DIKIRIM: '🛵',
    SELESAI: '✅',
    GAGAL: '❌',
    BATAL: '🚫',
    // New status types
    OFFERED: '📩',
    ACCEPTED: '✅',
    ASSIGNED: '📋',
    OTW_PICKUP: '🚚',
    PICKED: '📦',
    OTW_DROPOFF: '🏃',
    NEED_POD: '📸',
    DELIVERED: '🎉',
    REJECTED: '❌',
    CANCELLED: '🚫',
    PICKUP: '📦',
};

// Status label mapping
export const StatusLabel: Record<string, string> = {
    MENUNGGU: 'Menunggu Kurir',
    PICKUP_OTW: 'OTW ke Pickup',
    BARANG_DIAMBIL: 'Barang Sudah Diambil',
    DIKIRIM: 'Dalam Pengiriman',
    SELESAI: 'Selesai',
    GAGAL: 'Gagal',
    BATAL: 'Dibatalkan',
    // New status types
    OFFERED: 'Ditawarkan',
    ACCEPTED: 'Diterima',
    ASSIGNED: 'Ditugaskan',
    OTW_PICKUP: 'OTW Jemput',
    PICKED: 'Sudah Jemput',
    OTW_DROPOFF: 'OTW Antar',
    NEED_POD: 'Terkirim - Butuh POD',
    DELIVERED: 'Selesai',
    REJECTED: 'Ditolak',
    CANCELLED: 'Dibatalkan',
    PICKUP: 'Sudah Jemput',
};
