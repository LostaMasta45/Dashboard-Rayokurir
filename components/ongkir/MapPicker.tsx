"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from "react-leaflet"
import L from "leaflet"
import { MapPin, Navigation, GripVertical, Loader2, MousePointerClick, Crosshair } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RouteMode } from "@/lib/routing"

// Direct Leaflet CSS import - required for proper tile rendering
import "leaflet/dist/leaflet.css"

// Custom icons with better visibility and premium look
const createIcon = (colorClass: string, ringClass: string, label: string) => L.divIcon({
    className: "custom-marker-group",
    html: `
        <div class="relative group">
            <div class="absolute -inset-2 ${colorClass} opacity-30 rounded-full blur-sm group-hover:opacity-60 transition-opacity"></div>
            <div class="relative z-10 w-12 h-12 ${colorClass} rounded-full border-[3px] border-white shadow-2xl flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-transform hover:scale-110 ${ringClass}">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="10" r="3"/>
                    <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/>
                </svg>
            </div>
            <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900/90 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg border border-white/20 z-20">
                ${label}
            </div>
            <div class="absolute top-[80%] left-1/2 -translate-x-1/2 w-1 h-3 bg-black/20 rounded-full blur-[1px]"></div>
        </div>
    `,
    iconSize: [48, 60],
    iconAnchor: [24, 24],
})

const pickupIcon = createIcon("bg-teal-500", "ring-4 ring-teal-500/30", "Jemput")
const dropoffIcon = createIcon("bg-orange-500", "ring-4 ring-orange-500/30", "Antar")

const basecampIcon = L.divIcon({
    className: "custom-marker-basecamp",
    html: `
        <div class="relative">
             <div class="w-10 h-10 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full border-[3px] border-white dark:border-slate-800 shadow-xl flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M3 21h18v-8H3v8zm6-11V7l3-3 3 3v3h-6z"/>
                     <path d="M0 0h24v24H0z" fill="none"/>
                </svg>
            </div>
           <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] px-2.5 py-1 rounded-md font-extrabold shadow-lg">
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
    selectionMode?: "pickup" | "dropoff" | null
    onCenterChange?: (lat: number, lng: number) => void
    flyTo?: { lat: number, lng: number } | null
    routeMode?: RouteMode
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
function MapBoundsUpdater({ pickup, dropoff, basecamp, routeCoords, selectionMode }: {
    pickup: MapLocation | null
    dropoff: MapLocation | null
    basecamp: MapLocation
    routeCoords: [number, number][]
    selectionMode?: "pickup" | "dropoff" | null
}) {
    const map = useMap()

    useEffect(() => {
        if (selectionMode) return // Don't auto-fit in selection mode, let user pan freely

        // Only auto-fit on first load or significant route changes if not manually interacting
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
    }, [pickup, dropoff, basecamp, routeCoords, map, selectionMode])

    return null
}

// Robust resize handler using ResizeObserver
function MapResizeHandler() {
    const map = useMap()

    useEffect(() => {
        const container = map.getContainer()
        if (!container) return

        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize()
        })

        resizeObserver.observe(container)
        map.invalidateSize()

        return () => {
            resizeObserver.disconnect()
        }
    }, [map])

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                map.invalidateSize()
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [map])

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
function MapFlyTo({ target }: { target: { lat: number, lng: number } | null }) {
    const map = useMap()

    useEffect(() => {
        if (!target) return
        map.flyTo([target.lat, target.lng], 16, {
            animate: true,
            duration: 1.5
        })
    }, [target, map])

    return null
}

// Map Event Listener for Moving State
function MapStateListener({ onMoveStart, onMoveEnd, onCenterChange }: {
    onMoveStart: () => void,
    onMoveEnd: () => void,
    onCenterChange?: (lat: number, lng: number) => void
}) {
    const map = useMap()
    useMapEvents({
        movestart: () => onMoveStart(),
        moveend: () => {
            onMoveEnd()
            if (onCenterChange) {
                const center = map.getCenter()
                onCenterChange(center.lat, center.lng)
            }
        },
        zoomend: () => {
            // ensure we capture center update on zoom too
            if (onCenterChange) {
                const center = map.getCenter()
                onCenterChange(center.lat, center.lng)
            }
        }
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
    selectionMode = null,
    onCenterChange,
    flyTo = null,
    routeMode = "kampung"
}: MapPickerProps) {
    const [activeMode, setActiveMode] = useState<"pickup" | "dropoff" | null>(null)
    const [routeCoords, setRouteCoords] = useState<[number, number][]>([])
    const [isLoadingRoute, setIsLoadingRoute] = useState(false)
    const [isMapMoving, setIsMapMoving] = useState(false)
    const { resolvedTheme } = useTheme()

    // Dynamic tile URL based on theme
    const tileUrl = resolvedTheme === "dark"
        ? "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"

    // Calculate center point
    const center: [number, number] = selectionMode === "pickup" && pickup
        ? [pickup.lat, pickup.lng]
        : selectionMode === "dropoff" && dropoff
            ? [dropoff.lat, dropoff.lng]
            : pickup
                ? [pickup.lat, pickup.lng]
                : dropoff
                    ? [dropoff.lat, dropoff.lng]
                    : [basecamp.lat, basecamp.lng]

    // Fetch route geometry when pickup and dropoff change
    useEffect(() => {
        async function fetchRouteGeometry() {
            if (!pickup || !dropoff || selectionMode) {
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
                        ],
                        routeMode
                    })
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.coordinates && data.coordinates.length > 0) {
                        setRouteCoords(data.coordinates)
                    } else {
                        setRouteCoords([[basecamp.lat, basecamp.lng], [pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]])
                    }
                } else {
                    setRouteCoords([[basecamp.lat, basecamp.lng], [pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]])
                }
            } catch (error) {
                console.error("Error fetching route geometry:", error)
                setRouteCoords([[basecamp.lat, basecamp.lng], [pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]])
            } finally {
                setIsLoadingRoute(false)
            }
        }
        fetchRouteGeometry()
    }, [pickup, dropoff, basecamp, selectionMode, routeMode])

    const handlePickupDrag = (lat: number, lng: number) => {
        if (onPickupChange) onPickupChange({ lat, lng, label: "Custom" })
    }

    const handleDropoffDrag = (lat: number, lng: number) => {
        if (onDropoffChange) onDropoffChange({ lat, lng, label: "Custom" })
    }

    const handleMapClick = (lat: number, lng: number) => {
        if (activeMode === "pickup" && onPickupChange) {
            onPickupChange({ lat, lng, label: "Lokasi Jemput" })
            setActiveMode(null)
        } else if (activeMode === "dropoff" && onDropoffChange) {
            onDropoffChange({ lat, lng, label: "Lokasi Antar" })
            setActiveMode(null)
        }
    }

    const getGuidanceText = () => {
        if (selectionMode) return { text: "Geser peta untuk menentukan titik", color: selectionMode === "pickup" ? "teal" : "orange", icon: <GripVertical size={16} /> }
        if (activeMode === "pickup") return { text: "Klik di peta untuk lokasi JEMPUT", color: "teal", icon: <MapPin size={16} /> }
        if (activeMode === "dropoff") return { text: "Klik di peta untuk lokasi ANTAR", color: "orange", icon: <Navigation size={16} /> }
        if (!pickup) return { text: "Set lokasi jemput", color: "gray", icon: <MapPin size={16} /> }
        if (!dropoff) return { text: "Set lokasi antar", color: "gray", icon: <Navigation size={16} /> }
        return { text: "Geser marker untuk akurasi", color: "gray", icon: <GripVertical size={16} /> }
    }
    const guidance = getGuidanceText()

    return (
        <div className={cn("relative h-full w-full bg-slate-100 dark:bg-gray-950 transition-colors", className)}>

            {/* Top Floating Bar for Guidance & Mode - Hide if in Selection Mode */}
            {!selectionMode && (
                <div className="absolute top-4 inset-x-4 z-[500] pointer-events-none flex justify-center">
                    <div className={cn(
                        "pointer-events-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-gray-200/80 dark:border-gray-700/80 flex items-center gap-3 transition-all",
                        activeMode ? "scale-105 ring-4 ring-teal-500/20 dark:ring-teal-400/20" : ""
                    )}>
                        <div className={cn(
                            "flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors",
                            guidance.color === "teal" || activeMode === "pickup" ? "text-teal-600 dark:text-teal-400" :
                                guidance.color === "orange" || activeMode === "dropoff" ? "text-orange-600 dark:text-orange-400" : "text-gray-700 dark:text-gray-200"
                        )}>
                            {activeMode ? <Crosshair size={18} className="animate-pulse" /> : guidance.icon}
                            <span>{guidance.text}</span>
                        </div>
                        {isLoadingRoute && <Loader2 size={16} className="animate-spin text-teal-500" />}
                    </div>
                </div>
            )}

            {/* Center Pin Overlay (Selection Mode Only) */}
            {selectionMode && (
                <div className="absolute inset-0 z-[1000] pointer-events-none flex items-center justify-center pb-[0px]">
                    {/* The Pin Area */}
                    <div className="relative flex flex-col items-center">

                        {/* Tooltip Instruction */}
                        <div className={cn(
                            "absolute -top-16 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-3 py-1.5 rounded-xl shadow-2xl font-bold transition-all duration-300 border border-gray-700 dark:border-gray-300",
                            isMapMoving ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                        )}>
                            Lepas untuk pilih lokasi ini
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
                        </div>

                        {/* The Pin Circle */}
                        <div className={cn(
                            "w-12 h-12 rounded-full border-[3px] border-white shadow-2xl flex items-center justify-center transition-all duration-300 ease-out",
                            selectionMode === 'pickup' ? "bg-teal-500 ring-4 ring-teal-500/30" : "bg-orange-500 ring-4 ring-orange-500/30",
                            isMapMoving ? "-translate-y-4 scale-110 shadow-2xl" : "translate-y-0 scale-100"
                        )} style={{ marginBottom: isMapMoving ? "28px" : "20px" }}>
                            {selectionMode === 'pickup' ? (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="10" r="3" />
                                    <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
                                </svg>
                            ) : (
                                <Navigation size={20} className="text-white fill-white" />
                            )}
                        </div>

                        {/* Stick Effect */}
                        <div className={cn(
                            "absolute left-1/2 -translate-x-1/2 w-[3px] bg-gray-600/50 dark:bg-gray-300/50 rounded-full transition-all duration-300",
                            isMapMoving ? "h-[20px] bottom-[28px] opacity-30" : "h-[20px] bottom-[20px] opacity-100"
                        )}></div>

                        {/* Shadow on ground */}
                        <div className={cn(
                            "absolute bottom-0 left-1/2 -translate-x-1/2 bg-black/30 dark:bg-black/60 rounded-full blur-[1px] transition-all duration-300",
                            isMapMoving ? "w-2 h-1 opacity-20" : "w-4 h-2 opacity-50"
                        )}></div>
                    </div>
                </div>
            )}

            {/* Right Side Control Buttons - Floating - Hide in selection mode */}
            {!selectionMode && (
                <div className="absolute top-20 right-4 z-[500] flex flex-col gap-3">
                    <button
                        onClick={() => setActiveMode(activeMode === "pickup" ? null : "pickup")}
                        className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 border border-gray-200/80 dark:border-gray-700",
                            activeMode === "pickup" ? "bg-teal-500 text-white ring-4 ring-teal-500/30" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-teal-600 dark:hover:text-teal-400"
                        )}
                        title="Pilih Titik Jemput di Peta"
                    >
                        <MapPin size={22} className={activeMode === "pickup" ? "fill-current" : ""} />
                    </button>
                    <button
                        onClick={() => setActiveMode(activeMode === "dropoff" ? null : "dropoff")}
                        className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 border border-gray-200/80 dark:border-gray-700",
                            activeMode === "dropoff" ? "bg-orange-500 text-white ring-4 ring-orange-500/30" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-orange-600 dark:hover:text-orange-400"
                        )}
                        title="Pilih Titik Antar di Peta"
                    >
                        <Navigation size={22} className={activeMode === "dropoff" ? "fill-current" : ""} />
                    </button>
                </div>
            )}

            {/* Map Container */}
            <MapContainer
                center={center}
                zoom={16}
                scrollWheelZoom={true}
                className="h-full w-full z-0"
                zoomControl={false}
            >
                <TileLayer attribution='&copy; CARTO' url={tileUrl} />

                <MapResizeHandler />
                <MapBoundsUpdater pickup={pickup} dropoff={dropoff} basecamp={basecamp} routeCoords={routeCoords} selectionMode={selectionMode} />
                <MapFlyTo target={flyTo} />

                {/* Event Listener for Moving State */}
                <MapStateListener
                    onMoveStart={() => setIsMapMoving(true)}
                    onMoveEnd={() => setIsMapMoving(false)}
                    onCenterChange={selectionMode ? onCenterChange : undefined}
                />

                <Marker position={[basecamp.lat, basecamp.lng]} icon={basecampIcon} />
                {pickup && onPickupChange && selectionMode !== 'pickup' && <DraggableMarker position={[pickup.lat, pickup.lng]} icon={pickupIcon} onDragEnd={handlePickupDrag} />}
                {dropoff && onDropoffChange && selectionMode !== 'dropoff' && <DraggableMarker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon} onDragEnd={handleDropoffDrag} />}

                {!selectionMode && showRoute && routeCoords.length > 1 && (
                    <>
                        <Polyline positions={routeCoords} pathOptions={{ color: "#0d9488", weight: 8, opacity: 0.2 }} />
                        <Polyline positions={routeCoords} pathOptions={{ color: "#14B8A6", weight: 5, opacity: 0.9 }} />
                    </>
                )}

                {activeMode && !selectionMode && <MapClickHandler onMapClick={handleMapClick} />}
            </MapContainer>
        </div>
    )
}

export default MapPicker
