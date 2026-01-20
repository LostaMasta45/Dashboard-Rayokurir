import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * POST /api/bot/orders/[orderId]/accept
 * 
 * Endpoint untuk kurir menerima order via Telegram bot.
 * Mengubah status dari OFFERED → ACCEPTED.
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

export async function POST(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    // Verify bot secret
    if (!verifyBotSecret(request)) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { orderId } = params;
        const body = await request.json();
        const { telegramUserId } = body;

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
            .eq("telegramUserId", telegramUserId)
            .single();

        if (courierError || !courier) {
            return NextResponse.json(
                { error: "Courier not found or not linked to Telegram" },
                { status: 404 }
            );
        }

        // Get order
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Validate: order must be assigned to this courier
        if (order.kurirId !== courier.id) {
            return NextResponse.json(
                { error: "Order tidak ditugaskan ke Anda" },
                { status: 403 }
            );
        }

        // Validate: order must be in OFFERED status
        if (order.status !== "OFFERED") {
            return NextResponse.json(
                { error: `Order tidak bisa diterima. Status saat ini: ${order.status}` },
                { status: 400 }
            );
        }

        // Update order status to ACCEPTED
        const now = new Date().toISOString();
        const auditLog = order.auditLog || [];
        auditLog.push({
            event: "ORDER_ACCEPTED",
            at: now,
            actorType: "COURIER",
            actorId: courier.id,
            meta: { telegramUserId },
        });

        const { error: updateError } = await supabase
            .from("orders")
            .update({
                status: "ACCEPTED",
                auditLog,
            })
            .eq("id", orderId);

        if (updateError) {
            return NextResponse.json(
                { error: "Failed to accept order" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            orderId,
            newStatus: "ACCEPTED",
            message: `Order #${orderId.slice(-6)} berhasil diterima!`,
            nextAction: "Klik 'OTW Jemput' saat mulai perjalanan ke lokasi pickup.",
        });

    } catch (error) {
        console.error("[bot/orders/accept] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
