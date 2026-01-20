"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUpDown, Zap, MessageCircle, Calculator, Clock, Route, Info, Loader2, Map as MapIcon, Share2, Copy, Check, MapPin, ChevronRight, Navigation, ChevronDown, ChevronUp } from "lucide-react"
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
    const [showMap, setShowMap] = useState(false) // Default hidden on mobile
    const [isCopied, setIsCopied] = useState(false)

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
            setShowMap(false) // Auto switch to form on result ready (mobile)

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
            setShowMap(false)
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
    const mapPickup = pickup ? { lat: pickup.lat, lng: pickup.lng, label: pickup.label } : null
    const mapDropoff = dropoff ? { lat: dropoff.lat, lng: dropoff.lng, label: dropoff.label } : null
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
        // Short coordinate format for display
        const shortCoord = `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`

        // Immediate update with coordinates (so form is never empty)
        setPickup({
            id: `custom-pickup-${Date.now()}`,
            label: `Titik Peta (${shortCoord})`,
            lat: loc.lat,
            lng: loc.lng
        })

        // Async fetch address to improve label
        const address = await reverseGeocode(loc.lat, loc.lng)
        if (address) {
            // Show address + coordinates: "Kali Gunting (-7.5133, 112.3476)"
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

        // Immediate update with coordinates (so form is never empty)
        setDropoff({
            id: `custom-dropoff-${Date.now()}`,
            label: `Titik Peta (${shortCoord})`,
            lat: loc.lat,
            lng: loc.lng
        })

        // Async fetch address to improve label
        const address = await reverseGeocode(loc.lat, loc.lng)
        if (address) {
            // Show address + coordinates
            setDropoff({
                id: `custom-dropoff-${Date.now()}`,
                label: `${address} (${shortCoord})`,
                lat: loc.lat,
                lng: loc.lng
            })
        }
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white/80 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-gray-200/50 dark:shadow-black/50 border border-white/50 dark:border-white/10 relative overflow-hidden transition-all duration-500 ${className}`}
        >
            <div className={cn("grid gap-0 relative", !compact && "lg:grid-cols-2")}>
                {/* 
                  Map Section 
                  - Mobile: Toggleable overlay or separate view
                  - Desktop: Left column (unless compact)
                */}
                <div className={cn(
                    "h-[400px] bg-slate-50 relative transition-all duration-300 ease-in-out",
                    !compact && "lg:block lg:h-auto lg:min-h-[600px]",
                    showMap ? "block" : "hidden"
                )}>
                    <div className="absolute inset-0">
                        <MapPicker
                            pickup={mapPickup}
                            dropoff={mapDropoff}
                            basecamp={mapBasecamp}
                            onPickupChange={handleMapPickupChange}
                            onDropoffChange={handleMapDropoffChange}
                            className="h-full w-full"
                            showRoute={true}
                        />
                    </div>
                    {/* Close Map Button */}
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
                            {showMap ? "Sembunyikan Peta" : "Lihat Peta"}
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
                                {pickup?.id.startsWith("custom") && (
                                    <span className="text-[10px] bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full font-medium">
                                        Dari Peta
                                    </span>
                                )}
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
                                {dropoff?.id.startsWith("custom") && (
                                    <span className="text-[10px] bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">
                                        Dari Peta
                                    </span>
                                )}
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
        </motion.div>
    )
}
