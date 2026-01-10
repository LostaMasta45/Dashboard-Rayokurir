"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { updateOrder, type Order, type Courier } from "@/lib/auth";
import { toast } from "sonner";
import { UserPlus, ChevronDown, Loader2 } from "lucide-react";

interface QuickAssignDropdownProps {
    order: Order;
    couriers: Courier[];
    orderCounts: Record<string, number>;
    onAssigned: () => void;
}

export function QuickAssignDropdown({
    order,
    couriers,
    orderCounts,
    onAssigned,
}: QuickAssignDropdownProps) {
    const [isAssigning, setIsAssigning] = useState(false);

    const activeCouriers = couriers.filter((courier) => courier.aktif);

    // Sort: online first, then by order count (ascending)
    const sortedCouriers = [...activeCouriers].sort((a, b) => {
        // Online first
        if (a.online && !b.online) return -1;
        if (!a.online && b.online) return 1;
        // Then by order count (less is better)
        const countA = orderCounts[a.id] || 0;
        const countB = orderCounts[b.id] || 0;
        return countA - countB;
    });

    const handleQuickAssign = async (courierId: string, courierName: string) => {
        setIsAssigning(true);
        try {
            // Auto-set status to ASSIGNED when courier is assigned
            const updated: Order = { ...order, kurirId: courierId, status: "ASSIGNED" };
            await updateOrder(updated);
            toast.success(`Order berhasil di-assign ke ${courierName}`);
            onAssigned();
        } catch (error) {
            console.error("Error assigning courier:", error);
            toast.error("Gagal assign kurir");
        } finally {
            setIsAssigning(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:border-blue-800 dark:text-blue-300"
                    disabled={isAssigning}
                >
                    {isAssigning ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <UserPlus className="h-3 w-3" />
                    )}
                    <span className="text-xs hidden sm:inline">Assign</span>
                    <ChevronDown className="h-3 w-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b mb-1">
                    Pilih Kurir - Quick Assign
                </div>
                {sortedCouriers.length === 0 ? (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        Tidak ada kurir aktif
                    </div>
                ) : (
                    sortedCouriers.map((courier) => {
                        const orderCount = orderCounts[courier.id] || 0;
                        return (
                            <DropdownMenuItem
                                key={courier.id}
                                onClick={() => handleQuickAssign(courier.id, courier.nama)}
                                className="flex items-center gap-3 py-2 cursor-pointer"
                            >
                                {/* Avatar */}
                                <div
                                    className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                                        ${courier.online
                                            ? "bg-green-100 text-green-700 ring-2 ring-green-400"
                                            : "bg-gray-100 text-gray-600"
                                        }
                                    `}
                                >
                                    {getInitials(courier.nama)}
                                </div>

                                {/* Name & Status */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">
                                        {courier.nama}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <span
                                            className={`w-2 h-2 rounded-full ${courier.online ? "bg-green-500" : "bg-gray-400"
                                                }`}
                                        />
                                        {courier.online ? "Online" : "Offline"}
                                    </div>
                                </div>

                                {/* Order Count Badge */}
                                <Badge
                                    variant="secondary"
                                    className={`
                                        text-xs px-1.5 py-0.5
                                        ${orderCount === 0
                                            ? "bg-green-100 text-green-700"
                                            : orderCount >= 3
                                                ? "bg-orange-100 text-orange-700"
                                                : "bg-blue-100 text-blue-700"
                                        }
                                    `}
                                >
                                    {orderCount} order
                                </Badge>
                            </DropdownMenuItem>
                        );
                    })
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

