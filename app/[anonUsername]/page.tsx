"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabaseClient"
import { Send, Lock, CheckCircle2, MessageCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface AnonProfile {
    id: string
    username: string
    display_name: string
    question_text: string
    avatar_url: string | null
    theme: string
}

export default function AnonPublicProfilePage() {
    const params = useParams()
    const username = params.anonUsername as string
    const [profile, setProfile] = useState<AnonProfile | null>(null)
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)
    const [notFound, setNotFound] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        loadProfile()
    }, [username])

    async function loadProfile() {
        setLoading(true)
        const res = await fetch(`/api/anon/profile?username=${username}`)
        if (!res.ok) { setNotFound(true); setLoading(false); return }
        const data = await res.json()
        if (data.profile) setProfile(data.profile)
        else setNotFound(true)
        setLoading(false)
    }

    async function handleSend(e: React.FormEvent) {
        e.preventDefault()
        if (!profile || !message.trim()) return
        setError("")
        setSending(true)

        try {
            const res = await fetch("/api/anon/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profile_id: profile.id, content: message.trim() }),
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error || "Gagal mengirim"); setSending(false); return }
            setSent(true)
            setMessage("")
        } catch {
            setError("Terjadi kesalahan")
        }
        setSending(false)
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a1a" }}>
            <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
        </div>
    )

    if (notFound) return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0a1a" }}>
            <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-5">
                <MessageCircle className="w-8 h-8 text-white/20" />
            </div>
            <h1 className="text-white font-bold text-xl mb-2">User Tidak Ditemukan</h1>
            <p className="text-white/40 text-sm mb-6">Username @{username} tidak ada</p>
            <Link href="/anon" className="px-5 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
                Buat Link Anonim
            </Link>
        </div>
    )

    return (
        <div className="min-h-screen relative overflow-hidden" style={{ background: "#0a0a1a" }}>
            {/* Animated gradient orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div className="absolute w-[500px] h-[500px] rounded-full opacity-25"
                    style={{ background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)", top: "-15%", right: "-15%" }}
                    animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} />
                <motion.div className="absolute w-[400px] h-[400px] rounded-full opacity-15"
                    style={{ background: "radial-gradient(circle, #EC4899 0%, transparent 70%)", bottom: "-10%", left: "-10%" }}
                    animate={{ x: [0, -30, 20, 0], y: [0, 20, -30, 0] }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
                <motion.div className="absolute w-[250px] h-[250px] rounded-full opacity-10"
                    style={{ background: "radial-gradient(circle, #06B6D4 0%, transparent 70%)", top: "50%", left: "40%" }}
                    animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
            </div>

            <div className="relative z-10 max-w-md mx-auto px-4 py-8 min-h-screen flex flex-col">
                <AnimatePresence mode="wait">
                    {!sent ? (
                        <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 flex flex-col">
                            {/* Profile card */}
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                                className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm mb-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                        <span className="text-white font-bold text-xl">{profile?.display_name?.[0]?.toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <h1 className="text-white font-bold text-lg">{profile?.display_name}</h1>
                                        <p className="text-white/40 text-sm">@{profile?.username}</p>
                                    </div>
                                </div>
                                <p className="text-white/80 text-base leading-relaxed">{profile?.question_text}</p>
                            </motion.div>

                            {/* Message form */}
                            <form onSubmit={handleSend} className="flex-1 flex flex-col">
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex-1">
                                    <div className="relative">
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                                            placeholder="Tulis pesan anonim kamu di sini..."
                                            rows={6}
                                            className="w-full px-5 py-4 rounded-2xl bg-white/[0.06] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all text-[15px] leading-relaxed resize-none"
                                        />
                                        <div className="absolute bottom-3 right-4 text-xs text-white/20">{message.length}/500</div>
                                    </div>
                                </motion.div>

                                {error && (
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm mt-3 px-1">{error}</motion.p>
                                )}

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-4">
                                    <button type="submit" disabled={sending || !message.trim()}
                                        className="w-full py-4 rounded-2xl font-semibold text-white text-base flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                                        style={{ background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)", boxShadow: "0 8px 32px rgba(124,58,237,0.3)" }}>
                                        {sending ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : (
                                            <><Send className="w-5 h-5" />Kirim Secara Anonim 🔒</>
                                        )}
                                    </button>
                                </motion.div>

                                {/* Anonymous badge */}
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                                    className="flex items-center justify-center gap-2 mt-4 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                    <Lock className="w-3.5 h-3.5 text-green-400" />
                                    <span className="text-white/40 text-xs">Identitas kamu 100% tersembunyi</span>
                                </motion.div>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
                                className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                                style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2))", border: "2px solid rgba(124,58,237,0.3)" }}>
                                <CheckCircle2 className="w-12 h-12 text-purple-400" />
                            </motion.div>
                            <h2 className="text-white font-bold text-2xl mb-2">Pesan Terkirim! 🎉</h2>
                            <p className="text-white/40 text-sm mb-8">Pesan anonim kamu telah dikirim ke @{profile?.username}</p>
                            <div className="flex flex-col w-full gap-3">
                                <button onClick={() => setSent(false)}
                                    className="w-full py-3.5 rounded-xl font-medium text-white text-sm"
                                    style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>
                                    Kirim Pesan Lagi
                                </button>
                                <Link href="/anon" className="w-full py-3.5 rounded-xl font-medium text-white/50 text-sm text-center bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] transition-all">
                                    Buat Link Anonim Sendiri
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-center mt-6 pb-4">
                    <Link href="/anon" className="text-white/20 text-xs hover:text-white/40 transition-colors">
                        ✨ Buat link anonim kamu sendiri
                    </Link>
                </motion.div>
            </div>
        </div>
    )
}
