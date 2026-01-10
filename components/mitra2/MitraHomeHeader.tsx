"use client";

import React from "react";
import { Search, MapPin, Bell, Sun, Moon, Ticket, Star } from "lucide-react";
import { useTheme } from "next-themes";

export const MitraHomeHeader = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="bg-[#009688] dark:bg-[#115e59] text-white pt-12 pb-6 px-4 rounded-b-[2rem] shadow-lg relative overflow-hidden transition-colors duration-300">
            {/* Decoration Circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
                {/* Top Bar: Search & Theme Toggle */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 font-bold" />
                        <input
                            type="text"
                            placeholder="Cari layanan, makanan, ant..."
                            className="w-full h-10 bg-white rounded-full pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none shadow-sm focus:ring-2 focus:ring-teal-300 transition-all font-medium"
                        />
                    </div>
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm active:scale-95 transition-all outline-none ring-1 ring-white/20 hover:bg-white/30"
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
                    </button>
                    {/* Add Profile Picture here if requested later, keeping standard layout for now with just toggle as requested */}
                </div>

                {/* Location & Notifications */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <p className="text-[10px] text-teal-100 font-bold tracking-widest uppercase mb-0.5">Lokasi Pengantaran</p>
                        <div className="flex items-center gap-1.5 cursor-pointer group hover:bg-white/10 px-2 -ml-2 py-1 rounded-lg transition-colors w-fit">
                            <p className="text-[15px] font-black text-white leading-none tracking-tight group-hover:text-teal-100 transition-colors">Kec. Sumobito</p>
                            <span className="text-teal-200 text-[10px]">▼</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-teal-600 block" />
                        </button>
                    </div>
                </div>

                {/* Info Card (Voucher & Poin) - Replacing Gopay */}
                <div className="bg-white rounded-2xl p-3 flex items-center justify-between shadow-lg shadow-black/5 mt-2">
                    <div className="flex flex-col px-2 border-r border-gray-100 flex-1 cursor-pointer hover:bg-gray-50 rounded-l-xl transition-colors">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <div className="bg-orange-100 p-1 rounded-md text-orange-600">
                                <Ticket className="w-3 h-3" />
                            </div>
                            <span className="text-[10px] font-bold text-gray-500">Voucher</span>
                        </div>
                        <span className="text-gray-900 font-bold text-sm pl-0.5">2 Tersedia</span>
                    </div>
                    <div className="flex flex-col px-2 border-r border-gray-100 flex-1 cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <div className="bg-yellow-100 p-1 rounded-md text-yellow-600">
                                <Star className="w-3 h-3" />
                            </div>
                            <span className="text-[10px] font-bold text-gray-500">Rayo Poin</span>
                        </div>
                        <span className="text-gray-900 font-bold text-sm pl-0.5">2.400 XP</span>
                    </div>
                    <div className="flex-1 px-2 flex items-center justify-center text-[10px] font-bold text-teal-600 cursor-pointer hover:text-teal-700">
                        Lihat Semua
                    </div>
                </div>
            </div>
        </div>
    );
};
