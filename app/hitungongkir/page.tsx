"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Calculator, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OngkirCalculatorWithMap } from "@/components/ongkir"

export default function HitungOngkirPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50">
            {/* Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-gray-100 z-50">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/lp2" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                        <ArrowLeft size={20} />
                        <span className="font-medium">Kembali</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <img src="/assets/img/logo.png" alt="Rayo" className="h-8 w-auto" />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
                {/* Page Title */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                        <Calculator size={16} />
                        Kalkulator Ongkir
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                        Hitung Estimasi Ongkir
                    </h1>
                    <p className="text-gray-600 max-w-md mx-auto">
                        Pilih lokasi jemput dan antar, lihat rute di peta, dan order langsung via WhatsApp.
                    </p>
                </motion.div>

                {/* Calculator with Map */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <OngkirCalculatorWithMap />
                </motion.div>

                {/* Additional Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 text-center"
                >
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-lg mx-auto">
                        <h3 className="font-semibold text-gray-900 mb-4">Butuh bantuan?</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Hubungi admin kami jika ada pertanyaan atau butuh estimasi khusus.
                        </p>
                        <Button
                            onClick={() => window.open("https://wa.me/6281234567890?text=Halo%20Rayo%20Kurir,%20saya%20butuh%20bantuan", "_blank")}
                            variant="outline"
                            className="rounded-xl border-2 border-teal-200 text-teal-700 hover:bg-teal-50"
                        >
                            <MessageCircle size={18} className="mr-2" />
                            Chat Admin
                        </Button>
                    </div>
                </motion.div>

                {/* Footer Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 text-center text-sm text-gray-500"
                >
                    <p>© 2026 Rayo Kurir • Kurir Lokal Andalan Warga Sumobito</p>
                </motion.div>
            </main>
        </div>
    )
}

