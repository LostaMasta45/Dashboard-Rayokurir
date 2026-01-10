"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { Menu, X, MessageCircle, MapPin, Clock, ArrowRight, Wallet, AlertCircle, CheckCircle, ChevronRight, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export default function CaraOrderPage() {
    const [isOpen, setIsOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [copied, setCopied] = useState(false)
    const router = useRouter()

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

    const copyToClipboard = () => {
        const text = `Nama: 
Alamat Jemput: 
Share Lokasi: 
Tujuan Antar: 
Barang: `
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-teal-500 selection:text-white">
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
                                        label === "Cara Order" ? "text-teal-600 font-bold" : "text-gray-700"
                                    )}
                                >
                                    {label}
                                    {label === "Cara Order" && <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-teal-600"></span>}
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
                <div className="max-w-7xl mx-auto px-4 text-center mb-16">
                    <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                        <span className="text-teal-600 font-bold tracking-widest uppercase text-sm bg-teal-50 px-4 py-2 rounded-full border border-teal-100">Panduan Order</span>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mt-6 leading-tight">Gampang Banget, <br />Cuma <span className="text-teal-600">3 Langkah!</span></h1>
                        <p className="text-lg text-gray-500 mt-4 max-w-2xl mx-auto">Nggak perlu install aplikasi berat. Cukup chat WhatsApp, kurir langsung meluncur.</p>
                    </motion.div>
                </div>

                {/* Steps */}
                <section className="max-w-7xl mx-auto px-4 mb-24">
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { num: "01", title: "Chat Admin", desc: "Klik tombol WhatsApp di bawah. Otomatis terhubung ke admin kami yang ramah." },
                            { num: "02", title: "Isi Format", desc: "Isi data pengirim, penerima, dan barang. Bisa kirim Shareloc biar makin akurat." },
                            { num: "03", title: "Duduk Manis", desc: "Kurir akan jemput barangmu dan antar sampai tujuan dengan aman." },
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 relative group hover:shadow-xl transition-all"
                            >
                                <div className="text-6xl font-black text-gray-100 absolute top-4 right-6 pointer-events-none group-hover:text-teal-50 transition-colors">{step.num}</div>
                                <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-6 font-bold text-xl relative z-10 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                    {i + 1}
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4 relative z-10">{step.title}</h3>
                                <p className="text-gray-600 leading-relaxed relative z-10">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Special Section: Format & Tips (Split) */}
                <section className="max-w-7xl mx-auto px-4 mb-24">
                    <div className="grid lg:grid-cols-2 gap-12 items-start">

                        {/* Left: Chat Simulation */}
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl shadow-teal-900/10 border border-gray-100 overflow-hidden"
                        >
                            <div className="bg-teal-600 p-6 flex items-center gap-4 text-white">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">R</div>
                                <div>
                                    <div className="font-bold">Admin Rayo</div>
                                    <div className="text-teal-100 text-xs">Online</div>
                                </div>
                            </div>
                            <div className="p-6 bg-[#E5DDD5] min-h-[400px] space-y-4">
                                <div className="bg-white p-4 rounded-tr-xl rounded-bl-xl rounded-br-xl shadow-sm max-w-[85%]">
                                    Halo kak! Mau kirim paket kemana hari ini? 😄
                                </div>
                                <div className="bg-[#dcf8c6] p-4 rounded-tl-xl rounded-bl-xl rounded-br-xl shadow-sm max-w-[85%] ml-auto">
                                    Mau kirim dokumen ke Kantor Desa Sumobito kak.
                                </div>
                                <div className="bg-white p-4 rounded-tr-xl rounded-bl-xl rounded-br-xl shadow-sm max-w-[85%]">
                                    Oke siap! Boleh diisi formatnya dulu ya kak 👇
                                </div>
                                <div className="bg-white p-4 rounded-tr-xl rounded-bl-xl rounded-br-xl shadow-sm max-w-[95%] border-l-4 border-teal-500">
                                    <p className="font-bold text-gray-800 mb-2">FORMAT ORDER RAYO</p>
                                    <pre className="font-mono text-sm text-gray-600 whitespace-pre-wrap">
                                        {`Nama: 
Alamat Jemput: 
Share Lokasi: 
Tujuan Antar: 
Barang: `}
                                    </pre>
                                    <Button
                                        onClick={copyToClipboard}
                                        variant="outline"
                                        size="sm"
                                        className="mt-4 w-full border-teal-200 text-teal-700 hover:bg-teal-50"
                                    >
                                        {copied ? <CheckCircle size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                                        {copied ? "Tersalin!" : "Salin Format"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right: Tips & Disclaimer */}
                        <div className="space-y-8">
                            <div className="bg-orange-50 p-8 rounded-[2rem] border border-orange-100">
                                <h3 className="text-xl font-bold text-orange-800 mb-4 flex items-center gap-2">
                                    <AlertCircle className="fill-orange-500 text-white" />
                                    Barang yang Dilarang
                                </h3>
                                <ul className="space-y-3 text-orange-900/80">
                                    <li className="flex items-start gap-2">
                                        <span className="text-orange-500">•</span> Narkoba & Obat Terlarang
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-orange-500">•</span> Hewan Hidup (kecuali ikan hias packing aman)
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-orange-500">•</span> Barang mudah meledak / terbakar
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-teal-50 p-8 rounded-[2rem] border border-teal-100">
                                <h3 className="text-xl font-bold text-teal-800 mb-4 flex items-center gap-2">
                                    <CheckCircle className="fill-teal-500 text-white" />
                                    Tips Order Cepat
                                </h3>
                                <ul className="space-y-3 text-teal-900/80">
                                    <li className="flex items-start gap-2">
                                        <span className="text-teal-500 font-bold">1.</span> Kirim Shareloc akurat agar kurir tidak nyasar.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-teal-500 font-bold">2.</span> Pastikan penerima paket stand by di lokasi.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-teal-500 font-bold">3.</span> Siapkan uang pas jika bayar tunai (COD).
                                    </li>
                                </ul>
                            </div>
                        </div>

                    </div>
                </section>

                {/* Footer CTA */}
                <section className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Sudah Siap Kirim?</h2>
                    <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href="https://wa.me/6281234567890"
                        target="_blank"
                        className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-bold text-xl shadow-xl shadow-green-500/30 transition-all"
                    >
                        <MessageCircle size={24} fill="currentColor" />
                        Chat Admin Sekarang
                    </motion.a>
                </section>

            </main>

            {/* Simplified Footer */}
            <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <img src="/assets/img/logo.png" alt="Rayo Logo" className="h-8 w-auto mx-auto mb-6 brightness-0 invert" />
                    <p className="text-gray-500 mb-8 max-w-lg mx-auto">Solusi pengiriman instan warga Sumobito. Cepat, Murah, Amanah.</p>
                    <div className="flex justify-center gap-6 text-sm text-gray-400">
                        <Link href="/" className="hover:text-teal-400">Beranda</Link>
                        <Link href="/layanan" className="hover:text-teal-400">Layanan</Link>
                        <Link href="/cara-order" className="hover:text-teal-400">Cara Order</Link>
                        <Link href="/#faq" className="hover:text-teal-400">FAQ</Link>
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-800 text-xs text-gray-600">
                        &copy; {new Date().getFullYear()} Rayo Kurir.
                    </div>
                </div>
            </footer>
        </div>
    )
}
