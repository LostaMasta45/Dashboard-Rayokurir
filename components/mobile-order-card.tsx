"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, deleteOrder, type Order, type Courier } from "@/lib/auth";
import { OrderQuickStats } from "@/components/order-quick-stats";
import { toast } from "sonner";
import {
    MapPin,
    User,
    Phone,
    Clock,
    Zap,
    Package,
    ChevronDown,
    ChevronUp,
    Trash2,
} from "lucide-react";

interface MobileOrderCardProps {
    order: Order;
    couriers: Courier[];
    orderCounts: Record<string, number>;
    onDeleted: () => void;
    onStatusChange?: () => void;
}

const ORDER_STATUS_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
    BARU: { label: "Menunggu", color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300", bgColor: "bg-gray-50 dark:bg-gray-900" },
    ASSIGNED: { label: "OTW", color: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300", bgColor: "bg-blue-50/50 dark:bg-blue-950/20" },
    PICKUP: { label: "Diambil", color: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300", bgColor: "bg-amber-50/50 dark:bg-amber-950/20" },
    DIKIRIM: { label: "Dikirim", color: "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300", bgColor: "bg-orange-50/50 dark:bg-orange-950/20" },
    SELESAI: { label: "Selesai", color: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300", bgColor: "bg-green-50/50 dark:bg-green-950/20" },
};

export function MobileOrderCard({
    order,
    couriers,
    orderCounts,
    onDeleted,
}: MobileOrderCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`Hapus order #${order.id.slice(-6)}?`)) return;

        setIsDeleting(true);
        try {
            const success = await deleteOrder(order.id);
            if (success) {
                toast.success("Order berhasil dihapus");
                onDeleted();
            } else {
                toast.error("Gagal menghapus order");
            }
        } catch (error) {
            console.error("Error deleting order:", error);
            toast.error("Gagal menghapus order");
        } finally {
            setIsDeleting(false);
        }
    };

    const getPriorityStyle = () => {
        switch (order.serviceType) {
            case "Same Day":
                return "border-l-4 border-l-red-500 dark:border-l-red-400";
            case "Express":
                return "border-l-4 border-l-orange-500 dark:border-l-orange-400";
            default:
                return "border-l-4 border-l-gray-300 dark:border-l-gray-600";
        }
    };

    const getPriorityBadge = () => {
        switch (order.serviceType) {
            case "Same Day":
                return (
                    <Badge className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs gap-0.5 border-none">
                        <Clock className="h-3 w-3" /> Urgent
                    </Badge>
                );
            case "Express":
                return (
                    <Badge className="bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-xs gap-0.5 border-none">
                        <Zap className="h-3 w-3" /> Express
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs gap-0.5 border-none">
                        <Package className="h-3 w-3" /> Reguler
                    </Badge>
                );
        }
    };

    const status = ORDER_STATUS_LABELS[order.status] || {
        label: order.status,
        color: "bg-gray-100 text-gray-700",
    };

    const assignedCourier = couriers.find((c) => c.id === order.kurirId);

    return (
        <OrderQuickStats order={order}>
            <Card
                className={`mb-3 transition-all duration-200 ${getPriorityStyle()} ${status.bgColor} hover:shadow-md border-t-0 border-b-0 border-r-0`}
            >
                <CardContent className="p-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm text-muted-foreground">
                                    #{order.id.slice(-6)}
                                </span>
                                <Badge className={`text-xs ${status.color}`}>
                                    {status.label}
                                </Badge>
                            </div>
                            {getPriorityBadge()}
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-blue-600">
                                {formatCurrency(order.ongkir)}
                            </div>
                            {order.cod.isCOD && (
                                <div className="text-xs text-purple-600">
                                    COD {formatCurrency(order.cod.nominal)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sender Info */}
                    <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{order.pengirim.nama}</span>
                        {order.pengirim.wa && (
                            <a
                                href={`tel:${order.pengirim.wa}`}
                                className="text-blue-600"
                            >
                                <Phone className="h-4 w-4" />
                            </a>
                        )}
                    </div>

                    {/* Address Preview */}
                    <div className="flex items-start gap-2 mb-3 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{order.dropoff.alamat}</span>
                    </div>

                    {/* Expand/Collapse Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground mb-2"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="h-3 w-3 mr-1" /> Lihat lebih sedikit
                            </>
                        ) : (
                            <>
                                <ChevronDown className="h-3 w-3 mr-1" /> Lihat detail
                            </>
                        )}
                    </Button>

                    {/* Expanded Details */}
                    {isExpanded && (
                        <div className="space-y-3 pt-2 border-t">
                            {/* Full Addresses */}
                            <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-green-600 text-xs">P</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground">
                                            Pickup:
                                        </span>
                                        <p className="text-gray-700">{order.pickup.alamat}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-red-600 text-xs">D</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground">
                                            Dropoff:
                                        </span>
                                        <p className="text-gray-700">{order.dropoff.alamat}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {order.notes && (
                                <div className="bg-yellow-50 rounded p-2 text-sm">
                                    <span className="text-yellow-800">{order.notes}</span>
                                </div>
                            )}

                            {/* Financial Details */}
                            {(order.danaTalangan > 0 || order.cod.isCOD) && (
                                <div className="bg-gray-50 rounded p-2 space-y-1 text-sm">
                                    {order.danaTalangan > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Talangan:</span>
                                            <span className={order.talanganReimbursed ? "text-green-600" : "text-orange-600"}>
                                                {formatCurrency(order.danaTalangan)}
                                                {order.talanganReimbursed ? " âœ“" : " (belum)"}
                                            </span>
                                        </div>
                                    )}
                                    {order.cod.isCOD && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">COD:</span>
                                            <span className={order.cod.codPaid ? "text-green-600" : "text-purple-600"}>
                                                {formatCurrency(order.cod.nominal)}
                                                {order.cod.codPaid ? " âœ“" : " (belum setor)"}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Row */}
                    <div className="flex items-center justify-between pt-3 border-t mt-3">
                        {assignedCourier ? (
                            <div className="flex items-center gap-2">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${assignedCourier.online
                                        ? "bg-green-100 text-green-700 ring-2 ring-green-400"
                                        : "bg-gray-100 text-gray-600"
                                        }`}
                                >
                                    {assignedCourier.nama
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </div>
                                <span className="text-sm font-medium">
                                    {assignedCourier.nama}
                                </span>
                            </div>
                        ) : (
                            <span className="text-sm text-muted-foreground">Belum di-assign</span>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </OrderQuickStats>
    );
}

