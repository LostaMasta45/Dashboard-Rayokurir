"use client";

import { Star, MapPin, Clock, Heart, ArrowRight, Zap, BadgeCheck, MoreHorizontal, Share2 } from "lucide-react";
import React from "react";

// Dummy Data Scenarios
const mitraData = [
    {
        id: 1,
        nama: "Warung Bu Sumirah",
        lokasi: "Sumobito, Jombang",
        category: "Resto",
        rating: 4.8,
        waktu: "15-25 Mins",
        harga: 10000,
        cover: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60",
        isBuka: true,
    },
    {
        id: 2,
        nama: "Kopi Kenangan Mantan",
        lokasi: "Alun-alun Jombang",
        category: "Coffee",
        rating: 4.5,
        waktu: "10-15 Mins",
        harga: 15000,
        cover: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=500&auto=format&fit=crop&q=60",
        isBuka: true,
    },
    {
        id: 3,
        nama: "Martabak Terang Bulan",
        lokasi: "Pasar Legi",
        category: "Snack",
        rating: 4.9,
        waktu: "25-35 Mins",
        harga: 25000,
        cover: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=60",
        isBuka: false,
    },
    {
        id: 4,
        nama: "Seafood Cak Gundul",
        lokasi: "Diwek, Jombang",
        category: "Seafood",
        rating: 4.7,
        waktu: "30-45 Mins",
        harga: 35000,
        cover: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=60",
        isBuka: true,
    }
];

// --- STYLE 1: The Reference (Dark Native) - LIST VIEW ---
const Style1 = ({ data }: { data: typeof mitraData[0] }) => (
    <div className="w-full h-28 bg-[#1a1a1a] rounded-[20px] p-2 flex gap-3 relative shrink-0">
        <div className="w-24 h-full rounded-[16px] overflow-hidden shrink-0 relative">
            <img src={data.cover} className="w-full h-full object-cover" alt={data.nama} />
            <div className="absolute top-1 right-1 bg-black/60 rounded-full p-1">
                <Heart className="w-3 h-3 text-white" />
            </div>
        </div>
        <div className="flex-1 py-1 flex flex-col">
            <div className="flex justify-between items-start">
                <h3 className="text-white font-bold text-sm leading-tight line-clamp-2">{data.nama}</h3>
                <div className="flex items-center gap-1 bg-[#3a3a3a] px-1.5 py-0.5 rounded-md">
                    <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-[10px] text-white font-bold">{data.rating}</span>
                </div>
            </div>

            <div className="flex items-center gap-1 text-gray-400 text-[10px] mt-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{data.lokasi}</span>
            </div>

            <div className="mt-auto flex items-center justify-between">
                <span className="text-teal-400 font-bold text-xs">Start {data.harga / 1000}k</span>
                <span className="text-[10px] text-gray-500">{data.waktu}</span>
            </div>
        </div>
    </div>
);

// --- STYLE 2: Glassmorphism Vivid - HORIZONTAL ---
const Style2 = ({ data }: { data: typeof mitraData[0] }) => (
    <div className="w-[160px] h-[220px] rounded-[24px] relative overflow-hidden shrink-0 group snap-center">
        <img src={data.cover} className="absolute inset-0 w-full h-full object-cover bg-gray-800" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <div className="absolute top-2 left-2 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-lg text-white text-[9px] font-bold border border-white/20">
            {data.category}
        </div>

        <div className="absolute bottom-0 inset-x-0 p-3 flex flex-col">
            <h3 className="text-white font-black text-sm leading-tight mb-0.5 truncate">{data.nama}</h3>
            <p className="text-white/70 text-[10px] mb-2 flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 shrink-0" /> {data.lokasi}
            </p>

            <div className="flex items-center justify-between">
                <span className="text-teal-300 font-bold text-xs">Rp {data.harga / 1000}k</span>
                <div className="w-6 h-6 bg-white text-black rounded-full flex items-center justify-center">
                    <ArrowRight className="w-3 h-3" />
                </div>
            </div>
        </div>
    </div>
);

// --- STYLE 3: Minimalist Clean (Light) - GRID 2 COL ---
const Style3 = ({ data }: { data: typeof mitraData[0] }) => (
    <div className="w-full bg-white rounded-[16px] p-2 shadow-sm border border-gray-100 flex flex-col">
        <div className="relative w-full aspect-[4/3] rounded-[12px] overflow-hidden mb-2">
            <img src={data.cover} className="w-full h-full object-cover bg-gray-100" alt={data.nama} />
            <div className="absolute bottom-1 right-1 bg-white px-1.5 py-0.5 rounded-md text-[9px] font-bold shadow-sm flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" /> {data.rating}
            </div>
        </div>
        <h3 className="text-gray-900 font-bold text-xs leading-tight mb-0.5 truncate">{data.nama}</h3>
        <p className="text-gray-400 text-[10px] truncate">{data.lokasi}</p>
        <div className="mt-2 flex items-center justify-between">
            <span className="text-gray-900 font-black text-xs">{data.harga / 1000}k</span>
            <button className="w-5 h-5 bg-black rounded-full flex items-center justify-center text-white">
                <ArrowRight className="w-3 h-3" />
            </button>
        </div>
    </div>
);

// --- STYLE 4: Neon Cyberpunk - HORIZONTAL ---
const Style4 = ({ data }: { data: typeof mitraData[0] }) => (
    <div className="w-[140px] h-[180px] bg-[#050505] rounded-[18px] p-[1px] relative shrink-0 bg-gradient-to-br from-cyan-500 to-purple-600 snap-center">
        <div className="w-full h-full bg-[#0a0a0a] rounded-[17px] p-2 flex flex-col relative overflow-hidden">
            <div className="w-full aspect-square rounded-[12px] overflow-hidden mb-2 relative">
                <img src={data.cover} className="w-full h-full object-cover bg-gray-800" alt="" />
                <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
                <span className="absolute bottom-1 left-1 text-cyan-400 text-[10px] font-bold">{data.rating} ★</span>
            </div>

            <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-bold text-xs truncate mb-0.5">{data.nama}</h3>

            <div className="mt-auto flex justify-between items-center">
                <span className="text-xs font-bold text-white">{data.harga / 1000}k</span>
                <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            </div>
        </div>
    </div>
);

// --- STYLE 5: Full Image Stack - LIST STACK ---
const Style5 = ({ data }: { data: typeof mitraData[0] }) => (
    <div className="w-full h-32 relative rounded-[20px] overflow-hidden shrink-0 shadow-md bg-gray-900 mb-2">
        <img src={data.cover} className="w-full h-full object-cover bg-gray-800 opacity-60" alt="" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />

        <div className="absolute inset-y-0 left-0 w-2/3 p-4 flex flex-col justify-center">
            <h3 className="text-lg font-black text-white leading-tight mb-1 line-clamp-2">{data.nama}</h3>
            <p className="text-gray-300 text-[10px] mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {data.waktu}
            </p>
            <span className="text-teal-300 font-bold text-sm">Start Rp {data.harga}</span>
        </div>

        <div className="absolute top-2 right-2">
            <span className={`px-2 py-0.5 rounded-full text-white text-[8px] font-bold ${data.isBuka ? 'bg-green-500' : 'bg-red-500'}`}>
                {data.isBuka ? 'OPEN' : 'CLOSED'}
            </span>
        </div>
    </div>
);

// --- STYLE 6: Soft Neumorphism - GRID 2 COL ---
const Style6 = ({ data }: { data: typeof mitraData[0] }) => (
    <div className="w-full bg-[#e0e5ec] rounded-[20px] p-3 shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff]">
        <div className="w-full aspect-square rounded-[15px] shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] p-1.5 mb-2">
            <img src={data.cover} className="w-full h-full object-cover rounded-[12px] opacity-90 bg-gray-200" alt="" />
        </div>

        <h3 className="text-gray-700 font-bold text-xs mb-1 truncate">{data.nama}</h3>

        <div className="flex items-center justify-between mt-2">
            <span className="text-gray-800 font-black text-xs">{data.harga / 1000}k</span>
            <button className="w-6 h-6 rounded-full bg-[#e0e5ec] shadow-[3px_3px_6px_#b8b9be,-3px_-3px_6px_#ffffff] flex items-center justify-center text-teal-600 active:translate-y-[1px] transition-transform">
                <ArrowRight className="w-3 h-3" />
            </button>
        </div>
    </div>
);

// --- STYLE 7: IG Story Immersive - HORIZONTAL STORIES ---
const Style7 = ({ data }: { data: typeof mitraData[0] }) => (
    <div className="w-[100px] h-[178px] shrink-0 bg-black rounded-[16px] relative overflow-hidden flex flex-col snap-center border border-white/10">
        {/* User Header */}
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1">
            <div className="w-5 h-5 rounded-full border border-white/40 p-[1px]">
                <img src={data.cover} className="w-full h-full rounded-full object-cover" alt="" />
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative">
            <img src={data.cover} className="w-full h-full object-cover opacity-80 bg-gray-900" alt="" />
            <div className="absolute inset-0 bg-black/20" />

            <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-[10px] font-bold leading-tight line-clamp-2 drop-shadow-md">{data.nama}</p>
            </div>
        </div>
    </div>
);

// --- STYLE 8: Elegant Serif - LIST ---
const Style8 = ({ data }: { data: typeof mitraData[0] }) => (
    <div className="w-full bg-[#1c1917] p-3 flex items-center gap-4 border-b border-[#44403c] last:border-0">
        <div className="w-16 h-16 rounded-full border border-[#d6d3d1]/20 shrink-0">
            <img src={data.cover} className="w-full h-full object-cover rounded-full bg-gray-800" alt="" />
        </div>

        <div className="flex-1">
            <h3 className="text-[#d6d3d1] font-serif text-lg leading-none mb-1 italic">{data.nama}</h3>
            <p className="text-[#a8a29e] text-[9px] tracking-[0.1em] uppercase">{data.category} • {data.lokasi}</p>
        </div>

        <div className="flex flex-col items-end">
            <span className="text-[#d6d3d1] font-serif italic text-sm">{data.harga / 1000}k</span>
            <BadgeCheck className="w-3 h-3 text-[#d6d3d1] mt-1" />
        </div>
    </div>
);

// --- STYLE 9: IG Story Highlight - HORIZONTAL CIRCLES ---
const Style9 = ({ data }: { data: typeof mitraData[0] }) => (
    <div className="flex flex-col items-center gap-1.5 shrink-0 snap-center w-[72px]">
        <div className="w-[68px] h-[68px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px] rounded-full">
            <div className="w-full h-full bg-white rounded-full p-[2px]">
                <img src={data.cover} className="w-full h-full object-cover rounded-full bg-gray-100" alt="" />
            </div>
        </div>
        <span className="text-[10px] text-gray-400 text-center truncate w-full leading-tight">{data.nama.split(' ')[0]}</span>
    </div>
);

// --- STYLE 10: IOS Widget Style - MASONRY/GRID ---
const Style10 = ({ data }: { data: typeof mitraData[0] }) => (
    <div className="w-full bg-white rounded-[24px] p-3 flex flex-col shadow-lg relative h-[140px]">
        <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-gray-100 p-0.5 shrink-0">
                <img src={data.cover} className="w-full h-full object-cover rounded-md" alt="" />
            </div>
            <div className="overflow-hidden">
                <h3 className="font-bold text-xs leading-none truncate text-black">{data.nama}</h3>
            </div>
        </div>

        <div className="flex-1 rounded-[16px] overflow-hidden relative">
            <img src={data.cover} className="w-full h-full object-cover opacity-90" alt="" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/80 backdrop-blur px-2 py-1 rounded-full font-bold text-xs shadow-sm text-black">
                    Rp {data.harga / 1000}k
                </div>
            </div>
        </div>
    </div>
);

// --- Layout Wrapper Logic ---
const LayoutWrapper = ({ type, children }: { type: string, children: React.ReactNode }) => {
    if (type === 'list') {
        return <div className="flex flex-col gap-3 w-full px-1">{children}</div>;
    }
    if (type === 'grid') {
        return <div className="grid grid-cols-2 gap-3 w-full px-1">{children}</div>;
    }
    if (type === 'horizontal') {
        return (
            <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 snap-x scrollbar-hide -mx-4 px-4 w-[375px]">
                {children}
            </div>
        );
    }
    return <div>{children}</div>;
};

// --- Main Page Component ---
export default function MobileDesainPage() {
    const styles = [
        { title: "Native Dark List", Component: Style1, layout: 'list' },
        { title: "Glassmorphism Slide", Component: Style2, layout: 'horizontal' },
        { title: "Minimalist Grid", Component: Style3, layout: 'grid' },
        { title: "Neon Cyberpunk Slide", Component: Style4, layout: 'horizontal' },
        { title: "Full Stack List", Component: Style5, layout: 'list' },
        { title: "Neo Grid", Component: Style6, layout: 'grid' },
        { title: "Story Tray", Component: Style7, layout: 'horizontal' },
        { title: "Luxury Menu List", Component: Style8, layout: 'list' },
        { title: "Highlight Circles", Component: Style9, layout: 'horizontal' },
        { title: "Widget Grid", Component: Style10, layout: 'grid' },
    ];

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 sm:p-10 font-sans">
            <h1 className="text-3xl sm:text-4xl font-black mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500 tracking-tight">
                Mobile UI Gallery
            </h1>
            <p className="text-gray-500 text-center mb-10 text-sm">Diverse layouts & styles for Mitra Cards</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
                {styles.map((Style, index) => (
                    <div key={index} className="flex flex-col items-center w-full max-w-[375px]">
                        <div className="w-full flex items-center justify-between mb-4 px-2">
                            <h2 className="text-sm font-bold text-gray-400 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 text-[10px] flex items-center justify-center border border-teal-500/50">{index + 1}</span>
                                {Style.title}
                            </h2>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-gray-500 border border-white/5 uppercase tracking-wide">
                                {Style.layout}
                            </span>
                        </div>

                        {/* Simulation Container (Mobile Width) */}
                        <div className="w-[375px] h-[600px] border-[5px] border-gray-900 bg-[#000] rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col">
                            {/* Status Bar Fake */}
                            <div className="h-8 w-full flex justify-between items-center px-6">
                                <span className="text-[10px] font-bold">9:41</span>
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 bg-white/20 rounded-full" />
                                    <div className="w-3 h-3 bg-white/20 rounded-full" />
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 pt-2">
                                <div className="mb-4">
                                    <h3 className="text-xl font-bold mb-0.5">Explore</h3>
                                    <p className="text-xs text-gray-500">Best places around you</p>
                                </div>

                                <LayoutWrapper type={Style.layout}>
                                    {mitraData.map((mitra) => (
                                        <Style.Component key={mitra.id} data={mitra} />
                                    ))}
                                </LayoutWrapper>
                            </div>

                            {/* Fake Home Indicator */}
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
