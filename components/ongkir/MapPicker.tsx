"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from "react-leaflet"
import L from "leaflet"
import { MapPin, Navigation, GripVertical, Loader2, MousePointerClick, Crosshair } from "lucide-react"
import { cn } from "@/lib/utils"

// Custom icons with better visibility and premium look
const createIcon = (colorClass: string, ringClass: string, label: string) => L.divIcon({
    className: "custom-marker-group",
    html: `
        <div class="relative group">
            <div class="absolute -inset-2 ${colorClass} opacity-20 rounded-full blur-sm group-hover:opacity-40 transition-opacity"></div>
            <div class="relative z-10 w-12 h-12 ${colorClass} rounded-full border-[3px] border-white shadow-2xl flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-transform hover:scale-110 ${ringClass}">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="10" r="3"/>
                    <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/>
                </svg>
            </div>
            <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/90 backdrop-blur-md text-gray-800 text-xs px-3 py-1.5 rounded-full font-bold shadow-md border border-white/50 z-20">
                ${label}
            </div>
            <div class="absolute top-[80%] left-1/2 -translate-x-1/2 w-1 h-3 bg-black/10 rounded-full blur-[1px]"></div>
        </div>
    `,
    iconSize: [48, 60],
    iconAnchor: [24, 24],
})

const pickupIcon = createIcon("bg-teal-500", "ring-4 ring-teal-500/20", "Jemput")
const dropoffIcon = createIcon("bg-orange-500", "ring-4 ring-orange-500/20", "Antar")

const basecampIcon = L.divIcon({
    className: "custom-marker-basecamp",
    html: `
        <div class="relative">
             <div class="w-10 h-10 bg-gray-800 rounded-full border-[3px] border-white shadow-xl flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                     <path d="M3 21h18v-8H3v8zm6-11V7l3-3 3 3v3h-6z"/>
                     <path d="M0 0h24v24H0z" fill="none"/>
                </svg>
            </div>
           <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-800 text-white text-[10px] px-2 py-1 rounded-md font-bold shadow-lg">
                BASECAMP
            </div>
        </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 20],
})

export interface MapLocation {
    lat: number
    lng: number
    label?: string
}

interface MapPickerProps {
    pickup: MapLocation | null
    dropoff: MapLocation | null
    basecamp: MapLocation
    onPickupChange?: (loc: MapLocation) => void
    onDropoffChange?: (loc: MapLocation) => void
    className?: string
    showRoute?: boolean
}

// Draggable Marker Component
function DraggableMarker({
    position,
    icon,
    onDragEnd,
    eventHandlers
}: {
    position: [number, number]
    icon: L.DivIcon
    onDragEnd: (lat: number, lng: number) => void
    eventHandlers?: any
}) {
    const markerRef = useRef<L.Marker>(null)

    return (
        <Marker
            ref={markerRef}
            position={position}
            icon={icon}
            draggable={true}
            eventHandlers={{
                dragend: () => {
                    const marker = markerRef.current
                    if (marker) {
                        const pos = marker.getLatLng()
                        onDragEnd(pos.lat, pos.lng)
                    }
                },
                ...eventHandlers
            }}
        />
    )
}

// Component to fit map bounds when markers change
function MapBoundsUpdater({ pickup, dropoff, basecamp, routeCoords }: {
    pickup: MapLocation | null
    dropoff: MapLocation | null
    basecamp: MapLocation
    routeCoords: [number, number][]
}) {
    const map = useMap()

    useEffect(() => {
        // Use route coordinates if available, else use marker positions
        if (routeCoords.length > 0) {
            const bounds = L.latLngBounds(routeCoords)
            map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 })
        } else {
            const points: [number, number][] = [[basecamp.lat, basecamp.lng]]
            if (pickup) points.push([pickup.lat, pickup.lng])
            if (dropoff) points.push([dropoff.lat, dropoff.lng])

            if (points.length > 1) {
                const bounds = L.latLngBounds(points)
                map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 })
            }
        }
    }, [pickup, dropoff, basecamp, routeCoords, map])

    return null
}

// Map click handler
function MapClickHandler({
    onMapClick
}: {
    onMapClick: (lat: number, lng: number) => void
}) {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng.lat, e.latlng.lng)
        },
    })
    return null
}

export function MapPicker({
    pickup,
    dropoff,
    basecamp,
    onPickupChange,
    onDropoffChange,
    className = "",
    showRoute = true,
}: MapPickerProps) {
    const [activeMode, setActiveMode] = useState<"pickup" | "dropoff" | null>(null)
    const [routeCoords, setRouteCoords] = useState<[number, number][]>([])
    const [isLoadingRoute, setIsLoadingRoute] = useState(false)
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === "dark"

    // Calculate center point
    const center: [number, number] = pickup
        ? [pickup.lat, pickup.lng]
        : dropoff
            ? [dropoff.lat, dropoff.lng]
            : [basecamp.lat, basecamp.lng]

    // Fetch route geometry when pickup and dropoff change
    useEffect(() => {
        async function fetchRouteGeometry() {
            if (!pickup || !dropoff) {
                setRouteCoords([])
                return
            }

            setIsLoadingRoute(true)
            try {
                const response = await fetch("/api/route-geometry", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        waypoints: [
                            { lat: basecamp.lat, lng: basecamp.lng },
                            { lat: pickup.lat, lng: pickup.lng },
                            { lat: dropoff.lat, lng: dropoff.lng }
                        ]
                    })
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.coordinates && data.coordinates.length > 0) {
                        setRouteCoords(data.coordinates)
                    } else {
                        // Fallback to straight lines
                        setRouteCoords([
                            [basecamp.lat, basecamp.lng],
                            [pickup.lat, pickup.lng],
                            [dropoff.lat, dropoff.lng]
                        ])
                    }
                } else {
                    // Fallback to straight lines
                    setRouteCoords([
                        [basecamp.lat, basecamp.lng],
                        [pickup.lat, pickup.lng],
                        [dropoff.lat, dropoff.lng]
                    ])
                }
            } catch (error) {
                console.error("Error fetching route geometry:", error)
                // Fallback to straight lines
                setRouteCoords([
                    [basecamp.lat, basecamp.lng],
                    [pickup.lat, pickup.lng],
                    [dropoff.lat, dropoff.lng]
                ])
            } finally {
                setIsLoadingRoute(false)
            }
        }

        fetchRouteGeometry()
    }, [pickup, dropoff, basecamp])

    // Handle marker drag
    const handlePickupDrag = (lat: number, lng: number) => {
        if (onPickupChange) {
            onPickupChange({ lat, lng, label: "Custom" })
        }
    }

    const handleDropoffDrag = (lat: number, lng: number) => {
        if (onDropoffChange) {
            onDropoffChange({ lat, lng, label: "Custom" })
        }
    }

    // Handle map click
    const handleMapClick = (lat: number, lng: number) => {
        if (activeMode === "pickup" && onPickupChange) {
            onPickupChange({ lat, lng, label: "Lokasi Jemput" })
            setActiveMode(null)
        } else if (activeMode === "dropoff" && onDropoffChange) {
            onDropoffChange({ lat, lng, label: "Lokasi Antar" })
            setActiveMode(null)
        }
    }

    // Determine current step for guidance
    const getGuidanceText = () => {
        if (activeMode === "pickup") return { text: "Klik di peta untuk lokasi JEMPUT", color: "teal", icon: <MapPin size={16} /> }
        if (activeMode === "dropoff") return { text: "Klik di peta untuk lokasi ANTAR", color: "orange", icon: <Navigation size={16} /> }

        if (!pickup) return { text: "Set lokasi jemput", color: "gray", icon: <MapPin size={16} /> }
        if (!dropoff) return { text: "Set lokasi antar", color: "gray", icon: <Navigation size={16} /> }
        return { text: "Geser marker untuk akurasi", color: "gray", icon: <GripVertical size={16} /> }
    }

    const guidance = getGuidanceText()

    return (
        <div className={cn("relative h-full w-full bg-slate-50 dark:bg-gray-900 transition-colors", className)}>

            {/* Top Floating Bar for Guidance & Mode */}
            <div className="absolute top-4 inset-x-4 z-[500] pointer-events-none flex justify-center">
                <div className={cn(
                    "pointer-events-auto bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/50 flex items-center gap-3 transition-all",
                    activeMode ? "scale-105 ring-4 ring-white/50" : ""
                )}>
                    <div className={cn(
                        "flex items-center gap-2 text-sm font-semibold transition-colors",
                        guidance.color === "teal" || activeMode === "pickup" ? "text-teal-600 dark:text-teal-400" :
                            guidance.color === "orange" || activeMode === "dropoff" ? "text-orange-600 dark:text-orange-400" : "text-gray-600 dark:text-gray-800"
                    )}>
                        {activeMode ? <Crosshair size={18} className="animate-pulse" /> : guidance.icon}
                        <span>{guidance.text}</span>
                    </div>

                    {isLoadingRoute && <Loader2 size={16} className="animate-spin text-teal-500" />}
                </div>
            </div>

            {/* Right Side Control Buttons - Floating */}
            <div className="absolute top-20 right-4 z-[500] flex flex-col gap-3">
                {/* Pickup Toggle */}
                <button
                    onClick={() => setActiveMode(activeMode === "pickup" ? null : "pickup")}
                    className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95",
                        activeMode === "pickup"
                            ? "bg-teal-500 text-white ring-4 ring-teal-500/30"
                            : "bg-white text-gray-500 hover:text-teal-600"
                    )}
                    title="Set Jemput di Peta"
                >
                    <MapPin size={22} className={activeMode === "pickup" ? "fill-current" : ""} />
                </button>

                {/* Dropoff Toggle */}
                <button
                    onClick={() => setActiveMode(activeMode === "dropoff" ? null : "dropoff")}
                    className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95",
                        activeMode === "dropoff"
                            ? "bg-orange-500 text-white ring-4 ring-orange-500/30"
                            : "bg-white text-gray-500 hover:text-orange-600"
                    )}
                    title="Set Antar di Peta"
                >
                    <Navigation size={22} className={activeMode === "dropoff" ? "fill-current" : ""} />
                </button>
            </div>

            {/* Legend - Bottom Left (Simplified) */}
            <div className="absolute bottom-6 left-4 z-[500] hidden sm:block">
                <div className="bg-white/80 backdrop-blur-md p-2 rounded-lg shadow-sm border border-white/50 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-[10px] font-medium text-gray-600">
                        <div className="w-2 h-2 rounded-full bg-teal-500"></div> Jemput
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-gray-600">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div> Antar
                    </div>
                </div>
            </div>


            {/* Map Container */}
            <MapContainer
                center={center}
                zoom={14}
                scrollWheelZoom={true}
                className="h-full w-full z-0"
                style={{ background: "#f8fafc" }}
                zoomControl={false} // We will add custom if needed, or stick to default placement if we didn't block it
            >
                {/* Clean, Elegant Map Tiles - Switch based on theme */}
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {/* Bounds Updater */}
                <MapBoundsUpdater
                    pickup={pickup}
                    dropoff={dropoff}
                    basecamp={basecamp}
                    routeCoords={routeCoords}
                />

                {/* Basecamp Marker (not draggable) */}
                <Marker position={[basecamp.lat, basecamp.lng]} icon={basecampIcon} />

                {/* Pickup Marker - Draggable */}
                {pickup && onPickupChange && (
                    <DraggableMarker
                        position={[pickup.lat, pickup.lng]}
                        icon={pickupIcon}
                        onDragEnd={handlePickupDrag}
                    />
                )}

                {/* Dropoff Marker - Draggable */}
                {dropoff && onDropoffChange && (
                    <DraggableMarker
                        position={[dropoff.lat, dropoff.lng]}
                        icon={dropoffIcon}
                        onDragEnd={handleDropoffDrag}
                    />
                )}

                {/* Route Line - Now follows roads! */}
                {showRoute && routeCoords.length > 1 && (
                    <>
                        {/* Shadow line */}
                        <Polyline
                            positions={routeCoords}
                            pathOptions={{
                                color: "#0d9488", // teal-600
                                weight: 8,
                                opacity: 0.2,
                            }}
                        />
                        {/* Main line */}
                        <Polyline
                            positions={routeCoords}
                            pathOptions={{
                                color: "#14B8A6", // teal-500
                                weight: 5,
                                opacity: 0.9,
                            }}
                        />
                    </>
                )}

                {/* Click Handler when in active mode */}
                {activeMode && (
                    <MapClickHandler onMapClick={handleMapClick} />
                )}
            </MapContainer>

            {/* Active Mode Cursor Instruction (Optional, maybe too much UI) */}
            {activeMode && (
                <div className="absolute inset-0 pointer-events-none z-[400] bg-black/5 flex items-center justify-center">
                    <div className="bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium animate-bounce shadow-xl">
                        Klik Peta
                    </div>
                </div>
            )}
        </div>
    )
}

export default MapPicker
