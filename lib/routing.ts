export const ROUTE_MODES = ["kampung", "car"] as const

export type RouteMode = (typeof ROUTE_MODES)[number]

const ORS_PROFILES: Record<RouteMode, string> = {
    // ORS has no motorcycle profile. Cycling may use footways, cycleways, or
    // steps, so it is not appropriate for an ongkir route that must follow
    // roads a vehicle can use.
    kampung: "driving-car",
    car: "driving-car",
}

export function getOrsPreference(mode: RouteMode): "shortest" | "recommended" {
    // Both modes stay on ORS's driving graph. Kampung prioritizes the shortest
    // driveable route; car keeps the provider's recommended driving route.
    return mode === "kampung" ? "shortest" : "recommended"
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
