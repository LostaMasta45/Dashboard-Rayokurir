import { NextRequest, NextResponse } from "next/server"
import { getOrsPreference, getOrsProfile, parseRouteMode, type RouteMode } from "@/lib/routing"

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
    source: "ors" | "osrm" | "haversine"
    route_mode: RouteMode
    requested_mode: RouteMode
    fallback: boolean
}

const cache = new Map<string, { data: RouteResponse; timestamp: number }>()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000
const CACHE_VERSION = "v7"
const ORS_TIMEOUT_MS = 5_000
const OSRM_TIMEOUT_MS = 4_000

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

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), ORS_TIMEOUT_MS)

    try {
        const profile = getOrsProfile(mode)
        const headers = {
            Authorization: ORS_API_KEY,
            Accept: "application/json, application/geo+json",
        }
        let response: Response

        if (mode === "kampung") {
            response = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}/geojson`, {
                method: "POST",
                headers: {
                    ...headers,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
                    preference: getOrsPreference(mode),
                }),
                cache: "no-store",
                signal: controller.signal,
            })
        } else {
            const url = new URL(`https://api.openrouteservice.org/v2/directions/${profile}`)
            url.searchParams.set("start", `${from.lng},${from.lat}`)
            url.searchParams.set("end", `${to.lng},${to.lat}`)
            response = await fetch(url, {
                headers,
                cache: "no-store",
                signal: controller.signal,
            })
        }

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
    } finally {
        clearTimeout(timeoutId)
    }
}

async function getOsrmRoute(from: Coordinate, to: Coordinate) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS)

    try {
        const coordinates = `${from.lng},${from.lat};${to.lng},${to.lat}`
        const url = new URL(`https://router.project-osrm.org/route/v1/driving/${coordinates}`)
        url.searchParams.set("overview", "false")
        url.searchParams.set("steps", "false")

        const response = await fetch(url, {
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: controller.signal,
        })

        if (!response.ok) {
            console.warn("OSRM distance request failed", { status: response.status })
            return null
        }

        const data = await response.json()
        const route = data.code === "Ok" ? data.routes?.[0] : null
        if (!route || !Number.isFinite(route.distance) || !Number.isFinite(route.duration)) {
            console.warn("OSRM distance response was incomplete")
            return null
        }

        return {
            distance_m: Math.round(route.distance),
            duration_s: Math.round(route.duration),
        }
    } catch {
        console.warn("OSRM distance request raised an exception")
        return null
    } finally {
        clearTimeout(timeoutId)
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: RouteRequest = await request.json()
        const { from, to } = body

        if (!isCoordinate(from) || !isCoordinate(to)) {
            return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 })
        }

        const requestedMode = parseRouteMode(body.routeMode)
        const cacheKey = `${CACHE_VERSION}|${requestedMode}|${from.lat.toFixed(6)},${from.lng.toFixed(6)}|${to.lat.toFixed(6)},${to.lng.toFixed(6)}`
        const cached = cache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return NextResponse.json(cached.data)
        }

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
        } else {
            const osrmRoute = await getOsrmRoute(from, to)
            if (osrmRoute) {
                result = {
                    ...osrmRoute,
                    source: "osrm",
                    route_mode: "car",
                    requested_mode: requestedMode,
                    fallback: true,
                }
            } else {
                const straightDistance = haversineDistance(from, to)
                result = {
                    distance_m: Math.round(straightDistance * 1.3),
                    duration_s: Math.round((straightDistance / 1000 / 30) * 3600 * 1.3),
                    source: "haversine",
                    route_mode: requestedMode,
                    requested_mode: requestedMode,
                    fallback: true,
                }
            }
        }

        cache.set(cacheKey, { data: result, timestamp: Date.now() })
        return NextResponse.json(result)
    } catch {
        return NextResponse.json({ error: "Failed to calculate route distance" }, { status: 500 })
    }
}
