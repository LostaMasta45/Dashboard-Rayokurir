"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, Ticket, Clock, Zap, Gift } from "lucide-react";

const promotions = [
    {
        id: 1,
        title: "Diskon Kilat 50%",
        subtitle: "Khusus Pengguna Baru",
        desc: "Berlaku untuk semua resto!",
        color: "from-green-500 to-emerald-700",
        shadow: "shadow-green-900/10",
        icon: Ticket
    },
    {
        id: 2,
        title: "Gratis Ongkir",
        subtitle: "Se-Kec. Sumobito",
        desc: "Tanpa minimum pembelian lho.",
        color: "from-blue-500 to-indigo-600",
        shadow: "shadow-blue-900/10",
        icon: Zap
    },
    {
        id: 3,
        title: "Kopi Beli 1 Gratis 1",
        subtitle: "Promo Sore Santai",
        desc: "Jam 15.00 - 17.00 WIB",
        color: "from-amber-500 to-orange-600",
        shadow: "shadow-orange-900/10",
        icon: Clock
    },
    {
        id: 4,
        title: "Voucher RayoPay",
        subtitle: "Cashback 10 Ribu",
        desc: "Top up sekarang juga!",
        color: "from-purple-500 to-pink-600",
        shadow: "shadow-pink-900/10",
        icon: Gift
    }
];

export const PromoCarousel = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto Slide Logic
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((current) => (current + 1) % promotions.length);
        }, 3000); // 3 seconds per slide

        return () => clearInterval(interval);
    }, []);

    // Sync scroll with active index
    useEffect(() => {
        if (scrollRef.current) {
            const container = scrollRef.current;
            const scrollAmount = container.clientWidth * activeIndex;
            // Or simpler: strictly snap to child width + gap if calculated manually, 
            // but alignment is simpler if we just scroll the container nicely.
            // Actually for "snap-x" manual scroll allows user override, 
            // but for full auto slide visual we might want to just target the element.

            // Let's rely on scrollLeft.
            // Assuming card width ~300px + gap 12px (3rem)
            // But let's verify width in render.
            // Better to select child and scrollIntoView or use scrollTo.

            const card = container.children[activeIndex] as HTMLElement;
            if (card) {
                // Ensure smooth scroll
                container.scrollTo({
                    left: card.offsetLeft - container.offsetLeft, // Adjust for padding if needed
                    behavior: 'smooth'
                });
            }
        }
    }, [activeIndex]);

    return (
        <div className="relative group">
            {/* Slider Container */}
            <div
                ref={scrollRef}
                className="py-4 px-4 overflow-x-auto scrollbar-hide flex gap-3 snap-x touch-pan-x"
                style={{ scrollBehavior: 'smooth' }}
                onScroll={(e) => {
                    // Optional: detect manual scroll to pause/sync? 
                    // Keeping simple for now to avoid fighting user interaction too much.
                }}
            >
                {promotions.map((p, idx) => (
                    <div
                        key={p.id}
                        className={`w-[300px] h-[140px] bg-gradient-to-r ${p.color} rounded-2xl shrink-0 snap-center relative overflow-hidden flex items-center p-5 shadow-lg ${p.shadow} transition-transform duration-500`}
                    >
                        {/* Abstract Shapes */}
                        <div className="absolute right-[-20px] bottom-[-40px] w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute top-[-20px] right-20 w-20 h-20 bg-black/5 rounded-full blur-xl" />

                        <div className="relative z-10 text-white w-full pr-12">
                            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider mb-2 inline-block backdrop-blur-sm border border-white/10">
                                {p.subtitle}
                            </span>
                            <h3 className="font-bold text-xl leading-tight mb-1">{p.title}</h3>
                            <p className="text-xs text-white/80 font-medium mb-3">{p.desc}</p>

                        </div>

                        {/* Icon Box */}
                        <div className="absolute right-4 bottom-4 bg-white/20 backdrop-blur-md p-2 rounded-xl border border-white/20">
                            <p.icon className="w-6 h-6 text-white" />
                        </div>

                        {/* Arrow Action */}
                        <button className="absolute top-4 right-4 bg-white text-black rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                            <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Indicators */}
            <div className="flex justify-center gap-1.5 -mt-2 mb-2">
                {promotions.map((_, idx) => (
                    <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeIndex ? 'w-6 bg-teal-500' : 'w-1.5 bg-gray-300 dark:bg-gray-700'}`}
                    />
                ))}
            </div>
        </div>
    );
};
