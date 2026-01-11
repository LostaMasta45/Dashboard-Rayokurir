import React from "react";
import { Star, Clock, MapPin, MessageCircle } from "lucide-react";

interface MitraDetailHeaderProps {
    data: any; // Type strictly later
}

export const MitraDetailHeader = ({ data }: MitraDetailHeaderProps) => {
    return (
        <div className="relative bg-white dark:bg-gray-900 pb-4 rounded-b-[2rem] shadow-sm mb-2 overflow-hidden">
            {/* Cover Image */}
            <div className="h-48 w-full relative">
                <img src={data.cover} className="w-full h-full object-cover" alt={data.nama} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                {/* Back Button & Share could go here */}
            </div>

            {/* Info Container - Overlapping Cover */}
            <div className="px-5 -mt-12 relative z-10">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1 leading-tight">{data.nama}</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{data.category}</span>
                        <span>•</span>
                        <MapPin className="w-3 h-3" />
                        <span>{data.lokasi}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-3">
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                            <span className="font-bold text-gray-900 dark:text-white">{data.rating}</span>
                            <span className="text-gray-400 text-xs">(50+)</span>
                        </div>
                        <div className="flex items-center gap-1 text-teal-600 font-medium text-xs bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded-full">
                            <Clock className="w-3 h-3" />
                            <span>Buka • 08:00 - 21:00</span>
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex gap-2">
                    <button className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
                        <MessageCircle className="w-4 h-4" />
                        Chat Admin
                    </button>
                    {/* Share Button could go here */}
                </div>
            </div>
        </div>
    );
};
