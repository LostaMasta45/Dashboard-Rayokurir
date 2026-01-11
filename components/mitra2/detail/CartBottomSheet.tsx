import React, { useState, useEffect } from "react";
import { ShoppingBag, ChevronUp, X, MessageCircle } from "lucide-react";

interface CartItem {
    id: number;
    name: string;
    price: number;
    qty: number;
}

interface CartBottomSheetProps {
    cartItems: CartItem[];
    mitraName: string;
    onCheckout: (notes: string, isTitip: boolean, formData: { name: string, wa: string, address: string }) => void;
}

export const CartBottomSheet = ({ cartItems, mitraName, onCheckout }: CartBottomSheetProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notes, setNotes] = useState("");
    const [isTitip, setIsTitip] = useState(false);

    // Customer Details State
    const [name, setName] = useState("");
    const [wa, setWa] = useState("");
    const [address, setAddress] = useState("");

    const [showSheet, setShowSheet] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShowSheet(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setShowSheet(false), 300); // Wait for transition
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const totalQty = cartItems.reduce((acc, item) => acc + item.qty, 0);
    const totalPrice = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

    if (totalQty === 0) return null;

    return (
        <>
            {/* Floating Bar */}
            <div className={`fixed bottom-4 left-4 right-4 z-40 md:max-w-md md:mx-auto transition-all duration-300 ${isOpen ? 'translate-y-[200%] opacity-0' : 'translate-y-0 opacity-100'}`}>
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full bg-teal-600 text-white rounded-2xl p-4 shadow-xl shadow-teal-900/20 flex items-center justify-between active:scale-[0.98] transition-all"
                >
                    <div className="flex flex-col items-start">
                        <span className="text-xs font-medium text-teal-100">{totalQty} item</span>
                        <span className="font-bold text-lg">Rp {totalPrice.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                        <ShoppingBag className="w-4 h-4" />
                        Lihat Keranjang
                    </div>
                </button>
            </div>

            {/* Bottom Sheet Backdrop */}
            <div className={`fixed inset-0 bg-black/60 z-50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)} />

            {/* Bottom Sheet Panel */}
            <div className={`fixed bottom-0 left-0 right-0 z-50 bg-[#F3F4F5] dark:bg-gray-900 rounded-t-[2rem] max-h-[90vh] overflow-y-auto md:max-w-md md:mx-auto transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 rounded-t-[2rem] flex items-center justify-between z-10 w-full">
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">Keranjang Kamu</h2>
                    <button onClick={() => setIsOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 space-y-4 pb-12">
                    {/* Items List */}
                    <div className="space-y-3 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm">
                        <div className="max-h-[30vh] overflow-y-auto pr-1">
                            {cartItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 last:border-0 pb-2 last:pb-0 mb-2 last:mb-0">
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">{item.name}</h4>
                                        <div className="text-xs text-gray-500">{item.qty} x Rp {item.price.toLocaleString()}</div>
                                    </div>
                                    <span className="font-bold text-sm text-gray-800 dark:text-gray-200">Rp {(item.price * item.qty).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-3 mt-2">
                            <span className="font-bold text-gray-900 dark:text-white">Total Estimasi</span>
                            <span className="font-bold text-teal-600 text-lg">Rp {totalPrice.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    {/* Customer Info Form */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm space-y-3">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                            Data Pengiriman
                            <span className="text-[10px] font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Wajib Diisi</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nama Kamu"
                                className="w-full text-sm p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-teal-500 outline-none text-gray-900 dark:text-white transition-all placeholder:text-gray-400"
                            />
                            <input
                                type="tel"
                                value={wa}
                                onChange={(e) => setWa(e.target.value)}
                                placeholder="No. WhatsApp"
                                className="w-full text-sm p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-teal-500 outline-none text-gray-900 dark:text-white transition-all placeholder:text-gray-400"
                            />
                        </div>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Alamat Lengkap (Desa, RT/RW, Patokan Rumah)"
                            className="w-full text-sm p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-teal-500 outline-none resize-none text-gray-900 dark:text-white transition-all placeholder:text-gray-400"
                            rows={2}
                        />
                    </div>

                    {/* Options */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm space-y-3">
                        <div>
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Catatan Pesanan <span className="font-normal text-gray-400">(Opsional)</span></label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Contoh: Jangan pedes ya bang, banyakin kecap..."
                                className="w-full text-sm p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-teal-500 outline-none resize-none text-gray-900 dark:text-white placeholder:text-gray-400"
                                rows={2}
                            />
                        </div>
                        <label className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                            <input
                                type="checkbox"
                                checked={isTitip}
                                onChange={(e) => setIsTitip(e.target.checked)}
                                className="w-5 h-5 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                            />
                            <div className="flex-1">
                                <span className="font-bold text-sm text-blue-800 dark:text-blue-200 block">Titip Beli Barang Lain?</span>
                                <span className="text-[10px] text-blue-600 dark:text-blue-300">Gratis ongkos titip, cuma bayar barangnya aja.</span>
                            </div>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2">
                        <button
                            onClick={() => onCheckout(notes, isTitip, { name, wa, address })}
                            disabled={!name || !wa || !address}
                            className={`w-full font-bold text-lg py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${(!name || !wa || !address) ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' : 'bg-[#25D366] hover:bg-[#128C7E] text-white shadow-green-900/20'}`}
                        >
                            <MessageCircle className="w-6 h-6" />
                            Kirim Pesanan ke Admin
                        </button>
                        <p className="text-center text-[10px] text-gray-400 mt-3 max-w-[80%] mx-auto leading-tight">
                            Pesanan akan diteruskan ke Mitra setelah dikonfirmasi Admin.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};
