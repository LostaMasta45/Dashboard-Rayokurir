"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Trash2, User, CheckCircle } from "lucide-react";
import { AddOrderModal } from "@/components/add-order-modal";
import { AssignCourierModal } from "@/components/assign-courier-modal";
import { toast } from "sonner";
import {
    getOrders,
    getCouriers,
    formatCurrency,
    type Order,
    type Courier,
    ORDER_STATUS_CONFIG,
    markTalanganReimbursed,
    updateOrder,
} from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [courierFilter, setCourierFilter] = useState("ALL");
    const [jenisOrderFilter, setJenisOrderFilter] = useState("ALL");
    const [serviceTypeFilter, setServiceTypeFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [bayarOngkirFilter, setBayarOngkirFilter] = useState("ALL");
    const [talanganStatusFilter, setTalanganStatusFilter] = useState("ALL");

    useEffect(() => {
        (async () => {
            await loadData();
        })();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [
        orders,
        statusFilter,
        courierFilter,
        jenisOrderFilter,
        serviceTypeFilter,
        searchQuery,
        bayarOngkirFilter,
        talanganStatusFilter,
    ]);

    const loadData = async () => {
        const [ordersData, couriersData] = await Promise.all([
            getOrders(),
            getCouriers(),
        ]);
        setOrders(ordersData);
        setCouriers(couriersData);
    };

    const applyFilters = () => {
        let filtered = [...orders];

        // Status filter
        if (statusFilter !== "ALL") {
            filtered = filtered.filter(
                (order) => order.status === statusFilter
            );
        }

        // Courier filter
        if (courierFilter !== "ALL") {
            filtered = filtered.filter(
                (order) => order.kurirId === courierFilter
            );
        }

        if (jenisOrderFilter !== "ALL") {
            filtered = filtered.filter(
                (order) => order.jenisOrder === jenisOrderFilter
            );
        }

        if (serviceTypeFilter !== "ALL") {
            filtered = filtered.filter(
                (order) => order.serviceType === serviceTypeFilter
            );
        }

        // Bayar Ongkir filter
        if (bayarOngkirFilter !== "ALL") {
            filtered = filtered.filter((order) => {
                if (bayarOngkirFilter === "NON_COD") {
                    return !order.cod.isCOD;
                }
                return order.cod.isCOD;
            });
        }

        // Talangan Status filter
        if (talanganStatusFilter !== "ALL") {
            filtered = filtered.filter((order) => {
                if (talanganStatusFilter === "REIMBURSED") {
                    return order.talanganReimbursed;
                }
                return !order.talanganReimbursed;
            });
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (order) =>
                    order.pengirim.nama.toLowerCase().includes(query) ||
                    order.pengirim.wa.toLowerCase().includes(query) ||
                    order.pickup.alamat.toLowerCase().includes(query) ||
                    order.dropoff.alamat.toLowerCase().includes(query)
            );
        }

        setFilteredOrders(filtered);
    };

    const getStatusCounts = () => {
        return {
            all: orders.length,
            menungguPickup: orders.filter((o) => o.status === "MENUNGGU_PICKUP")
                .length,
            pickupOtw: orders.filter((o) => o.status === "PICKUP_OTW").length,
            barangDiambil: orders.filter((o) => o.status === "BARANG_DIAMBIL")
                .length,
            sedangDikirim: orders.filter((o) => o.status === "SEDANG_DIKIRIM")
                .length,
            selesai: orders.filter((o) => o.status === "SELESAI").length,
        };
    };

    const getStatusBadge = (status: Order["status"]) => {
        const statusConfig = {
            MENUNGGU_PICKUP: {
                label: "MENUNGGU",
                color: "bg-gray-100 text-gray-800",
            },
            PICKUP_OTW: { label: "OTW", color: "bg-blue-100 text-blue-800" },
            BARANG_DIAMBIL: {
                label: "BARANG DIAMBIL",
                color: "bg-amber-100 text-amber-800",
            },
            SEDANG_DIKIRIM: {
                label: "DIKIRIM",
                color: "bg-orange-100 text-orange-800",
            },
            SELESAI: { label: "SELESAI", color: "bg-green-100 text-green-800" },
        };
        const config = statusConfig[status] || statusConfig.MENUNGGU_PICKUP;
        return <Badge className={config.color}>{config.label}</Badge>;
    };

    const getCourierName = (kurirId: string | null) => {
        if (!kurirId) return "-";
        const courier = couriers.find((c) => c.id === kurirId);
        return courier?.nama || "-";
    };

    const handleAssignCourier = (order: Order) => {
        setSelectedOrder(order);
        setShowAssignModal(true);
    };

    const handleStatusChange = async (
        orderId: string,
        newStatus: Order["status"]
    ) => {
        // Update status di Supabase
        const order = orders.find((o) => o.id === orderId);
        if (!order) return;
        await updateOrder({ ...order, status: newStatus });
        await loadData();
        toast.success(
            `Status order berhasil diubah ke ${ORDER_STATUS_CONFIG[newStatus].label}`
        );
    };

    const handleToggleNonCodPaid = async (orderId: string) => {
        const order = orders.find((o) => o.id === orderId && !o.cod.isCOD);
        if (!order) return;
        await updateOrder({ ...order, nonCodPaid: !order.nonCodPaid });
        await loadData();
        toast.success(
            `Status pembayaran ${
                !order.nonCodPaid ? "sudah dibayar" : "belum dibayar"
            }`
        );
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (confirm("Apakah Anda yakin ingin menghapus order ini?")) {
            // Hapus order di Supabase
            await supabase.from("orders").delete().eq("id", orderId);
            await loadData();
            toast.success("Order berhasil dihapus");
        }
    };

    const handleMarkTalanganReimbursed = (orderId: string) => {
        if (confirm("Tandai talangan sebagai sudah diganti?")) {
            const success = markTalanganReimbursed(orderId);
            if (success) {
                loadData();
                toast.success(
                    "Talangan berhasil ditandai sebagai sudah diganti"
                );
            } else {
                toast.error("Gagal menandai talangan");
            }
        }
    };

    const getNextStatus = (currentStatus: Order["status"]) => {
        switch (currentStatus) {
            case "MENUNGGU_PICKUP":
                return "PICKUP_OTW";
            case "PICKUP_OTW":
                return "BARANG_DIAMBIL";
            case "BARANG_DIAMBIL":
                return "SEDANG_DIKIRIM";
            case "SEDANG_DIKIRIM":
                return "SELESAI";
            default:
                return currentStatus;
        }
    };

    const renderFinancialChips = (order: Order) => {
        return (
            <TooltipProvider>
                <div className="space-y-1">
                    {/* Ongkir Chip */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                                💸 Ongkir {formatCurrency(order.ongkir)}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Biaya jasa antar - masuk ke pendapatan</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Talangan Chip */}
                    {order.danaTalangan > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs">
                                    🧾 Talangan{" "}
                                    {formatCurrency(order.danaTalangan)}
                                    <Badge
                                        className={`ml-1 text-xs ${
                                            order.talanganReimbursed
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                        }`}
                                    >
                                        {order.talanganReimbursed
                                            ? "Sudah Diganti"
                                            : "Belum Diganti"}
                                    </Badge>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    Uang yang kurir keluarkan di muka - bukan
                                    pendapatan
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {/* COD Chip */}
                    {order.cod.isCOD && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">
                                    🏷️ COD {formatCurrency(order.cod.nominal)}
                                    <Badge
                                        className={`ml-1 text-xs ${
                                            order.cod.codPaid
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                        }`}
                                    >
                                        {order.cod.codPaid
                                            ? "Sudah Setor"
                                            : "Belum Setor"}
                                    </Badge>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    Harga barang titipan - kurir wajib setor ke
                                    toko
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </TooltipProvider>
        );
    };

    const statusCounts = getStatusCounts();

    return (
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-rayo-dark">
                        Orders
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Kelola semua order
                    </p>
                </div>
                <Button
                    onClick={() => setShowAddModal(true)}
                    className="bg-rayo-primary hover:bg-rayo-dark w-full sm:w-auto"
                    size="sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="text-sm sm:text-base">Tambah Order</span>
                </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <Card
                    className="cursor-pointer hover:bg-accent p-3 sm:p-4 transition-colors"
                    onClick={() => setStatusFilter("ALL")}
                >
                    <CardContent className="p-0 text-center">
                        <div className="text-lg sm:text-2xl font-bold text-rayo-dark">
                            {statusCounts.all}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                            Semua
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className="cursor-pointer hover:bg-accent p-3 sm:p-4 transition-colors"
                    onClick={() => setStatusFilter("MENUNGGU_PICKUP")}
                >
                    <CardContent className="p-0 text-center">
                        <div className="text-lg sm:text-2xl font-bold text-gray-600">
                            {statusCounts.menungguPickup}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                            Menunggu
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className="cursor-pointer hover:bg-accent p-3 sm:p-4 transition-colors"
                    onClick={() => setStatusFilter("PICKUP_OTW")}
                >
                    <CardContent className="p-0 text-center">
                        <div className="text-lg sm:text-2xl font-bold text-blue-600">
                            {statusCounts.pickupOtw}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                            Pickup
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className="cursor-pointer hover:bg-accent p-3 sm:p-4 transition-colors"
                    onClick={() => setStatusFilter("BARANG_DIAMBIL")}
                >
                    <CardContent className="p-0 text-center">
                        <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                            {statusCounts.barangDiambil}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                            Diambil
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className="cursor-pointer hover:bg-accent p-3 sm:p-4 transition-colors"
                    onClick={() => setStatusFilter("SEDANG_DIKIRIM")}
                >
                    <CardContent className="p-0 text-center">
                        <div className="text-lg sm:text-2xl font-bold text-orange-600">
                            {statusCounts.sedangDikirim}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                            Dikirim
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className="cursor-pointer hover:bg-accent p-3 sm:p-4 transition-colors"
                    onClick={() => setStatusFilter("SELESAI")}
                >
                    <CardContent className="p-0 text-center">
                        <div className="text-lg sm:text-2xl font-bold text-green-600">
                            {statusCounts.selesai}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                            Selesai
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4">
                        <div className="w-full">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama, WA, atau alamat..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="pl-10 text-sm sm:text-base h-10 sm:h-11"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="h-10 sm:h-11">
                                    <SelectValue placeholder="Filter Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">
                                        Semua Status
                                    </SelectItem>
                                    <SelectItem value="MENUNGGU_PICKUP">
                                        Menunggu Pickup
                                    </SelectItem>
                                    <SelectItem value="PICKUP_OTW">
                                        Pickup OTW
                                    </SelectItem>
                                    <SelectItem value="BARANG_DIAMBIL">
                                        Barang Diambil
                                    </SelectItem>
                                    <SelectItem value="SEDANG_DIKIRIM">
                                        Sedang Dikirim
                                    </SelectItem>
                                    <SelectItem value="SELESAI">
                                        Selesai
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={courierFilter}
                                onValueChange={setCourierFilter}
                            >
                                <SelectTrigger className="h-10 sm:h-11">
                                    <SelectValue placeholder="Filter Kurir" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">
                                        Semua Kurir
                                    </SelectItem>
                                    {couriers.map((courier) => (
                                        <SelectItem
                                            key={courier.id}
                                            value={courier.id}
                                        >
                                            {courier.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={jenisOrderFilter}
                                onValueChange={setJenisOrderFilter}
                            >
                                <SelectTrigger className="h-10 sm:h-11">
                                    <SelectValue placeholder="Filter Jenis" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">
                                        Semua Jenis
                                    </SelectItem>
                                    <SelectItem value="Barang">
                                        Barang
                                    </SelectItem>
                                    <SelectItem value="Makanan">
                                        Makanan
                                    </SelectItem>
                                    <SelectItem value="Dokumen">
                                        Dokumen
                                    </SelectItem>
                                    <SelectItem value="Antar Jemput">
                                        Antar Jemput
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={serviceTypeFilter}
                                onValueChange={setServiceTypeFilter}
                            >
                                <SelectTrigger className="h-10 sm:h-11">
                                    <SelectValue placeholder="Filter Service" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">
                                        Semua Service
                                    </SelectItem>
                                    <SelectItem value="Reguler">
                                        Reguler
                                    </SelectItem>
                                    <SelectItem value="Express">
                                        Express
                                    </SelectItem>
                                    <SelectItem value="Same Day">
                                        Same Day
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={bayarOngkirFilter || "ALL"}
                                onValueChange={(value) =>
                                    setBayarOngkirFilter(value)
                                }
                            >
                                <SelectTrigger className="h-10 sm:h-11">
                                    <SelectValue placeholder="Cara Bayar Ongkir" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">
                                        Semua Cara Bayar
                                    </SelectItem>
                                    <SelectItem value="NON_COD">
                                        Non-COD
                                    </SelectItem>
                                    <SelectItem value="COD">COD</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={talanganStatusFilter || "ALL"}
                                onValueChange={(value) =>
                                    setTalanganStatusFilter(value)
                                }
                            >
                                <SelectTrigger className="h-10 sm:h-11">
                                    <SelectValue placeholder="Status Talangan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">
                                        Semua Status Talangan
                                    </SelectItem>
                                    <SelectItem value="REIMBURSED">
                                        Sudah Diganti
                                    </SelectItem>
                                    <SelectItem value="OUTSTANDING">
                                        Belum Diganti
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">
                        Daftar Orders ({filteredOrders.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        ID
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Pengirim
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Jenis & Service
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Pickup
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Dropoff
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Kurir
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Status
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Finansial
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="text-center py-8 text-muted-foreground text-sm"
                                        >
                                            {orders.length === 0
                                                ? "Belum ada order. Klik 'Tambah Order' untuk memulai."
                                                : "Tidak ada order yang sesuai filter. Coba ubah kriteria pencarian."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="border-b hover:bg-muted/50"
                                        >
                                            <td className="py-3 px-3 sm:px-4 font-mono text-sm">
                                                #{order.id.slice(-6)}
                                            </td>
                                            <td className="py-3 px-3 sm:px-4">
                                                <div>
                                                    <div className="font-medium text-sm">
                                                        {order.pengirim.nama}
                                                    </div>
                                                    {order.pengirim.wa && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {order.pengirim.wa}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 sm:px-4">
                                                <div className="text-sm">
                                                    <div className="font-medium">
                                                        {order.jenisOrder}
                                                    </div>
                                                    <div className="text-muted-foreground text-xs">
                                                        {order.serviceType}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 sm:px-4">
                                                <div
                                                    className="max-w-xs truncate text-sm"
                                                    title={order.pickup.alamat}
                                                >
                                                    {order.pickup.alamat}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 sm:px-4">
                                                <div
                                                    className="max-w-xs truncate text-sm"
                                                    title={order.dropoff.alamat}
                                                >
                                                    {order.dropoff.alamat}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 sm:px-4 text-sm">
                                                {getCourierName(order.kurirId)}
                                            </td>
                                            <td className="py-3 px-3 sm:px-4">
                                                {getStatusBadge(order.status)}
                                            </td>
                                            <td className="py-3 px-3 sm:px-4">
                                                {renderFinancialChips(order)}
                                            </td>
                                            <td className="py-3 px-3 sm:px-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {!order.kurirId && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleAssignCourier(
                                                                    order
                                                                )
                                                            }
                                                            className="h-8 w-8 p-0"
                                                            title="Assign Kurir"
                                                        >
                                                            <User className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    {order.status !==
                                                        "SELESAI" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleStatusChange(
                                                                    order.id,
                                                                    getNextStatus(
                                                                        order.status
                                                                    )
                                                                )
                                                            }
                                                            className="h-8 w-8 p-0"
                                                            title="Update Status"
                                                        >
                                                            <CheckCircle className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    {order.danaTalangan > 0 &&
                                                        !order.talanganReimbursed && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    handleMarkTalanganReimbursed(
                                                                        order.id
                                                                    )
                                                                }
                                                                className="h-8 px-2 text-xs bg-orange-50 hover:bg-orange-100"
                                                                title="Mark Talangan as Reimbursed"
                                                            >
                                                                Talangan
                                                            </Button>
                                                        )}
                                                    {!order.cod.isCOD && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleToggleNonCodPaid(
                                                                    order.id
                                                                )
                                                            }
                                                            className={`h-8 w-8 p-0 ${
                                                                order.nonCodPaid
                                                                    ? "bg-green-50"
                                                                    : ""
                                                            }`}
                                                            title="Toggle Payment Status"
                                                        >
                                                            <span className="text-xs">
                                                                $
                                                            </span>
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleDeleteOrder(
                                                                order.id
                                                            )
                                                        }
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                        title="Delete Order"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <AddOrderModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onOrderAdded={() => {
                    loadData();
                    setShowAddModal(false);
                }}
            />

            <AssignCourierModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                order={selectedOrder}
                couriers={couriers}
                onAssigned={() => {
                    loadData();
                    setShowAssignModal(false);
                }}
            />
        </div>
    );
}
