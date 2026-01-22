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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Trash2, CheckCircle, Clock, Zap, Package, LayoutList, Columns3, LayoutGrid, Filter, ChevronUp, ChevronDown, Eye, MoreHorizontal } from "lucide-react";
import { AddOrderModal } from "@/components/add-order-modal";
import { AssignCourierModal } from "@/components/assign-courier-modal";
import { OrderDetailModal } from "@/components/order-detail-modal";
import { KanbanBoard } from "@/components/kanban-board";
import { MobileOrderCard } from "@/components/mobile-order-card";
import { toast } from "sonner";
import {
    getOrders,
    getCouriers,
    formatCurrency,
    deleteOrder,
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
    const [viewMode, setViewMode] = useState<"table" | "kanban" | "cards">("table");
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [courierFilter, setCourierFilter] = useState("ALL");
    const [jenisOrderFilter, setJenisOrderFilter] = useState("ALL");
    const [serviceTypeFilter, setServiceTypeFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [bayarOngkirFilter, setBayarOngkirFilter] = useState("ALL");
    const [talanganStatusFilter, setTalanganStatusFilter] = useState("ALL");
    const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL");

    useEffect(() => {
        // Default to cards view on mobile to avoid horizontal scrolling
        if (typeof window !== "undefined" && window.innerWidth < 640) {
            setViewMode("cards");
        }

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
        paymentMethodFilter,
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

        // Payment Method filter
        if (paymentMethodFilter !== "ALL") {
            filtered = filtered.filter(
                (order) => order.ongkirPaymentMethod === paymentMethodFilter
            );
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

        // Sort by newest first (createdAt descending)
        filtered.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setFilteredOrders(filtered);
    };

    const getStatusCounts = () => {
        return {
            all: orders.length,
            menungguPickup: orders.filter((o) => o.status === "BARU")
                .length,
            pickupOtw: orders.filter((o) => o.status === "ASSIGNED").length,
            barangDiambil: orders.filter((o) => o.status === "PICKUP")
                .length,
            sedangDikirim: orders.filter((o) => o.status === "DIKIRIM")
                .length,
            selesai: orders.filter((o) => o.status === "SELESAI").length,
        };
    };

    const getStatusBadge = (status: Order["status"]) => {
        const statusConfig = {
            BARU: {
                label: "Menunggu Kurir",
                color: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
            },
            NEW: {
                label: "Menunggu Kurir",
                color: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
            },
            ASSIGNED: {
                label: "Ditugaskan",
                color: "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800",
            },
            OFFERED: {
                label: "Ditawarkan",
                color: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
            },
            ACCEPTED: {
                label: "Diterima Kurir",
                color: "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800",
            },
            PICKUP: {
                label: "Diambil",
                color: "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800",
            },
            OTW_PICKUP: {
                label: "OTW Jemput",
                color: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
            },
            PICKED: {
                label: "Sudah Jemput",
                color: "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800",
            },
            DIKIRIM: {
                label: "Dikirim",
                color: "bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800",
            },
            OTW_DROPOFF: {
                label: "OTW Antar",
                color: "bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800",
            },
            NEED_POD: {
                label: "Menunggu Bukti",
                color: "bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800",
            },
            SELESAI: {
                label: "Selesai",
                color: "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800",
            },
            DELIVERED: {
                label: "Selesai",
                color: "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800",
            },
            CANCELLED: {
                label: "Dibatalkan",
                color: "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800",
            },
            REJECTED: {
                label: "Ditolak",
                color: "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800",
            },
        };
        const config = statusConfig[status] || statusConfig.BARU;
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
            `Status pembayaran ${!order.nonCodPaid ? "sudah dibayar" : "belum dibayar"
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

    const handleMarkTalanganReimbursed = async (orderId: string) => {
        if (confirm("Tandai talangan sebagai sudah diganti?")) {
            const success = await markTalanganReimbursed(orderId);
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
            case "BARU":
                return "ASSIGNED";
            case "ASSIGNED":
                return "PICKUP";
            case "PICKUP":
                return "DIKIRIM";
            case "DIKIRIM":
                return "SELESAI";
            default:
                return currentStatus;
        }
    };

    // Calculate active order count per courier (exclude SELESAI)
    const getCourierOrderCounts = () => {
        const counts: Record<string, number> = {};
        couriers.forEach((c) => (counts[c.id] = 0));
        orders
            .filter((o) => o.status !== "SELESAI" && o.kurirId)
            .forEach((o) => {
                if (o.kurirId) counts[o.kurirId] = (counts[o.kurirId] || 0) + 1;
            });
        return counts;
    };

    // Priority style based on service type
    const getPriorityStyle = (serviceType: string) => {
        switch (serviceType) {
            case "Same Day":
                return "border-l-4 border-red-500 bg-red-50/50 dark:bg-red-900/10";
            case "Express":
                return "border-l-4 border-orange-500 bg-orange-50/50 dark:bg-orange-900/10";
            default:
                return "border-l-4 border-transparent hover:bg-muted/50 dark:hover:bg-muted/10";
        }
    };

    // Priority badge component
    const getPriorityBadge = (serviceType: string) => {
        switch (serviceType) {
            case "Same Day":
                return (
                    <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-xs gap-1 border-0">
                        <Clock className="h-3 w-3" /> Urgent
                    </Badge>
                );
            case "Express":
                return (
                    <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-200 text-xs gap-1 border-0">
                        <Zap className="h-3 w-3" /> Express
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs gap-1 border-0">
                        <Package className="h-3 w-3" /> Reguler
                    </Badge>
                );
        }
    };

    const courierOrderCounts = getCourierOrderCounts();

    const renderFinancialChips = (order: Order) => {
        return (
            <TooltipProvider>
                <div className="flex flex-col gap-1.5 items-start">
                    {/* Ongkir Chip */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] sm:text-xs border border-blue-100 dark:border-blue-800 whitespace-nowrap">
                                💸 Ongkir {formatCurrency(order.ongkir)}
                                {order.bayarOngkir === "COD" && order.ongkirPaymentMethod && (
                                    <span className={`ml-1 px-1 rounded text-[9px] font-medium ${order.ongkirPaymentMethod === "QRIS"
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                        }`}>
                                        {order.ongkirPaymentMethod === "QRIS" ? "📱" : "💵"} {order.ongkirPaymentMethod}
                                    </span>
                                )}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Biaya jasa antar{order.ongkirPaymentMethod ? ` - Bayar via ${order.ongkirPaymentMethod}` : ""}</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Talangan Chip */}
                    {order.danaTalangan > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="inline-flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded text-[10px] sm:text-xs border border-orange-100 dark:border-orange-800 whitespace-nowrap">
                                    ðŸ§¾ {formatCurrency(order.danaTalangan)}
                                    <Badge
                                        className={`ml-1 text-[10px] border-0 px-1 py-0 h-4 ${order.talanganReimbursed
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                                            }`}
                                    >
                                        {order.talanganReimbursed
                                            ? "Lunas"
                                            : "Belum"}
                                    </Badge>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    Talangan: {formatCurrency(order.danaTalangan)} -
                                    {order.talanganReimbursed
                                        ? "Sudah Diganti"
                                        : "Belum Diganti"}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {/* COD Chip */}
                    {order.cod.isCOD && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-[10px] sm:text-xs border border-purple-100 dark:border-purple-800 whitespace-nowrap">
                                    ðŸ·ï¸ {formatCurrency(order.cod.nominal)}
                                    <Badge
                                        className={`ml-1 text-[10px] border-0 px-1 py-0 h-4 ${order.cod.codPaid
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                                            }`}
                                    >
                                        {order.cod.codPaid
                                            ? "Lunas"
                                            : "Belum"}
                                    </Badge>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    COD: {formatCurrency(order.cod.nominal)} -
                                    {order.cod.codPaid
                                        ? "Sudah Setor"
                                        : "Belum Setor"}
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
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-0 w-full max-w-full">
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

            {/* View Toggle */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground mr-2 hidden sm:inline">View:</span>
                <div className="flex rounded-lg border overflow-hidden">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-none px-2 sm:px-3 gap-1 sm:gap-1.5 ${viewMode === 'cards' ? 'bg-rayo-primary text-white hover:bg-rayo-dark' : ''}`}
                        onClick={() => setViewMode('cards')}
                    >
                        <LayoutGrid className="h-4 w-4" />
                        <span className="hidden sm:inline">Cards</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-none px-2 sm:px-3 gap-1 sm:gap-1.5 ${viewMode === 'table' ? 'bg-rayo-primary text-white hover:bg-rayo-dark' : ''}`}
                        onClick={() => setViewMode('table')}
                    >
                        <LayoutList className="h-4 w-4" />
                        <span className="hidden sm:inline">Table</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-none px-2 sm:px-3 gap-1 sm:gap-1.5 ${viewMode === 'kanban' ? 'bg-rayo-primary text-white hover:bg-rayo-dark' : ''}`}
                        onClick={() => setViewMode('kanban')}
                    >
                        <Columns3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Kanban</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 w-full">
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
                    onClick={() => setStatusFilter("BARU")}
                >
                    <CardContent className="p-0 text-center">
                        <div className="text-lg sm:text-2xl font-bold text-gray-600">
                            {statusCounts.menungguPickup}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                            Menunggu Kurir
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className="cursor-pointer hover:bg-accent p-3 sm:p-4 transition-colors"
                    onClick={() => setStatusFilter("ASSIGNED")}
                >
                    <CardContent className="p-0 text-center">
                        <div className="text-lg sm:text-2xl font-bold text-blue-600">
                            {statusCounts.pickupOtw}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                            Ditugaskan
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className="cursor-pointer hover:bg-accent p-3 sm:p-4 transition-colors"
                    onClick={() => setStatusFilter("PICKUP")}
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
                    onClick={() => setStatusFilter("DIKIRIM")}
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

            {/* Search and Filters */}
            <Card>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama, WA, atau alamat..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 text-sm sm:text-base h-10 sm:h-11"
                                />
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                                className={`gap-2 ${isFiltersOpen ? "bg-accent" : ""}`}
                            >
                                <Filter className="h-4 w-4" />
                                <span className="hidden sm:inline">Filters</span>
                                <Badge variant="secondary" className="ml-1 text-xs">
                                    {[
                                        statusFilter,
                                        courierFilter,
                                        jenisOrderFilter,
                                        serviceTypeFilter,
                                        bayarOngkirFilter,
                                        talanganStatusFilter,
                                        paymentMethodFilter
                                    ].filter(f => f !== "ALL").length}
                                </Badge>
                                {isFiltersOpen ? <ChevronUp className="h-4 w-4 ml-auto sm:ml-2" /> : <ChevronDown className="h-4 w-4 ml-auto sm:ml-2" />}
                            </Button>
                        </div>

                        {isFiltersOpen && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 animate-in slide-in-from-top-2 duration-200">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-10 sm:h-11">
                                        <SelectValue placeholder="Filter Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Semua Status</SelectItem>
                                        <SelectItem value="BARU">Menunggu Kurir</SelectItem>
                                        <SelectItem value="ASSIGNED">Ditugaskan</SelectItem>
                                        <SelectItem value="PICKUP">Barang Diambil</SelectItem>
                                        <SelectItem value="DIKIRIM">Sedang Dikirim</SelectItem>
                                        <SelectItem value="SELESAI">Selesai</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={courierFilter} onValueChange={setCourierFilter}>
                                    <SelectTrigger className="h-10 sm:h-11">
                                        <SelectValue placeholder="Filter Kurir" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Semua Kurir</SelectItem>
                                        {couriers.map((courier) => (
                                            <SelectItem key={courier.id} value={courier.id}>
                                                {courier.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={jenisOrderFilter} onValueChange={setJenisOrderFilter}>
                                    <SelectTrigger className="h-10 sm:h-11">
                                        <SelectValue placeholder="Filter Jenis" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Semua Jenis</SelectItem>
                                        <SelectItem value="Barang">Barang</SelectItem>
                                        <SelectItem value="Makanan">Makanan</SelectItem>
                                        <SelectItem value="Dokumen">Dokumen</SelectItem>
                                        <SelectItem value="Antar Jemput">Antar Jemput</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                                    <SelectTrigger className="h-10 sm:h-11">
                                        <SelectValue placeholder="Filter Service" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Semua Service</SelectItem>
                                        <SelectItem value="Reguler">Reguler</SelectItem>
                                        <SelectItem value="Express">Express</SelectItem>
                                        <SelectItem value="Same Day">Same Day</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={bayarOngkirFilter || "ALL"} onValueChange={setBayarOngkirFilter}>
                                    <SelectTrigger className="h-10 sm:h-11">
                                        <SelectValue placeholder="Cara Bayar Ongkir" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Semua Cara Bayar</SelectItem>
                                        <SelectItem value="NON_COD">Non-COD</SelectItem>
                                        <SelectItem value="COD">COD</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={talanganStatusFilter || "ALL"} onValueChange={setTalanganStatusFilter}>
                                    <SelectTrigger className="h-10 sm:h-11">
                                        <SelectValue placeholder="Status Talangan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Semua Status Talangan</SelectItem>
                                        <SelectItem value="REIMBURSED">Sudah Diganti</SelectItem>
                                        <SelectItem value="OUTSTANDING">Belum Diganti</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={paymentMethodFilter || "ALL"} onValueChange={setPaymentMethodFilter}>
                                    <SelectTrigger className="h-10 sm:h-11">
                                        <SelectValue placeholder="Metode Bayar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Semua Metode</SelectItem>
                                        <SelectItem value="CASH">💵 Cash</SelectItem>
                                        <SelectItem value="QRIS">📱 QRIS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {viewMode === 'kanban' ? (
                <KanbanBoard
                    orders={filteredOrders}
                    couriers={couriers}
                    onOrderUpdated={loadData}
                />
            ) : viewMode === 'cards' ? (
                <div className="space-y-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Orders ({filteredOrders.length})</h2>
                    </div>
                    {filteredOrders.length === 0 ? (
                        <Card className="p-8 text-center">
                            <p className="text-muted-foreground">Tidak ada order yang sesuai filter.</p>
                        </Card>
                    ) : (
                        filteredOrders.map((order) => (
                            <MobileOrderCard
                                key={order.id}
                                order={order}
                                couriers={couriers}
                                orderCounts={getCourierOrderCounts()}
                                onDeleted={loadData}
                            />
                        ))
                    )}
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl">
                            Daftar Orders ({filteredOrders.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 grid grid-cols-1">
                        <div className="w-full overflow-x-auto rounded-md border border-gray-200 dark:border-gray-800 pb-2">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                                        <th className="text-left py-3 px-3 font-medium text-xs text-muted-foreground uppercase tracking-wider w-[1%] whitespace-nowrap">
                                            ID
                                        </th>
                                        <th className="text-left py-3 px-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                                            Pengirim
                                        </th>
                                        <th className="text-left py-3 px-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                                            Info Order
                                        </th>
                                        <th className="text-left py-3 px-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                                            Rute
                                        </th>
                                        <th className="text-left py-3 px-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                                            Kurir
                                        </th>
                                        <th className="text-left py-3 px-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="text-left py-3 px-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">
                                            Finansial
                                        </th>
                                        <th className="text-right py-3 px-3 font-medium text-xs text-muted-foreground uppercase tracking-wider w-[1%] whitespace-nowrap">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={8}
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
                                                className={`border-b transition-colors ${getPriorityStyle(order.serviceType)}`}
                                            >
                                                <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap align-top">
                                                    #{order.id.slice(-6)}
                                                </td>
                                                <td className="py-2.5 px-3 align-top max-w-[150px]">
                                                    <div>
                                                        <div className="font-medium text-sm truncate" title={order.pengirim.nama}>
                                                            {order.pengirim.nama}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                                            {order.pengirim.wa || "-"}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 align-top">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="text-xs font-medium">{order.jenisOrder}</div>
                                                        <div>{getPriorityBadge(order.serviceType)}</div>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 align-top max-w-[200px]">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-start gap-2">
                                                            <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                                            <div
                                                                className="truncate text-xs text-gray-700 dark:text-gray-300"
                                                                title={order.pickup.alamat}
                                                            >
                                                                {order.pickup.alamat}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-2">
                                                            <div className="mt-1 h-2 w-2 rounded-full bg-red-500 shrink-0" />
                                                            <div
                                                                className="truncate text-xs text-gray-700 dark:text-gray-300"
                                                                title={order.dropoff.alamat}
                                                            >
                                                                {order.dropoff.alamat}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 text-sm align-top">
                                                    <div className="truncate max-w-[120px]" title={getCourierName(order.kurirId) || "Belum di-assign"}>
                                                        {getCourierName(order.kurirId) || (
                                                            <span className="text-muted-foreground italic text-xs">Belum di-assign</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 align-top">
                                                    <div className="scale-90 origin-top-left">
                                                        {getStatusBadge(order.status)}
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 align-top">
                                                    {renderFinancialChips(order)}
                                                </td>
                                                <td className="py-2.5 px-3 text-right align-top">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }}>
                                                                <Eye className="mr-2 h-4 w-4" /> Lihat Detail
                                                            </DropdownMenuItem>
                                                            {order.status !== "SELESAI" && (
                                                                <DropdownMenuItem onClick={() => handleStatusChange(order.id, getNextStatus(order.status))}>
                                                                    <CheckCircle className="mr-2 h-4 w-4" /> Update Status
                                                                </DropdownMenuItem>
                                                            )}
                                                            {order.danaTalangan > 0 && !order.talanganReimbursed && (
                                                                <DropdownMenuItem onClick={() => handleMarkTalanganReimbursed(order.id)}>
                                                                    <Clock className="mr-2 h-4 w-4" /> Mark Talangan Reimbursed
                                                                </DropdownMenuItem>
                                                            )}
                                                            {!order.cod.isCOD && (
                                                                <DropdownMenuItem onClick={() => handleToggleNonCodPaid(order.id)}>
                                                                    <Zap className="mr-2 h-4 w-4" /> {order.nonCodPaid ? "Mark Unpaid" : "Mark Paid"}
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={async () => {
                                                                    if (!confirm(`Hapus order #${order.id.slice(-6)}?`)) return;
                                                                    const success = await deleteOrder(order.id);
                                                                    if (success) {
                                                                        toast.success("Order berhasil dihapus");
                                                                        loadData();
                                                                    } else {
                                                                        toast.error("Gagal menghapus order");
                                                                    }
                                                                }}
                                                                className="text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" /> Hapus Order
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

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

            <OrderDetailModal
                order={selectedOrder}
                couriers={couriers}
                open={showDetailModal}
                onClose={() => setShowDetailModal(false)}
            />
        </div>
    );
}

