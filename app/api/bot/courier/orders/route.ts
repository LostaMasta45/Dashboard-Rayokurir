import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/bot/courier/orders
 * 
 * Endpoint untuk mendapatkan daftar order aktif kurir.
 * Digunakan oleh bot untuk command /orders.
 */

// Verify bot secret token
function verifyBotSecret(request: NextRequest): boolean {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return false;
    }
    const token = authHeader.substring(7);
    return token === process.env.BOT_SHARED_SECRET;
}

export async function GET(request: NextRequest) {
    // Verify bot secret
    if (!verifyBotSecret(request)) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const telegramUserId = searchParams.get("telegramUserId");

        if (!telegramUserId) {
            return NextResponse.json(
                { error: "telegramUserId is required" },
                { status: 400 }
            );
        }

        // Get courier by Telegram user ID
        const { data: courier, error: courierError } = await supabase
            .from("couriers")
            .select("*")
            .eq("telegramUserId", parseInt(telegramUserId))
            .single();

        if (courierError || !courier) {
            return NextResponse.json({
                linked: false,
                error: "Akun Telegram belum terhubung.",
            }, { status: 404 });
        }

        // Get active orders (exclude completed/cancelled)
        const { data: orders, error: ordersError } = await supabase
            .from("orders")
            .select("*")
            .eq("kurirId", courier.id)
            .not("status", "in", "(DELIVERED,SELESAI,CANCELLED,REJECTED)")
            .order("createdAt", { ascending: false });

        if (ordersError) {
            return NextResponse.json(
                { error: "Failed to fetch orders" },
                { status: 500 }
            );
        }

        // Format orders for bot display
        const formattedOrders = (orders || []).map(order => ({
            id: order.id,
            shortId: order.id.slice(-6),
            status: order.status,
            pengirim: order.pengirim?.nama || "Unknown",
            pickup: order.pickup?.alamat || "Unknown",
            dropoff: order.dropoff?.alamat || "Unknown",
            ongkir: order.ongkir,
            danaTalangan: order.danaTalangan || 0,
            isCOD: order.cod?.isCOD || false,
            codNominal: order.cod?.nominal || 0,
            jenisOrder: order.jenisOrder,
            notes: order.notes || null,
        }));

        return NextResponse.json({
            success: true,
            courierName: courier.nama,
            orders: formattedOrders,
            count: formattedOrders.length,
        });

    } catch (error) {
        console.error("[bot/courier/orders] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
