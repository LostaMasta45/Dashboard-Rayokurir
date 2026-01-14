// API Route for Kurir Management
// Admin can manage kurir data

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    sendTelegramMessage,
    getKurirBotToken,
} from '@/lib/telegram/utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Fetch all kurir or specific kurir
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const telegramId = searchParams.get('telegram_id');
        const onlineOnly = searchParams.get('online') === 'true';

        let query = supabase.from('kurir').select('*');

        if (id) {
            query = query.eq('id', id);
        } else if (telegramId) {
            query = query.eq('telegram_id', telegramId);
        } else {
            query = query.eq('is_active', true);
            if (onlineOnly) {
                query = query.eq('is_online', true);
            }
            query = query.order('is_online', { ascending: false }).order('name');
        }

        const { data: kurir, error } = await query;

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch kurir' }, { status: 500 });
        }

        return NextResponse.json({ kurir });

    } catch (error) {
        console.error('Fetch kurir error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Register new kurir
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.telegramId || !body.name || !body.phone) {
            return NextResponse.json(
                { error: 'Missing required fields: telegramId, name, phone' },
                { status: 400 }
            );
        }

        // Check if already exists
        const { data: existing } = await supabase
            .from('kurir')
            .select('id')
            .eq('telegram_id', body.telegramId)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'Kurir with this Telegram ID already exists' },
                { status: 409 }
            );
        }

        // Create kurir
        const { data: kurir, error } = await supabase
            .from('kurir')
            .insert({
                telegram_id: body.telegramId,
                name: body.name,
                phone: body.phone,
                is_online: false,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Create kurir error:', error);
            return NextResponse.json({ error: 'Failed to create kurir' }, { status: 500 });
        }

        // Send welcome message to kurir
        const botToken = getKurirBotToken();
        if (botToken && body.telegramId) {
            await sendTelegramMessage(
                botToken,
                body.telegramId,
                `🎉 <b>SELAMAT!</b>\n\n` +
                `Anda telah terdaftar sebagai Kurir Rayo.\n\n` +
                `👤 Nama: <b>${body.name}</b>\n` +
                `📱 HP: ${body.phone}\n\n` +
                `Ketik /start untuk mulai menerima tugas!`
            );
        }

        return NextResponse.json({
            success: true,
            kurir,
            message: 'Kurir registered successfully',
        });

    } catch (error) {
        console.error('Register kurir error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH - Update kurir
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.id) {
            return NextResponse.json({ error: 'Missing kurir ID' }, { status: 400 });
        }

        const updateData: any = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.phone !== undefined) updateData.phone = body.phone;
        if (body.isOnline !== undefined) updateData.is_online = body.isOnline;
        if (body.isActive !== undefined) updateData.is_active = body.isActive;
        if (body.rating !== undefined) updateData.rating = body.rating;

        const { data: kurir, error } = await supabase
            .from('kurir')
            .update(updateData)
            .eq('id', body.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: 'Failed to update kurir' }, { status: 500 });
        }

        return NextResponse.json({ success: true, kurir });

    } catch (error) {
        console.error('Update kurir error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Deactivate kurir (soft delete)
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing kurir ID' }, { status: 400 });
        }

        const { error } = await supabase
            .from('kurir')
            .update({ is_active: false, is_online: false })
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: 'Failed to deactivate kurir' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Kurir deactivated' });

    } catch (error) {
        console.error('Delete kurir error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
