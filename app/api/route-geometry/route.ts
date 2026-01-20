import { NextRequest, NextResponse } from "next/server"

const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY || ""

interface RouteGeometryRequest {
    waypoints: Array<{ lat: number; lng: number }>
}

interface RouteGeometryResponse {
    coordinates: Array<[number, number]> // [lat, lng] pairs
    distance_m: number
    duration_s: number
    source: "ors" | "straight"
}

// Simple in-memory cache
const cache = new Map<string, { data: RouteGeometryResponse; timestamp: number }>()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days in ms

export async function POST(request: NextRequest) {
    try {
        const body: RouteGeometryRequest = await request.json()
        const { waypoints } = body

        if (!waypoints || waypoints.length < 2) {
            return NextResponse.json(
                { error: "At least 2 waypoints required" },
                { status: 400 }
            )
        }

        // Create cache key with version to invalidate old straight-line results
        const CACHE_VERSION = "v2" // Increment this to clear old cache
        const cacheKey = `${CACHE_VERSION}|${waypoints.map(w => `${w.lat.toFixed(6)},${w.lng.toFixed(6)}`).join("|")}`
        const cached = cache.get(cacheKey)
        // Only use cache if it's an ORS result, not a fallback
        if (cached && Date.now() - cached.timestamp < CACHE_TTL && cached.data.source === "ors") {
            console.log("Returning cached ORS route")
            return NextResponse.json(cached.data)
        }

        // Try OpenRouteService API
        if (ORS_API_KEY) {
            try {
                // For 2 waypoints, use GET with start/end parameters
                // For more waypoints, we need to use POST
                let orsResponse: Response

                if (waypoints.length === 2) {
                    // Simple route with start and end
                    const start = `${waypoints[0].lng},${waypoints[0].lat}`
                    const end = `${waypoints[1].lng},${waypoints[1].lat}`
                    const url = `https://api.openrouteservice.org/v2/directions/cycling-regular?start=${start}&end=${end}`

                    console.log("Calling ORS GET API:", url)

                    orsResponse = await fetch(url, {
                        method: "GET",
                        headers: {
                            "Authorization": ORS_API_KEY,
                            "Accept": "application/json, application/geo+json"
                        }
                    })
                } else {
                    // Multiple waypoints - use POST with geojson format
                    const orsCoordinates = waypoints.map(w => [w.lng, w.lat])
                    console.log("Calling ORS POST API with coordinates:", JSON.stringify(orsCoordinates))

                    orsResponse = await fetch(
                        `https://api.openrouteservice.org/v2/directions/cycling-regular/geojson`,
                        {
                            method: "POST",
                            headers: {
                                "Authorization": ORS_API_KEY,
                                "Content-Type": "application/json",
                                "Accept": "application/json, application/geo+json"
                            },
                            body: JSON.stringify({
                                coordinates: orsCoordinates
                            })
                        }
                    )
                }

                const responseText = await orsResponse.text()
                console.log("ORS Response status:", orsResponse.status)

                if (orsResponse.ok) {
                    const orsData = JSON.parse(responseText)

                    // Handle both GET and POST response formats
                    let geometryCoords: Array<[number, number]> | undefined
                    let distance: number = 0
                    let duration: number = 0

                    if (orsData.features && orsData.features[0]) {
                        // GeoJSON format (from both GET and POST)
                        geometryCoords = orsData.features[0].geometry?.coordinates
                        const summary = orsData.features[0].properties?.summary
                        distance = summary?.distance || 0
                        duration = summary?.duration || 0
                    }

                    if (geometryCoords && geometryCoords.length > 0) {
                        // Convert from [lng, lat] to [lat, lng] for Leaflet
                        const coordinates: Array<[number, number]> = geometryCoords.map(
                            (coord: [number, number]) => [coord[1], coord[0]]
                        )

                        console.log("ORS returned", coordinates.length, "coordinate points for route")

                        const result: RouteGeometryResponse = {
                            coordinates,
                            distance_m: Math.round(distance),
                            duration_s: Math.round(duration),
                            source: "ors"
                        }

                        // Cache the result with a fresh timestamp
                        cache.set(cacheKey, { data: result, timestamp: Date.now() })

                        return NextResponse.json(result)
                    } else {
                        console.log("ORS response has no geometry coordinates, data:", JSON.stringify(orsData).substring(0, 300))
                    }
                } else {
                    console.error("ORS API error response:", orsResponse.status, responseText.substring(0, 300))
                }
            } catch (orsError) {
                console.error("ORS API exception:", orsError)
            }
        } else {
            console.log("No ORS API key configured")
        }

        // Fallback to straight lines
        const coordinates: Array<[number, number]> = waypoints.map(w => [w.lat, w.lng])

        // Calculate approximate distance using Haversine
        let totalDistance = 0
        for (let i = 0; i < waypoints.length - 1; i++) {
            totalDistance += haversineDistance(
                waypoints[i].lat, waypoints[i].lng,
                waypoints[i + 1].lat, waypoints[i + 1].lng
            )
        }

        const result: RouteGeometryResponse = {
            coordinates,
            distance_m: Math.round(totalDistance * 1.3), // Add 30% for road vs straight-line
            duration_s: Math.round((totalDistance / 30) * 3600 * 1.3), // 30km/h average
            source: "straight"
        }

        cache.set(cacheKey, { data: result, timestamp: Date.now() })

        return NextResponse.json(result)

    } catch (error) {
        console.error("Route geometry error:", error)
        return NextResponse.json(
            { error: "Failed to calculate route geometry" },
            { status: 500 }
        )
    }
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}
