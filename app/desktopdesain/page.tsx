"use client";

import { Star, MapPin, Clock, Heart, ArrowRight, Zap, BadgeCheck, Utensils, ShoppingBag, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/auth";

// Dummy Data
const mitra = {
    id: 1,
    nama: "Warung Bu Sumirah",
    lokasi: "Sumobito, Jombang",
    rating: 4.8,
    waktu: "15-25 Mins",
    harga: 10000,
    cover: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60",
    description: "Menyediakan berbagai aneka masakan jawa timur dengan cita rasa yang khas dan harga terjangkau."
};

// --- STYLE 1: Corporate Card (Clean) ---
const Style1 = () => (
    <div className="w-[300px] bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden group">
        <div className="h-[180px] overflow-hidden relative">
            <img src={mitra.cover} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
            <div className="absolute top-3 right-3 bg-white rounded-full px-2 py-1 text-xs font-bold flex items-center gap-1 shadow-sm">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> 4.8
            </div>
        </div>
        <div className="p-4">
            <h3 className="font-bold text-lg text-gray-900 mb-1">{mitra.nama}</h3>
            <p className="text-gray-500 text-sm flex items-center gap-1 mb-3">
                <MapPin className="w-4 h-4" /> {mitra.lokasi}
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                    <span className="text-xs text-gray-400 block">Start from</span>
                    <span className="font-bold text-teal-600">Rp 10.000</span>
                </div>
                <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                    View Menu
                </button>
            </div>
        </div>
    </div>
);

// --- STYLE 2: Dark Mode Premium ---
const Style2 = () => (
    <div className="w-[300px] bg-[#1a1a1a] rounded-2xl overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-2xl shadow-black/50">
        <div className="h-[200px] relative">
            <img src={mitra.cover} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
            <div className="absolute bottom-4 left-4">
                <h3 className="text-2xl font-bold text-white mb-1 leading-none">{mitra.nama}</h3>
                <span className="text-gray-400 text-sm">{mitra.lokasi.split(',')[0]}</span>
            </div>
        </div>
        <div className="p-5 flex justify-between items-center">
            <div className="flex gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Rating</span>
                    <span className="text-white font-bold">4.8</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Time</span>
                    <span className="text-white font-bold">20m</span>
                </div>
            </div>
            <div className="text-right">
                <span className="text-teal-400 font-bold text-lg block">Rp 10k</span>
            </div>
        </div>
    </div>
);

// --- STYLE 3: Horizontal List ---
const Style3 = () => (
    <div className="w-[450px] h-[140px] bg-white rounded-xl p-3 flex gap-4 shadow-sm hover:shadow-lg transition-all border border-gray-100 items-center">
        <div className="w-[120px] h-full rounded-lg overflow-hidden shrink-0">
            <img src={mitra.cover} className="w-full h-full object-cover" alt="" />
        </div>
        <div className="flex-1 py-1 flex flex-col h-full justify-between">
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-800">{mitra.nama}</h3>
                    <Heart className="w-5 h-5 text-gray-300 hover:text-red-500 cursor-pointer" />
                </div>
                <p className="text-gray-500 text-sm mt-1">{mitra.description.substring(0, 50)}...</p>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> 4.8
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span>Rp 10k</span>
                </div>
                <button className="text-teal-600 text-sm font-bold hover:underline">
                    Order Now
                </button>
            </div>
        </div>
    </div>
);

// --- STYLE 4: Brutalist Pop (Desktop) ---
const Style4 = () => (
    <div className="w-[280px] bg-[#FFD60A] border-4 border-black p-4 shadow-[10px_10px_0px_#000000] hover:translate-x-[5px] hover:translate-y-[5px] hover:shadow-[5px_5px_0px_#000000] transition-all cursor-pointer">
        <div className="border-4 border-black h-[180px] mb-4 overflow-hidden relative">
            <img src={mitra.cover} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" alt="" />
        </div>
        <h3 className="font-black text-2xl mb-2 uppercase">{mitra.nama}</h3>
        <div className="flex justify-between items-end border-t-4 border-black pt-4">
            <span className="font-bold text-lg">{mitra.lokasi.split(',')[0]}</span>
            <span className="bg-black text-white px-3 py-1 font-bold text-xl">10K</span>
        </div>
    </div>
);

// --- STYLE 5: Elegant Serif Card ---
const Style5 = () => (
    <div className="w-[300px] h-[400px] bg-[#f5f5f4] rounded-t-full p-6 flex flex-col items-center text-center border border-[#e7e5e4] hover:bg-[#e7e5e4] transition-colors relative">
        <div className="w-[180px] h-[180px] rounded-full overflow-hidden border-4 border-white shadow-xl mb-6 mt-4">
            <img src={mitra.cover} className="w-full h-full object-cover" alt="" />
        </div>
        <h3 className="font-serif text-2xl text-[#292524] mb-2">{mitra.nama}</h3>
        <p className="font-serif italic text-[#78716c] mb-6">{mitra.lokasi}</p>

        <div className="mt-auto w-full flex justify-center">
            <button className="px-8 py-3 rounded-full border border-[#292524] text-[#292524] hover:bg-[#292524] hover:text-white transition-all font-serif">
                Visit Restaurant
            </button>
        </div>
    </div>
);

// --- STYLE 6: Glass Card (Dark) ---
const Style6 = () => (
    <div className="w-[300px] h-[350px] relative rounded-3xl overflow-hidden group">
        <img src={mitra.cover} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

        <div className="absolute inset-0 p-6 flex flex-col justify-end">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-bold text-xl">{mitra.nama}</h3>
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Open</span>
                </div>
                <p className="text-white/80 text-sm mb-4">{mitra.lokasi}</p>
                <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">Rp 10k</span>
                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center cursor-pointer hover:bg-teal-400 border-none">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// --- STYLE 7: Marketplace Grid ---
const Style7 = () => (
    <div className="w-[260px] cursor-pointer group">
        <div className="relative rounded-2xl overflow-hidden mb-3">
            <img src={mitra.cover} className="w-full aspect-[4/3] object-cover" alt="" />
            <div className="absolute top-3 right-3 bg-white rounded-lg px-2 py-1 font-bold text-xs shadow-md">
                4.8 ★
            </div>
            <div className="absolute bottom-3 left-3 bg-teal-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                Mitra Pilihan
            </div>
        </div>
        <h3 className="font-bold text-slate-800 text-lg group-hover:text-teal-600 transition-colors">{mitra.nama}</h3>
        <div className="flex items-center gap-2 text-sm text-slate-500 my-1">
            <Clock className="w-4 h-4" /> 25 min • Free Delivery
        </div>
        <p className="font-semibold text-slate-900">Rp 10.000 <span className="text-slate-400 font-normal text-xs">/ porsi</span></p>
    </div>
);

// --- STYLE 8: Neumorphic Dashboard ---
const Style8 = () => (
    <div className="w-[300px] bg-[#EEF0F4] rounded-[20px] p-6 shadow-[10px_10px_20px_#D1D9E6,-10px_-10px_20px_#FFFFFF] flex flex-col items-center text-center hover:scale-[1.02] transition-transform">
        <div className="w-24 h-24 rounded-full p-1 bg-[#EEF0F4] shadow-[5px_5px_10px_#D1D9E6,-5px_-5px_10px_#FFFFFF] mb-4">
            <img src={mitra.cover} className="w-full h-full object-cover rounded-full" alt="" />
        </div>
        <h3 className="text-gray-700 font-bold text-lg mb-1">{mitra.nama}</h3>
        <p className="text-gray-400 text-xs mb-6">{mitra.lokasi}</p>

        <div className="w-full grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 rounded-xl bg-[#EEF0F4] shadow-[inset_5px_5px_10px_#D1D9E6,inset_-5px_-5px_10px_#FFFFFF]">
                <span className="block text-xl font-bold text-teal-600">4.8</span>
                <span className="text-[10px] text-gray-500">RATING</span>
            </div>
            <div className="p-3 rounded-xl bg-[#EEF0F4] shadow-[inset_5px_5px_10px_#D1D9E6,inset_-5px_-5px_10px_#FFFFFF]">
                <span className="block text-xl font-bold text-teal-600">10k</span>
                <span className="text-[10px] text-gray-500">START</span>
            </div>
        </div>

        <button className="w-full py-3 rounded-xl bg-teal-500 text-white font-bold shadow-[5px_5px_10px_#b8b9be,-5px_-5px_10px_#ffffff] hover:shadow-[inset_3px_3px_6px_#0d9488,inset_-3px_-3px_6px_#2dd4bf] transition-all">
            ORDER NOW
        </button>
    </div>
);

// --- STYLE 9: Minimal Isometric ---
const Style9 = () => (
    <div className="w-[280px] bg-white rounded-none border border-black group hover:-translate-y-2 hover:translate-x-1 hover:shadow-[-8px_8px_0px_#000] transition-all duration-200">
        <div className="p-4 border-b border-black">
            <div className="flex justify-between items-center mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500 border border-black" />
                <span className="font-mono text-xs">ID: #0082</span>
            </div>
            <img src={mitra.cover} className="w-full h-[150px] object-cover border border-black grayscale group-hover:grayscale-0 transition-all" alt="" />
        </div>
        <div className="p-4 bg-gray-50">
            <h3 className="font-mono font-bold text-lg truncate mb-1">{mitra.nama}</h3>
            <p className="font-mono text-xs text-gray-500 mb-4">{mitra.lokasi}</p>
            <button className="w-full py-2 bg-black text-white font-mono text-xs hover:bg-teal-500 hover:text-black hover:border-black border border-transparent transition-colors">
                VIEW DETAILS &gt;
            </button>
        </div>
    </div>
);

// --- STYLE 10: Interactive Mesh ---
const Style10 = () => (
    <div className="w-[300px] h-[340px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1 rounded-3xl hover:scale-105 transition-transform duration-500">
        <div className="w-full h-full bg-slate-900 rounded-[22px] overflow-hidden relative flex flex-col">
            <div className="h-1/2 overflow-hidden">
                <img src={mitra.cover} className="w-full h-full object-cover" alt="" />
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-slate-900/80 to-transparent" />
            </div>

            <div className="flex-1 p-6 relative">
                <div className="absolute -top-8 right-6 w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-pink-500/50">
                    10k
                </div>

                <h3 className="text-white font-bold text-2xl mb-2">{mitra.nama.split(' ')[0]}</h3>
                <div className="flex items-center gap-2 mb-6">
                    <span className="px-2 py-0.5 rounded bg-white/10 text-xs text-white border border-white/10">Food</span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-xs text-white border border-white/10">Drinks</span>
                </div>

                <div className="mt-auto flex justify-between items-center text-gray-400 text-sm">
                    <span>{mitra.lokasi.split(',')[0]}</span>
                    <ExternalLink className="w-5 h-5 text-white hover:text-pink-400 cursor-pointer" />
                </div>
            </div>
        </div>
    </div>
);


export default function DesktopDesignPage() {
    return (
        <div className="min-h-screen bg-slate-50 p-12 w-full overflow-x-hidden">
            <div className="max-w-[1600px] mx-auto">
                <div className="mb-12 text-center">
                    <h1 className="text-5xl font-black text-slate-900 mb-4">Desktop UI Gallery</h1>
                    <p className="text-slate-500 text-xl">10 Distinct styles for 'Mitra' Card (Desktop View)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 justify-items-center">
                    <div className="flex flex-col gap-4 items-center">
                        <span className="font-bold text-slate-300">01. Corporate Clean</span>
                        <Style1 />
                    </div>
                    <div className="flex flex-col gap-4 items-center">
                        <span className="font-bold text-slate-300">02. Dark Premium</span>
                        <Style2 />
                    </div>
                    <div className="flex flex-col gap-4 items-center col-span-1 lg:col-span-2 xl:col-span-2">
                        <span className="font-bold text-slate-300">03. Horizontal List</span>
                        <Style3 />
                    </div>
                    <div className="flex flex-col gap-4 items-center">
                        <span className="font-bold text-slate-300">04. Brutalist Pop</span>
                        <Style4 />
                    </div>
                    <div className="flex flex-col gap-4 items-center">
                        <span className="font-bold text-slate-300">05. Luxury Serif</span>
                        <Style5 />
                    </div>
                    <div className="flex flex-col gap-4 items-center">
                        <span className="font-bold text-slate-300">06. Dark Glass</span>
                        <Style6 />
                    </div>
                    <div className="flex flex-col gap-4 items-center">
                        <span className="font-bold text-slate-300">07. Marketplace</span>
                        <Style7 />
                    </div>
                    <div className="flex flex-col gap-4 items-center">
                        <span className="font-bold text-slate-300">08. Soft Neumorphic</span>
                        <Style8 />
                    </div>
                    <div className="flex flex-col gap-4 items-center">
                        <span className="font-bold text-slate-300">09. Minimal Isometric</span>
                        <Style9 />
                    </div>
                    <div className="flex flex-col gap-4 items-center">
                        <span className="font-bold text-slate-300">10. Interactive Gradient</span>
                        <Style10 />
                    </div>
                </div>
            </div>
        </div>
    );
}
