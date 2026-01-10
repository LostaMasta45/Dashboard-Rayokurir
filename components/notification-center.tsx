"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, Package, Truck, CheckCircle, DollarSign, X } from "lucide-react";
import { useRealtimeOrders, useRealtimeCOD } from "@/hooks/use-realtime-orders";
import { toast } from "sonner";
import type { Order } from "@/lib/auth";

interface Notification {
    id: string;
    type: "order_created" | "status_changed" | "cod_deposited" | "order_assigned";
    message: string;
    orderId?: string;
    timestamp: Date;
    read: boolean;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
    BARU: "Menunggu Kurir",
    ASSIGNED: "Ditugaskan",
    PICKUP: "Diambil",
    DIKIRIM: "Dikirim",
    SELESAI: "Selesai",
};

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const addNotification = useCallback((notification: Omit<Notification, "id" | "timestamp" | "read">) => {
        const newNotification: Notification = {
            ...notification,
            id: Date.now().toString(),
            timestamp: new Date(),
            read: false,
        };

        setNotifications((prev) => [newNotification, ...prev].slice(0, 20)); // Keep last 20

        // Show toast notification
        const icon = getNotificationIcon(notification.type);
        toast.info(notification.message, {
            icon: icon,
            duration: 4000,
        });
    }, []);

    // Subscribe to order changes
    useRealtimeOrders(
        useCallback((event: { eventType: "INSERT" | "UPDATE" | "DELETE"; new: Order | null; old: Order | null }) => {
            if (event.eventType === "INSERT" && event.new) {
                addNotification({
                    type: "order_created",
                    message: `Order baru #${event.new.id.slice(-6)} dari ${event.new.pengirim?.nama || "Unknown"}`,
                    orderId: event.new.id,
                });
            } else if (event.eventType === "UPDATE" && event.new && event.old) {
                // Check if status changed
                if (event.new.status !== event.old.status) {
                    addNotification({
                        type: "status_changed",
                        message: `Order #${event.new.id.slice(-6)} → ${ORDER_STATUS_LABELS[event.new.status] || event.new.status}`,
                        orderId: event.new.id,
                    });
                }
                // Check if courier assigned
                if (event.new.kurirId && !event.old.kurirId) {
                    addNotification({
                        type: "order_assigned",
                        message: `Order #${event.new.id.slice(-6)} telah di-assign ke kurir`,
                        orderId: event.new.id,
                    });
                }
            }
        }, [addNotification]),
        true
    );

    // Subscribe to COD changes
    useRealtimeCOD(
        useCallback((event: { eventType: string; new: unknown; old: unknown }) => {
            if (event.eventType === "INSERT" && event.new) {
                const cod = event.new as { orderId?: string; nominal?: number };
                addNotification({
                    type: "cod_deposited",
                    message: `COD Rp ${(cod.nominal || 0).toLocaleString("id-ID")} telah disetor`,
                    orderId: cod.orderId,
                });
            }
        }, [addNotification]),
        true
    );

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const getNotificationIcon = (type: Notification["type"]) => {
        switch (type) {
            case "order_created":
                return <Package className="h-4 w-4 text-blue-500" />;
            case "status_changed":
                return <Truck className="h-4 w-4 text-orange-500" />;
            case "order_assigned":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "cod_deposited":
                return <DollarSign className="h-4 w-4 text-purple-500" />;
            default:
                return <Bell className="h-4 w-4" />;
        }
    };

    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

        if (seconds < 60) return `${seconds} detik lalu`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
        return `${Math.floor(seconds / 86400)} hari lalu`;
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b">
                    <span className="font-semibold text-sm">Notifikasi</span>
                    <div className="flex gap-1">
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={markAllAsRead}
                            >
                                Tandai dibaca
                            </Button>
                        )}
                        {notifications.length > 0 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={clearAll}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Belum ada notifikasi</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`flex items-start gap-3 px-3 py-2.5 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors ${!notification.read ? "bg-blue-50/50" : ""
                                    }`}
                                onClick={() => {
                                    setNotifications((prev) =>
                                        prev.map((n) =>
                                            n.id === notification.id ? { ...n, read: true } : n
                                        )
                                    );
                                }}
                            >
                                <div className="mt-0.5">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm leading-snug">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {formatTimeAgo(notification.timestamp)}
                                    </p>
                                </div>
                                {!notification.read && (
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                                )}
                            </div>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
