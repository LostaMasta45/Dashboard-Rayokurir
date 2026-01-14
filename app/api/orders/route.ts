// API Route to send notifications to Admin via Telegram
// Used by Mitra Page when user places an order

import { NextRequest, NextResponse } from 'next/server';
import {
    sendTelegramMessage,
    getAdminBotToken,
    getAdminChatId,
    generateOrderNumber,
    formatCurrency,
} from '@/lib/telegram/utils';
import { getOrderActions } from '@/lib/telegram/keyboards';
import { getNewOrderNotification } from '@/lib/telegram/messages';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface OrderItem {
    name: string;
    qty: number;
    price: number;
    notes?: string;
}

interface CreateOrderRequest {
    // Mitra info
    mitraId?: string;
    mitraName: string;
    mitraType: string;
    pickupAddress: string;

    // Customer info
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerLandmark?: string;
    customerVillage?: string;

    // Order details
    items: OrderItem[];
    shoppingList?: string; // For retail
    serviceDetails?: object; // For service

    // Pricing
    subtotal: number;
    deliveryFee: number;
    discount?: number;
    total: number;

    // Options
    isCOD?: boolean;
    codAmount?: number;
    isExpress?: boolean;
    isTitipBeli?: boolean;

    // Notes
    notes?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: CreateOrderRequest = await request.json();

        // Validate required fields
        if (!body.customerName || !body.customerPhone || !body.customerAddress) {
            return NextResponse.json(
                { error: 'Missing required customer information' },
                { status: 400 }
            );
        }

        // Generate order number
        const orderNumber = generateOrderNumber();

        // Create order in database
        const { data: order, error: dbError } = await supabase
            .from('orders')
            .insert({
                order_number: orderNumber,
                mitra_id: body.mitraId || null,
                mitra_name: body.mitraName,
                mitra_type: body.mitraType,
                pickup_address: body.pickupAddress,
                customer_name: body.customerName,
                customer_phone: body.customerPhone,
                customer_address: body.customerAddress,
                customer_landmark: body.customerLandmark,
                customer_village: body.customerVillage,
                items: body.items,
                shopping_list: body.shoppingList,
                service_details: body.serviceDetails,
                subtotal: body.subtotal,
                delivery_fee: body.deliveryFee,
                discount: body.discount || 0,
                total: body.total,
                is_cod: body.isCOD ?? true,
                cod_amount: body.codAmount || body.total,
                is_express: body.isExpress || false,
                is_titip_beli: body.isTitipBeli || false,
                notes: body.notes,
                status: 'MENUNGGU',
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json(
                { error: 'Failed to create order' },
                { status: 500 }
            );
        }

        // Send notification to Admin Telegram Bot
        const botToken = getAdminBotToken();
        const adminChatId = getAdminChatId();

        if (botToken && adminChatId) {
            const orderData = {
                id: order.id,
                orderNumber: order.order_number,
                mitraName: order.mitra_name,
                mitraAddress: order.pickup_address,
                customerName: order.customer_name,
                customerPhone: order.customer_phone,
                customerAddress: order.customer_address,
                items: order.items,
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
                adminChatId,
                getNewOrderNotification(orderData),
                { reply_markup: getOrderActions(order.id) }
            );
        }

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                orderNumber: order.order_number,
                status: order.status,
            },
            message: 'Order created successfully',
        });

    } catch (error) {
        console.error('Create order error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET - Fetch orders (for admin dashboard)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const kurirId = searchParams.get('kurir_id');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = supabase
            .from('orders')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            if (status === 'active') {
                query = query.in('status', ['PICKUP_OTW', 'BARANG_DIAMBIL', 'DIKIRIM']);
            } else {
                query = query.eq('status', status);
            }
        }

        if (kurirId) {
            query = query.eq('kurir_id', kurirId);
        }

        const { data: orders, error, count } = await query;

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
        }

        return NextResponse.json({
            orders,
            total: count,
            limit,
            offset,
        });

    } catch (error) {
        console.error('Fetch orders error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
