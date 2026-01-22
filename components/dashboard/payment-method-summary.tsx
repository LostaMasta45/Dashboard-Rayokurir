"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Banknote,
    Smartphone,
    TrendingUp,
    Users,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency, type Order, type Courier } from "@/lib/auth";

interface PaymentMethodSummaryProps {
    orders: Order[];
    couriers: Courier[];
}

export function PaymentMethodSummary({ orders, couriers }: PaymentMethodSummaryProps) {
    const today = new Date().toDateString();

    // Filter delivered orders with payment method
    const deliveredOrders = orders.filter(
        (o) => o.status === "DELIVERED" || o.status === "SELESAI"
    );

    // Calculate totals by payment method
    const cashOrders = deliveredOrders.filter((o) => o.ongkirPaymentMethod === "CASH");
    const qrisOrders = deliveredOrders.filter((o) => o.ongkirPaymentMethod === "QRIS");

    // Today's breakdown
    const todayCashOrders = cashOrders.filter((o) => o.createdDate === today);
    const todayQrisOrders = qrisOrders.filter((o) => o.createdDate === today);

    const todayCashTotal = todayCashOrders.reduce((sum, o) => sum + (o.ongkir || 0), 0);
    const todayQrisTotal = todayQrisOrders.reduce((sum, o) => sum + (o.ongkir || 0), 0);

    // Cash held by couriers (orders paid via CASH but not yet deposited to admin)
    // For COD orders paid with CASH, the courier is holding the cash
    const cashHeldByCouriers = orders
        .filter(
            (o) =>
                o.bayarOngkir === "COD" &&
                o.ongkirPaymentMethod === "CASH" &&
                o.ongkirPaymentStatus === "PAID" &&
                (o.status === "DELIVERED" || o.status === "SELESAI") &&
                !o.codSettled // Cash not yet deposited
        )
        .reduce((sum, o) => sum + (o.ongkir || 0), 0);

    // Per-courier cash holdings
    const courierCashHoldings = couriers.map((courier) => {
        const courierOrders = orders.filter(
            (o) =>
                o.kurirId === courier.id &&
                o.bayarOngkir === "COD" &&
                o.ongkirPaymentMethod === "CASH" &&
                o.ongkirPaymentStatus === "PAID" &&
                (o.status === "DELIVERED" || o.status === "SELESAI") &&
                !o.codSettled
        );
        const cashHeld = courierOrders.reduce((sum, o) => sum + (o.ongkir || 0), 0);
        return { courier, cashHeld, orderCount: courierOrders.length };
    }).filter((c) => c.cashHeld > 0);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-rayo-primary" />
                    Metode Pembayaran Hari Ini
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Cash Summary */}
                    <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center gap-2 mb-2">
                            <Banknote className="h-5 w-5 text-yellow-600" />
                            <span className="font-semibold text-yellow-800 dark:text-yellow-300">Cash</span>
                            <Badge variant="outline" className="ml-auto text-xs">
                                {todayCashOrders.length} order
                            </Badge>
                        </div>
                        <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                            {formatCurrency(todayCashTotal)}
                        </div>
                        <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                            Ongkir dibayar tunai
                        </p>
                    </div>

                    {/* QRIS Summary */}
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                            <Smartphone className="h-5 w-5 text-green-600" />
                            <span className="font-semibold text-green-800 dark:text-green-300">QRIS</span>
                            <Badge variant="outline" className="ml-auto text-xs">
                                {todayQrisOrders.length} order
                            </Badge>
                        </div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                            {formatCurrency(todayQrisTotal)}
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                            Langsung masuk rekening
                        </p>
                    </div>

                    {/* Cash Held by Couriers */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 cursor-help">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="h-5 w-5 text-orange-600" />
                                        <span className="font-semibold text-orange-800 dark:text-orange-300">
                                            Cash di Kurir
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                                        {formatCurrency(cashHeldByCouriers)}
                                    </div>
                                    <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                                        Perlu disetor
                                    </p>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <p>Total ongkir CASH yang dipegang kurir dan belum disetor ke admin.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Per-Courier Cash Holdings */}
                {courierCashHoldings.length > 0 && (
                    <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                            Cash per Kurir (Belum Disetor)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {courierCashHoldings.map(({ courier, cashHeld, orderCount }) => (
                                <div
                                    key={courier.id}
                                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium text-sm">{courier.nama}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {orderCount} order
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-orange-600">
                                            {formatCurrency(cashHeld)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {todayCashOrders.length === 0 && todayQrisOrders.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                        <p className="text-sm">Belum ada order dengan metode pembayaran hari ini.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
