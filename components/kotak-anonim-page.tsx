"use client"

import { useState, useEffect } from "react"
import {
    Plus, Trash2, Copy, MessageCircle, ExternalLink, QrCode,
    MoreVertical, ArrowLeft, RefreshCw, CheckCircle2, Pin,
    Search, Filter, Sparkles, Send, MoveRight, Inbox, LayoutGrid,
    Clock, MailOpen, Mail, Pencil, Link2
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"

// Types
interface Topic {
    id: string
    title: string
    question_text: string
    slug: string
    is_active: boolean
    created_at: string
}

interface Message {
    id: string
    content: string
    is_read: boolean
    is_pinned: boolean
    created_at: string
}

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 400, damping: 25 }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.2 }
    }
}

export function KotakAnonimPage() {
    const [view, setView] = useState<'list' | 'inbox'>('list')
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)

    // List State
    const [topics, setTopics] = useState<Topic[]>([])
    const [loadingTopics, setLoadingTopics] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)
    const [title, setTitle] = useState("")
    const [question, setQuestion] = useState("Ada masukan apa buat kita?")

    // Inbox State
    const [messages, setMessages] = useState<Message[]>([])
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [filter, setFilter] = useState("all")

    // Custom Slug State
    const [customSlug, setCustomSlug] = useState("")

    // Edit Slug State
    const [editSlugOpen, setEditSlugOpen] = useState(false)
    const [editSlugTopic, setEditSlugTopic] = useState<Topic | null>(null)
    const [editSlugValue, setEditSlugValue] = useState("")
    const [editSlugLoading, setEditSlugLoading] = useState(false)
    const [editSlugError, setEditSlugError] = useState("")

    useEffect(() => {
        loadTopics()
    }, [])

    async function loadTopics() {
        setLoadingTopics(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const res = await fetch(`/api/anon/topics?userId=${user.id}`)
        if (res.ok) {
            const data = await res.json()
            setTopics(data.topics || [])
        }
        setLoadingTopics(false)
    }

    async function loadMessages(topic: Topic) {
        setLoadingMessages(true)
        setSelectedTopic(topic)
        setView('inbox')

        const res = await fetch(`/api/anon/messages?topicId=${topic.id}`)
        if (res.ok) {
            const data = await res.json()
            setMessages(data.messages || [])
        }
        setLoadingMessages(false)
    }

    // --- Topic Actions ---

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        setCreateLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        try {
            const res = await fetch("/api/anon/topics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user.id,
                    title,
                    question_text: question,
                    slug: customSlug || undefined
                })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Gagal membuat topik")
            }

            const { topic } = await res.json()
            setTopics([topic, ...topics])
            setIsCreateOpen(false)
            setTitle("")
            setQuestion("Ada masukan apa buat kita?")
            setCustomSlug("")
            toast.success("Topik berhasil dibuat!")
        } catch (error: any) {
            toast.error(error.message || "Gagal membuat topik")
        } finally {
            setCreateLoading(false)
        }
    }

    async function handleDeleteTopic(id: string) {
        if (!confirm("Yakin hapus topik ini? Semua pesan di dalamnya akan hilang permanen.")) return

        const res = await fetch(`/api/anon/topics?id=${id}`, { method: "DELETE" })
        if (res.ok) {
            setTopics(topics.filter(t => t.id !== id))
            toast.success("Topik dihapus")
        } else {
            toast.error("Gagal menghapus topik")
        }
    }

    function copyLink(slug: string) {
        const url = `${window.location.origin}/q/${slug}`
        navigator.clipboard.writeText(url)
        toast.success("Link disalin!", { description: "Siap dibagikan ke WhatsApp." })
    }

    // --- Edit Slug ---

    function openEditSlug(topic: Topic) {
        setEditSlugTopic(topic)
        setEditSlugValue(topic.slug)
        setEditSlugError("")
        setEditSlugOpen(true)
    }

    async function handleEditSlug() {
        if (!editSlugTopic || !editSlugValue.trim()) return
        setEditSlugLoading(true)
        setEditSlugError("")

        try {
            const res = await fetch("/api/anon/topics", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editSlugTopic.id, slug: editSlugValue.trim() })
            })

            if (!res.ok) {
                const err = await res.json()
                setEditSlugError(err.error || "Gagal mengubah link")
                return
            }

            const { topic: updated } = await res.json()
            setTopics(topics.map(t => t.id === updated.id ? { ...t, slug: updated.slug } : t))
            setEditSlugOpen(false)
            toast.success("Link berhasil diubah!")
        } catch (error: any) {
            setEditSlugError(error.message || "Gagal mengubah link")
        } finally {
            setEditSlugLoading(false)
        }
    }

    function shareWA(slug: string, question: string) {
        const url = `${window.location.origin}/q/${slug}`
        const text = `*🔒 Kirim pesan anonim ke Admin Rayo Kurir!*

"${question}"

Klik link ini untuk kirim pesan rahasia (tanpa login, identitas aman):
${url}`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }

    // --- Message Actions ---

    async function deleteMessage(e: React.MouseEvent, id: string) {
        e.stopPropagation() // Prevent triggering card click
        if (!confirm("Hapus pesan ini?")) return
        const res = await fetch(`/api/anon/messages?id=${id}`, { method: "DELETE" })
        if (res.ok) {
            setMessages(messages.filter(m => m.id !== id))
            toast.success("Pesan dihapus")
        }
    }

    async function togglePin(e: React.MouseEvent, id: string, current: boolean) {
        e.stopPropagation() // Prevent triggering card click
        setMessages(messages.map(m => m.id === id ? { ...m, is_pinned: !current } : m))
        await fetch("/api/anon/messages", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, is_pinned: !current })
        })
    }

    async function markRead(id: string) {
        // Optimistic update
        setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m))

        await fetch("/api/anon/messages", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, is_read: true })
        })
    }

    const filteredMessages = messages.filter(m => {
        if (filter === "unread") return !m.is_read
        if (filter === "pinned") return m.is_pinned
        return true
    })

    // --- Components ---

    const EmptyState = ({ type }: { type: 'topics' | 'messages' }) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center py-32 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 col-span-full"
        >
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${type === 'topics' ? 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
                {type === 'topics' ? <Sparkles className="w-8 h-8" /> : <Inbox className="w-8 h-8" />}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {type === 'topics' ? 'Belum Ada Topik' : 'Kotak Masuk Kosong'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8 leading-relaxed text-sm">
                {type === 'topics'
                    ? 'Buat topik pertanyaan pertama kamu untuk mulai menerima pesan rahasia dari anggota.'
                    : 'Belum ada pesan yang masuk di kategori ini. Bagikan link topik untuk mendapatkan respon.'}
            </p>
            {type === 'topics' && (
                <Button onClick={() => setIsCreateOpen(true)} className="h-10 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 px-6 text-sm font-medium transition-all hover:scale-105 active:scale-95">
                    <Plus className="w-4 h-4 mr-2" /> Buat Topik Baru
                </Button>
            )}
        </motion.div>
    )

    // --- Inbox View ---

    if (view === 'inbox' && selectedTopic) {
        return (
            <motion.div
                key="inbox"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col bg-slate-50 dark:bg-black/20 min-h-screen"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background/80 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 -ml-2" onClick={() => setView('list')}>
                            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {selectedTopic.title}
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md truncate">
                                {selectedTopic.question_text}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => loadMessages(selectedTopic)} className="hidden sm:flex h-9 px-3 rounded-lg text-xs font-medium border-slate-200 hover:bg-slate-50 hover:text-teal-600 bg-white">
                            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loadingMessages ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="px-6 pt-6 pb-2">
                    <Tabs defaultValue="all" className="w-full" onValueChange={setFilter}>
                        <TabsList className="bg-white dark:bg-slate-900 p-1 rounded-xl h-auto gap-1 border border-slate-200 dark:border-slate-800 shadow-sm inline-flex">
                            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none px-4 py-2 text-xs font-semibold tracking-wide transition-all">
                                SEMUA <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 h-5 px-1.5 min-w-[20px] rounded-md text-[10px]">{messages.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="unread" className="rounded-lg data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none px-4 py-2 text-xs font-semibold tracking-wide transition-all">
                                BELUM DIBACA {messages.filter(m => !m.is_read).length > 0 && <Badge variant="destructive" className="ml-2 h-5 px-1.5 min-w-[20px] rounded-md text-[10px] scale-100 animate-pulse">{messages.filter(m => !m.is_read).length}</Badge>}
                            </TabsTrigger>
                            <TabsTrigger value="pinned" className="rounded-lg data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none px-4 py-2 text-xs font-semibold tracking-wide transition-all">
                                DISEMATKAN {messages.filter(m => m.is_pinned).length > 0 && <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900 h-5 px-1.5 min-w-[20px] rounded-md text-[10px]">{messages.filter(m => m.is_pinned).length}</Badge>}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Message Content */}
                <ScrollArea className="flex-1">
                    <div className="p-6 pb-32 max-w-7xl mx-auto">
                        {loadingMessages && messages.length === 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-40 rounded-2xl bg-white dark:bg-slate-800 animate-pulse" />)}
                            </div>
                        ) : filteredMessages.length === 0 ? (
                            <EmptyState type="messages" />
                        ) : (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                                <AnimatePresence mode="popLayout">
                                    {filteredMessages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            variants={itemVariants}
                                            layout
                                            exit="exit"
                                            className="h-full"
                                        >
                                            <Card
                                                onClick={() => !msg.is_read && markRead(msg.id)} // Mark read on click
                                                className={cn(
                                                    "border-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 relative group overflow-hidden cursor-pointer h-full flex flex-col",
                                                    !msg.is_read
                                                        ? "bg-white dark:bg-slate-800 ring-1 ring-teal-500/50"
                                                        : "bg-white/60 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 opacity-90 hover:opacity-100"
                                                )}
                                            >
                                                {/* Left Indicator Strip for Unread */}
                                                {!msg.is_read && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 z-20" />
                                                )}

                                                <CardContent className="pt-5 pb-3 px-5 flex-1">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                                            !msg.is_read ? "bg-teal-50 text-teal-600" : "bg-slate-100 text-slate-400"
                                                        )}>
                                                            {!msg.is_read ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {msg.is_pinned && (
                                                                <Pin className="w-4 h-4 text-teal-500 fill-teal-500 rotate-45" />
                                                            )}
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: idLocale })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <p className={cn(
                                                        "text-base leading-relaxed whitespace-pre-wrap",
                                                        !msg.is_read ? "text-slate-900 dark:text-slate-100 font-semibold" : "text-slate-600 dark:text-slate-400 font-medium"
                                                    )}>
                                                        "{msg.content}"
                                                    </p>
                                                </CardContent>

                                                <CardFooter className="pt-0 pb-3 px-5 flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <Button size="icon" variant="ghost"
                                                        className={cn("h-8 w-8 rounded-full transition-all", msg.is_pinned ? "text-teal-500 bg-teal-50" : "text-slate-400 hover:text-teal-500 hover:bg-teal-50")}
                                                        onClick={(e) => togglePin(e, msg.id, msg.is_pinned)} title={msg.is_pinned ? "Lepas Pin" : "Sematkan"}>
                                                        <Pin className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" onClick={(e) => deleteMessage(e, msg.id)} title="Hapus">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </div>
                </ScrollArea>
            </motion.div>
        )
    }

    // --- List View ---

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8 pb-32"
            >
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                        <motion.h1
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3"
                        >
                            Kotak Anonim
                            <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                        </motion.h1>
                        <motion.p
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-500 dark:text-slate-400 max-w-xl text-sm font-medium"
                        >
                            Kelola pesan rahasia dan pertanyaan anonim dari kurir & mitra.
                        </motion.p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button className="rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 px-6 font-semibold shadow-lg shadow-slate-900/20">
                                    <Plus className="mr-2 h-4 w-4" /> Topik Baru
                                </Button>
                            </motion.div>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-900">
                            <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 to-emerald-500"></div>
                            <DialogHeader className="p-6 pb-2">
                                <DialogTitle className="text-xl font-bold">Buat Topik Baru</DialogTitle>
                                <DialogDescription>
                                    Buat ruang diskusi baru untuk menerima pesan anonim.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4 px-6 pb-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Judul Internal</Label>
                                    <Input
                                        placeholder="Misal: Feedback Operasional"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        required
                                        className="h-10 rounded-lg border-slate-200 bg-slate-50 focus:bg-white transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Pertanyaan Public</Label>
                                    <Input
                                        placeholder="Misal: Apa keluhanmu minggu ini?"
                                        value={question}
                                        onChange={e => setQuestion(e.target.value)}
                                        required
                                        className="h-10 rounded-lg border-slate-200 bg-slate-50 focus:bg-white transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                                        Custom Link <span className="text-[10px] font-normal normal-case text-slate-400">(opsional)</span>
                                    </Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono pointer-events-none">
                                            /q/
                                        </div>
                                        <Input
                                            placeholder="contoh: feedback-otr"
                                            value={customSlug}
                                            onChange={e => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                            className="h-10 rounded-lg border-slate-200 bg-slate-50 focus:bg-white transition-all font-mono text-sm pl-10"
                                        />
                                    </div>
                                    {customSlug && (
                                        <p className="text-[11px] text-teal-600 font-mono ml-1">
                                            rayokurir.com/q/{customSlug.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}
                                        </p>
                                    )}
                                    {!customSlug && (
                                        <p className="text-[11px] text-slate-400 ml-1">
                                            Kosongkan untuk link otomatis
                                        </p>
                                    )}
                                </div>
                                <DialogFooter className="pt-4">
                                    <Button type="submit" disabled={createLoading} className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold h-11">
                                        {createLoading ? "Memproses..." : "Buat Topik"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Topics Grid */}
                {loadingTopics ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-56 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
                    </div>
                ) : topics.length === 0 ? (
                    <EmptyState type="topics" />
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {topics.map((topic) => (
                            <motion.div
                                key={topic.id}
                                variants={itemVariants}
                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                className="h-full"
                            >
                                <Card className="group h-full flex flex-col border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[1.5rem] overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all duration-300 relative">
                                    <CardHeader className="pb-3 pt-6 px-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                                                <LayoutGrid className="w-5 h-5" />
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"><MoreVertical className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl w-48 shadow-lg border-slate-100 dark:border-slate-800">
                                                    <DropdownMenuItem onClick={() => copyLink(topic.slug)} className="py-2.5 px-3 font-medium cursor-pointer"><Copy className="mr-2 h-4 w-4 text-slate-400" /> Salin Link</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openEditSlug(topic)} className="py-2.5 px-3 font-medium cursor-pointer"><Pencil className="mr-2 h-4 w-4 text-slate-400" /> Edit Link</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => shareWA(topic.slug, topic.question_text)} className="py-2.5 px-3 font-medium cursor-pointer"><ExternalLink className="mr-2 h-4 w-4 text-slate-400" /> Share WhatsApp</DropdownMenuItem>
                                                    <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                                                    <DropdownMenuItem className="text-red-600 py-2.5 px-3 font-medium focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer" onClick={() => handleDeleteTopic(topic.id)}><Trash2 className="mr-2 h-4 w-4" /> Hapus Topik</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <CardTitle className="text-lg font-bold line-clamp-1 text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">
                                            {topic.title}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2 mt-1 text-sm font-medium text-slate-500">
                                            "{topic.question_text}"
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="px-6 pb-4 flex-1">
                                        <div className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between group-hover:border-teal-200 dark:group-hover:border-teal-800 transition-colors">
                                            <span className="text-xs font-mono text-slate-500 truncate max-w-[180px]">
                                                rayokurir.com/q/{topic.slug}
                                            </span>
                                            <div onClick={() => copyLink(topic.slug)} className="cursor-pointer p-1 hover:bg-white rounded-md transition-colors text-slate-400 hover:text-teal-600">
                                                <Copy className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="pt-0 pb-6 px-6 flex gap-2">
                                        <Button
                                            className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-xl h-10 text-sm font-semibold shadow-sm group-hover:translate-x-1 transition-all"
                                            onClick={() => loadMessages(topic)}
                                        >
                                            Buka Inbox <ArrowLeft className="ml-2 w-4 h-4 rotate-180" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </motion.div>

            {/* Edit Slug Dialog */}
            <Dialog open={editSlugOpen} onOpenChange={setEditSlugOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-900">
                    <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-teal-500"></div>
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Link2 className="w-5 h-5 text-teal-600" /> Edit Link
                        </DialogTitle>
                        <DialogDescription>
                            Ubah link anonim untuk topik "{editSlugTopic?.title}"
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 px-6 pb-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Custom Slug</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono pointer-events-none">
                                    /q/
                                </div>
                                <Input
                                    placeholder="contoh: otr"
                                    value={editSlugValue}
                                    onChange={e => { setEditSlugValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); setEditSlugError("") }}
                                    className="h-10 rounded-lg border-slate-200 bg-slate-50 focus:bg-white transition-all font-mono text-sm pl-10"
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && handleEditSlug()}
                                />
                            </div>
                            {editSlugValue && (
                                <p className="text-[11px] text-teal-600 font-mono ml-1">
                                    rayokurir.com/q/{editSlugValue.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}
                                </p>
                            )}
                            {editSlugError && (
                                <p className="text-[11px] text-red-500 font-medium ml-1">
                                    ⚠️ {editSlugError}
                                </p>
                            )}
                        </div>
                        <DialogFooter className="pt-2">
                            <Button
                                onClick={handleEditSlug}
                                disabled={editSlugLoading || !editSlugValue.trim() || editSlugValue.trim().length < 2}
                                className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold h-11"
                            >
                                {editSlugLoading ? "Menyimpan..." : "Simpan Link"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </AnimatePresence>
    )
}
