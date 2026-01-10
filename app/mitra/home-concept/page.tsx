"use client";

import { Search, MapPin, Bell, Filter, Star, Clock, Heart, ArrowRight, Zap, Flame, Utensils, Coffee, ShoppingBag } from "lucide-react";
import React from "react";

// --- DUMMY DATA ---
const stories = [
    { name: "Bu Sumirah", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100", active: true },
    { name: "Kopi Kenangan", img: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=100", active: true },
    { name: "Cak Gundul", img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=100", active: true },
    { name: "Martabak", img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100", active: false },
    { name: "Es Teh", img: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=100", active: false },
];

const trending = [
    {
        id: 1,
        nama: "Ayam Geprek Bensu",
        rating: 4.8,
        sold: "1.2k+ terjual",
        cover: "https://images.unsplash.com/photo-1562967960-f55ca0347306?w=400",
        promo: "Diskon 50%"
    },
    {
        id: 2,
        nama: "Kopi Janji Jiwa",
        rating: 4.7,
        sold: "850+ terjual",
        cover: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400",
        promo: "B1G1"
    }
];

const openNow = [
    {
        id: 3,
        nama: "Nasi Goreng 69",
        distance: "0.8 km",
        time: "10-15 min",
        cover: "https://images.unsplash.com/photo-1603133872878-684f208fb74b?w=400"
    },
    {
        id: 4,
        nama: "Mie Gacoan",
        distance: "1.2 km",
        time: "20-30 min",
        cover: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400"
    },
    {
        id: 5,
        nama: "Boba Time",
        distance: "0.5 km",
        time: "5-10 min",
        cover: "https://images.unsplash.com/photo-1558350315-8aa00aa3e754?w=400"
    }
];

const nearYou = [
    {
        id: 6,
        nama: "Sate Ayam Ponorogo",
        category: "Indonesian",
        price: "Start 15k",
        rating: 4.9,
        cover: "https://images.unsplash.com/photo-1529563021893-cc83c914d568?w=400"
    },
    {
        id: 7,
        nama: "Burger King",
        category: "Fast Food",
        price: "Start 25k",
        rating: 4.5,
        cover: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400"
    },
    {
        id: 8,
        nama: "Pizza Hut Delivery",
        category: "Italian",
        price: "Start 45k",
        rating: 4.6,
        cover: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400"
    }
];

// --- COMPONENTS ---

// 1. Stories Tray (Instagram Style)
const StoryTray = () => (
    <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide">
        <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-[62px] h-[62px] rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center bg-gray-800">
                <div className="w-[54px] h-[54px] bg-teal-500 rounded-full flex items-center justify-center text-black">
                    <Zap className="w-5 h-5 fill-black" />
                </div>
            </div>
            <span className="text-[10px] text-teal-400 font-bold">Promo</span>
        </div>
        {stories.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                <div className={`w-[62px] h-[62px] p-[2px] rounded-full ${s.active ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500' : 'bg-gray-700'}`}>
                    <div className="w-full h-full rounded-full border-2 border-black overflow-hidden">
                        <img src={s.img} className="w-full h-full object-cover" alt="" />
                    </div>
                </div>
                <span className="text-[10px] text-gray-400 w-16 text-center truncate">{s.name}</span>
            </div>
        ))}
    </div>
);

// 2. Section Header
const SectionTitle = ({ title, subtitle, icon: Icon }: { title: string, subtitle?: string, icon?: any }) => (
    <div className="px-5 mb-3 flex items-end justify-between">
        <div>
            <div className="flex items-center gap-1.5 mb-0.5">
                {Icon && <Icon className="w-4 h-4 text-teal-400" />}
                <h2 className="text-lg font-black text-white tracking-wide">{title}</h2>
            </div>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <button className="text-[10px] font-bold text-teal-400 flex items-center gap-0.5">
            Lihat Semua <ArrowRight className="w-3 h-3" />
        </button>
    </div>
);

// 3. Horizontal Big Card (Trending)
const TrendingCard = ({ data }: { data: typeof trending[0] }) => (
    <div className="w-[280px] h-[160px] rounded-[24px] relative overflow-hidden shrink-0 group">
        <img src={data.cover} className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
            <Flame className="w-3 h-3 fill-white" /> {data.promo}
        </div>

        <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-white font-black text-lg leading-tight mb-1">{data.nama}</h3>
            <div className="flex items-center gap-3 text-[10px] text-gray-300">
                <span className="flex items-center gap-0.5 text-yellow-400 font-bold"><Star className="w-3 h-3 fill-yellow-400" /> {data.rating}</span>
                <span>•</span>
                <span>{data.sold}</span>
            </div>
        </div>
    </div>
);

// 4. Vertical Compact Card (Reference Style Update)
const NearYouCard = ({ data }: { data: typeof nearYou[0] }) => (
    <div className="flex gap-4 p-3 bg-[#151515] rounded-[20px] active:scale-[0.98] transition-transform">
        <div className="w-24 h-24 rounded-[16px] overflow-hidden shrink-0 relative">
            <img src={data.cover} className="w-full h-full object-cover" alt="" />
            <div className="absolute top-1 right-1 w-6 h-6 bg-black/50 backdrop-blur rounded-full flex items-center justify-center">
                <Heart className="w-3 h-3 text-white" />
            </div>
        </div>
        <div className="flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] text-teal-400 uppercase font-bold tracking-wider">{data.category}</span>
                <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-white">{data.rating}</span>
                </div>
            </div>
            <h3 className="text-white font-bold text-base mb-1">{data.nama}</h3>
            <p className="text-gray-500 text-xs mb-3">1.2 km • 15 min</p>
            <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm bg-white/10 px-2 py-0.5 rounded-md">{data.price}</span>
            </div>
        </div>
    </div>
);

// 5. Open Now Widget (Style 10)
const OpenNowCircle = ({ data }: { data: typeof openNow[0] }) => (
    <div className="flex flex-col items-center gap-2 shrink-0 w-[80px]">
        <div className="w-[70px] h-[70px] rounded-[24px] bg-[#222] p-1 relative overflow-hidden group">
            <img src={data.cover} className="w-full h-full object-cover rounded-[20px] opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white bg-black/60 backdrop-blur px-1.5 py-0.5 rounded-md">{data.time}</span>
            </div>
        </div>
        <div className="text-center">
            <h4 className="text-white text-[10px] font-bold truncate w-full leading-tight">{data.nama}</h4>
            <span className="text-[9px] text-gray-500">{data.distance}</span>
        </div>
    </div>
);

// --- MAIN PAGE ---
export default function MitraHomeConcept() {
    return (
        <div className="min-h-screen bg-black text-white pb-24 font-sans">
            {/* 1. Header Sticky */}
            <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 pb-2">
                <div className="px-5 pt-4 pb-2 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 mb-0.5">Lokasi Pengantaran ▾</span>
                        <div className="flex items-center gap-1 text-white font-bold text-sm">
                            <MapPin className="w-3.5 h-3.5 text-teal-400 fill-teal-400" />
                            Sumobito, Jombang
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="w-9 h-9 rounded-full bg-[#222] flex items-center justify-center relative">
                            <Bell className="w-4 h-4 text-white" />
                            <div className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-5 mb-2">
                    <div className="h-11 bg-[#1a1a1a] rounded-[18px] flex items-center px-4 gap-3 border border-white/5">
                        <Search className="w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Mau makan apa hari ini?"
                            className="bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-600 flex-1 font-medium"
                        />
                        <div className="w-[1px] h-5 bg-gray-700" />
                        <Filter className="w-4 h-4 text-teal-400" />
                    </div>
                </div>
            </div>

            {/* 2. Stories Tray */}
            <div className="mt-4 mb-6">
                <StoryTray />
            </div>

            {/* 3. Categories Grid (Compact) */}
            <div className="px-5 grid grid-cols-4 gap-4 mb-8">
                {[
                    { name: "Resto", icon: Utensils, color: "bg-orange-500" },
                    { name: "Coffee", icon: Coffee, color: "bg-amber-700" },
                    { name: "Snack", icon: Zap, color: "bg-yellow-500" },
                    { name: "Mart", icon: ShoppingBag, color: "bg-blue-500" },
                ].map((c, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <div className={`w-14 h-14 rounded-[20px] ${c.color} flex items-center justify-center shadow-lg shadow-${c.color}/20`}>
                            <c.icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-300">{c.name}</span>
                    </div>
                ))}
            </div>

            {/* 4. Trending Banner (Horizontal Scroll) */}
            <div className="mb-8">
                <SectionTitle title="Lagi Rame 🔥" subtitle="Paling banyak dipesan warga Jombang" />
                <div className="flex gap-4 overflow-x-auto px-5 pb-4 scrollbar-hide snap-x">
                    {trending.map((t) => <TrendingCard key={t.id} data={t} />)}
                </div>
            </div>

            {/* 5. Open Now (Small Widgets) */}
            <div className="mb-8 bg-[#111] py-6 -mx-0">
                <SectionTitle title="Buka & Cepat ⚡" subtitle="Datang dalam 30 menit" icon={Clock} />
                <div className="flex gap-4 overflow-x-auto px-5 scrollbar-hide">
                    {openNow.map((o) => <OpenNowCircle key={o.id} data={o} />)}
                </div>
            </div>

            {/* 6. Near You (Vertical List) */}
            <div className="px-5">
                <SectionTitle title="Rekomendasi Sekitarmu" icon={MapPin} />
                <div className="flex flex-col gap-3">
                    {nearYou.map((n) => <NearYouCard key={n.id} data={n} />)}
                </div>
            </div>

            {/* Floating Action Button (Optional) */}
            <div className="fixed bottom-6 right-6">
                <button className="h-14 px-6 bg-teal-500 rounded-full font-bold text-black shadow-[0_8px_20px_-6px_rgba(20,184,166,0.5)] flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    <span className="text-sm">2 Item</span>
                </button>
            </div>
        </div>
    );
}
