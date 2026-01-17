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
}

export function LocationSearchInput({
    onSelect,
    placeholder = "Cari lokasi atau alamat...",
    icon = "pickup",
    className = "",
    value = "",
    onClear
}: LocationSearchInputProps) {
    const [query, setQuery] = useState(value)
    const [results, setResults] = useState<SearchResult[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [isGettingLocation, setIsGettingLocation] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
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
    }, [query])

    // Update query when value prop changes
    useEffect(() => {
        setQuery(value)
    }, [value])

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSelect = (result: SearchResult) => {
        setQuery(result.label)
        setIsOpen(false)
        onSelect({ lat: result.lat, lng: result.lng, label: result.label })
    }

    const handleClear = () => {
        setQuery("")
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
        <div ref={containerRef} className={cn("relative", className)}>
            <div className="relative">
                {/* Search Icon */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {isLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Search size={18} />
                    )}
                </div>

                {/* Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    className={cn(
                        "w-full h-12 pl-10 pr-20 rounded-xl border-2 text-sm transition-all",
                        "focus:outline-none focus:ring-2",
                        icon === "pickup"
                            ? "border-teal-200 bg-teal-50/30 focus:ring-teal-500 focus:border-teal-500"
                            : "border-orange-200 bg-orange-50/30 focus:ring-orange-500 focus:border-orange-500"
                    )}
                />

                {/* Right buttons */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {/* Clear button */}
                    {query && (
                        <button
                            onClick={handleClear}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Hapus"
                        >
                            <X size={16} />
                        </button>
                    )}

                    {/* GPS button */}
                    <button
                        onClick={handleGetCurrentLocation}
                        disabled={isGettingLocation}
                        className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            isGettingLocation
                                ? "text-teal-500"
                                : "text-gray-400 hover:text-teal-600 hover:bg-teal-50"
                        )}
                        title="Gunakan lokasi saya"
                    >
                        {isGettingLocation ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Navigation2 size={16} />
                        )}
                    </button>
                </div>
            </div>

            {/* Results dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                    {results.map((result) => (
                        <button
                            key={result.id}
                            onClick={() => handleSelect(result)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                            <MapPin size={16} className="mt-0.5 text-gray-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {result.label}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">
                                    {result.type}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No results message */}
            {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-gray-200 shadow-lg p-4 text-center text-sm text-gray-500">
                    Tidak ada hasil untuk "{query}"
                </div>
            )}
        </div>
    )
}
