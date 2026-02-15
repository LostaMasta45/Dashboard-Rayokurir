"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Send, CheckCircle2, AlertCircle, Loader2, Sparkles, ShieldCheck, Moon, Sun, Lock, Quote } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface Topic {
    id: string
    title: string
    question_text: string
    slug: string
    is_active: boolean
    user_id: string
}

export default function PublicAnonPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug as string
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    const [topic, setTopic] = useState<Topic | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [sending, setSending] = useState(false)
    const [success, setSuccess] = useState(false)

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        loadTopic()
    }, [slug])

    async function loadTopic() {
        try {
            const res = await fetch(`/api/anon/topics?slug=${slug}`)
            if (!res.ok) {
                if (res.status === 404) setError("Link tidak ditemukan atau sudah kadaluarsa.")
                else setError("Gagal memuat halaman.")
                return
            }
            const data = await res.json()
            if (!data.topic) {
                setError("Link tidak valid.")
                return
            }
            setTopic(data.topic)
        } catch (err) {
            setError("Terjadi kesalahan jaringan.")
        } finally {
            setLoading(false)
        }
    }

    async function handleSend(e: React.FormEvent) {
        e.preventDefault()
        if (!topic || !message.trim()) return

        setSending(true)
        try {
            const res = await fetch("/api/anon/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic_id: topic.id,
                    content: message
                })
            })

            if (!res.ok) throw new Error("Gagal mengirim pesan")

            setSuccess(true)
            setMessage("")
        } catch (err) {
            alert("Gagal mengirim pesan. Coba lagi ya.")
        } finally {
            setSending(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-600 to-slate-900">
                <Loader2 className="w-12 h-12 text-white animate-spin drop-shadow-lg" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-900 to-black">
                <Card className="w-full max-w-md shadow-2xl border border-white/10 bg-white/5 backdrop-blur-xl z-10 relative overflow-hidden">
                    <CardHeader className="text-center pb-4 pt-10">
                        <div className="mx-auto bg-red-500/10 p-4 rounded-full mb-6 w-20 h-20 flex items-center justify-center ring-1 ring-red-500/20">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-white">Link Tidak Valid</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center pb-8 px-8">
                        <p className="text-slate-400 text-lg">{error}</p>
                    </CardContent>
                    <CardFooter className="px-8 pb-10">
                        <Button className="w-full h-12 bg-white text-slate-900 hover:bg-slate-200 font-bold rounded-xl" onClick={() => router.push("/")}>
                            Kembali ke Home
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    // Success View
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-teal-600 to-slate-900">
                {/* Background Grid - Same as Homepage */}
                <div className="absolute inset-0 bg-[url('/assets/img/grid.svg')] opacity-20 animate-pulse pointer-events-none"></div>

                {/* Decorative Blobs */}
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-20 left-20 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl pointer-events-none"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="w-full max-w-lg relative z-10"
                >
                    <Card className="border-0 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl overflow-hidden text-center p-10 relative ring-4 ring-white/10 rounded-[2.5rem]">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                            className="w-24 h-24 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-teal-500/30 ring-4 ring-white"
                        >
                            <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={3} />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
                                Terkirim!
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 mb-10 text-lg leading-relaxed font-medium">
                                Pesanmu sudah aman terkirim. <br /> Identitas tetap 100% rahasia.
                            </p>
                        </motion.div>

                        <Button
                            size="lg"
                            className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] transition-all font-bold text-lg shadow-lg"
                            onClick={() => setSuccess(false)}
                        >
                            <Sparkles className="w-5 h-5 mr-2 text-yellow-400" /> Kirim Lagi
                        </Button>
                    </Card>
                </motion.div>
            </div>
        )
    }

    // Main View
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-gradient-to-br from-teal-600 to-slate-900 transition-colors duration-700 selection:bg-white/30 selection:text-white">

            {/* Theme Toggle */}
            {mounted && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="absolute top-6 right-6 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all z-50 cursor-pointer shadow-lg"
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </motion.button>
            )}

            {/* Homepage-Matching Background System */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[url('/assets/img/grid.svg')] opacity-10 animate-pulse"></div>

                {/* Animated Blobs (Exact matches from Homepage Hero) */}
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-white/10 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-teal-400/20 rounded-full blur-[100px]"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-[560px] relative z-10"
            >
                {/* Floating Logo */}
                <div className="text-center mb-8 relative">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex justify-center mb-6"
                    >
                        <img
                            src="/assets/img/logo.png"
                            alt="Rayo Logo"
                            className="h-12 md:h-16 w-auto brightness-0 invert drop-shadow-lg"
                        />
                    </motion.div>

                    <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-3 drop-shadow-xl leading-none">
                        Kotak Anonim<span className="text-teal-300">.</span>
                    </h1>
                    <p className="text-lg text-white/80 font-medium max-w-sm mx-auto">
                        Suara warga didengar, privasi tetap dijaga.
                    </p>
                </div>

                {/* The "Visible Box" Card */}
                <motion.div
                    whileHover={{ y: -8, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    <Card className="border-0 shadow-2xl shadow-black/20 bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden relative transition-all duration-300 ring-4 ring-white/10 dark:ring-white/5">
                        {/* Top Gradient Strip */}
                        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-teal-400 to-emerald-500"></div>

                        <CardHeader className="p-8 pb-4 text-center relative z-10">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-black/5 dark:ring-white/10 transform rotate-3">
                                <Quote className="w-10 h-10 text-teal-600 dark:text-teal-400 fill-current" />
                            </div>

                            <CardTitle className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight px-4 tracking-tight">
                                "{topic?.question_text}"
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-8 pt-6 relative z-10">
                            <form onSubmit={handleSend} className="space-y-6">
                                <div className="space-y-2 group">
                                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Lock className="w-3 h-3" />
                                        Pesan Rahasia
                                    </label>

                                    <div className="relative">
                                        <Textarea
                                            placeholder="Tulis pesanmu di sini..."
                                            className="min-h-[180px] bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-slate-800 focus:border-teal-500 dark:focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-lg p-6 rounded-2xl resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner text-slate-800 dark:text-slate-200 font-medium"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={sending || !message.trim()}
                                    className="w-full h-16 text-lg rounded-2xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100 relative overflow-hidden"
                                >
                                    {sending ? (
                                        <><Loader2 className="w-6 h-6 animate-spin mr-3" /> Mengirim...</>
                                    ) : (
                                        <><Send className="w-6 h-6 mr-3" /> Kirim Sekarang</>
                                    )}
                                </Button>
                            </form>
                        </CardContent>

                        <CardFooter className="bg-slate-50 dark:bg-black/20 p-6 border-t border-slate-100 dark:border-slate-800 flex justify-center items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-teal-500" />
                            <span className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                Privasi 100% Aman
                            </span>
                        </CardFooter>
                    </Card>
                </motion.div>

                {/* Simple Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-8 text-center"
                >
                    <p className="text-white/40 text-xs font-bold tracking-widest uppercase">
                        &copy; 2026 Rayo Kurir Official
                    </p>
                </motion.div>
            </motion.div>
        </div>
    )
}
