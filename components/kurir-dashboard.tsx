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
} from "lucide-react";
import { CourierCODDepositModal } from "@/components/courier-cod-deposit-modal";
import { PhotoUploadModal } from "@/components/photo-upload-modal";

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
}

export function KurirDashboard({ user }: KurirDashboardProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [showCODModal, setShowCODModal] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
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
            (order) => order.status === "MENUNGGU_PICKUP"
        ).length,
        otw: courierOrders.filter((order) =>
            ["PICKUP_OTW", "BARANG_DIAMBIL", "SEDANG_DIKIRIM"].includes(
                order.status
            )
        ).length,
        selesai: courierOrders.filter((order) => order.status === "SELESAI")
            .length,
        codOutstanding: courierOrders
            .filter((order) => order.cod.isCOD && !order.cod.codPaid)
            .reduce((sum, order) => sum + order.cod.nominal, 0),
    };

    const getStatusBadge = (status: Order["status"]) => {
        switch (status) {
            case "MENUNGGU_PICKUP":
                return <Badge variant="secondary">Menunggu Pickup</Badge>;
            case "PICKUP_OTW":
                return (
                    <Badge className="bg-blue-500 hover:bg-blue-600">
                        Pickup OTW
                    </Badge>
                );
            case "BARANG_DIAMBIL":
                return (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600">
                        Barang Diambil
                    </Badge>
                );
            case "SEDANG_DIKIRIM":
                return (
                    <Badge className="bg-orange-500 hover:bg-orange-600">
                        Sedang Dikirim
                    </Badge>
                );
            case "SELESAI":
                return (
                    <Badge className="bg-green-500 hover:bg-green-600">
                        Selesai
                    </Badge>
                );
            default:
                return null;
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
            case "MENUNGGU_PICKUP":
                return (
                    <Button
                        size="sm"
                        onClick={() =>
                            handleStatusUpdate(order.id, "PICKUP_OTW")
                        }
                        className="bg-blue-500 hover:bg-blue-600 text-xs sm:text-sm"
                    >
                        <Truck className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Mulai </span>Pickup
                        OTW
                    </Button>
                );
            case "PICKUP_OTW":
                return (
                    <Button
                        size="sm"
                        onClick={() =>
                            handleStatusUpdate(order.id, "BARANG_DIAMBIL")
                        }
                        className="bg-yellow-500 hover:bg-yellow-600 text-xs sm:text-sm"
                    >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Barang Diambil
                    </Button>
                );
            case "BARANG_DIAMBIL":
                return (
                    <Button
                        size="sm"
                        onClick={() =>
                            handleStatusUpdate(order.id, "SEDANG_DIKIRIM")
                        }
                        className="bg-orange-500 hover:bg-orange-600 text-xs sm:text-sm"
                    >
                        <Truck className="h-3 w-3 mr-1" />
                        Sedang Dikirim
                    </Button>
                );
            case "SEDANG_DIKIRIM":
                return (
                    <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, "SELESAI")}
                        className="bg-green-500 hover:bg-green-600 text-xs sm:text-sm"
                    >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Selesai
                    </Button>
                );
            case "SELESAI":
                if (order.cod.isCOD && !order.cod.codPaid) {
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
                    <span className="text-xs sm:text-sm text-green-600 font-medium">
                        Selesai
                    </span>
                );
            default:
                return null;
        }
    };

    // Sort orders: MENUNGGU first, then OTW, then SELESAI
    const sortedOrders = courierOrders.sort((a, b) => {
        const statusOrder = { MENUNGGU: 0, OTW: 1, SELESAI: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
    });

    // Filter photos for this courier
    const myPhotos = uploadedPhotos.filter((p) => p.kurirId === user.courierId);

    return (
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-0">
            {/* {debugInfo} */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-rayo-dark">
                        Dashboard Kurir
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Selamat datang, {user.name}
                    </p>
                </div>
                <Button
                    onClick={() => setShowPhotoModal(true)}
                    className="bg-rayo-primary hover:bg-rayo-dark w-full sm:w-auto"
                    size="sm"
                >
                    <Camera className="h-4 w-4 mr-2" />
                    <span className="text-sm sm:text-base">Upload Foto</span>
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <Card className="p-3 sm:p-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                        <CardTitle className="text-xs sm:text-sm font-medium leading-tight">
                            Total Order
                        </CardTitle>
                        <Package className="h-3 w-3 sm:h-4 sm:w-4 text-rayo-primary flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="p-0 pt-2">
                        <div className="text-lg sm:text-2xl font-bold text-rayo-dark">
                            {stats.total}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Order saya
                        </p>
                    </CardContent>
                </Card>

                <Card className="p-3 sm:p-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                        <CardTitle className="text-xs sm:text-sm font-medium leading-tight">
                            Menunggu
                        </CardTitle>
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="p-0 pt-2">
                        <div className="text-lg sm:text-2xl font-bold text-gray-600">
                            {stats.menunggu}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Belum diambil
                        </p>
                    </CardContent>
                </Card>

                <Card className="p-3 sm:p-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                        <CardTitle className="text-xs sm:text-sm font-medium leading-tight">
                            OTW
                        </CardTitle>
                        <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="p-0 pt-2">
                        <div className="text-lg sm:text-2xl font-bold text-blue-600">
                            {stats.otw}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Sedang diantar
                        </p>
                    </CardContent>
                </Card>

                <Card className="p-3 sm:p-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                        <CardTitle className="text-xs sm:text-sm font-medium leading-tight">
                            Selesai
                        </CardTitle>
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="p-0 pt-2">
                        <div className="text-lg sm:text-2xl font-bold text-green-600">
                            {stats.selesai}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Terkirim
                        </p>
                    </CardContent>
                </Card>

                <Card className="p-3 sm:p-4 col-span-2 sm:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                        <CardTitle className="text-xs sm:text-sm font-medium leading-tight">
                            COD Belum Setor
                        </CardTitle>
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="p-0 pt-2">
                        <div className="text-lg sm:text-2xl font-bold text-red-600">
                            {formatCurrency(stats.codOutstanding)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Harus disetor
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Foto Testimoni Kurir */}
            {myPhotos.length > 0 && (
                <div>
                    <h2 className="text-lg sm:text-xl font-semibold mb-2">
                        Foto Testimoni Anda
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {myPhotos.slice(0, 8).map((photo) => (
                            <div
                                key={photo.id}
                                className="border rounded-lg p-3 space-y-2 hover:shadow-md transition-shadow"
                            >
                                <img
                                    src={photo.photoUrl || "/placeholder.svg"}
                                    alt="Testimoni kurir"
                                    className="w-full h-32 sm:h-40 object-cover rounded-md"
                                />
                                <div className="space-y-1">
                                    <p className="font-medium text-sm">
                                        {photo.kurirName}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {photo.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(
                                            photo.timestamp
                                        ).toLocaleString("id-ID")}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {myPhotos.length > 8 && (
                        <p className="text-sm text-muted-foreground mt-4 text-center">
                            Dan {myPhotos.length - 8} foto lainnya...
                        </p>
                    )}
                </div>
            )}

            {/* Orders Table */}
            <Card>
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
                                    <th className="text-left py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">
                                        ID
                                    </th>
                                    <th className="text-left py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm hidden sm:table-cell">
                                        Tanggal
                                    </th>
                                    <th className="text-left py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">
                                        Pengirim
                                    </th>
                                    <th className="text-left py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm hidden md:table-cell">
                                        Pickup
                                    </th>
                                    <th className="text-left py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">
                                        Dropoff
                                    </th>
                                    <th className="text-left py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">
                                        Status
                                    </th>
                                    <th className="text-left py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">
                                        COD
                                    </th>
                                    <th className="text-left py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedOrders.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="text-center py-8 text-muted-foreground text-sm"
                                        >
                                            Belum ada order yang ditugaskan
                                            kepada Anda
                                        </td>
                                    </tr>
                                ) : (
                                    sortedOrders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="border-b hover:bg-muted/50"
                                        >
                                            <td className="py-3 px-2 sm:px-4 font-mono text-xs sm:text-sm">
                                                #{order.id.slice(-6)}
                                            </td>
                                            <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">
                                                {formatDate(order.createdAt)}
                                            </td>
                                            <td className="py-3 px-2 sm:px-4">
                                                <div>
                                                    <div className="font-medium text-xs sm:text-sm">
                                                        {order.pengirim.nama}
                                                    </div>
                                                    {order.pengirim.wa && (
                                                        <div className="text-xs text-muted-foreground hidden sm:block">
                                                            {order.pengirim.wa}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 sm:px-4 hidden md:table-cell">
                                                <div
                                                    className="max-w-xs truncate text-xs sm:text-sm"
                                                    title={order.pickup.alamat}
                                                >
                                                    {order.pickup.alamat}
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 sm:px-4">
                                                <div
                                                    className="max-w-xs truncate text-xs sm:text-sm"
                                                    title={order.dropoff.alamat}
                                                >
                                                    {order.dropoff.alamat}
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 sm:px-4">
                                                {getStatusBadge(order.status)}
                                            </td>
                                            <td className="py-3 px-2 sm:px-4">
                                                {order.cod.isCOD ? (
                                                    <div className="text-xs sm:text-sm">
                                                        <div className="font-medium">
                                                            {formatCurrency(
                                                                order.cod
                                                                    .nominal
                                                            )}
                                                        </div>
                                                        <div
                                                            className={`text-xs ${
                                                                order.cod
                                                                    .codPaid
                                                                    ? "text-green-600"
                                                                    : "text-red-600"
                                                            }`}
                                                        >
                                                            {order.cod.codPaid
                                                                ? "Lunas"
                                                                : "Belum"}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs sm:text-sm">
                                                        Non-COD
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-2 sm:px-4">
                                                {getActionButton(order)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

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
        </div>
    );
}
