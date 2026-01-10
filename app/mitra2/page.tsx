"use client";

import React, { useState } from "react";
import { MitraHomeHeader } from "@/components/mitra2/MitraHomeHeader";
import { ServiceGrid } from "@/components/mitra2/ServiceGrid";
import { MitraCardList, MitraCardWidget, MitraCardStory, MitraData } from "@/components/mitra2/MitraCards";
import { ArrowRight, ChevronRight } from "lucide-react";

// --- DUMMY DATA ---
const dummyMitra: MitraData[] = [
    { id: 1, nama: "Gacoan (Jombang)", lokasi: "Jombang", category: "Noodle", rating: 4.8, waktu: "20 min", harga: 12000, isBuka: true, cover: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=500&q=80" },
    { id: 2, nama: "Kopi Janji Jiwa", lokasi: "Sumobito", category: "Coffee", rating: 4.7, waktu: "10 min", harga: 18000, isBuka: true, cover: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80" },
    { id: 3, nama: "Martabak Holland", lokasi: "Peterongan", category: "Snack", rating: 4.9, waktu: "30 min", harga: 35000, isBuka: false, cover: "https://images.unsplash.com/photo-1626803775151-61d756612fcd?w=500&q=80" },
    { id: 4, nama: "Ayam Bakar Wong Solo", lokasi: "Jombang Kota", category: "Chicken", rating: 4.6, waktu: "40 min", harga: 25000, isBuka: true, cover: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&q=80" },
    { id: 5, nama: "Burger King", lokasi: "Rest Area", category: "Fast Food", rating: 4.5, waktu: "25 min", harga: 45000, isBuka: true, cover: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&q=80" },
];

export default function MitraPageV2() {
    return (
        <div className="min-h-screen bg-[#F3F4F5] dark:bg-black font-sans pb-24 md:max-w-md md:mx-auto md:shadow-2xl md:min-h-screen border-x border-gray-100 dark:border-gray-800">
            {/* 1. Super App Header */}
            <MitraHomeHeader />

            {/* 2. Main Service Grid (Overlap Header) */}
            <ServiceGrid />

            {/* 3. Promo Banner (Horizontal Carousel) */}
            <div className="py-4 px-4 overflow-x-auto scrollbar-hide flex gap-3 snap-x">
                <div className="w-[300px] h-[140px] bg-gradient-to-r from-green-500 to-emerald-700 rounded-2xl shrink-0 snap-center relative overflow-hidden flex items-center p-5 shadow-lg shadow-green-900/10">
                    <div className="relative z-10 text-white w-2/3">
                        <h3 className="font-bold text-lg leading-tight mb-2">Diskon Kilat 50% untuk Pengguna Baru!</h3>
                        <button className="bg-white text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">Klaim Sekarang</button>
                    </div>
                    <div className="absolute right-[-20px] bottom-[-20px] w-32 h-32 bg-white/20 rounded-full" />
                    <img src="https://cdni.iconscout.com/illustration/premium/thumb/delivery-man-delivering-food-2651662-2216850.png" className="absolute right-2 bottom-0 w-28 h-28 object-contain" alt="" />
                </div>

                <div className="w-[300px] h-[140px] bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shrink-0 snap-center relative overflow-hidden flex items-center p-5 shadow-lg shadow-blue-900/10">
                    <div className="relative z-10 text-white w-2/3">
                        <h3 className="font-bold text-lg leading-tight mb-2">Gratis Ongkir se-Kecamatan!</h3>
                        <button className="bg-white text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">Cek Syarat</button>
                    </div>
                </div>
            </div>

            {/* 4. Category / Brand Highlight (Stories) */}
            <div className="py-2 pl-4">
                <div className="flex items-center justify-between pr-4 mb-3">
                    <h2 className="font-bold text-gray-900 dark:text-white text-lg">Lagi Rame di Sumobito 🔥</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 pr-4">
                    {dummyMitra.map(m => (
                        <MitraCardStory key={m.id} data={m} />
                    ))}
                    {dummyMitra.map(m => ( // Repeat for scroll effect
                        <MitraCardStory key={`rep-${m.id}`} data={m} />
                    ))}
                </div>
            </div>

            {/* 5. Near You (List Style) */}
            <div className="py-2 px-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-gray-900 dark:text-white text-lg">Paling Deket Rumah 🏠</h2>
                    <button className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-teal-600">
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                {dummyMitra.slice(0, 3).map(m => (
                    <MitraCardList key={m.id} data={m} />
                ))}
            </div>

            {/* 6. Best Rated (Grid/Widget Style) */}
            <div className="py-4 px-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="font-bold text-gray-900 dark:text-white text-lg">Favorit Sekecamatan ❤️</h2>
                        <p className="text-xs text-gray-500">Rating 4.5+ semua nih!</p>
                    </div>
                    <button className="text-teal-600 font-bold text-sm">Lihat Semua</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {dummyMitra.map(m => (
                        <MitraCardWidget key={m.id} data={m} />
                    ))}
                </div>
            </div>

            {/* Bottom Spacing for Floating Nav (if any) */}
            <div className="h-12" />
        </div>
    );
}
