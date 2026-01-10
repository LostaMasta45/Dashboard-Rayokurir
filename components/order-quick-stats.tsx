"use client";

import type React from "react";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, type Order } from "@/lib/auth";
import { Clock, MapPin, Phone, User, FileText, DollarSign, Package } from "lucide-react";

interface OrderQuickStatsProps {
    order: Order;
    children: React.ReactNode;
}

export function OrderQuickStats({ order, children }: OrderQuickStatsProps) {
    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

        if (seconds < 60) return `${seconds} detik lalu`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
        return `${Math.floor(seconds / 86400)} hari lalu`;
    };

    const getTotalFinancial = () => {
        let total = order.ongkir;
        if (order.cod.isCOD) total += order.cod.nominal;
        if (order.danaTalangan > 0) total += order.danaTalangan;
        return total;
    };

    return (
        <HoverCard openDelay={500} closeDelay={100}>
            <HoverCardTrigger asChild>
                <div className="cursor-default">{children}</div>
            </HoverCardTrigger>
            <HoverCardContent
                side="right"
                align="start"
                className="w-72 p-0 bg-white border shadow-xl"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-t-md">
                    <div className="flex items-center justify-between">
                        <span className="font-bold">Order #{order.id.slice(-6)}</span>
                        <Badge className="bg-white/20 text-white text-xs">
                            {order.serviceType}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-blue-100 text-xs mt-1">
                        <Clock className="h-3 w-3" />
                        Dibuat {getTimeAgo(order.createdAt)}
                    </div>
                </div>

                {/* Content */}
                <div className="p-3 space-y-3">
                    {/* Customer Info */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{order.pengirim.nama}</span>
                        </div>
                        {order.pengirim.wa && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{order.pengirim.wa}</span>
                            </div>
                        )}
                    </div>

                    {/* Addresses */}
                    <div className="space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <MapPin className="h-3 w-3 text-green-600" />
                            </div>
                            <div>
                                <span className="text-muted-foreground">Pickup:</span>
                                <p className="text-gray-700">{order.pickup.alamat}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <MapPin className="h-3 w-3 text-red-600" />
                            </div>
                            <div>
                                <span className="text-muted-foreground">Dropoff:</span>
                                <p className="text-gray-700">{order.dropoff.alamat}</p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Breakdown */}
                    <div className="bg-gray-50 rounded-lg p-2.5 space-y-1.5">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <DollarSign className="h-4 w-4 text-blue-500" />
                            Total: {formatCurrency(getTotalFinancial())}
                        </div>
                        <div className="pl-6 space-y-1 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Ongkir:</span>
                                <span className="text-blue-600">{formatCurrency(order.ongkir)}</span>
                            </div>
                            {order.cod.isCOD && (
                                <div className="flex justify-between">
                                    <span>COD:</span>
                                    <span className="text-purple-600">{formatCurrency(order.cod.nominal)}</span>
                                </div>
                            )}
                            {order.danaTalangan > 0 && (
                                <div className="flex justify-between">
                                    <span>Talangan:</span>
                                    <span className="text-orange-600">{formatCurrency(order.danaTalangan)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div className="flex items-start gap-2 text-xs bg-yellow-50 rounded p-2">
                            <FileText className="h-3.5 w-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <p className="text-yellow-800">{order.notes}</p>
                        </div>
                    )}

                    {/* Jenis Order */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Package className="h-3.5 w-3.5" />
                        <span>Jenis: {order.jenisOrder}</span>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}
