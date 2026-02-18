"use client"

import { useState, useRef } from "react"
import { Link2, Loader2, Check, X, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

// =========================================================================
// LOCATION PARSER — supports many formats customers send via WhatsApp/chat
// =========================================================================
//
// Supported formats:
//   1. Google Maps full links (standard, place, search, directions)
//   2. Shortened Google Maps links (maps.app.goo.gl/...) — resolved server-side
//   3. Raw coordinates: -7.520653, 112.343111
//   4. Apple Maps: https://maps.apple.com/?ll=lat,lng
//   5. Waze: https://waze.com/ul?ll=lat,lng
//   6. OpenStreetMap: https://www.openstreetmap.org/#map=zoom/lat/lng
//   7. Google Plus Codes: 6PH57VP3+FX (resolved via API)
//   8. WhatsApp forwarded loc text: "Lokasi: -7.520, 112.343"
//   9. HERE WeGo: https://share.here.com/l/lat,lng
//
// Priority: most accurate coordinate source first.

// --- Validate lat/lng ---
function isValidCoord(lat: number, lng: number): boolean {
    return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

// --- Parse raw coordinates like "-7.520653, 112.343111" ---
function parseRawCoordinates(text: string): { lat: number; lng: number } | null {
    const trimmed = text.trim()
    // Match: -7.520653, 112.343111 or -7.520653 112.343111
    const match = trimmed.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/)
    if (match) {
        const lat = parseFloat(match[1])
        const lng = parseFloat(match[2])
        if (isValidCoord(lat, lng)) return { lat, lng }
    }
    return null
}

// --- Parse Google Maps links (many variants) ---
function parseGoogleMapsLink(text: string): { lat: number; lng: number } | null {
    const trimmed = text.trim()
    if (!trimmed.match(/google|maps/i)) return null

    const patterns = [
        // !3d{lat}!4d{lng} — actual place/pin coordinates (most accurate)
        /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
        // ?q=lat,lng — shared location from WhatsApp
        /[?&]q=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/,
        // place/lat,lng — place coordinates in path
        /place\/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/,
        // /dir//lat,lng or /dir/lat,lng — directions endpoint
        /\/dir\/[^/]*\/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/,
        // @lat,lng — viewport center (fallback, least accurate)
        /@(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/,
    ]
    for (const pattern of patterns) {
        const match = trimmed.match(pattern)
        if (match) {
            const lat = parseFloat(match[1])
            const lng = parseFloat(match[2])
            if (isValidCoord(lat, lng)) return { lat, lng }
        }
    }
    return null
}

// --- Parse Apple Maps links ---
// Format: https://maps.apple.com/?ll=lat,lng or ?q=...&ll=lat,lng
function parseAppleMapsLink(text: string): { lat: number; lng: number } | null {
    const trimmed = text.trim()
    if (!trimmed.match(/maps\.apple\.com/i)) return null
    const match = trimmed.match(/[?&]ll=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/)
    if (match) {
        const lat = parseFloat(match[1])
        const lng = parseFloat(match[2])
        if (isValidCoord(lat, lng)) return { lat, lng }
    }
    return null
}

// --- Parse Waze links ---
// Format: https://waze.com/ul?ll=lat,lng or https://www.waze.com/ul?ll=lat,lng
function parseWazeLink(text: string): { lat: number; lng: number } | null {
    const trimmed = text.trim()
    if (!trimmed.match(/waze\.com/i)) return null
    const match = trimmed.match(/[?&]ll=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/)
    if (match) {
        const lat = parseFloat(match[1])
        const lng = parseFloat(match[2])
        if (isValidCoord(lat, lng)) return { lat, lng }
    }
    // Waze also has: /live/directions?to=ll.lat,lng
    const match2 = trimmed.match(/to=ll\.(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/)
    if (match2) {
        const lat = parseFloat(match2[1])
        const lng = parseFloat(match2[2])
        if (isValidCoord(lat, lng)) return { lat, lng }
    }
    return null
}

// --- Parse OpenStreetMap links ---
// Format: https://www.openstreetmap.org/#map=zoom/lat/lng
// Also:   https://www.openstreetmap.org/?mlat=lat&mlon=lng
function parseOSMLink(text: string): { lat: number; lng: number } | null {
    const trimmed = text.trim()
    if (!trimmed.match(/openstreetmap\.org/i)) return null
    // #map=zoom/lat/lng
    const match = trimmed.match(/#map=\d+\/(-?\d+\.?\d*)\/(-?\d+\.?\d*)/)
    if (match) {
        const lat = parseFloat(match[1])
        const lng = parseFloat(match[2])
        if (isValidCoord(lat, lng)) return { lat, lng }
    }
    // ?mlat=lat&mlon=lng
    const latMatch = trimmed.match(/[?&]mlat=(-?\d+\.?\d*)/)
    const lngMatch = trimmed.match(/[?&]mlon=(-?\d+\.?\d*)/)
    if (latMatch && lngMatch) {
        const lat = parseFloat(latMatch[1])
        const lng = parseFloat(lngMatch[1])
        if (isValidCoord(lat, lng)) return { lat, lng }
    }
    return null
}

// --- Parse HERE WeGo links ---
// Format: https://share.here.com/l/lat,lng
function parseHereLink(text: string): { lat: number; lng: number } | null {
    const trimmed = text.trim()
    if (!trimmed.match(/here\.com/i)) return null
    const match = trimmed.match(/\/l\/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/)
    if (match) {
        const lat = parseFloat(match[1])
        const lng = parseFloat(match[2])
        if (isValidCoord(lat, lng)) return { lat, lng }
    }
    return null
}

// --- Parse WhatsApp forwarded location text ---
// When people forward/copy location from WA, it sometimes comes as text like:
// "Lokasi: -7.520653, 112.343111" or "Location: -7.520653, 112.343111"
// or "📍 -7.520653, 112.343111"
function parseWhatsAppLocationText(text: string): { lat: number; lng: number } | null {
    const trimmed = text.trim()
    // Match patterns like: Lokasi: lat, lng | Location: lat, lng | 📍 lat, lng
    const match = trimmed.match(/(?:lokasi|location|📍)\s*:?\s*(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/i)
    if (match) {
        const lat = parseFloat(match[1])
        const lng = parseFloat(match[2])
        if (isValidCoord(lat, lng)) return { lat, lng }
    }
    return null
}

// --- Check for Google Plus Codes (Open Location Code) ---
// Format: 6PH57VP3+FX or XXXX+XX,CityName
function isPlusCode(text: string): boolean {
    const trimmed = text.trim()
    // Standard Plus Code: 4-8 chars + "+" + 2-3 chars (optionally followed by city)
    // Examples: "6PH57VP3+FX", "7VP3+FX Jombang", "https://plus.codes/..."
    if (trimmed.match(/^https?:\/\/plus\.codes\//i)) return true
    // Standalone plus code (with optional city name after space/comma)
    if (trimmed.match(/^[2-9CFGHJMPQRVWX]{4,8}\+[2-9CFGHJMPQRVWX]{2,3}(\s|,|$)/i)) return true
    return false
}

// Extract plus code from text
function extractPlusCode(text: string): string | null {
    const trimmed = text.trim()
    // From URL: https://plus.codes/6PH57VP3+FX
    const urlMatch = trimmed.match(/plus\.codes\/([2-9CFGHJMPQRVWX]{4,8}\+[2-9CFGHJMPQRVWX]{2,3})/i)
    if (urlMatch) return urlMatch[1]
    // Standalone: 6PH57VP3+FX or 7VP3+FX Jombang
    const codeMatch = trimmed.match(/^([2-9CFGHJMPQRVWX]{4,8}\+[2-9CFGHJMPQRVWX]{2,3})/i)
    if (codeMatch) return codeMatch[1]
    return null
}

// --- Master parser: try all formats ---
function parseLocation(text: string): { lat: number; lng: number } | null {
    const trimmed = text.trim()
    if (!trimmed) return null

    // Try each parser in order of specificity
    return (
        parseGoogleMapsLink(trimmed) ||
        parseAppleMapsLink(trimmed) ||
        parseWazeLink(trimmed) ||
        parseOSMLink(trimmed) ||
        parseHereLink(trimmed) ||
        parseWhatsAppLocationText(trimmed) ||
        parseRawCoordinates(trimmed) ||
        null
    )
}

// --- Check if link needs server-side resolution ---
function isShortenedMapsLink(text: string): boolean {
    const trimmed = text.trim()
    return /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(trimmed)
}

function needsServerResolve(text: string): boolean {
    const trimmed = text.trim()
    return isShortenedMapsLink(trimmed) || isPlusCode(trimmed)
}

// Resolve shortened link or Plus Code via server-side API
async function resolveLocation(text: string): Promise<string | { lat: number; lng: number } | null> {
    const trimmed = text.trim()

    // Shortened Google Maps link → resolve via redirect
    if (isShortenedMapsLink(trimmed)) {
        try {
            const res = await fetch("/api/resolve-maps-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: trimmed }),
            })
            if (!res.ok) return null
            const data = await res.json()
            return data.resolvedUrl || null
        } catch {
            return null
        }
    }

    // Plus Code → resolve via Google Geocoding (use our geocode API)
    if (isPlusCode(trimmed)) {
        const code = extractPlusCode(trimmed)
        if (!code) return null
        try {
            const res = await fetch(`/api/geocode?q=${encodeURIComponent(code)}`)
            if (!res.ok) return null
            const data = await res.json()
            if (data.results && data.results.length > 0) {
                return { lat: data.results[0].lat, lng: data.results[0].lng }
            }
        } catch {
            // silently fail
        }
        return null
    }

    return null
}

// =========================================================================
// COMPONENT
// =========================================================================

interface GoogleMapsLinkInputProps {
    onLocationFound: (location: { lat: number; lng: number; label: string }) => void
    type?: "pickup" | "dropoff"
    className?: string
}

export function GoogleMapsLinkInput({ onLocationFound, type = "pickup", className }: GoogleMapsLinkInputProps) {
    const [linkValue, setLinkValue] = useState("")
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [errorMsg, setErrorMsg] = useState("")
    const [foundLabel, setFoundLabel] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const isPickup = type === "pickup"

    const processLink = async (text: string) => {
        const trimmed = text.trim()
        if (!trimmed) return

        // 1) Check if it needs server-side resolution first
        if (needsServerResolve(trimmed)) {
            setStatus("loading")
            setErrorMsg("")
            const resolved = await resolveLocation(trimmed)

            if (!resolved) {
                setStatus("error")
                setErrorMsg("Gagal memproses link. Coba paste link lengkap atau koordinat langsung.")
                if (timeoutRef.current) clearTimeout(timeoutRef.current)
                timeoutRef.current = setTimeout(() => {
                    setStatus("idle")
                    setErrorMsg("")
                }, 3000)
                return
            }

            // If resolved to coordinates directly (Plus Code)
            if (typeof resolved === "object") {
                await reverseGeocodeAndFinish(resolved.lat, resolved.lng)
                return
            }

            // If resolved to a URL string, parse it
            const coords = parseLocation(resolved)
            if (coords) {
                await reverseGeocodeAndFinish(coords.lat, coords.lng)
                return
            }

            setStatus("error")
            setErrorMsg("Link tidak mengandung koordinat. Coba format lain.")
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            timeoutRef.current = setTimeout(() => {
                setStatus("idle")
                setErrorMsg("")
            }, 3000)
            return
        }

        // 2) Try parsing directly (Google Maps, Apple Maps, Waze, OSM, raw coords, etc.)
        const coords = parseLocation(trimmed)
        if (!coords) {
            setStatus("error")
            setErrorMsg("Format tidak dikenali. Paste link Maps, koordinat, atau share location.")
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            timeoutRef.current = setTimeout(() => {
                setStatus("idle")
                setErrorMsg("")
            }, 3000)
            return
        }

        await reverseGeocodeAndFinish(coords.lat, coords.lng)
    }

    const reverseGeocodeAndFinish = async (lat: number, lng: number) => {
        setStatus("loading")
        setErrorMsg("")

        try {
            const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`)
            const data = await res.json()
            const shortCoord = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
            const label = data.label || `Lokasi (${shortCoord})`

            setFoundLabel(label)
            setStatus("success")
            onLocationFound({ lat, lng, label })
        } catch {
            const shortCoord = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
            const label = `Lokasi (${shortCoord})`
            setFoundLabel(label)
            setStatus("success")
            onLocationFound({ lat, lng, label })
        }

        // Auto-clear success after 3s
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
            setLinkValue("")
            setStatus("idle")
            setFoundLabel("")
        }, 3000)
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pasted = e.clipboardData.getData("text")
        if (pasted) {
            // Let the paste happen naturally, then process
            setTimeout(() => processLink(pasted), 50)
        }
    }

    const handleSubmit = () => {
        if (linkValue.trim()) {
            processLink(linkValue.trim())
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault()
            handleSubmit()
        }
    }

    const handleClear = () => {
        setLinkValue("")
        setStatus("idle")
        setErrorMsg("")
        setFoundLabel("")
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        inputRef.current?.focus()
    }

    return (
        <div className={cn("space-y-2", className)}>
            <div className="relative">
                {/* Input */}
                <div className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all",
                    status === "idle" && "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30",
                    status === "loading" && (isPickup
                        ? "border-teal-300 dark:border-teal-700 bg-teal-50/30 dark:bg-teal-900/10"
                        : "border-orange-300 dark:border-orange-700 bg-orange-50/30 dark:bg-orange-900/10"),
                    status === "success" && "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10",
                    status === "error" && "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10"
                )}>
                    {/* Icon */}
                    <div className={cn(
                        "shrink-0 p-1.5 rounded-lg transition-colors",
                        status === "idle" && "text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700/50",
                        status === "loading" && (isPickup ? "text-teal-500 bg-teal-100 dark:bg-teal-900/30" : "text-orange-500 bg-orange-100 dark:bg-orange-900/30"),
                        status === "success" && "text-green-500 bg-green-100 dark:bg-green-900/30",
                        status === "error" && "text-red-500 bg-red-100 dark:bg-red-900/30"
                    )}>
                        {status === "loading" ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : status === "success" ? (
                            <Check size={14} />
                        ) : status === "error" ? (
                            <X size={14} />
                        ) : (
                            <Link2 size={14} />
                        )}
                    </div>

                    {/* Input field */}
                    <input
                        ref={inputRef}
                        type="text"
                        value={linkValue}
                        onChange={(e) => setLinkValue(e.target.value)}
                        onPaste={handlePaste}
                        onKeyDown={handleKeyDown}
                        placeholder="Paste link Maps / koordinat / share location..."
                        disabled={status === "loading"}
                        className="flex-1 bg-transparent border-none outline-none text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50"
                    />

                    {/* Action buttons */}
                    {linkValue && status === "idle" && (
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                onClick={handleClear}
                                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <X size={12} />
                            </button>
                            <button
                                onClick={handleSubmit}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition-all active:scale-95",
                                    isPickup ? "bg-teal-500 hover:bg-teal-600" : "bg-orange-500 hover:bg-orange-600"
                                )}
                            >
                                Terapkan
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Status messages */}
            {status === "success" && foundLabel && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 animate-in fade-in slide-in-from-top-1 duration-200">
                    <MapPin size={12} className="text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-green-700 dark:text-green-300 leading-relaxed">
                        <span className="font-semibold">Lokasi ditemukan:</span>{" "}
                        {foundLabel}
                    </p>
                </div>
            )}

            {status === "error" && errorMsg && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 animate-in fade-in slide-in-from-top-1 duration-200">
                    <X size={12} className="text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-red-600 dark:text-red-400">{errorMsg}</p>
                </div>
            )}
        </div>
    )
}
