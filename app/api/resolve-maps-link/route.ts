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

        // Follow redirects manually to get the final URL
        // Using redirect: "manual" to capture the Location header
        const response = await fetch(trimmed, {
            method: "GET",
            redirect: "manual",
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; bot)",
            },
        })

        // Check for redirect (301, 302, 307, 308)
        if ([301, 302, 307, 308].includes(response.status)) {
            const location = response.headers.get("location")
            if (location) {
                // Sometimes there's a second redirect, follow it too
                const response2 = await fetch(location, {
                    method: "GET",
                    redirect: "manual",
                    headers: {
                        "User-Agent": "Mozilla/5.0 (compatible; bot)",
                    },
                })

                if ([301, 302, 307, 308].includes(response2.status)) {
                    const location2 = response2.headers.get("location")
                    if (location2) {
                        return NextResponse.json({ resolvedUrl: location2 })
                    }
                }

                return NextResponse.json({ resolvedUrl: location })
            }
        }

        // If no redirect, try following with redirect: "follow" to get the final URL
        const followResponse = await fetch(trimmed, {
            method: "GET",
            redirect: "follow",
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; bot)",
            },
        })

        return NextResponse.json({ resolvedUrl: followResponse.url })
    } catch (error) {
        console.error("Error resolving Maps link:", error)
        return NextResponse.json(
            { error: "Failed to resolve link" },
            { status: 500 }
        )
    }
}
