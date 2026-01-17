import { NextRequest, NextResponse } from "next/server"

const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY || ""

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

        if (!ORS_API_KEY) {
            // Fallback without reverse geocoding
            return NextResponse.json({
                label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                lat: latitude,
                lng: longitude
            })
        }

        // Call OpenRouteService Reverse Geocoding API
        const url = `https://api.openrouteservice.org/geocode/reverse?api_key=${ORS_API_KEY}&point.lat=${latitude}&point.lon=${longitude}&size=1`

        const response = await fetch(url, {
            headers: { "Accept": "application/json" }
        })

        if (!response.ok) {
            console.error("ORS Reverse Geocode error:", response.status)
            return NextResponse.json({
                label: `Lokasi (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
                lat: latitude,
                lng: longitude
            })
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

        return NextResponse.json({
            label,
            lat: latitude,
            lng: longitude
        })

    } catch (error) {
        console.error("Reverse geocode error:", error)
        return NextResponse.json({ error: "Failed to reverse geocode" }, { status: 500 })
    }
}
