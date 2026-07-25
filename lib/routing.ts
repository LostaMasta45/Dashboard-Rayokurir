export const ROUTE_MODES = ["kampung", "car"] as const

export type RouteMode = (typeof ROUTE_MODES)[number]

const ORS_PROFILES: Record<RouteMode, string> = {
    // ORS has no motorcycle profile. Cycling may use footways, cycleways, or
    // steps, so it is not appropriate for an ongkir route that must follow
    // roads a vehicle can use.
    kampung: "driving-car",
    car: "driving-car",
}

export function getOrsRouteOptions(mode: RouteMode) {
    // Keep the kampung option on the drivable road network while avoiding
    // motorway-style highways where a local-road alternative exists.
    return mode === "kampung" ? { avoid_features: ["highways"] } : undefined
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
