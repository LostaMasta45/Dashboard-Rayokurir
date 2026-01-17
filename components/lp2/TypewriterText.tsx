"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface TypewriterTextProps {
    phrases?: string[]
    duration?: number
    className?: string
}

export function TypewriterText({
    phrases = [
        "Bisa Kirim Makanan",
        "Bisa Kirim Dokumen",
        "Bisa Titip Belanja",
        "Bisa Antar Paket",
        "Bisa Express",
    ],
    duration = 3000,
    className = "",
}: TypewriterTextProps) {
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((current) => (current + 1) % phrases.length)
        }, duration)
        return () => clearInterval(timer)
    }, [phrases.length, duration])

    // Detect longest phrase to reserve space
    const longestPhrase = useMemo(() =>
        phrases.reduce((a, b) => a.length > b.length ? a : b, ""),
        [phrases]
    )

    return (
        <span
            className={`relative block w-full ${className}`}
        >
            {/* 
                SPACER:
                Invisible element that reserves the height and ensures proper sizing.
                Uses the longest phrase to prevent layout shifts.
            */}
            <span
                aria-hidden="true"
                className="invisible select-none block text-center lg:text-left bg-clip-text text-transparent bg-gradient-to-r from-teal-200 via-white to-teal-200"
            >
                {longestPhrase}
            </span>

            {/* 
                ANIMATION LAYER:
                Positioned absolutely to overlay the spacer exactly.
                Centered on mobile, left-aligned on desktop.
            */}
            <span className="absolute inset-0 flex items-center justify-center lg:justify-start">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                        key={index}
                        className="bg-clip-text text-transparent bg-gradient-to-r from-teal-200 via-white to-teal-200"
                        initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
                        transition={{
                            duration: 0.5,
                            ease: [0.4, 0, 0.2, 1],
                        }}
                    >
                        {phrases[index]}
                    </motion.span>
                </AnimatePresence>
            </span>
        </span>
    )
}
