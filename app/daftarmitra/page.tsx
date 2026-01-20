"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageCircle, Menu, X, ArrowRight, CheckCircle, Store, ShoppingBag, Utensils, Pill, Smartphone, Clock, TrendingUp, Users, ShieldCheck, Zap, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence, Variants } from "framer-motion"

import { TypewriterText } from "@/components/lp2"

export default function DaftarMitraPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()

  // WA Link Generator
  const PHONE_NUMBER = "6281234567890" // Placeholder number
  const WA_TEXT = encodeURIComponent("Halo Admin Rayo Kurir, saya mau daftar Mitra UMKM.\n\nNama: ...\nNama Usaha: ...\nJenis Usaha: ...\nAlamat/Desa: ...\nJam Operasional: ...\nTitik Maps: ...\nSaya ingin: (Delivery / Titip Beli / Keduanya)")
  const WA_LINK = `https://wa.me/${PHONE_NUMBER}?text=${WA_TEXT}`

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
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-rayo-primary selection:text-white">
      
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

              <Button onClick={() => window.open(WA_LINK)} className={cn(
                "rounded-full px-6 transition-all transform hover:scale-105 shadow-lg",
                isScrolled ? "bg-rayo-primary hover:bg-rayo-dark text-white shadow-rayo-primary/30" : "bg-white text-rayo-dark hover:bg-gray-100 shadow-white/20"
              )}>
                <MessageCircle size={16} className="mr-2" /> Daftar via WhatsApp
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
                  { label: "Keuntungan", id: "benefit" },
                  { label: "Cara Kerja", id: "cara-kerja" },
                  { label: "Layanan", id: "layanan" },
                  { label: "FAQ", id: "faq" },
                ].map((item) => (
                  <button key={item.id} onClick={() => scrollToSection(item.id)} className="block w-full text-left text-base font-medium text-gray-700 hover:text-rayo-primary pl-2 border-l-2 border-transparent hover:border-rayo-primary transition-all">
                    {item.label}
                  </button>
                ))}
                <div className="pt-4 border-t border-gray-100">
                  <Button onClick={() => window.open(WA_LINK)} className="w-full bg-rayo-primary hover:bg-rayo-dark text-white">
                    <MessageCircle size={16} className="mr-2" /> Daftar via WhatsApp
                  </Button>
                  <p className="text-xs text-center text-gray-500 mt-2">Daftar cepat • Gratis • Dibantu admin</p>
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
                <span>Solusi UMKM Sumobito</span>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight"
              >
                Solusi Logistik UMKM <br/>
                <span className="text-teal-200 block mt-2">
                   <TypewriterText 
                      phrases={[
                        "Cepat & Aman",
                        "Tanpa Ribet",
                        "Hemat Biaya",
                        "Pelanggan Puas",
                        "Fokus Jualan"
                      ]} 
                   />
                </span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Gabung jadi <span className="font-bold text-white">Mitra UMKM Rayo Kurir</span>: pesanan lebih lancar, pelanggan makin puas, kamu fokus jualan.
              </motion.p>

              <motion.ul variants={itemVariants} className="space-y-3 mb-8 text-white/90 text-left max-w-md mx-auto lg:mx-0">
                <li className="flex items-center gap-3"><CheckCircle className="text-teal-300" size={20} /> Order masuk via WhatsApp (simple, gak ribet)</li>
                <li className="flex items-center gap-3"><CheckCircle className="text-teal-300" size={20} /> Kurir jemput barang ke tokomu</li>
                <li className="flex items-center gap-3"><CheckCircle className="text-teal-300" size={20} /> Bisa titip-beli & antar cepat</li>
              </motion.ul>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Button onClick={() => window.open(WA_LINK)} className="relative overflow-hidden w-full sm:w-auto h-16 px-10 bg-white text-rayo-dark hover:text-white hover:bg-teal-700 font-black text-xl rounded-2xl shadow-2xl shadow-black/20 transition-all hover:-translate-y-1 group">
                   <span className="relative z-10 flex items-center">
                      <MessageCircle size={24} className="mr-3 group-hover:animate-bounce" /> 
                      Daftar Mitra via WhatsApp
                   </span>
                   <div className="absolute inset-0 h-full w-full scale-0 rounded-2xl transition-all duration-300 group-hover:scale-100 group-hover:bg-teal-700/10"></div>
                </Button>
              </motion.div>

              <motion.p variants={itemVariants} className="text-xs text-white/60 mt-6">
                Area: Sumobito & sekitar • Support admin • Bisa mulai hari ini
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
                 {/* Placeholder for illustration, using a generic composition if no specific image available */}
                 <div className="bg-rayo-light rounded-2xl p-8 text-center border-2 border-dashed border-teal-200">
                    <Store className="w-24 h-24 text-rayo-primary mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-rayo-dark">Toko Kamu</h3>
                    <div className="h-8 w-0.5 bg-gray-300 mx-auto my-2"></div>
                    <div className="bg-white p-4 rounded-xl shadow-md inline-block mb-2">
                        <span className="text-sm font-medium text-gray-600">📦 Paket siap</span>
                    </div>
                    <div className="h-8 w-0.5 bg-gray-300 mx-auto my-2"></div>
                    <div className="flex justify-center items-center gap-2">
                        <div className="bg-rayo-primary text-white p-2 rounded-full"><Zap size={16}/></div>
                        <span className="font-bold text-rayo-dark">Rayo Jemput & Antar</span>
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
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">Masalah klasik UMKM: <br/>Ramai, tapi nganter bikin keteteran.</h2>
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {[
                        { text: "Lagi rame? Pelanggan minta dianter.", icon: Users },
                        { text: "Kamu harus milih: jaga toko atau nganter.", icon: Store },
                        { text: "Customer nunggu lama, kamu capek, order hilang.", icon: Clock }
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <item.icon className="w-10 h-10 text-red-400 mx-auto mb-4" />
                            <p className="font-medium text-gray-700">{item.text}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-rayo-primary text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <h3 className="text-2xl font-bold mb-3">Solusi: Rayo Kurir jadi 'tangan kedua' tokomu.</h3>
                    <p className="text-rayo-light text-lg">Kamu fokus produksi & melayani, urusan jemput-antar biar Rayo yang jalan.</p>
                </div>
            </motion.div>
        </div>
      </section>

      {/* Benefit Utama (D: Desire) */}
      <section id="benefit" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <span className="text-rayo-primary font-bold tracking-widest uppercase text-sm bg-rayo-light px-4 py-2 rounded-full">Keuntungan Mitra</span>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-6">Kenapa UMKM gabung jadi Mitra Rayo?</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                    { title: "Naikkan Order", desc: "Pelanggan makin gampang beli karena bisa dianter.", icon: TrendingUp },
                    { title: "Hemat Waktu & Tenaga", desc: "Gak perlu tinggalin toko buat delivery.", icon: Clock },
                    { title: "Proses Simpel", desc: "Order cukup via WhatsApp + format singkat.", icon: Smartphone },
                    { title: "Admin Bantu", desc: "Kamu gak sendirian. Admin bantu atur alur order.", icon: Users },
                    { title: "Bisa Titip Beli", desc: "Kalau pelanggan minta beliin barang lain, bisa (sesuai aturan).", icon: ShoppingBag },
                    { title: "Bisa Ikut Promosi", desc: "Mitra terpilih bisa di-highlight di kanal Rayo.", icon: Store },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        whileHover={{ y: -5 }}
                        className="bg-white border border-gray-100 p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all"
                    >
                        <div className="w-14 h-14 bg-rayo-light rounded-2xl flex items-center justify-center mb-6 text-rayo-primary">
                            <item.icon size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                    </motion.div>
                ))}
            </div>

            <div className="mt-16 text-center">
                <p className="text-gray-500 mb-6 font-medium">Cocok untuk berbagai jenis usaha:</p>
                <div className="flex flex-wrap justify-center gap-3">
                    {["Warung", "Kuliner", "Laundry", "Apotek", "Frozen Food", "Toko Kue", "Konter", "Olshop"].map((tag, i) => (
                        <span key={i} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-rayo-light hover:text-rayo-primary transition-colors cursor-default">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
      </section>

      {/* Cara Kerja */}
      <section id="cara-kerja" className="py-20 bg-rayo-light/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
            <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-16">Cara Kerja Jadi Mitra (Gampang Banget)</h2>
            
            <div className="grid md:grid-cols-4 gap-8">
                {[
                    { step: 1, title: "Daftar via WA", desc: "Kirim data singkat usaha kamu." },
                    { step: 2, title: "Aktivasi & Briefing", desc: "Admin kirim format order + jam operasional." },
                    { step: 3, title: "Mulai Order", desc: "Pelanggan order → kamu siapin → Rayo jemput." },
                    { step: 4, title: "Repeat", desc: "Kamu tinggal fokus jualan, Rayo yang nganter." },
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
                <p className="text-rayo-dark font-medium text-sm">💡 Bisa mulai tanpa alat tambahan. Yang penting HP & WhatsApp.</p>
            </div>
        </div>
      </section>

      {/* Layanan Section */}
      <section id="layanan" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-10">Yang Bisa Dibantu Rayo (Buat Pelangganmu)</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                    { label: "Antar Makanan", icon: Utensils },
                    { label: "Antar Belanjaan", icon: ShoppingBag },
                    { label: "Titip Beli", icon: Store },
                    { label: "Jemput Laundry", icon: CheckCircle }, // Generic icon for laundry
                    { label: "Kirim Paket", icon: CheckCircle },
                    { label: "Ambil Obat", icon: Pill },
                ].map((srv, i) => (
                    <div key={i} className="flex flex-col items-center p-6 rounded-2xl bg-gray-50 hover:bg-rayo-light transition-colors">
                        <srv.icon className="w-8 h-8 text-rayo-primary mb-3" />
                        <span className="font-medium text-gray-800">{srv.label}</span>
                    </div>
                ))}
            </div>
            <div className="mt-8">
                <span className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold uppercase tracking-wider">
                    Motor-friendly (Barang Kecil-Sedang)
                </span>
            </div>
        </div>
      </section>

      {/* Trust / Social Proof */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-3xl font-bold mb-6">Jenis Mitra Yang Cocok</h2>
                    <ul className="space-y-4">
                        {[
                            "Warung & kuliner rumahan",
                            "Laundry kiloan",
                            "Apotek & toko kesehatan",
                            "Frozen food & kue",
                            "Konter & toko harian"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-lg text-gray-300">
                                <CheckCircle className="text-rayo-secondary" size={24} /> {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 relative">
                        <div className="text-4xl text-rayo-primary mb-4">"</div>
                        <p className="text-xl text-gray-200 italic mb-6 leading-relaxed">
                            Sejak ada Rayo, aku gak ninggal toko. Customer juga seneng karena barangnya dianter cepet.
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-xl font-bold">UM</div>
                            <div>
                                <div className="font-bold text-white">Mitra Rayo</div>
                                <div className="text-sm text-gray-400">Sumobito</div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex gap-6 text-sm text-gray-400 justify-center md:justify-start">
                        <span className="flex items-center gap-2"><ShieldCheck size={16} /> Respon Cepat</span>
                        <span className="flex items-center gap-2"><ShieldCheck size={16} /> SOP Jelas</span>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Pertanyaan Umum</h2>
            <div className="space-y-4">
                {[
                    { q: "Daftarnya bayar?", a: "Gratis. Cukup kirim data usaha dan jam operasional." },
                    { q: "Ribet gak? Harus pakai aplikasi?", a: "Nggak. Utamanya via WhatsApp." },
                    { q: "Ongkir gimana?", a: "Ongkir ditanggung pelanggan (transparan). Kamu tinggal siapin pesanan." },
                    { q: "Ada potongan dari penjualan UMKM?", a: "Tidak ada potongan menu/produk. Hasil penjualan utuh masuk ke kamu." },
                    { q: "Bisa titip beli?", a: "Bisa, sesuai ketentuan (nominal/antre/toko). Kalau di luar itu, admin konfirmasi dulu." },
                    { q: "Area layanan di mana?", a: "Sumobito & sekitar." }
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

      {/* CTA Section (Action) */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-rayo-primary to-rayo-dark rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/img/grid.svg')] opacity-20"></div>
            
            <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">Siap bikin tokomu makin <br/> gampang melayani pelanggan?</h2>
                <p className="text-xl text-rayo-light mb-10">Klik tombol di bawah, admin bantu aktivasi mitra.</p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button onClick={() => window.open(WA_LINK)} className="relative overflow-hidden h-16 px-12 bg-white text-rayo-dark hover:text-white hover:bg-teal-700 font-black text-xl rounded-2xl shadow-2xl shadow-black/20 transition-all hover:-translate-y-1 group">
                       <span className="relative z-10 flex items-center">
                          <MessageCircle size={24} className="mr-3 group-hover:animate-bounce" /> 
                          Daftar Mitra via WhatsApp
                       </span>
                       <div className="absolute inset-0 h-full w-full scale-0 rounded-2xl transition-all duration-300 group-hover:scale-100 group-hover:bg-teal-700/10"></div>
                    </Button>
                </div>
                <p className="text-sm text-teal-200/80 mt-6">Balas cepat • Format tinggal isi • Aktivasi dibantu</p>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 text-gray-600 py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <img src="/assets/img/logo.png" alt="Rayo Logo" className="h-8 w-auto mx-auto mb-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" />
            <p className="mb-4">Partner Logistik UMKM Sumobito.</p>
            <p className="text-sm text-gray-400">© 2026 Rayo Kurir. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating Button Mobile */}
      <motion.a
        href={WA_LINK}
        target="_blank"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, type: "spring" }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden bg-rayo-primary text-white py-3 px-6 rounded-full shadow-2xl flex items-center gap-3 active:scale-95 transition-all w-[90%] max-w-sm justify-center"
      >
        <MessageCircle size={20} fill="currentColor" />
        <span className="font-bold text-lg">Daftar Mitra via WhatsApp</span>
      </motion.a>

    </div>
  )
}
