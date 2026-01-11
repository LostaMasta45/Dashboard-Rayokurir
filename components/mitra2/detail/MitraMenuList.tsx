import React from "react";
import { Plus, Minus } from "lucide-react";

interface MenuItem {
    id: number;
    name: string;
    desc: string;
    price: number;
    image?: string;
    category: string;
}

interface MitraMenuListProps {
    items: MenuItem[];
    cart: { [itemId: number]: number };
    onAdd: (item: MenuItem) => void;
    onRemove: (item: MenuItem) => void;
}

export const MitraMenuList = ({ items, cart, onAdd, onRemove }: MitraMenuListProps) => {
    // Group items by category
    const groupedItems = items.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as { [key: string]: MenuItem[] });

    return (
        <div className="pb-24">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
                <div key={category} className="mb-6">
                    <h3 className="font-bold text-lg px-4 mb-3 text-gray-800 dark:text-gray-100 sticky top-[60px] bg-[#F3F4F5] dark:bg-black py-2 z-20">
                        {category}
                    </h3>
                    <div className="space-y-4 px-4">
                        {categoryItems.map(item => {
                            const qty = cart[item.id] || 0;
                            return (
                                <div key={item.id} className="flex gap-3 bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                                    {item.image && (
                                        <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                                            <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                                        </div>
                                    )}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white leading-tight mb-1">{item.name}</h4>
                                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.desc}</p>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="font-bold text-teal-600">Rp {item.price.toLocaleString('id-ID')}</span>

                                            {qty === 0 ? (
                                                <button
                                                    onClick={() => onAdd(item)}
                                                    className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 active:bg-teal-100 transition-colors"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-3 bg-teal-50 dark:bg-teal-900/30 rounded-full px-1 py-1">
                                                    <button
                                                        onClick={() => onRemove(item)}
                                                        className="w-6 h-6 rounded-full bg-white dark:bg-teal-800 text-teal-600 dark:text-teal-200 flex items-center justify-center shadow-sm"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="font-bold text-sm text-teal-700 dark:text-teal-300 min-w-[10px] text-center">{qty}</span>
                                                    <button
                                                        onClick={() => onAdd(item)}
                                                        className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-sm"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};
