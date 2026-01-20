import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { generateId } from "@/lib/auth";

/**
 * POST /api/bot/pairing
 * 
 * Endpoint untuk pairing akun kurir dengan Telegram.
 * 
 * Flow:
 * 1. Kurir memasukkan OTP di bot Telegram
 * 2. Bot memanggil endpoint ini dengan OTP dan telegramUserId
 * 3. Endpoint memvalidasi OTP dan menyimpan telegramUserId ke kurir
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

// Generate OTP for pairing
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const courierId = searchParams.get("courierId");

    if (!courierId) {
        return NextResponse.json(
            { error: "courierId is required" },
            { status: 400 }
        );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // Save OTP to courier record
    const { error } = await supabase
        .from("couriers")
        .update({
            pairingCode: otp,
            pairingCodeExpiresAt: expiresAt,
        })
        .eq("id", courierId);

    if (error) {
        return NextResponse.json(
            { error: "Failed to generate OTP" },
            { status: 500 }
        );
    }

    return NextResponse.json({
        success: true,
        otp,
        expiresAt,
        message: `Masukkan kode ini di bot Telegram: ${otp}`,
    });
}

// Verify OTP and pair Telegram account
export async function POST(request: NextRequest) {
    // Verify bot secret
    if (!verifyBotSecret(request)) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const { otp, telegramUserId, telegramChatId, telegramUsername } = body;

        if (!otp || !telegramUserId) {
            return NextResponse.json(
                { error: "otp and telegramUserId are required" },
                { status: 400 }
            );
        }

        // Find courier with matching OTP
        const { data: courier, error: findError } = await supabase
            .from("couriers")
            .select("*")
            .eq("pairingCode", otp)
            .single();

        if (findError || !courier) {
            return NextResponse.json(
                { error: "Kode OTP tidak ditemukan atau sudah expired" },
                { status: 404 }
            );
        }

        // Check if OTP is expired
        if (courier.pairingCodeExpiresAt) {
            const expiresAt = new Date(courier.pairingCodeExpiresAt);
            if (expiresAt < new Date()) {
                return NextResponse.json(
                    { error: "Kode OTP sudah expired. Silakan generate ulang." },
                    { status: 400 }
                );
            }
        }

        // Update courier with Telegram info
        const { error: updateError } = await supabase
            .from("couriers")
            .update({
                telegramUserId,
                telegramChatId: telegramChatId || telegramUserId,
                telegramUsername: telegramUsername || null,
                pairingCode: null,
                pairingCodeExpiresAt: null,
            })
            .eq("id", courier.id);

        if (updateError) {
            return NextResponse.json(
                { error: "Failed to pair account" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            courierId: courier.id,
            courierName: courier.nama,
            message: `Akun berhasil terhubung! Selamat datang, ${courier.nama}.`,
        });

    } catch (error) {
        console.error("[bot/pairing] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
