"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Package,
    CheckCircle,
    Clock,
    Truck,
    DollarSign,
    MapPin,
    Phone,
    ChevronRight,
    Camera,
    MessageCircle,
    Navigation,
    ArrowRight,
    Zap,
    ChevronLeft,
} from "lucide-react";
import { formatCurrency, type Order } from "@/lib/auth";
import { Banknote } from "lucide-react";

interface CourierKanbanBoardProps {
    orders: Order[];
    onStatusUpdate: (orderId: string, newStatus: Order["status"]) => void;
    onCODDeposit: (order: Order) => void;
    onTalanganConfirm?: (order: Order) => void;
    onOrderClick: (order: Order) => void;
    onPhotoCapture?: (order: Order) => void;
}

const KANBAN_COLUMNS = [
    {
        id: "OFFERED",
        title: "Ditawarkan",
        shortTitle: "Offered",
        icon: Clock,
        color: "from-purple-500 to-violet-600",
        bgColor: "bg-purple-50 dark:bg-purple-800/50",
        borderColor: "border-purple-200 dark:border-purple-700",
        textColor: "text-purple-600 dark:text-purple-300",
        tabBg: "bg-purple-100 dark:bg-purple-700",
        tabActive: "bg-purple-500 text-white",
        statuses: ["OFFERED", "NEW", "BARU"]  // Match multiple statuses
    },
    {
        id: "ACCEPTED",
        title: "Diterima",
        shortTitle: "Accepted",
        icon: Truck,
        color: "from-blue-500 to-cyan-500",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-200 dark:border-blue-800",
        textColor: "text-blue-600 dark:text-blue-400",
        tabBg: "bg-blue-100 dark:bg-blue-900/30",
        tabActive: "bg-blue-500 text-white",
        statuses: ["ACCEPTED", "ASSIGNED", "OTW_PICKUP"]
    },
    {
        id: "PICKED",
        title: "Sudah Jemput",
        shortTitle: "Picked",
        icon: Package,
        color: "from-amber-500 to-yellow-500",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        borderColor: "border-amber-200 dark:border-amber-800",
        textColor: "text-amber-600 dark:text-amber-400",
        tabBg: "bg-amber-100 dark:bg-amber-900/30",
        tabActive: "bg-amber-500 text-white",
        statuses: ["PICKED", "PICKUP", "OTW_DROPOFF", "DIKIRIM"]
    },
    {
        id: "NEED_POD",
        title: "Butuh Foto POD",
        shortTitle: "POD",
        icon: Camera,
        color: "from-pink-500 to-rose-500",
        bgColor: "bg-pink-50 dark:bg-pink-900/20",
        borderColor: "border-pink-200 dark:border-pink-800",
        textColor: "text-pink-600 dark:text-pink-400",
        tabBg: "bg-pink-100 dark:bg-pink-900/30",
        tabActive: "bg-pink-500 text-white",
        statuses: ["NEED_POD"]
    },
    {
        id: "SELESAI",
        title: "Selesai",
        shortTitle: "Done",
        icon: CheckCircle,
        color: "from-emerald-500 to-green-500",
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
        borderColor: "border-emerald-200 dark:border-emerald-800",
        textColor: "text-emerald-600 dark:text-emerald-400",
        tabBg: "bg-emerald-100 dark:bg-emerald-900/30",
        tabActive: "bg-emerald-500 text-white",
        statuses: ["DELIVERED", "SELESAI"]
    },
];

export function CourierKanbanBoard({
    orders,
    onStatusUpdate,
    onCODDeposit,
    onTalanganConfirm,
    onOrderClick,
    onPhotoCapture,
}: CourierKanbanBoardProps) {
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const [mobileActiveTab, setMobileActiveTab] = useState(0);

    const getOrdersByStatus = (column: typeof KANBAN_COLUMNS[0]) => {
        return orders.filter((order) => column.statuses.includes(order.status));
    };

    const getNextStatus = (currentStatus: Order["status"]): Order["status"] | null => {
        const statusFlow: Partial<Record<Order["status"], Order["status"] | null>> = {
            // New statuses
            NEW: null,
            OFFERED: null, // Need to accept/reject first
            ACCEPTED: "OTW_PICKUP",
            OTW_PICKUP: "PICKED",
            PICKED: "OTW_DROPOFF",
            OTW_DROPOFF: "NEED_POD",
            NEED_POD: "DELIVERED",
            DELIVERED: null,
            REJECTED: null,
            CANCELLED: null,
            // Legacy statuses
            BARU: null,
            ASSIGNED: "PICKUP",
            PICKUP: "DIKIRIM",
            DIKIRIM: "SELESAI",
            SELESAI: null,
        };
        return statusFlow[currentStatus] ?? null;
    };

    const getActionLabel = (status: Order["status"]): string => {
        const labels: Partial<Record<Order["status"], string>> = {
            // New statuses
            NEW: "Menunggu",
            OFFERED: "Terima",
            ACCEPTED: "OTW Jemput",
            OTW_PICKUP: "Sudah Jemput",
            PICKED: "OTW Antar",
            OTW_DROPOFF: "Upload POD",
            NEED_POD: "Upload POD",
            DELIVERED: "Selesai",
            REJECTED: "Ditolak",
            CANCELLED: "Dibatalkan",
            // Legacy statuses
            BARU: "Menunggu",
            ASSIGNED: "Ambil Barang",
            PICKUP: "Mulai Kirim",
            DIKIRIM: "Selesai",
            SELESAI: "Selesai",
        };
        return labels[status] ?? "Lanjut";
    };

    const handleQuickAction = (order: Order, e: React.MouseEvent) => {
        e.stopPropagation();
        const nextStatus = getNextStatus(order.status);
        if (nextStatus) {
            onStatusUpdate(order.id, nextStatus);
        }
    };

    const openWhatsApp = (phone: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const cleanPhone = phone.replace(/\D/g, "");
        const formattedPhone = cleanPhone.startsWith("0")
            ? "62" + cleanPhone.slice(1)
            : cleanPhone;
        window.open(`https://wa.me/${formattedPhone}`, "_blank");
    };

    const openMaps = (address: string, e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank");
    };

    // Order Card Component (shared between mobile and desktop)
    const OrderCard = ({ order, column }: { order: Order; column: typeof KANBAN_COLUMNS[0] }) => (
        <div
            className={`bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${expandedCard === order.id ? "ring-2 ring-teal-500" : ""
                }`}
            onClick={() => onOrderClick(order)}
        >
            {/* Order Header */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                        #{order.id.slice(-6)}
                    </p>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {order.pengirim.nama}
                    </h4>
                </div>
                {order.cod.isCOD && (
                    <Badge
                        className={`text-[9px] ${order.cod.codPaid
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                    >
                        COD
                    </Badge>
                )}
            </div>

            {/* Addresses Mini */}
            <div className="space-y-1 mb-3">
                <div className="flex items-start gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                        {order.pickup.alamat}
                    </p>
                </div>
                <div className="flex items-start gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                        {order.dropoff.alamat}
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
                {/* WhatsApp Button */}
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 hover:bg-green-100 dark:hover:bg-green-900/30"
                    onClick={(e) => openWhatsApp(order.pengirim.wa, e)}
                >
                    <MessageCircle size={14} className="text-green-600" />
                </Button>

                {/* Maps Button */}
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    onClick={(e) => openMaps(
                        order.status === "BARU" || order.status === "ASSIGNED"
                            ? order.pickup.alamat
                            : order.dropoff.alamat,
                        e
                    )}
                >
                    <MapPin size={14} className="text-blue-600" />
                </Button>

                {/* Photo Button */}
                {onPhotoCapture && order.status !== "SELESAI" && (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                        onClick={(e) => {
                            e.stopPropagation();
                            onPhotoCapture(order);
                        }}
                    >
                        <Camera size={14} className="text-purple-600" />
                    </Button>
                )}

                {/* Main Action Button */}
                <div className="flex-1" />
                {order.status !== "SELESAI" ? (
                    <Button
                        size="sm"
                        className={`h-7 text-[10px] font-medium bg-gradient-to-r ${column.color} text-white shadow-sm hover:shadow-md transition-all`}
                        onClick={(e) => handleQuickAction(order, e)}
                    >
                        <ArrowRight size={12} className="mr-1" />
                        {getActionLabel(order.status)}
                    </Button>
                ) : order.cod.isCOD && !order.cod.codPaid ? (
                    <Button
                        size="sm"
                        className="h-7 text-[10px] font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCODDeposit(order);
                        }}
                    >
                        <DollarSign size={12} className="mr-1" />
                        Setor COD
                    </Button>
                ) : order.danaTalangan > 0 && !order.talanganReimbursed && onTalanganConfirm ? (
                    <Button
                        size="sm"
                        className="h-7 text-[10px] font-medium bg-gradient-to-r from-orange-400 to-amber-500 text-white"
                        onClick={(e) => {
                            e.stopPropagation();
                            onTalanganConfirm(order);
                        }}
                    >
                        <Banknote size={12} className="mr-1" />
                        Talangan
                    </Button>
                ) : (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px]">
                        <CheckCircle size={10} className="mr-1" />
                        Done
                    </Badge>
                )}
            </div>

            {/* COD Amount */}
            {order.cod.isCOD && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            Tagihan COD
                        </span>
                        <span className={`text-xs font-bold ${order.cod.codPaid
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                            }`}>
                            {formatCurrency(order.cod.nominal)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Kanban Header - Desktop */}
            <div className="hidden sm:flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Kanban Board
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Kelola order dengan mudah • {orders.length} order aktif
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                        <Zap size={12} className="text-yellow-500" />
                        Quick Actions
                    </Badge>
                </div>
            </div>

            {/* ============ MOBILE VIEW ============ */}
            <div className="sm:hidden">
                {/* Mobile Tab Navigation */}
                <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                    {KANBAN_COLUMNS.map((column, index) => {
                        const columnOrders = getOrdersByStatus(column);
                        const Icon = column.icon;
                        const isActive = mobileActiveTab === index;

                        return (
                            <button
                                key={column.id}
                                onClick={() => setMobileActiveTab(index)}
                                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 ${isActive
                                    ? column.tabActive + " shadow-md"
                                    : column.tabBg + " " + column.textColor
                                    }`}
                            >
                                <Icon size={14} />
                                <span>{column.shortTitle}</span>
                                <Badge
                                    variant="secondary"
                                    className={`h-5 min-w-[20px] px-1.5 text-[10px] ${isActive ? "bg-white/20 text-white" : ""
                                        }`}
                                >
                                    {columnOrders.length}
                                </Badge>
                            </button>
                        );
                    })}
                </div>

                {/* Mobile Navigation Arrows */}
                <div className="flex items-center justify-between mt-3 mb-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        disabled={mobileActiveTab === 0}
                        onClick={() => setMobileActiveTab(prev => Math.max(0, prev - 1))}
                    >
                        <ChevronLeft size={16} className="mr-1" />
                        Prev
                    </Button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {KANBAN_COLUMNS[mobileActiveTab].title}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        disabled={mobileActiveTab === KANBAN_COLUMNS.length - 1}
                        onClick={() => setMobileActiveTab(prev => Math.min(KANBAN_COLUMNS.length - 1, prev + 1))}
                    >
                        Next
                        <ChevronRight size={16} className="ml-1" />
                    </Button>
                </div>

                {/* Mobile Column Content */}
                <div className={`rounded-2xl border-2 ${KANBAN_COLUMNS[mobileActiveTab].borderColor} ${KANBAN_COLUMNS[mobileActiveTab].bgColor} p-3 min-h-[300px] transition-all duration-300`}>
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${KANBAN_COLUMNS[mobileActiveTab].color} flex items-center justify-center shadow-lg`}>
                                {(() => {
                                    const Icon = KANBAN_COLUMNS[mobileActiveTab].icon;
                                    return <Icon size={20} className="text-white" />;
                                })()}
                            </div>
                            <div>
                                <h3 className={`font-bold text-lg ${KANBAN_COLUMNS[mobileActiveTab].textColor}`}>
                                    {KANBAN_COLUMNS[mobileActiveTab].title}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {getOrdersByStatus(KANBAN_COLUMNS[mobileActiveTab]).length} order
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Order Cards */}
                    <div className="space-y-3">
                        {getOrdersByStatus(KANBAN_COLUMNS[mobileActiveTab]).length === 0 ? (
                            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                                <Package size={40} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Tidak ada order</p>
                                <p className="text-xs mt-1">Swipe untuk melihat status lain</p>
                            </div>
                        ) : (
                            getOrdersByStatus(KANBAN_COLUMNS[mobileActiveTab]).map((order) => (
                                <OrderCard key={order.id} order={order} column={KANBAN_COLUMNS[mobileActiveTab]} />
                            ))
                        )}
                    </div>
                </div>

                {/* Mobile Swipe Indicator */}
                <div className="flex justify-center gap-1.5 mt-4">
                    {KANBAN_COLUMNS.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setMobileActiveTab(index)}
                            className={`h-2 rounded-full transition-all duration-200 ${mobileActiveTab === index
                                ? "w-6 bg-teal-500"
                                : "w-2 bg-gray-300 dark:bg-gray-600"
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* ============ DESKTOP VIEW ============ */}
            <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {KANBAN_COLUMNS.map((column) => {
                    const columnOrders = getOrdersByStatus(column);
                    const Icon = column.icon;

                    return (
                        <div
                            key={column.id}
                            className={`rounded-2xl border-2 ${column.borderColor} ${column.bgColor} p-3 min-h-[200px] transition-all duration-300`}
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${column.color} flex items-center justify-center shadow-lg`}>
                                        <Icon size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className={`font-semibold ${column.textColor}`}>
                                            {column.title}
                                        </h3>
                                    </div>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className={`${column.textColor} bg-white/50 dark:bg-gray-800/50`}
                                >
                                    {columnOrders.length}
                                </Badge>
                            </div>

                            {/* Order Cards */}
                            <div className="space-y-2">
                                {columnOrders.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                                        <Package size={24} className="mx-auto mb-1 opacity-30" />
                                        <p className="text-xs">Tidak ada order</p>
                                    </div>
                                ) : (
                                    columnOrders.map((order) => (
                                        <OrderCard key={order.id} order={order} column={column} />
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend - Desktop Only */}
            <div className="hidden sm:flex flex-wrap items-center justify-center gap-4 pt-4 border-t dark:border-gray-700">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <MessageCircle size={14} className="text-green-600" />
                    <span>WhatsApp</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <MapPin size={14} className="text-blue-600" />
                    <span>Buka Maps</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Camera size={14} className="text-purple-600" />
                    <span>Ambil Foto</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <ArrowRight size={14} className="text-teal-600" />
                    <span>Update Status</span>
                </div>
            </div>
        </div>
    );
}
