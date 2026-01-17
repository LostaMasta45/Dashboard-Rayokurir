"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Package, Utensils, ShoppingBag, FileText, LucideIcon } from "lucide-react"

interface NotificationData {
    name: string
    action: string
    location: string
    icon: LucideIcon
    iconColor: string
}

const DUMMY_NOTIFICATIONS: NotificationData[] = [
    { name: "Budi", action: "memesan Sate Ayam", location: "Sumobito", icon: Utensils, iconColor: "text-orange-500 bg-orange-100" },
    { name: "Siti", action: "mengirim paket", location: "Mentoro", icon: Package, iconColor: "text-purple-500 bg-purple-100" },
    { name: "Raka", action: "titip beli dari Indomaret", location: "Jogoloyo", icon: ShoppingBag, iconColor: "text-green-500 bg-green-100" },
    { name: "Dewi", action: "kirim dokumen penting", location: "Peterongan", icon: FileText, iconColor: "text-blue-500 bg-blue-100" },
    { name: "Agus", action: "memesan Bakso Pak Karso", location: "Kesamben", icon: Utensils, iconColor: "text-orange-500 bg-orange-100" },
    { name: "Lina", action: "mengirim paket olshop", location: "Plosokerep", icon: Package, iconColor: "text-purple-500 bg-purple-100" },
    { name: "Doni", action: "beli obat di Apotek K24", location: "Sumobito", icon: ShoppingBag, iconColor: "text-green-500 bg-green-100" },
    { name: "Maya", action: "kirim berkas sekolah", location: "Budug", icon: FileText, iconColor: "text-blue-500 bg-blue-100" },
]

export function LiveNotification() {
    const [isVisible, setIsVisible] = useState(false)
    const [currentNotification, setCurrentNotification] = useState<NotificationData | null>(null)

    useEffect(() => {
        const showNotification = () => {
            const randomIndex = Math.floor(Math.random() * DUMMY_NOTIFICATIONS.length)
            setCurrentNotification(DUMMY_NOTIFICATIONS[randomIndex])
            setIsVisible(true)

            // Hide after 4 seconds
            setTimeout(() => {
                setIsVisible(false)
            }, 4000)
        }

        // Show first notification after 5 seconds
        const initialTimeout = setTimeout(showNotification, 5000)

        // Then show every 15-25 seconds
        const intervalId = setInterval(() => {
            showNotification()
        }, 15000 + Math.random() * 10000)

        return () => {
            clearTimeout(initialTimeout)
            clearInterval(intervalId)
        }
    }, [])

    const IconComponent = currentNotification?.icon || Package

    return (
        <AnimatePresence>
            {isVisible && currentNotification && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }} // smooth cubic-bezier
                    className="fixed bottom-24 left-4 md:bottom-6 md:left-6 z-50 max-w-xs"
                >
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-center gap-3">
                        {/* Pulse indicator */}
                        <div className="relative">
                            <div className={`p-2.5 rounded-xl ${currentNotification.iconColor}`}>
                                <IconComponent size={20} />
                            </div>
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                <span className="font-bold">{currentNotification.name}</span>{" "}
                                {currentNotification.action}
                            </p>
                            <p className="text-xs text-gray-500">
                                📍 {currentNotification.location} • Baru saja
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
