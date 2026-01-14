// Inline Keyboard Builders for Telegram Bots
// Rayo Kurir - Admin & Kurir Bot Keyboards

import { OrderStatusType } from './utils';

// Types for inline keyboard
export interface InlineKeyboardButton {
    text: string;
    callback_data?: string;
    url?: string;
}

export interface InlineKeyboardMarkup {
    inline_keyboard: InlineKeyboardButton[][];
}

// ============================================
// ADMIN BOT KEYBOARDS
// ============================================

// Main menu keyboard for admin
export function getAdminMainMenu(): InlineKeyboardMarkup {
    return {
        inline_keyboard: [
            [
                { text: '📦 Pesanan Baru', callback_data: 'admin_orders_new' },
                { text: '📋 Order Aktif', callback_data: 'admin_orders_active' },
            ],
            [
                { text: '🚚 Assign Kurir', callback_data: 'admin_assign' },
                { text: '✅ Selesai Hari Ini', callback_data: 'admin_orders_done' },
            ],
            [
                { text: '👥 Kelola Kurir', callback_data: 'admin_kurir' },
                { text: '🏪 Kelola Mitra', callback_data: 'admin_mitra' },
            ],
            [
                { text: '💰 Setoran COD', callback_data: 'admin_cod' },
                { text: '📈 Laporan', callback_data: 'admin_reports' },
            ],
            [
                { text: '🔄 Refresh', callback_data: 'admin_refresh' },
            ],
        ],
    };
}

// Order action buttons
export function getOrderActions(orderId: string): InlineKeyboardMarkup {
    return {
        inline_keyboard: [
            [
                { text: '🚚 Assign Kurir', callback_data: `assign_${orderId}` },
                { text: '❌ Tolak', callback_data: `reject_${orderId}` },
            ],
            [
                { text: '📋 Detail', callback_data: `detail_${orderId}` },
                { text: '📞 Hub. Customer', callback_data: `call_${orderId}` },
            ],
        ],
    };
}

// Kurir list for assignment
export function getKurirListKeyboard(
    kurirList: Array<{ id: string; name: string; ordersCount: number; isOnline: boolean }>,
    orderId: string
): InlineKeyboardMarkup {
    const buttons: InlineKeyboardButton[][] = kurirList.map((kurir) => [
        {
            text: `${kurir.isOnline ? '⚡' : '🔴'} ${kurir.name} (${kurir.ordersCount})`,
            callback_data: `assignto_${orderId}_${kurir.id}`,
        },
    ]);

    buttons.push([{ text: '← Kembali', callback_data: 'admin_menu' }]);

    return { inline_keyboard: buttons };
}

// Reports menu
export function getReportsMenu(): InlineKeyboardMarkup {
    return {
        inline_keyboard: [
            [
                { text: '📊 Laporan Hari Ini', callback_data: 'report_daily' },
                { text: '📈 Laporan Mingguan', callback_data: 'report_weekly' },
            ],
            [
                { text: '💰 Laporan COD', callback_data: 'report_cod' },
                { text: '👥 Performa Kurir', callback_data: 'report_kurir' },
            ],
            [
                { text: '← Kembali', callback_data: 'admin_menu' },
            ],
        ],
    };
}

// Confirm action keyboard
export function getConfirmKeyboard(action: string, id: string): InlineKeyboardMarkup {
    return {
        inline_keyboard: [
            [
                { text: '✅ Ya, Lanjutkan', callback_data: `confirm_${action}_${id}` },
                { text: '❌ Batal', callback_data: 'admin_menu' },
            ],
        ],
    };
}

// ============================================
// KURIR BOT KEYBOARDS
// ============================================

// Main menu keyboard for kurir
export function getKurirMainMenu(isOnline: boolean): InlineKeyboardMarkup {
    return {
        inline_keyboard: [
            [
                { text: '📋 Tugas Saya', callback_data: 'kurir_tasks' },
                { text: '📊 Riwayat', callback_data: 'kurir_history' },
            ],
            [
                { text: '👛 Dompet', callback_data: 'kurir_wallet' },
                { text: '📈 Statistik', callback_data: 'kurir_stats' },
            ],
            [
                {
                    text: isOnline ? '🟢 Online (Klik untuk Offline)' : '🔴 Offline (Klik untuk Online)',
                    callback_data: isOnline ? 'kurir_offline' : 'kurir_online',
                },
            ],
            [
                { text: '❓ Bantuan', callback_data: 'kurir_help' },
            ],
        ],
    };
}

// Task action buttons (when receiving new task)
export function getTaskActions(orderId: string): InlineKeyboardMarkup {
    return {
        inline_keyboard: [
            [
                { text: '✅ Terima Tugas', callback_data: `accept_${orderId}` },
                { text: '❌ Tolak', callback_data: `decline_${orderId}` },
            ],
            [
                { text: '📍 Navigasi ke Pickup', callback_data: `navigate_pickup_${orderId}` },
            ],
            [
                { text: '📞 Hubungi Customer', callback_data: `call_customer_${orderId}` },
            ],
        ],
    };
}

// Status update buttons
export function getStatusUpdateKeyboard(orderId: string, currentStatus: OrderStatusType): InlineKeyboardMarkup {
    const buttons: InlineKeyboardButton[][] = [];

    // Show relevant next status options based on current status
    if (currentStatus === 'MENUNGGU' || currentStatus === 'PICKUP_OTW') {
        buttons.push([{ text: '📍 Sampai di Mitra', callback_data: `status_${orderId}_BARANG_DIAMBIL` }]);
    }
    if (currentStatus === 'BARANG_DIAMBIL') {
        buttons.push([{ text: '🚚 OTW ke Customer', callback_data: `status_${orderId}_DIKIRIM` }]);
    }
    if (currentStatus === 'DIKIRIM') {
        buttons.push([
            { text: '✅ Pesanan Selesai', callback_data: `status_${orderId}_SELESAI` },
        ]);
        buttons.push([
            { text: '❌ Gagal Antar', callback_data: `status_${orderId}_GAGAL` },
        ]);
    }

    buttons.push([{ text: '📸 Upload Bukti Foto', callback_data: `upload_${orderId}` }]);
    buttons.push([{ text: '← Kembali', callback_data: 'kurir_tasks' }]);

    return { inline_keyboard: buttons };
}

// Wallet actions
export function getWalletKeyboard(): InlineKeyboardMarkup {
    return {
        inline_keyboard: [
            [
                { text: '💳 Setor COD', callback_data: 'wallet_setor' },
                { text: '📜 Riwayat Setoran', callback_data: 'wallet_history' },
            ],
            [
                { text: '← Kembali', callback_data: 'kurir_menu' },
            ],
        ],
    };
}

// Back button
export function getBackButton(callback: string): InlineKeyboardMarkup {
    return {
        inline_keyboard: [
            [{ text: '← Kembali', callback_data: callback }],
        ],
    };
}

// Pagination buttons
export function getPaginationKeyboard(
    currentPage: number,
    totalPages: number,
    baseCallback: string
): InlineKeyboardMarkup {
    const buttons: InlineKeyboardButton[] = [];

    if (currentPage > 1) {
        buttons.push({ text: '◀️ Prev', callback_data: `${baseCallback}_page_${currentPage - 1}` });
    }

    buttons.push({ text: `${currentPage}/${totalPages}`, callback_data: 'noop' });

    if (currentPage < totalPages) {
        buttons.push({ text: 'Next ▶️', callback_data: `${baseCallback}_page_${currentPage + 1}` });
    }

    return {
        inline_keyboard: [
            buttons,
            [{ text: '← Kembali', callback_data: 'kurir_menu' }],
        ],
    };
}
