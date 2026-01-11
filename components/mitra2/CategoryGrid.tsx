import React from "react";
import { Utensils, Coffee, ShoppingBasket, Cookie, Snowflake, Pill, Shirt, Printer, MoreHorizontal } from "lucide-react";

// Helper for squircle icons using CSS clip-path or robust border-radius
const CategoryIcon = ({ icon: Icon, color, label }: { icon: any, color: string, label: string }) => (
    <div className="flex flex-col items-center gap-2 cursor-pointer group active:scale-95 transition-transform w-[22%] shrink-0">
        <div className={`w-14 h-14 rounded-full ${color} flex items-center justify-center shadow-sm text-white relative overflow-hidden ring-1 ring-black/5`}>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Icon className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">{label}</span>
    </div>
);

export const CategoryGrid = () => {
    const categories = [
        { icon: Utensils, color: "bg-orange-500", label: "Makanan" },
        { icon: Coffee, color: "bg-amber-700", label: "Kopi" },
        { icon: ShoppingBasket, color: "bg-green-600", label: "Retail" }, // Sembako/Warung
        { icon: Snowflake, color: "bg-blue-400", label: "Frozen" },
        { icon: Pill, color: "bg-red-500", label: "Apotek" },
        { icon: Shirt, color: "bg-cyan-500", label: "Laundry" },
        { icon: Printer, color: "bg-indigo-500", label: "ATK" },
        { icon: Cookie, color: "bg-pink-500", label: "Kue" },
    ];

    return (
        <div className="flex flex-wrap justify-between gap-y-6 px-4 py-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
            {categories.map((c, i) => (
                <CategoryIcon key={i} {...c} />
            ))}
        </div>
    );
};
