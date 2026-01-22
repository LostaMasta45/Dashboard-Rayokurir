"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Plus,
    Search,
    Trash2,
    Phone,
    RefreshCw,
    GripVertical,
    Upload,
    Pencil,
    Check,
    FileText,
    Users,
    MapPin,
    ArrowUp,
    Filter,
    Moon,
    Sun
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabaseClient";

// Drag and drop
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface UMKM {
    id: string;
    nama: string;
    zona: string;
    brosur_disebar: boolean;
    daftar_mitra: boolean;
    wa: string;
    catatan: string;
    sort_order: number;
    created_at: string;
}

// Mobile-First Card Component
function SortableItem({
    item,
    onUpdate,
    onDelete,
    onEdit
}: {
    item: UMKM;
    onUpdate: (id: string, field: string, value: boolean | string) => void;
    onDelete: (id: string, nama: string) => void;
    onEdit: (item: UMKM) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto",
        position: "relative" as "relative",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                group relative bg-card rounded-xl border shadow-sm mb-3 overflow-hidden transition-all
                ${isDragging ? "shadow-xl scale-[1.02] border-primary/50" : "hover:border-primary/20"}
            `}
        >
            <div className="flex">
                {/* Drag Handle - Large Touch Target */}
                <div
                    {...attributes}
                    {...listeners}
                    className="w-10 flex items-center justify-center bg-muted/30 cursor-grab active:cursor-grabbing touch-none border-r border-border/50"
                >
                    <GripVertical className="h-5 w-5 text-muted-foreground/70" />
                </div>

                <div className="flex-1 p-3 sm:p-4">
                    {/* Header: Name & Zone */}
                    <div className="flex justify-between items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-base sm:text-lg">
                                {item.nama}
                            </h3>
                            {item.wa && (
                                <a
                                    href={`https://wa.me/${item.wa.replace(/^0/, '62')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-green-600 flex items-center gap-1 mt-1 hover:underline"
                                >
                                    <Phone className="h-3 w-3" /> {item.wa}
                                </a>
                            )}
                        </div>
                        <Badge
                            variant="outline"
                            className={`whitespace-nowrap px-2 py-0.5 text-[10px] sm:text-xs font-medium border-0 ${item.zona === "KANAN"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                }`}
                        >
                            {item.zona === "KANAN" ? "KANAN JALAN" : "KIRI JALAN"}
                        </Badge>
                    </div>

                    {/* Actions Grid */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex gap-2 w-full sm:w-auto">
                            {/* Toggle Buttons */}
                            <button
                                onClick={() => onUpdate(item.id, "brosur_disebar", !item.brosur_disebar)}
                                className={`
                                    flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border
                                    ${item.brosur_disebar
                                        ? "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400"
                                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-muted/50 dark:border-border dark:text-muted-foreground"}
                                `}
                            >
                                <FileText className="h-4 w-4" />
                                <span>Brosur</span>
                                {item.brosur_disebar && <Check className="h-3 w-3 ml-1" />}
                            </button>

                            <button
                                onClick={() => onUpdate(item.id, "daftar_mitra", !item.daftar_mitra)}
                                className={`
                                    flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border
                                    ${item.daftar_mitra
                                        ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-muted/50 dark:border-border dark:text-muted-foreground"}
                                `}
                            >
                                <Users className="h-4 w-4" />
                                <span>Mitra</span>
                                {item.daftar_mitra && <Check className="h-3 w-3 ml-1" />}
                            </button>
                        </div>

                        {/* Edit & More Actions */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 sm:pl-2 sm:border-l border-gray-100 dark:border-gray-800">
                            <div className="relative flex-1 sm:flex-none flex items-center">
                                <Phone className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="No. WA"
                                    className="h-8 w-full sm:w-28 pl-8 text-xs bg-muted/30 border-transparent focus:bg-background focus:border-primary transition-all"
                                    value={item.wa}
                                    onChange={(e) => onUpdate(item.id, "wa", e.target.value)}
                                />
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                                onClick={() => onEdit(item)}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                onClick={() => onDelete(item.id, item.nama)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Initial data for seeding
const INITIAL_DATA = [
    // ZONA KANAN (46 items)
    { nama: "Es Jeruk / Es Teh", zona: "KANAN" },
    { nama: "Seblak Jeng Frisca", zona: "KANAN" },
    { nama: "Es Oyen", zona: "KANAN" },
    { nama: "Soto Daging Cak Ndut", zona: "KANAN" },
    { nama: "Kacang Godog", zona: "KANAN" },
    { nama: "Mie Goceng", zona: "KANAN" },
    { nama: "Warmindo", zona: "KANAN" },
    { nama: "Penjual Mainan", zona: "KANAN" },
    { nama: "Mie Ayam Semarang", zona: "KANAN" },
    { nama: "Es Degan Ijo Asli 5000", zona: "KANAN" },
    { nama: "Batagor Kaki Lima", zona: "KANAN" },
    { nama: "Angsle", zona: "KANAN" },
    { nama: "Jus Buah", zona: "KANAN" },
    { nama: "Es Teh Poci", zona: "KANAN" },
    { nama: "Lalapan Lele dll", zona: "KANAN" },
    { nama: "Es Podeng Manten", zona: "KANAN" },
    { nama: "Es Buah / Es Oyen", zona: "KANAN" },
    { nama: "Nasi Goreng", zona: "KANAN" },
    { nama: "Roti Bakar", zona: "KANAN" },
    { nama: "Gorengan Aneka Rasa", zona: "KANAN" },
    { nama: "Sosis Bakar, Kebab Sosis", zona: "KANAN" },
    { nama: "Martabak / Terang Bulan", zona: "KANAN" },
    { nama: "Arimusik Elektronik", zona: "KANAN" },
    { nama: "Es Manado", zona: "KANAN" },
    { nama: "Pentol Bakar", zona: "KANAN" },
    { nama: "DND Fried Chicken", zona: "KANAN" },
    { nama: "Bakwan Malang", zona: "KANAN" },
    { nama: "Seblak Mbak Puput", zona: "KANAN" },
    { nama: "Toko Komar", zona: "KANAN" },
    { nama: "Sempol Ayam", zona: "KANAN" },
    { nama: "Nita Elektronik", zona: "KANAN" },
    { nama: "Rocket Chicken", zona: "KANAN" },
    { nama: "Sate Kambing & Ayam Wetan Kali", zona: "KANAN" },
    { nama: "Mie Daily", zona: "KANAN" },
    { nama: "Onde Onde Ungu", zona: "KANAN" },
    { nama: "Nabihan Rumah Baju Anak Keren", zona: "KANAN" },
    { nama: "DMK ( Donat Mini Kentang )", zona: "KANAN" },
    { nama: "Es Kuwut", zona: "KANAN" },
    { nama: "Batagor & Gorengan", zona: "KANAN" },
    { nama: "Lalapan Purnama", zona: "KANAN" },
    { nama: "Roti Bakar 99", zona: "KANAN" },
    { nama: "Pisang Molen", zona: "KANAN" },
    { nama: "INDOMARET", zona: "KANAN" },
    { nama: "POM Bensin", zona: "KANAN" },
    { nama: "KOPSO ( Kopi Susu ) Dimsum", zona: "KANAN" },
    { nama: "Martabak Boss Que", zona: "KANAN" },
    // ZONA KIRI
    { nama: "BRI Link", zona: "KIRI" },
    { nama: "Roti Bakar", zona: "KIRI" },
    { nama: "Batagor", zona: "KIRI" },
    { nama: "Warung Unyil Pecel", zona: "KIRI" },
    { nama: "Penjual Ikan Hias", zona: "KIRI" },
    { nama: "Gorengan", zona: "KIRI" },
    { nama: "Sate Kambing", zona: "KIRI" },
    { nama: "Bengkel", zona: "KIRI" },
    { nama: "Penjual Buah dan Krupuk", zona: "KIRI" },
    { nama: "Penjual Sandal", zona: "KIRI" },
    { nama: "Toko Spiritual", zona: "KIRI" },
    { nama: "Toko Klontong", zona: "KIRI" },
    { nama: "Barbershop", zona: "KIRI" },
    { nama: "Tahu Tek", zona: "KIRI" },
    { nama: "ALFAMART", zona: "KIRI" },
    { nama: "Es Nyoklat", zona: "KIRI" },
    { nama: "Kebab Mitra Kebab", zona: "KIRI" },
    { nama: "Sempol Ayam", zona: "KIRI" },
    { nama: "Tahu Tek (2)", zona: "KIRI" },
    { nama: "Toko Pakan KUD", zona: "KIRI" },
    { nama: "Toko Undangan", zona: "KIRI" },
    { nama: "Barbershop (2)", zona: "KIRI" },
    { nama: "Es Capcin", zona: "KIRI" },
    { nama: "Bakso Urat Kikil 1", zona: "KIRI" },
    { nama: "INDOMARET", zona: "KIRI" },
    { nama: "Bengkel Sparepart Sepeda Motor", zona: "KIRI" },
    { nama: "Toko Kosmetik BELEZA", zona: "KIRI" },
    { nama: "Warkop Gajah Mada", zona: "KIRI" },
    { nama: "Toko Kabul Sparepart", zona: "KIRI" },
    { nama: "Warung Sayur", zona: "KIRI" },
    { nama: "Toko Ban", zona: "KIRI" },
    { nama: "Warung Bebek David", zona: "KIRI" },
    { nama: "Toko Parfum La Zasbia", zona: "KIRI" },
    { nama: "Konter HP Ari Cell / DAP", zona: "KIRI" },
    { nama: "Toko Sparepart", zona: "KIRI" },
    { nama: "Toko Jamu Jago", zona: "KIRI" },
    { nama: "Toko Madura", zona: "KIRI" },
    { nama: "Warung Sayur (2)", zona: "KIRI" },
    { nama: "Toko Madura (2)", zona: "KIRI" },
    { nama: "Puhung Keju", zona: "KIRI" },
    { nama: "Toko Peralatan Rumah Tangga", zona: "KIRI" },
    { nama: "Rumah Makan Padang Surya Minang", zona: "KIRI" },
    { nama: "Sego Babat", zona: "KIRI" },
    { nama: "Ganti Baterai Jam / Service Jam, Jahit Pakaian", zona: "KIRI" },
    { nama: "Proxy Cetak Foto", zona: "KIRI" },
    { nama: "MIXUE", zona: "KIRI" },
    { nama: "Kebab Turki", zona: "KIRI" },
    { nama: "Planet Ban", zona: "KIRI" },
    { nama: "ES Teh Presiden", zona: "KIRI" },
    { nama: "Konter Duta Phone", zona: "KIRI" },
    { nama: "Toko ATK Isi Joyo", zona: "KIRI" },
    { nama: "Es Degan", zona: "KIRI" },
    { nama: "Konter Laris Cell", zona: "KIRI" },
    { nama: "PS 3", zona: "KIRI" },
    { nama: "Rumah Makan Padang Minang Maimbau", zona: "KIRI" },
    { nama: "Martabak / Terang Bulan", zona: "KIRI" },
    { nama: "Pisang Goreng Coklat", zona: "KIRI" },
    { nama: "Ayam Geprek Jober", zona: "KIRI" },
    { nama: "ABG Aksesoris", zona: "KIRI" },
    { nama: "Soto Ayam Lamongan Cak Ipul", zona: "KIRI" },
    { nama: "Mie Ayam", zona: "KIRI" },
    { nama: "Toko Jaya Agung", zona: "KIRI" },
    { nama: "Toserba ROCKET", zona: "KIRI" },
    { nama: "Toserba Saudara Jaya", zona: "KIRI" },
    { nama: "Es Teh Poci", zona: "KIRI" },
    { nama: "Bakso Rakyat 99", zona: "KIRI" },
    { nama: "Seblak Ndower 99", zona: "KIRI" },
    { nama: "Dimsum Mentai 99", zona: "KIRI" },
    { nama: "Apotek Sumobito Farma", zona: "KIRI" },
    { nama: "KSP Podo Joyo", zona: "KIRI" },
    { nama: "Toko Nayla Snack", zona: "KIRI" },
    { nama: "Toko Hidayah Plastik", zona: "KIRI" },
    { nama: "Kidz Eduplay Playground", zona: "KIRI" },
    { nama: "Seblak Tomyum", zona: "KIRI" },
    { nama: "Takoyaki, Sosis Bakar Jumbo", zona: "KIRI" },
    { nama: "Tahu Tek (3)", zona: "KIRI" },
    { nama: "Toko Sandal", zona: "KIRI" },
    { nama: "Toko Roti Mutiara", zona: "KIRI" },
    { nama: "Puhung Keju (2)", zona: "KIRI" },
    { nama: "STMJ", zona: "KIRI" },
    { nama: "Es Oyen / Es Buah", zona: "KIRI" },
    { nama: "Sate Ayam", zona: "KIRI" },
    { nama: "Bengkel Sepeda Motor", zona: "KIRI" },
    { nama: "Toko Buah Firda Fruit", zona: "KIRI" },
    { nama: "Mie Jades", zona: "KIRI" },
    { nama: "ES Teh Point", zona: "KIRI" },
    { nama: "Sambelan Seafood", zona: "KIRI" },
    { nama: "FB Fashion Toko Baju Anak", zona: "KIRI" },
    { nama: "Warung Sate Mirasa 2", zona: "KIRI" },
    { nama: "Mie Ayam Cak eko", zona: "KIRI" },
    { nama: "Toko Nafisa Plastik", zona: "KIRI" },
    { nama: "Seblak Merdeka Bang Arif", zona: "KIRI" },
];

export default function RekapanPage() {
    const [umkmList, setUmkmList] = useState<UMKM[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [zonaFilter, setZonaFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUmkm, setNewUmkm] = useState({ nama: "", zona: "KANAN" });
    const [editItem, setEditItem] = useState<UMKM | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const { theme, setTheme } = useTheme();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("umkm")
            .select("*")
            .order("sort_order", { ascending: true })
            .order("zona", { ascending: true })
            .order("nama", { ascending: true });

        if (error) {
            console.error("Error loading UMKM:", error);
            toast.error("Gagal memuat data");
        } else {
            setUmkmList(data || []);
        }
        setLoading(false);
    };

    const seedInitialData = async () => {
        if (!confirm("Ini akan menambahkan 138 UMKM awal ke database. Lanjutkan?")) return;

        setLoading(true);
        const { error } = await supabase.from("umkm").insert(
            INITIAL_DATA.map((item, index) => ({
                nama: item.nama,
                zona: item.zona,
                brosur_disebar: false,
                daftar_mitra: false,
                wa: "",
                catatan: "",
                sort_order: index,
            }))
        );

        if (error) {
            console.error("Error seeding data:", error);
            toast.error("Gagal menambahkan data awal");
        } else {
            toast.success("138 UMKM berhasil ditambahkan!");
            loadData();
        }
        setLoading(false);
    };

    const handleUpdate = async (id: string, field: string, value: boolean | string) => {
        const { error } = await supabase
            .from("umkm")
            .update({ [field]: value, updated_at: new Date().toISOString() })
            .eq("id", id);

        if (error) {
            toast.error("Gagal update");
        } else {
            setUmkmList((prev) =>
                prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
            );
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = umkmList.findIndex((item) => item.id === active.id);
            const newIndex = umkmList.findIndex((item) => item.id === over.id);

            const newList = arrayMove(umkmList, oldIndex, newIndex);
            setUmkmList(newList);

            // Update sort_order in database
            const updates = newList.map((item, index) => ({
                id: item.id,
                sort_order: index,
            }));

            // Batch update
            for (const update of updates) {
                await supabase
                    .from("umkm")
                    .update({ sort_order: update.sort_order })
                    .eq("id", update.id);
            }

            toast.success("Urutan tersimpan!");
        }
    };

    const handleAdd = async () => {
        if (!newUmkm.nama.trim()) {
            toast.error("Nama UMKM harus diisi");
            return;
        }

        const maxOrder = Math.max(...umkmList.map(u => u.sort_order || 0), 0);

        const { error } = await supabase.from("umkm").insert({
            nama: newUmkm.nama,
            zona: newUmkm.zona,
            brosur_disebar: false,
            daftar_mitra: false,
            wa: "",
            catatan: "",
            sort_order: maxOrder + 1,
        });

        if (error) {
            toast.error("Gagal menambahkan UMKM");
        } else {
            toast.success("UMKM berhasil ditambahkan!");
            setNewUmkm({ nama: "", zona: "KANAN" });
            setShowAddModal(false);
            loadData();
        }
    };

    const handleEdit = async () => {
        if (!editItem) return;
        if (!editItem.nama.trim()) {
            toast.error("Nama UMKM harus diisi");
            return;
        }

        const { error } = await supabase
            .from("umkm")
            .update({
                nama: editItem.nama,
                zona: editItem.zona,
                updated_at: new Date().toISOString()
            })
            .eq("id", editItem.id);

        if (error) {
            toast.error("Gagal menyimpan perubahan");
        } else {
            toast.success("Perubahan tersimpan!");
            setUmkmList((prev) =>
                prev.map((item) =>
                    item.id === editItem.id
                        ? { ...item, nama: editItem.nama, zona: editItem.zona }
                        : item
                )
            );
            setShowEditModal(false);
            setEditItem(null);
        }
    };

    const handleDelete = async (id: string, nama: string) => {
        if (!confirm(`Hapus "${nama}" dari daftar?`)) return;

        const { error } = await supabase.from("umkm").delete().eq("id", id);

        if (error) {
            toast.error("Gagal menghapus UMKM");
        } else {
            toast.success("UMKM berhasil dihapus");
            setUmkmList((prev) => prev.filter((item) => item.id !== id));
        }
    };

    // Filter data
    const filteredList = umkmList.filter((item) => {
        const matchSearch = item.nama.toLowerCase().includes(searchQuery.toLowerCase());
        const matchZona = zonaFilter === "ALL" || item.zona === zonaFilter;
        const matchStatus =
            statusFilter === "ALL" ||
            (statusFilter === "BROSUR" && item.brosur_disebar) ||
            (statusFilter === "MITRA" && item.daftar_mitra) ||
            (statusFilter === "BELUM" && !item.brosur_disebar && !item.daftar_mitra);
        return matchSearch && matchZona && matchStatus;
    });

    // Stats
    const stats = {
        total: umkmList.length,
        brosur: umkmList.filter((i) => i.brosur_disebar).length,
        mitra: umkmList.filter((i) => i.daftar_mitra).length,
        kanan: umkmList.filter((i) => i.zona === "KANAN").length,
        kiri: umkmList.filter((i) => i.zona === "KIRI").length,
    };

    // Check if filtering is active
    const isFiltering = searchQuery || zonaFilter !== "ALL" || statusFilter !== "ALL";

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-black/5 pb-20">
            {/* Sticky Header with Stats */}
            <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b shadow-sm">
                <div className="container mx-auto p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                                Rayo UMKM Tracker
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                {stats.total} Total • {stats.brosur} Brosur • {stats.mitra} Mitra
                            </p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className="h-9 w-9 rounded-full bg-muted/40 hover:bg-muted/60"
                            >
                                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span className="sr-only">Toggle theme</span>
                            </Button>
                            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-sm rounded-full sm:rounded-md h-9 w-9 sm:w-auto p-0 sm:px-4">
                                        <Plus className="h-5 w-5 sm:mr-2" />
                                        <span className="hidden sm:inline">Tambah</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Tambah UMKM Baru</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <Input
                                            placeholder="Nama UMKM"
                                            value={newUmkm.nama}
                                            onChange={(e) => setNewUmkm({ ...newUmkm, nama: e.target.value })}
                                        />
                                        <Select
                                            value={newUmkm.zona}
                                            onValueChange={(v) => setNewUmkm({ ...newUmkm, zona: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Zona" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="KANAN">🔵 Kanan Jalan</SelectItem>
                                                <SelectItem value="KIRI">🟢 Kiri Jalan</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button onClick={handleAdd} className="w-full">
                                            Simpan
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Horizontal Scrollable Stats */}
                    <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 scrollbar-hide">
                        <div className="flex-none bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-2.5 min-w-[100px] flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</span>
                            <span className="text-[10px] font-medium text-blue-600/70 dark:text-blue-400/70 uppercase">Total UMKM</span>
                        </div>
                        <div className="flex-none bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl p-2.5 min-w-[100px] flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.brosur}</span>
                            <span className="text-[10px] font-medium text-orange-600/70 dark:text-orange-400/70 uppercase">Brosur</span>
                        </div>
                        <div className="flex-none bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl p-2.5 min-w-[100px] flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.mitra}</span>
                            <span className="text-[10px] font-medium text-green-600/70 dark:text-green-400/70 uppercase">Mitra</span>
                        </div>
                        <div className="flex-none bg-gray-50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 rounded-xl p-2.5 min-w-[100px] flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                                {Math.round((stats.mitra / (stats.total || 1)) * 100)}%
                            </span>
                            <span className="text-[10px] font-medium text-gray-500 uppercase">Konversi</span>
                        </div>
                    </div>

                    {/* Compact Filter Bar */}
                    <div className={`flex gap-2 transition-all overflow-hidden ${showFilters ? 'h-auto opacity-100' : 'h-10 opacity-100'}`}>
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama..."
                                className="pl-9 h-10 w-full bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-primary/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            variant={showFilters ? "secondary" : "outline"}
                            size="icon"
                            onClick={() => setShowFilters(!showFilters)}
                            className="shrink-0 h-10 w-10 border-0 bg-muted/40 hover:bg-muted/60"
                        >
                            <Filter className={`h-4 w-4 ${showFilters ? 'text-primary' : 'text-muted-foreground'}`} />
                        </Button>
                    </div>

                    {/* Expanded Filters */}
                    {showFilters && (
                        <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 fade-in">
                            <Select value={zonaFilter} onValueChange={setZonaFilter}>
                                <SelectTrigger className="bg-muted/40 border-0">
                                    <SelectValue placeholder="Zona" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua Zona</SelectItem>
                                    <SelectItem value="KANAN">🔵 Kanan</SelectItem>
                                    <SelectItem value="KIRI">🟢 Kiri</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="bg-muted/40 border-0">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua Status</SelectItem>
                                    <SelectItem value="BROSUR">✅ Brosur</SelectItem>
                                    <SelectItem value="MITRA">🎉 Mitra</SelectItem>
                                    <SelectItem value="BELUM">⏳ Menunggu</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content List */}
            <div className="container mx-auto p-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground">Memuat data UMKM...</p>
                    </div>
                ) : filteredList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 text-muted-foreground">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <FileText className="h-6 w-6 opacity-50" />
                        </div>
                        <p>Tidak ada UMKM yang ditemukan.</p>
                        {umkmList.length === 0 && (
                            <Button onClick={seedInitialData} variant="outline" className="mt-2">
                                <Upload className="h-4 w-4 mr-2" /> Load Data Awal
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        {isFiltering && (
                            <div className="mb-4 text-xs text-center text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20 py-2 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                ⚠️ Drag & drop dinonaktifkan saat filter aktif
                            </div>
                        )}

                        {isFiltering ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredList.map((item) => (
                                    <div key={item.id} className="group relative bg-card rounded-xl border shadow-sm p-4">
                                        <div className="flex justify-between items-start gap-3 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate">{item.nama}</h3>
                                            </div>
                                            <Badge variant="outline" className={item.zona === "KANAN" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>
                                                {item.zona}
                                            </Badge>
                                        </div>
                                        {/* Simplified Actions for Filtered View */}
                                        <div className="flex gap-2 mb-3">
                                            <div className={`flex-1 text-center text-xs py-1 rounded border ${item.brosur_disebar ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-500'}`}>
                                                {item.brosur_disebar ? 'Brosur OK' : 'No Brosur'}
                                            </div>
                                            <div className={`flex-1 text-center text-xs py-1 rounded border ${item.daftar_mitra ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500'}`}>
                                                {item.daftar_mitra ? 'Mitra OK' : 'Bukan Mitra'}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { setEditItem(item); setShowEditModal(true); }}
                                            className="w-full text-xs h-8 border"
                                        >
                                            <Pencil className="h-3 w-3 mr-2" /> Edit Detail
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={filteredList.map((item) => item.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-3 pb-8">
                                        {filteredList.map((item) => (
                                            <SortableItem
                                                key={item.id}
                                                item={item}
                                                onUpdate={handleUpdate}
                                                onDelete={handleDelete}
                                                onEdit={(item) => {
                                                    setEditItem(item);
                                                    setShowEditModal(true);
                                                }}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}

                        {/* Scroll to top fab if long list */}
                        {filteredList.length > 10 && (
                            <Button
                                size="icon"
                                className="fixed bottom-6 right-6 rounded-full shadow-lg z-30 opacity-80 hover:opacity-100 transition-opacity"
                                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                            >
                                <ArrowUp className="h-5 w-5" />
                            </Button>
                        )}
                    </>
                )}
            </div>

            {/* Edit Modal (Reused) */}
            <Dialog open={showEditModal} onOpenChange={(open) => {
                setShowEditModal(open);
                if (!open) setEditItem(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit UMKM</DialogTitle>
                    </DialogHeader>
                    {editItem && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Nama UMKM</label>
                                <Input
                                    placeholder="Nama UMKM"
                                    value={editItem.nama}
                                    onChange={(e) => setEditItem({ ...editItem, nama: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Zona</label>
                                <Select
                                    value={editItem.zona}
                                    onValueChange={(v) => setEditItem({ ...editItem, zona: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Zona" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="KANAN">🔵 Kanan Jalan</SelectItem>
                                        <SelectItem value="KIRI">🟢 Kiri Jalan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleEdit} className="w-full">
                                Simpan Perubahan
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
