"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginWithEmail } from "@/lib/auth"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { User, Lock, Mail, ArrowLeft, ShieldCheck, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    // Default to admin for first impression, but works for both
    const [role, setRole] = useState<"admin" | "kurir">("admin")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim() || !password.trim()) {
            toast.error("Email dan Password wajib diisi")
            return
        }

        setIsLoading(true)

        try {
            const user = await loginWithEmail(email.trim(), password)
            if (user) {
                toast.success(`Selamat datang, ${user.name}!`)
                // Use window.location for full page reload to sync cookies with middleware
                setTimeout(() => {
                    window.location.href = "/dashboard"
                }, 500)
            } else {
                toast.error("Email atau Password salah")
            }
        } catch (error) {
            console.error("Login error:", error)
            toast.error("Terjadi kesalahan sistem")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-white overflow-hidden font-sans">

            {/* LEFT SIDE - VISUALS */}
            <div className="hidden lg:flex relative bg-slate-900 text-white flex-col justify-between p-12 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-teal-500/20 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px]"></div>
                    <div className="absolute inset-0 bg-[url('/assets/img/noise.png')] opacity-[0.03]"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 w-full">
                    <div
                        onClick={() => router.push('/')}
                        className="flex items-center gap-3 cursor-pointer w-fit group"
                    >
                        <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl group-hover:bg-white/20 transition-colors">
                            <img src="/assets/img/logo.png" alt="Logo" className="h-8 w-auto brightness-0 invert" />
                        </div>
                        <span className="font-bold tracking-wide">RAYO KURIR</span>
                    </div>
                </div>

                <div className="relative z-10 space-y-6 max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-5xl font-black leading-tight mb-4">
                            Kelola Pengiriman <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Tanpa Batas.</span>
                        </h1>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            Platform manajemen kurir lokal paling canggih untuk kecamatan Sumobito. Pantau paket, atur tim, dan layani warga dengan sepenuh hati.
                        </p>
                    </motion.div>

                    <div className="flex gap-4 pt-4">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl flex-1">
                            <div className="text-3xl font-bold text-teal-400 mb-1">200+</div>
                            <div className="text-xs text-slate-500 uppercase tracking-widest">Order Harian</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl flex-1">
                            <div className="text-3xl font-bold text-emerald-400 mb-1">100%</div>
                            <div className="text-xs text-slate-500 uppercase tracking-widest">Amanah</div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-xs text-slate-500">
                    &copy; 2026 Rayo Kurir. Created with ❤️ for Sumobito.
                </div>
            </div>

            {/* RIGHT SIDE - FORM */}
            <div className="flex flex-col justify-center px-4 sm:px-12 lg:px-24 xl:px-32 bg-white relative">
                <Button
                    variant="ghost"
                    className="absolute top-6 right-6 lg:hidden"
                    onClick={() => router.push('/')}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-sm mx-auto space-y-8"
                >
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900">Selamat Datang 👋</h2>
                        <p className="text-slate-500 mt-2">Masukan email dan password untuk akses.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-900 font-bold text-base">
                                Email
                            </Label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-teal-700 transition-colors">
                                    <Mail size={20} />
                                </div>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nama@rayokurir.id"
                                    className="pl-12 h-14 bg-white border-2 border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 rounded-xl transition-all font-bold text-lg text-black placeholder:text-slate-400"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-900 font-bold text-base">
                                Password
                            </Label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-teal-700 transition-colors">
                                    <Lock size={20} />
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-12 h-14 bg-white border-2 border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 rounded-xl transition-all font-bold text-lg text-black placeholder:text-slate-400"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 text-lg rounded-xl font-bold shadow-xl transition-all transform active:scale-95 bg-teal-700 hover:bg-teal-800 text-white shadow-teal-700/20"
                            disabled={isLoading}
                        >
                            {isLoading ? <LoadingSpinner className="text-white" /> : (
                                <span className="flex items-center gap-2">
                                    Masuk Sekarang <ChevronRight size={20} />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="text-center">
                        <p className="text-xs text-slate-400">
                            Lupa password? <a href="/forgot-password" className="underline hover:text-teal-600">Reset Password</a>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
