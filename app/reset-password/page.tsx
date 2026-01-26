"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Lock, CheckCircle, XCircle, ArrowLeft, KeyRound, Eye, EyeOff } from "lucide-react"
import { motion } from "framer-motion"

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [isLoading, setIsLoading] = useState(false)
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [status, setStatus] = useState<"loading" | "ready" | "success" | "error">("loading")
    const [errorMessage, setErrorMessage] = useState("")

    // Handle the auth callback on mount
    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Check if we have a hash fragment with access_token (from email link)
                const hashParams = new URLSearchParams(window.location.hash.substring(1))
                const accessToken = hashParams.get("access_token")
                const refreshToken = hashParams.get("refresh_token")
                const type = hashParams.get("type")
                const errorCode = hashParams.get("error_code")
                const errorDescription = hashParams.get("error_description")

                // Check for errors in hash
                if (errorCode) {
                    setStatus("error")
                    setErrorMessage(decodeURIComponent(errorDescription || "Link tidak valid atau sudah kadaluarsa"))
                    return
                }

                // If we have tokens from the recovery link
                if (accessToken && type === "recovery") {
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken || "",
                    })

                    if (error) {
                        setStatus("error")
                        setErrorMessage(error.message)
                        return
                    }

                    setStatus("ready")
                    // Clear the hash from URL
                    window.history.replaceState(null, "", window.location.pathname)
                    return
                }

                // Check if user already has a session (from Supabase redirect)
                const { data: { session } } = await supabase.auth.getSession()
                if (session) {
                    setStatus("ready")
                    return
                }

                // No valid session or token
                setStatus("error")
                setErrorMessage("Link reset password tidak valid. Silakan minta link baru.")

            } catch (error) {
                console.error("Auth callback error:", error)
                setStatus("error")
                setErrorMessage("Terjadi kesalahan saat memproses permintaan")
            }
        }

        handleAuthCallback()
    }, [])

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!password.trim()) {
            toast.error("Password wajib diisi")
            return
        }

        if (password.length < 6) {
            toast.error("Password minimal 6 karakter")
            return
        }

        if (password !== confirmPassword) {
            toast.error("Konfirmasi password tidak cocok")
            return
        }

        setIsLoading(true)

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) {
                toast.error(error.message)
                return
            }

            setStatus("success")
            toast.success("Password berhasil diubah!")

            // Sign out and redirect to login after 2 seconds
            setTimeout(async () => {
                await supabase.auth.signOut()
                router.push("/login")
            }, 2000)

        } catch (error) {
            console.error("Reset password error:", error)
            toast.error("Terjadi kesalahan sistem")
        } finally {
            setIsLoading(false)
        }
    }

    // Loading state
    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <LoadingSpinner className="w-12 h-12 text-teal-600 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Memverifikasi link...</p>
                </motion.div>
            </div>
        )
    }

    // Error state
    if (status === "error") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
                >
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Tidak Valid</h1>
                    <p className="text-slate-500 mb-6">{errorMessage}</p>
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

    // Success state
    if (status === "success") {
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
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Password Berhasil Diubah!</h1>
                    <p className="text-slate-500 mb-6">Anda akan dialihkan ke halaman login...</p>
                    <LoadingSpinner className="w-6 h-6 text-teal-600 mx-auto" />
                </motion.div>
            </div>
        )
    }

    // Reset password form
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <KeyRound className="w-8 h-8 text-teal-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h1>
                    <p className="text-slate-500">Masukkan password baru untuk akun Anda</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-900 font-bold">
                            Password Baru
                        </Label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 transition-colors">
                                <Lock size={20} />
                            </div>
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Minimal 6 karakter"
                                className="pl-12 pr-12 h-14 bg-slate-50 border-2 border-slate-200 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 rounded-xl transition-all font-medium text-lg text-slate-900 placeholder:text-slate-400"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-slate-900 font-bold">
                            Konfirmasi Password
                        </Label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 transition-colors">
                                <Lock size={20} />
                            </div>
                            <Input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="Ulangi password baru"
                                className="pl-12 h-14 bg-slate-50 border-2 border-slate-200 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 rounded-xl transition-all font-medium text-lg text-slate-900 placeholder:text-slate-400"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <XCircle size={14} /> Password tidak cocok
                            </p>
                        )}
                        {confirmPassword && password === confirmPassword && (
                            <p className="text-sm text-green-600 flex items-center gap-1">
                                <CheckCircle size={14} /> Password cocok
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-14 text-lg rounded-xl font-bold shadow-xl transition-all transform active:scale-95 bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20"
                        disabled={isLoading || password !== confirmPassword || password.length < 6}
                    >
                        {isLoading ? <LoadingSpinner className="text-white" /> : "Simpan Password Baru"}
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <LoadingSpinner className="w-12 h-12 text-teal-600" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    )
}
