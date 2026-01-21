"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, deleteOrder, type Order, type Courier, updateOrder } from "@/lib/auth";
import { toast } from "sonner";
import { Clock, Zap, Package, MapPin, Phone, User, GripVertical, ChevronLeft, ChevronRight, Truck, CheckCircle, Navigation, Trash2 } from "lucide-react";
import { OrderQuickStats } from "@/components/order-quick-stats";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KanbanBoardProps {
    orders: Order[];
    couriers: Courier[];
    onOrderUpdated: () => void;
}

type OrderStatus = Order["status"];

const STATUS_COLUMNS: {
    status: OrderStatus;
    label: string;
    shortLabel: string;
    color: string;
    bgColor: string;
    tabBg: string;
    tabActive: string;
    icon: typeof Clock;
}[] = [
        {
            status: "BARU",
            label: "Menunggu Kurir",
            shortLabel: "Baru",
            color: "text-gray-700 dark:text-gray-200",
            bgColor: "bg-gray-100 dark:bg-gray-800",
            tabBg: "bg-gray-100 dark:bg-gray-700",
            tabActive: "bg-gray-500 text-white",
            icon: Clock
        },
        {
            status: "ASSIGNED",
            label: "Kurir Ditugaskan",
            shortLabel: "Assigned",
            color: "text-blue-700 dark:text-blue-200",
            bgColor: "bg-blue-100 dark:bg-blue-900/40",
            tabBg: "bg-blue-100 dark:bg-blue-900/30",
            tabActive: "bg-blue-500 text-white",
            icon: Truck
        },
        {
            status: "PICKUP",
            label: "Barang Diambil",
            shortLabel: "Pickup",
            color: "text-amber-700 dark:text-amber-200",
            bgColor: "bg-amber-100 dark:bg-amber-900/40",
            tabBg: "bg-amber-100 dark:bg-amber-900/30",
            tabActive: "bg-amber-500 text-white",
            icon: Package
        },
        {
            status: "DIKIRIM",
            label: "Sedang Dikirim",
            shortLabel: "Dikirim",
            color: "text-orange-700 dark:text-orange-200",
            bgColor: "bg-orange-100 dark:bg-orange-900/40",
            tabBg: "bg-orange-100 dark:bg-orange-900/30",
            tabActive: "bg-orange-500 text-white",
            icon: Navigation
        },
        {
            status: "SELESAI",
            label: "Selesai",
            shortLabel: "Done",
            color: "text-green-700 dark:text-green-200",
            bgColor: "bg-green-100 dark:bg-green-900/40",
            tabBg: "bg-green-100 dark:bg-green-900/30",
            tabActive: "bg-green-500 text-white",
            icon: CheckCircle
        },
    ];

export function KanbanBoard({ orders, couriers, onOrderUpdated }: KanbanBoardProps) {
    const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<OrderStatus | null>(null);
    const [mobileActiveTab, setMobileActiveTab] = useState(0);

    const getOrdersByStatus = (status: OrderStatus) => {
        return orders.filter((order) => order.status === status);
    };

    const getCourierName = (kurirId: string | null) => {
        if (!kurirId) return null;
        const courier = couriers.find((c) => c.id === kurirId);
        return courier?.nama || null;
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

    const getPriorityStyle = (serviceType: string) => {
        switch (serviceType) {
            case "Same Day":
                return "border-l-4 border-l-red-500 dark:border-l-red-400";
            case "Express":
                return "border-l-4 border-l-orange-500 dark:border-l-orange-400";
            default:
                return "border-l-4 border-l-gray-300 dark:border-l-gray-600";
        }
    };

    const getPriorityBadge = (serviceType: string) => {
        switch (serviceType) {
            case "Same Day":
                return (
                    <Badge className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 text-xs gap-0.5 px-1.5 py-0 border-none">
                        <Clock className="h-2.5 w-2.5" /> Urgent
                    </Badge>
                );
            case "Express":
                return (
                    <Badge className="bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-200 text-xs gap-0.5 px-1.5 py-0 border-none">
                        <Zap className="h-2.5 w-2.5" /> Express
                    </Badge>
                );
            default:
                return null;
        }
    };

    const handleDragStart = (e: React.DragEvent, order: Order) => {
        setDraggedOrder(order);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", order.id);
    };

    const handleDragOver = (e: React.DragEvent, status: OrderStatus) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverStatus(status);
    };

    const handleDragLeave = () => {
        setDragOverStatus(null);
    };

    const handleDrop = async (e: React.DragEvent, newStatus: OrderStatus) => {
        e.preventDefault();
        setDragOverStatus(null);

        if (!draggedOrder) return;
        if (draggedOrder.status === newStatus) {
            setDraggedOrder(null);
            return;
        }

        // Optimistic update
        const previousStatus = draggedOrder.status;

        try {
            await updateOrder({ ...draggedOrder, status: newStatus });
            toast.success(`Order #${draggedOrder.id.slice(-6)} → ${STATUS_COLUMNS.find(s => s.status === newStatus)?.label}`);
            onOrderUpdated();
        } catch (error) {
            console.error("Error updating order status:", error);
            toast.error("Gagal update status order");
        } finally {
            setDraggedOrder(null);
        }
    };

    const handleDragEnd = () => {
        setDraggedOrder(null);
        setDragOverStatus(null);
    };

    // Order Card Component (shared between mobile and desktop)
    const OrderCard = ({ order, column }: { order: Order; column: typeof STATUS_COLUMNS[0] }) => (
        <OrderQuickStats order={order}>
            <Card
                draggable
                onDragStart={(e) => handleDragStart(e, order)}
                onDragEnd={handleDragEnd}
                className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 ${getPriorityStyle(order.serviceType)} ${draggedOrder?.id === order.id ? "opacity-50 scale-95" : ""
                    }`}
            >
                <CardContent className="p-3 space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-1">
                            <GripVertical className="h-3 w-3 text-gray-400" />
                            <span className="font-mono text-xs text-muted-foreground">
                                #{order.id.slice(-6)}
                            </span>
                        </div>
                        {getPriorityBadge(order.serviceType)}
                    </div>

                    {/* Sender */}
                    <div className="flex items-center gap-1.5 text-sm">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="font-medium truncate">
                            {order.pengirim.nama}
                        </span>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">
                            {order.dropoff.alamat}
                        </span>
                    </div>

                    {/* Courier & Delete */}
                    <div className="flex items-center justify-between">
                        {getCourierName(order.kurirId) ? (
                            <div className="flex items-center gap-1.5 text-xs">
                                <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                    <User className="h-2.5 w-2.5 text-green-600 dark:text-green-200" />
                                </div>
                                <span className="text-green-700 dark:text-green-300 font-medium">
                                    {getCourierName(order.kurirId)}
                                </span>
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground">Belum di-assign</span>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={async (e) => {
                                e.stopPropagation();
                                if (!confirm(`Hapus order #${order.id.slice(-6)}?`)) return;
                                const success = await deleteOrder(order.id);
                                if (success) {
                                    toast.success("Order berhasil dihapus");
                                    onOrderUpdated();
                                } else {
                                    toast.error("Gagal menghapus order");
                                }
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1 border-t">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            {formatCurrency(order.ongkir)}
                        </span>
                        {order.cod.isCOD && (
                            <Badge className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-1.5 py-0">
                                COD {formatCurrency(order.cod.nominal)}
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
        </OrderQuickStats>
    );

    return (
        <div className="pb-4">
            {/* ============ MOBILE VIEW ============ */}
            <div className="sm:hidden space-y-4">
                {/* Mobile Tab Navigation */}
                <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                    {STATUS_COLUMNS.map((column, index) => {
                        const columnOrders = getOrdersByStatus(column.status);
                        const Icon = column.icon;
                        const isActive = mobileActiveTab === index;

                        return (
                            <button
                                key={column.status}
                                onClick={() => setMobileActiveTab(index)}
                                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 ${isActive
                                    ? column.tabActive + " shadow-md"
                                    : column.tabBg + " " + column.color
                                    }`}
                            >
                                <Icon size={14} />
                                <span>{column.shortLabel}</span>
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
                <div className="flex items-center justify-between">
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
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {STATUS_COLUMNS[mobileActiveTab].label}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        disabled={mobileActiveTab === STATUS_COLUMNS.length - 1}
                        onClick={() => setMobileActiveTab(prev => Math.min(STATUS_COLUMNS.length - 1, prev + 1))}
                    >
                        Next
                        <ChevronRight size={16} className="ml-1" />
                    </Button>
                </div>

                {/* Mobile Column Content */}
                <div className={`rounded-xl ${STATUS_COLUMNS[mobileActiveTab].bgColor} p-3 min-h-[300px] transition-all duration-300`}>
                    {/* Column Header */}
                    <div className={`${STATUS_COLUMNS[mobileActiveTab].bgColor} rounded-t-xl p-3 mb-3`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {(() => {
                                    const Icon = STATUS_COLUMNS[mobileActiveTab].icon;
                                    return <Icon size={18} className={STATUS_COLUMNS[mobileActiveTab].color} />;
                                })()}
                                <span className={`font-semibold ${STATUS_COLUMNS[mobileActiveTab].color}`}>
                                    {STATUS_COLUMNS[mobileActiveTab].label}
                                </span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                {getOrdersByStatus(STATUS_COLUMNS[mobileActiveTab].status).length}
                            </Badge>
                        </div>
                    </div>

                    {/* Order Cards */}
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {getOrdersByStatus(STATUS_COLUMNS[mobileActiveTab].status).length === 0 ? (
                            <div className="text-center py-12 text-sm text-muted-foreground">
                                <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                <p>Tidak ada order</p>
                                <p className="text-xs mt-1">Swipe untuk melihat status lain</p>
                            </div>
                        ) : (
                            getOrdersByStatus(STATUS_COLUMNS[mobileActiveTab].status).map((order) => (
                                <OrderCard key={order.id} order={order} column={STATUS_COLUMNS[mobileActiveTab]} />
                            ))
                        )}
                    </div>
                </div>

                {/* Mobile Swipe Indicator */}
                <div className="flex justify-center gap-1.5 mt-4">
                    {STATUS_COLUMNS.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setMobileActiveTab(index)}
                            className={`h-2 rounded-full transition-all duration-200 ${mobileActiveTab === index
                                ? "w-6 bg-rayo-primary"
                                : "w-2 bg-gray-300 dark:bg-gray-600"
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* ============ DESKTOP VIEW ============ */}
            <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
                {STATUS_COLUMNS.map((column) => {
                    const columnOrders = getOrdersByStatus(column.status);
                    const isDragOver = dragOverStatus === column.status;
                    const Icon = column.icon;
                    const isDoneColumn = column.status === "SELESAI";

                    // For Done column, only show recent 5 initially
                    const displayedOrders = isDoneColumn ? columnOrders.slice(0, 5) : columnOrders;
                    const hasMore = isDoneColumn && columnOrders.length > 5;

                    return (
                        <div
                            key={column.status}
                            className={`w-full rounded-xl transition-all duration-200 ${isDragOver ? "ring-2 ring-blue-400 ring-offset-2" : ""
                                }`}
                            onDragOver={(e) => handleDragOver(e, column.status)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, column.status)}
                        >
                            {/* Column Header */}
                            <div className={`${column.bgColor} rounded-t-xl p-3`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icon size={16} className={column.color} />
                                        <span className={`font-semibold ${column.color}`}>
                                            {column.label}
                                        </span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {columnOrders.length}
                                    </Badge>
                                </div>
                            </div>

                            {/* Column Body */}
                            <div className={`bg-gray-50/50 dark:bg-gray-900/40 rounded-b-xl p-2 min-h-[150px] max-h-[80vh] overflow-y-auto space-y-2 ${isDragOver ? "bg-blue-50/50 dark:bg-blue-900/40" : ""
                                }`}>
                                {displayedOrders.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                        <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                        <p>Tidak ada order</p>
                                    </div>
                                ) : (
                                    <>
                                        {displayedOrders.map((order) => (
                                            <OrderCard key={order.id} order={order} column={column} />
                                        ))}

                                        {hasMore && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full text-xs font-medium text-muted-foreground hover:text-foreground border border-dashed border-gray-300 dark:border-gray-700 h-9"
                                                    >
                                                        Lihat Semua ({columnOrders.length})
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
                                                    <DialogHeader>
                                                        <DialogTitle className="flex items-center gap-2">
                                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                                            Riwayat Order Selesai
                                                            <Badge variant="secondary" className="ml-2">
                                                                {columnOrders.length} Order
                                                            </Badge>
                                                        </DialogTitle>
                                                    </DialogHeader>
                                                    <div className="flex-1 overflow-hidden min-h-0 bg-gray-50/50 dark:bg-gray-900/20 rounded-md border mt-2">
                                                        <ScrollArea className="h-full p-4">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                {columnOrders.map((order) => (
                                                                    <OrderCard key={order.id} order={order} column={column} />
                                                                ))}
                                                            </div>
                                                        </ScrollArea>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

