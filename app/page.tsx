"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { Menu, X, CheckCircle, Package, Truck, DollarSign, MessageCircle, MapPin, Star, Clock, ShoppingBag, FileText, Utensils, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence, Variants } from "framer-motion"

export default function LandingPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)
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
                ["Beranda", "/"],
                ["Mitra", "/mitra"],
                ["Layanan", "/layanan"],
                ["Cara Order", "/cara-order"],
                ["Tarif", "#tarif"],
                ["Testimoni", "#testimoni"],
                ["FAQ", "#faq"],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-rayo-primary relative group",
                    isScrolled ? "text-gray-700" : "text-white/90 hover:text-white"
                  )}
                >
                  {label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-rayo-primary transition-all group-hover:w-full"></span>
                </Link>
              ))}

              {user ? (
                <Button onClick={() => router.push("/dashboard")} className="bg-rayo-primary hover:bg-rayo-dark text-white rounded-full px-6 shadow-lg shadow-rayo-primary/30 hover:shadow-rayo-primary/50 transition-all transform hover:scale-105">
                  Dashboard
                </Button>
              ) : (
                <Button onClick={() => router.push("/login")} className={cn(
                  "rounded-full px-6 transition-all transform hover:scale-105 shadow-lg",
                  isScrolled ? "bg-rayo-primary hover:bg-rayo-dark text-white shadow-rayo-primary/30" : "bg-white text-rayo-dark hover:bg-gray-100 shadow-white/20"
                )}>
                  Masuk
                </Button>
              )}
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
                  ["Beranda", "/"],
                  ["Mitra", "/mitra"],
                  ["Layanan", "/layanan"],
                  ["Cara Order", "/cara-order"],
                  ["Tarif", "#tarif"],
                  ["Testimoni", "#testimoni"],
                  ["FAQ", "#faq"],
                ].map(([label, href]) => (
                  <Link key={label} href={href} className="block text-base font-medium text-gray-700 hover:text-rayo-primary pl-2 border-l-2 border-transparent hover:border-rayo-primary transition-all" onClick={() => setIsOpen(false)}>
                    {label}
                  </Link>
                ))}
                <div className="pt-4 border-t border-gray-100">
                  {user ? (
                    <Button onClick={() => router.push("/dashboard")} className="w-full bg-rayo-primary hover:bg-rayo-dark text-white">
                      Dashboard
                    </Button>
                  ) : (
                    <Button onClick={() => router.push("/login")} className="w-full bg-rayo-primary hover:bg-rayo-dark text-white">
                      Masuk
                    </Button>
                  )}
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
                  Cepat, Hemat, Dekat
                </motion.span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Ongkir rata <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-white border border-white/10">Rp7.000</span> Se‑Kecamatan Sumobito. Ahlinya kirim barang, makanan, dan dokumen.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Button className="w-full sm:w-auto h-14 px-8 bg-white text-teal-700 hover:text-white hover:bg-gradient-to-r hover:from-teal-500 hover:to-teal-600 font-bold text-lg rounded-2xl shadow-xl shadow-black/5 hover:shadow-teal-500/30 transition-all duration-300 hover:-translate-y-1">
                  Chat WhatsApp Sekarang
                </Button>
                <Button variant="outline" className="w-full sm:w-auto h-14 px-8 border-white/30 bg-white/10 text-white hover:bg-white/20 font-medium text-lg rounded-2xl backdrop-blur-sm transition-all hover:scale-105 hover:border-white/50">
                  Lihat Cara Order
                </Button>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-10 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
                {["Antar Barang", "Titip Beli", "Express"].map((item) => (
                  <div key={item} className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-sm text-white font-medium border border-white/10 hover:bg-teal-500/20 hover:border-teal-400/50 transition-all duration-300 cursor-default group">
                    <CheckCircle className="h-5 w-5 text-teal-300 group-hover:text-teal-200 transition-colors" /> {item}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="relative mx-auto lg:ml-auto w-full max-w-md lg:max-w-full group"
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

      {/* Keunggulan Section */}
      <section id="keunggulan" className="py-20 lg:py-28 relative bg-[#FDFDFD]">
        {/* Dot Pattern */}
        <div className="absolute inset-0 z-0 opacity-[0.4]" style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Kenapa Warga Memilih Rayo?</h2>
            <p className="text-lg text-gray-600">
              Bukan sekadar kurir biasa. Kami adalah tetangga yang siap membantu kebutuhan harianmu dengan sepenuh hati.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              { title: "Antar Barang & Makanan", desc: "Dokumen, paket kecil, hingga titipan makanan — jemput di lokasi Anda.", icon: Package, color: "bg-blue-50 text-blue-600" },
              { title: "COD Tersedia", desc: "Pembayaran di tempat yang aman, konfirmasi sebelum serah‑terima.", icon: DollarSign, color: "bg-green-50 text-green-600" },
              { title: "Express Kirim (+Rp3.000)", desc: "Prioritas jemput–antar langsung untuk kebutuhan mendesak.", icon: Truck, color: "bg-orange-50 text-orange-600" },
              { title: "Jangkauan Sumobito", desc: "Menjangkau seluruh desa di Kecamatan Sumobito.", icon: MapPin, color: "bg-purple-50 text-purple-600" },
              { title: "Support UMKM", desc: "Pickup di toko/rumah, cocok untuk pesanan harian pelanggan Anda.", icon: Star, color: "bg-yellow-50 text-yellow-600" },
              { title: "Konfirmasi via WhatsApp", desc: "Update jemput dan selesai antar dikonfirmasi manual oleh admin/driver.", icon: MessageCircle, color: "bg-teal-50 text-teal-600" },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                className="bg-white p-8 rounded-2xl border border-gray-100 shadow-lg transition-all duration-300 group"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:rotate-6", item.color)}>
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-rayo-primary transition-colors">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use Cases Section (Kirim Apa Just?) - UPGRADED */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute right-0 top-0 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl"></div>
          <div className="absolute left-0 bottom-0 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-teal-600 font-bold tracking-widest uppercase text-sm bg-teal-50 px-4 py-2 rounded-full border border-teal-100">Serba Bisa</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-6 tracking-tight">Bisa Kirim Apa Aja?</h2>
            <p className="text-xl text-gray-500 mt-4 max-w-2xl mx-auto">Kami bukan cuma antar paket. Kami asisten pribadimu.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Makanan & Minuman", desc: "Lapar tapi mager? Titip beli seblak, geprek, atau kopi hits favoritmu.", icon: Utensils, from: "from-orange-400", to: "to-red-500", shadow: "shadow-orange-500/20" },
              { title: "Paket Olshop", desc: "Owner Olshop? Kirim pesanan ke kastemer tanpa ribet packing tebal.", icon: ShoppingBag, from: "from-purple-500", to: "to-indigo-600", shadow: "shadow-purple-500/20" },
              { title: "Dokumen Penting", desc: "Berkas kantor, tugas sekolah, atau undangan nikah yang harus sampai hari ini.", icon: FileText, from: "from-blue-400", to: "to-cyan-500", shadow: "shadow-blue-500/20" },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={cn("group relative bg-white rounded-[2rem] p-1 shadow-2xl transition-all duration-300", item.shadow)}
              >
                <div className="absolute inset-x-0 -bottom-2 h-10 bg-gray-100 blur-lg -z-10 group-hover:opacity-75 opacity-0 transition-opacity"></div>
                <div className="bg-white rounded-[1.8rem] p-8 h-full flex flex-col items-center text-center relative overflow-hidden">
                  {/* Gradient Background on Hover */}
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500", item.from, item.to)}></div>

                  <div className={cn("w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 text-white shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300", item.from, item.to)}>
                    <item.icon size={36} fill="currentColor" className="text-white/20 absolute -bottom-2 -right-2 scale-150" />
                    <item.icon size={32} strokeWidth={2} className="relative z-10" />
                  </div>

                  <h3 className="font-black text-gray-900 text-2xl mb-3">{item.title}</h3>
                  <p className="text-gray-500 text-lg leading-relaxed">{item.desc}</p>

                  <div className={cn("mt-6 w-12 h-1 rounded-full bg-gradient-to-r", item.from, item.to)}></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rayo vs Ojek Biasa Comparison - UPGRADED */}
      <section className="py-24 bg-white relative">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-gray-900 rounded-[3rem] p-8 md:p-16 text-white shadow-2xl relative overflow-hidden border border-gray-800">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <span className="text-teal-400 font-bold tracking-widest uppercase text-xs mb-2 block">The Smart Choice</span>
                <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Kenapa Harus <br /> <span className="text-teal-400">Rayo Kurir?</span></h2>
                <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                  Berhenti membuang uang untuk tarif yang tidak masuk akal. Beralih ke Rayo dan rasakan hematnya.
                </p>
                <div className="flex gap-4">
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
                <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                  <div className="text-lg font-bold text-gray-400">FITUR LAYANAN</div>
                  <div className="flex gap-8 text-center">
                    <div className="w-16 font-bold text-gray-500 text-sm">OJEK X</div>
                    <div className="w-16 font-black text-teal-400 text-lg">RAYO</div>
                  </div>
                </div>
                <div className="space-y-6">
                  {[
                    { label: "Tarif Pengiriman", rayo: "Flat 7rb", ojek: "Mahal /KM", win: true },
                    { label: "Biaya Aplikasi", rayo: "GRATIS", ojek: "Rp 2.000+", win: true },
                    { label: "Saat Hujan", rayo: "Stabil", ojek: "Naik Harga", win: true },
                    { label: "Area Jemput", rayo: "Depan Pintu", ojek: "Pilih-pilih", win: true },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="text-gray-300 font-medium">{row.label}</div>
                      <div className="flex gap-8 text-center items-center">
                        <div className="w-16 text-gray-600 text-sm font-medium line-through decoration-red-500/50 decoration-2">{row.ojek}</div>
                        <div className="w-16 text-white font-bold bg-teal-600/20 py-1 rounded-lg border border-teal-500/30 shadow-[0_0_10px_rgba(20,184,166,0.3)]">{row.rayo}</div>
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
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rayo-primary/5 rounded-bl-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rayo-secondary/5 rounded-tr-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <span className="text-rayo-primary font-bold tracking-wider uppercase text-sm bg-rayo-primary/10 px-3 py-1 rounded-full">Spesial Untukmu</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-4 mb-6 leading-tight">Kirim Kemana Aja <br /><span className="text-rayo-dark text-5xl">Cuma 7 Ribu!</span><span className="text-lg text-gray-400 font-normal align-top ml-1">*</span></h2>
              <p className="text-lg text-gray-600 mb-8">
                Gak perlu pusing hitung jarak atau berat (paket standar). Tarif flat se-Kecamatan Sumobito.
                Murah banget kan? Yuk, dukung UMKM lokal bareng Rayo!
                <span className="text-sm text-gray-400 block mt-2">*Syarat & Ketentuan berlaku.</span>
              </p>

              <div className="grid grid-cols-3 gap-8">
                {[
                  ["200+", "Pelanggan"],
                  ["50+", "UMKM"],
                  ["4.9/5", "Rating"],
                ].map(([stat, label]) => (
                  <motion.div key={label} whileHover={{ scale: 1.05 }} className="bg-white p-4 rounded-xl shadow-sm border border-gray-50 text-center">
                    <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rayo-primary to-rayo-dark">{stat}</div>
                    <div className="text-sm font-medium text-gray-500 mt-1">{label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all"
            >
              <h3 className="font-bold text-gray-900 mb-6 text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-rayo-primary" />
                Cakupan Desa Se-Kecamatan Sumobito:
              </h3>
              <div className="flex flex-wrap gap-2">
                {["Badas", "Bakalan", "Brudu", "Budugsidorejo", "Curahmalang", "Gedangan", "Jogoloyo", "Kedungpapar", "Kendalsari", "Madiopuro", "Mlaras", "Nglele", "Palrejo", "Plemahan", "Plosokerep", "Sebani", "Segodorejo", "Sumobito", "Talunkidul", "Trawasan"].map((desa, i) => (
                  <motion.span
                    key={desa}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.02 }}
                    whileHover={{ scale: 1.1, backgroundColor: "var(--rayo-primary)", color: "white" }}
                    className="px-3 py-1.5 rounded-full bg-rayo-light text-rayo-dark text-sm font-medium cursor-default transition-colors"
                  >
                    {desa}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimoni Section */}
      <section id="testimoni" className="py-20 relative bg-white">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900">Apa Kata Tetangga?</h2>
            <div className="w-20 h-1.5 bg-rayo-primary mx-auto mt-4 rounded-full"></div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { quote: "Gila sih, cepet banget sampainya! Pesen makan siang, eh masih anget pas nyampe. Recommended parah!", author: "Sari, Banjaragung", role: "Ibu Rumah Tangga" },
              { quote: "Sangat terbantu buat kirim paketan olshop aku. Drivernya amanah, sopan, dan uang COD langsung cair.", author: "Riko, Jatipelem", role: "Owner Olshop" },
              { quote: "Tugas kuliah ketinggalan di rumah, untung ada Rayo Express. Langsung diantar ke kampus gak pake lama.", author: "Nia, Palrejo", role: "Mahasiswi" },
            ].map((t, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-rayo-primary to-rayo-dark opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex gap-1 text-yellow-400 mb-6">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-5 w-5 fill-current" />)}
                </div>
                <p className="text-gray-700 italic mb-6 text-lg leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.author}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
              <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Gampang Banget Ordernya</h2>
              <div className="space-y-8">
                {[
                  { step: 1, title: "Chat Admin", desc: "Langsung klik tombol WhatsApp. Admin ramah siap bantu." },
                  { step: 2, title: "Driver Meluncur", desc: "Sat-set! Driver terdekat langsung jemput paketmu." },
                  { step: 3, title: "Beres!", desc: "Paket sampai dengan aman. Bayar bisa Cash atau Transfer." },
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 }}
                    className="flex gap-6 group"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-white border-2 border-rayo-primary text-rayo-primary flex items-center justify-center font-bold text-xl flex-shrink-0 z-10 relative group-hover:bg-rayo-primary group-hover:text-white transition-colors">
                        {item.step}
                      </div>
                      {index !== 2 && <div className="absolute top-12 left-6 w-0.5 h-full bg-gray-200 -translate-x-1/2 -z-0"></div>}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-xl mb-2">{item.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-12 flex flex-wrap gap-4">
                <Button className="h-12 px-8 bg-rayo-dark hover:bg-rayo-primary text-white rounded-xl shadow-lg hover:shadow-xl transition-all">
                  Chat WhatsApp Sekarang
                </Button>
                <Button variant="outline" className="h-12 px-8 rounded-xl hover:bg-gray-100">
                  Lihat FAQ
                </Button>
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
                  <button className="text-rayo-primary text-sm font-medium hover:underline flex items-center gap-1">
                    <span className="bg-rayo-light px-2 py-1 rounded-md">Salin</span>
                  </button>
                </div>
                <pre className="bg-gray-50 p-6 rounded-2xl text-sm font-mono text-gray-700 whitespace-pre-wrap border border-gray-200 relative z-10">
                  {`ORDER RAYO
Nama:
NoWA:
Pickup (alamat):
Dropoff (alamat):
Item:
COD (ya/tidak, nominal):
Catatan:`}
                </pre>
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
                    <p className="text-gray-300 text-sm">Setiap hari 08.00–20.00 WIB</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50 relative overflow-hidden">
        {/* Diagonal Lines Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }}></div>

        <div className="max-w-3xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">Sering Ditanyakan</h2>
          <div className="space-y-4">
            {[
              { q: "Bisa COD (Bayar Ditempat)?", a: "Bisa banget! Kamu bisa bayar ongkir ke kurir saat paket sampai sekalian bayar harga barangnya (jika ada)." },
              { q: "Apa barang saya aman?", a: "Pasti. Driver kami adalah warga lokal yang terverifikasi (KTP & KK). Jika ada kerusakan/kehilangan, kami ganti sesuai S&K." },
              { q: "Kirim ke luar kecamatan bisa?", a: "Bisa, tapi ada penyesuaian tarif ya kak. Silakan chat admin untuk cek ongkir ke Peterongan, Mojoagung, atau Kesamben." },
              { q: "Maksimal berat barang?", a: "Untuk tarif flat Rp7.000, maksimal seukuran kardus mie instan atau 10kg. Lebih dari itu bisa pakai layanan kargo/mobil kami." }
            ].map((item, i) => (
              <details key={i} className="group bg-gray-50 rounded-2xl open:bg-white open:shadow-lg open:ring-1 open:ring-black/5 transition-all duration-300">
                <summary className="flex cursor-pointer items-center justify-between p-6 font-bold text-gray-900 marker:content-none">
                  {item.q}
                  <ChevronDown className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-6 text-gray-600 leading-relaxed animate-in slide-in-from-top-2 opacity-0 group-open:opacity-100">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Floating WhatsApp Button (Mobile Only) */}
      <motion.a
        href="https://wa.me/6281234567890"
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
                Solusi pengiriman instan untuk warga Sumobito yang dinamis.
                Kami hadir untuk memudahkan harimu, satu paket dalam satu waktu.
              </p>
              <div className="flex gap-4">
                {/* Social placeholders */}
                {[1, 2, 3].map(i => <div key={i} className="w-10 h-10 bg-white/5 rounded-full hover:bg-rayo-primary transition-colors cursor-pointer"></div>)}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6 text-white">Kontak</h4>
              <ul className="space-y-4 text-gray-400">
                <li className="flex gap-3 items-start"><MapPin className="h-5 w-5 text-rayo-primary mt-0.5" /> Basecamp Ds. Sumobito, Jombang</li>
                <li className="flex gap-3 items-center"><MessageCircle className="h-5 w-5 text-rayo-primary" /> +62 8XX-XXXX-XXXX</li>
                <li className="flex gap-3 items-center"><Clock className="h-5 w-5 text-rayo-primary" /> 08.00 - 20.00 WIB</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6 text-white">Tautan Cepat</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#layanan" className="hover:text-rayo-primary transition-colors">Layanan & Keunggulan</a></li>
                <li><a href="#tarif" className="hover:text-rayo-primary transition-colors">Cek Tarif</a></li>
                <li><a href="#cara-order" className="hover:text-rayo-primary transition-colors">Cara Order</a></li>
                <li><Link href="/login" className="hover:text-rayo-primary transition-colors">Login Admin / Kurir</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} RAYO KURIR. All rights reserved. Made with ❤️ for Sumobito.</p>
          </div>
        </div>
      </footer >
    </div >
  )
}
