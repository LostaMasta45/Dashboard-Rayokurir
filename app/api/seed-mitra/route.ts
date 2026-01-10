import { NextResponse } from "next/server";
import { seedMitraData } from "@/lib/auth";

export async function POST() {
    try {
        await seedMitraData();
        return NextResponse.json({ success: true, message: "Seed data berhasil" });
    } catch (error) {
        console.error("Error seeding data:", error);
        return NextResponse.json({ success: false, error: "Gagal seed data" }, { status: 500 });
    }
}

export async function GET() {
    try {
        await seedMitraData();
        return NextResponse.json({ success: true, message: "Seed mitra data berhasil! Silakan cek dashboard." });
    } catch (error) {
        console.error("Error seeding data:", error);
        return NextResponse.json({ success: false, error: "Gagal seed data" }, { status: 500 });
    }
}
