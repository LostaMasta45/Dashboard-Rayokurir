import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get("fileId"); // Correct param name to match usage

    if (!fileId) {
        return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    try {
        const botToken = process.env.TELEGRAM_KURIR_BOT_TOKEN;
        if (!botToken) {
            return NextResponse.json({ error: "Bot token not configured" }, { status: 500 });
        }

        // 1. Get file path from Telegram API
        const fileResponse = await fetch(
            `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
        );
        const fileData = await fileResponse.json();

        if (!fileData.ok || !fileData.result.file_path) {
            return NextResponse.json({ error: "Failed to get file path" }, { status: 404 });
        }

        const filePath = fileData.result.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

        // 2. Fetch the image
        const imageResponse = await fetch(fileUrl);
        if (!imageResponse.ok) {
            return NextResponse.json({ error: "Failed to fetch image" }, { status: imageResponse.status });
        }

        // 3. Return image with correct content type
        const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
        const buffer = await imageResponse.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch (error) {
        console.error("Error proxying telegram image:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
