"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUpDown, Zap, MessageCircle, Calculator, Clock, Route, Info, Loader2, Map as MapIcon, Share2, Copy, Check, MapPin, ChevronRight, Navigation, ChevronDown, ChevronUp, ArrowLeft, Crosshair } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { LocationSearchInput } from "./LocationSearchInput"
import { MapPicker } from "./MapPickerWrapper"
import { calculateOngkir, formatRupiah, generateWhatsAppLink, BASECAMP, haversineDistance } from "@/lib/pricing"
import "@/styles/leaflet-custom.css"
import { cn } from "@/lib/utils"

type Status = "idle" | "partial" | "loading" | "ready" | "error"

interface Location {
    id: string
    label: string
    lat: number
    lng: number
}

interface CalculationResult {
    d1Fee: number
    d2Fee: number
    expressFee: number
    subtotal: number
    total: number
    d1Km: number
    d2Km: number
    d1DurationMinutes: number
    d2DurationMinutes: number
    totalDurationMinutes: number
}

interface OngkirCalculatorWithMapProps {
    className?: string
    compact?: boolean
}

export function OngkirCalculatorWithMap({ className = "", compact = false }: OngkirCalculatorWithMapProps) {

    const [pickup, setPickup] = useState<Location | null>(null)
    const [dropoff, setDropoff] = useState<Location | null>(null)
    const [isExpress, setIsExpress] = useState(false)
    const [status, setStatus] = useState<Status>("idle")
    const [result, setResult] = useState<CalculationResult | null>(null)
    const [notes, setNotes] = useState("")
    const [showMap, setShowMap] = useState(false) // For Desktop/Overview Mobile
    const [isCopied, setIsCopied] = useState(false)

    // Selection Mode State (Mobile Full Screen)
    const [selectingMode, setSelectingMode] = useState<"pickup" | "dropoff" | null>(null)
    const [tempLocation, setTempLocation] = useState<Location | null>(null)
    const [isGeocoding, setIsGeocoding] = useState(false)
    const [flyToLocation, setFlyToLocation] = useState<{ lat: number, lng: number } | null>(null)
    const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Load from URL params on mount
    useEffect(() => {
        if (typeof window === "undefined") return
        const params = new URLSearchParams(window.location.search)
        const pickupLat = params.get("pickup_lat")
        const pickupLng = params.get("pickup_lng")
        const pickupLabel = params.get("pickup_label")
        const dropoffLat = params.get("dropoff_lat")
        const dropoffLng = params.get("dropoff_lng")
        const dropoffLabel = params.get("dropoff_label")
        const express = params.get("express")

        if (pickupLat && pickupLng) {
            setPickup({
                id: `url-pickup-${Date.now()}`,
                label: pickupLabel || `Lokasi (${pickupLat}, ${pickupLng})`,
                lat: parseFloat(pickupLat),
                lng: parseFloat(pickupLng)
            })
        }
        if (dropoffLat && dropoffLng) {
            setDropoff({
                id: `url-dropoff-${Date.now()}`,
                label: dropoffLabel || `Lokasi (${dropoffLat}, ${dropoffLng})`,
                lat: parseFloat(dropoffLat),
                lng: parseFloat(dropoffLng)
            })
        }
        if (express === "true") {
            setIsExpress(true)
        }
    }, [])

    // Calculate distances and pricing
    const calculateRoute = useCallback(async () => {
        if (!pickup || !dropoff) return

        setStatus("loading")

        try {
            // Calculate D1: Basecamp → Pickup
            const d1Response = await fetch("/api/route-distance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    from: { lat: BASECAMP.lat, lng: BASECAMP.lng },
                    to: { lat: pickup.lat, lng: pickup.lng }
                })
            })
            const d1Data = await d1Response.json()
            const d1Km = d1Data.distance_m / 1000

            // Calculate D2: Pickup → Dropoff
            const d2Response = await fetch("/api/route-distance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    from: { lat: pickup.lat, lng: pickup.lng },
                    to: { lat: dropoff.lat, lng: dropoff.lng }
                })
            })
            const d2Data = await d2Response.json()
            const d2Km = d2Data.distance_m / 1000

            // Calculate pricing
            const pricing = calculateOngkir(d1Km, d2Km, isExpress)
            const d1DurationMinutes = Math.round(d1Data.duration_s / 60)
            const d2DurationMinutes = Math.round(d2Data.duration_s / 60)

            setResult({
                ...pricing,
                d1Km,
                d2Km,
                d1DurationMinutes,
                d2DurationMinutes,
                totalDurationMinutes: d1DurationMinutes + d2DurationMinutes
            })
            setStatus("ready")
            // setShowMap(false) // Don't auto-hide map on mobile anymore, let user decide

        } catch (error) {
            console.error("Route calculation error:", error)

            // Fallback to Haversine
            const d1Km = haversineDistance(BASECAMP.lat, BASECAMP.lng, pickup.lat, pickup.lng)
            const d2Km = haversineDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng)
            const pricing = calculateOngkir(d1Km, d2Km, isExpress)
            const d1DurationMinutes = Math.round(d1Km * 2)
            const d2DurationMinutes = Math.round(d2Km * 2)

            setResult({
                ...pricing,
                d1Km,
                d2Km,
                d1DurationMinutes,
                d2DurationMinutes,
                totalDurationMinutes: d1DurationMinutes + d2DurationMinutes
            })
            setStatus("ready")
            // setShowMap(false)
        }
    }, [pickup, dropoff, isExpress])

    // Recalculate when express changes
    useEffect(() => {
        if (result && pickup && dropoff) {
            const pricing = calculateOngkir(result.d1Km, result.d2Km, isExpress)
            setResult(prev => prev ? { ...prev, ...pricing } : null)
        }
    }, [isExpress])

    // Auto-calculate when both locations selected
    useEffect(() => {
        if (pickup && dropoff) {
            if (pickup.id === dropoff.id) {
                setStatus("error")
                return
            }
            calculateRoute()
        } else if (pickup || dropoff) {
            setStatus("partial")
        } else {
            setStatus("idle")
        }
    }, [pickup, dropoff, calculateRoute])

    // Swap locations
    const handleSwap = () => {
        const temp = pickup
        setPickup(dropoff)
        setDropoff(temp)
    }

    // WhatsApp link
    const waLink = useMemo(() => {
        if (!pickup || !dropoff || !result) return "#"
        return generateWhatsAppLink(pickup.label, dropoff.label, result.total, isExpress, notes)
    }, [pickup, dropoff, result, isExpress, notes])

    // Generate shareable URL
    const generateShareableUrl = useCallback(() => {
        if (!pickup || !dropoff) return ""
        const baseUrl = typeof window !== "undefined" ? window.location.origin + window.location.pathname : ""
        const params = new URLSearchParams()
        params.set("pickup_lat", pickup.lat.toString())
        params.set("pickup_lng", pickup.lng.toString())
        params.set("pickup_label", pickup.label)
        params.set("dropoff_lat", dropoff.lat.toString())
        params.set("dropoff_lng", dropoff.lng.toString())
        params.set("dropoff_label", dropoff.label)
        if (isExpress) params.set("express", "true")
        return `${baseUrl}?${params.toString()}`
    }, [pickup, dropoff, isExpress])

    // Copy link to clipboard
    const copyToClipboard = useCallback(async () => {
        const url = generateShareableUrl()
        if (!url) return
        try {
            await navigator.clipboard.writeText(url)
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        } catch {
            const textArea = document.createElement("textarea")
            textArea.value = url
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand("copy")
            document.body.removeChild(textArea)
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        }
    }, [generateShareableUrl])

    // Map locations
    const mapPickup = selectingMode === 'pickup' && tempLocation ? tempLocation : pickup
    const mapDropoff = selectingMode === 'dropoff' && tempLocation ? tempLocation : dropoff
    const mapBasecamp = { lat: BASECAMP.lat, lng: BASECAMP.lng, label: BASECAMP.label }

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const response = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`)
            if (response.ok) {
                const data = await response.json()
                return data.label || null
            }
        } catch (error) {
            console.error("Reverse geocode error:", error)
        }
        return null
    }

    const handleMapPickupChange = useCallback(async (loc: { lat: number; lng: number; label?: string }) => {
        // Only used for Desktop drag/click - for Mobile Selection logic see handleCenterChange
        // Short coordinate format for display
        const shortCoord = `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`

        setPickup({
            id: `custom-pickup-${Date.now()}`,
            label: `Titik Peta (${shortCoord})`,
            lat: loc.lat,
            lng: loc.lng
        })

        const address = await reverseGeocode(loc.lat, loc.lng)
        if (address) {
            setPickup({
                id: `custom-pickup-${Date.now()}`,
                label: `${address} (${shortCoord})`,
                lat: loc.lat,
                lng: loc.lng
            })
        }
    }, [])

    const handleMapDropoffChange = useCallback(async (loc: { lat: number; lng: number; label?: string }) => {
        const shortCoord = `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`

        setDropoff({
            id: `custom-dropoff-${Date.now()}`,
            label: `Titik Peta (${shortCoord})`,
            lat: loc.lat,
            lng: loc.lng
        })

        const address = await reverseGeocode(loc.lat, loc.lng)
        if (address) {
            setDropoff({
                id: `custom-dropoff-${Date.now()}`,
                label: `${address} (${shortCoord})`,
                lat: loc.lat,
                lng: loc.lng
            })
        }
    }, [])

    // New: Handle Center Change in Selection Mode
    const handleCenterChange = (lat: number, lng: number) => {
        if (!selectingMode) return

        const shortCoord = `${lat.toFixed(5)}, ${lng.toFixed(5)}`

        // Immediate update with coord label
        setTempLocation({
            id: 'temp',
            lat,
            lng,
            label: `Titik (${shortCoord})`
        })
        setIsGeocoding(true)

        // Debounce geocoding
        if (geocodeTimeoutRef.current) {
            clearTimeout(geocodeTimeoutRef.current)
        }

        geocodeTimeoutRef.current = setTimeout(async () => {
            const address = await reverseGeocode(lat, lng)
            if (address) {
                setTempLocation(prev => prev ? { ...prev, label: address } : null)
            }
            setIsGeocoding(false)
        }, 800)
    }

    // Open Selection Mode with History State
    const openSelectionMode = (mode: "pickup" | "dropoff") => {
        setSelectingMode(mode)
        // Push state so back button closes modal instead of navigating away
        if (typeof window !== "undefined") {
            window.history.pushState({ modal: 'map' }, '', window.location.href)
        }

        // Set initial temp location to current pickup/dropoff or center or Basecamp
        const currentLoc = mode === "pickup" ? pickup : dropoff

        if (currentLoc) {
            setTempLocation(currentLoc)
        } else {
            // Need to set a default location if none exists
            // Ideally: User's geolocation or Basecamp or the other point
            const otherLoc = mode === "pickup" ? dropoff : pickup
            setTempLocation(otherLoc || { ...BASECAMP, id: 'basecamp' })
        }
    }

    // Handle Back Button (Popstate)
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            // If we are in selecting mode, close it
            setSelectingMode(null)
        }

        window.addEventListener('popstate', handlePopState)
        return () => window.removeEventListener('popstate', handlePopState)
    }, [])

    const confirmSelection = () => {
        if (!selectingMode || !tempLocation) return

        if (selectingMode === "pickup") {
            setPickup({ ...tempLocation, id: `picked-pickup-${Date.now()}` })
            // Auto-advance logic: If no dropoff set, go to dropoff
            if (!dropoff) {
                // Small delay for UI transition
                setTimeout(() => {
                    openSelectionMode("dropoff")
                }, 100)
                // Don't close immediately, let the transition happen via openSelectionMode
            } else {
                setSelectingMode(null)
                window.history.back() // Clean up history state
            }
        } else {
            setDropoff({ ...tempLocation, id: `picked-dropoff-${Date.now()}` })
            setSelectingMode(null)
            window.history.back() // Clean up history state
        }
        setTempLocation(null)
    }

    // GPS Handler for Map Modal
    const handleGPS = () => {
        if (!navigator.geolocation) {
            alert("Geolocation tidak didukung")
            return
        }

        setIsGeocoding(true)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                setFlyToLocation({ lat: latitude, lng: longitude })
                setIsGeocoding(false)
            },
            (err) => {
                console.error(err)
                setIsGeocoding(false)
                alert("Gagal mendapatkan lokasi")
            },
            { enableHighAccuracy: true }
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white/80 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-gray-200/50 dark:shadow-black/50 border border-white/50 dark:border-white/10 relative overflow-hidden transition-all duration-500 ${className}`}
        >
            <div className={cn("grid gap-0 relative", !compact && "lg:grid-cols-2")}>

                {/* 
                  Desktop Map View 
                  - Visible on Desktop
                  - Visible on Mobile ONLY if showMap is true AND we are NOT in selection mode (selection mode takes over full screen)
                */}
                <div className={cn(
                    "h-[400px] bg-slate-50 relative transition-all duration-300 ease-in-out",
                    !compact && "lg:block lg:h-auto lg:min-h-[600px]",
                    showMap && !selectingMode ? "block" : "hidden"
                )}>
                    {/* 
                         We reuse MapPicker here. 
                         When in desktop mode, it works as before (showing markers).
                     */}
                    <div className="absolute inset-0">
                        {/* Only render this instance if NOT selecting mode to avoid conflict? 
                             Actually, we can just hide it with CSS to preserve state, 
                             but for mobile performance, unmounting might be better if we use a different instance for the modal.
                             Let's keep one instance if possible to avoid re-renders, but since we need full screen modal...
                             The Desktop Left Panel creates a context. The Mobile Modal creates another. Leaflet doesn't like shared contexts.
                             So we will have TWO MapPickers. One here, one in the Modal.
                         */}
                        <MapPicker
                            pickup={pickup ? { lat: pickup.lat, lng: pickup.lng, label: pickup.label } : null}
                            dropoff={dropoff ? { lat: dropoff.lat, lng: dropoff.lng, label: dropoff.label } : null}
                            basecamp={mapBasecamp}
                            onPickupChange={handleMapPickupChange}
                            onDropoffChange={handleMapDropoffChange}
                            className="h-full w-full"
                            showRoute={true}
                        />
                    </div>
                    {/* Close Map Button (Mobile only) */}
                    <div className={cn("absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]", !compact && "lg:hidden")}>
                        <Button
                            onClick={() => setShowMap(false)}
                            className="rounded-full shadow-xl bg-gray-900 text-white hover:bg-gray-800 border-none px-6 py-6 font-medium active:scale-95 transition-all"
                        >
                            <span className="mr-2">✕</span> Tutup Peta
                        </Button>
                    </div>
                </div>

                {/* Form Section */}
                <div className="p-6 lg:p-10 flex flex-col h-full bg-transparent relative z-10">

                    {/* Header with Mobile Map Toggle */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="font-bold text-2xl text-gray-900 dark:text-white tracking-tight">Rute Pengiriman</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Isi detail penjemputan & tujuan</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowMap(!showMap)}
                            className={cn(
                                "rounded-full font-medium transition-all active:scale-95",
                                !compact && "lg:hidden",
                                showMap ? "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800" : "text-gray-600 dark:text-gray-400"
                            )}
                        >
                            <MapIcon size={16} className="mr-2" />
                            {showMap ? "Sembunyikan" : "Lihat Rute"}
                        </Button>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-[26px] top-10 bottom-10 w-0.5 bg-gray-200 dark:bg-gray-700 border-l border-dashed border-transparent pointer-events-none hidden md:block" />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-teal-600 flex items-center gap-1.5 ml-1">
                                    <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_0_4px_rgba(20,184,166,0.1)]"></div>
                                    Lokasi Jemput
                                </label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openSelectionMode("pickup")}
                                    className="h-6 text-[10px] px-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 -mr-2"
                                >
                                    <MapPin size={12} className="mr-1" />
                                    Pilih lewat Peta
                                </Button>
                            </div>
                            <LocationSearchInput
                                onSelect={(loc) => {
                                    setPickup({ ...loc, id: `search-pickup-${Date.now()}` })
                                }}
                                placeholder="Cari alamat jemput..."
                                icon="pickup"
                                value={pickup?.label || ""}
                                onClear={() => setPickup(null)}
                            />
                        </div>

                        {/* Swap Button (Floating) */}
                        <div className="relative h-4 z-10 flex justify-end pr-4 md:pr-0 md:justify-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSwap}
                                disabled={!pickup && !dropoff}
                                className="h-8 w-8 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-white dark:hover:bg-gray-700 hover:border-teal-200 dark:hover:border-teal-800 transition-all shadow-sm -mt-2"
                                title="Tukar Lokasi"
                            >
                                <ArrowUpDown size={14} />
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-orange-600 flex items-center gap-1.5 ml-1">
                                    <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_0_4px_rgba(249,115,22,0.1)]"></div>
                                    Tujuan Antar
                                </label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openSelectionMode("dropoff")}
                                    className="h-6 text-[10px] px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 -mr-2"
                                >
                                    <Navigation size={12} className="mr-1" />
                                    Pilih lewat Peta
                                </Button>
                            </div>
                            <LocationSearchInput
                                onSelect={(loc) => {
                                    setDropoff({ ...loc, id: `search-dropoff-${Date.now()}` })
                                }}
                                placeholder="Cari alamat tujuan..."
                                icon="dropoff"
                                value={dropoff?.label || ""}
                                onClear={() => setDropoff(null)}
                            />
                        </div>
                    </div>

                    {/* Express Toggle */}
                    <div className="group mt-8 flex items-center justify-between p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl hover:border-amber-200 dark:hover:border-amber-900/40 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all cursor-pointer shadow-sm" onClick={() => setIsExpress(!isExpress)}>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                                <Zap size={20} className="fill-current" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    Express Priority
                                    {isExpress && <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold">ON</span>}
                                </p>
                                <p className="text-xs text-gray-500">Pengiriman prioritas (+Rp2.000)</p>
                            </div>
                        </div>
                        <Switch
                            checked={isExpress}
                            onCheckedChange={setIsExpress}
                            className="data-[state=checked]:bg-amber-500 ml-2"
                        />
                    </div>

                    {/* Result Area */}
                    <div className="mt-8 flex-1">
                        <AnimatePresence mode="wait">
                            {status === "idle" && (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-200 dark:border-gray-700/50 rounded-3xl bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm"
                                >
                                    <div className="bg-white dark:bg-gray-800/50 p-4 rounded-full shadow-sm mb-4 ring-1 ring-gray-100 dark:ring-gray-700/50">
                                        <MapIcon size={32} className="text-gray-300 dark:text-gray-500" />
                                    </div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Mulai Hitung Ongkir</h4>
                                    <p className="text-sm text-gray-400 dark:text-gray-500 max-w-[200px]">Masukkan lokasi jemput dan tujuan untuk melihat estimasi harga.</p>
                                </motion.div>
                            )}

                            {status === "loading" && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full flex flex-col items-center justify-center p-10"
                                >
                                    <Loader2 size={40} className="animate-spin text-teal-500 mb-4" />
                                    <p className="text-gray-500 font-medium animate-pulse">Menghitung rute terbaik...</p>
                                </motion.div>
                            )}

                            {status === "ready" && result && (
                                <motion.div
                                    key="ready"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    {/* Price Card */}
                                    <div className="bg-gray-900 dark:bg-black rounded-[2rem] p-6 text-white relative overflow-hidden group border border-gray-800">
                                        {/* Abstract glows */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity" />
                                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity" />

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="text-gray-400 text-sm font-medium mb-1">Total Estimasi Biasa</p>
                                                    <h2 className="text-4xl font-bold tracking-tight text-white">
                                                        {formatRupiah(result.total)}
                                                    </h2>
                                                </div>
                                                <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                                    <span className="text-xs font-bold text-teal-400">
                                                        {(result.d1Km + result.d2Km).toFixed(1)} KM
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="h-px bg-white/10 my-4" />

                                            <div className="flex gap-6">
                                                <div className="flex items-center gap-2 text-gray-300 text-sm">
                                                    <Clock size={16} className="text-teal-400" />
                                                    <span>±{result.totalDurationMinutes} menit</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-300 text-sm">
                                                    <Route size={16} className="text-teal-400" />
                                                    <span>Rute Tercepat</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline Details */}
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-6 border border-gray-100 dark:border-gray-800">
                                        <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Rincian Perjalanan</h4>
                                        <div className="space-y-6 relative">
                                            {/* Line */}
                                            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-200" />

                                            {/* Item 1: Jemput */}
                                            <div className="relative flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white border-4 border-teal-100 text-teal-600 flex items-center justify-center shrink-0 z-10 shadow-sm">
                                                    <Navigation size={16} className="fill-current" />
                                                </div>
                                                <div className="flex-1 pt-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">Penjemputan</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{result.d1DurationMinutes} menit • {result.d1Km.toFixed(1)} km</p>
                                                        </div>
                                                        <span className="font-bold text-gray-900 dark:text-white text-sm">{formatRupiah(result.d1Fee)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Item 2: Antar */}
                                            <div className="relative flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white border-4 border-orange-100 text-orange-600 flex items-center justify-center shrink-0 z-10 shadow-sm">
                                                    <MapPin size={16} className="fill-current" />
                                                </div>
                                                <div className="flex-1 pt-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">Pengantaran</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{result.d2DurationMinutes} menit • {result.d2Km.toFixed(1)} km</p>
                                                        </div>
                                                        <span className="font-bold text-gray-900 dark:text-white text-sm">{formatRupiah(result.d2Fee)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {isExpress && (
                                                <div className="relative flex gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 z-10 shadow-sm ring-4 ring-white">
                                                        <Zap size={16} className="fill-current" />
                                                    </div>
                                                    <div className="flex-1 pt-2">
                                                        <div className="flex justify-between items-center">
                                                            <p className="font-medium text-amber-700 text-sm">Biaya Priority</p>
                                                            <span className="font-bold text-amber-700 text-sm">+{formatRupiah(result.expressFee)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            onClick={() => window.open(waLink, "_blank")}
                                            className="col-span-2 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98]"
                                        >
                                            <MessageCircle className="mr-2" size={20} />
                                            Pesan Sekarang
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={copyToClipboard}
                                            className="h-12 rounded-xl border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:border-teal-200 dark:hover:border-teal-800 dark:bg-transparent"
                                        >
                                            {isCopied ? <Check size={18} className="mr-2 text-green-500" /> : <Copy size={18} className="mr-2" />}
                                            {isCopied ? "Tersalin" : "Salin Link"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-12 rounded-xl border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 hover:border-green-200 dark:hover:border-green-800 dark:bg-transparent"
                                            onClick={() => {
                                                const url = generateShareableUrl()
                                                const text = `Cek ongkir ini: ${url}`
                                                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
                                            }}
                                        >
                                            <Share2 size={18} className="mr-2" />
                                            Share
                                        </Button>
                                    </div>

                                    {/* Note Input */}
                                    <div className="pt-2">
                                        <Accordion type="single" collapsible className="w-full">
                                            <AccordionItem value="notes" className="border-none">
                                                <AccordionTrigger className="text-sm font-medium text-gray-500 hover:text-gray-900 py-2 justify-start gap-2">
                                                    <span className="flex items-center gap-2">
                                                        <Info size={14} /> Tambah Catatan & Info
                                                    </span>
                                                </AccordionTrigger>
                                                <AccordionContent className="pt-2">
                                                    <textarea
                                                        value={notes}
                                                        onChange={(e) => setNotes(e.target.value)}
                                                        placeholder="Contoh: Barang pecah belah, Masuk gang mawar..."
                                                        className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                                        rows={3}
                                                    />

                                                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-xs space-y-2">
                                                        <p>• Tarif bisa berubah sesuai kondisi lapangan</p>
                                                        <p>• Titip belanja gratis untuk pembelian {"<"} 100rb</p>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </div>

                                </motion.div>
                            )}
                            {status === "error" && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-4 bg-red-50 text-red-600 text-center rounded-2xl text-sm font-medium"
                                >
                                    Lokasi jemput dan tujuan tidak boleh sama.
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </div>

            {/* FULL SCREEN SELECTION MAP MODAL (Mobile Focused) */}
            <AnimatePresence>
                {selectingMode && (
                    <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ duration: 0.3, ease: "circOut" }}
                        className="fixed inset-0 z-[9999] bg-white dark:bg-black flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="absolute top-0 inset-x-0 z-[10000] pointer-events-none" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
                            <div className="px-4 pb-10 bg-gradient-to-b from-black/40 via-black/20 to-transparent">
                                <div className="flex items-center gap-2.5 pointer-events-auto">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => window.history.back()}
                                        className="rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl h-11 w-11 shadow-lg shadow-black/10 border-0 shrink-0 hover:bg-white dark:hover:bg-gray-800"
                                    >
                                        <ArrowLeft size={18} className="text-gray-800 dark:text-white" />
                                    </Button>
                                    <div className="flex-1 shadow-lg shadow-black/10 rounded-xl overflow-hidden">
                                        <LocationSearchInput
                                            placeholder={selectingMode === 'pickup' ? "Cari lokasi jemput..." : "Cari lokasi tujuan..."}
                                            icon={selectingMode || 'pickup'}
                                            value=""
                                            onSelect={(loc) => {
                                                setFlyToLocation({ lat: loc.lat, lng: loc.lng })
                                            }}
                                            className="w-full"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleGPS}
                                        className="rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl h-11 w-11 shadow-lg shadow-black/10 border-0 shrink-0 hover:bg-white dark:hover:bg-gray-800"
                                    >
                                        {isGeocoding ? <Loader2 size={18} className="animate-spin text-teal-600" /> : <Crosshair size={18} className="text-gray-800 dark:text-white" />}
                                    </Button>
                                </div>
                                {/* Mode Pill */}
                                <div className="flex justify-center mt-3 pointer-events-none">
                                    <div className={cn(
                                        "px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-lg backdrop-blur-xl",
                                        selectingMode === 'pickup'
                                            ? "bg-teal-500/90 text-white shadow-teal-500/20"
                                            : "bg-orange-500/90 text-white shadow-orange-500/20"
                                    )}>
                                        {selectingMode === 'pickup' ? '📍 Pilih Titik Jemput' : '📍 Pilih Titik Antar'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Map */}
                        <div className="flex-1 relative bg-slate-100 min-h-0">
                            {/* Separate Map Instance for Selection Mode */}
                            {tempLocation && (
                                <div className="absolute inset-0">
                                    <MapPicker
                                        pickup={selectingMode === 'pickup' ? tempLocation : null}
                                        dropoff={selectingMode === 'dropoff' ? tempLocation : null}
                                        basecamp={mapBasecamp}
                                        className="h-full w-full"
                                        showRoute={false}
                                        selectionMode={selectingMode}
                                        onCenterChange={handleCenterChange}
                                        flyTo={flyToLocation}
                                    />
                                </div>
                            )}


                        </div>

                        {/* Footer Card */}
                        <div className="bg-white dark:bg-gray-900 px-5 pt-12 -mt-6 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-[10000] border-t border-gray-100 relative shrink-0" style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 0.5rem))' }}>
                            {/* Drag Handle */}
                            <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />

                            <div className="flex items-center gap-3 mb-6">
                                <div className={cn(
                                    "w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                    selectingMode === 'pickup' ? "bg-teal-500 text-white" : "bg-orange-500 text-white"
                                )}>
                                    <MapPin size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 mb-0.5">
                                        {selectingMode === 'pickup' ? 'Lokasi Jemput' : 'Lokasi Tujuan'}
                                    </p>
                                    <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate flex items-center gap-1.5">
                                        {tempLocation?.label?.split(',')[0] || 'Geser peta...'}
                                        {isGeocoding && <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse shrink-0" />}
                                    </p>
                                    {tempLocation?.label && tempLocation.label.includes(',') && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug truncate mt-0.5">
                                            {tempLocation.label.split(',').slice(1).join(',').trim()}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Button
                                onClick={confirmSelection}
                                className={cn(
                                    "w-full h-14 rounded-2xl font-bold text-base shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all",
                                    selectingMode === 'pickup'
                                        ? "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20"
                                        : "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20"
                                )}
                            >
                                <Check className="mr-2" size={20} strokeWidth={3} />
                                Pilih Lokasi Ini
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
