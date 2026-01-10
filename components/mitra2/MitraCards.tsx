import React from "react";
import { Star, MapPin, Clock, Heart, ArrowRight } from "lucide-react";

export interface MitraData {
    id: number;
    nama: string;
    lokasi: string;
    category: string;
    rating: number;
    waktu: string;
    harga: number;
    cover: string;
    isBuka?: boolean;
}

// --- STYLE 1: Native Dark List (For 'Near You') ---
export const MitraCardList = ({ data }: { data: MitraData }) => (
    <div className="w-full h-28 bg-white dark:bg-[#1a1a1a] rounded-[20px] p-2 flex gap-3 relative shrink-0 shadow-sm border border-gray-100 dark:border-gray-800 active:scale-[0.98] transition-all">
        <div className="w-24 h-full rounded-[16px] overflow-hidden shrink-0 relative bg-gray-100">
            <img src={data.cover} className="w-full h-full object-cover" alt={data.nama} />
            <div className="absolute top-1 right-1 bg-black/60 rounded-full p-1 opacity-100">
                <Heart className="w-3 h-3 text-white" />
            </div>
            {!data.isBuka && data.isBuka !== undefined && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">TUTUP</span>
                </div>
            )}
        </div>
        <div className="flex-1 py-1 flex flex-col justify-between">
            <div>
                <h3 className="text-gray-900 dark:text-white font-bold text-sm leading-tight line-clamp-2 mb-1">{data.nama}</h3>
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-[11px]">
                    <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                    <span className="font-bold text-gray-700 dark:text-gray-200">{data.rating}</span>
                    <span>•</span>
                    <span className="truncate">{data.category}</span>
                </div>
            </div>

            <div className="flex items-end justify-between">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400">Harga mulai</span>
                    <span className="text-teal-600 dark:text-teal-400 font-bold text-xs">Rp {data.harga.toLocaleString('id-ID')}</span>
                </div>
                <div className="px-2 py-1 rounded-lg bg-gray-50 dark:bg-white/10 text-[10px] font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {data.waktu}
                </div>
            </div>
        </div>
    </div>
);

// --- STYLE 10: IOS Widget Style (For 'Best Rated') ---
export const MitraCardWidget = ({ data }: { data: MitraData }) => (
    <div className="w-full bg-white dark:bg-[#151515] rounded-[24px] p-3 flex flex-col shadow-sm border border-gray-100 dark:border-gray-800 relative h-[160px] cursor-pointer group">
        <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 p-0.5 shrink-0 overflow-hidden">
                <img src={data.cover} className="w-full h-full object-cover rounded-full" alt="" />
            </div>
            <div className="overflow-hidden">
                <h3 className="font-bold text-xs leading-none truncate text-gray-900 dark:text-white mb-0.5">{data.nama}</h3>
                <p className="text-[10px] text-gray-500 truncate">{data.lokasi}</p>
            </div>
        </div>

        <div className="flex-1 rounded-[18px] overflow-hidden relative">
            <img src={data.cover} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                <div className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg font-bold text-[10px] shadow-sm text-black flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {data.rating}
                </div>
            </div>
        </div>
    </div>
);

// --- STYLE 9: Story Highlight (For 'Categories / Brands') ---
export const MitraCardStory = ({ data }: { data: MitraData }) => (
    <div className="flex flex-col items-center gap-2 shrink-0 snap-center w-[72px] cursor-pointer">
        <div className="w-[68px] h-[68px] bg-gradient-to-tr from-teal-400 to-blue-500 p-[2.5px] rounded-full hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white dark:bg-black rounded-full p-[2px]">
                <img src={data.cover} className="w-full h-full object-cover rounded-full bg-gray-100" alt="" />
            </div>
        </div>
        <span className="text-[11px] text-gray-700 dark:text-gray-300 text-center truncate w-full leading-tight font-medium">{data.nama.split(' ')[0]}</span>
    </div>
);
