"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUpDown, Zap, MessageCircle, Calculator, Clock, Route, Info, Loader2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { LocationCombobox, Location } from "./LocationCombobox"
import { calculateOngkir, formatRupiah, generateWhatsAppLink, BASECAMP, haversineDistance } from "@/lib/pricing"
import locationsData from "@/data/sumobito-locations.json"

type Status = "idle" | "partial" | "loading" | "ready" | "error"

interface CalculationResult {
    d1Fee: number
    d2Fee: number
    expressFee: number
    subtotal: number
    total: number
    d1Km: number
    d2Km: number
    durationMinutes: number
}

interface OngkirCalculatorV2Props {
    compact?: boolean
    className?: string
}

export function OngkirCalculatorV2({ compact = false, className = "" }: OngkirCalculatorV2Props) {
    const locations: Location[] = locationsData as Location[]

    const [pickup, setPickup] = useState<Location | null>(null)
    const [dropoff, setDropoff] = useState<Location | null>(null)
    const [isExpress, setIsExpress] = useState(false)
    const [status, setStatus] = useState<Status>("idle")
    const [result, setResult] = useState<CalculationResult | null>(null)
    const [notes, setNotes] = useState("")

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

            setResult({
                ...pricing,
                d1Km,
                d2Km,
                durationMinutes: Math.round((d1Data.duration_s + d2Data.duration_s) / 60)
            })
            setStatus("ready")

        } catch (error) {
            console.error("Route calculation error:", error)

            // Fallback to Haversine
            const d1Km = haversineDistance(BASECAMP.lat, BASECAMP.lng, pickup.lat, pickup.lng)
            const d2Km = haversineDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng)
            const pricing = calculateOngkir(d1Km, d2Km, isExpress)

            setResult({
                ...pricing,
                d1Km,
                d2Km,
                durationMinutes: Math.round((d1Km + d2Km) * 2) // rough estimate
            })
            setStatus("ready")
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-100 relative overflow-hidden ${className}`}
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-teal-100/50 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-orange-100/50 to-transparent rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl text-white shadow-lg shadow-teal-500/30">
                        <Calculator size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-gray-900">Kalkulator Ongkir</h3>
                        <p className="text-sm text-gray-500">Cek estimasi biaya pengiriman</p>
                    </div>
                </div>

                {/* Location Inputs */}
                <div className="space-y-3 mb-4">
                    <LocationCombobox
                        locations={locations}
                        value={pickup}
                        onChange={setPickup}
                        label="Jemput di"
                        placeholder="Pilih lokasi jemput..."
                        icon="pickup"
                    />

                    {/* Swap Button */}
                    <div className="flex justify-center -my-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSwap}
                            disabled={!pickup && !dropoff}
                            className="rounded-full h-10 w-10 p-0 border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-all group"
                        >
                            <ArrowUpDown size={16} className="text-gray-400 group-hover:text-teal-600 transition-colors" />
                        </Button>
                    </div>

                    <LocationCombobox
                        locations={locations}
                        value={dropoff}
                        onChange={setDropoff}
                        label="Antar ke"
                        placeholder="Pilih lokasi antar..."
                        icon="dropoff"
                    />
                </div>

                {/* Express Toggle */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl mb-6">
                    <div className="flex items-center gap-2">
                        <Zap size={18} className="text-amber-500" />
                        <div>
                            <p className="font-medium text-gray-900">Express (Prioritas)</p>
                            <p className="text-xs text-gray-500">+Rp2.000 • Prioritas jika driver tersedia</p>
                        </div>
                    </div>
                    <Switch
                        checked={isExpress}
                        onCheckedChange={setIsExpress}
                        className="data-[state=checked]:bg-amber-500"
                    />
                </div>

                {/* Result / Empty States */}
                <AnimatePresence mode="wait">
                    {status === "idle" && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center text-gray-400"
                        >
                            <Calculator size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Pilih lokasi jemput & antar untuk melihat estimasi</p>
                        </motion.div>
                    )}

                    {status === "partial" && (
                        <motion.div
                            key="partial"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-teal-50 border border-teal-100 rounded-2xl p-6 text-center"
                        >
                            <p className="text-sm text-teal-700">
                                {pickup ? "Pilih lokasi antar untuk lanjut" : "Pilih lokasi jemput untuk mulai"}
                            </p>
                        </motion.div>
                    )}

                    {status === "loading" && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center"
                        >
                            <Loader2 size={32} className="mx-auto mb-2 animate-spin text-teal-500" />
                            <p className="text-sm text-gray-600">Menghitung rute jalan...</p>
                        </motion.div>
                    )}

                    {status === "error" && pickup?.id === dropoff?.id && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center"
                        >
                            <p className="text-sm text-red-600">Lokasi jemput dan antar tidak boleh sama</p>
                        </motion.div>
                    )}

                    {status === "ready" && result && (
                        <motion.div
                            key="ready"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {/* Total */}
                            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-6 text-white text-center">
                                <p className="text-sm font-medium text-white/80 mb-1">Estimasi Total Ongkir</p>
                                <p className="text-4xl font-black">{formatRupiah(result.total)}</p>
                            </div>

                            {/* Breakdown */}
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Jemput ({result.d1Km.toFixed(1)} km)</span>
                                    <span className="font-medium">{formatRupiah(result.d1Fee)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Antar ({result.d2Km.toFixed(1)} km)</span>
                                    <span className="font-medium">{formatRupiah(result.d2Fee)}</span>
                                </div>
                                {isExpress && (
                                    <div className="flex justify-between text-sm text-amber-600">
                                        <span className="flex items-center gap-1">
                                            <Zap size={14} /> Express
                                        </span>
                                        <span className="font-medium">+{formatRupiah(result.expressFee)}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold">
                                    <span>Total</span>
                                    <span className="text-teal-600">{formatRupiah(result.total)}</span>
                                </div>
                            </div>

                            {/* Distance & Time Info */}
                            <div className="flex gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Route size={14} />
                                    <span>±{(result.d1Km + result.d2Km).toFixed(1)} km</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock size={14} />
                                    <span>±{result.durationMinutes} menit</span>
                                </div>
                            </div>

                            {/* Notes (optional) */}
                            {!compact && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Catatan (opsional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Barang yang dikirim, titip beli, dll..."
                                        className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                        rows={2}
                                    />
                                </div>
                            )}

                            {/* Info Accordion */}
                            {!compact && (
                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="info" className="border-none">
                                        <AccordionTrigger className="text-sm text-gray-500 hover:text-gray-700 py-2">
                                            <span className="flex items-center gap-1">
                                                <Info size={14} /> Info tambahan
                                            </span>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-xs text-gray-500 space-y-1">
                                            <p>• Harga dapat berubah tergantung kondisi jalan</p>
                                            <p>• Belanja besar / antre lama → admin konfirmasi DP &/atau waiting fee</p>
                                            <p>• Titip Beli Gratis: ≤Rp100k, 1 toko, antre ≤10 menit</p>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            )}

                            {/* WhatsApp CTA */}
                            <Button
                                onClick={() => window.open(waLink, "_blank")}
                                className="w-full h-14 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-teal-500/30"
                            >
                                <MessageCircle size={20} className="mr-2" />
                                Pesan via WhatsApp
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Quick Info Badge */}
                <div className="flex flex-wrap gap-2 justify-center text-xs text-gray-500 mt-6">
                    <span className="bg-gray-100 px-3 py-1.5 rounded-full">💰 Mulai Rp3.000</span>
                    <span className="bg-gray-100 px-3 py-1.5 rounded-full">⚡ Express +Rp2.000</span>
                    <span className="bg-gray-100 px-3 py-1.5 rounded-full">🏘️ Kurir Lokal</span>
                </div>
            </div>
        </motion.div>
    )
}
