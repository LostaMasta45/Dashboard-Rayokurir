"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, MapPin, Loader2, X, Navigation2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchResult {
    id: string
    label: string
    lat: number
    lng: number
    type: string
}

interface LocationSearchInputProps {
    onSelect: (result: { lat: number; lng: number; label: string }) => void
    placeholder?: string
    icon?: "pickup" | "dropoff"
    className?: string
    value?: string
    onClear?: () => void
    showGPS?: boolean
    showIndicator?: boolean
    showIcon?: boolean
    variant?: "default" | "minimal"
}

export function LocationSearchInput({
    onSelect,
    placeholder = "Cari lokasi atau alamat...",
    icon = "pickup",
    className = "",
    value = "",
    onClear,
    showGPS = true,
    showIndicator = true,
    showIcon = true,
    variant = "default"
}: LocationSearchInputProps) {
    const [query, setQuery] = useState(value)
    const [isEditing, setIsEditing] = useState(false) // Track if user is actively editing
    const [results, setResults] = useState<SearchResult[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [isGettingLocation, setIsGettingLocation] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // The display value: show external value unless user is actively editing
    const displayValue = isEditing ? query : value

    // Check if value looks like a pre-selected location (contains coordinates)
    const isPreselectedValue = (val: string) => {
        // Matches patterns like "(-7.5133, 112.3476)" or "Titik Peta"
        return /\(-?\d+\.\d+,\s*-?\d+\.\d+\)/.test(val) || val.includes("Titik Peta") || val.includes("Lokasi Saya")
    }

    // Debounced search - only when user is actively editing with valid search query
    useEffect(() => {
        // Skip search if not editing, too short, or looks like pre-selected coordinate value
        if (!isEditing || query.length < 2 || isPreselectedValue(query)) {
            setResults([])
            return
        }

        const timer = setTimeout(async () => {
            setIsLoading(true)
            try {
                const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
                const data = await response.json()
                setResults(data.results || [])
                setIsOpen(true)
            } catch (error) {
                console.error("Geocode error:", error)
                setResults([])
            } finally {
                setIsLoading(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query, isEditing])

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setIsEditing(false) // Exit editing mode when clicking outside
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSelect = (result: SearchResult) => {
        setQuery(result.label)
        setIsEditing(false)
        setIsOpen(false)
        onSelect({ lat: result.lat, lng: result.lng, label: result.label })
    }

    const handleClear = () => {
        setQuery("")
        setIsEditing(true)
        setResults([])
        setIsOpen(false)
        inputRef.current?.focus()
        onClear?.()
    }

    // Get current location via GPS
    const handleGetCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            alert("Geolocation tidak didukung oleh browser Anda")
            return
        }

        setIsGettingLocation(true)
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords

                // Reverse geocode to get address
                try {
                    const response = await fetch(
                        `/api/geocode/reverse?lat=${latitude}&lng=${longitude}`
                    )
                    const data = await response.json()
                    const label = data.label || `Lokasi Saya (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`

                    setQuery(label)
                    onSelect({ lat: latitude, lng: longitude, label })
                } catch {
                    // Fallback if reverse geocode fails
                    const label = `Lokasi Saya (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
                    setQuery(label)
                    onSelect({ lat: latitude, lng: longitude, label })
                }

                setIsGettingLocation(false)
            },
            (error) => {
                console.error("Geolocation error:", error)
                setIsGettingLocation(false)

                if (error.code === error.PERMISSION_DENIED) {
                    alert("Akses lokasi ditolak. Mohon izinkan akses lokasi di browser Anda.")
                } else {
                    alert("Gagal mendapatkan lokasi. Silakan coba lagi.")
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        )
    }, [onSelect])

    return (
        <div ref={containerRef} className={cn("relative group", className)}>
            <div className="relative">
                {/* Visual Indicator Line (Optional aesthetic) */}
                {showIndicator && (
                    <div className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full transition-colors",
                        icon === "pickup" ? "bg-teal-500" : "bg-orange-500"
                    )} />
                )}

                {/* Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={displayValue}
                    onChange={(e) => {
                        setIsEditing(true)
                        setQuery(e.target.value)
                    }}
                    onFocus={() => {
                        // Only open results if user is searching
                        if (isEditing && results.length > 0) setIsOpen(true)
                    }}
                    placeholder={placeholder}
                    className={cn(
                        "w-full h-14 pr-24 rounded-2xl border-0 text-sm font-medium transition-all text-gray-900 dark:text-white placeholder:font-normal placeholder:text-gray-400 dark:placeholder:text-gray-500/70",
                        showIcon ? "pl-12" : "pl-4",
                        variant === "default" && "shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 focus:outline-none focus:ring-2 focus:shadow-md backdrop-blur-sm",
                        variant === "default" && (icon === "pickup"
                            ? "bg-white dark:bg-black/20 focus:ring-teal-500/50 border border-gray-200 dark:border-gray-700/50"
                            : "bg-white dark:bg-black/20 focus:ring-orange-500/50 border border-gray-200 dark:border-gray-700/50"),
                        variant === "minimal" && "bg-transparent h-full px-0 border-none ring-0 focus:ring-0 shadow-none outline-none"
                    )}
                />

                {/* Left Icon (Absolute) */}
                {showIcon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        {isLoading ? (
                            <Loader2 size={18} className="animate-spin text-gray-400" />
                        ) : (
                            <div className={cn(
                                "p-1.5 rounded-full",
                                icon === "pickup" ? "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" : "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                            )}>
                                <Search size={16} strokeWidth={2.5} />
                            </div>
                        )}
                    </div>
                )}

                {/* Right buttons */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {/* Clear button */}
                    {query && (
                        <button
                            onClick={handleClear}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Hapus"
                        >
                            <X size={16} strokeWidth={2.5} />
                        </button>
                    )}

                    {showGPS && <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-0.5" />}

                    {/* GPS button */}
                    {showGPS && (
                        <button
                            onClick={handleGetCurrentLocation}
                            disabled={isGettingLocation}
                            className={cn(
                                "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                isGettingLocation
                                    ? "text-teal-500 bg-teal-50 dark:bg-teal-900/20"
                                    : "text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 bg-gray-50 dark:bg-gray-700/50"
                            )}
                            title="Gunakan lokasi saya"
                        >
                            {isGettingLocation ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Navigation2 size={14} className="fill-current" />
                            )}
                            <span className="hidden sm:inline">Lokasi Saya</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Results dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-2xl ring-1 ring-gray-100 dark:ring-gray-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {results.map((result, index) => (
                            <button
                                key={result.id}
                                onClick={() => handleSelect(result)}
                                className={cn(
                                    "w-full px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-start gap-3 transition-colors group/item",
                                    index !== results.length - 1 && "border-b border-gray-50 dark:border-gray-700"
                                )}
                            >
                                <div className="mt-1 p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover/item:bg-teal-50 dark:group-hover/item:bg-teal-900/30 group-hover/item:text-teal-600 dark:group-hover/item:text-teal-400 transition-colors shrink-0">
                                    <MapPin size={14} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover/item:text-teal-700 dark:group-hover/item:text-teal-400">
                                        {result.label}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize flex items-center gap-1">
                                        {result.type}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* No results message */}
            {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-2xl ring-1 ring-gray-100 dark:ring-gray-700 shadow-xl p-6 text-center text-sm text-gray-500 dark:text-gray-400 animate-in fade-in zoom-in-95 duration-100">
                    <div className="bg-gray-50 dark:bg-gray-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MapPin size={20} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">Lokasi tidak ditemukan</p>
                    <p className="text-gray-400 dark:text-gray-500 mt-1">Coba kata kunci lain atau gunakan GPS</p>
                </div>
            )}
        </div>
    )
}
