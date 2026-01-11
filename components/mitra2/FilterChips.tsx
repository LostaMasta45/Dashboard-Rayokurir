import React from "react";

export const FilterChips = () => {
    const filters = [
        "Buka Sekarang",
        "Promo",
        "Terlaris",
        "Favorit",
        "Rating 4.5+",
        "Harga Hemat",
        "Gratis Titip Beli",
        "Fast < 20 min"
    ];

    return (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3 bg-white dark:bg-black sticky top-[100px] z-40 border-b border-gray-100 dark:border-gray-800/50 backdrop-blur-sm bg-white/90 dark:bg-black/90">
            {filters.map((f, i) => (
                <button
                    key={i}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 active:scale-95 transition-all hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-teal-500 dark:hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400"
                >
                    {f}
                </button>
            ))}
        </div>
    );
};
