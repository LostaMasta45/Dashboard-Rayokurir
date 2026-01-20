import { NextRequest, NextResponse } from "next/server"

const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY || ""

interface QuotaResponse {
    hasApiKey: boolean
    rateLimit?: {
        limit: number
        remaining: number
        reset: number
    }
    daily?: {
        used: number
        limit: number
    }
    error?: string
}

/**
 * Check OpenRouteService API quota by making a lightweight health check request
 */
export async function GET(request: NextRequest) {
    const result: QuotaResponse = {
        hasApiKey: !!ORS_API_KEY
    }

    if (!ORS_API_KEY) {
        result.error = "No OpenRouteService API key configured"
        return NextResponse.json(result, { status: 200 })
    }

    try {
        // Make a lightweight request to check rate limits
        // Using health endpoint or a simple directions request
        const response = await fetch(
            `https://api.openrouteservice.org/v2/directions/cycling-regular?start=112.343111,-7.520653&end=112.344,-7.521`,
            {
                headers: {
                    "Authorization": ORS_API_KEY,
                    "Accept": "application/json"
                }
            }
        )

        // Extract rate limit headers
        const rateLimitLimit = response.headers.get("x-ratelimit-limit")
        const rateLimitRemaining = response.headers.get("x-ratelimit-remaining")
        const rateLimitReset = response.headers.get("x-ratelimit-reset")

        if (rateLimitLimit && rateLimitRemaining) {
            result.rateLimit = {
                limit: parseInt(rateLimitLimit, 10),
                remaining: parseInt(rateLimitRemaining, 10),
                reset: rateLimitReset ? parseInt(rateLimitReset, 10) : 0
            }
        }

        // Check for daily quota info (if available in response body on error)
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            if (errorData.error?.message) {
                result.error = errorData.error.message
            }
        }

        return NextResponse.json(result)

    } catch (error) {
        console.error("Quota check error:", error)
        result.error = "Failed to check API quota"
        return NextResponse.json(result, { status: 500 })
    }
}
