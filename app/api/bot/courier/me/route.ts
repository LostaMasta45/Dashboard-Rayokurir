import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/bot/courier/me
 * 
 * Endpoint untuk mendapatkan info kurir berdasarkan Telegram user ID.
 * Digunakan oleh bot untuk mengecek apakah user sudah terhubung.
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
                message: "Akun Telegram belum terhubung ke kurir manapun.",
            });
        }

        // Get active orders count
        const { count: activeOrdersCount } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("kurirId", courier.id)
            .not("status", "in", "(DELIVERED,SELESAI,CANCELLED,REJECTED)");

        // Get today's completed orders
        const today = new Date().toDateString();
        const { count: todayCompletedCount } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("kurirId", courier.id)
            .eq("createdDate", today)
            .in("status", ["DELIVERED", "SELESAI"]);

        return NextResponse.json({
            linked: true,
            courier: {
                id: courier.id,
                nama: courier.nama,
                wa: courier.wa,
                online: courier.online,
                aktif: courier.aktif,
            },
            stats: {
                activeOrders: activeOrdersCount || 0,
                todayCompleted: todayCompletedCount || 0,
            },
        });

    } catch (error) {
        console.error("[bot/courier/me] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
