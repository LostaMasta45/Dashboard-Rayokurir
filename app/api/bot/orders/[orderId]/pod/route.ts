import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * POST /api/bot/orders/[orderId]/pod
 * 
 * Endpoint untuk kurir upload foto POD (Proof of Delivery) via Telegram bot.
 * Menambahkan foto ke array podPhotos dan update status ke DELIVERED.
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
        const { telegramUserId, photoUrl, fileId } = body;

        if (!telegramUserId) {
            return NextResponse.json(
                { error: "telegramUserId is required" },
                { status: 400 }
            );
        }

        if (!photoUrl && !fileId) {
            return NextResponse.json(
                { error: "photoUrl or fileId is required" },
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

        // Validate: order should be in NEED_POD status (or allow upload anytime after OTW_DROPOFF)
        const allowedStatuses = ["NEED_POD", "OTW_DROPOFF", "DIKIRIM"];
        if (!allowedStatuses.includes(order.status)) {
            return NextResponse.json(
                { error: `POD tidak bisa diupload pada status ${order.status}. Status harus: ${allowedStatuses.join(", ")}` },
                { status: 400 }
            );
        }

        // Add photo to podPhotos array
        const now = new Date().toISOString();
        const podPhotos = order.podPhotos || [];
        podPhotos.push({
            url: photoUrl || `telegram://file/${fileId}`,
            fileId: fileId || null,
            uploadedAt: now,
            uploadedBy: courier.id,
        });

        // Update audit log
        const auditLog = order.auditLog || [];
        auditLog.push({
            event: "POD_UPLOADED",
            at: now,
            actorType: "COURIER",
            actorId: courier.id,
            meta: { telegramUserId, photoCount: podPhotos.length },
        });

        // Update order: add POD and change status to DELIVERED
        const { error: updateError } = await supabase
            .from("orders")
            .update({
                status: "DELIVERED",
                podPhotos,
                auditLog,
            })
            .eq("id", orderId);

        if (updateError) {
            return NextResponse.json(
                { error: "Failed to upload POD" },
                { status: 500 }
            );
        }

        // Check if there's COD to collect
        const hasCOD = order.cod?.isCOD && !order.cod?.codPaid;

        return NextResponse.json({
            success: true,
            orderId,
            newStatus: "DELIVERED",
            photoCount: podPhotos.length,
            message: `Bukti pengiriman berhasil diupload! Order #${orderId.slice(-6)} SELESAI.`,
            nextAction: hasCOD
                ? `Pastikan sudah mengumpulkan COD sebesar Rp ${(order.cod?.nominal || 0).toLocaleString("id-ID")} dan setor ke admin.`
                : "Order selesai! Terima kasih atas kerja kerasnya.",
            hasPendingCOD: hasCOD,
            codAmount: hasCOD ? order.cod?.nominal : 0,
        });

    } catch (error) {
        console.error("[bot/orders/pod] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
