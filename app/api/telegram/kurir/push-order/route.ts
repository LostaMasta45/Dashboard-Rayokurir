// API endpoint to push order notification to courier's Telegram
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramMessage, getKurirBotToken, formatCurrency } from '@/lib/telegram/utils';
import { getJobCardKeyboard } from '@/lib/telegram/keyboards';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
    try {
        const { orderId, courierId } = await request.json();

        if (!orderId || !courierId) {
            return NextResponse.json({ ok: false, error: 'orderId and courierId required' }, { status: 400 });
        }

        // Get order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
        }

        // Get courier details with Telegram chat ID
        const { data: courier, error: courierError } = await supabase
            .from('couriers')
            .select('*')
            .eq('id', courierId)
            .single();

        if (courierError || !courier) {
            return NextResponse.json({ ok: false, error: 'Courier not found' }, { status: 404 });
        }

        // Check if courier has Telegram connected
        const chatId = courier.telegram_chat_id || courier.telegram_user_id;
        if (!chatId) {
            return NextResponse.json({
                ok: false,
                error: 'Courier not connected to Telegram',
                courierName: courier.nama
            }, { status: 400 });
        }

        // Build job card message
        const botToken = getKurirBotToken();
        const ongkir = order.ongkir || 0;
        const codNominal = order.cod?.nominal || 0;
        const danaTalangan = order.danaTalangan || 0;
        const pickupAlamat = order.pickup?.alamat || 'Tidak ada';
        const dropoffAlamat = order.dropoff?.alamat || 'Tidak ada';
        const pengirimNama = order.pengirim?.nama || 'Tidak diketahui';
        const serviceType = order.serviceType || 'Regular';
        const notes = order.notes || '-';

        const message = `🛵 <b>ORDER BARU</b>\n\n` +
            `📦 <b>Pengirim:</b> ${pengirimNama}\n` +
            `📍 <b>Pickup:</b> ${pickupAlamat}\n` +
            `🏠 <b>Dropoff:</b> ${dropoffAlamat}\n\n` +
            `🚚 <b>Layanan:</b> ${serviceType}\n` +
            `💰 <b>Ongkir:</b> ${formatCurrency(ongkir)}\n` +
            (codNominal > 0 ? `💵 <b>COD:</b> ${formatCurrency(codNominal)}\n` : '') +
            (danaTalangan > 0 ? `🏦 <b>Talangan:</b> ${formatCurrency(danaTalangan)}\n` : '') +
            `\n📝 <b>Catatan:</b> ${notes}\n\n` +
            `⏱️ <i>Silakan respon cepat!</i>`;

        // Send message with inline keyboard
        const result = await sendTelegramMessage(
            botToken,
            chatId,
            message,
            { reply_markup: getJobCardKeyboard(orderId) }
        );

        if (!result.ok) {
            console.error('[push-order] Telegram error:', result);
            return NextResponse.json({
                ok: false,
                error: 'Failed to send Telegram message',
                telegramError: result.description
            }, { status: 500 });
        }

        return NextResponse.json({
            ok: true,
            messageId: result.result?.message_id,
            courierName: courier.nama,
            chatId: chatId
        });

    } catch (error) {
        console.error('[push-order] Error:', error);
        return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
    }
}
