"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { Menu, X, CheckCircle, Package, Truck, DollarSign, MessageCircle, MapPin, Star, Clock, ShoppingBag, FileText, Utensils, ChevronDown, Zap, ShieldCheck, Store, Pill, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence, Variants } from "framer-motion"

export default function LandingPageLP2() {
    const [isOpen, setIsOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [user, setUser] = useState<any>(null)
    const router = useRouter()

    const WA_LINK = "https://wa.me/6281234567890?text=ORDER%20RAYO%0ANama%3A%0ANo%20WA%3A%0AJenis%20layanan%3A%0APickup%3A%0ADropoff%3A%0AItem%3A"

    useEffect(() => {
        const currentUser = getCurrentUser()
        setUser(currentUser)

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const toggleMenu = () => setIsOpen(!isOpen)

    // Animation Variants
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    }

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut",
            },
        },
    }

    const fadeInUp: Variants = {
        hidden: { opacity: 0, y: 40 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.7, ease: "easeOut" }
        }
    }

    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
        setIsOpen(false)
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-rayo-primary selection:text-white">
            {/* Navbar */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
                className={cn(
                    "fixed top-0 z-50 w-full transition-all duration-300 border-b border-transparent",
                    isScrolled ? "bg-white/90 backdrop-blur-md border-gray-100 shadow-sm py-2" : "bg-transparent py-4 text-white"
                )}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <img
                                src="/assets/img/logo.png"
                                alt="Rayo Logo"
                                className={cn("h-8 w-auto transition-all duration-300", !isScrolled && "brightness-0 invert")}
                            />
                            <span className={cn(
                                "hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                isScrolled ? "bg-gray-900 text-white" : "bg-white text-rayo-dark"
                            )}>
                                Kurir Lokal Andalan Warga
                            </span>
                        </div>

                        {/* Desktop Menu */}
                        <nav className="hidden md:flex items-center gap-6">
                            {[
                                { label: "Layanan", id: "layanan" },
                                { label: "Tarif", id: "tarif" },
                                { label: "Cara Order", id: "cara-order" },
                                { label: "Mitra", id: "mitra" },
                                { label: "Testimoni", id: "testimoni" },
                                { label: "FAQ", id: "faq" },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => scrollToSection(item.id)}
                                    className={cn(
                                        "text-sm font-medium transition-colors hover:text-rayo-primary relative group",
                                        isScrolled ? "text-gray-700" : "text-white/90 hover:text-white"
                                    )}
                                >
                                    {item.label}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-rayo-primary transition-all group-hover:w-full"></span>
                                </button>
                            ))}

                            <Button onClick={() => window.open(WA_LINK)} className={cn(
                                "rounded-full px-6 transition-all transform hover:scale-105 shadow-lg",
                                isScrolled ? "bg-rayo-primary hover:bg-rayo-dark text-white shadow-rayo-primary/30" : "bg-white text-rayo-dark hover:bg-gray-100 shadow-white/20"
                            )}>
                                <MessageCircle size={16} className="mr-2" /> Chat WhatsApp
                            </Button>
                        </nav>

                        {/* Mobile Toggle */}
                        <button className="md:hidden p-2" onClick={toggleMenu}>
                            {isOpen ? <X className={isScrolled ? "text-gray-900" : "text-white"} /> : <Menu className={isScrolled ? "text-gray-900" : "text-white"} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 shadow-lg overflow-hidden"
                        >
                            <div className="px-4 py-4 space-y-4">
                                {[
                                    { label: "Layanan", id: "layanan" },
                                    { label: "Tarif", id: "tarif" },
                                    { label: "Cara Order", id: "cara-order" },
                                    { label: "Mitra", id: "mitra" },
                                    { label: "Testimoni", id: "testimoni" },
                                    { label: "FAQ", id: "faq" },
                                ].map((item) => (
                                    <button key={item.id} onClick={() => scrollToSection(item.id)} className="block w-full text-left text-base font-medium text-gray-700 hover:text-rayo-primary pl-2 border-l-2 border-transparent hover:border-rayo-primary transition-all">
                                        {item.label}
                                    </button>
                                ))}
                                <div className="pt-4 border-t border-gray-100">
                                    <Button onClick={() => window.open(WA_LINK)} className="w-full bg-rayo-primary hover:bg-rayo-dark text-white">
                                        <MessageCircle size={16} className="mr-2" /> Chat WhatsApp
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-br from-rayo-primary to-rayo-dark">
                <div className="absolute inset-0 bg-[url('/assets/img/grid.svg')] opacity-10 animate-pulse"></div>

                {/* Decorative blobs */}
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-20 left-20 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl"
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center lg:text-left">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={containerVariants}
                        >
                            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium text-white mb-6 hover:bg-white/20 transition-colors cursor-default">
                                <span className="w-2 h-2 rounded-full bg-teal-300 animate-ping"></span>
                                <span className="w-2 h-2 rounded-full bg-teal-300 absolute ml-0"></span>
                                RAYO UNTUK WARGA · Sumobito
                            </motion.div>

                            <motion.h1
                                variants={itemVariants}
                                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 tracking-tight"
                            >
                                Kurir Lokal Andalan Warga <br />
                                <motion.span
                                    initial={{ backgroundPosition: "0% 50%" }}
                                    animate={{ backgroundPosition: "100% 50%" }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-white to-teal-200 bg-[length:200%_auto]"
                                >
                                    Cepat, Dekat, Transparan
                                </motion.span>
                            </motion.h1>

                            <motion.p variants={itemVariants} className="text-lg sm:text-xl text-white/90 mb-6 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                                Ongkir mulai <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-white border border-white/10">Rp3.000</span> — antar barang, makanan, dokumen, sampai titip beli. Semua order via WhatsApp Admin.
                            </motion.p>

                            {/* Highlight Chips */}
                            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-8">
                                {[
                                    { label: "Mulai Rp3.000", icon: "💰" },
                                    { label: "Express +Rp2.000", icon: "⚡" },
                                    { label: "Order via WA Admin", icon: "💬" },
                                    { label: "Kurir Warga Lokal", icon: "🏘️" },
                                ].map((chip, i) => (
                                    <span key={i} className="bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full text-sm font-medium text-white hover:bg-teal-500/20 hover:border-teal-400/50 transition-all cursor-default">
                                        {chip.icon} {chip.label}
                                    </span>
                                ))}
                            </motion.div>

                            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                                <Button onClick={() => window.open(WA_LINK)} className="w-full sm:w-auto h-14 px-8 bg-white text-teal-700 hover:text-white hover:bg-gradient-to-r hover:from-teal-500 hover:to-teal-600 font-bold text-lg rounded-2xl shadow-xl shadow-black/5 hover:shadow-teal-500/30 transition-all duration-300 hover:-translate-y-1">
                                    Chat WhatsApp Sekarang <ArrowRight size={20} className="ml-2" />
                                </Button>
                                <Button onClick={() => scrollToSection("cara-order")} variant="outline" className="w-full sm:w-auto h-14 px-8 border-white/30 bg-white/10 text-white hover:bg-white/20 font-medium text-lg rounded-2xl backdrop-blur-sm transition-all hover:scale-105 hover:border-white/50">
                                    Lihat Cara Order
                                </Button>
                            </motion.div>

                            <motion.p variants={itemVariants} className="text-xs text-white/60 mt-6 max-w-lg mx-auto lg:mx-0">
                                *Titip Beli Gratis: ≤Rp100.000, 1 toko, antre ≤10 menit. Di atas itu admin konfirmasi DP/waiting fee.
                            </motion.p>
                        </motion.div>

                        {/* Mascot Image */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, x: 50 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                            className="relative mx-auto lg:ml-auto w-full max-w-md lg:max-w-full group hidden lg:block"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700"></div>
                            <img
                                src="/assets/img/lp1.png"
                                alt="Ilustrasi Rayo Kurir"
                                className="w-full h-auto drop-shadow-2xl relative z-10 transform transition-transform duration-700 hover:scale-[1.02]"
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Trust Strip */}
            <section className="py-6 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-gray-600 font-medium">
                        <span className="flex items-center gap-2"><CheckCircle size={18} className="text-teal-500" /> Transparan (Jemput + Antar)</span>
                        <span className="flex items-center gap-2"><CheckCircle size={18} className="text-teal-500" /> Pembayaran Cash/Transfer</span>
                        <span className="flex items-center gap-2"><CheckCircle size={18} className="text-teal-500" /> Admin konfirmasi total final</span>
                    </div>
                </div>
            </section>

            {/* Layanan Section */}
            <section id="layanan" className="py-24 bg-gray-50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                    <div className="absolute right-0 top-0 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl"></div>
                    <div className="absolute left-0 bottom-0 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <span className="text-teal-600 font-bold tracking-widest uppercase text-sm bg-teal-50 px-4 py-2 rounded-full border border-teal-100">Serba Bisa</span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-6 tracking-tight">Bisa Kirim Apa Aja?</h2>
                        <p className="text-xl text-gray-500 mt-4 max-w-2xl mx-auto">Dari urusan kecil sampai mendadak — Rayo siap bantu di sekitar Sumobito dan sekitarnya.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: "Antar Makanan & Minuman", desc: "Mager? Tinggal chat admin. Kami jemput dari warung/penjual favoritmu.", icon: Utensils, from: "from-orange-400", to: "to-red-500", shadow: "shadow-orange-500/20" },
                            { title: "Paket & Olshop Lokal", desc: "Jemput paket dari rumah/toko, antar ke customer. Cocok buat seller harian.", icon: ShoppingBag, from: "from-purple-500", to: "to-indigo-600", shadow: "shadow-purple-500/20" },
                            { title: "Dokumen Penting", desc: "Berkas sekolah/kampus/kantor, undangan, dokumen urgent.", icon: FileText, from: "from-blue-400", to: "to-cyan-500", shadow: "shadow-blue-500/20" },
                            { title: "Belanja Warung / Retail", desc: "Warung madura, toko kelontong, minimarket — tinggal tulis daftar belanja.", icon: Store, from: "from-green-400", to: "to-emerald-500", shadow: "shadow-green-500/20" },
                            { title: "Apotek & Keperluan Harian", desc: "Obat, vitamin, kebutuhan bayi, barang urgent rumah.", icon: Pill, from: "from-red-400", to: "to-pink-500", shadow: "shadow-red-500/20" },
                            { title: "Antar Barang Express", desc: "Butuh cepat? Tambah Express +Rp2.000 untuk prioritas.", icon: Zap, from: "from-yellow-400", to: "to-orange-500", shadow: "shadow-yellow-500/20" },
                            { title: "Barang Berat / Besar", desc: "Galon, gas, beras? Bisa — ada add-on barang berat.", icon: Package, from: "from-gray-500", to: "to-slate-600", shadow: "shadow-gray-500/20" },
                            { title: "Multi-stop", desc: "Sekalian beberapa tujuan? Bisa — ada add-on multi-stop.", icon: MapPin, from: "from-teal-400", to: "to-cyan-600", shadow: "shadow-teal-500/20" },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                variants={fadeInUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className={cn("group relative bg-white rounded-2xl p-1 shadow-xl transition-all duration-300", item.shadow)}
                            >
                                <div className="bg-white rounded-xl p-6 h-full flex flex-col relative overflow-hidden">
                                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500", item.from, item.to)}></div>
                                    <div className={cn("w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 text-white shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300", item.from, item.to)}>
                                        <item.icon size={28} strokeWidth={2} />
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <p className="text-center text-gray-500 mt-10 text-sm">
                        Chat Admin untuk cek bisa/tidaknya ordermu →{" "}
                        <button onClick={() => window.open(WA_LINK)} className="text-teal-600 font-bold hover:underline">WhatsApp</button>
                    </p>
                </div>
            </section>

            {/* Kenapa Pilih Rayo Section */}
            <section className="py-24 bg-white relative">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="bg-gray-900 rounded-[3rem] p-8 md:p-16 text-white shadow-2xl relative overflow-hidden border border-gray-800">
                        {/* Background Effects */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[120px] pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                        <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
                            <div>
                                <span className="text-teal-400 font-bold tracking-widest uppercase text-xs mb-2 block">Kenapa Harus Rayo?</span>
                                <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Warga Memilih <br /> <span className="text-teal-400">Rayo Kurir</span></h2>
                                <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                                    Lebih sederhana dari aplikasi, tapi tetap rapi dan transparan. Admin bantu format order, estimasi, konfirmasi stok/total final.
                                </p>
                                <div className="flex gap-4">
                                    <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
                                        <div className="text-3xl font-bold text-white">3rb</div>
                                        <div className="text-xs text-gray-400 uppercase font-bold mt-1">Mulai</div>
                                    </div>
                                    <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
                                        <div className="text-3xl font-bold text-white">100%</div>
                                        <div className="text-xs text-gray-400 uppercase font-bold mt-1">Lokal</div>
                                    </div>
                                    <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
                                        <div className="text-3xl font-bold text-white">0%</div>
                                        <div className="text-xs text-gray-400 uppercase font-bold mt-1">Ribet</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                                <div className="space-y-5">
                                    {[
                                        { label: "Ongkir Mulai Rp3.000", desc: "Buat jarak dekat (500m–1km) tetap worth it.", icon: "💰" },
                                        { label: "Tarif Transparan", desc: "Admin kasih breakdown: jemput + antar + add-on.", icon: "✅" },
                                        { label: "Express +Rp2.000", desc: "Prioritas saat ada driver tersedia.", icon: "⚡" },
                                        { label: "Titip Beli Gratis (S&K)", desc: "Gratis untuk order ringan.", icon: "🛒" },
                                        { label: "Kurir Warga Lokal", desc: "Lebih aman, ngerti jalan kampung.", icon: "🏘️" },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-4">
                                            <div className="text-2xl">{item.icon}</div>
                                            <div>
                                                <div className="text-white font-bold">{item.label}</div>
                                                <div className="text-gray-400 text-sm">{item.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tarif Section */}
            <section id="tarif" className="py-20 bg-rayo-light/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rayo-primary/5 rounded-bl-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-rayo-secondary/5 rounded-tr-full pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="text-center mb-12"
                    >
                        <span className="text-rayo-primary font-bold tracking-wider uppercase text-sm bg-rayo-primary/10 px-3 py-1 rounded-full">Tarif Terjangkau</span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-4 mb-4 leading-tight">Ongkir Mulai <span className="text-rayo-dark text-5xl">Rp3.000!</span></h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Estimasi dihitung dari rute: Jemput (Basecamp→Pickup) + Antar (Pickup→Dropoff). Pas buat jarak dekat.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {[
                            { title: "Minimum Ongkir", price: "Rp3.000", color: "bg-teal-50 border-teal-200", priceColor: "text-teal-600" },
                            { title: "Express (Prioritas)", price: "+Rp2.000", color: "bg-yellow-50 border-yellow-200", priceColor: "text-yellow-600" },
                            { title: "Titip Beli ≤Rp100k", price: "GRATIS", color: "bg-green-50 border-green-200", priceColor: "text-green-600" },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.05, y: -5 }}
                                className={cn("p-8 rounded-3xl border-2 text-center shadow-lg", item.color)}
                            >
                                <div className={cn("text-4xl font-black mb-2", item.priceColor)}>{item.price}</div>
                                <div className="text-sm text-gray-600 font-medium">{item.title}</div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <Button onClick={() => window.open(WA_LINK)} className="h-14 px-10 bg-rayo-dark hover:bg-rayo-primary text-white rounded-2xl shadow-xl font-bold text-lg">
                            Cek Estimasi Ongkir via WhatsApp
                        </Button>
                        <p className="text-xs text-gray-400 mt-4">
                            Catatan: untuk belanja besar / antre lama, admin akan konfirmasi DP dan/atau waiting fee.
                        </p>
                    </div>
                </div>
            </section>

            {/* Cara Order Section */}
            <section id="cara-order" className="py-20 bg-gray-50 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeInUp}
                        >
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Cara Order</h2>
                            <p className="text-lg text-gray-500 mb-8">Gampang Banget</p>
                            <div className="space-y-8">
                                {[
                                    { step: 1, title: "Chat Admin", desc: "Klik WhatsApp, kirim format order." },
                                    { step: 2, title: "Admin Konfirmasi", desc: "Admin hitung estimasi + breakdown. Untuk titip beli/retail, admin konfirmasi stok & total final." },
                                    { step: 3, title: "Driver Jalan", desc: "Driver terdekat berangkat. Update singkat: berangkat / sampai pickup / OTW / selesai." },
                                    { step: 4, title: "Beres", desc: "Bayar cash/transfer. Aman, jelas, selesai." },
                                ].map((item, index) => (
                                    <motion.div
                                        key={item.step}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.15 }}
                                        className="flex gap-6 group"
                                    >
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full bg-white border-2 border-rayo-primary text-rayo-primary flex items-center justify-center font-bold text-xl flex-shrink-0 z-10 relative group-hover:bg-rayo-primary group-hover:text-white transition-colors">
                                                {item.step}
                                            </div>
                                            {index !== 3 && <div className="absolute top-12 left-6 w-0.5 h-full bg-gray-200 -translate-x-1/2 -z-0"></div>}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-xl mb-2">{item.title}</h3>
                                            <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <MessageCircle size={100} />
                                </div>
                                <div className="flex justify-between items-center mb-6 relative z-10">
                                    <h3 className="font-bold text-gray-900 text-xl">Format Order</h3>
                                    <span className="text-rayo-primary text-sm font-medium bg-rayo-light px-3 py-1 rounded-md">Copy & Paste</span>
                                </div>
                                <pre className="bg-gray-50 p-6 rounded-2xl text-sm font-mono text-gray-700 whitespace-pre-wrap border border-gray-200 relative z-10">
                                    {`ORDER RAYO
Nama:
No WA:
Jenis layanan: (Antar Barang / Titip Beli / Express)
Pickup (alamat + patokan):
Dropoff (alamat + patokan):
Item / Daftar belanja:
Toko tujuan (jika titip beli):
Total belanja (perkiraan, opsional):
Metode bayar: (Cash / Transfer)
Catatan:`}
                                </pre>
                                <div className="mt-6">
                                    <Button onClick={() => window.open(WA_LINK)} className="w-full h-12 bg-rayo-primary hover:bg-rayo-dark text-white rounded-xl font-bold">
                                        <MessageCircle size={18} className="mr-2" /> Copy & Chat Admin
                                    </Button>
                                </div>
                            </div>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="mt-8 bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-2xl shadow-lg"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-full">
                                        <Clock className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">Jam Operasional</h3>
                                        <p className="text-gray-300 text-sm">07.00 – 21.00 WIB • Respon cepat selama admin online</p>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Mitra Section */}
            <section id="mitra" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="text-teal-600 font-bold tracking-widest uppercase text-sm bg-teal-50 px-4 py-2 rounded-full border border-teal-100">Mitra Rayo</span>
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-6 mb-4">Warung, Retail, & UMKM Lokal</h2>
                            <p className="text-gray-600 mb-6 text-lg">Klik mitra favoritmu, pilih item/menu, lalu order otomatis ke WhatsApp Admin.</p>

                            <ul className="space-y-3 mb-8">
                                {["Warung makan & jajanan", "Toko kelontong / warung madura", "Minimarket / retail", "Apotek & kebutuhan harian"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-gray-700">
                                        <CheckCircle size={18} className="text-teal-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <Button onClick={() => router.push("/mitra2")} className="h-14 px-8 bg-rayo-dark hover:bg-rayo-primary text-white rounded-2xl shadow-lg font-bold text-lg">
                                Lihat Katalog Mitra <ArrowRight size={18} className="ml-2" />
                            </Button>

                            <p className="text-xs text-gray-400 mt-4">
                                Belanja retail bisa pakai "tulis daftar belanja". Admin konfirmasi total final dulu ya.
                            </p>
                        </div>

                        <div className="relative">
                            <div className="bg-gradient-to-br from-teal-100 to-emerald-100 rounded-3xl p-12 aspect-square flex items-center justify-center">
                                <div className="grid grid-cols-2 gap-6">
                                    {[Store, Utensils, ShoppingBag, Pill].map((Icon, i) => (
                                        <motion.div
                                            key={i}
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                            className="bg-white w-24 h-24 rounded-2xl flex items-center justify-center shadow-xl"
                                        >
                                            <Icon size={40} className="text-teal-600" />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimoni Section */}
            <section id="testimoni" className="py-20 relative bg-gray-50">
                <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl font-extrabold text-gray-900">Kata Warga Tentang Rayo</h2>
                        <div className="w-20 h-1.5 bg-rayo-primary mx-auto mt-4 rounded-full"></div>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={containerVariants}
                        className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        {[
                            { quote: "Cuma kirim barang 600 meter, akhirnya gak kemahalan. Mulai 3 ribuan, mantap!", author: "Dina", loc: "Sumobito" },
                            { quote: "Adminnya gercep, dikasih rincian ongkirnya jadi jelas.", author: "Raka", loc: "Kesamben" },
                            { quote: "Titip beli enak, gak ribet chat toko. Tinggal admin yang urus.", author: "Yuni", loc: "Sumobito" },
                            { quote: "Kurirnya ngerti jalan kampung, cepet nyampe.", author: "Bagas", loc: "Sumobito" },
                        ].map((t, i) => (
                            <motion.div
                                key={i}
                                variants={itemVariants}
                                whileHover={{ y: -10 }}
                                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden group"
                            >
                                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-rayo-primary to-rayo-dark opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex gap-1 text-yellow-400 mb-4">
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-4 w-4 fill-current" />)}
                                </div>
                                <p className="text-gray-700 italic mb-4 text-sm leading-relaxed">"{t.quote}"</p>
                                <div className="text-sm text-gray-500 font-medium">— {t.author}, {t.loc}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-20 bg-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }}></div>

                <div className="max-w-3xl mx-auto px-4 relative z-10">
                    <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-4">FAQ</h2>
                    <p className="text-gray-500 text-center mb-12">Pertanyaan yang Sering Ditanyakan</p>
                    <div className="space-y-4">
                        {[
                            { q: "Bisa bayar di tempat?", a: "Bisa. Pembayaran ongkir bisa Cash atau Transfer. Untuk titip beli/retail, admin konfirmasi total final sebelum diproses." },
                            { q: "Titip beli gratis itu gimana?", a: "Titip Beli GRATIS untuk ≤Rp100.000, 1 toko, antre ≤10 menit. Jika belanja besar / antre lama, admin konfirmasi DP atau waiting fee." },
                            { q: "Express itu gimana?", a: "Express +Rp2.000 = diproses lebih dulu saat ada driver tersedia. Jika driver sedang penuh, order express jadi prioritas berikutnya." },
                            { q: "Ongkir kok bisa mulai Rp3.000?", a: "Karena untuk jarak dekat, minimum ongkir kami Rp3.000. Untuk jarak lebih jauh, admin hitung transparan berdasarkan rute." },
                            { q: "Area layanan sampai mana?", a: "Fokus se-Kecamatan Sumobito dan sekitarnya. Chat admin untuk cek coverage." }
                        ].map((item, i) => (
                            <details key={i} className="group bg-gray-50 rounded-2xl open:bg-white open:shadow-lg open:ring-1 open:ring-black/5 transition-all duration-300">
                                <summary className="flex cursor-pointer items-center justify-between p-6 font-bold text-gray-900 marker:content-none">
                                    {item.q}
                                    <ChevronDown className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180" />
                                </summary>
                                <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                                    {item.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 px-4 bg-gray-50">
                <div className="max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-black rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/img/grid.svg')] opacity-10"></div>
                    <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-teal-500/30 rounded-full blur-[100px]"></div>

                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Siap Dibantu Hari Ini?</h2>
                        <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
                            Klik WhatsApp — admin bantu hitung estimasi dan proses ordermu.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button onClick={() => window.open(WA_LINK)} className="h-14 px-10 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-teal-500/30">
                                <MessageCircle size={20} className="mr-2" /> Chat WhatsApp Sekarang
                            </Button>
                            <Button onClick={() => router.push("/mitra2")} variant="outline" className="h-14 px-8 rounded-2xl text-white border-white/30 hover:border-white hover:bg-white/10">
                                Lihat Katalog Mitra
                            </Button>
                        </div>
                        <p className="text-sm text-gray-500 mt-6">Jam operasional: 07.00 – 21.00 WIB • Respon cepat selama admin online</p>
                    </div>
                </div>
            </section>

            {/* Floating WhatsApp Button (Mobile Only) */}
            <motion.a
                href={WA_LINK}
                target="_blank"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, type: "spring" }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden bg-gray-900/90 backdrop-blur-md text-white py-3 px-6 rounded-full shadow-2xl shadow-black/20 flex items-center gap-3 border border-white/10 active:scale-95 transition-all w-[90%] max-w-sm justify-center"
            >
                <div className="bg-green-500 rounded-full p-1.5 animate-pulse">
                    <MessageCircle size={20} fill="currentColor" />
                </div>
                <span className="font-bold text-lg">Chat WhatsApp Admin</span>
            </motion.a>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-16 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-12 mb-16">
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <img src="/assets/img/logo.png" alt="Rayo Logo" className="h-10 w-auto brightness-0 invert" />
                            </div>
                            <p className="text-gray-400 leading-relaxed mb-6">
                                Kurir Lokal Andalan Warga Sumobito. Ongkir mulai Rp3.000, transparan, dan aman.
                            </p>
                            <div className="flex gap-4">
                                {[1, 2, 3].map(i => <div key={i} className="w-10 h-10 bg-white/5 rounded-full hover:bg-rayo-primary transition-colors cursor-pointer"></div>)}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-lg mb-6 text-white">Kontak</h4>
                            <ul className="space-y-4 text-gray-400">
                                <li className="flex gap-3 items-start"><MapPin className="h-5 w-5 text-rayo-primary mt-0.5" /> Basecamp Ds. Sumobito, Jombang</li>
                                <li className="flex gap-3 items-center"><MessageCircle className="h-5 w-5 text-rayo-primary" /> +62 8XX-XXXX-XXXX</li>
                                <li className="flex gap-3 items-center"><Clock className="h-5 w-5 text-rayo-primary" /> 07.00 - 21.00 WIB</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-lg mb-6 text-white">Tautan Cepat</h4>
                            <ul className="space-y-3 text-gray-400">
                                <li><button onClick={() => scrollToSection("layanan")} className="hover:text-rayo-primary transition-colors">Layanan</button></li>
                                <li><button onClick={() => scrollToSection("tarif")} className="hover:text-rayo-primary transition-colors">Cek Tarif</button></li>
                                <li><button onClick={() => scrollToSection("cara-order")} className="hover:text-rayo-primary transition-colors">Cara Order</button></li>
                                <li><Link href="/login" className="hover:text-rayo-primary transition-colors">Login Admin / Kurir</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
                        <p>© 2026 Rayo Kurir. Kurir Lokal Andalan Warga Sumobito.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
