"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Package,
    CheckCircle,
    Clock,
    DollarSign,
    Truck,
    Camera,
    X,
    Plus,
    Moon,
    Sun,
    Search,
    Image as ImageIcon,
    ChevronRight,
    MapPin,
    Phone,
    Calendar,
} from "lucide-react";
import { CourierCODDepositModal } from "@/components/courier-cod-deposit-modal";
import { PhotoUploadModal } from "@/components/photo-upload-modal";
import { CourierBottomNav } from "@/components/courier-bottom-nav";
import { CourierKanbanBoard } from "@/components/courier-kanban-board";
import { CourierStats } from "@/components/courier-stats";

import {
    getOrders,
    updateOrder,
    formatCurrency,
    formatDate,
    type Order,
    type User,
} from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

interface KurirDashboardProps {
    user: User;
    viewMode?: string;
}

export function KurirDashboard({ user, viewMode }: KurirDashboardProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [showCODModal, setShowCODModal] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showOrderDetail, setShowOrderDetail] = useState(false);
    const [orderViewMode, setOrderViewMode] = useState<"list" | "kanban">("kanban");
    const [uploadedPhotos, setUploadedPhotos] = useState<
        Array<{
            id: string;
            kurirId: string;
            kurirName: string;
            photoUrl: string;
            description: string;
            timestamp: string;
            orderId?: string;
        }>
    >([]);

    // TABS STATE
    const [activeTab, setActiveTab] = useState("home");

    useEffect(() => {
        if (viewMode) {
            setActiveTab(viewMode);
        }
    }, [viewMode]);

    useEffect(() => {
        const loadAll = async () => {
            const data = await getOrders();
            setOrders(data);
            // Load uploaded photos metadata from Supabase DB
            const { data: photos, error } = await supabase
                .from("courier_photos")
                .select("*");
            if (!error && photos) {
                setUploadedPhotos(photos);
            }
        };
        loadAll();
    }, []);

    // Refresh uploaded photos after upload
    const handlePhotoUploaded = () => {
        setShowPhotoModal(false);
        const savedPhotos = localStorage.getItem("courier_photos");
        if (savedPhotos) {
            setUploadedPhotos(JSON.parse(savedPhotos));
        }
    };


    // Filter orders for current courier
    const courierOrders = Array.isArray(orders)
        ? orders.filter((order) => order.kurirId === user.courierId)
        : [];

    // // DEBUG: tampilkan courierId user dan semua order beserta kurirId-nya jika role ADMIN
    // const debugInfo = (
    //     <div className="mb-4 p-2 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-900">
    //         <div>
    //             <b>Debug Info</b>
    //         </div>
    //         <div>
    //             User courierId: <code>{String(user.courierId)}</code>
    //         </div>
    //         <div>
    //             User role: <code>{user.role}</code>
    //         </div>
    //         {user.role === "ADMIN" && (
    //             <div className="mt-2">
    //                 <b>All Orders (kurirId):</b>
    //                 <ul className="list-disc ml-4">
    //                     {orders.map((o) => (
    //                         <li key={o.id}>
    //                             Order <b>{o.id}</b> - kurirId:{" "}
    //                             <code>{String(o.kurirId)}</code>
    //                         </li>
    //                     ))}
    //                 </ul>
    //             </div>
    //         )}
    //     </div>
    // );

    const stats = {
        total: courierOrders.length,
        menunggu: courierOrders.filter(
            (order) => ["NEW", "OFFERED", "BARU"].includes(order.status)
        ).length,
        otw: courierOrders.filter((order) =>
            ["ACCEPTED", "OTW_PICKUP", "PICKED", "OTW_DROPOFF", "NEED_POD", "ASSIGNED", "PICKUP", "DIKIRIM"].includes(
                order.status
            )
        ).length,
        selesai: courierOrders.filter((order) => ["DELIVERED", "SELESAI"].includes(order.status))
            .length,
        codOutstanding: courierOrders
            .filter((order) => order.cod?.isCOD && !order.cod?.codPaid)
            .reduce((sum, order) => sum + (order.cod?.nominal || 0), 0),
    };

    const getStatusBadge = (status: Order["status"]) => {
        switch (status) {
            case "NEW":
            case "BARU":
                return <Badge variant="secondary">Baru</Badge>;
            case "OFFERED":
                return (
                    <Badge className="bg-purple-500 hover:bg-purple-600">
                        Ditawarkan
                    </Badge>
                );
            case "ACCEPTED":
            case "ASSIGNED":
                return (
                    <Badge className="bg-blue-500 hover:bg-blue-600">
                        Diterima
                    </Badge>
                );
            case "OTW_PICKUP":
                return (
                    <Badge className="bg-amber-500 hover:bg-amber-600">
                        OTW Jemput
                    </Badge>
                );
            case "PICKED":
            case "PICKUP":
                return (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600">
                        Sudah Jemput
                    </Badge>
                );
            case "OTW_DROPOFF":
            case "DIKIRIM":
                return (
                    <Badge className="bg-orange-500 hover:bg-orange-600">
                        OTW Antar
                    </Badge>
                );
            case "NEED_POD":
                return (
                    <Badge className="bg-pink-500 hover:bg-pink-600">
                        Butuh Foto POD
                    </Badge>
                );
            case "DELIVERED":
            case "SELESAI":
                return (
                    <Badge className="bg-green-500 hover:bg-green-600">
                        Selesai
                    </Badge>
                );
            case "REJECTED":
                return (
                    <Badge className="bg-red-500 hover:bg-red-600">
                        Ditolak
                    </Badge>
                );
            case "CANCELLED":
                return (
                    <Badge className="bg-gray-500 hover:bg-gray-600">
                        Dibatalkan
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const handleStatusUpdate = async (
        orderId: string,
        newStatus: Order["status"]
    ) => {
        const order = orders.find((o) => o.id === orderId);
        if (!order) return;
        await updateOrder({ ...order, status: newStatus });
        // Refresh orders
        const data = await getOrders();
        setOrders(data);
    };

    const handleCODDeposit = (order: Order) => {
        setSelectedOrder(order);
        setShowCODModal(true);
    };

    const getActionButton = (order: Order) => {
        switch (order.status) {
            case "NEW":
            case "BARU":
                return (
                    <span className="text-xs sm:text-sm text-gray-500 font-medium">
                        Menunggu Assign
                    </span>
                );
            case "OFFERED":
                return (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(order.id, "ACCEPTED" as Order["status"])}
                            className="bg-green-500 hover:bg-green-600 text-xs sm:text-sm"
                        >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Terima
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(order.id, "REJECTED" as Order["status"])}
                            className="text-xs sm:text-sm"
                        >
                            <X className="h-3 w-3 mr-1" />
                            Tolak
                        </Button>
                    </div>
                );
            case "ACCEPTED":
            case "ASSIGNED":
                return (
                    <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, "OTW_PICKUP" as Order["status"])}
                        className="bg-amber-500 hover:bg-amber-600 text-xs sm:text-sm"
                    >
                        <Truck className="h-3 w-3 mr-1" />
                        OTW Jemput
                    </Button>
                );
            case "OTW_PICKUP":
                return (
                    <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, "PICKED" as Order["status"])}
                        className="bg-yellow-500 hover:bg-yellow-600 text-xs sm:text-sm"
                    >
                        <Package className="h-3 w-3 mr-1" />
                        Sudah Jemput
                    </Button>
                );
            case "PICKED":
            case "PICKUP":
                return (
                    <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, "OTW_DROPOFF" as Order["status"])}
                        className="bg-orange-500 hover:bg-orange-600 text-xs sm:text-sm"
                    >
                        <Truck className="h-3 w-3 mr-1" />
                        OTW Antar
                    </Button>
                );
            case "OTW_DROPOFF":
            case "DIKIRIM":
                return (
                    <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, "NEED_POD" as Order["status"])}
                        className="bg-pink-500 hover:bg-pink-600 text-xs sm:text-sm"
                    >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Terkirim
                    </Button>
                );
            case "NEED_POD":
                return (
                    <Button
                        size="sm"
                        onClick={() => handleOrderPhotoCapture(order)}
                        className="bg-blue-500 hover:bg-blue-600 text-xs sm:text-sm animate-pulse"
                    >
                        <Camera className="h-3 w-3 mr-1" />
                        Upload Foto POD
                    </Button>
                );
            case "DELIVERED":
            case "SELESAI":
                if (order.cod?.isCOD && !order.cod?.codPaid) {
                    return (
                        <Button
                            size="sm"
                            onClick={() => handleCODDeposit(order)}
                            className="bg-rayo-primary hover:bg-rayo-dark text-xs sm:text-sm"
                        >
                            <DollarSign className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Setor </span>COD
                        </Button>
                    );
                }
                return (
                    <span className="text-xs sm:text-sm text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Selesai
                    </span>
                );
            case "REJECTED":
                return (
                    <span className="text-xs sm:text-sm text-red-500 font-medium">
                        Ditolak
                    </span>
                );
            case "CANCELLED":
                return (
                    <span className="text-xs sm:text-sm text-gray-500 font-medium">
                        Dibatalkan
                    </span>
                );
            default:
                return null;
        }
    };

    // Sort orders: OFFERED first, then active, then completed
    const sortedOrders = courierOrders.sort((a, b) => {
        const getScore = (s: string) => {
            if (["OFFERED"].includes(s)) return 0; // Butuh respon cepat
            if (["NEED_POD"].includes(s)) return 1; // Butuh upload foto
            if (["ACCEPTED", "OTW_PICKUP", "PICKED", "OTW_DROPOFF", "ASSIGNED", "PICKUP", "DIKIRIM"].includes(s)) return 2;
            if (["NEW", "BARU"].includes(s)) return 3;
            if (["DELIVERED", "SELESAI"].includes(s)) return 4;
            if (["REJECTED", "CANCELLED"].includes(s)) return 5;
            return 6;
        };
        return getScore(a.status) - getScore(b.status);
    });


    // Filter photos for this courier
    const myPhotos = uploadedPhotos.filter((p) => p.kurirId === user.courierId);

    // Handle photo capture for specific order
    const handleOrderPhotoCapture = (order: Order) => {
        setSelectedOrder(order);
        setShowPhotoModal(true);
    };

    // NEW: CONTENT SECTIONS
    const HomeContent = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Enhanced Stats Component */}
            <CourierStats orders={courierOrders} userName={user.name} />

            {/* Photo Gallery */}
            {myPhotos.length > 0 && (
                <div>
                    <h2 className="text-lg sm:text-xl font-semibold mb-3 flex items-center gap-2 dark:text-white">
                        <Camera size={20} className="text-teal-600" /> Gallery Aktivitas
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {myPhotos.slice(0, 8).map((photo) => (
                            <div
                                key={photo.id}
                                className="border rounded-xl p-2 space-y-2 bg-white dark:bg-gray-800 shadow-sm dark:border-gray-700"
                            >
                                <img
                                    src={photo.photoUrl || "/placeholder.svg"}
                                    alt="Testimoni kurir"
                                    className="w-full h-28 object-cover rounded-lg"
                                />
                                <div className="space-y-1 px-1">
                                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight dark:text-gray-400">
                                        {photo.description}
                                    </p>
                                    <p className="text-[9px] text-muted-foreground text-right border-t pt-1 mt-1 dark:border-gray-700 dark:text-gray-500">
                                        {new Date(photo.timestamp).toLocaleString("id-ID")}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const OrdersContent = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with View Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold dark:text-white">Daftar Pesanan</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {courierOrders.length} order aktif
                    </p>
                </div>
                {/* View Mode Toggle - Available on all screens */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg self-start sm:self-auto">
                    <Button
                        size="sm"
                        variant={orderViewMode === "kanban" ? "default" : "ghost"}
                        className={`text-xs ${orderViewMode === "kanban" ? "bg-teal-600 hover:bg-teal-700" : ""}`}
                        onClick={() => setOrderViewMode("kanban")}
                    >
                        <Package size={14} className="mr-1" />
                        Kanban
                    </Button>
                    <Button
                        size="sm"
                        variant={orderViewMode === "list" ? "default" : "ghost"}
                        className={`text-xs ${orderViewMode === "list" ? "bg-teal-600 hover:bg-teal-700" : ""}`}
                        onClick={() => setOrderViewMode("list")}
                    >
                        <ChevronRight size={14} className="mr-1" />
                        List
                    </Button>
                </div>
            </div>

            {/* Kanban View - Available on all screens */}
            {orderViewMode === "kanban" && (
                <div className="pb-20 sm:pb-0">
                    <CourierKanbanBoard
                        orders={courierOrders}
                        onStatusUpdate={handleStatusUpdate}
                        onCODDeposit={handleCODDeposit}
                        onOrderClick={(order) => {
                            setSelectedOrder(order);
                            setShowOrderDetail(true);
                        }}
                        onPhotoCapture={handleOrderPhotoCapture}
                    />
                </div>
            )}

            {/* List View - Desktop */}
            {orderViewMode === "list" && (
                <div className="hidden sm:block">
                    <Card className="overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-medium text-xs text-gray-500 dark:text-gray-400">ID</th>
                                            <th className="text-left py-3 px-4 font-medium text-xs text-gray-500 dark:text-gray-400">Pengirim</th>
                                            <th className="text-left py-3 px-4 font-medium text-xs text-gray-500 dark:text-gray-400">Rute</th>
                                            <th className="text-left py-3 px-4 font-medium text-xs text-gray-500 dark:text-gray-400">Status</th>
                                            <th className="text-left py-3 px-4 font-medium text-xs text-gray-500 dark:text-gray-400">COD</th>
                                            <th className="text-right py-3 px-4 font-medium text-xs text-gray-500 dark:text-gray-400">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-700">
                                        {sortedOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="py-3 px-4 font-mono text-xs">#{order.id.slice(-6)}</td>
                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-sm dark:text-white">{order.pengirim.nama}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{order.pengirim.wa}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-xs space-y-1">
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                            <span className="truncate max-w-[150px] dark:text-gray-300">{order.pickup.alamat}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                            <span className="truncate max-w-[150px] dark:text-gray-300">{order.dropoff.alamat}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                                                <td className="py-3 px-4">
                                                    {order.cod.isCOD ? (
                                                        <span className={`font-medium ${order.cod.codPaid ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                                            {formatCurrency(order.cod.nominal)}
                                                        </span>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-xs dark:bg-gray-700">Non-COD</Badge>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right">{getActionButton(order)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Mobile Card List View for Orders - Only when List mode is selected */}
            {orderViewMode === "list" && <div className="space-y-3 sm:hidden pb-20">
                {sortedOrders.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-dashed dark:border-gray-700">
                        <Package size={48} className="mx-auto mb-2 opacity-20" />
                        <p>Belum ada orderan masuk</p>
                    </div>
                ) : (
                    sortedOrders.map((order) => (
                        <div
                            key={order.id}
                            className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 shadow-sm space-y-3 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                            onClick={() => {
                                setSelectedOrder(order);
                                setShowOrderDetail(true);
                            }}
                        >
                            {/* Status Stripe */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${['NEW', 'BARU'].includes(order.status) ? 'bg-gray-300' :
                                order.status === 'OFFERED' ? 'bg-purple-500' :
                                    ['ACCEPTED', 'ASSIGNED'].includes(order.status) ? 'bg-blue-500' :
                                        order.status === 'OTW_PICKUP' ? 'bg-amber-500' :
                                            ['PICKED', 'PICKUP'].includes(order.status) ? 'bg-yellow-500' :
                                                ['OTW_DROPOFF', 'DIKIRIM'].includes(order.status) ? 'bg-orange-500' :
                                                    order.status === 'NEED_POD' ? 'bg-pink-500' :
                                                        ['DELIVERED', 'SELESAI'].includes(order.status) ? 'bg-green-500' :
                                                            'bg-gray-400'
                                }`} />

                            <div className="flex justify-between items-start pl-2">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">#{order.id.slice(-6)}</p>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{order.pengirim.nama}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(order.status)}
                                    <ChevronRight size={16} className="text-gray-400" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm pl-2">
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Pickup</p>
                                    <p className="line-clamp-2 leading-tight dark:text-gray-200">{order.pickup.alamat}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Dropoff</p>
                                    <p className="line-clamp-2 leading-tight dark:text-gray-200">{order.dropoff.alamat}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t dark:border-gray-700 pl-2">
                                <div>
                                    {order.cod.isCOD ? (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400">Tagihan COD</span>
                                            <span className={`font-bold ${order.cod.codPaid ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                                {formatCurrency(order.cod.nominal)}
                                            </span>
                                        </div>
                                    ) : (
                                        <Badge variant="secondary" className="text-[10px] dark:bg-gray-700 dark:text-gray-300">Non-COD</Badge>
                                    )}
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>{getActionButton(order)}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>}


            {/* Desktop Table View */}
            <Card className="hidden sm:block">
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">
                        Order Saya ({courierOrders.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">ID</th>
                                    <th className="text-left py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm hidden sm:table-cell">Tanggal</th>
                                    <th className="text-left py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">Pengirim</th>
                                    <th className="text-left py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm hidden md:table-cell">Pickup</th>
                                    <th className="text-left py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">Dropoff</th>
                                    <th className="text-left py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">Status</th>
                                    <th className="text-left py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">COD</th>
                                    <th className="text-left py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                                            Belum ada order yang ditugaskan kepada Anda
                                        </td>
                                    </tr>
                                ) : (
                                    sortedOrders.map((order) => (
                                        <tr key={order.id} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-2 sm:px-4 font-mono text-xs sm:text-sm">#{order.id.slice(-6)}</td>
                                            <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">{formatDate(order.createdAt)}</td>
                                            <td className="py-3 px-2 sm:px-4">
                                                <div>
                                                    <div className="font-medium text-xs sm:text-sm">{order.pengirim.nama}</div>
                                                    {order.pengirim.wa && <div className="text-xs text-muted-foreground hidden sm:block">{order.pengirim.wa}</div>}
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 sm:px-4 hidden md:table-cell">
                                                <div className="max-w-xs truncate text-xs sm:text-sm" title={order.pickup.alamat}>{order.pickup.alamat}</div>
                                            </td>
                                            <td className="py-3 px-2 sm:px-4">
                                                <div className="max-w-xs truncate text-xs sm:text-sm" title={order.dropoff.alamat}>{order.dropoff.alamat}</div>
                                            </td>
                                            <td className="py-3 px-2 sm:px-4">{getStatusBadge(order.status)}</td>
                                            <td className="py-3 px-2 sm:px-4">
                                                {order.cod.isCOD ? (
                                                    <div className="text-xs sm:text-sm">
                                                        <div className="font-medium">{formatCurrency(order.cod.nominal)}</div>
                                                        <div className={`text-xs ${order.cod.codPaid ? "text-green-600" : "text-red-600"}`}>
                                                            {order.cod.codPaid ? "Lunas" : "Belum"}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs sm:text-sm">Non-COD</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-2 sm:px-4">{getActionButton(order)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
    const UploadPhotoContent = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Native Card Style Header */}
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-500/30 relative overflow-hidden h-64 flex flex-col justify-end">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/30 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30">
                        <Camera size={32} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-1">Upload Bukti</h2>
                    <p className="text-indigo-100">Foto paket atau tanda terima</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => setShowPhotoModal(true)}
                    className="aspect-square bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all p-4"
                >
                    <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                        <Camera size={32} />
                    </div>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Ambil Foto</span>
                </button>

                <button
                    onClick={() => {/* Placeholder for gallery */ }}
                    className="aspect-square bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all p-4"
                >
                    <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <ImageIcon size={32} />
                    </div>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Galeri</span>
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Terbaru Diupload</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {/* Mock thumbnails */}
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="w-24 h-24 flex-shrink-0 rounded-2xl bg-gray-100 dark:bg-gray-700 overflow-hidden relative">
                            <img src={`/assets/img/package-mock-${i}.jpg`} className="w-full h-full object-cover opacity-50" onError={(e) => (e.currentTarget.style.display = 'none')} />
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                <ImageIcon size={20} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const ProfileContent = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-3xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-2xl font-bold">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{user.name}</h2>
                        <p className="text-teal-100">Courier ID: #{user.courierId}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4 space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">Pengaturan Akun</h3>

                <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 dark:border-gray-700" onClick={() => (window.location.href = "/login")}>
                        Logout
                    </Button>
                </div>
            </div>

            <div className="text-center text-xs text-gray-400 dark:text-gray-600 pt-8">
                Version 1.0.0 <br />
                &copy; 2025 Rayo Kurir App
            </div>
        </div>
    );

    const WalletContent = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="relative z-10">
                    <p className="text-gray-400 text-sm mb-1">Total Pendapatan</p>
                    <h2 className="text-4xl font-bold mb-6">Rp 1.450.000</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                            <p className="text-xs text-gray-400 mb-1">Setoran COD</p>
                            <p className="text-lg font-semibold text-red-400">-{formatCurrency(stats.codOutstanding)}</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                            <p className="text-xs text-gray-400 mb-1">Insentif Mingguan</p>
                            <p className="text-lg font-semibold text-green-400">+Rp 250.00</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction History (Mock) */}
            <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 px-2">Riwayat Transaksi</h3>
                <div className="space-y-3">
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-gray-900 dark:text-white">Ongkir Order #2938</p>
                                    <p className="text-xs text-gray-500">10 Des, 14:00</p>
                                </div>
                            </div>
                            <span className="font-bold text-green-600">+Rp 15.000</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const ScanContent = () => (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center pb-20">
            <div className="absolute top-6 left-6 z-10">
                <Button variant="ghost" size="icon" className="text-white" onClick={() => setActiveTab('home')}>
                    <X size={32} />
                </Button>
            </div>

            <div className="w-full max-w-sm aspect-[3/4] rounded-3xl overflow-hidden relative border-2 border-white/20 mx-4 bg-gray-900">
                <img src="/assets/img/noise.png" className="w-full h-full object-cover opacity-20" />

                {/* Scanner Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border-2 border-teal-500 rounded-3xl relative">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-teal-400 -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-teal-400 -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-teal-400 -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-teal-400 -mb-1 -mr-1"></div>

                        <div className="absolute inset-0 bg-teal-500/10 animate-pulse"></div>
                    </div>
                </div>

                <div className="absolute bottom-8 left-0 right-0 text-center text-white">
                    <p className="text-lg font-bold">Arahkan ke QR Code</p>
                    <p className="text-sm text-gray-400">Scan Resi atau Barcode Paket</p>
                </div>
            </div>

            <div className="absolute bottom-32 flex gap-8">
                <Button variant="outline" className="rounded-full h-12 w-12 p-0 border-white/20 bg-white/10 text-white backdrop-blur-md">âš¡</Button>
                <Button variant="outline" className="rounded-full h-16 w-16 p-0 border-4 border-white bg-transparent text-white"></Button>
                <Button variant="outline" className="rounded-full h-12 w-12 p-0 border-white/20 bg-white/10 text-white backdrop-blur-md">ðŸ–¼ï¸</Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-24 sm:pb-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2 sm:mb-6 pt-4 sm:pt-0">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-rayo-dark dark:text-white">
                            Dashboard Kurir
                        </h1>
                        <p className="text-sm sm:text-base text-muted-foreground dark:text-gray-400">
                            Selamat datang, {user.name}
                        </p>
                    </div>
                </div>

                {/* Upload Button on Home Tab (optional context action) */}
                {activeTab === 'home' && (
                    <Button
                        onClick={() => setShowPhotoModal(true)}
                        className="bg-rayo-primary hover:bg-rayo-dark w-full sm:w-auto shadow-lg shadow-teal-500/20 mb-6"
                        size="sm"
                    >
                        <Camera className="h-4 w-4 mr-2" />
                        <span className="text-sm sm:text-base">Upload Foto</span>
                    </Button>
                )}

                {/* Content Area */}
                <div>
                    {activeTab === "home" && <HomeContent />}
                    {activeTab === "orders" && <OrdersContent />}
                    {activeTab === "upload" && <UploadPhotoContent />}
                    {activeTab === "wallet" && <WalletContent />}
                    {activeTab === "profile" && <ProfileContent />}
                </div>
            </div>

            {/* Modals */}
            <CourierCODDepositModal
                isOpen={showCODModal}
                onClose={() => setShowCODModal(false)}
                order={selectedOrder}
                courierId={user.courierId!}
                onDeposited={async () => {
                    const data = await getOrders();
                    setOrders(data);
                    setShowCODModal(false);
                }}
            />

            <PhotoUploadModal
                isOpen={showPhotoModal}
                onClose={() => setShowPhotoModal(false)}
                courierId={user.courierId!}
                courierName={user.name}
                onPhotoUploaded={handlePhotoUploaded}
            />

            {/* Order Detail Modal */}
            {showOrderDetail && selectedOrder && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowOrderDetail(false)}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-[2rem] max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                        <div className="sticky top-0 bg-white dark:bg-gray-900 pt-4 pb-2 z-10">
                            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />
                            <div className="flex justify-between items-center px-6">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">Order #{selectedOrder.id.slice(-6)}</p>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detail Pesanan</h2>
                                </div>
                                <button
                                    onClick={() => setShowOrderDetail(false)}
                                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                                >
                                    <X size={20} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 pb-24 space-y-6">
                            <div className="flex items-center justify-center py-4">
                                {getStatusBadge(selectedOrder.status)}
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-3">
                                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Package size={18} className="text-teal-600" />
                                    Informasi Pengirim
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold">
                                            {selectedOrder.pengirim.nama.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.pengirim.nama}</p>
                                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                                <Phone size={12} />
                                                {selectedOrder.pengirim.wa}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                        <MapPin size={16} />
                                        <span className="text-xs font-semibold uppercase tracking-wider">Pickup</span>
                                    </div>
                                    <p className="text-gray-900 dark:text-white">{selectedOrder.pickup.alamat}</p>
                                </div>

                                <div className="flex justify-center">
                                    <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-700 relative">
                                        <Truck size={16} className="absolute -left-[7px] top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                </div>

                                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                        <MapPin size={16} />
                                        <span className="text-xs font-semibold uppercase tracking-wider">Dropoff</span>
                                    </div>
                                    <p className="text-gray-900 dark:text-white">{selectedOrder.dropoff.alamat}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-3">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Detail Order</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Jenis Order</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.jenisOrder}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Service</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.serviceType}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Order</p>
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} className="text-gray-400" />
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatDate(selectedOrder.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Bayar Ongkir</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.bayarOngkir}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl p-4 text-white space-y-3">
                                <h3 className="font-semibold">Informasi Pembayaran</h3>
                                <div className="flex justify-between items-center">
                                    <span className="text-teal-100">Ongkir</span>
                                    <span className="font-bold text-lg">{formatCurrency(selectedOrder.ongkir)}</span>
                                </div>
                                {selectedOrder.danaTalangan > 0 && (
                                    <div className="flex justify-between items-center border-t border-white/20 pt-2">
                                        <span className="text-teal-100">Dana Talangan</span>
                                        <span className="font-bold">{formatCurrency(selectedOrder.danaTalangan)}</span>
                                    </div>
                                )}
                                {selectedOrder.cod.isCOD && (
                                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">Tagihan COD</span>
                                            <span className="font-bold text-xl">{formatCurrency(selectedOrder.cod.nominal)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className={`w-2 h-2 rounded-full ${selectedOrder.cod.codPaid ? 'bg-green-300' : 'bg-red-400'}`} />
                                            <span className="text-sm">{selectedOrder.cod.codPaid ? 'Sudah disetor' : 'Belum disetor'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {selectedOrder.notes && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4 space-y-2">
                                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Catatan</h3>
                                    <p className="text-gray-700 dark:text-gray-300">{selectedOrder.notes}</p>
                                </div>
                            )}

                            <div className="pt-4">
                                {getActionButton(selectedOrder!)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation - Only show on mobile */}
            <div className="md:hidden">
                <CourierBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
        </div>
    );
}


