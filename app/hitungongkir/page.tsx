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
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,#Cffafe30,transparent)] dark:bg-[radial-gradient(circle_800px_at_50%_200px,#0f172a50,transparent)]"></div>
            </div>

            {/* Responsive Header Bar */}
            <header className="sticky top-0 bg-white/85 dark:bg-gray-950/85 backdrop-blur-xl border-b border-gray-200/80 dark:border-gray-800 z-50 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between gap-2">
                    <Link href="/lp2" className="group flex items-center gap-1.5 text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white transition-colors">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800/90 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-all text-gray-800 dark:text-gray-100 font-semibold text-xs sm:text-sm border border-gray-200/50 dark:border-gray-700/50">
                            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                            <span>Beranda</span>
                        </div>
                    </Link>

                    <div className="flex items-center justify-center">
                        <Link href="/lp2" className="flex items-center gap-2">
                            <img src="/assets/img/logo.png" alt="Rayo Kurir" className="h-7 sm:h-9 w-auto object-contain transition-all" />
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        <ModeToggle />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 lg:py-14">
                {/* Page Title */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8 md:mb-12 max-w-2xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 border border-teal-200/80 dark:border-teal-900/60 shadow-xs text-teal-700 dark:text-teal-300 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-4">
                        <Calculator size={15} className="text-teal-500" />
                        <span className="tracking-tight">Kalkulator Ongkir Rayo</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight leading-tight transition-colors">
                        Cek Ongkir <span className="text-teal-600 dark:text-teal-400">Lebih Cepat</span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base md:text-lg font-normal leading-relaxed transition-colors px-2">
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
                    className="mt-12 md:mt-16 text-center"
                >
                    <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-white dark:bg-gray-900/80 backdrop-blur-md rounded-3xl p-3 sm:pr-6 border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-all w-full sm:w-auto">
                        <div className="bg-teal-50 dark:bg-teal-900/40 p-3.5 rounded-2xl">
                            <MessageCircle size={24} className="text-teal-600 dark:text-teal-300" />
                        </div>
                        <div className="text-center sm:text-left py-1">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base">Butuh bantuan khusus?</h3>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Tim kami siap membantu 24/7</p>
                        </div>
                        <Button
                            onClick={() => window.open("https://wa.me/6281234567890?text=Halo%20Rayo%20Kurir,%20saya%20butuh%20bantuan", "_blank")}
                            className="rounded-xl bg-gray-900 dark:bg-teal-500 text-white dark:text-gray-950 hover:bg-black dark:hover:bg-teal-400 transition-all shadow-md shadow-gray-200/50 dark:shadow-teal-900/50 w-full sm:w-auto font-bold px-6 py-3"
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
                    className="mt-10 text-center"
                >
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 font-medium">
                        © 2026 Rayo Kurir • Solusi Logistik Sumobito
                    </p>
                </motion.div>
            </main>
        </div>
    )
}
