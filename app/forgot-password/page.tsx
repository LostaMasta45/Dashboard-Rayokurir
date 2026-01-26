"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Mail, ArrowLeft, CheckCircle, Send } from "lucide-react"
import { motion } from "framer-motion"

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email.trim()) {
            toast.error("Email wajib diisi")
            return
        }

        setIsLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${window.location.origin}/reset-password`
            })

            if (error) {
                toast.error(error.message)
                return
            }

            setIsSent(true)
            toast.success("Link reset password telah dikirim!")

        } catch (error) {
            console.error("Forgot password error:", error)
            toast.error("Terjadi kesalahan sistem")
        } finally {
            setIsLoading(false)
        }
    }

    if (isSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Email Terkirim!</h1>
                    <p className="text-slate-500 mb-2">
                        Link reset password telah dikirim ke:
                    </p>
                    <p className="font-bold text-teal-600 mb-6">{email}</p>
                    <p className="text-sm text-slate-400 mb-6">
                        Cek inbox atau folder spam. Link akan kadaluarsa dalam 24 jam.
                    </p>
                    <Button
                        onClick={() => router.push("/login")}
                        className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke Login
                    </Button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-teal-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Lupa Password?</h1>
                    <p className="text-slate-500">
                        Masukkan email Anda dan kami akan mengirimkan link untuk reset password.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-900 font-bold">
                            Email
                        </Label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 transition-colors">
                                <Mail size={20} />
                            </div>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nama@rayokurir.id"
                                className="pl-12 h-14 bg-slate-50 border-2 border-slate-200 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 rounded-xl transition-all font-medium text-lg text-slate-900 placeholder:text-slate-400"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-14 text-lg rounded-xl font-bold shadow-xl transition-all transform active:scale-95 bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20"
                        disabled={isLoading || !email.trim()}
                    >
                        {isLoading ? (
                            <LoadingSpinner className="text-white" />
                        ) : (
                            <>
                                <Send className="mr-2 h-5 w-5" />
                                Kirim Link Reset
                            </>
                        )}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push("/login")}
                        className="text-sm text-slate-500 hover:text-teal-600 transition-colors"
                    >
                        ← Kembali ke Login
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
