import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * POST /api/bot/orders/[orderId]/issue
 * 
 * Endpoint untuk kurir melaporkan kendala via Telegram bot.
 * Akan diteruskan ke admin untuk ditindaklanjuti.
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
        const { telegramUserId, issueType, description } = body;

        if (!telegramUserId) {
            return NextResponse.json(
                { error: "telegramUserId is required" },
                { status: 400 }
            );
        }

        if (!issueType || !description) {
            return NextResponse.json(
                { error: "issueType and description are required" },
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

        // Add issue to audit log
        const now = new Date().toISOString();
        const auditLog = order.auditLog || [];
        auditLog.push({
            event: "ISSUE_REPORTED",
            at: now,
            actorType: "COURIER",
            actorId: courier.id,
            meta: {
                telegramUserId,
                issueType,
                description,
                orderStatus: order.status,
            },
        });

        // Update order with audit log
        const { error: updateError } = await supabase
            .from("orders")
            .update({ auditLog })
            .eq("id", orderId);

        if (updateError) {
            return NextResponse.json(
                { error: "Failed to report issue" },
                { status: 500 }
            );
        }

        // TODO: Send notification to admin bot
        // This would be implemented in the admin notification phase

        return NextResponse.json({
            success: true,
            orderId,
            message: `Kendala berhasil dilaporkan untuk Order #${orderId.slice(-6)}. Admin akan segera menghubungi Anda.`,
            issueType,
            description,
        });

    } catch (error) {
        console.error("[bot/orders/issue] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
