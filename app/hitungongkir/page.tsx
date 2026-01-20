"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Calculator, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OngkirCalculatorWithMap } from "@/components/ongkir"
import { ModeToggle } from "@/components/mode-toggle"

export default function HitungOngkirPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 transition-colors duration-300">
            {/* Soft decorative background elements */}
            {/* Elegant Background Pattern */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]"></div>

                {/* Subtle vignette/bloom for depth */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,#Cffafe30,transparent)] dark:bg-[radial-gradient(circle_800px_at_50%_200px,#0f172a50,transparent)]"></div>
            </div>

            {/* Header */}
            <header className="sticky top-0 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 z-50 supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-950/60 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link href="/lp2" className="group flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                        <div className="p-2 rounded-full group-hover:bg-gray-100 dark:group-hover:bg-gray-800 transition-all">
                            <ArrowLeft size={20} className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-sm hidden sm:inline-block">Kembali ke Beranda</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        {/* Logo */}
                        <Link href="/lp2" className="flex items-center gap-3">
                            <img src="/assets/img/logo.png" alt="Rayo" className="h-8 w-auto object-contain brightness-0 dark:brightness-0 dark:invert transition-all" />
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <ModeToggle />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
                {/* Page Title */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10 max-w-2xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 border border-teal-100 dark:border-teal-900/50 shadow-sm text-teal-700 dark:text-teal-400 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
                        <Calculator size={14} className="text-teal-500" />
                        <span className="tracking-tight">Kalkulator Ongkir Rayo</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight leading-tight transition-colors">
                        Cek Ongkir <span className="text-teal-600 dark:text-teal-400">Lebih Cepat</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl font-light leading-relaxed transition-colors">
                        Hitung estimasi biaya pengiriman secara instan. Transparan, tanpa biaya tersembunyi.
                    </p>
                </motion.div>

                {/* Calculator with Map */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                >
                    <OngkirCalculatorWithMap />
                </motion.div>

                {/* Additional Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-16 text-center"
                >
                    <div className="inline-flex flex-col md:flex-row items-center gap-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-3xl p-2 pr-6 border border-white dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
                        <div className="bg-teal-50 dark:bg-teal-900/30 p-4 rounded-2xl">
                            <MessageCircle size={24} className="text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="text-left py-2">
                            <h3 className="font-bold text-gray-900 dark:text-white">Butuh bantuan khusus?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Tim kami siap membantu 24/7</p>
                        </div>
                        <Button
                            onClick={() => window.open("https://wa.me/6281234567890?text=Halo%20Rayo%20Kurir,%20saya%20butuh%20bantuan", "_blank")}
                            className="rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-200 transition-all shadow-lg shadow-gray-200/50 dark:shadow-black/50 w-full md:w-auto font-bold"
                        >
                            Chat Admin
                        </Button>
                    </div>
                </motion.div>

                {/* Footer Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12 text-center"
                >
                    <p className="text-sm text-gray-400 dark:text-gray-600 font-medium">
                        © 2026 Rayo Kurir • Solusi Logistik Sumobito
                    </p>
                </motion.div>
            </main>
        </div>
    )
}

