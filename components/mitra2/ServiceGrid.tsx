import React from "react";
import { Utensils, ShoppingBag, Truck, FileText, Smartphone, MoreHorizontal, Package, Pill, Shirt, Store } from "lucide-react";

// Helper for squircle icons using CSS clip-path or robust border-radius
const ServiceIcon = ({ icon: Icon, color, label }: { icon: any, color: string, label: string }) => (
    <div className="flex flex-col items-center gap-2 cursor-pointer group active:scale-95 transition-transform">
        <div className={`w-14 h-14 rounded-[1.2rem] ${color} flex items-center justify-center shadow-sm text-white relative overflow-hidden`}>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Icon className="w-7 h-7" strokeWidth={2} />
        </div>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight max-w-[4rem]">{label}</span>
    </div>
);

export const ServiceGrid = () => {
    const services = [
        { icon: Package, color: "bg-teal-600", label: "Rayo Antar" },
        { icon: Utensils, color: "bg-orange-500", label: "Rayo Makan" },
        { icon: ShoppingBag, color: "bg-blue-500", label: "Titip Belanja" },
        { icon: Pill, color: "bg-red-500", label: "Obat & Darurat" },
        { icon: FileText, color: "bg-indigo-500", label: "Dokumen" },
        { icon: Shirt, color: "bg-cyan-500", label: "Laundry" },
        { icon: Store, color: "bg-purple-600", label: "Produk UMKM" },
        { icon: MoreHorizontal, color: "bg-gray-100 !text-gray-600 dark:bg-gray-800 dark:!text-gray-400", label: "Lainnya" },
    ];

    return (
        <div className="grid grid-cols-4 gap-y-6 gap-x-2 px-4 py-6 bg-white dark:bg-gray-900 rounded-[2rem] -mt-5 relative z-0 mx-2 shadow-sm border border-gray-100 dark:border-gray-800">
            {services.map((s, i) => (
                <ServiceIcon key={i} {...s} />
            ))}
        </div>
    );
};
