import type { RouteMode } from "@/lib/routing"

interface Coordinate {
    lat: number
    lng: number
}

interface OsrmApiRoute {
    distance?: number
    duration?: number
    geometry?: {
        coordinates?: Array<[number, number]>
    }
}

export interface OsrmRoute {
    distance_m: number
    duration_s: number
    coordinates?: Array<[number, number]>
}

const OSRM_TIMEOUT_MS = 4_000
const MAX_KAMPUNG_DISTANCE_FACTOR = 1.2

function selectRoute(routes: OsrmApiRoute[], mode: RouteMode): OsrmApiRoute | null {
    const validRoutes = routes.filter(
        (route) => Number.isFinite(route.distance) && Number.isFinite(route.duration)
    )
    if (validRoutes.length === 0) return null

    if (mode === "car") {
        return validRoutes.reduce((best, route) =>
            (route.duration as number) < (best.duration as number) ||
            ((route.duration as number) === (best.duration as number) &&
                (route.distance as number) < (best.distance as number))
                ? route
                : best
        )
    }

    const shortestDistance = Math.min(...validRoutes.map((route) => route.distance as number))
    const compactRoutes = validRoutes.filter(
        (route) => (route.distance as number) <= shortestDistance * MAX_KAMPUNG_DISTANCE_FACTOR
    )

    // Kampung may use a slightly longer local shortcut when it saves time, but
    // rejects large detours that make the line look circular.
    return compactRoutes.reduce((best, route) =>
        (route.duration as number) < (best.duration as number) ||
        ((route.duration as number) === (best.duration as number) &&
            (route.distance as number) < (best.distance as number))
            ? route
            : best
    )
}

export async function getOsrmRoute(
    from: Coordinate,
    to: Coordinate,
    mode: RouteMode,
    includeGeometry = false
): Promise<OsrmRoute | null> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS)

    try {
        const coordinates = `${from.lng},${from.lat};${to.lng},${to.lat}`
        const url = new URL(`https://router.project-osrm.org/route/v1/driving/${coordinates}`)
        url.searchParams.set("alternatives", "3")
        url.searchParams.set("continue_straight", "false")
        url.searchParams.set("overview", includeGeometry ? "full" : "false")
        url.searchParams.set("steps", "false")

        if (includeGeometry) {
            url.searchParams.set("geometries", "geojson")
        }
        const response = await fetch(url, {
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: controller.signal,
        })

        if (!response.ok) {
            console.warn("OSRM route request failed", { status: response.status, mode })
            return null
        }

        const data = await response.json()
        const route = data.code === "Ok" && Array.isArray(data.routes)
            ? selectRoute(data.routes, mode)
            : null
        const geometry = route?.geometry?.coordinates

        if (
            !route ||
            !Number.isFinite(route.distance) ||
            !Number.isFinite(route.duration) ||
            (includeGeometry && (!Array.isArray(geometry) || geometry.length < 2))
        ) {
            console.warn("OSRM route response was incomplete", { mode })
            return null
        }

        return {
            distance_m: Math.round(route.distance as number),
            duration_s: Math.round(route.duration as number),
            coordinates: includeGeometry
                ? geometry!.map(([lng, lat]) => [lat, lng] as [number, number])
                : undefined,
        }
    } catch {
        console.warn("OSRM route request raised an exception", { mode })
        return null
    } finally {
        clearTimeout(timeoutId)
    }
}
