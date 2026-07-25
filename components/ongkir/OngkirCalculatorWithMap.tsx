"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUpDown, Zap, MessageCircle, Calculator, Clock, Route, Info, Loader2, Map as MapIcon, Share2, Copy, Check, MapPin, ChevronRight, Navigation, ChevronDown, ChevronUp, ArrowLeft, Crosshair, Bike, Car, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { MapPicker } from "./MapPickerWrapper"
import { GoogleMapsLinkInput } from "./GoogleMapsLinkInput"
import { calculateOngkir, formatRupiah, generateWhatsAppLink, BASECAMP, haversineDistance } from "@/lib/pricing"
import "@/styles/leaflet-custom.css"
import { cn } from "@/lib/utils"
import type { RouteMode } from "@/lib/routing"

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
    routeMode: RouteMode
    fallbackNote: string | null
}

interface OngkirCalculatorWithMapProps {
    className?: string
    compact?: boolean
}

export function OngkirCalculatorWithMap({ className = "", compact = false }: OngkirCalculatorWithMapProps) {

    const [pickup, setPickup] = useState<Location | null>(null)
    const [dropoff, setDropoff] = useState<Location | null>(null)
    const [isExpress, setIsExpress] = useState(false)
    const [routeMode, setRouteMode] = useState<RouteMode>("kampung")
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
    const [showLinkInput, setShowLinkInput] = useState<"pickup" | "dropoff" | null>(null)
    const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const calculationRequestRef = useRef(0)

    // A fixed modal can still let the page behind it move on mobile Safari.
    // Lock the document while the Leaflet map continues to receive its drags.
    useEffect(() => {
        if (!selectingMode || typeof window === "undefined") return

        const scrollY = window.scrollY
        const { body, documentElement } = document
        const previousBodyStyle = {
            overflow: body.style.overflow,
            position: body.style.position,
            top: body.style.top,
            width: body.style.width,
            touchAction: body.style.touchAction,
        }
        const previousDocumentOverflow = documentElement.style.overflow

        body.style.overflow = "hidden"
        body.style.position = "fixed"
        body.style.top = `-${scrollY}px`
        body.style.width = "100%"
        body.style.touchAction = "none"
        documentElement.style.overflow = "hidden"

        return () => {
            body.style.overflow = previousBodyStyle.overflow
            body.style.position = previousBodyStyle.position
            body.style.top = previousBodyStyle.top
            body.style.width = previousBodyStyle.width
            body.style.touchAction = previousBodyStyle.touchAction
            documentElement.style.overflow = previousDocumentOverflow
            window.scrollTo(0, scrollY)
        }
    }, [selectingMode])

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
        const sharedRouteMode = params.get("route_mode")

        if (sharedRouteMode === "car") setRouteMode("car")

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

        const requestId = ++calculationRequestRef.current
        setStatus("loading")

        try {
            // Calculate D1: Basecamp → Pickup
            const d1Response = await fetch("/api/route-distance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    from: { lat: BASECAMP.lat, lng: BASECAMP.lng },
                    to: { lat: pickup.lat, lng: pickup.lng },
                    routeMode
                })
            })
            if (!d1Response.ok) throw new Error("Failed to calculate pickup route")
            const d1Data = await d1Response.json()
            const d1Km = d1Data.distance_m / 1000

            // Calculate D2: Pickup → Dropoff
            const d2Response = await fetch("/api/route-distance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    from: { lat: pickup.lat, lng: pickup.lng },
                    to: { lat: dropoff.lat, lng: dropoff.lng },
                    routeMode
                })
            })
            if (!d2Response.ok) throw new Error("Failed to calculate delivery route")
            const d2Data = await d2Response.json()
            if (!Number.isFinite(d1Data.distance_m) || !Number.isFinite(d2Data.distance_m) || !Number.isFinite(d1Data.duration_s) || !Number.isFinite(d2Data.duration_s)) {
                throw new Error("Route response was incomplete")
            }
            if (requestId !== calculationRequestRef.current) return
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
                totalDurationMinutes: d1DurationMinutes + d2DurationMinutes,
                routeMode,
                fallbackNote: d1Data.fallback || d2Data.fallback
                    ? (d1Data.source === "haversine" || d2Data.source === "haversine"
                        ? "Estimasi jarak sementara digunakan karena rute jalan tidak tersedia."
                        : "Sebagian jalur kampung tidak tersedia, sehingga estimasi memakai rute mobil.")
                    : null
            })
            setStatus("ready")

        } catch (error) {
            if (requestId !== calculationRequestRef.current) return
            console.error("Route calculation error")

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
                totalDurationMinutes: d1DurationMinutes + d2DurationMinutes,
                routeMode,
                fallbackNote: "Estimasi jarak sementara digunakan karena rute jalan tidak tersedia."
            })
            setStatus("ready")
        }
    }, [pickup, dropoff, isExpress, routeMode])

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
        params.set("route_mode", routeMode)
        if (isExpress) params.set("express", "true")
        return `${baseUrl}?${params.toString()}`
    }, [pickup, dropoff, isExpress, routeMode])

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

    // Handle Center Change in Selection Mode
    const handleCenterChange = (lat: number, lng: number) => {
        if (!selectingMode) return

        const shortCoord = `${lat.toFixed(5)}, ${lng.toFixed(5)}`

        setTempLocation({
            id: 'temp',
            lat,
            lng,
            label: `Titik (${shortCoord})`
        })
        setIsGeocoding(true)

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
        if (typeof window !== "undefined") {
            window.history.pushState({ modal: 'map' }, '', window.location.href)
        }

        const currentLoc = mode === "pickup" ? pickup : dropoff

        if (currentLoc) {
            setTempLocation(currentLoc)
        } else {
            const otherLoc = mode === "pickup" ? dropoff : pickup
            setTempLocation(otherLoc || { ...BASECAMP, id: 'basecamp' })
        }
    }

    // Handle Back Button (Popstate)
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            setSelectingMode(null)
        }

        window.addEventListener('popstate', handlePopState)
        return () => window.removeEventListener('popstate', handlePopState)
    }, [])

    const confirmSelection = () => {
        if (!selectingMode || !tempLocation) return

        if (selectingMode === "pickup") {
            setPickup({ ...tempLocation, id: `picked-pickup-${Date.now()}` })
        } else {
            setDropoff({ ...tempLocation, id: `picked-dropoff-${Date.now()}` })
        }
        setTempLocation(null)
        // Return to the form after every confirmation. The admin can then
        // choose the destination via map or Paste link, without being forced
        // into a second map selection.
        closeSelectionMode()
    }

    // GPS Handler for Map Modal
    const handleGPS = useCallback(() => {
        if (!navigator.geolocation) {
            alert("Geolocation tidak didukung browser ini.")
            return
        }

        setIsGeocoding(true)

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                setFlyToLocation({ lat: latitude, lng: longitude })
                setIsGeocoding(false)
            },
            (error) => {
                console.error("Error getting location:", error)
                setIsGeocoding(false)
                alert("Gagal mendapatkan lokasi. Pastikan GPS aktif.")
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
    }, [])

    const closeSelectionMode = useCallback(() => {
        if (window.history.state?.modal === 'map') {
            window.history.back()
        } else {
            setSelectingMode(null)
        }
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white/90 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-gray-200/60 dark:shadow-black/70 border border-gray-200/80 dark:border-gray-800 relative overflow-hidden transition-all duration-500 ${className}`}
        >
            <div className={cn("grid gap-0 relative", !compact && "lg:grid-cols-2")}>

                {/* Desktop / Overview Map View */}
                <div className={cn(
                    "h-[380px] sm:h-[450px] bg-slate-100 dark:bg-gray-950 relative transition-all duration-300 ease-in-out border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800",
                    !compact && "lg:block lg:h-auto lg:min-h-[600px]",
                    showMap && !selectingMode ? "block" : "hidden"
                )}>
                    <div className="absolute inset-0">
                        <MapPicker
                            pickup={pickup ? { lat: pickup.lat, lng: pickup.lng, label: pickup.label } : null}
                            dropoff={dropoff ? { lat: dropoff.lat, lng: dropoff.lng, label: dropoff.label } : null}
                            basecamp={mapBasecamp}
                            onPickupChange={handleMapPickupChange}
                            onDropoffChange={handleMapDropoffChange}
                            className="h-full w-full"
                            showRoute={true}
                            routeMode={routeMode}
                        />
                    </div>
                    {/* Close Map Button (Mobile only) */}
                    <div className={cn("absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]", !compact && "lg:hidden")}>
                        <Button
                            onClick={() => setShowMap(false)}
                            className="rounded-full shadow-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 border-none px-6 py-3 font-bold text-xs sm:text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <X size={16} /> Tutup Peta
                        </Button>
                    </div>
                </div>

                {/* Form Section */}
                <div className="p-5 sm:p-8 lg:p-10 flex flex-col h-full bg-transparent relative z-10">

                    {/* Header with Mobile Map Toggle */}
                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                        <div>
                            <h3 className="font-extrabold text-xl sm:text-2xl text-gray-900 dark:text-white tracking-tight">Rute Pengiriman</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Isi detail penjemputan & tujuan</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowMap(!showMap)}
                            className={cn(
                                "rounded-full font-bold text-xs transition-all active:scale-95 px-3.5 py-2 border shadow-xs flex items-center gap-1.5",
                                !compact && "lg:hidden",
                                showMap
                                    ? "bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border-teal-300 dark:border-teal-700"
                                    : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                            )}
                        >
                            <MapIcon size={15} />
                            <span>{showMap ? "Sembunyikan Peta" : "Lihat Peta"}</span>
                        </Button>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4 relative">

                        {/* Pickup Location */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5 ml-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-teal-500 ring-4 ring-teal-500/20"></div>
                                    Lokasi Jemput
                                </label>
                            </div>
                            <div className="rounded-2xl border border-teal-200/80 bg-teal-50/70 p-3.5 dark:border-teal-900/60 dark:bg-teal-950/30">
                                {pickup ? (
                                    <div className="flex items-start gap-2.5">
                                        <MapPin size={18} className="mt-0.5 shrink-0 text-teal-600 dark:text-teal-400" />
                                        <p className="min-w-0 flex-1 text-xs sm:text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">{pickup.label}</p>
                                        <button
                                            type="button"
                                            onClick={() => setPickup(null)}
                                            className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold text-teal-700 hover:bg-teal-100 dark:text-teal-300 dark:hover:bg-teal-900/60 transition-colors"
                                        >
                                            Ubah
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Belum ada titik jemput dipilih.</p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                <Button
                                    type="button"
                                    onClick={() => openSelectionMode("pickup")}
                                    className="h-11 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                                >
                                    <MapPin size={16} /> Pilih peta
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowLinkInput(showLinkInput === "pickup" ? null : "pickup")}
                                    className="h-11 rounded-xl border border-teal-300 dark:border-teal-700/80 bg-white dark:bg-gray-800 text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/40 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                                >
                                    <Copy size={15} /> Tempel link
                                </Button>
                            </div>
                            <div>
                                {showLinkInput === "pickup" ? (
                                    <div className="space-y-2 rounded-2xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-gray-900 p-3 shadow-md">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Tempel link Google Maps</span>
                                            <button type="button" onClick={() => setShowLinkInput(null)} className="rounded px-1.5 py-0.5 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                                                Tutup
                                            </button>
                                        </div>
                                        <GoogleMapsLinkInput
                                            type="pickup"
                                            onLocationFound={(loc) => {
                                                setPickup({ ...loc, id: `link-pickup-${Date.now()}` })
                                                setShowLinkInput(null)
                                            }}
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Swap Button (Floating) */}
                        <div className="relative h-4 z-10 flex justify-end pr-4 md:pr-0 md:justify-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSwap}
                                disabled={!pickup && !dropoff}
                                className="h-9 w-9 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-gray-700 transition-all shadow-md active:scale-95 flex items-center justify-center -mt-2.5"
                                title="Tukar Lokasi"
                            >
                                <ArrowUpDown size={15} />
                            </Button>
                        </div>

                        {/* Dropoff Location */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5 ml-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-4 ring-orange-500/20"></div>
                                    Tujuan Antar
                                </label>
                            </div>
                            <div className="rounded-2xl border border-orange-200/80 bg-orange-50/70 p-3.5 dark:border-orange-900/60 dark:bg-orange-950/30">
                                {dropoff ? (
                                    <div className="flex items-start gap-2.5">
                                        <Navigation size={18} className="mt-0.5 shrink-0 text-orange-600 dark:text-orange-400" />
                                        <p className="min-w-0 flex-1 text-xs sm:text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">{dropoff.label}</p>
                                        <button
                                            type="button"
                                            onClick={() => setDropoff(null)}
                                            className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold text-orange-700 hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-900/60 transition-colors"
                                        >
                                            Ubah
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Belum ada titik tujuan dipilih.</p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                <Button
                                    type="button"
                                    onClick={() => openSelectionMode("dropoff")}
                                    className="h-11 rounded-xl bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                                >
                                    <Navigation size={16} /> Pilih peta
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowLinkInput(showLinkInput === "dropoff" ? null : "dropoff")}
                                    className="h-11 rounded-xl border border-orange-300 dark:border-orange-700/80 bg-white dark:bg-gray-800 text-xs font-bold text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/40 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                                >
                                    <Copy size={15} /> Tempel link
                                </Button>
                            </div>
                            <div>
                                {showLinkInput === "dropoff" ? (
                                    <div className="space-y-2 rounded-2xl border border-orange-200 dark:border-orange-800 bg-white dark:bg-gray-900 p-3 shadow-md">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Tempel link Google Maps</span>
                                            <button type="button" onClick={() => setShowLinkInput(null)} className="rounded px-1.5 py-0.5 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                                                Tutup
                                            </button>
                                        </div>
                                        <GoogleMapsLinkInput
                                            type="dropoff"
                                            onLocationFound={(loc) => {
                                                setDropoff({ ...loc, id: `link-dropoff-${Date.now()}` })
                                                setShowLinkInput(null)
                                            }}
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {/* Route Selection */}
                    <div className="mt-6 rounded-2xl border border-teal-200/80 bg-teal-50/70 p-3.5 dark:border-teal-900/60 dark:bg-teal-950/30">
                        <p className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-teal-900 dark:text-teal-300">Pilihan Rute Perjalanan</p>
                        <div role="radiogroup" aria-label="Pilihan rute" className="grid grid-cols-2 gap-2.5">
                            <button
                                type="button"
                                role="radio"
                                aria-checked={routeMode === "kampung"}
                                onClick={() => setRouteMode("kampung")}
                                className={cn(
                                    "flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs sm:text-sm font-bold transition-all active:scale-95",
                                    routeMode === "kampung"
                                        ? "border-teal-600 bg-teal-600 text-white shadow-md dark:bg-teal-600 dark:text-white"
                                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-teal-300 dark:hover:border-teal-700"
                                )}
                            >
                                <Bike size={18} /> Jalur kampung
                            </button>
                            <button
                                type="button"
                                role="radio"
                                aria-checked={routeMode === "car"}
                                onClick={() => setRouteMode("car")}
                                className={cn(
                                    "flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs sm:text-sm font-bold transition-all active:scale-95",
                                    routeMode === "car"
                                        ? "border-gray-900 bg-gray-900 text-white shadow-md dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
                                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-gray-400 dark:hover:border-gray-600"
                                )}
                            >
                                <Car size={18} /> Jalan mobil
                            </button>
                        </div>
                        <p className="mt-2 px-1 text-[11px] leading-relaxed text-teal-800/90 dark:text-teal-200/90">
                            Jalur kampung adalah estimasi rute lokal; cek kondisi dan keamanan di lapangan.
                        </p>
                    </div>

                    {/* Express Toggle */}
                    <div
                        className="group mt-6 flex items-center justify-between p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl hover:border-amber-300 dark:hover:border-amber-800 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition-all cursor-pointer shadow-xs"
                        onClick={() => setIsExpress(!isExpress)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 rounded-xl group-hover:scale-110 transition-transform">
                                <Zap size={20} className="fill-current" />
                            </div>
                            <div>
                                <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                                    Express Priority
                                    {isExpress && <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-extrabold">ON</span>}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Pengiriman prioritas (+Rp2.000)</p>
                            </div>
                        </div>
                        <Switch
                            checked={isExpress}
                            onCheckedChange={setIsExpress}
                            className="data-[state=checked]:bg-amber-500 ml-2"
                        />
                    </div>

                    {/* Result Area */}
                    <div className="mt-6 flex-1">
                        <AnimatePresence mode="wait">
                            {status === "idle" && (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-300 dark:border-gray-700/70 rounded-3xl bg-gray-50/60 dark:bg-gray-900/40 backdrop-blur-xs"
                                >
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-sm mb-3 ring-1 ring-gray-200 dark:ring-gray-700">
                                        <MapIcon size={32} className="text-gray-400 dark:text-gray-400" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1 text-base">Mulai Hitung Ongkir</h4>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-[240px]">Masukkan lokasi jemput dan tujuan untuk melihat estimasi harga.</p>
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
                                    <p className="text-gray-600 dark:text-gray-300 font-semibold animate-pulse text-sm">Menghitung {routeMode === "kampung" ? "jalur kampung" : "rute mobil"}...</p>
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
                                    <div className="bg-gray-900 dark:bg-black rounded-[2rem] p-6 text-white relative overflow-hidden group border border-gray-800 shadow-2xl">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500 rounded-full blur-[60px] opacity-25 group-hover:opacity-40 transition-opacity" />
                                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500 rounded-full blur-[60px] opacity-25 group-hover:opacity-40 transition-opacity" />

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="text-gray-400 text-xs sm:text-sm font-semibold mb-1">Total Estimasi Biasa</p>
                                                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                                                        {formatRupiah(result.total)}
                                                    </h2>
                                                </div>
                                                <div className="bg-white/15 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                                    <span className="text-xs font-bold text-teal-300">
                                                        {(result.d1Km + result.d2Km).toFixed(1)} KM
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="h-px bg-white/15 my-4" />

                                            <div className="flex flex-wrap gap-4 sm:gap-6">
                                                <div className="flex items-center gap-2 text-gray-200 text-xs sm:text-sm font-medium">
                                                    <Clock size={16} className="text-teal-400" />
                                                    <span>±{result.totalDurationMinutes} menit</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-200 text-xs sm:text-sm font-medium">
                                                    <Route size={16} className="text-teal-400" />
                                                    <span>{result.routeMode === "kampung" ? "Jalur kampung" : "Rute mobil"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {result.fallbackNote && (
                                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 font-medium">
                                            {result.fallbackNote}
                                        </div>
                                    )}

                                    {/* Timeline Details */}
                                    <div className="bg-gray-100/80 dark:bg-gray-800/60 rounded-3xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700">
                                        <h4 className="font-extrabold text-gray-900 dark:text-white mb-4 text-xs sm:text-sm uppercase tracking-wider">Rincian Perjalanan</h4>
                                        <div className="space-y-6 relative">
                                            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-300 dark:bg-gray-600" />

                                            {/* Item 1: Jemput */}
                                            <div className="relative flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border-4 border-teal-200 dark:border-teal-900 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 z-10 shadow-sm">
                                                    <Navigation size={16} className="fill-current" />
                                                </div>
                                                <div className="flex-1 pt-0.5">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">Penjemputan</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{result.d1DurationMinutes} menit • {result.d1Km.toFixed(1)} km</p>
                                                        </div>
                                                        <span className="font-extrabold text-gray-900 dark:text-white text-xs sm:text-sm">{formatRupiah(result.d1Fee)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Item 2: Antar */}
                                            <div className="relative flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border-4 border-orange-200 dark:border-orange-900 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 z-10 shadow-sm">
                                                    <MapPin size={16} className="fill-current" />
                                                </div>
                                                <div className="flex-1 pt-0.5">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">Pengantaran</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{result.d2DurationMinutes} menit • {result.d2Km.toFixed(1)} km</p>
                                                        </div>
                                                        <span className="font-extrabold text-gray-900 dark:text-white text-xs sm:text-sm">{formatRupiah(result.d2Fee)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {isExpress && (
                                                <div className="relative flex gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0 z-10 shadow-sm ring-4 ring-white dark:ring-gray-800">
                                                        <Zap size={16} className="fill-current" />
                                                    </div>
                                                    <div className="flex-1 pt-1.5">
                                                        <div className="flex justify-between items-center">
                                                            <p className="font-bold text-amber-800 dark:text-amber-300 text-xs sm:text-sm">Biaya Priority</p>
                                                            <span className="font-extrabold text-amber-800 dark:text-amber-300 text-xs sm:text-sm">+{formatRupiah(result.expressFee)}</span>
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
                                            className="col-span-2 h-14 bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-2xl font-extrabold text-base transition-all shadow-lg shadow-teal-600/30 active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            <MessageCircle className="mr-1" size={20} />
                                            Pesan Sekarang
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={copyToClipboard}
                                            className="h-12 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/40 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
                                        >
                                            {isCopied ? <Check size={18} className="mr-1 text-green-500" /> : <Copy size={18} className="mr-1" />}
                                            {isCopied ? "Tersalin" : "Salin Link"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-12 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/40 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
                                            onClick={() => {
                                                const url = generateShareableUrl()
                                                const text = `Cek ongkir ini: ${url}`
                                                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
                                            }}
                                        >
                                            <Share2 size={18} className="mr-1" />
                                            Share
                                        </Button>
                                    </div>

                                    {/* Note Input */}
                                    <div className="pt-2">
                                        <Accordion type="single" collapsible className="w-full">
                                            <AccordionItem value="notes" className="border-none">
                                                <AccordionTrigger className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white py-2 justify-start gap-2">
                                                    <span className="flex items-center gap-2">
                                                        <Info size={15} /> Tambah Catatan & Info
                                                    </span>
                                                </AccordionTrigger>
                                                <AccordionContent className="pt-2">
                                                    <textarea
                                                        value={notes}
                                                        onChange={(e) => setNotes(e.target.value)}
                                                        placeholder="Contoh: Barang pecah belah, Masuk gang mawar..."
                                                        className="w-full p-3.5 border border-gray-300 dark:border-gray-700 rounded-2xl text-xs sm:text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                                        rows={3}
                                                    />

                                                    <div className="mt-3 p-3.5 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs space-y-1.5 font-medium">
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
                                    className="p-4 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-900/60 text-center rounded-2xl text-xs sm:text-sm font-semibold"
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
                        className="fixed inset-0 z-[9999] bg-slate-100 dark:bg-gray-950 flex flex-col overflow-hidden overscroll-none"
                    >
                        {/* Header Bar */}
                        <div className="absolute top-0 inset-x-0 z-[10000] pointer-events-none" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
                            <div className="px-4 pb-4">
                                <div className="flex items-center gap-3 pointer-events-auto rounded-2xl border border-gray-200/90 dark:border-gray-700/90 bg-white/95 dark:bg-gray-900/95 p-2.5 shadow-xl backdrop-blur-md">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={closeSelectionMode}
                                        className="h-10 w-10 shrink-0 rounded-xl text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center"
                                        aria-label="Tutup pilihan peta"
                                    >
                                        <ArrowLeft size={20} strokeWidth={2.5} />
                                    </Button>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">Pilih titik {selectingMode === "pickup" ? "jemput" : "tujuan"}</p>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">Geser peta, lalu tekan tombol konfirmasi.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Map */}
                        <div className="flex-1 relative bg-slate-100 dark:bg-gray-950 min-h-0">
                            {tempLocation && (
                                <div className="absolute inset-0 touch-none overscroll-none">
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

                            {/* Floating GPS Button */}
                            <div className="absolute bottom-28 right-4 z-[5000]">
                                <Button
                                    size="icon"
                                    onClick={handleGPS}
                                    className="rounded-full bg-white dark:bg-gray-800 h-12 w-12 shadow-2xl text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 active:scale-95 transition-all hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center"
                                >
                                    {isGeocoding ? (
                                        <Loader2 size={20} className="animate-spin text-teal-600 dark:text-teal-400" />
                                    ) : (
                                        <Crosshair size={22} />
                                    )}
                                </Button>
                            </div>

                            {/* Center Marker Hint Overlay */}
                            <div className="absolute top-[100px] left-1/2 -translate-x-1/2 pointer-events-none z-[4000] w-full flex justify-center px-4">
                                <div className="bg-black/75 dark:bg-white/90 backdrop-blur-md text-white dark:text-gray-900 px-4 py-2 rounded-full text-xs font-bold shadow-xl animate-in fade-in slide-in-from-top-2 duration-500 border border-white/20 dark:border-gray-300/30">
                                    Geser peta untuk memilih titik
                                </div>
                            </div>
                        </div>

                        {/* Fixed Bottom Dock */}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[12000] px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                            <div className="pointer-events-auto rounded-3xl border border-gray-200/90 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 p-3.5 sm:p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.3)] backdrop-blur-xl">
                                <div className="mb-2.5 flex items-center gap-3 px-1">
                                    <div className={cn(
                                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm",
                                        selectingMode === 'pickup' ? "bg-teal-500" : "bg-orange-500"
                                    )}>
                                        <MapPin size={18} className="fill-current" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Titik di tengah peta</p>
                                        <p className="truncate text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">
                                            {tempLocation?.label || "Memuat lokasi..."}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={confirmSelection}
                                    className={cn(
                                        "min-h-14 sm:min-h-16 w-full touch-manipulation rounded-2xl text-sm sm:text-base font-extrabold shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2",
                                        selectingMode === 'pickup'
                                            ? "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/30"
                                            : "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/30"
                                    )}
                                >
                                    <Check size={22} strokeWidth={3} />
                                    {selectingMode === "pickup" ? "Pilih titik jemput ini" : "Pilih tujuan ini"}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default OngkirCalculatorWithMap
