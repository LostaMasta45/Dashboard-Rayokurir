"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    UserCheck,
    UserX,
    Edit,
    Wifi,
    WifiOff,
    TrendingUp,
    Clock,
} from "lucide-react";
import { AddCourierModal } from "@/components/add-courier-modal";
import { EditCourierModal } from "@/components/edit-courier-modal";
import {
    getCouriers,
    updateCourier,
    getOrders,
    getCourierPerformanceMetrics,
    formatCurrency,
    type Courier,
    type Order,
} from "@/lib/auth";

export function KurirPage() {
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCourier, setSelectedCourier] = useState<Courier | null>(
        null
    );

    useEffect(() => {
        (async () => {
            await loadData();
        })();
    }, []);

    const loadData = async () => {
        const [couriersData, ordersData] = await Promise.all([
            getCouriers(),
            getOrders(),
        ]);
        setCouriers(Array.isArray(couriersData) ? couriersData : []);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
    };

    const getCourierStats = (courierId: string) => {
        const courierOrders = orders.filter(
            (order) => order.kurirId === courierId
        );
        return {
            totalOrders: courierOrders.length,
            completedOrders: courierOrders.filter(
                (order) => order.status === "SELESAI"
            ).length,
            activeOrders: courierOrders.filter(
                (order) => order.status !== "SELESAI"
            ).length,
            codOutstanding: courierOrders
                .filter((order) => order.cod.isCOD && !order.cod.codPaid)
                .reduce((sum, order) => sum + order.cod.nominal, 0),
        };
    };

    const handleToggleStatus = async (courierId: string) => {
        const courier = couriers.find((c) => c.id === courierId);
        if (!courier) return;
        const updated = { ...courier, aktif: !courier.aktif };
        await updateCourier(updated);
        setCouriers(couriers.map((c) => (c.id === courierId ? updated : c)));
    };

    const handleToggleOnlineStatus = async (courierId: string) => {
        const courier = couriers.find((c) => c.id === courierId);
        if (!courier) return;
        const updated = { ...courier, online: !courier.online };
        await updateCourier(updated);
        setCouriers(couriers.map((c) => (c.id === courierId ? updated : c)));
    };

    const handleEditCourier = (courier: Courier) => {
        setSelectedCourier(courier);
        setShowEditModal(true);
    };

    const activeCouriers = couriers.filter((courier) => courier.aktif);
    const inactiveCouriers = couriers.filter((courier) => !courier.aktif);
    const onlineCouriers = activeCouriers.filter((courier) => courier.online);

    return (
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-rayo-dark">
                        Kurir
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Kelola data kurir
                    </p>
                </div>
                <Button
                    onClick={() => setShowAddModal(true)}
                    className="bg-rayo-primary hover:bg-rayo-dark w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Kurir
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Kurir
                        </CardTitle>
                        <UserCheck className="h-4 w-4 text-rayo-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold text-rayo-dark">
                            {couriers.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Kurir terdaftar
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Kurir Aktif
                        </CardTitle>
                        <UserCheck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold text-green-600">
                            {activeCouriers.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Siap menerima order
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Kurir Online
                        </CardTitle>
                        <Wifi className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">
                            {onlineCouriers.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Sedang online
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Kurir Nonaktif
                        </CardTitle>
                        <UserX className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold text-red-600">
                            {inactiveCouriers.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Tidak aktif
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">
                        Kurir Aktif ({activeCouriers.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-2 font-medium text-sm">
                                        Nama
                                    </th>
                                    <th className="text-left py-3 px-2 font-medium text-sm">
                                        WhatsApp
                                    </th>
                                    <th className="text-left py-3 px-2 font-medium text-sm">
                                        Performance
                                    </th>
                                    <th className="text-left py-3 px-2 font-medium text-sm">
                                        Finansial
                                    </th>
                                    <th className="text-left py-3 px-2 font-medium text-sm">
                                        Status
                                    </th>
                                    <th className="text-left py-3 px-2 font-medium text-sm">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeCouriers.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            Belum ada kurir aktif
                                        </td>
                                    </tr>
                                ) : (
                                    activeCouriers.map((courier) => {
                                        const stats = getCourierStats(
                                            courier.id
                                        );
                                        const performance =
                                            getCourierPerformanceMetrics(
                                                courier.id
                                            );
                                        return (
                                            <tr
                                                key={courier.id}
                                                className="border-b hover:bg-muted/50"
                                            >
                                                <td className="py-3 px-2">
                                                    <div>
                                                        <div className="font-medium text-sm">
                                                            {courier.nama}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                            {courier.online ? (
                                                                <>
                                                                    <Wifi className="h-3 w-3 text-green-500" />
                                                                    <span className="text-green-600">
                                                                        Online
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <WifiOff className="h-3 w-3 text-gray-500" />
                                                                    <span className="text-gray-600">
                                                                        Offline
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2 text-sm text-muted-foreground">
                                                    {courier.wa}
                                                </td>
                                                <td className="py-3 px-2">
                                                    <div className="space-y-1 text-xs">
                                                        <div className="flex items-center gap-1">
                                                            <TrendingUp className="h-3 w-3 text-green-500" />
                                                            <span>
                                                                Selesai:{" "}
                                                                {performance?.totalOrderSelesai ||
                                                                    0}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3 text-blue-500" />
                                                            <span>
                                                                On-time:{" "}
                                                                {performance?.onTimePercentage ||
                                                                    0}
                                                                %
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <div className="space-y-1 text-xs">
                                                        <div className="text-green-600">
                                                            COD:{" "}
                                                            {formatCurrency(
                                                                performance?.codDisetor ||
                                                                    0
                                                            )}
                                                        </div>
                                                        <div className="text-blue-600">
                                                            Ongkir:{" "}
                                                            {formatCurrency(
                                                                performance?.ongkirDikumpulkan ||
                                                                    0
                                                            )}
                                                        </div>
                                                        <div className="text-orange-600">
                                                            Talangan:{" "}
                                                            {formatCurrency(
                                                                performance?.danaTalanganDiganti ||
                                                                    0
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <div className="flex flex-col gap-1">
                                                        <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                                                            Aktif
                                                        </Badge>
                                                        {courier.online && (
                                                            <Badge className="bg-blue-500 hover:bg-blue-600 text-xs">
                                                                Online
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleEditCourier(
                                                                    courier
                                                                )
                                                            }
                                                            className="h-7 w-7 p-0"
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleToggleOnlineStatus(
                                                                    courier.id
                                                                )
                                                            }
                                                            className={`h-7 w-7 p-0 ${
                                                                courier.online
                                                                    ? "text-gray-600"
                                                                    : "text-blue-600"
                                                            }`}
                                                        >
                                                            {courier.online ? (
                                                                <WifiOff className="h-3 w-3" />
                                                            ) : (
                                                                <Wifi className="h-3 w-3" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleToggleStatus(
                                                                    courier.id
                                                                )
                                                            }
                                                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                                        >
                                                            <UserX className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Inactive Couriers */}
            {inactiveCouriers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl">
                            Kurir Nonaktif ({inactiveCouriers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-2 font-medium text-sm">
                                            Nama
                                        </th>
                                        <th className="text-left py-3 px-2 font-medium text-sm">
                                            WhatsApp
                                        </th>
                                        <th className="text-left py-3 px-2 font-medium text-sm">
                                            Total Order
                                        </th>
                                        <th className="text-left py-3 px-2 font-medium text-sm">
                                            Status
                                        </th>
                                        <th className="text-left py-3 px-2 font-medium text-sm">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inactiveCouriers.map((courier) => {
                                        const stats = getCourierStats(
                                            courier.id
                                        );
                                        return (
                                            <tr
                                                key={courier.id}
                                                className="border-b hover:bg-muted/50 opacity-75"
                                            >
                                                <td className="py-3 px-2 font-medium text-sm">
                                                    {courier.nama}
                                                </td>
                                                <td className="py-3 px-2 text-sm text-muted-foreground">
                                                    {courier.wa}
                                                </td>
                                                <td className="py-3 px-2 text-sm">
                                                    {stats.totalOrders}
                                                </td>
                                                <td className="py-3 px-2">
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        Nonaktif
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleEditCourier(
                                                                    courier
                                                                )
                                                            }
                                                            className="h-7 w-7 p-0"
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleToggleStatus(
                                                                    courier.id
                                                                )
                                                            }
                                                            className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                                                        >
                                                            <UserCheck className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            <AddCourierModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCourierAdded={() => {
                    loadData();
                    setShowAddModal(false);
                }}
            />

            <EditCourierModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                courier={selectedCourier}
                onCourierUpdated={() => {
                    loadData();
                    setShowEditModal(false);
                }}
            />
        </div>
    );
}
