"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, Share2, Search } from "lucide-react";
import Link from "next/link";
import { MitraDetailHeader } from "@/components/mitra2/detail/MitraDetailHeader";
import { MitraMenuList } from "@/components/mitra2/detail/MitraMenuList";
import { CartBottomSheet } from "@/components/mitra2/detail/CartBottomSheet";

// --- DUMMY DATA ---
const dummyMitraDetail = {
    id: 1,
    nama: "Gacoan (Jombang)",
    lokasi: "Jombang",
    category: "Noodle",
    rating: 4.8,
    cover: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=500&q=80",
    menu: [
        { id: 101, name: "Mie Gacoan Level 1", desc: "Mie pedas manis dengan pangsit goreng", price: 12000, category: "Makanan", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&q=80" },
        { id: 102, name: "Mie Hompimpa Level 2", desc: "Mie asin pedas dengan taburan ayam", price: 11000, category: "Makanan", image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=200&q=80" },
        { id: 103, name: "Udang Keju", desc: "Dimsum udang isi keju lumer (3 pcs)", price: 10000, category: "Snack", image: "https://images.unsplash.com/photo-1626803775151-61d756612fcd?w=200&q=80" },
        { id: 104, name: "Udang Rambutan", desc: "Dimsum udang goreng crispy (3 pcs)", price: 10000, category: "Snack" },
        { id: 105, name: "Es Genderuwo", desc: "Es buah segar dengan cincau dan susu", price: 9000, category: "Minuman", image: "https://images.unsplash.com/photo-1500353391678-d7b57973d092?w=200&q=80" },
        { id: 106, name: "Es Pocong", desc: "Es sirsak segar tropical", price: 9000, category: "Minuman" },
    ]
};

export default function MitraDetailPage() {
    const params = useParams();
    // In real app, fetch data based on params.slug or id
    const data = dummyMitraDetail;

    const [cart, setCart] = useState<{ [itemId: number]: number }>({});
    const [activeTab, setActiveTab] = useState("menu");

    const handleAdd = (item: any) => {
        setCart(prev => ({
            ...prev,
            [item.id]: (prev[item.id] || 0) + 1
        }));
    };

    const handleRemove = (item: any) => {
        setCart(prev => {
            const current = prev[item.id] || 0;
            if (current <= 1) {
                const newState = { ...prev };
                delete newState[item.id];
                return newState;
            }
            return { ...prev, [item.id]: current - 1 };
        });
    };

    const handleCheckout = (notes: string, isTitip: boolean, formData: { name: string, wa: string, address: string }) => {
        // Construct WhatsApp Message
        const cartItems = data.menu.filter(item => cart[item.id] > 0).map(item => ({
            ...item,
            qty: cart[item.id]
        }));

        let message = `*[ORDER RAYO KURIR - MITRA]*%0A`;
        message += `Mitra: ${data.nama}%0A`;
        message += `Nama: ${formData.name || '-'}%0A`;
        message += `No WA: ${formData.wa || '-'}%0A`;
        message += `Alamat: ${formData.address || '-'}%0A`;
        message += `Catatan: ${notes || '-'}%0A%0A`;

        message += `*Pesanan:*%0A`;
        let total = 0;
        cartItems.forEach(item => {
            const subtotal = item.price * item.qty;
            total += subtotal;
            message += `- ${item.name} (${item.qty}x) = Rp ${subtotal.toLocaleString('id-ID')}%0A`;
        });

        message += `%0A`;
        message += `Titip Beli: ${isTitip ? 'YA' : 'TIDAK'}%0A`;
        message += `*Total Estimasi: Rp ${total.toLocaleString('id-ID')}*%0A`;
        message += `_Mohon konfirmasi & total akhir + ongkir._`;

        // Direct to WhatsApp
        const adminPhone = "6289523676767"; // Replace with actual admin number
        window.open(`https://wa.me/${adminPhone}?text=${message}`, '_blank');
    };

    const cartItemList = data.menu.filter(item => cart[item.id] > 0).map(item => ({
        ...item,
        qty: cart[item.id]
    }));

    return (
        <div className="min-h-screen bg-[#F3F4F5] dark:bg-black font-sans pb-24 md:max-w-md md:mx-auto md:shadow-2xl md:min-h-screen border-x border-gray-100 dark:border-gray-800">

            {/* Nav Back (Absolute) */}
            <div className="fixed top-0 left-0 right-0 z-50 p-4 md:max-w-md md:mx-auto pointer-events-none">
                <div className="flex justify-between items-center pointer-events-auto">
                    <Link href="/mitra2">
                        <button className="w-10 h-10 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-sm hover:bg-white/60 transition-colors">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    </Link>
                    <button className="w-10 h-10 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-sm hover:bg-white/60 transition-colors">
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <MitraDetailHeader data={data} />

            {/* Tabs */}
            <div className="sticky top-0 z-40 bg-[#F3F4F5] dark:bg-black pt-2 pb-1 px-4 shadow-sm border-b border-gray-200 dark:border-gray-800">
                <div className="flex gap-6 overflow-x-auto scrollbar-hide">
                    {['Menu', 'Info', 'Ulasan'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`pb-3 text-sm font-bold relative transition-colors ${activeTab === tab.toLowerCase() ? 'text-teal-600' : 'text-gray-400'}`}
                        >
                            {tab}
                            {activeTab === tab.toLowerCase() && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="mt-2 min-h-[50vh]">
                {activeTab === 'menu' && (
                    <>
                        {/* Search in Menu */}
                        <div className="px-4 mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari di menu..."
                                    className="w-full h-10 bg-white dark:bg-gray-900 rounded-xl pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                                />
                            </div>
                        </div>

                        <MitraMenuList
                            items={data.menu}
                            cart={cart}
                            onAdd={handleAdd}
                            onRemove={handleRemove}
                        />
                    </>
                )}
                {activeTab === 'info' && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                        <p>Alamat: Jl. Raya Sumobito No. 123</p>
                        <p>Jam Buka: 08:00 - 21:00</p>
                    </div>
                )}
                {activeTab === 'ulasan' && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                        Belum ada ulasan.
                    </div>
                )}
            </div>

            <CartBottomSheet
                cartItems={cartItemList}
                mitraName={data.nama}
                onCheckout={handleCheckout} // Note: need to update this prop signature in component use
            />
        </div>
    );
}
