// Debug endpoint for Kurir Bot
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
    try {
        const kurirBotToken = process.env.TELEGRAM_KURIR_BOT_TOKEN;
        const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

        // Check couriers table structure
        const { data: couriers, error: couriersError } = await supabase
            .from('couriers')
            .select('*')
            .limit(5);

        // Check if telegram_user_id column exists
        let columnsInfo = null;
        try {
            const testQuery = await supabase
                .from('couriers')
                .select('id, telegram_user_id')
                .limit(1);
            columnsInfo = {
                hasColumn: !testQuery.error,
                error: testQuery.error?.message
            };
        } catch (e) {
            columnsInfo = { hasColumn: false, error: String(e) };
        }

        // Get webhook info
        let webhookInfo = null;
        if (kurirBotToken) {
            const res = await fetch(`https://api.telegram.org/bot${kurirBotToken}/getWebhookInfo`);
            webhookInfo = await res.json();
        }

        return NextResponse.json({
            status: 'ok',
            env: {
                hasKurirBotToken: !!kurirBotToken,
                adminChatId: adminChatId,
                supabaseUrl: supabaseUrl?.slice(0, 30) + '...',
            },
            database: {
                couriersCount: couriers?.length || 0,
                couriers: couriers,
                couriersError: couriersError?.message,
                telegramUserIdColumn: columnsInfo,
            },
            webhook: webhookInfo,
        });
    } catch (error) {
        return NextResponse.json({
            status: 'error',
            error: String(error)
        }, { status: 500 });
    }
}

// POST to set webhook
export async function POST(request: NextRequest) {
    try {
        const { action } = await request.json();
        const kurirBotToken = process.env.TELEGRAM_KURIR_BOT_TOKEN;
        const baseUrl = request.headers.get('host');
        const protocol = baseUrl?.includes('localhost') ? 'http' : 'https';

        if (action === 'set_webhook') {
            const webhookUrl = `${protocol}://${baseUrl}/api/telegram/kurir/webhook`;
            const res = await fetch(
                `https://api.telegram.org/bot${kurirBotToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
            );
            const result = await res.json();
            return NextResponse.json({ action: 'set_webhook', webhookUrl, result });
        }

        if (action === 'register_courier') {
            const telegramId = parseInt(process.env.TELEGRAM_ADMIN_CHAT_ID || '0');

            // Update first courier with telegram ID
            const { data, error } = await supabase
                .from('couriers')
                .update({
                    telegram_user_id: telegramId,
                    telegram_chat_id: telegramId,
                    online: true,
                    aktif: true
                })
                .eq('id', '1')
                .select();

            return NextResponse.json({
                action: 'register_courier',
                telegramId,
                result: data,
                error: error?.message
            });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
