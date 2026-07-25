import { NextRequest, NextResponse } from "next/server"

/**
 * API endpoint to resolve shortened Google Maps links (maps.app.goo.gl/...)
 * by following the redirect chain to get the full URL with coordinates.
 */
export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json()

        if (!url || typeof url !== "string") {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            )
        }

        const trimmed = url.trim()

        // Only process shortened Google Maps links
        if (
            !trimmed.match(/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)/i)
        ) {
            return NextResponse.json(
                { error: "Not a shortened Google Maps link" },
                { status: 400 }
            )
        }

        // A short Maps link can pass through several Google redirects before
        // reaching the final URL that contains the shared pin.
        const response = await fetch(trimmed, {
            method: "GET",
            redirect: "follow",
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; bot)",
            },
        })

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to resolve link" }, { status: 422 })
        }

        return NextResponse.json({ resolvedUrl: response.url })
    } catch (error) {
        console.error("Error resolving Maps link:", error)
        return NextResponse.json(
            { error: "Failed to resolve link" },
            { status: 500 }
        )
    }
}
