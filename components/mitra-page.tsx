"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Search,
    Plus,
    Store,
    Star,
    MapPin,
    Clock,
    Edit,
    Trash2,
    Menu as MenuIcon,
    ToggleLeft,
    ToggleRight,
    ImageIcon,
    Utensils,
    Trophy,
    Phone,
} from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/image-upload";
import {
    getMitra,
    saveMitra,
    updateMitra,
    deleteMitra,
    toggleMitraStatus,
    getMenuItems,
    saveMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuItemTerlaris,
    generateId,
    formatCurrency,
    MITRA_CATEGORIES,
    type Mitra,
    type MenuItem,
} from "@/lib/auth";

export function MitraPage() {
    const [mitraList, setMitraList] = useState<Mitra[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("semua");

    // Modal states
    const [isAddMitraOpen, setIsAddMitraOpen] = useState(false);
    const [isEditMitraOpen, setIsEditMitraOpen] = useState(false);
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
    const [isDeleteMitraOpen, setIsDeleteMitraOpen] = useState(false);
    const [isDeleteMenuOpen, setIsDeleteMenuOpen] = useState(false);

    // Selected items
    const [selectedMitra, setSelectedMitra] = useState<Mitra | null>(null);
    const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
    const [mitraMenuItems, setMitraMenuItems] = useState<MenuItem[]>([]);

    // Form data
    const [mitraForm, setMitraForm] = useState({
        nama: "",
        deskripsi: "",
        kategori: [] as string[],
        logo: "",
        cover: "",
        lokasi: "",
        waktuAntar: "",
        whatsapp: "",
        sedangBuka: true,
    });

    const [menuForm, setMenuForm] = useState({
        nama: "",
        deskripsi: "",
        harga: 0,
        gambar: "",
        kategoriMenu: "",
        terlaris: false,
        tersedia: true,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [mitraData, menuData] = await Promise.all([
                getMitra(),
                getMenuItems(),
            ]);
            setMitraList(mitraData);
            setMenuItems(menuData);
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Gagal memuat data mitra");
        } finally {
            setLoading(false);
        }
    };

    const resetMitraForm = () => {
        setMitraForm({
            nama: "",
            deskripsi: "",
            kategori: [],
            logo: "",
            cover: "",
            lokasi: "",
            waktuAntar: "",
            whatsapp: "",
            sedangBuka: true,
        });
    };

    const resetMenuForm = () => {
        setMenuForm({
            nama: "",
            deskripsi: "",
            harga: 0,
            gambar: "",
            kategoriMenu: "",
            terlaris: false,
            tersedia: true,
        });
    };

    // Mitra CRUD handlers
    const handleAddMitra = async () => {
        if (!mitraForm.nama.trim()) {
            toast.error("Nama mitra wajib diisi");
            return;
        }
        if (mitraForm.kategori.length === 0) {
            toast.error("Pilih minimal satu kategori");
            return;
        }

        const now = new Date().toISOString();
        const newMitra: Mitra = {
            id: generateId(),
            nama: mitraForm.nama.trim(),
            deskripsi: mitraForm.deskripsi.trim() || undefined,
            kategori: mitraForm.kategori,
            logo: mitraForm.logo || undefined,
            cover: mitraForm.cover || undefined,
            lokasi: mitraForm.lokasi.trim() || undefined,
            waktuAntar: mitraForm.waktuAntar.trim() || undefined,
            whatsapp: mitraForm.whatsapp.trim() || undefined,
            rating: 0,
            jumlahReview: 0,
            sedangBuka: mitraForm.sedangBuka,
            createdAt: now,
            updatedAt: now,
        };

        const result = await saveMitra(newMitra);
        if (result) {
            toast.success("Mitra berhasil ditambahkan");
            setIsAddMitraOpen(false);
            resetMitraForm();
            loadData();
        } else {
            toast.error("Gagal menambahkan mitra");
        }
    };

    const handleEditMitra = async () => {
        if (!selectedMitra) return;
        if (!mitraForm.nama.trim()) {
            toast.error("Nama mitra wajib diisi");
            return;
        }

        const updatedMitra: Mitra = {
            ...selectedMitra,
            nama: mitraForm.nama.trim(),
            deskripsi: mitraForm.deskripsi.trim() || undefined,
            kategori: mitraForm.kategori,
            logo: mitraForm.logo || undefined,
            cover: mitraForm.cover || undefined,
            lokasi: mitraForm.lokasi.trim() || undefined,
            waktuAntar: mitraForm.waktuAntar.trim() || undefined,
            whatsapp: mitraForm.whatsapp.trim() || undefined,
            sedangBuka: mitraForm.sedangBuka,
        };

        const result = await updateMitra(updatedMitra);
        if (result) {
            toast.success("Mitra berhasil diperbarui");
            setIsEditMitraOpen(false);
            setSelectedMitra(null);
            resetMitraForm();
            loadData();
        } else {
            toast.error("Gagal memperbarui mitra");
        }
    };

    const handleDeleteMitra = async () => {
        if (!selectedMitra) return;
        const result = await deleteMitra(selectedMitra.id);
        if (result) {
            toast.success("Mitra berhasil dihapus");
            setIsDeleteMitraOpen(false);
            setSelectedMitra(null);
            loadData();
        } else {
            toast.error("Gagal menghapus mitra");
        }
    };

    const handleToggleStatus = async (mitra: Mitra) => {
        const result = await toggleMitraStatus(mitra.id);
        if (result) {
            toast.success(`${mitra.nama} ${result.sedangBuka ? "dibuka" : "ditutup"}`);
            loadData();
        }
    };

    // Menu CRUD handlers
    const openMenuModal = async (mitra: Mitra) => {
        setSelectedMitra(mitra);
        const items = menuItems.filter((m) => m.mitraId === mitra.id);
        setMitraMenuItems(items);
        setIsMenuModalOpen(true);
    };

    const handleAddMenu = async () => {
        if (!selectedMitra) return;
        if (!menuForm.nama.trim()) {
            toast.error("Nama menu wajib diisi");
            return;
        }
        if (menuForm.harga <= 0) {
            toast.error("Harga harus lebih dari 0");
            return;
        }

        const now = new Date().toISOString();
        const newMenu: MenuItem = {
            id: generateId(),
            mitraId: selectedMitra.id,
            nama: menuForm.nama.trim(),
            deskripsi: menuForm.deskripsi.trim() || undefined,
            harga: menuForm.harga,
            gambar: menuForm.gambar || undefined,
            kategoriMenu: menuForm.kategoriMenu.trim() || undefined,
            terlaris: menuForm.terlaris,
            tersedia: menuForm.tersedia,
            createdAt: now,
            updatedAt: now,
        };

        const result = await saveMenuItem(newMenu);
        if (result) {
            toast.success("Menu berhasil ditambahkan");
            setIsAddMenuOpen(false);
            resetMenuForm();
            const items = await getMenuItems(selectedMitra.id);
            setMitraMenuItems(items);
            loadData();
        } else {
            toast.error("Gagal menambahkan menu");
        }
    };

    const handleEditMenu = async () => {
        if (!selectedMenuItem) return;
        if (!menuForm.nama.trim()) {
            toast.error("Nama menu wajib diisi");
            return;
        }
        if (menuForm.harga <= 0) {
            toast.error("Harga harus lebih dari 0");
            return;
        }

        const updatedMenu: MenuItem = {
            ...selectedMenuItem,
            nama: menuForm.nama.trim(),
            deskripsi: menuForm.deskripsi.trim() || undefined,
            harga: menuForm.harga,
            gambar: menuForm.gambar || undefined,
            kategoriMenu: menuForm.kategoriMenu.trim() || undefined,
            terlaris: menuForm.terlaris,
            tersedia: menuForm.tersedia,
        };

        const result = await updateMenuItem(updatedMenu);
        if (result) {
            toast.success("Menu berhasil diperbarui");
            setIsEditMenuOpen(false);
            setSelectedMenuItem(null);
            resetMenuForm();
            if (selectedMitra) {
                const items = await getMenuItems(selectedMitra.id);
                setMitraMenuItems(items);
            }
            loadData();
        } else {
            toast.error("Gagal memperbarui menu");
        }
    };

    const handleToggleTerlaris = async (menuItem: MenuItem) => {
        const result = await toggleMenuItemTerlaris(menuItem.id);
        if (result) {
            toast.success(result.terlaris ? "Ditandai sebagai terlaris" : "Tanda terlaris dihapus");
            if (selectedMitra) {
                const items = await getMenuItems(selectedMitra.id);
                setMitraMenuItems(items);
            }
            loadData();
        }
    };

    const handleDeleteMenu = async () => {
        if (!selectedMenuItem) return;
        const result = await deleteMenuItem(selectedMenuItem.id);
        if (result) {
            toast.success("Menu berhasil dihapus");
            setIsDeleteMenuOpen(false);
            setSelectedMenuItem(null);
            if (selectedMitra) {
                const items = await getMenuItems(selectedMitra.id);
                setMitraMenuItems(items);
            }
            loadData();
        } else {
            toast.error("Gagal menghapus menu");
        }
    };

    const openEditMitra = (mitra: Mitra) => {
        setSelectedMitra(mitra);
        setMitraForm({
            nama: mitra.nama,
            deskripsi: mitra.deskripsi || "",
            kategori: mitra.kategori,
            logo: mitra.logo || "",
            cover: mitra.cover || "",
            lokasi: mitra.lokasi || "",
            waktuAntar: mitra.waktuAntar || "",
            whatsapp: mitra.whatsapp || "",
            sedangBuka: mitra.sedangBuka,
        });
        setIsEditMitraOpen(true);
    };

    const openEditMenu = (menuItem: MenuItem) => {
        setSelectedMenuItem(menuItem);
        setMenuForm({
            nama: menuItem.nama,
            deskripsi: menuItem.deskripsi || "",
            harga: menuItem.harga,
            gambar: menuItem.gambar || "",
            kategoriMenu: menuItem.kategoriMenu || "",
            terlaris: menuItem.terlaris,
            tersedia: menuItem.tersedia,
        });
        setIsEditMenuOpen(true);
    };

    const toggleKategori = (kategoriId: string) => {
        setMitraForm((prev) => ({
            ...prev,
            kategori: prev.kategori.includes(kategoriId)
                ? prev.kategori.filter((k) => k !== kategoriId)
                : [...prev.kategori, kategoriId],
        }));
    };

    // Filter mitra
    const filteredMitra = mitraList.filter((mitra) => {
        const matchesSearch = mitra.nama.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "semua" || mitra.kategori.includes(selectedCategory);
        return matchesSearch && matchesCategory;
    });

    const getMenuCount = (mitraId: string) => {
        return menuItems.filter((m) => m.mitraId === mitraId).length;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rayo-primary"></div>
            </div>
        );
    }

    // Inline form JSX for Mitra
    const renderMitraForm = () => (
        <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="info" className="gap-2">
                    <Store className="h-4 w-4" />
                    Informasi
                </TabsTrigger>
                <TabsTrigger value="media" className="gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Foto
                </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
                <div>
                    <Label className="text-base font-semibold">Nama Mitra *</Label>
                    <Input
                        placeholder="Contoh: Warung Bu Yanti"
                        value={mitraForm.nama}
                        onChange={(e) => setMitraForm({ ...mitraForm, nama: e.target.value })}
                        className="mt-1.5 h-12"
                    />
                </div>

                <div>
                    <Label className="text-base font-semibold">Deskripsi</Label>
                    <Textarea
                        placeholder="Deskripsi singkat tentang mitra..."
                        value={mitraForm.deskripsi}
                        onChange={(e) => setMitraForm({ ...mitraForm, deskripsi: e.target.value })}
                        className="mt-1.5 min-h-[80px]"
                    />
                </div>

                <div>
                    <Label className="text-base font-semibold">Kategori *</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {MITRA_CATEGORIES.map((cat) => (
                            <Button
                                key={cat.id}
                                type="button"
                                variant={mitraForm.kategori.includes(cat.id) ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleKategori(cat.id)}
                                className={`h-10 px-4 ${mitraForm.kategori.includes(cat.id) ? "bg-teal-500 hover:bg-teal-600" : ""}`}
                            >
                                <span className="mr-1">{cat.icon}</span> {cat.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-base font-semibold flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Lokasi
                        </Label>
                        <Input
                            placeholder="Desa Sumobito, Jombang"
                            value={mitraForm.lokasi}
                            onChange={(e) => setMitraForm({ ...mitraForm, lokasi: e.target.value })}
                            className="mt-1.5 h-12"
                        />
                    </div>
                    <div>
                        <Label className="text-base font-semibold flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Estimasi Antar
                        </Label>
                        <Input
                            placeholder="15-25 menit"
                            value={mitraForm.waktuAntar}
                            onChange={(e) => setMitraForm({ ...mitraForm, waktuAntar: e.target.value })}
                            className="mt-1.5 h-12"
                        />
                    </div>
                </div>

                <div>
                    <Label className="text-base font-semibold flex items-center gap-2">
                        <Phone className="h-4 w-4" /> No. WhatsApp
                    </Label>
                    <Input
                        placeholder="081234567890"
                        value={mitraForm.whatsapp}
                        onChange={(e) => setMitraForm({ ...mitraForm, whatsapp: e.target.value })}
                        className="mt-1.5 h-12"
                    />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div>
                        <Label className="text-base font-semibold">Status Buka</Label>
                        <p className="text-sm text-gray-500">Mitra akan tampil di halaman publik</p>
                    </div>
                    <Switch
                        checked={mitraForm.sedangBuka}
                        onCheckedChange={(checked) => setMitraForm({ ...mitraForm, sedangBuka: checked })}
                    />
                </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-6">
                <div>
                    <Label className="text-base font-semibold mb-3 block">Logo Mitra</Label>
                    <p className="text-sm text-gray-500 mb-3">Ukuran ideal: 200x200 pixel (rasio 1:1)</p>
                    <ImageUpload
                        value={mitraForm.logo}
                        onChange={(url) => setMitraForm({ ...mitraForm, logo: url })}
                        bucket="mitra-images"
                        folder="logos"
                        placeholder="Upload logo mitra"
                        aspectRatio="square"
                        className="max-w-[200px]"
                    />
                </div>

                <div>
                    <Label className="text-base font-semibold mb-3 block">Foto Cover / Tempat</Label>
                    <p className="text-sm text-gray-500 mb-3">Ukuran ideal: 800x400 pixel (rasio 2:1)</p>
                    <ImageUpload
                        value={mitraForm.cover}
                        onChange={(url) => setMitraForm({ ...mitraForm, cover: url })}
                        bucket="mitra-images"
                        folder="covers"
                        placeholder="Upload foto tempat/cover"
                        aspectRatio="video"
                    />
                </div>
            </TabsContent>
        </Tabs>
    );

    // Inline form JSX for Menu
    const renderMenuForm = () => (
        <div className="space-y-5">
            <div>
                <Label className="text-base font-semibold">Foto Menu</Label>
                <p className="text-sm text-gray-500 mb-3">Foto makanan/minuman yang menarik</p>
                <ImageUpload
                    value={menuForm.gambar}
                    onChange={(url) => setMenuForm({ ...menuForm, gambar: url })}
                    bucket="mitra-images"
                    folder="menus"
                    placeholder="Upload foto menu"
                    aspectRatio="square"
                    className="max-w-[200px]"
                />
            </div>

            <div>
                <Label className="text-base font-semibold">Nama Menu *</Label>
                <Input
                    placeholder="Contoh: Nasi Pecel Komplit"
                    value={menuForm.nama}
                    onChange={(e) => setMenuForm({ ...menuForm, nama: e.target.value })}
                    className="mt-1.5 h-12"
                />
            </div>

            <div>
                <Label className="text-base font-semibold">Deskripsi</Label>
                <Textarea
                    placeholder="Deskripsi menu..."
                    value={menuForm.deskripsi}
                    onChange={(e) => setMenuForm({ ...menuForm, deskripsi: e.target.value })}
                    className="mt-1.5"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-base font-semibold">Harga (Rp) *</Label>
                    <Input
                        type="number"
                        placeholder="15000"
                        value={menuForm.harga || ""}
                        onChange={(e) => setMenuForm({ ...menuForm, harga: parseInt(e.target.value) || 0 })}
                        className="mt-1.5 h-12"
                    />
                </div>
                <div>
                    <Label className="text-base font-semibold">Kategori Menu</Label>
                    <Input
                        placeholder="Nasi, Mie, Minuman"
                        value={menuForm.kategoriMenu}
                        onChange={(e) => setMenuForm({ ...menuForm, kategoriMenu: e.target.value })}
                        className="mt-1.5 h-12"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        <div>
                            <Label className="text-base font-semibold">Menu Terlaris</Label>
                            <p className="text-sm text-gray-500">Tampilkan badge terlaris</p>
                        </div>
                    </div>
                    <Switch
                        checked={menuForm.terlaris}
                        onCheckedChange={(checked) => setMenuForm({ ...menuForm, terlaris: checked })}
                    />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div>
                        <Label className="text-base font-semibold">Tersedia</Label>
                        <p className="text-sm text-gray-500">Menu akan tampil di halaman publik</p>
                    </div>
                    <Switch
                        checked={menuForm.tersedia}
                        onCheckedChange={(checked) => setMenuForm({ ...menuForm, tersedia: checked })}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Store className="h-7 w-7 text-teal-500" />
                        Kelola Mitra
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {mitraList.length} mitra terdaftar
                    </p>
                </div>
                <Button
                    onClick={() => {
                        resetMitraForm();
                        setIsAddMitraOpen(true);
                    }}
                    className="bg-teal-500 hover:bg-teal-600 text-white h-12 px-6"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Tambah Mitra
                </Button>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Cari mitra..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    <Button
                        variant={selectedCategory === "semua" ? "default" : "outline"}
                        onClick={() => setSelectedCategory("semua")}
                        className={`h-12 ${selectedCategory === "semua" ? "bg-teal-500 hover:bg-teal-600" : ""}`}
                    >
                        🍽️ Semua
                    </Button>
                    {MITRA_CATEGORIES.map((cat) => (
                        <Button
                            key={cat.id}
                            variant={selectedCategory === cat.id ? "default" : "outline"}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`h-12 whitespace-nowrap ${selectedCategory === cat.id ? "bg-teal-500 hover:bg-teal-600" : ""}`}
                        >
                            {cat.icon} {cat.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Mitra Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMitra.map((mitra) => (
                    <Card key={mitra.id} className="overflow-hidden hover:shadow-lg transition-all group">
                        {/* Cover Image */}
                        <div className="relative h-36 bg-gradient-to-r from-teal-100 to-teal-50 dark:from-teal-900/30 dark:to-teal-800/20">
                            {mitra.cover ? (
                                <img
                                    src={mitra.cover}
                                    alt={mitra.nama}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="h-12 w-12 text-teal-300" />
                                </div>
                            )}
                            {/* Status Badge */}
                            <Badge
                                className={`absolute top-2 right-2 ${mitra.sedangBuka
                                    ? "bg-green-500 hover:bg-green-600"
                                    : "bg-red-500 hover:bg-red-600"
                                    } text-white font-bold`}
                            >
                                {mitra.sedangBuka ? "🟢 BUKA" : "🔴 TUTUP"}
                            </Badge>
                            {/* Logo */}
                            <div className="absolute -bottom-6 left-4 w-14 h-14 rounded-xl overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg bg-white dark:bg-gray-700">
                                {mitra.logo ? (
                                    <img
                                        src={mitra.logo}
                                        alt={mitra.nama}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-teal-100 dark:bg-teal-900">
                                        <Store className="h-6 w-6 text-teal-500" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <CardContent className="pt-8 pb-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                    {mitra.nama}
                                </h3>
                                <div className="flex items-center gap-1 text-yellow-500">
                                    <Star className="h-4 w-4 fill-current" />
                                    <span className="text-sm font-medium">{mitra.rating.toFixed(1)}</span>
                                    <span className="text-xs text-gray-400">({mitra.jumlahReview})</span>
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="flex flex-wrap gap-1 mb-3">
                                {mitra.kategori.map((kat) => {
                                    const category = MITRA_CATEGORIES.find((c) => c.id === kat);
                                    return (
                                        <Badge key={kat} variant="secondary" className="text-xs">
                                            {category?.icon} {category?.label}
                                        </Badge>
                                    );
                                })}
                            </div>

                            {/* Info */}
                            <div className="space-y-1 text-sm text-gray-500 mb-4">
                                {mitra.lokasi && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span className="truncate">{mitra.lokasi}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-4">
                                    {mitra.waktuAntar && (
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4 text-gray-400" />
                                            <span>{mitra.waktuAntar}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <Utensils className="h-4 w-4 text-gray-400" />
                                        <span>{getMenuCount(mitra.id)} menu</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-11"
                                    onClick={() => openMenuModal(mitra)}
                                >
                                    <MenuIcon className="h-4 w-4 mr-2" />
                                    Menu ({getMenuCount(mitra.id)})
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-11 w-11"
                                    onClick={() => openEditMitra(mitra)}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-11 w-11"
                                    onClick={() => handleToggleStatus(mitra)}
                                >
                                    {mitra.sedangBuka ? (
                                        <ToggleRight className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <ToggleLeft className="h-5 w-5 text-red-500" />
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-11 w-11 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => {
                                        setSelectedMitra(mitra);
                                        setIsDeleteMitraOpen(true);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredMitra.length === 0 && (
                <div className="text-center py-16">
                    <Store className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Tidak ada mitra ditemukan
                    </h3>
                    <p className="text-gray-500">Ubah filter atau tambah mitra baru</p>
                </div>
            )}

            {/* Add Mitra Modal */}
            <Dialog open={isAddMitraOpen} onOpenChange={setIsAddMitraOpen}>
                <DialogContent className="max-w-xl w-[95vw] max-h-[85vh] overflow-y-auto">
                    <DialogHeader className="pb-4 border-b">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Plus className="h-5 w-5 text-teal-500" />
                            Tambah Mitra Baru
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {renderMitraForm()}
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsAddMitraOpen(false)} className="flex-1 h-12">
                            Batal
                        </Button>
                        <Button onClick={handleAddMitra} className="flex-1 bg-teal-500 hover:bg-teal-600 h-12">
                            Simpan Mitra
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Mitra Modal */}
            <Dialog open={isEditMitraOpen} onOpenChange={setIsEditMitraOpen}>
                <DialogContent className="max-w-xl w-[95vw] max-h-[85vh] overflow-y-auto">
                    <DialogHeader className="pb-4 border-b">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Edit className="h-5 w-5 text-teal-500" />
                            Edit Mitra
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {renderMitraForm()}
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsEditMitraOpen(false)} className="flex-1 h-12">
                            Batal
                        </Button>
                        <Button onClick={handleEditMitra} className="flex-1 bg-teal-500 hover:bg-teal-600 h-12">
                            Simpan Perubahan
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Menu Modal */}
            <Dialog open={isMenuModalOpen} onOpenChange={setIsMenuModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Utensils className="h-5 w-5 text-teal-500" />
                            Menu: {selectedMitra?.nama}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                        <Button
                            onClick={() => {
                                resetMenuForm();
                                setIsAddMenuOpen(true);
                            }}
                            className="bg-teal-500 hover:bg-teal-600 mb-4 h-11"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Menu
                        </Button>

                        <ScrollArea className="h-[50vh]">
                            {mitraMenuItems.length === 0 ? (
                                <div className="text-center py-12">
                                    <Utensils className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-500">Belum ada menu</p>
                                    <p className="text-sm text-gray-400 mt-1">Tambah menu pertama untuk mitra ini</p>
                                </div>
                            ) : (
                                <div className="space-y-3 pr-4">
                                    {mitraMenuItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                                                {item.gambar ? (
                                                    <img
                                                        src={item.gambar}
                                                        alt={item.nama}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ImageIcon className="h-8 w-8 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{item.nama}</h4>
                                                    {item.terlaris && (
                                                        <Badge className="bg-amber-500 text-white">🏆 Terlaris</Badge>
                                                    )}
                                                    {!item.tersedia && (
                                                        <Badge variant="secondary" className="bg-gray-200">Tidak Tersedia</Badge>
                                                    )}
                                                </div>
                                                {item.deskripsi && (
                                                    <p className="text-sm text-gray-500 line-clamp-1 mt-1">{item.deskripsi}</p>
                                                )}
                                                <p className="font-bold text-teal-600 mt-1 text-lg">
                                                    {formatCurrency(item.harga)}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-10 w-10"
                                                    onClick={() => handleToggleTerlaris(item)}
                                                    title="Toggle Terlaris"
                                                >
                                                    <Star className={`h-4 w-4 ${item.terlaris ? "fill-amber-500 text-amber-500" : "text-gray-400"}`} />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-10 w-10"
                                                    onClick={() => openEditMenu(item)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-10 w-10 text-red-500 hover:bg-red-50"
                                                    onClick={() => {
                                                        setSelectedMenuItem(item);
                                                        setIsDeleteMenuOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Menu Modal */}
            <Dialog open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
                <DialogContent className="max-w-lg w-[95vw] max-h-[85vh] overflow-y-auto">
                    <DialogHeader className="pb-4 border-b">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Plus className="h-5 w-5 text-teal-500" />
                            Tambah Menu Baru
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {renderMenuForm()}
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsAddMenuOpen(false)} className="flex-1 h-12">
                            Batal
                        </Button>
                        <Button onClick={handleAddMenu} className="flex-1 bg-teal-500 hover:bg-teal-600 h-12">
                            Simpan Menu
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Menu Modal */}
            <Dialog open={isEditMenuOpen} onOpenChange={setIsEditMenuOpen}>
                <DialogContent className="max-w-lg w-[95vw] max-h-[85vh] overflow-y-auto">
                    <DialogHeader className="pb-4 border-b">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Edit className="h-5 w-5 text-teal-500" />
                            Edit Menu
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {renderMenuForm()}
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsEditMenuOpen(false)} className="flex-1 h-12">
                            Batal
                        </Button>
                        <Button onClick={handleEditMenu} className="flex-1 bg-teal-500 hover:bg-teal-600 h-12">
                            Simpan Perubahan
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Mitra Confirmation */}
            <AlertDialog open={isDeleteMitraOpen} onOpenChange={setIsDeleteMitraOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Mitra?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus <strong>{selectedMitra?.nama}</strong>?
                            Semua menu yang terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteMitra}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Ya, Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Menu Confirmation */}
            <AlertDialog open={isDeleteMenuOpen} onOpenChange={setIsDeleteMenuOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Menu?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus <strong>{selectedMenuItem?.nama}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteMenu}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Ya, Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
