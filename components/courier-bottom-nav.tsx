"use client"

import { Home, Package, Wallet, User, Camera } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface CourierBottomNavProps {
    activeTab: string
    onTabChange: (tab: string) => void
}

export function CourierBottomNav({ activeTab, onTabChange }: CourierBottomNavProps) {
    const tabs = [
        { id: "home", label: "Beranda", icon: Home },
        { id: "orders", label: "Tugas", icon: Package },
        { id: "upload", label: "Upload", icon: Camera, isSpecial: true },
        { id: "wallet", label: "Dompet", icon: Wallet },
        { id: "profile", label: "Profil", icon: User },
    ]

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            {/* Background Layer - Full Width, Docked to Bottom */}
            <div className="absolute inset-x-0 bottom-0 h-[84px] bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-[20px]" />

            <div className="relative flex items-center justify-between px-2 pb-3 pt-2 h-[84px] max-w-md mx-auto w-full">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id

                    // Special Center Button (Upload)
                    if (tab.isSpecial) {
                        return (
                            <div key={tab.id} className="relative -top-8 flex flex-col items-center justify-center w-20">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    animate={{
                                        boxShadow: isActive
                                            ? "0 10px 25px -5px rgba(16, 185, 129, 0.5)" // Emerald shadow
                                            : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                    }}
                                    onClick={() => onTabChange(tab.id)}
                                    className={cn(
                                        "w-16 h-16 rounded-full flex items-center justify-center border-[4px] border-white dark:border-gray-950 transition-colors z-20",
                                        isActive
                                            ? "bg-gradient-to-tr from-teal-400 to-emerald-600 text-white"
                                            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                                    )}
                                >
                                    <motion.div
                                        animate={isActive ? { rotate: [0, -10, 10, 0] } : {}}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                    >
                                        <Camera size={28} strokeWidth={2.5} />
                                    </motion.div>
                                </motion.button>

                                {/* Label for Special Button */}
                                <span className={cn(
                                    "text-[10px] font-bold mt-1 transition-colors duration-200 absolute -bottom-5",
                                    isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"
                                )}>
                                    {tab.label}
                                </span>

                                {/* Ripple Pulse Effect when active */}
                                {isActive && (
                                    <div className="absolute top-0 inset-0 -z-10 bg-emerald-500/20 rounded-full w-16 h-16 animate-ping" />
                                )}
                            </div>
                        )
                    }

                    // Standard Button
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className="flex-1 flex items-center justify-center h-full outline-none"
                        >
                            <div className="flex flex-col items-center gap-1">
                                <motion.div
                                    className={cn(
                                        "p-1.5 rounded-xl transition-colors",
                                        isActive && "bg-emerald-50 dark:bg-emerald-900/20"
                                    )}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Icon
                                        size={22}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className={cn(
                                            "transition-colors",
                                            isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"
                                        )}
                                    />
                                </motion.div>
                                <span className={cn(
                                    "text-[10px] font-medium transition-colors",
                                    isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"
                                )}>
                                    {tab.label}
                                </span>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
