import { NextRequest, NextResponse } from "next/server"

const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY || ""

// In-memory cache for reverse geocode results
const cache = new Map<string, { data: { label: string; lat: number; lng: number }; timestamp: number }>()
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000 // 30 days in ms (locations don't change often)

/**
 * Generate cache key from coordinates (rounded to ~10m precision)
 */
function getCacheKey(lat: number, lng: number): string {
    // Round to 4 decimal places (~11m precision) for cache efficiency
    return `${lat.toFixed(4)},${lng.toFixed(4)}`
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const lat = searchParams.get("lat")
        const lng = searchParams.get("lng")

        if (!lat || !lng) {
            return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 })
        }

        const latitude = parseFloat(lat)
        const longitude = parseFloat(lng)

        if (isNaN(latitude) || isNaN(longitude)) {
            return NextResponse.json({ error: "Invalid lat/lng" }, { status: 400 })
        }

        // Check cache first
        const cacheKey = getCacheKey(latitude, longitude)
        const cached = cache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log("Reverse geocode cache hit:", cacheKey)
            return NextResponse.json(cached.data)
        }

        if (!ORS_API_KEY) {
            // Fallback without reverse geocoding
            const fallbackResult = {
                label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                lat: latitude,
                lng: longitude
            }
            cache.set(cacheKey, { data: fallbackResult, timestamp: Date.now() })
            return NextResponse.json(fallbackResult)
        }

        // Call OpenRouteService Reverse Geocoding API
        const url = `https://api.openrouteservice.org/geocode/reverse?api_key=${ORS_API_KEY}&point.lat=${latitude}&point.lon=${longitude}&size=1`

        const response = await fetch(url, {
            headers: { "Accept": "application/json" }
        })

        if (!response.ok) {
            console.error("ORS Reverse Geocode error:", response.status)
            const fallbackResult = {
                label: `Lokasi (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
                lat: latitude,
                lng: longitude
            }
            // Don't cache errors for too long
            return NextResponse.json(fallbackResult)
        }

        const data = await response.json()
        const feature = data.features?.[0]

        let label = `Lokasi (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`

        if (feature?.properties) {
            const props = feature.properties
            // Build a readable label
            const parts = []
            if (props.name) parts.push(props.name)
            if (props.street) parts.push(props.street)
            if (props.neighbourhood) parts.push(props.neighbourhood)
            if (props.locality) parts.push(props.locality)

            if (parts.length > 0) {
                label = parts.slice(0, 2).join(", ")
            }
        }

        const result = {
            label,
            lat: latitude,
            lng: longitude
        }

        // Cache the successful result
        cache.set(cacheKey, { data: result, timestamp: Date.now() })
        console.log("Reverse geocode cached:", cacheKey, "->", label)

        return NextResponse.json(result)

    } catch (error) {
        console.error("Reverse geocode error:", error)
        return NextResponse.json({ error: "Failed to reverse geocode" }, { status: 500 })
    }
}

