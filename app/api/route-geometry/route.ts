import { NextRequest, NextResponse } from "next/server"
import { getOrsPreference, getOrsProfile, parseRouteMode, type RouteMode } from "@/lib/routing"

const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY || ""

interface Coordinate {
    lat: number
    lng: number
}

interface RouteGeometryRequest {
    waypoints: Coordinate[]
    routeMode?: RouteMode
}

interface RouteGeometryResponse {
    coordinates: Array<[number, number]>
    distance_m: number
    duration_s: number
    source: "ors" | "straight"
    route_mode: RouteMode
    requested_mode: RouteMode
    fallback: boolean
}

const cache = new Map<string, { data: RouteGeometryResponse; timestamp: number }>()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000
const CACHE_VERSION = "v6"
const ORS_TIMEOUT_MS = 7_000

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

async function getOrsGeometry(waypoints: Coordinate[], mode: RouteMode) {
    if (!ORS_API_KEY) return null

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), ORS_TIMEOUT_MS)

    try {
        const profile = getOrsProfile(mode)
        const response = await fetch(
            `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
            {
                method: "POST",
                headers: {
                    Authorization: ORS_API_KEY,
                    "Content-Type": "application/json",
                    Accept: "application/geo+json",
                },
                body: JSON.stringify({
                    coordinates: waypoints.map(({ lat, lng }) => [lng, lat]),
                    preference: getOrsPreference(mode),
                }),
                cache: "no-store",
                signal: controller.signal,
            }
        )

        if (!response.ok) {
            console.warn("ORS geometry request failed", { profile, status: response.status })
            return null
        }

        const data = await response.json()
        const feature = data.features?.[0]
        const geometry = feature?.geometry?.coordinates
        const summary = feature?.properties?.summary
        if (!Array.isArray(geometry) || geometry.length < 2 || !Number.isFinite(summary?.distance) || !Number.isFinite(summary?.duration)) {
            console.warn("ORS geometry response was incomplete", { profile })
            return null
        }

        return {
            coordinates: geometry.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]),
            distance_m: Math.round(summary.distance),
            duration_s: Math.round(summary.duration),
        }
    } catch {
        console.warn("ORS geometry request raised an exception", { profile: getOrsProfile(mode) })
        return null
    } finally {
        clearTimeout(timeoutId)
    }
}

function getStraightRoute(waypoints: Coordinate[], requestedMode: RouteMode): RouteGeometryResponse {
    let distance = 0
    for (let index = 0; index < waypoints.length - 1; index += 1) {
        distance += haversineDistance(waypoints[index], waypoints[index + 1])
    }

    return {
        // Never return waypoint-to-waypoint straight lines as route geometry.
        // They cut across buildings/fields and can be mistaken for a road.
        coordinates: [],
        distance_m: Math.round(distance * 1.3),
        duration_s: Math.round((distance / 1000 / 30) * 3600 * 1.3),
        source: "straight",
        route_mode: requestedMode,
        requested_mode: requestedMode,
        fallback: true,
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: RouteGeometryRequest = await request.json()
        if (!Array.isArray(body.waypoints) || body.waypoints.length < 2 || !body.waypoints.every(isCoordinate)) {
            return NextResponse.json({ error: "At least two valid waypoints are required" }, { status: 400 })
        }

        const requestedMode = parseRouteMode(body.routeMode)
        const cacheKey = `${CACHE_VERSION}|${requestedMode}|${body.waypoints.map(({ lat, lng }) => `${lat.toFixed(6)},${lng.toFixed(6)}`).join("|")}`
        const cached = cache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return NextResponse.json(cached.data)
        }

        const requestedRoute = await getOrsGeometry(body.waypoints, requestedMode)
        let result: RouteGeometryResponse

        if (requestedRoute) {
            result = {
                ...requestedRoute,
                source: "ors",
                route_mode: requestedMode,
                requested_mode: requestedMode,
                fallback: false,
            }
        } else if (requestedMode === "kampung") {
            const carRoute = await getOrsGeometry(body.waypoints, "car")
            result = carRoute
                ? {
                    ...carRoute,
                    source: "ors",
                    route_mode: "car",
                    requested_mode: "kampung",
                    fallback: true,
                }
                : getStraightRoute(body.waypoints, "kampung")
        } else {
            result = getStraightRoute(body.waypoints, "car")
        }

        cache.set(cacheKey, { data: result, timestamp: Date.now() })
        return NextResponse.json(result)
    } catch {
        return NextResponse.json({ error: "Failed to calculate route geometry" }, { status: 500 })
    }
}
