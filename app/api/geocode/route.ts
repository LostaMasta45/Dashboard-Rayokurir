import { NextRequest, NextResponse } from "next/server"

const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY || ""

interface GeocodeResult {
    id: string
    label: string
    lat: number
    lng: number
    type: string
}

interface GeocodeResponse {
    results: GeocodeResult[]
}

// Simple in-memory cache for geocoding
const cache = new Map<string, { data: GeocodeResponse; timestamp: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get("q")

        if (!query || query.length < 2) {
            return NextResponse.json({ results: [] })
        }

        // Check cache
        const cacheKey = query.toLowerCase().trim()
        const cached = cache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return NextResponse.json(cached.data)
        }

        // Focus search around Sumobito area
        const focusPoint = { lat: -7.520653, lng: 112.343111 }
        const boundaryRect = {
            minLat: -7.6,
            maxLat: -7.4,
            minLng: 112.2,
            maxLng: 112.5
        }

        if (!ORS_API_KEY) {
            console.log("No ORS API key, returning empty results")
            return NextResponse.json({ results: [] })
        }

        // Call OpenRouteService Geocoding API
        const url = new URL("https://api.openrouteservice.org/geocode/search")
        url.searchParams.set("api_key", ORS_API_KEY)
        url.searchParams.set("text", query)
        url.searchParams.set("focus.point.lat", focusPoint.lat.toString())
        url.searchParams.set("focus.point.lon", focusPoint.lng.toString())
        url.searchParams.set("boundary.rect.min_lat", boundaryRect.minLat.toString())
        url.searchParams.set("boundary.rect.max_lat", boundaryRect.maxLat.toString())
        url.searchParams.set("boundary.rect.min_lon", boundaryRect.minLng.toString())
        url.searchParams.set("boundary.rect.max_lon", boundaryRect.maxLng.toString())
        url.searchParams.set("size", "5")
        url.searchParams.set("layers", "address,venue,street,locality,neighbourhood")

        const response = await fetch(url.toString(), {
            headers: {
                "Accept": "application/json"
            }
        })

        if (!response.ok) {
            console.error("ORS Geocode error:", response.status, await response.text())
            return NextResponse.json({ results: [] })
        }

        const data = await response.json()

        // Transform to our format
        const results: GeocodeResult[] = (data.features || []).map((feature: any, index: number) => ({
            id: `geo-${index}-${Date.now()}`,
            label: feature.properties?.label || feature.properties?.name || "Unknown",
            lat: feature.geometry?.coordinates?.[1] || 0,
            lng: feature.geometry?.coordinates?.[0] || 0,
            type: feature.properties?.layer || "place"
        }))

        const geocodeResponse: GeocodeResponse = { results }

        // Cache the result
        cache.set(cacheKey, { data: geocodeResponse, timestamp: Date.now() })

        return NextResponse.json(geocodeResponse)

    } catch (error) {
        console.error("Geocode error:", error)
        return NextResponse.json({ results: [] })
    }
}
