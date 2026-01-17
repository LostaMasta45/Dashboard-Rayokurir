"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { MapPin, Calculator, ArrowRight, Zap, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// Tier-based locations (grouped by distance from Sumobito basecamp)
// Tier 0: Same village = Rp3.000
// Tier 1: Nearby (within ~3km) = Rp5.000  
// Tier 2: Medium (~3-6km) = Rp7.000
// Tier 3: Far (>6km / beda kecamatan) = Rp10.000

const LOCATION_TIERS: Record<string, number> = {
    // Tier 0 - Basecamp area
    "Sumobito": 0,

    // Tier 1 - Nearby villages
    "Jogoloyo": 1,
    "Kedung Papar": 1,
    "Gedang Sewu": 1,
    "Segodo Baru": 1,

    // Tier 2 - Medium distance
    "Peterongan": 2,
    "Plosokerep": 2,
    "Budug": 2,
    "Mentoro": 2,
    "Plumbon Gambang": 2,
    "Kendal Sewu": 2,
    "Podoroto": 2,
    "Janti": 2,
    "Badas": 2,
    "Tambak Rejo": 2,
    "Talun": 2,
    "Kesamben": 2,

    // Tier 3 - Far (different kecamatan)
    "Mojoagung": 3,
    "Jombang Kota": 3,
    "Diwek": 3,
    "Mojowarno": 3,
}

const LOCATIONS = Object.keys(LOCATION_TIERS)

const PRICE_MAP: Record<number, { price: number; label: string; color: string }> = {
    0: { price: 3000, label: "Jarak Dekat", color: "text-green-600" },
    1: { price: 5000, label: "Jarak Dekat", color: "text-green-600" },
    2: { price: 7000, label: "Jarak Sedang", color: "text-yellow-600" },
    3: { price: 10000, label: "Jarak Jauh", color: "text-orange-600" },
}

export function OngkirCalculator() {
    const [origin, setOrigin] = useState<string>("")
    const [destination, setDestination] = useState<string>("")

    const result = useMemo(() => {
        if (!origin || !destination) return null

        // Calculate tier based on the higher tier between origin and destination
        // (furthest point from basecamp determines price)
        const originTier = LOCATION_TIERS[origin] ?? 2
        const destTier = LOCATION_TIERS[destination] ?? 2
        const maxTier = Math.max(originTier, destTier)

        // Same location = minimum
        if (origin === destination) {
            return PRICE_MAP[0]
        }

        return PRICE_MAP[maxTier]
    }, [origin, destination])

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price)
    }

    const WA_LINK = `https://wa.me/6281234567890?text=ORDER%20RAYO%0ANama%3A%0ANo%20WA%3A%0AJenis%20layanan%20%3A%0APickup%3A%20${origin}%0ADropoff%3A%20${destination}%0AItem%3A`

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-100 relative overflow-hidden"
        >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-100/50 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-100/50 rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl text-white shadow-lg shadow-teal-500/30">
                        <Calculator size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-gray-900">Kalkulator Ongkir</h3>
                        <p className="text-sm text-gray-500">Cek estimasi biaya instan</p>
                    </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            <MapPin size={14} className="inline mr-1 text-teal-500" />
                            Jemput di
                        </label>
                        <Select value={origin} onValueChange={setOrigin}>
                            <SelectTrigger className="w-full h-12 rounded-xl border-gray-200 focus:ring-teal-500">
                                <SelectValue placeholder="Pilih lokasi jemput..." />
                            </SelectTrigger>
                            <SelectContent>
                                {LOCATIONS.map((loc) => (
                                    <SelectItem key={loc} value={loc}>
                                        {loc}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-center">
                        <div className="p-2 bg-gray-100 rounded-full">
                            <ArrowRight size={16} className="text-gray-400 rotate-90" />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            <MapPin size={14} className="inline mr-1 text-orange-500" />
                            Antar ke
                        </label>
                        <Select value={destination} onValueChange={setDestination}>
                            <SelectTrigger className="w-full h-12 rounded-xl border-gray-200 focus:ring-teal-500">
                                <SelectValue placeholder="Pilih lokasi antar..." />
                            </SelectTrigger>
                            <SelectContent>
                                {LOCATIONS.map((loc) => (
                                    <SelectItem key={loc} value={loc}>
                                        {loc}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Result */}
                {result !== null ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-5 mb-6"
                    >
                        <div className="text-center">
                            <p className={`text-sm font-medium mb-1 ${result.color}`}>{result.label}</p>
                            <p className="text-4xl font-black text-teal-600">
                                {formatPrice(result.price)}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                *Harga dapat berubah tergantung kondisi & add-on
                            </p>
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row gap-2">
                            <Button
                                onClick={() => window.open(WA_LINK)}
                                className="flex-1 h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold"
                            >
                                <MessageCircle size={18} className="mr-2" /> Order Sekarang
                            </Button>
                            <Button
                                variant="outline"
                                className="h-12 border-teal-200 text-teal-700 hover:bg-teal-50 rounded-xl"
                            >
                                <Zap size={16} className="mr-1" /> +Express
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center text-gray-400">
                        <Calculator size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Pilih lokasi untuk melihat estimasi</p>
                    </div>
                )}

                {/* Quick Info */}
                <div className="flex flex-wrap gap-2 justify-center text-xs text-gray-500">
                    <span className="bg-gray-100 px-3 py-1 rounded-full">💰 Mulai Rp3.000</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full">⚡ Express +Rp2.000</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full">🏘️ Kurir Lokal</span>
                </div>
            </div>
        </motion.div>
    )
}
