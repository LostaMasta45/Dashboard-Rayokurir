import { NextRequest, NextResponse } from "next/server"

const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY || ""

interface RouteRequest {
    from: { lat: number; lng: number }
    to: { lat: number; lng: number }
}

interface RouteResponse {
    distance_m: number
    duration_s: number
    source: "ors" | "haversine"
}

// Simple in-memory cache
const cache = new Map<string, { data: RouteResponse; timestamp: number }>()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days in ms

/**
 * Calculate Haversine distance as fallback
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000 // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

export async function POST(request: NextRequest) {
    try {
        const body: RouteRequest = await request.json()
        const { from, to } = body

        if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) {
            return NextResponse.json(
                { error: "Invalid coordinates" },
                { status: 400 }
            )
        }

        // Check cache
        const cacheKey = `${from.lat},${from.lng}-${to.lat},${to.lng}`
        const cached = cache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return NextResponse.json(cached.data)
        }

        // Try OpenRouteService API
        if (ORS_API_KEY) {
            try {
                const orsResponse = await fetch(
                    `https://api.openrouteservice.org/v2/directions/cycling-regular?start=${from.lng},${from.lat}&end=${to.lng},${to.lat}`,
                    {
                        headers: {
                            "Authorization": ORS_API_KEY,
                            "Accept": "application/json"
                        }
                    }
                )

                if (orsResponse.ok) {
                    const orsData = await orsResponse.json()
                    const segment = orsData.features?.[0]?.properties?.segments?.[0]

                    if (segment) {
                        const result: RouteResponse = {
                            distance_m: Math.round(segment.distance),
                            duration_s: Math.round(segment.duration),
                            source: "ors"
                        }

                        // Cache the result
                        cache.set(cacheKey, { data: result, timestamp: Date.now() })

                        return NextResponse.json(result)
                    }
                }
            } catch (orsError) {
                console.error("ORS API error:", orsError)
                // Fall through to Haversine
            }
        }

        // Fallback to Haversine
        const distance_m = haversineDistance(from.lat, from.lng, to.lat, to.lng)
        // Estimate duration: ~30km/h average speed in rural area
        const duration_s = (distance_m / 1000) / 30 * 3600

        const result: RouteResponse = {
            distance_m: Math.round(distance_m * 1.3), // Add 30% for road vs straight-line
            duration_s: Math.round(duration_s * 1.3),
            source: "haversine"
        }

        // Cache the result
        cache.set(cacheKey, { data: result, timestamp: Date.now() })

        return NextResponse.json(result)

    } catch (error) {
        console.error("Route distance error:", error)
        return NextResponse.json(
            { error: "Failed to calculate distance" },
            { status: 500 }
        )
    }
}
