import { NextRequest, NextResponse } from "next/server"
import { getOrsProfile, parseRouteMode, type RouteMode } from "@/lib/routing"

const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY || ""

interface Coordinate {
    lat: number
    lng: number
}

interface RouteRequest {
    from: Coordinate
    to: Coordinate
    routeMode?: RouteMode
}

interface RouteResponse {
    distance_m: number
    duration_s: number
    source: "ors" | "haversine"
    route_mode: RouteMode
    requested_mode: RouteMode
    fallback: boolean
}

const cache = new Map<string, { data: RouteResponse; timestamp: number }>()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000
const CACHE_VERSION = "v4"

function isCoordinate(value: unknown): value is Coordinate {
    if (!value || typeof value !== "object") return false
    const coordinate = value as Coordinate
    return Number.isFinite(coordinate.lat) && Number.isFinite(coordinate.lng)
}

function haversineDistance(from: Coordinate, to: Coordinate): number {
    const R = 6371000
    const dLat = (to.lat - from.lat) * Math.PI / 180
    const dLng = (to.lng - from.lng) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function getOrsRoute(from: Coordinate, to: Coordinate, mode: RouteMode) {
    if (!ORS_API_KEY) return null

    try {
        const profile = getOrsProfile(mode)
        const response = await fetch(
            `https://api.openrouteservice.org/v2/directions/${profile}?start=${from.lng},${from.lat}&end=${to.lng},${to.lat}`,
            {
                headers: {
                    Authorization: ORS_API_KEY,
                    Accept: "application/json, application/geo+json",
                },
            }
        )

        if (!response.ok) {
            console.warn("ORS distance request failed", { profile, status: response.status })
            return null
        }

        const data = await response.json()
        const segment = data.features?.[0]?.properties?.segments?.[0]
        if (!segment || !Number.isFinite(segment.distance) || !Number.isFinite(segment.duration)) {
            console.warn("ORS distance response was incomplete", { profile })
            return null
        }

        return {
            distance_m: Math.round(segment.distance),
            duration_s: Math.round(segment.duration),
        }
    } catch {
        console.warn("ORS distance request raised an exception", { profile: getOrsProfile(mode) })
        return null
    }
}

export async function POST(request: NextRequest) {
    let stage = "request-body"
    try {
        const body: RouteRequest = await request.json()
        const { from, to } = body

        stage = "coordinate-validation"
        if (!isCoordinate(from) || !isCoordinate(to)) {
            return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 })
        }

        stage = "cache-key"
        const requestedMode = parseRouteMode(body.routeMode)
        const cacheKey = `${CACHE_VERSION}|${requestedMode}|${from.lat.toFixed(6)},${from.lng.toFixed(6)}|${to.lat.toFixed(6)},${to.lng.toFixed(6)}`
        const cached = cache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return NextResponse.json(cached.data)
        }

        stage = "ors-route"
        const requestedRoute = await getOrsRoute(from, to, requestedMode)
        let result: RouteResponse

        if (requestedRoute) {
            result = {
                ...requestedRoute,
                source: "ors",
                route_mode: requestedMode,
                requested_mode: requestedMode,
                fallback: false,
            }
        } else if (requestedMode === "kampung") {
            const carRoute = await getOrsRoute(from, to, "car")
            if (carRoute) {
                result = {
                    ...carRoute,
                    source: "ors",
                    route_mode: "car",
                    requested_mode: "kampung",
                    fallback: true,
                }
            } else {
                const straightDistance = haversineDistance(from, to)
                result = {
                    distance_m: Math.round(straightDistance * 1.3),
                    duration_s: Math.round((straightDistance / 1000 / 30) * 3600 * 1.3),
                    source: "haversine",
                    route_mode: "kampung",
                    requested_mode: "kampung",
                    fallback: true,
                }
            }
        } else {
            const straightDistance = haversineDistance(from, to)
            result = {
                distance_m: Math.round(straightDistance * 1.3),
                duration_s: Math.round((straightDistance / 1000 / 30) * 3600 * 1.3),
                source: "haversine",
                route_mode: "car",
                requested_mode: "car",
                fallback: true,
            }
        }

        stage = "response-cache"
        cache.set(cacheKey, { data: result, timestamp: Date.now() })
        return NextResponse.json(result)
    } catch {
        console.error("Route distance processing failed", { stage })
        return NextResponse.json({ error: "Failed to calculate route distance", stage }, { status: 500 })
    }
}
