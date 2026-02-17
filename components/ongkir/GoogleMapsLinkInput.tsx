"use client"

import { useState, useRef } from "react"
import { Link2, Loader2, Check, X, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

// Detect and parse Google Maps share links (e.g. from WhatsApp)
// Google Maps links can contain multiple coordinates:
//   @lat,lng = viewport center (less accurate)
//   !3d{lat}!4d{lng} = actual pin/place location (most accurate)
//   ?q=lat,lng = shared location pin (accurate)
// We prioritize the most accurate source.
function parseGoogleMapsLink(text: string): { lat: number; lng: number } | null {
    const trimmed = text.trim()
    if (!trimmed.match(/^https?:\/\//i) && !trimmed.match(/maps/i)) return null

    // Priority order: most accurate first
    const patterns = [
        // !3d{lat}!4d{lng} — actual place/pin coordinates (most accurate)
        /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
        // ?q=lat,lng — shared location from WhatsApp
        /[?&]q=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/,
        // place/lat,lng — place coordinates in path
        /place\/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/,
        // @lat,lng — viewport center (fallback, least accurate)
        /@(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/,
    ]
    for (const pattern of patterns) {
        const match = trimmed.match(pattern)
        if (match) {
            const lat = parseFloat(match[1])
            const lng = parseFloat(match[2])
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                return { lat, lng }
            }
        }
    }
    return null
}

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
        const coords = parseGoogleMapsLink(text)
        if (!coords) {
            setStatus("error")
            setErrorMsg("Link tidak valid. Pastikan link dari Google Maps.")
            // Auto-clear error after 3s
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            timeoutRef.current = setTimeout(() => {
                setStatus("idle")
                setErrorMsg("")
            }, 3000)
            return
        }

        setStatus("loading")
        setErrorMsg("")

        try {
            const res = await fetch(`/api/geocode/reverse?lat=${coords.lat}&lng=${coords.lng}`)
            const data = await res.json()
            const shortCoord = `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
            const label = data.label || `Lokasi (${shortCoord})`

            setFoundLabel(label)
            setStatus("success")
            onLocationFound({ lat: coords.lat, lng: coords.lng, label })

            // Auto-clear success after 3s
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            timeoutRef.current = setTimeout(() => {
                setLinkValue("")
                setStatus("idle")
                setFoundLabel("")
            }, 3000)
        } catch {
            const shortCoord = `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
            const label = `Lokasi (${shortCoord})`
            setFoundLabel(label)
            setStatus("success")
            onLocationFound({ lat: coords.lat, lng: coords.lng, label })

            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            timeoutRef.current = setTimeout(() => {
                setLinkValue("")
                setStatus("idle")
                setFoundLabel("")
            }, 3000)
        }
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
                        placeholder="Paste link Google Maps di sini..."
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
