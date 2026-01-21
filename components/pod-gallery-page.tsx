"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Camera,
    Calendar,
    User,
    MapPin,
    Package,
    Truck,
    Search,
    Filter,
    Image as ImageIcon,
    Clock,
    CheckCircle,
    X,
    ZoomIn,
    ExternalLink,
} from "lucide-react";
import {
    getOrders,
    getCouriers,
    formatCurrency,
    type Order,
    type Courier,
} from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

interface PODPhoto {
    url: string;
    fileId?: string;
    uploadedAt: string;
    uploadedBy: string;
}

interface OrderWithPOD extends Order {
    podPhotos: PODPhoto[];
}

export function PodGalleryPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<OrderWithPOD | null>(null);
    const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCourier, setSelectedCourier] = useState<string>("all");
    const [dateFilter, setDateFilter] = useState<string>("all");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ordersData, couriersData, courierPhotosResult] = await Promise.all([
                getOrders(),
                getCouriers(),
                supabase.from("courier_photos").select("*")
            ]);

            const loadedOrders = Array.isArray(ordersData) ? ordersData : [];
            const loadedCouriers = Array.isArray(couriersData) ? couriersData : [];

            // 1. Merge courier_photos into existing orders
            const unlinkedPhotos: any[] = [];

            if (courierPhotosResult.data) {
                courierPhotosResult.data.forEach((photo: any) => {
                    let matched = false;

                    if (photo.orderId) {
                        const order = loadedOrders.find(o => o.id === photo.orderId || o.id.endsWith(photo.orderId));
                        if (order) {
                            matched = true;
                            if (!order.podPhotos) order.podPhotos = [];
                            if (!order.podPhotos.some(p => p.url === photo.photoUrl)) {
                                order.podPhotos.push({
                                    url: photo.photoUrl,
                                    uploadedAt: photo.timestamp,
                                    uploadedBy: photo.kurirName || "Kurir",
                                    fileId: undefined
                                });
                            }
                        }
                    }

                    if (!matched) {
                        unlinkedPhotos.push(photo);
                    }
                });
            }

            // 2. Create "Virtual Orders" for unlinked photos
            const virtualOrders = unlinkedPhotos.map(photo => ({
                id: photo.orderId || `TESTIMONI-${photo.id.slice(0, 8)}`,
                createdAt: photo.timestamp,
                updatedAt: photo.timestamp,
                status: "SELESAI", // Treat as completed for visual consistency
                kurirId: photo.kurirId,
                pengirim: {
                    nama: photo.kurirName || "Kurir",
                    wa: "-"
                },
                pickup: { alamat: "Testimoni / Dokumentasi" },
                dropoff: { alamat: photo.description || "-" },
                ongkir: 0,
                danaTalangan: 0,
                cod: { isCOD: false, nominal: 0, codPaid: false },
                podPhotos: [{
                    url: photo.photoUrl,
                    uploadedAt: photo.timestamp,
                    uploadedBy: photo.kurirName || "Kurir",
                    fileId: undefined
                }]
            })) as Order[];

            setOrders([...loadedOrders, ...virtualOrders]);
            setCouriers(loadedCouriers);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter orders that have POD photos
    const ordersWithPod = useMemo(() => {
        return orders.filter(
            (order) => order.podPhotos && order.podPhotos.length > 0
        ) as OrderWithPOD[];
    }, [orders]);

    // Apply filters
    const filteredOrders = useMemo(() => {
        let filtered = ordersWithPod;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (order) =>
                    order.id.toLowerCase().includes(query) ||
                    order.pengirim.nama.toLowerCase().includes(query) ||
                    (order.dropoff as { nama?: string })?.nama?.toLowerCase().includes(query)
            );
        }

        // Courier filter
        if (selectedCourier !== "all") {
            filtered = filtered.filter((order) => order.kurirId === selectedCourier);
        }

        // Date filter
        if (dateFilter !== "all") {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            filtered = filtered.filter((order) => {
                const orderDate = new Date(order.createdAt);
                switch (dateFilter) {
                    case "today":
                        return orderDate >= today;
                    case "week":
                        const weekAgo = new Date(today);
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return orderDate >= weekAgo;
                    case "month":
                        const monthAgo = new Date(today);
                        monthAgo.setMonth(monthAgo.getMonth() - 1);
                        return orderDate >= monthAgo;
                    default:
                        return true;
                }
            });
        }

        return filtered;
    }, [ordersWithPod, searchQuery, selectedCourier, dateFilter]);

    // Stats
    const stats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thisWeek = new Date(today);
        thisWeek.setDate(thisWeek.getDate() - 7);

        return {
            total: ordersWithPod.length,
            today: ordersWithPod.filter(
                (o) => new Date(o.createdAt) >= today
            ).length,
            thisWeek: ordersWithPod.filter(
                (o) => new Date(o.createdAt) >= thisWeek
            ).length,
        };
    }, [ordersWithPod]);

    const getCourierName = (kurirId: string | null) => {
        if (!kurirId) return "Tidak diketahui";
        const courier = couriers.find((c) => c.id === kurirId);
        return courier?.nama || "Tidak diketahui";
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            SELESAI: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
            DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
            DIKIRIM: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    const getPhotoUrl = (photo: PODPhoto) => {
        if (!photo.url) return "/placeholder.svg";
        if (photo.url.startsWith("http")) return photo.url;
        // Assume it's a Telegram File ID if not http
        return `/api/telegram/image?fileId=${photo.url}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rayo-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 lg:p-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-rayo-dark dark:text-white flex items-center gap-2">
                        <Camera className="h-7 w-7 text-rayo-primary" />
                        Bukti Pengiriman
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Galeri foto POD dari kurir
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900 border-blue-100 dark:border-blue-900">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Foto</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {stats.total}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                                <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-200" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-900 border-green-100 dark:border-green-900">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Hari Ini</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {stats.today}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl">
                                <Clock className="h-5 w-5 text-green-600 dark:text-green-200" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-900 border-purple-100 dark:border-purple-900">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Minggu Ini</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {stats.thisWeek}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl">
                                <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-200" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari order ID, pengirim..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={selectedCourier} onValueChange={setSelectedCourier}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <Truck className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Kurir" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kurir</SelectItem>
                                {couriers.map((courier) => (
                                    <SelectItem key={courier.id} value={courier.id}>
                                        {courier.nama}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={dateFilter} onValueChange={setDateFilter}>
                            <SelectTrigger className="w-full sm:w-[150px]">
                                <Calendar className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Tanggal" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Waktu</SelectItem>
                                <SelectItem value="today">Hari Ini</SelectItem>
                                <SelectItem value="week">Minggu Ini</SelectItem>
                                <SelectItem value="month">Bulan Ini</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Photo Grid */}
            {filteredOrders.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                        <h3 className="text-lg font-medium mb-2">Belum Ada Foto POD</h3>
                        <p className="text-sm text-muted-foreground">
                            Foto bukti pengiriman akan muncul di sini setelah kurir mengupload
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredOrders.map((order) => (
                        <Card
                            key={order.id}
                            className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border-2 hover:border-rayo-primary/30"
                            onClick={() => setSelectedOrder(order)}
                        >
                            {/* Photo Preview */}
                            <div className="relative aspect-square bg-muted/20 overflow-hidden">
                                {order.podPhotos.length > 0 ? (
                                    <img
                                        src={getPhotoUrl(order.podPhotos[0])}
                                        alt={`POD ${order.id}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                                        <Camera className="h-12 w-12 text-muted-foreground/30" />
                                    </div>
                                )}
                                <div className="hidden fallback-icon w-full h-full absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                    <Camera className="h-12 w-12 text-muted-foreground/30" />
                                </div>

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                        <Badge className="bg-white/90 text-gray-800 text-xs">
                                            {order.podPhotos.length} foto
                                        </Badge>
                                        <Button size="sm" variant="secondary" className="h-7 px-2">
                                            <ZoomIn className="h-3 w-3 mr-1" /> Detail
                                        </Button>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <Badge className={`absolute top-2 right-2 ${getStatusBadge(order.status)} text-xs`}>
                                    {order.status}
                                </Badge>
                            </div>

                            {/* Card Info */}
                            <CardContent className="p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs text-muted-foreground">
                                        #{order.id.slice(-6)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(order.createdAt).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "short",
                                        })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="truncate font-medium">{order.pengirim.nama}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Truck className="h-3 w-3" />
                                    <span className="truncate">{getCourierName(order.kurirId)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Camera className="h-5 w-5 text-rayo-primary" />
                            Detail Bukti Pengiriman
                            {selectedOrder && (
                                <Badge variant="outline" className="ml-2">
                                    #{selectedOrder.id.slice(-6)}
                                </Badge>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedOrder && (
                        <ScrollArea className="flex-1 overflow-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                {/* Photos Section */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4" />
                                        Foto POD ({selectedOrder.podPhotos.length})
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {selectedOrder.podPhotos.map((photo, index) => (
                                            <div
                                                key={index}
                                                className="relative aspect-square rounded-lg overflow-hidden border cursor-pointer group"
                                                onClick={() => setLightboxPhoto(getPhotoUrl(photo))}
                                            >
                                                <img
                                                    src={getPhotoUrl(photo)}
                                                    alt={`POD ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <ZoomIn className="h-8 w-8 text-white" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Order Details */}
                                <div className="space-y-4">
                                    {/* Status & Date */}
                                    <div className="flex items-center gap-3">
                                        <Badge className={getStatusBadge(selectedOrder.status)}>
                                            {selectedOrder.status}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {new Date(selectedOrder.createdAt).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>

                                    <Separator />

                                    {/* Sender Info */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium flex items-center gap-2">
                                            <User className="h-4 w-4" /> Pengirim
                                        </h4>
                                        <div className="bg-muted/30 p-3 rounded-lg text-sm">
                                            <p className="font-medium">{selectedOrder.pengirim.nama}</p>
                                            <p className="text-muted-foreground">{selectedOrder.pengirim.wa}</p>
                                        </div>
                                    </div>

                                    {/* Route */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium flex items-center gap-2">
                                            <MapPin className="h-4 w-4" /> Rute
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-start gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Pickup</p>
                                                    <p>{selectedOrder.pickup.alamat}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Dropoff</p>
                                                    <p>{selectedOrder.dropoff.alamat}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Courier */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium flex items-center gap-2">
                                            <Truck className="h-4 w-4" /> Kurir
                                        </h4>
                                        <div className="bg-muted/30 p-3 rounded-lg text-sm">
                                            <p className="font-medium">{getCourierName(selectedOrder.kurirId)}</p>
                                        </div>
                                    </div>

                                    {/* Financials */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium flex items-center gap-2">
                                            <Package className="h-4 w-4" /> Keuangan
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                                                <p className="text-xs text-muted-foreground">Ongkir</p>
                                                <p className="font-bold text-blue-600">{formatCurrency(selectedOrder.ongkir)}</p>
                                            </div>
                                            {selectedOrder.cod.isCOD && (
                                                <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg">
                                                    <p className="text-xs text-muted-foreground">COD</p>
                                                    <p className="font-bold text-purple-600">{formatCurrency(selectedOrder.cod.nominal)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>

            {/* Lightbox */}
            {lightboxPhoto && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setLightboxPhoto(null)}
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-white hover:bg-white/20"
                        onClick={() => setLightboxPhoto(null)}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                    <img
                        src={lightboxPhoto}
                        alt="POD Full Size"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
