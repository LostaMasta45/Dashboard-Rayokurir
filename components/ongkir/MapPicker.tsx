"use client"

import { useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from "react-leaflet"
import L from "leaflet"
import { MapPin, Navigation, GripVertical, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Custom icons with better visibility
const createIcon = (color: string, label: string) => L.divIcon({
    className: "custom-marker",
    html: `
        <div class="relative">
            <div class="w-10 h-10 ${color} rounded-full border-4 border-white shadow-lg flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-transform hover:scale-110">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                    <circle cx="12" cy="10" r="3"/>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                </svg>
            </div>
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                ${label}
            </div>
        </div>
    `,
    iconSize: [40, 60],
    iconAnchor: [20, 20],
})

const pickupIcon = createIcon("bg-teal-500", "Jemput")
const dropoffIcon = createIcon("bg-orange-500", "Antar")

const basecampIcon = L.divIcon({
    className: "custom-marker",
    html: `
        <div class="relative">
            <div class="w-8 h-8 bg-gray-700 rounded-full border-3 border-white shadow-md flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
            </div>
            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                Basecamp
            </div>
        </div>
    `,
    iconSize: [32, 50],
    iconAnchor: [16, 16],
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
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 })
        } else {
            const points: [number, number][] = [[basecamp.lat, basecamp.lng]]
            if (pickup) points.push([pickup.lat, pickup.lng])
            if (dropoff) points.push([dropoff.lat, dropoff.lng])

            if (points.length > 1) {
                const bounds = L.latLngBounds(points)
                map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 })
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
        if (!pickup && !dropoff) {
            return { step: 1, text: "Klik tombol hijau lalu klik peta untuk pilih lokasi JEMPUT", color: "teal" }
        }
        if (pickup && !dropoff) {
            return { step: 2, text: "Klik tombol orange lalu klik peta untuk pilih lokasi ANTAR", color: "orange" }
        }
        if (pickup && dropoff) {
            return { step: 3, text: "Geser pin untuk mengatur ulang lokasi", color: "gray" }
        }
        return null
    }

    const guidance = getGuidanceText()

    return (
        <div className={cn("relative rounded-2xl overflow-hidden shadow-lg border border-gray-200", className)}>
            {/* Step-by-step Guidance Banner */}
            {guidance && (
                <div className={cn(
                    "absolute top-0 left-0 right-0 z-[1000] px-4 py-3 text-center text-sm font-medium",
                    guidance.color === "teal" && "bg-teal-500 text-white",
                    guidance.color === "orange" && "bg-orange-500 text-white",
                    guidance.color === "gray" && "bg-gray-800 text-white"
                )}>
                    <div className="flex items-center justify-center gap-2">
                        {guidance.step < 3 && (
                            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                                Langkah {guidance.step}/2
                            </span>
                        )}
                        {guidance.step === 3 && (
                            <GripVertical size={16} className="opacity-70" />
                        )}
                        <span>{guidance.text}</span>
                        {isLoadingRoute && (
                            <Loader2 size={14} className="animate-spin ml-2" />
                        )}
                    </div>
                </div>
            )}

            {/* Action Buttons - Clear and visible with solid colors */}
            <div className="absolute top-16 right-3 z-[1000] flex flex-col gap-2">
                <button
                    onClick={() => setActiveMode(activeMode === "pickup" ? null : "pickup")}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-xl shadow-lg border-2 transition-all font-medium text-sm",
                        activeMode === "pickup"
                            ? "bg-teal-600 text-white border-teal-700 ring-4 ring-teal-500/40 scale-105"
                            : "bg-teal-500 text-white border-teal-600 hover:bg-teal-600"
                    )}
                >
                    <MapPin size={18} />
                    <span>Jemput</span>
                </button>
                <button
                    onClick={() => setActiveMode(activeMode === "dropoff" ? null : "dropoff")}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-xl shadow-lg border-2 transition-all font-medium text-sm",
                        activeMode === "dropoff"
                            ? "bg-orange-600 text-white border-orange-700 ring-4 ring-orange-500/40 scale-105"
                            : "bg-orange-500 text-white border-orange-600 hover:bg-orange-600"
                    )}
                >
                    <Navigation size={18} />
                    <span>Antar</span>
                </button>
            </div>

            {/* Legend - Bottom left */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-100">
                <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-700 rounded-full"></div>
                        <span className="text-gray-600">Basecamp</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                        <span className="text-gray-600">Lokasi Jemput</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-gray-600">Lokasi Antar</span>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <MapContainer
                center={center}
                zoom={14}
                scrollWheelZoom={true}
                className="h-full w-full min-h-[350px]"
                style={{ background: "#f8fafc" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                                color: "#000",
                                weight: 8,
                                opacity: 0.15,
                            }}
                        />
                        {/* Main line */}
                        <Polyline
                            positions={routeCoords}
                            pathOptions={{
                                color: "#14B8A6",
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

            {/* Active Mode Overlay Indicator */}
            {activeMode && (
                <div className="absolute inset-0 pointer-events-none z-[999] border-4 rounded-2xl animate-pulse"
                    style={{ borderColor: activeMode === "pickup" ? "#14b8a6" : "#f97316" }}
                />
            )}
        </div>
    )
}

export default MapPicker


