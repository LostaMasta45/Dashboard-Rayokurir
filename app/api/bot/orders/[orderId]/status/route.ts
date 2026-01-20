import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { Order } from "@/lib/auth";

/**
 * POST /api/bot/orders/[orderId]/status
 * 
 * Endpoint untuk kurir update status order via Telegram bot.
 * Mengikuti state machine yang ketat.
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

// Define allowed status transitions for couriers
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    ACCEPTED: ["OTW_PICKUP"],
    OTW_PICKUP: ["PICKED"],
    PICKED: ["OTW_DROPOFF"],
    OTW_DROPOFF: ["NEED_POD"],
    NEED_POD: ["DELIVERED"],
    // Legacy support
    ASSIGNED: ["OTW_PICKUP", "PICKUP"],
    PICKUP: ["OTW_DROPOFF", "DIKIRIM"],
    DIKIRIM: ["NEED_POD", "SELESAI"],
};

// Status labels for messages
const STATUS_LABELS: Record<string, string> = {
    OTW_PICKUP: "OTW Jemput",
    PICKED: "Sudah Jemput",
    OTW_DROPOFF: "OTW Antar",
    NEED_POD: "Terkirim - Butuh Foto POD",
    DELIVERED: "Selesai",
};

// Next action hints
const NEXT_ACTIONS: Record<string, string> = {
    OTW_PICKUP: "Klik 'Sudah Jemput' setelah barang diambil.",
    PICKED: "Klik 'OTW Antar' saat mulai perjalanan ke lokasi dropoff.",
    OTW_DROPOFF: "Klik 'Terkirim' setelah barang diterima customer.",
    NEED_POD: "Upload foto bukti pengiriman untuk menyelesaikan order.",
    DELIVERED: "Order selesai! Terima kasih.",
};

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
        const { telegramUserId, newStatus } = body;

        if (!telegramUserId || !newStatus) {
            return NextResponse.json(
                { error: "telegramUserId and newStatus are required" },
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

        // Validate: check allowed transitions
        const allowedNext = ALLOWED_TRANSITIONS[order.status] || [];
        if (!allowedNext.includes(newStatus)) {
            return NextResponse.json(
                {
                    error: `Transisi status tidak valid. Dari ${order.status} hanya bisa ke: ${allowedNext.join(", ") || "tidak ada"}`,
                    currentStatus: order.status,
                    allowedNextStatuses: allowedNext,
                },
                { status: 400 }
            );
        }

        // Update order status
        const now = new Date().toISOString();
        const auditLog = order.auditLog || [];
        auditLog.push({
            event: `STATUS_${newStatus}`,
            at: now,
            actorType: "COURIER",
            actorId: courier.id,
            meta: { telegramUserId, previousStatus: order.status },
        });

        const { error: updateError } = await supabase
            .from("orders")
            .update({
                status: newStatus,
                auditLog,
            })
            .eq("id", orderId);

        if (updateError) {
            return NextResponse.json(
                { error: "Failed to update status" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            orderId,
            previousStatus: order.status,
            newStatus,
            statusLabel: STATUS_LABELS[newStatus] || newStatus,
            message: `Status order #${orderId.slice(-6)} berhasil diupdate: ${STATUS_LABELS[newStatus] || newStatus}`,
            nextAction: NEXT_ACTIONS[newStatus] || null,
        });

    } catch (error) {
        console.error("[bot/orders/status] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
