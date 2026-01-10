"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { Menu, X, MessageCircle, Utensils, ShoppingBag, FileText, Gift, Truck, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export default function LayananPage() {
    const [isOpen, setIsOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const toggleMenu = () => setIsOpen(!isOpen)

    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    }

    const services = [
        {
            title: "Makanan & Minuman",
            desc: "Lapar tapi mager? Kami belikan geprek, seblak, boba, atau makanan hits apapun di Sumobito.",
            icon: Utensils,
            bg: "bg-orange-50",
            color: "text-orange-600",
            items: ["Ambil di Warung", "Titip Beli Resto", "Kirim Katering"]
        },
        {
            title: "Paket Olshop",
            desc: "Solusi untuk UMKM! Kami jemput paket di ruma/toko dan antar ke pelanggan sampai depan pintu.",
            icon: ShoppingBag,
            bg: "bg-purple-50",
            color: "text-purple-600",
            items: ["COD Tersedia", "Jemput Gratis", "Laporan Real-time"]
        },
        {
            title: "Dokumen & Berkas",
            desc: "Ketinggalan tugas sekolah? Atau butuh kirim berkas kantor mendadak? Kami ahlinya.",
            icon: FileText,
            bg: "bg-blue-50",
            color: "text-blue-600",
            items: ["Dokumen Penting", "Undangan Nikah", "Tugas Sekolah"]
        },
        {
            title: "Belanja Harian",
            desc: "Perlu sayur di pasar atau obat di apotek? Kirim list belanjaanmu, kami yang cari.",
            icon: Gift,
            bg: "bg-green-50",
            color: "text-green-600",
            items: ["Belanja Pasar", "Tebus Obat", "Minimarket"]
        }
    ]

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
            {/* Navbar */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className={cn(
                    "fixed top-0 z-50 w-full transition-all duration-300 border-b border-transparent",
                    isScrolled ? "bg-white/90 backdrop-blur-md border-gray-100 shadow-sm py-2" : "bg-white/90 backdrop-blur-md py-4"
                )}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
                            <img src="/assets/img/logo.png" alt="Rayo Logo" className="h-8 w-auto" />
                            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-900 text-white">
                                Kurir Lokal Andalan Warga
                            </span>
                        </div>

                        <nav className="hidden md:flex items-center gap-6">
                            {[
                                ["Beranda", "/"],
                                ["Layanan", "/layanan"],
                                ["Cara Order", "/cara-order"],
                                ["Login", "/login"],
                            ].map(([label, href]) => (
                                <Link
                                    key={label}
                                    href={href}
                                    className={cn(
                                        "text-sm font-medium transition-colors hover:text-teal-600 relative group",
                                        label === "Layanan" ? "text-teal-600 font-bold" : "text-gray-700"
                                    )}
                                >
                                    {label}
                                    {label === "Layanan" && <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-teal-600"></span>}
                                </Link>
                            ))}
                            <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-6 shadow-lg shadow-teal-600/20">
                                <a href="https://wa.me/6281234567890" target="_blank">Chat WhatsApp</a>
                            </Button>
                        </nav>

                        <button className="md:hidden p-2 text-gray-900" onClick={toggleMenu}>
                            {isOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </motion.header>

            <main className="pt-32 pb-20">

                {/* Header */}
                <div className="max-w-7xl mx-auto px-4 text-center mb-20">
                    <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                        <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">Bisa Kirim <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">Apa Aja?</span></h1>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto">Kami siap jadi asisten pribadimu. Apapun barangnya, asal aman dan legal, Rayo siap antar.</p>
                    </motion.div>
                </div>

                {/* Service Grid */}
                <section className="max-w-7xl mx-auto px-4 mb-24">
                    <div className="grid md:grid-cols-2 gap-8">
                        {services.map((service, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-gray-50 rounded-[2.5rem] p-8 md:p-12 border border-gray-100 group hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-300"
                            >
                                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300", service.bg.replace('bg-', 'bg-'), service.color)}>
                                    <service.icon size={32} className="fill-current" />
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900 mb-4">{service.title}</h3>
                                <p className="text-lg text-gray-600 mb-8 leading-relaxed">{service.desc}</p>
                                <div className="flex flex-wrap gap-2">
                                    {service.items.map((item, idx) => (
                                        <span key={idx} className="bg-white px-4 py-2 rounded-full text-sm font-medium text-gray-600 border border-gray-200 group-hover:border-teal-100 group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Area Coverage (Simple) */}
                <section className="bg-gray-900 text-white py-24 rounded-[3rem] mx-4 md:mx-8 relative overflow-hidden">
                    <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
                        <MapPin className="mx-auto w-12 h-12 text-teal-400 mb-6" />
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Jangkauan Luas Se-Kecamatan</h2>
                        <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">Kami melayani seluruh desa di Kecamatan Sumobito tanpa terkecuali. Jauh dekat tarif tetap sama!</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {["Sumobito", "Jogoloyo", "Mojoagung (Area)", "Peterongan (Area)", "Menturo", "Curahmalang", "Sebani", "Budugsidorejo"].map((area, i) => (
                                <div key={i} className="px-5 py-2 bg-white/10 rounded-full text-sm font-semibold hover:bg-teal-600 transition-colors cursor-default">
                                    {area}
                                </div>
                            ))}
                            <div className="px-5 py-2 bg-white/5 rounded-full text-sm text-gray-500 italic">
                                + Dan desa lainnya
                            </div>
                        </div>
                    </div>
                </section>

            </main>

            {/* Simplified Footer */}
            <footer className="bg-white text-gray-900 py-12 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <img src="/assets/img/logo.png" alt="Rayo Logo" className="h-8 w-auto mx-auto mb-6" />
                    <div className="flex justify-center gap-6 text-sm text-gray-500">
                        <Link href="/" className="hover:text-teal-600">Beranda</Link>
                        <Link href="/layanan" className="hover:text-teal-600 font-bold">Layanan</Link>
                        <Link href="/cara-order" className="hover:text-teal-600">Cara Order</Link>
                        <Link href="/#faq" className="hover:text-teal-600">FAQ</Link>
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-100 text-xs text-gray-400">
                        &copy; {new Date().getFullYear()} Rayo Kurir.
                    </div>
                </div>
            </footer>
        </div>
    )
}
