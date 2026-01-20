import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * POST /api/bot/orders/[orderId]/reject
 * 
 * Endpoint untuk kurir menolak order via Telegram bot.
 * Mengubah status dari OFFERED → REJECTED.
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
        const { telegramUserId, reason } = body;

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
                { error: `Order tidak bisa ditolak. Status saat ini: ${order.status}` },
                { status: 400 }
            );
        }

        // Update order status to REJECTED, clear kurirId
        const now = new Date().toISOString();
        const auditLog = order.auditLog || [];
        auditLog.push({
            event: "ORDER_REJECTED",
            at: now,
            actorType: "COURIER",
            actorId: courier.id,
            meta: { telegramUserId, reason: reason || "Tidak disebutkan" },
        });

        const { error: updateError } = await supabase
            .from("orders")
            .update({
                status: "NEW", // Return to NEW so admin can reassign
                kurirId: null,
                auditLog,
            })
            .eq("id", orderId);

        if (updateError) {
            return NextResponse.json(
                { error: "Failed to reject order" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            orderId,
            newStatus: "NEW",
            message: `Order #${orderId.slice(-6)} ditolak. Admin akan mencari kurir lain.`,
            reason: reason || "Tidak disebutkan",
        });

    } catch (error) {
        console.error("[bot/orders/reject] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
