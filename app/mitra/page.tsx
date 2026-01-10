"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
    Search,
    ShoppingCart,
    ArrowRight,
    Star,
    MapPin,
    Clock,
    Utensils,
    X,
    Heart,
    Home,
    User,
    FileText,
    ChevronLeft,
    Share2,
    SlidersHorizontal,
    Store,
    Moon,
    Sun,
    Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { getMitra, getMenuItems, type Mitra, type MenuItem, MITRA_CATEGORIES, formatCurrency } from "@/lib/auth";
import { AnimatePresence, motion } from "framer-motion";

// --- Components for Native Mobile Style ---

const MobileBottomNav = ({ active = "home" }) => (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#0f1115]/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 pb-safe pt-3 px-6 flex justify-between items-center z-50 md:hidden shadow-[0_-5px_20px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
        <button className={`flex flex-col items-center gap-1.5 transition-colors relative ${active === 'home' ? 'text-teal-500' : 'text-gray-400 dark:text-gray-500'}`}>
            <Home className={`w-7 h-7 ${active === 'home' ? 'fill-current' : ''}`} />
            {active === 'home' && <span className="absolute -bottom-2.5 w-1.5 h-1.5 bg-teal-500 rounded-full shadow-lg shadow-teal-500/50" />}
        </button>
        <button className="flex flex-col items-center gap-1.5 text-gray-400 dark:text-gray-500 hover:text-teal-500 transition-colors">
            <Heart className="w-7 h-7" />
        </button>
        {/* Floating Cart Button style for Center */}
        <div className="relative -top-10">
            <button className="w-[4.5rem] h-[4.5rem] bg-gradient-to-tr from-teal-500 to-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-teal-500/40 border-[6px] border-[#FAFAFA] dark:border-[#09090b] transform active:scale-95 transition-transform">
                <ShoppingCart className="w-8 h-8" />
            </button>
        </div>
        <button className="flex flex-col items-center gap-1.5 text-gray-400 dark:text-gray-500 hover:text-teal-500 transition-colors">
            <FileText className="w-7 h-7" />
        </button>
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-teal-500 transition-colors">
            <User className="w-7 h-7" />
        </Link>
    </div>
);

const MobileCategoryPill = ({ id, label, isActive, onClick }: any) => {
    return (
        <button
            onClick={onClick}
            className="relative px-6 py-2.5 rounded-full font-bold text-sm transition-all z-0"
        >
            {isActive && (
                <motion.div
                    layoutId="activePill"
                    className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full shadow-lg shadow-teal-500/30 z-[-1]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}
            <span className={isActive ? "text-white" : "text-gray-500 dark:text-gray-400"}>
                {label}
            </span>
            {!isActive && <div className="absolute inset-0 bg-gray-100 dark:bg-[#18181b] rounded-full z-[-2]" />}
        </button>
    );
};

const SubCategoryIcon = ({ emoji, label, color }: { emoji: string, label: string, color: string }) => {
    // Extract base color for squircle background
    const bgClass = color.includes('pink') ? 'bg-[#3b1219] shadow-pink-900/20' :
        color.includes('blue') ? 'bg-[#0f172a] shadow-blue-900/20' :
            color.includes('orange') ? 'bg-[#2a1205] shadow-orange-900/20' :
                color.includes('stone') ? 'bg-[#1c1917] shadow-stone-900/20' :
                    'bg-[#231f10] shadow-yellow-900/20'; // yellow

    return (
        <motion.div
            whileTap={{ scale: 0.9 }}
            className="flex flex-col items-center gap-3 min-w-[80px] cursor-pointer snap-center group"
        >
            <div className={`w-[72px] h-[72px] rounded-[24px] flex items-center justify-center text-3xl shadow-lg ${bgClass} border border-white/10 ring-1 ring-white/5 group-hover:ring-teal-500/50 transition-all`}>
                <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="drop-shadow-md"
                >
                    {emoji}
                </motion.span>
            </div>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 group-hover:text-teal-500 transition-colors">{label}</span>
        </motion.div>
    );
};

const DesktopCategoryPill = ({ id, label, icon, isActive, onClick }: any) => {
    // Groceria Style Pills (Pastel Colors)
    const getColors = (id: string) => {
        switch (id) {
            case 'makanan': return isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600';
            case 'minuman': return isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600';
            case 'retail': return isActive ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' : 'bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-600';
            case 'toko': return isActive ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-white text-gray-600 hover:bg-green-50 hover:text-green-600';
            default: return isActive ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'bg-white text-gray-600 hover:bg-teal-50 hover:text-teal-600';
        }
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 font-medium shadow-sm hover:shadow-md ${getColors(id)}`}
        >
            <span className="text-xl">{icon}</span>
            <span>{label}</span>
        </button>
    );
};

const NativeCard = ({ mitra, onClick }: { mitra: Mitra, onClick: () => void }) => {
    // Revert to colored tints for dark mode (removed the dark green override)
    const getCardColor = (name: string) => {
        const colors = [
            'bg-orange-50 dark:bg-[#1f1610]',
            'bg-blue-50 dark:bg-[#10141f]',
            'bg-purple-50 dark:bg-[#1a101f]',
            'bg-pink-50 dark:bg-[#1f1016]',
            'bg-emerald-50 dark:bg-[#0f1f18]',
            'bg-yellow-50 dark:bg-[#1f1d10]',
        ];
        const index = name.length % colors.length;
        return colors[index];
    };

    return (
        <div
            onClick={onClick}
            className={`rounded-[2.5rem] p-5 shadow-sm border border-black/5 dark:border-white/5 relative group cursor-pointer active:scale-[0.98] transition-all duration-200 ${getCardColor(mitra.nama)}`}
        >
            <div className="relative aspect-[1.1/1] rounded-[2rem] overflow-hidden bg-white/50 mb-5 shadow-inner">
                <img
                    src={mitra.cover || `https://picsum.photos/seed/${mitra.id}/400`}
                    alt={mitra.nama}
                    className="w-full h-full object-cover"
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />

                <button className="absolute top-4 right-4 w-11 h-11 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 hover:bg-white hover:text-red-500 transition-colors shadow-lg active:scale-95">
                    <Heart className="w-5 h-5" />
                </button>

                <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-lg pl-2 pr-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-white shadow-lg border border-white/20">
                    <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    </div>
                    {mitra.waktuAntar?.split(' ')[0] || '15'} Mins
                </div>
            </div>

            <div className="space-y-3 px-1 pb-1">
                <div>
                    <h3 className="font-exrabold text-gray-900 dark:text-white text-xl line-clamp-1 leading-tight tracking-tight">{mitra.nama}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 font-medium mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {mitra.lokasi?.split(',').slice(0, 2).join(',')}
                    </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold bg-white dark:bg-white/5 w-fit px-3 py-2 rounded-xl border border-black/5 dark:border-white/5">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-gray-900 dark:text-white text-sm">{mitra.rating}</span>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Start from</span>
                        <span className="text-teal-600 dark:text-teal-400 font-black text-2xl">
                            Rp 10k
                        </span>
                    </div>
                    <button className="w-12 h-12 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-gray-900 dark:text-white hover:bg-teal-500 hover:text-white transition-all shadow-sm border border-black/5 dark:border-white/5 active:scale-95 active:rotate-45">
                        <ArrowRight className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const DesktopCard = ({ mitra, onClick }: { mitra: Mitra, onClick: () => void }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative bg-white dark:bg-gray-900 rounded-[2rem] p-4 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 dark:border-gray-800 cursor-pointer"
        onClick={onClick}
    >
        <div className="relative aspect-[4/3] rounded-[1.5rem] overflow-hidden bg-gray-100 mb-4">
            <img
                src={mitra.cover || `https://picsum.photos/seed/${mitra.id}/400/300`}
                alt={mitra.nama}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute top-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-bold">{mitra.rating}</span>
            </div>
            <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${mitra.sedangBuka ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {mitra.sedangBuka ? 'Buka' : 'Tutup'}
            </div>
        </div>
        <div className="px-2 pb-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-teal-500 transition-colors">
                {mitra.nama}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate max-w-[150px]">{mitra.lokasi?.split(',')[0]}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <Clock className="w-3.5 h-3.5" />
                <span>{mitra.waktuAntar?.split(' ')[0]} min</span>
            </div>
            <div className="flex items-center justify-between mt-4">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-400">Mulai dari</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">
                        Rp 10.000
                    </span>
                </div>
                <Button
                    size="icon"
                    className="rounded-full w-12 h-12 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-teal-500 dark:hover:bg-teal-500 hover:text-white dark:hover:text-white transition-all shadow-lg hover:shadow-teal-500/30"
                >
                    <ArrowRight className="w-5 h-5" />
                </Button>
            </div>
        </div>
    </motion.div>
);

export default function MitraPage() {
    const { theme, setTheme } = useTheme();
    const [scrolled, setScrolled] = useState(false);
    const [mitraList, setMitraList] = useState<Mitra[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("semua");
    const [mounted, setMounted] = useState(false);

    // Modal & Selection States
    const [selectedMitra, setSelectedMitra] = useState<Mitra | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [cart, setCart] = useState<{ item: MenuItem; qty: number }[]>([]);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        loadData();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await getMitra();
        setMitraList(data);
        setLoading(false);
    };

    const handleMitraClick = async (mitra: Mitra) => {
        setSelectedMitra(mitra);
        const menus = await getMenuItems(mitra.id);
        setMenuItems(menus);
        setIsMenuOpen(true);
    };

    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.item.id === item.id);
            if (existing) {
                return prev.map(i => i.item.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { item, qty: 1 }];
        });
        toast.success(`Ditambahkan: ${item.nama}`, { position: 'bottom-center' });
    };

    const getTotalCart = () => {
        return cart.reduce((total, { item, qty }) => total + (item.harga * qty), 0);
    };

    const handleWhatsAppOrder = () => {
        if (!selectedMitra || cart.length === 0) return;

        let message = `Halo ${selectedMitra.nama}, saya ingin pesan:\n\n`;
        cart.forEach(({ item, qty }) => {
            message += `- ${item.nama} (${qty}x) - ${formatCurrency(item.harga * qty)}\n`;
        });
        message += `\nTotal: *${formatCurrency(getTotalCart())}*`;

        const phoneNumber = selectedMitra.whatsapp || "6281234567890";
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const filteredMitra = mitraList.filter(m => {
        const matchSearch = m.nama.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = selectedCategory === "semua" || m.kategori.includes(selectedCategory);
        return matchSearch && matchCat;
    });

    const categories = [
        { id: "semua", label: "All", icon: "🏠" },
        ...MITRA_CATEGORIES
    ];

    const subCategories = [
        { emoji: "🍰", label: "Dessert", color: "bg-pink-100 dark:bg-pink-500/20 text-pink-600" },
        { emoji: "🍦", label: "Ice Cream", color: "bg-blue-100 dark:bg-blue-500/20 text-blue-600" },
        { emoji: "🍕", label: "Pizza", color: "bg-orange-100 dark:bg-orange-500/20 text-orange-600" },
        { emoji: "☕", label: "Coffee", color: "bg-stone-100 dark:bg-stone-500/20 text-stone-600" },
        { emoji: "🍔", label: "Burger", color: "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600" },
    ];

    // Avoid hydration mismatch for theme
    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090b] font-sans md:bg-[#FDF8F5] md:dark:bg-gray-950 transition-colors duration-500">

            {/* === MOBILE HEADER (Hidden on Desktop) === */}
            <div className={`sticky top-0 z-40 bg-[#FAFAFA] dark:bg-[#09090b] md:hidden transition-all duration-300`}>
                <div className={`bg-gradient-to-br from-teal-500 to-green-600 dark:from-[#022c24] dark:to-[#042f2e] pt-14 pb-8 px-6 rounded-b-[2.5rem] shadow-xl shadow-teal-500/10 relative overflow-hidden`}>

                    {/* Background Pattern Overlay */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

                    <div className="first-line:flex flex-col gap-5 relative z-10">
                        {/* Top Bar: Location & Actions */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-[14px] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 text-white shadow-inner shadow-white/10">
                                    <MapPin className="w-5 h-5 fill-white/20" />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <p className="text-[10px] text-teal-100 font-bold tracking-widest uppercase mb-0.5">Lokasi Pengantaran</p>
                                    <div className="flex items-center gap-1.5 cursor-pointer group">
                                        <p className="text-[15px] font-black text-white leading-none tracking-tight group-hover:text-teal-100 transition-colors">Kec. Sumobito</p>
                                        <span className="text-teal-200 text-[10px]">▼</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10 active:scale-95"
                                >
                                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                </button>
                                <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10 relative active:scale-95">
                                    <Bell className="w-5 h-5" />
                                    <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-400 rounded-full border border-white/20" />
                                </button>
                            </div>
                        </div>

                        {/* Greeting Text */}
                        <div className="space-y-0.5 mt-2">
                            <h1 className="text-3xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
                                Mau cari apa?
                            </h1>
                            <p className="text-sm font-medium text-teal-100/90 tracking-wide">
                                Makanan, minuman, atau belanja harian?
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="relative mt-1">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Cari ayam geprek, kopi, beras..."
                                className="w-full bg-white h-[3.25rem] pl-12 pr-12 rounded-[1.2rem] shadow-[0_8px_20px_-6px_rgba(0,0,0,0.15)] border-none outline-none focus:ring-4 focus:ring-white/20 transition-all placeholder:text-gray-400 text-gray-900 font-semibold text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <button className="w-9 h-9 bg-teal-50 rounded-[14px] flex items-center justify-center text-teal-700 hover:bg-teal-100 transition-colors">
                                    <SlidersHorizontal className="w-4 h-4 text-teal-700 stroke-[2.5]" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* === DESKTOP HEADER (Hidden on Mobile) === */}
            <header className={`hidden md:flex fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
                <div className="container mx-auto px-4 flex items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-xl group-hover:rotate-12 transition-transform">
                            R
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                            Rayo<span className="text-teal-500">Food</span>
                        </span>
                    </Link>
                    <div className="flex-1 max-w-xl relative group">
                        <input
                            type="text"
                            placeholder="Cari makanan, minuman, atau toko..."
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border-none rounded-full shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all placeholder:text-gray-400 group-hover:shadow-md"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="rounded-full hover:bg-teal-50 dark:hover:bg-teal-900/20 text-gray-600 dark:text-gray-300"
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="rounded-full hover:bg-teal-50 dark:hover:bg-teal-900/20 text-gray-600 dark:text-gray-300 relative">
                            <ShoppingCart className="w-6 h-6" />
                            {cart.length > 0 && (
                                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-[#FDF8F5] dark:border-gray-950">
                                    {cart.length}
                                </span>
                            )}
                        </Button>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-400 to-blue-500 p-[2px]">
                            <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5 overflow-hidden">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" className="w-full h-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* === MAIN CONTENT === */}
            <main className="md:pt-24 pb-24 md:pb-12">

                {/* --- MOBILE CONTENT BLOCK --- */}
                <div className="md:hidden space-y-8 px-6 pt-6">
                    {/* Categories */}
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-6 px-6">
                        {categories.map(cat => (
                            <MobileCategoryPill
                                key={cat.id}
                                {...cat}
                                isActive={selectedCategory === cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                            />
                        ))}
                    </div>

                    {/* Sub Categories (Grid Layout) */}
                    <div className="grid grid-cols-4 gap-y-6 gap-x-2 px-2 mt-4">
                        {subCategories.map((sub, i) => <SubCategoryIcon key={i} {...sub} />)}
                    </div>

                    {/* Mobile Banner */}
                    <div className="relative rounded-[2rem] bg-[#1a4d46] dark:bg-[#163833] overflow-hidden min-h-[160px] text-white p-6 flex flex-col justify-center shadow-lg shadow-teal-900/20">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl -mr-10 -mt-10" />
                        <div className="absolute bottom-0 right-10 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl" />
                        <h3 className="text-2xl font-bold leading-tight relative z-10 mb-2">
                            Ongoing Offers <br /> <span className="text-teal-400">You Can't Miss!</span>
                        </h3>
                        <Button size="sm" className="w-fit bg-white text-teal-900 hover:bg-gray-100 rounded-full px-6 font-bold shadow-md z-10">
                            Order Now
                        </Button>
                        <div className="absolute right-[-20px] bottom-[-20px] w-40 h-40">
                            <img
                                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=60"
                                className="w-full h-full object-cover rounded-full border-4 border-[#1a4d46]"
                                alt="Banner Food"
                            />
                        </div>
                    </div>

                    {/* Popular Item (Mobile Grid) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Popular Item</h2>
                            <span className="text-xs text-gray-400 font-medium">See all</span>
                        </div>
                        {loading ? (
                            <div className="grid grid-cols-2 gap-4">
                                {[1, 2].map(i => <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-5">
                                {filteredMitra.map(mitra => (
                                    <NativeCard key={mitra.id} mitra={mitra} onClick={() => handleMitraClick(mitra)} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- DESKTOP CONTENT BLOCK --- */}
                <div className="hidden md:block">
                    {/* Desktop Hero */}
                    <section className="pt-8 pb-20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-orange-100/50 to-transparent dark:from-teal-900/20 -z-10 rounded-l-[100px]" />
                        <div className="container mx-auto px-4">
                            <div className="flex flex-col-reverse md:flex-row items-center gap-12">
                                <div className="flex-1 space-y-6 text-left">
                                    <Badge className="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200 px-4 py-1.5 text-sm rounded-full pointer-events-none">
                                        🚀 Pengiriman Cepat & Aman
                                    </Badge>
                                    <h1 className="text-6xl font-extrabold text-gray-900 dark:text-white leading-[1.15]">
                                        Dari Mitra Pilihan <br />
                                        ke <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-500">Meja Makan</span> Anda
                                    </h1>
                                    <p className="text-lg text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed">
                                        Temukan ribuan menu lezat dari UMKM lokal terbaik di sekitarmu.
                                    </p>
                                    <div className="flex items-center gap-4 pt-2">
                                        <Button size="lg" className="rounded-full bg-teal-600 hover:bg-teal-700 h-14 px-8 text-lg shadow-lg">
                                            Mulai Pesan
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex-1 relative w-full max-w-xl">
                                    <div className="relative aspect-square w-full">
                                        <div className="relative z-10 w-full h-full rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800 rotate-3 hover:rotate-0 transition-all duration-500">
                                            <img
                                                src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop"
                                                alt="Food"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Desktop Categories */}
                    <section className="container mx-auto px-4 mb-12">
                        <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {categories.map((cat) => (
                                <DesktopCategoryPill
                                    key={cat.id}
                                    {...cat}
                                    isActive={selectedCategory === cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                />
                            ))}
                        </div>
                    </section>

                    {/* Desktop Grid */}
                    <section className="container mx-auto px-4 pb-24">
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filteredMitra.map((mitra, idx) => (
                                <DesktopCard key={mitra.id} mitra={mitra} onClick={() => handleMitraClick(mitra)} />
                            ))}
                        </div>
                    </section>
                </div>

            </main>

            {/* Mobile Bottom Nav (Visible only on Mobile) */}
            <MobileBottomNav active="home" />

            {/* Details Modal - Adaptive */}
            <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DialogContent className="p-0 gap-0 overflow-hidden border-none bg-white dark:bg-[#09090b] w-full h-[100dvh] md:max-w-4xl md:h-[85vh] md:rounded-[2rem] flex flex-col">
                    <DialogTitle className="sr-only">Detail Mitra</DialogTitle>
                    {selectedMitra && (
                        <div className="flex flex-col h-full md:flex-row">
                            {/* Banner Image */}
                            <div className="relative h-72 md:h-full md:w-2/5 shrink-0">
                                <img
                                    src={selectedMitra.cover || `https://picsum.photos/seed/${selectedMitra.id}/800/400`}
                                    alt={selectedMitra.nama}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:bg-gradient-to-t md:from-black/80 md:via-black/20" />

                                {/* Mobile Close */}
                                <Button size="icon" variant="ghost" className="absolute top-4 left-4 text-white md:hidden" onClick={() => setIsMenuOpen(false)}>
                                    <ChevronLeft className="w-6 h-6" />
                                </Button>
                                {/* Desktop Close */}
                                <Button size="icon" variant="ghost" className="hidden md:flex absolute top-4 right-4 text-white" onClick={() => setIsMenuOpen(false)}>
                                    <X className="w-6 h-6" />
                                </Button>

                                <div className="absolute bottom-0 left-0 p-6 text-white md:p-8">
                                    <h2 className="text-3xl font-bold mb-2">{selectedMitra.nama}</h2>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-0"><Star className="w-3 h-3 mr-1" /> {selectedMitra.rating}</Badge>
                                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-0"><MapPin className="w-3 h-3 mr-1" /> {selectedMitra.lokasi}</Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Menu Content */}
                            <div className="flex-1 bg-white dark:bg-[#09090b] -mt-6 rounded-t-[2rem] md:mt-0 md:rounded-none z-10 flex flex-col relative overflow-hidden">
                                <ScrollArea className="flex-1">
                                    <div className="p-6 md:p-8 space-y-4 pb-24">
                                        <h3 className="font-bold text-xl flex items-center gap-2 text-gray-900 dark:text-white">
                                            <Utensils className="w-5 h-5 text-teal-500" /> Daftar Menu
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {menuItems.map(menu => (
                                                <div
                                                    key={menu.id}
                                                    className="flex gap-4 p-3 rounded-2xl bg-gray-50 dark:bg-[#18181b] border border-transparent hover:border-teal-200 dark:hover:border-teal-900/30 cursor-pointer transition-all"
                                                    onClick={() => addToCart(menu)}
                                                >
                                                    <div className="w-20 h-20 rounded-xl bg-gray-200 dark:bg-gray-800 overflow-hidden shrink-0">
                                                        <img src={menu.gambar} className="w-full h-full object-cover" alt={menu.nama} />
                                                    </div>
                                                    <div className="flex-1 flex flex-col justify-between">
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">{menu.nama}</h4>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{menu.deskripsi}</p>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-teal-600 dark:text-teal-400">{formatCurrency(menu.harga)}</span>
                                                            <Button size="sm" variant="outline" className="h-7 rounded-full text-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">Add</Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </ScrollArea>

                                {/* Floating Cart Action */}
                                <AnimatePresence>
                                    {cart.length > 0 && (
                                        <motion.div
                                            initial={{ y: 100 }}
                                            animate={{ y: 0 }}
                                            exit={{ y: 100 }}
                                            className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent dark:from-[#09090b] dark:via-[#09090b]"
                                        >
                                            <Button
                                                onClick={handleWhatsAppOrder}
                                                className="w-full h-14 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg shadow-xl shadow-teal-900/20 flex items-center justify-between px-6"
                                            >
                                                <div className="flex items-center gap-2 text-sm font-normal">
                                                    <div className="bg-white/20 px-2 py-0.5 rounded text-white font-bold">{cart.length}</div>
                                                    <span>{formatCurrency(getTotalCart())}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    Pesan Sekarang <ArrowRight className="w-5 h-5" />
                                                </div>
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
}
