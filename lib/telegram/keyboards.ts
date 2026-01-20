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

// Status update buttons - NEW STATE MACHINE
export function getStatusUpdateKeyboard(orderId: string, currentStatus: string): InlineKeyboardMarkup {
    const buttons: InlineKeyboardButton[][] = [];

    // Show relevant next status options based on current status
    switch (currentStatus) {
        case 'OFFERED':
            buttons.push([
                { text: '✅ Terima', callback_data: `rk:accept:${orderId}` },
                { text: '❌ Tolak', callback_data: `rk:reject:${orderId}` },
            ]);
            break;
        case 'ACCEPTED':
        case 'ASSIGNED':
            buttons.push([{ text: '🚚 OTW Jemput', callback_data: `rk:status:${orderId}:OTW_PICKUP` }]);
            break;
        case 'OTW_PICKUP':
            buttons.push([{ text: '📦 Sudah Jemput', callback_data: `rk:status:${orderId}:PICKED` }]);
            break;
        case 'PICKED':
        case 'PICKUP':
        case 'BARANG_DIAMBIL':
            buttons.push([{ text: '🏃 OTW Antar', callback_data: `rk:status:${orderId}:OTW_DROPOFF` }]);
            break;
        case 'OTW_DROPOFF':
        case 'DIKIRIM':
            buttons.push([{ text: '✅ Terkirim', callback_data: `rk:status:${orderId}:NEED_POD` }]);
            break;
        case 'NEED_POD':
            buttons.push([{ text: '📸 Upload Foto POD', callback_data: `rk:pod:${orderId}` }]);
            break;
        // Legacy support
        case 'MENUNGGU':
        case 'PICKUP_OTW':
            buttons.push([{ text: '📍 Sampai di Pickup', callback_data: `rk:status:${orderId}:PICKED` }]);
            break;
    }

    // Add issue reporting button for active orders
    if (!['DELIVERED', 'SELESAI', 'REJECTED', 'CANCELLED', 'NEW', 'BARU', 'OFFERED'].includes(currentStatus)) {
        buttons.push([{ text: '⚠️ Laporkan Kendala', callback_data: `rk:issue:${orderId}` }]);
    }

    buttons.push([{ text: '← Kembali ke Menu', callback_data: 'kurir_menu' }]);

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

// ============================================
// NEW: JOB CARD & PAIRING KEYBOARDS
// ============================================

// Job Card keyboard for OFFERED orders
export function getJobCardKeyboard(orderId: string, pickupMaps?: string, dropoffMaps?: string): InlineKeyboardMarkup {
    const buttons: InlineKeyboardButton[][] = [
        [
            { text: '✅ Terima Order', callback_data: `rk:accept:${orderId}` },
            { text: '❌ Tolak', callback_data: `rk:reject_reason:${orderId}` },
        ],
    ];

    // Add navigation buttons if maps links available
    if (pickupMaps || dropoffMaps) {
        const navButtons: InlineKeyboardButton[] = [];
        if (pickupMaps) {
            navButtons.push({ text: '📍 Maps Pickup', url: pickupMaps });
        }
        if (dropoffMaps) {
            navButtons.push({ text: '📍 Maps Dropoff', url: dropoffMaps });
        }
        buttons.push(navButtons);
    }

    return { inline_keyboard: buttons };
}

// Reject reason selection keyboard
export function getRejectReasonKeyboard(orderId: string): InlineKeyboardMarkup {
    return {
        inline_keyboard: [
            [{ text: '🚫 Jarak terlalu jauh', callback_data: `rk:reject:${orderId}:jarak` }],
            [{ text: '📦 Sudah banyak order', callback_data: `rk:reject:${orderId}:sibuk` }],
            [{ text: '🏥 Kondisi tidak fit', callback_data: `rk:reject:${orderId}:sakit` }],
            [{ text: '🔧 Kendaraan bermasalah', callback_data: `rk:reject:${orderId}:kendaraan` }],
            [{ text: '❓ Alasan lain', callback_data: `rk:reject:${orderId}:lain` }],
            [{ text: '← Batal', callback_data: `rk:detail:${orderId}` }],
        ],
    };
}

// Issue type selection keyboard
export function getIssueTypeKeyboard(orderId: string): InlineKeyboardMarkup {
    return {
        inline_keyboard: [
            [{ text: '📍 Alamat tidak ditemukan', callback_data: `rk:issue_send:${orderId}:alamat` }],
            [{ text: '📞 Customer tidak bisa dihubungi', callback_data: `rk:issue_send:${orderId}:kontak` }],
            [{ text: '📦 Barang rusak/hilang', callback_data: `rk:issue_send:${orderId}:barang` }],
            [{ text: '🚗 Kendala transportasi', callback_data: `rk:issue_send:${orderId}:transportasi` }],
            [{ text: '❓ Kendala lainnya', callback_data: `rk:issue_send:${orderId}:lain` }],
            [{ text: '← Batal', callback_data: `rk:detail:${orderId}` }],
        ],
    };
}

// Order list keyboard (for /orders command)
export function getOrderListKeyboard(orders: Array<{ id: string; shortId: string; status: string }>): InlineKeyboardMarkup {
    const buttons: InlineKeyboardButton[][] = orders.slice(0, 5).map(order => {
        const statusEmoji = getStatusEmoji(order.status);
        return [{ text: `${statusEmoji} #${order.shortId}`, callback_data: `rk:detail:${order.id}` }];
    });

    buttons.push([{ text: '← Kembali ke Menu', callback_data: 'kurir_menu' }]);

    return { inline_keyboard: buttons };
}

// Helper to get status emoji
function getStatusEmoji(status: string): string {
    const emojiMap: Record<string, string> = {
        OFFERED: '📩',
        ACCEPTED: '✅',
        OTW_PICKUP: '🚚',
        PICKED: '📦',
        OTW_DROPOFF: '🏃',
        NEED_POD: '📸',
        DELIVERED: '🎉',
        REJECTED: '❌',
        CANCELLED: '🚫',
        // Legacy
        ASSIGNED: '✅',
        PICKUP: '📦',
        DIKIRIM: '🏃',
        SELESAI: '🎉',
    };
    return emojiMap[status] || '📋';
}

// Pairing confirmation keyboard
export function getPairingKeyboard(): InlineKeyboardMarkup {
    return {
        inline_keyboard: [
            [{ text: '🔗 Masukkan Kode OTP', callback_data: 'rk:pairing:enter' }],
            [{ text: '❓ Cara mendapatkan kode?', callback_data: 'rk:pairing:help' }],
        ],
    };
}
