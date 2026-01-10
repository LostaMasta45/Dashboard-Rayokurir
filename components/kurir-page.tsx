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
    formatCurrency,
    getCODHistory,
    type Courier,
    type Order,
    type CODHistory,
} from "@/lib/auth";

export function KurirPage() {
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [codHistory, setCodHistory] = useState<CODHistory[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);

    useEffect(() => {
        (async () => {
            await loadData();
        })();
    }, []);

    const loadData = async () => {
        const [couriersData, ordersData, codHistoryData] = await Promise.all([
            getCouriers(),
            getOrders(),
            getCODHistory(),
        ]);
        setCouriers(Array.isArray(couriersData) ? couriersData : []);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setCodHistory(Array.isArray(codHistoryData) ? codHistoryData : []);
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

    const calculatePerformance = (courierId: string) => {
        const courierOrders = orders.filter((order) => order.kurirId === courierId);
        const completedOrders = courierOrders.filter(
            (order) => order.status === "SELESAI"
        );
        const totalOngkir = courierOrders.reduce(
            (sum, order) => sum + (order.ongkir || 0),
            0
        );
        const codDeposited = codHistory
            .filter((history) => history.kurirId === courierId)
            .reduce((sum, history) => sum + history.nominal, 0);
        const danaTalanganDiganti = courierOrders
            .filter((order) => order.status === "SELESAI" && (order.danaTalangan || 0) > 0)
            .reduce((sum, order) => sum + (order.danaTalangan || 0), 0);

        return {
            totalOrderSelesai: completedOrders.length,
            codDisetor: codDeposited,
            ongkirDikumpulkan: totalOngkir,
            danaTalanganDiganti: danaTalanganDiganti,
            onTimePercentage: 95, // Dummy percentage as in auth.ts
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
                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900 border-blue-100 dark:border-blue-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground dark:text-blue-300">
                            Total Kurir
                        </CardTitle>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-200" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {couriers.length}
                        </div>
                        <p className="text-xs text-muted-foreground dark:text-gray-400">
                            Kurir terdaftar
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-900 border-green-100 dark:border-green-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground dark:text-green-300">
                            Kurir Aktif
                        </CardTitle>
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <UserCheck className="h-4 w-4 text-green-600 dark:text-green-200" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {activeCouriers.length}
                        </div>
                        <p className="text-xs text-muted-foreground dark:text-gray-400">
                            Siap menerima order
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-sky-50 to-white dark:from-sky-900/20 dark:to-gray-900 border-sky-100 dark:border-sky-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground dark:text-sky-300">
                            Kurir Online
                        </CardTitle>
                        <div className="p-2 bg-sky-100 dark:bg-sky-900 rounded-lg">
                            <Wifi className="h-4 w-4 text-sky-600 dark:text-sky-200" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {onlineCouriers.length}
                        </div>
                        <p className="text-xs text-muted-foreground dark:text-gray-400">
                            Sedang online
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-900 border-red-100 dark:border-red-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground dark:text-red-300">
                            Kurir Nonaktif
                        </CardTitle>
                        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                            <UserX className="h-4 w-4 text-red-600 dark:text-red-200" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {inactiveCouriers.length}
                        </div>
                        <p className="text-xs text-muted-foreground dark:text-gray-400">
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
                                            calculatePerformance(
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
                                                            className={`h-7 w-7 p-0 ${courier.online
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

