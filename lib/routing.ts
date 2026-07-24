export const ROUTE_MODES = ["kampung", "car"] as const

export type RouteMode = (typeof ROUTE_MODES)[number]

const ORS_PROFILES: Record<RouteMode, string> = {
    kampung: "cycling-regular",
    car: "driving-car",
}

export function parseRouteMode(value: unknown): RouteMode {
    return value === "kampung" ? "kampung" : "car"
}

export function getOrsProfile(mode: RouteMode): string {
    return ORS_PROFILES[mode]
}

export function getRouteModeLabel(mode: RouteMode): string {
    return mode === "kampung" ? "Jalur kampung" : "Rute mobil"
}
