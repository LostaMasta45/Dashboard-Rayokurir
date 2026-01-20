"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Dynamic import to avoid SSR issues with Leaflet
const MapPicker = dynamic(
    () => import("./MapPicker").then((mod) => mod.MapPicker),
    {
        ssr: false,
        loading: () => (
            <div className="h-[300px] bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Memuat peta...</p>
                </div>
            </div>
        ),
    }
)

export { MapPicker }
export type { MapLocation } from "./MapPicker"
