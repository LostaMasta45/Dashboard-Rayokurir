"use client"

import { motion } from "framer-motion"

interface InfiniteMarqueeProps {
    items?: string[]
    speed?: number
    className?: string
}

export function InfiniteMarquee({
    items = [
        "Sumobito",
        "Jogoloyo",
        "Peterongan",
        "Kesamben",
        "Plosokerep",
        "Budug",
        "Mentoro",
        "Plumbon Gambang",
        "Kendal Sewu",
        "Podoroto",
        "Janti",
        "Badas",
        "Tambak Rejo",
        "Segodo Baru",
        "Talun"
    ],
    speed = 25,
    className = ""
}: InfiniteMarqueeProps) {
    // Duplicate items multiple times to ensure no gaps on wide screens
    // 4 copies should be enough for most screen sizes
    const duplicatedItems = [...items, ...items, ...items, ...items]

    return (
        <div className={`overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-4 ${className} select-none`}>
            {/* Mask gradients for smooth fade in/out edges */}
            <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-gray-900 to-transparent pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none"></div>

                <motion.div
                    className="flex gap-8 whitespace-nowrap will-change-transform"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{
                        x: {
                            duration: speed * 2, // Adjust speed since list is longer
                            repeat: Infinity,
                            ease: "linear",
                        },
                    }}
                >
                    {duplicatedItems.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 text-white/80 shrink-0"
                        >
                            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_10px_rgba(45,212,191,0.5)]"></span>
                            <span className="text-sm font-medium tracking-wide">{item}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    )
}
