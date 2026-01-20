"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageCircle, Menu, X, CheckCircle, Store, ShoppingBag, Utensils, Pill, Smartphone, Clock, TrendingUp, Users, ShieldCheck, Zap, ChevronDown, Package, MapPin, Gift, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence, Variants } from "framer-motion"

import { TypewriterText } from "@/components/lp2"

export default function DaftarMitraPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const router = useRouter()

  // WA Links
  const PHONE_NUMBER = "6289767111118"
  
  // 1. Daftar
  const WA_TEXT_DAFTAR = encodeURIComponent("Halo Admin Rayo Kurir 👋\nSaya mau daftar Mitra UMKM.\n\nNama Pemilik: ...\nNama Usaha: ...\nJenis Usaha: (Warung/Kuliner/Laundry/Apotek/dll)\nAlamat/Desa: ...\nJam Operasional: ...\nLokasi Maps (jika ada): ...\nSaya ingin layanan: (Delivery / Titip Beli / Keduanya)\n\nTerima kasih 🙏")
  const WA_LINK_DAFTAR = `https://wa.me/${PHONE_NUMBER}?text=${WA_TEXT_DAFTAR}`

  // 2. Tanya Dulu
  const WA_TEXT_TANYA = encodeURIComponent("Halo Admin Rayo Kurir 👋\nSaya mau tanya-tanya dulu soal Mitra UMKM dong.")
  const WA_LINK_TANYA = `https://wa.me/${PHONE_NUMBER}?text=${WA_TEXT_TANYA}`
  
  // 3. Minta Kit
  const WA_TEXT_KIT = encodeURIComponent("Halo Admin Rayo Kurir 👋\nSaya mau minta Mitra Starter Kit dong.")
  const WA_LINK_KIT = `https://wa.me/${PHONE_NUMBER}?text=${WA_TEXT_KIT}`

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleMenu = () => setIsOpen(!isOpen)

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    setIsOpen(false)
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
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

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-rayo-primary selection:text-white pb-20 md:pb-0">
      
      {/* Navbar / Sticky CTA Bar */}
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
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
              <img
                src="/assets/img/logo.png"
                alt="Rayo Logo"
                className={cn("h-8 w-auto transition-all duration-300", !isScrolled && "brightness-0 invert")}
              />
              <span className={cn(
                "hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                isScrolled ? "bg-rayo-light text-rayo-dark" : "bg-white/10 text-white"
              )}>
                Mitra UMKM
              </span>
            </div>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-6">
              {[
                { label: "Keuntungan", id: "benefit" },
                { label: "Cara Kerja", id: "cara-kerja" },
                { label: "Layanan", id: "layanan" },
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

              <div className="flex gap-2">
                <Button onClick={() => window.open(WA_LINK_DAFTAR)} className={cn(
                    "rounded-full px-6 transition-all transform hover:scale-105 shadow-lg",
                    isScrolled ? "bg-rayo-primary hover:bg-rayo-dark text-white shadow-rayo-primary/30" : "bg-white text-rayo-dark hover:bg-gray-100 shadow-white/20"
                )}>
                    <MessageCircle size={16} className="mr-2" /> Daftar via WhatsApp
                </Button>
                <Button onClick={() => window.open(WA_LINK_TANYA)} variant="outline" className={cn(
                    "rounded-full px-4 border-2 hidden lg:flex",
                    isScrolled ? "border-rayo-primary text-rayo-primary hover:bg-rayo-light" : "border-white/30 text-white hover:bg-white/10"
                )}>
                    Tanya Dulu
                </Button>
              </div>
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
                  { label: "Keuntungan", id: "benefit" },
                  { label: "Cara Kerja", id: "cara-kerja" },
                  { label: "Layanan", id: "layanan" },
                  { label: "FAQ", id: "faq" },
                ].map((item) => (
                  <button key={item.id} onClick={() => scrollToSection(item.id)} className="block w-full text-left text-base font-medium text-gray-700 hover:text-rayo-primary pl-2 border-l-2 border-transparent hover:border-rayo-primary transition-all">
                    {item.label}
                  </button>
                ))}
                <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                  <Button onClick={() => window.open(WA_LINK_DAFTAR)} className="w-full bg-rayo-primary hover:bg-rayo-dark text-white">
                    <MessageCircle size={16} className="mr-2" /> Daftar via WhatsApp
                  </Button>
                  <Button onClick={() => window.open(WA_LINK_TANYA)} variant="outline" className="w-full border-rayo-primary text-rayo-primary">
                    Tanya Dulu
                  </Button>
                  <p className="text-xs text-center text-gray-500">Daftar cepat • Gratis • Dibantu admin</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Hero Section (A: Attention) */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-br from-rayo-primary to-rayo-dark">
        <div className="absolute inset-0 bg-[url('/assets/img/grid.svg')] opacity-10 animate-pulse"></div>

        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="text-center lg:text-left"
            >
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium text-white mb-6">
                <span className="w-2 h-2 rounded-full bg-teal-300 animate-ping"></span>
                <span>Buat UMKM Sumobito & sekitar</span>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.2] mb-8 tracking-tight"
              >
                Lagi rame? <br/> Jangan kamu yang nganter. <br/>
                <span className="text-teal-200 block mt-4 text-3xl sm:text-4xl lg:text-5xl">
                   <TypewriterText 
                      phrases={[
                        "Biar Rayo yang jalan.",
                        "Fokus jualan aja.",
                        "Pelanggan tinggal chat.",
                        "Hemat waktu & tenaga."
                      ]} 
                   />
                </span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-lg sm:text-xl text-white/90 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Gabung <span className="font-bold text-white border-b-2 border-teal-300">Mitra Rayo</span>: pelanggan makin gampang beli, kamu fokus jualan.
              </motion.p>

              <motion.ul variants={itemVariants} className="space-y-4 mb-10 text-white/90 text-left max-w-md mx-auto lg:mx-0">
                <li className="flex items-start gap-3"><CheckCircle className="text-teal-300 flex-shrink-0 mt-1" size={20} /> <span className="text-lg">Order via WhatsApp (simple)</span></li>
                <li className="flex items-start gap-3"><CheckCircle className="text-teal-300 flex-shrink-0 mt-1" size={20} /> <span className="text-lg">Kurir jemput ke tokomu</span></li>
                <li className="flex items-start gap-3"><CheckCircle className="text-teal-300 flex-shrink-0 mt-1" size={20} /> <span className="text-lg">Bisa titip-beli (sesuai aturan)</span></li>
              </motion.ul>

              <motion.div variants={itemVariants} className="mb-8">
                  <span className="inline-block px-4 py-2 bg-yellow-400 text-yellow-900 font-bold rounded-lg transform -rotate-2 shadow-lg">
                      Ongkir mulai Rp3.000* (dibayar pelanggan)
                  </span>
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Button onClick={() => window.open(WA_LINK_DAFTAR)} className="relative overflow-hidden w-full sm:w-auto h-14 px-8 bg-white text-rayo-dark hover:text-white hover:bg-teal-700 font-black text-lg rounded-xl shadow-2xl shadow-black/20 transition-all hover:-translate-y-1 group border-2 border-white/20">
                   <span className="relative z-10 flex items-center">
                      <MessageCircle size={22} className="mr-2 group-hover:animate-bounce" /> 
                      Daftar Mitra (Chat WA)
                   </span>
                   <div className="absolute inset-0 h-full w-full scale-0 rounded-xl transition-all duration-300 group-hover:scale-100 group-hover:bg-teal-700/10"></div>
                </Button>
                <Button onClick={() => window.open(WA_LINK_KIT)} className="w-full sm:w-auto h-14 px-8 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border-2 border-white/30 backdrop-blur-md transition-all">
                    Minta Mitra Kit
                </Button>
              </motion.div>

              <motion.p variants={itemVariants} className="text-xs text-white/60 mt-6">
                Support admin • Alur order jelas • Cocok buat warung, kuliner, laundry, apotek, dll
              </motion.p>
            </motion.div>

            {/* Hero Image / Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="relative mx-auto lg:ml-auto w-full max-w-md lg:max-w-full hidden md:block"
            >
              <div className="relative z-10 bg-white rounded-3xl p-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                 {/* Illustration Concept */}
                 <div className="bg-rayo-light/30 rounded-2xl p-8 border-2 border-dashed border-teal-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <img src="/assets/img/logo.png" className="w-32" />
                    </div>
                    
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mx-auto mb-2 text-2xl">🏪</div>
                            <span className="font-bold text-gray-700 text-sm">Toko Kamu</span>
                        </div>
                        <div className="flex-1 px-4 flex flex-col items-center">
                            <div className="text-xs text-gray-500 mb-1 animate-pulse">Kurir OTW 🚀</div>
                            <div className="w-full h-1 bg-gray-300 rounded-full overflow-hidden">
                                <div className="h-full bg-rayo-primary w-2/3 animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mx-auto mb-2 text-2xl">🏠</div>
                            <span className="font-bold text-gray-700 text-sm">Pelanggan</span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                            <MessageCircle size={20} />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">WhatsApp Masuk</div>
                            <div className="font-bold text-gray-800 text-sm">"Kak, pesen 2 porsi, antar ya!"</div>
                        </div>
                    </div>
                 </div>
              </div>
              <div className="absolute inset-0 bg-rayo-secondary rounded-3xl transform -rotate-3 z-0 opacity-50"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem -> Solusi (I: Interest) */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
            >
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">Order ada... <br/>tapi nganter bikin keteteran.</h2>
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {[
                        { text: "Kamu lagi produksi / jaga toko.", icon: Users },
                        { text: "Pelanggan minta dianter sekarang.", icon: Clock },
                        { text: "Kalau kamu yang nganter, toko jadi kosong.", icon: Store }
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <item.icon className="w-10 h-10 text-red-400 mx-auto mb-4" />
                            <p className="font-medium text-gray-700">{item.text}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-rayo-primary text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <h3 className="text-2xl font-bold mb-3">Solusi: Rayo jadi 'tangan kedua' tokomu.</h3>
                    <p className="text-rayo-light text-lg">Kamu siapin pesanan, Rayo yang jemput & antar.</p>
                </div>
            </motion.div>
        </div>
      </section>

      {/* Benefit Mitra (D: Desire) */}
      <section id="benefit" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <span className="text-rayo-primary font-bold tracking-widest uppercase text-sm bg-rayo-light px-4 py-2 rounded-full">Keuntungan Mitra</span>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-6">Kenapa UMKM suka jadi Mitra Rayo?</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { title: "Order makin gampang masuk", desc: "Pelanggan tinggal chat, gak ribet.", icon: TrendingUp },
                    { title: "Kamu tetap fokus jualan", desc: "Gak perlu ninggal toko.", icon: Store },
                    { title: "Alur jelas & cepat", desc: "Format order tinggal copy–paste.", icon: Copy },
                    { title: "Support admin", desc: "Admin bantu sampai lancar.", icon: Users },
                    { title: "Bisa tambah layanan", desc: "Delivery + Titip Beli (opsional).", icon: ShoppingBag },
                    { title: "Bantu promo mitra", desc: "Mitra terpilih bisa di-highlight.", icon: Zap },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        whileHover={{ y: -5 }}
                        className="bg-white border border-gray-100 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all"
                    >
                        <div className="w-12 h-12 bg-rayo-light rounded-2xl flex items-center justify-center mb-4 text-rayo-primary">
                            <item.icon size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-gray-600 leading-relaxed text-sm">{item.desc}</p>
                    </motion.div>
                ))}
            </div>

            <div className="mt-8 text-center">
                <p className="text-sm font-bold text-gray-500 bg-gray-100 inline-block px-4 py-2 rounded-full">Tanpa potongan menu/produk.</p>
            </div>
        </div>
      </section>

      {/* Mitra Starter Kit (Desire Booster) */}
      <section className="py-16 bg-gradient-to-r from-purple-900 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/img/grid.svg')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
            <div className="inline-block bg-white/20 backdrop-blur-md rounded-full px-4 py-1 text-sm font-bold mb-6 border border-white/30">🎁 Bonus Spesial</div>
            <h2 className="text-3xl md:text-4xl font-black mb-6">Bonus: Mitra Starter Kit GRATIS</h2>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-left max-w-3xl mx-auto">
                {[
                    "Stiker QR order",
                    "Poster mini info delivery",
                    "Template Story/Status",
                    "Format balasan cepat"
                ].map((item, i) => (
                    <div key={i} className="bg-white/10 border border-white/10 p-4 rounded-xl flex items-center gap-3">
                        <CheckCircle className="text-green-400 flex-shrink-0" size={16} />
                        <span className="font-medium text-sm">{item}</span>
                    </div>
                ))}
            </div>

            <Button onClick={() => window.open(WA_LINK_KIT)} className="bg-white text-purple-900 hover:bg-purple-50 font-bold rounded-full px-8 h-12">
                Minta Kit via WhatsApp
            </Button>
        </div>
      </section>

      {/* Cara Kerja (Clarity) */}
      <section id="cara-kerja" className="py-20 bg-rayo-light/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
            <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-16">Gampang banget. 4 langkah doang.</h2>
            
            <div className="grid md:grid-cols-4 gap-8">
                {[
                    { step: 1, title: "Chat admin untuk daftar", desc: "Kirim data usaha + jam buka." },
                    { step: 2, title: "Aktivasi & briefing", desc: "Admin kirim format order + aturan." },
                    { step: 3, title: "Terima order", desc: "Kamu siapin pesanan, info alamat." },
                    { step: 4, title: "Rayo jemput & antar", desc: "Berangkat. Beres." },
                ].map((item, i) => (
                    <div key={i} className="relative text-center group">
                        <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center text-2xl font-bold text-rayo-primary shadow-lg mb-6 border-4 border-rayo-light group-hover:scale-110 transition-transform">
                            {item.step}
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-gray-600 text-sm">{item.desc}</p>
                        {i !== 3 && <div className="hidden md:block absolute top-8 left-1/2 w-full h-1 bg-teal-200 -z-10"></div>}
                    </div>
                ))}
            </div>

            <div className="text-center mt-12 bg-white/50 backdrop-blur-sm p-4 rounded-xl inline-block mx-auto border border-white/50">
                <p className="text-rayo-dark font-medium text-sm">💡 Mulai tanpa aplikasi. Cukup WhatsApp.</p>
            </div>
        </div>
      </section>

      {/* Skrip Chat (Clarity + Wow) */}
      <section className="py-20 bg-gray-50">
         <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">Balasan ke pelanggan (tinggal copas)</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
                {[
                    { title: "Template Delivery", text: "Siap kak ✅ Bisa dianter Rayo. Ongkir mulai Rp3.000* ya kak. Alamatnya di mana?" },
                    { title: "Template Express", text: "Kalau mau lebih cepat bisa Express (+Rp2.000) ya kak — prioritas kalau driver tersedia." },
                    { title: "Template Titip Beli", text: "Bisa kak. Titip beli gratis sesuai ketentuan (1 toko, antre wajar). Kalau belanja besar/antre lama, admin konfirmasi dulu ya kak." }
                ].map((item, i) => (
                    <div key={i} className={cn("bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative group", i === 2 ? "md:col-span-2" : "")}>
                        <h4 className="font-bold text-rayo-primary mb-3 text-sm uppercase tracking-wide">{item.title}</h4>
                        <div className="bg-gray-100 p-4 rounded-xl text-gray-700 font-mono text-sm relative">
                            {item.text}
                            <button 
                                onClick={() => copyToClipboard(item.text, i)}
                                className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                                title="Copy text"
                            >
                                {copiedIndex === i ? <CheckCircle size={16} className="text-green-500"/> : <Copy size={16} className="text-gray-400"/>}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      </section>

      {/* Layanan Section */}
      <section id="layanan" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-10">Yang bisa dibantu Rayo buat pelangganmu</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                    { label: "Antar Makanan", icon: Utensils },
                    { label: "Jemput Laundry", icon: CheckCircle }, 
                    { label: "Antar Belanjaan", icon: ShoppingBag },
                    { label: "Ambil Obat", icon: Pill },
                    { label: "Kirim Paket Kecil", icon: Package },
                    { label: "Titip Beli (Opsional)", icon: Store },
                ].map((srv, i) => (
                    <div key={i} className="flex flex-col items-center p-6 rounded-2xl bg-gray-50 hover:bg-rayo-light transition-colors">
                        <srv.icon className="w-8 h-8 text-rayo-primary mb-3" />
                        <span className="font-medium text-gray-800">{srv.label}</span>
                    </div>
                ))}
            </div>
            <div className="mt-8">
                <span className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold uppercase tracking-wider">
                    Fokus motor-friendly: barang kecil–sedang
                </span>
            </div>
        </div>
      </section>

      {/* Trust / Social Proof */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
                 <h2 className="text-3xl font-bold mb-6">Cocok buat UMKM kayak kamu</h2>
                 <div className="flex flex-wrap justify-center gap-3">
                    {["Warung", "Kuliner rumahan", "Laundry kiloan", "Apotek", "Frozen food", "Toko kue", "Minuman", "Konter", "Sembako", "Jajanan", "UMKM online", "Toko harian"].map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-sm text-gray-300">
                            {tag}
                        </span>
                    ))}
                 </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { text: "Sekarang gak perlu ninggal toko. Order jadi lebih enak.", author: "Warung (Sumobito)" },
                    { text: "Customer seneng karena bisa dianter. Aku fokus masak.", author: "Kuliner rumahan (Sumobito)" },
                    { text: "Jemput laundry bikin pelanggan balik lagi.", author: "Laundry (sekitar Sumobito)" }
                ].map((item, i) => (
                    <div key={i} className="bg-gray-800 p-6 rounded-2xl border border-gray-700 relative">
                        <div className="text-4xl text-rayo-primary mb-2 opacity-30">"</div>
                        <p className="text-lg text-gray-200 italic mb-4 leading-relaxed">
                            {item.text}
                        </p>
                        <div className="font-bold text-rayo-secondary text-sm">— {item.author}</div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Pertanyaan Umum</h2>
            <div className="space-y-4">
                {[
                    { q: "Daftar jadi mitra bayar?", a: "Gratis. Tinggal chat admin." },
                    { q: "Harus pakai aplikasi?", a: "Nggak. Utama lewat WhatsApp." },
                    { q: "Ongkir siapa yang bayar?", a: "Ongkir dibayar pelanggan. Kamu fokus siapin pesanan." },
                    { q: "Ada potongan dari penjualan UMKM?", a: "Tidak ada potongan menu/produk. Hasil penjualan utuh masuk ke kamu." },
                    { q: "Express itu gimana?", a: "Express +Rp2.000 = prioritas kalau driver tersedia (bukan membatalkan order yang sudah jalan)." },
                    { q: "Titip beli gratis beneran?", a: "Gratis sesuai ketentuan: ≤Rp100.000, 1 toko, antre ≤10 menit. Di luar itu admin konfirmasi DP/biaya tunggu." },
                    { q: "Area layanan di mana?", a: "Sumobito & sekitar." },
                    { q: "Pembayaran gimana?", a: "Bisa COD / QRIS (sesuaikan dengan SOP kamu)." }
                ].map((item, i) => (
                    <details key={i} className="group bg-gray-50 rounded-2xl open:bg-white open:shadow-lg open:ring-1 open:ring-black/5 transition-all duration-300">
                        <summary className="flex cursor-pointer items-center justify-between p-6 font-bold text-gray-900 marker:content-none">
                            {item.q}
                            <ChevronDown className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-100 mt-2 pt-4">
                            {item.a}
                        </div>
                    </details>
                ))}
            </div>
        </div>
      </section>

      {/* CTA Section (Action) */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-rayo-primary to-rayo-dark rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/img/grid.svg')] opacity-20"></div>
            
            <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">Siap bikin tokomu makin <br/> gampang melayani pelanggan?</h2>
                <p className="text-xl text-rayo-light mb-10">Klik tombol, admin bantu aktivasi. Gak ribet.</p>
                
                <div className="mb-8">
                     <span className="inline-block px-4 py-2 bg-white text-rayo-dark font-bold rounded-full text-sm">
                        Ongkir mulai Rp3.000* (dibayar pelanggan)
                     </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button onClick={() => window.open(WA_LINK_DAFTAR)} className="relative overflow-hidden h-20 px-12 bg-[#25D366] text-white hover:text-white hover:bg-[#128C7E] font-black text-xl rounded-2xl shadow-2xl shadow-[#25D366]/40 transition-all hover:-translate-y-2 group border-4 border-white/20">
                       <span className="relative z-10 flex items-center gap-3">
                          <MessageCircle size={32} fill="white" className="group-hover:animate-bounce" /> 
                          <div className="text-left leading-tight">
                            <span className="block text-sm font-medium opacity-90 font-sans">Chat Admin Sekarang</span>
                            <span className="block text-2xl font-extrabold tracking-wide">DAFTAR VIA WHATSAPP</span>
                          </div>
                       </span>
                       <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-12 transition-all duration-1000 ease-in-out group-hover:translate-x-[150%]"></div>
                    </Button>

                    <Button onClick={() => window.open(WA_LINK_TANYA)} className="h-14 px-8 bg-transparent border-2 border-white/30 text-white hover:bg-white/10 rounded-xl font-bold">
                        Tanya dulu (gratis)
                    </Button>
                </div>
                <p className="text-sm text-teal-200/80 mt-6">Balas cepat • Format tinggal isi • Bisa mulai hari ini</p>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 text-gray-600 py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col items-center justify-center text-center">
                <img src="/assets/img/logo.png" alt="Rayo Logo" className="h-8 w-auto mb-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" />
                <p className="mb-4">Partner Logistik UMKM Sumobito.</p>
                <div className="max-w-xl mx-auto text-xs text-gray-400 leading-relaxed mb-8">
                    *Ongkir mulai Rp3.000 berlaku sesuai area & perhitungan jarak. Untuk layanan tertentu bisa ada add-on (Express, bulky/heavy, waiting fee, PP/return) sesuai aturan Rayo Kurir.
                </div>
                <p className="text-sm text-gray-400">© 2026 Rayo Kurir. All rights reserved.</p>
            </div>
        </div>
      </footer>

      {/* Sticky Bottom Bar Mobile */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 md:hidden z-50 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div>
            <div className="text-xs font-bold text-gray-900">Mitra UMKM Rayo Kurir</div>
            <div className="text-[10px] text-gray-500">Gratis • Dibantu admin</div>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => window.open(WA_LINK_TANYA)} variant="outline" size="sm" className="h-10 px-3 text-xs border-rayo-primary text-rayo-primary">
                Tanya dulu
            </Button>
            <Button onClick={() => window.open(WA_LINK_DAFTAR)} size="sm" className="h-10 px-4 bg-rayo-primary text-white shadow-lg shadow-rayo-primary/30">
                Daftar via WhatsApp
            </Button>
        </div>
      </div>

    </div>
  )
}
