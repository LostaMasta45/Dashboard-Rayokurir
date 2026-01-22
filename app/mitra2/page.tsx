"use client";

import React from "react";
import { MitraHomeHeader } from "@/components/mitra2/MitraHomeHeader";
import { CategoryGrid } from "@/components/mitra2/CategoryGrid";
import { FilterChips } from "@/components/mitra2/FilterChips";
import { PromoCarousel } from "@/components/mitra2/PromoCarousel";
import { MitraCardList, MitraCardWidget, MitraCardStory, MitraCardGlass, MitraData } from "@/components/mitra2/MitraCards";
import { ArrowRight, TrendingUp, ShoppingCart, Zap } from "lucide-react";
import Link from "next/link";

// --- DUMMY DATA V1.0 (Multi-type) ---
const dummyMitra: MitraData[] = [
    // FOOD
    { id: 1, nama: "Gacoan (Jombang)", lokasi: "Jombang", category: "Noodle", type: 'food', rating: 4.8, waktu: "20 min", harga: 12000, isBuka: true, cover: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=500&q=80" },
    { id: 2, nama: "Kopi Janji Jiwa", lokasi: "Sumobito", category: "Coffee", type: 'food', rating: 4.7, waktu: "10 min", harga: 18000, isBuka: true, cover: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80" },
    { id: 3, nama: "Ayam Bakar Wong Solo", lokasi: "Jombang Kota", category: "Chicken", type: 'food', rating: 4.6, waktu: "40 min", harga: 25000, isBuka: true, cover: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&q=80" },

    // RETAIL
    { id: 4, nama: "Warung Madura 24 Jam", lokasi: "Sumobito", category: "Sembako", type: 'retail', rating: 4.9, waktu: "15 min", harga: 5000, isBuka: true, cover: "https://images.unsplash.com/photo-1604719312566-b7cb07743d1e?w=500&q=80" },
    { id: 5, nama: "Indomaret Point", lokasi: "Peterongan", category: "Minimarket", type: 'retail', rating: 4.5, waktu: "20 min", harga: 5000, isBuka: true, cover: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&q=80" },

    // PHARMACY
    { id: 6, nama: "Apotek K-24", lokasi: "Jombang", category: "Apotek", type: 'pharmacy', rating: 4.8, waktu: "25 min", harga: 10000, isBuka: true, cover: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=500&q=80" },

    // SERVICE
    { id: 7, nama: "Rayo Laundry Express", lokasi: "Sumobito", category: "Laundry", type: 'service', rating: 4.7, waktu: "1 Hari", harga: 6000, isBuka: true, cover: "https://images.unsplash.com/photo-1545173168-9f1947eebb8f?w=500&q=80" },

    // CLOSED / OTHERS
    { id: 8, nama: "Martabak Holland", lokasi: "Peterongan", category: "Snack", type: 'special', rating: 4.9, waktu: "30 min", harga: 35000, isBuka: false, cover: "https://images.unsplash.com/photo-1626803775151-61d756612fcd?w=500&q=80" },
];

export default function MitraPageV2() {
    // Filter helpers
    const retailMitra = dummyMitra.filter(m => m.type === 'retail');
    const pharmacyMitra = dummyMitra.filter(m => m.type === 'pharmacy');
    const trendingMitra = dummyMitra.slice(0, 5); // Just taking first 5 for now

    return (
        <div className="min-h-screen bg-[#F3F4F5] dark:bg-black font-sans pb-24 md:max-w-md md:mx-auto md:shadow-2xl md:min-h-screen border-x border-gray-100 dark:border-gray-800 relative">

            {/* === COMING SOON OVERLAY === */}
            <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center max-w-md mx-auto">
                {/* Background Tint */}
                <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[2px] rounded-[2rem]" />

                {/* Text Container */}
                <div className="relative bg-white/80 dark:bg-black/80 backdrop-blur-md border border-white/20 shadow-2xl px-6 py-8 rounded-[2rem] transform -rotate-3 hover:rotate-0 transition-transform duration-500 mx-6 text-center">
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-teal-500 rounded-full animate-pulse" />
                    <h2 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-2 leading-none">
                        COMING <span className="text-teal-500">SOON</span>
                    </h2>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-relaxed mt-2">
                        untuk semua <br /> <span className="text-teal-600 dark:text-teal-400">Mitra Rayo Kurir</span>
                    </p>
                </div>
            </div>
            {/* 1. Super App Header (Sticky) */}
            <div className="sticky top-0 z-50 bg-[#F3F4F5] dark:bg-black">
                <MitraHomeHeader />
                {/* Quick Filter Chips (Sticky under header) */}
                <FilterChips />
            </div>

            {/* 2. Category / Mitra Type Grid */}
            <div className="mt-2">
                <CategoryGrid />
            </div>

            {/* 3. Promo Banner Carousel (Auto Slider) */}
            <PromoCarousel />

            {/* 4. Section “Lagi Rame di Sumobito 🔥” (Story Row) */}
            <div className="py-2 pl-4">
                <div className="flex items-center justify-between pr-4 mb-3">
                    <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-1">
                        Lagi Rame
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                    </h2>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 pr-4 px-4 snap-x">
                    {trendingMitra.map(m => (
                        <Link key={m.id} href={`/mitra/${m.id}`}>
                            <MitraCardGlass data={m} />
                        </Link>
                    ))}
                </div>
            </div>

            {/* 5. NEW: “Belanja Cepat 🛒” (Retail) */}
            {retailMitra.length > 0 && (
                <div className="py-2 px-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-1">
                            Belanja Cepat 🛒
                        </h2>
                        <button className="text-teal-600 font-bold text-xs bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded-lg">
                            Isi Daftar Belanja
                        </button>
                    </div>
                    {retailMitra.map(m => (
                        <Link key={m.id} href={`/mitra/${m.id}`}>
                            <MitraCardList data={m} />
                        </Link>
                    ))}
                </div>
            )}

            {/* 6. “Paling Deket Rumah 🏠” */}
            <div className="py-2 px-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-gray-900 dark:text-white text-lg">Paling Deket Rumah 🏠</h2>
                    <button className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-teal-600">
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                {dummyMitra.slice(0, 3).map(m => (
                    <Link key={m.id} href={`/mitra/${m.id}`}>
                        <MitraCardList data={m} />
                    </Link>
                ))}
            </div>

            {/* 7. “Favorit Sekecamatan ❤️” */}
            <div className="py-4 px-4 bg-white dark:bg-gray-900/50 rounded-t-[2rem] mt-2">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="font-bold text-gray-900 dark:text-white text-lg">Favorit Sekecamatan ❤️</h2>
                        <p className="text-xs text-gray-500">Rating 4.5+ semua nih!</p>
                    </div>
                    <button className="text-teal-600 font-bold text-sm">Lihat Semua</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {dummyMitra.map(m => (
                        <Link key={m.id} href={`/mitra/${m.id}`}>
                            <MitraCardWidget data={m} />
                        </Link>
                    ))}
                </div>
            </div>

            {/* 8. NEW: “Kebutuhan Mendadak ⚡” (Pharmacy / Late night) */}
            <div className="py-4 px-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-1">
                        Kebutuhan Mendadak <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    </h2>
                </div>
                {pharmacyMitra.concat(retailMitra).slice(0, 3).map(m => (
                    <Link key={m.id} href={`/mitra/${m.id}`}>
                        <MitraCardList data={m} />
                    </Link>
                ))}
            </div>

            {/* 9. “Mitra Baru Gabung ✨” */}
            <div className="py-4 px-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-gray-900 dark:text-white text-lg">Mitra Baru Gabung ✨</h2>
                </div>
                {dummyMitra.filter(m => m.type === 'service').map(m => (
                    <Link key={m.id} href={`/mitra/${m.id}`}>
                        <MitraCardList data={m} />
                    </Link>
                ))}
            </div>


            {/* Bottom Spacing for Floating Nav */}
            <div className="h-12" />
        </div>
    );
}
