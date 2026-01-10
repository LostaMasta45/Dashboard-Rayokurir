"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Zap, ShieldCheck, MapPin, Package, MessageCircle, Star, CheckCircle, XCircle, ShoppingBag, FileText, Utensils } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, useScroll, useSpring, useMotionValue, useTransform, AnimatePresence } from "framer-motion"

// --- COMPONENTS ---

function TiltCard({ children, className }: { children: React.ReactNode, className?: string }) {
    const ref = useRef<HTMLDivElement>(null)
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 })
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 })

    function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect()
        x.set(clientX - left - width / 2)
        y.set(clientY - top - height / 2)
    }

    function onMouseLeave() {
        x.set(0)
        y.set(0)
    }

    const rotateX = useTransform(mouseY, [-200, 200], [5, -5])
    const rotateY = useTransform(mouseX, [-200, 200], [-5, 5])

    return (
        <motion.div
            ref={ref}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className={cn("relative transition-all duration-200 ease-out", className)}
        >
            {children}
        </motion.div>
    )
}

function ShinyButton({ children, className, onClick, variant = "primary" }: { children: React.ReactNode, className?: string, onClick?: () => void, variant?: "primary" | "outline" | "ghost" }) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={cn(
                "relative overflow-hidden px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg",
                variant === "primary" ? "bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-teal-500/30" :
                    variant === "outline" ? "bg-transparent border-2 border-gray-200 text-gray-700 hover:border-teal-500 hover:text-teal-600 shadow-sm" :
                        "bg-transparent text-gray-600 hover:text-teal-600 shadow-none",
                className
            )}
        >
            <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
            {variant === "primary" && (
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
            )}
        </motion.button>
    )
}

function WordRotator() {
    const words = ["Semudah Chatting 💬", "Secepat Kilat ⚡", "Super Hemat 💰", "Sangat Aman 🛡️"]
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length)
        }, 2000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="relative h-[1.2em] overflow-hidden inline-block align-top">
            <AnimatePresence mode="wait">
                <motion.span
                    key={index}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-700"
                >
                    {words[index]}
                </motion.span>
            </AnimatePresence>
        </div>
    )
}

function WhatsAppBubble({ name, text, time, avatar }: { name: string, text: string, time: string, avatar: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-4 rounded-tr-3xl rounded-br-3xl rounded-bl-3xl rounded-tl-none shadow-sm border border-gray-100 max-w-sm mb-6 flex gap-3"
        >
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0", avatar)}>
                {name.charAt(0)}
            </div>
            <div>
                <div className="flex items-baseline justify-between gap-4">
                    <h4 className="font-bold text-sm text-gray-900">{name}</h4>
                    <span className="text-[10px] text-gray-400">{time}</span>
                </div>
                <p className="text-gray-600 text-sm mt-1 leading-relaxed">{text}</p>
            </div>
        </motion.div>
    )
}

export default function LandingPageV2() {
    const [scrolled, setScrolled] = useState(false)
    const router = useRouter()
    const { scrollYProgress } = useScroll()
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-teal-300 selection:text-teal-900 overflow-x-hidden">

            {/* Scroll Progress */}
            <motion.div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-emerald-500 origin-left z-[100]" style={{ scaleX }} />

            {/* Navbar */}
            <motion.nav
                className={cn(
                    "fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-50 rounded-full px-6 py-4 flex items-center justify-between transition-all duration-300",
                    scrolled ? "bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl shadow-teal-900/5" : "bg-transparent"
                )}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
            >
                <div className="flex items-center gap-2 font-black text-xl tracking-tight cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                    <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
                        <Package size={20} fill="currentColor" />
                    </div>
                    <span>Rayo<span className="text-teal-600">Kurir</span></span>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-500">
                    {["Keunggulan", "Testimoni", "Tarif"].map(item => (
                        <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-teal-600 transition-colors">
                            {item}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => router.push("/login")} className="hidden sm:block font-bold text-gray-500 hover:text-teal-600">Masuk</button>
                    <button onClick={() => window.open('https://wa.me/6281234567890')} className="bg-gray-900 hover:bg-black text-white rounded-full px-5 py-2.5 text-sm font-bold shadow-lg transition-transform hover:scale-105 active:scale-95">
                        <MessageCircle size={16} className="inline mr-2" /> Chat
                    </button>
                </div>
            </motion.nav>

            {/* --- 1. ATTENTION (Hero) --- */}
            <section className="relative pt-44 pb-20 overflow-hidden">
                <div className="absolute top-0 inset-0 z-0 opacity-60">
                    {/* Mesh Gradients */}
                    <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-teal-200/40 rounded-full blur-[120px] animate-blob mix-blend-multiply"></div>
                    <div className="absolute top-[10%] left-[-10%] w-[50vw] h-[50vw] bg-yellow-200/40 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply"></div>
                </div>

                <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/60 backdrop-blur-md border border-white/50 rounded-full text-sm font-bold text-teal-700 mb-8 shadow-sm"
                    >
                        <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                        </span>
                        <span>Solusi Kirim Paket No. #1 Sumobito</span>
                    </motion.div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-gray-900 mb-8 leading-[1]">
                        Pengiriman Instan, <br />
                        <WordRotator />
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
                        Gak perlu macet, gak perlu antri. Cukup chat, kami jemput & antar.
                        <br className="hidden md:block" />Tarif flat <span className="text-teal-600 font-extrabold">Rp7.000</span> se-Kecamatan.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <ShinyButton onClick={() => window.open('https://wa.me/6281234567890')} variant="primary" className="h-16 text-xl px-10 shadow-teal-500/40 w-full sm:w-auto">
                            Pesan Sekarang <ArrowRight size={22} />
                        </ShinyButton>
                        <ShinyButton variant="outline" className="h-16 text-xl px-10 w-full sm:w-auto bg-white/50">
                            Pelajari Dulu
                        </ShinyButton>
                    </div>
                </div>
            </section>

            {/* --- 2. INTEREST (Use Cases) --- */}
            <section className="py-20 bg-white relative">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-gray-900">Apa yang Bisa Rayo Bantu?</h2>
                        <p className="text-gray-500 mt-2">Apapun barangnya, selama legal & aman, gas!</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { title: "Lapar Tapi Mager?", desc: "Minta beliin seblak, nasi goreng, atau kopi hits favoritmu.", icon: Utensils, bg: "bg-orange-100", text: "text-orange-600" },
                            { title: "Paket Olshop", desc: "Kirim dagangan ke pembeli area Sumobito tanpa ribet packing tebal.", icon: ShoppingBag, bg: "bg-purple-100", text: "text-purple-600" },
                            { title: "Dokumen Ketinggalan", desc: "Tugas sekolah, KTP, atau berkas kantor yang tertinggal di rumah.", icon: FileText, bg: "bg-blue-100", text: "text-blue-600" },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 hover:shadow-lg transition-all"
                            >
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", item.bg, item.text)}>
                                    <item.icon size={28} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- 3. LOGIC/CONVICTION (Features & Comparison) --- */}
            <section id="keunggulan" className="py-24 px-4 bg-gray-50/50">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-teal-600 font-bold tracking-widest uppercase text-sm">Kenapa Harus Rayo?</span>
                            <h2 className="text-4xl font-black text-gray-900 mt-2 mb-6">Jangan Buang Waktumu.</h2>
                            <p className="text-xl text-gray-500 mb-10 leading-relaxed">
                                Platform lain mungkin ribet dengan tarif per kilometer atau surge pricing saat hujan.
                                Rayo hadir sesimpel "Chat & Sampai".
                            </p>

                            {/* Comparison Table */}
                            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                                <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-4 mb-4 font-bold text-sm text-center text-gray-400">
                                    <div className="text-left pl-2">FITUR</div>
                                    <div className="text-teal-600">RAYO</div>
                                    <div>OJEK BIASA</div>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { label: "Tarif", rayo: "Flat 7rb", ojek: "Per KM", good: true },
                                        { label: "Fee Aplikasi", rayo: "Rp 0", ojek: "Ada", good: true },
                                        { label: "Hujan", rayo: "Tetap", ojek: "Naik Harga", good: true },
                                        { label: "Driver", rayo: "Warga Lokal", ojek: "Random", good: true },
                                    ].map((row, i) => (
                                        <div key={i} className="grid grid-cols-3 gap-4 items-center text-center text-sm font-medium">
                                            <div className="text-left text-gray-600 pl-2">{row.label}</div>
                                            <div className="bg-teal-50 text-teal-700 py-1.5 rounded-lg">{row.rayo}</div>
                                            <div className="text-gray-400">{row.ojek}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bento Grids */}
                        <div className="grid gap-6">
                            <TiltCard className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-gray-100 flex items-center gap-6">
                                <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-600 flex-shrink-0">
                                    <Zap size={32} fill="currentColor" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Super Cepat</h3>
                                    <p className="text-gray-500 text-sm">Driver standby di tiap desa, pickup under 15 menit.</p>
                                </div>
                            </TiltCard>
                            <TiltCard className="bg-gray-900 p-8 rounded-[2.5rem] shadow-lg text-white flex items-center gap-6">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-teal-400 flex-shrink-0">
                                    <ShieldCheck size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Aman Terpercaya</h3>
                                    <p className="text-gray-400 text-sm">Sistem COD aman, driver terverifikasi KTP asli.</p>
                                </div>
                            </TiltCard>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- 4. DESIRE (Social Proof) --- */}
            <section id="testimoni" className="py-24 px-4 bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-50 rounded-full blur-[100px] -z-10 translate-x-1/2"></div>
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        {/* Text Side */}
                        <div className="order-2 md:order-1">
                            <div className="inline-block bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-bold mb-6">BUKTI NYATA</div>
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Apa Kata Tetangga?</h2>
                            <p className="text-xl text-gray-500 mb-8 max-w-md">
                                Bukan sekadar janji manis. Ini kata mereka yang sudah merasakan mudahnya pakai Rayo.
                            </p>
                            <div className="flex gap-8">
                                <div>
                                    <div className="text-3xl font-black text-gray-900">500+</div>
                                    <div className="text-sm text-gray-400 font-medium">Paket/Minggu</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-gray-900">4.9</div>
                                    <div className="text-sm text-gray-400 font-medium">Rating Puas</div>
                                </div>
                            </div>
                        </div>

                        {/* WhatsApp Bubbles Side */}
                        <div className="order-1 md:order-2 relative">
                            {/* Decorative Mobile Phone Frame */}
                            <motion.div
                                className="relative z-10 pl-8 md:pl-0"
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                <WhatsAppBubble
                                    name="Bu Siti (Catering)"
                                    time="09:42"
                                    text="Mas, makasih ya tadi antaran ke Balai Desa tepat waktu. Nasinya masih anget. Besok saya order lagi buat jam 7 pagi bisa?"
                                    avatar="bg-green-500"
                                />
                                <WhatsAppBubble
                                    name="Reza (Olshop)"
                                    time="13:15"
                                    text="Mantap min, COD nya udah cair. Enak pake Rayo uangnya cepet balik, ga pake potongan aneh2. Sukses terus!"
                                    avatar="bg-blue-500"
                                />
                                <WhatsAppBubble
                                    name="Mbak Ani"
                                    time="19:20"
                                    text="Untung ada Rayo malem2 mau beliin obat buat anak. Hujan2 tetep jalan saluut 👍"
                                    avatar="bg-pink-500"
                                />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- 5. ACTION (Final CTA) --- */}
            <section className="py-24 px-4 bg-[#FAFAFA]">
                <div className="max-w-5xl mx-auto bg-gradient-to-br from-gray-900 to-black rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/img/grid.svg')] opacity-10"></div>
                    <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-teal-500/30 rounded-full blur-[100px]"></div>

                    <div className="relative z-10">
                        <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter">Sudah Siap Order?</h2>
                        <p className="text-2xl text-gray-400 mb-12 max-w-2xl mx-auto font-medium">
                            Simpan nomornya sekarang. Siapa tau butuh mendadak nanti.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <ShinyButton className="h-16 px-12 text-xl bg-teal-500 text-white shadow-teal-500/20 hover:shadow-teal-500/40">
                                Chat WhatsApp Sekarang
                            </ShinyButton>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-12">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <div className="font-black text-2xl tracking-tighter mb-4">Rayo.</div>
                    <div className="flex justify-center gap-6 text-gray-400 font-medium mb-8">
                        <a href="#" className="hover:text-teal-600">Instagram</a>
                        <a href="#" className="hover:text-teal-600">Facebook</a>
                        <a href="#" className="hover:text-teal-600">Twitter</a>
                    </div>
                    <p className="text-gray-400 text-sm">© 2025 Rayo Kurir Sumobito. Solusi Lokal Kualitas Global.</p>
                </div>
            </footer>
        </div>
    )
}
