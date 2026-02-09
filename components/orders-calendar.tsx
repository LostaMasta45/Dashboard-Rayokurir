"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CalendarDays, Package, TrendingUp, Plus } from "lucide-react";
import { type Order } from "@/lib/auth";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    isToday,
    parseISO,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface OrdersCalendarProps {
    orders: Order[];
    onDayClick?: (date: Date, dayOrders: Order[]) => void;
    onAddOrder?: (date: Date) => void;
}

interface DayData {
    date: Date;
    orders: Order[];
    totalRevenue: number;
    isCurrentMonth: boolean;
}

export function OrdersCalendar({ orders, onDayClick, onAddOrder }: OrdersCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Calculate calendar days with order data
    const calendarData = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

        return days.map((date): DayData => {
            // Filter orders for this day
            const dayOrders = orders.filter((order) => {
                try {
                    const orderDate = parseISO(order.createdAt);
                    return isSameDay(orderDate, date);
                } catch {
                    return false;
                }
            });

            // Calculate total revenue for the day (ongkir only for now)
            const totalRevenue = dayOrders.reduce((sum, order) => sum + (order.ongkir || 0), 0);

            return {
                date,
                orders: dayOrders,
                totalRevenue,
                isCurrentMonth: isSameMonth(date, currentMonth),
            };
        });
    }, [orders, currentMonth]);

    // Monthly statistics
    const monthStats = useMemo(() => {
        const monthOrders = orders.filter((order) => {
            try {
                const orderDate = parseISO(order.createdAt);
                return isSameMonth(orderDate, currentMonth);
            } catch {
                return false;
            }
        });

        const totalRevenue = monthOrders.reduce((sum, order) => sum + (order.ongkir || 0), 0);
        const completedOrders = monthOrders.filter((o) => o.status === "SELESAI").length;

        return {
            totalOrders: monthOrders.length,
            totalRevenue,
            completedOrders,
        };
    }, [orders, currentMonth]);

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}jt`;
        }
        if (amount >= 1000) {
            return `${(amount / 1000).toFixed(0)}rb`;
        }
        return amount.toString();
    };

    const getIntensityClass = (orderCount: number) => {
        if (orderCount === 0) return "bg-gray-50 dark:bg-gray-800/50";
        if (orderCount <= 2) return "bg-green-50 dark:bg-green-950/30";
        if (orderCount <= 5) return "bg-green-100 dark:bg-green-900/40";
        if (orderCount <= 10) return "bg-green-200 dark:bg-green-800/50";
        return "bg-green-300 dark:bg-green-700/60";
    };

    const weekDays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <CalendarDays className="h-5 w-5 text-rayo-primary" />
                        Kalender Order
                    </CardTitle>

                    {/* Month Navigation */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="h-8 w-8"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold min-w-[140px] text-center">
                            {format(currentMonth, "MMMM yyyy", { locale: idLocale })}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="h-8 w-8"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentMonth(new Date())}
                            className="text-xs"
                        >
                            Hari Ini
                        </Button>
                    </div>
                </div>

                {/* Month Stats */}
                <div className="flex flex-wrap gap-4 pt-3 text-sm">
                    <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-blue-500" />
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-semibold">{monthStats.totalOrders} order</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-muted-foreground">Pendapatan:</span>
                        <span className="font-semibold text-green-600">
                            Rp {monthStats.totalRevenue.toLocaleString("id-ID")}
                        </span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-2">
                {/* Week Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                    {weekDays.map((day) => (
                        <div
                            key={day}
                            className="text-center text-xs font-medium text-muted-foreground py-2"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarData.map((day, index) => (
                        <div
                            key={index}
                            onClick={() => onDayClick?.(day.date, day.orders)}
                            className={`
                                relative min-h-[70px] sm:min-h-[85px] p-1 sm:p-2 rounded-lg border transition-all cursor-pointer
                                ${day.isCurrentMonth ? "border-gray-200 dark:border-gray-700" : "border-transparent"}
                                ${getIntensityClass(day.orders.length)}
                                ${isToday(day.date) ? "ring-2 ring-rayo-primary ring-offset-1" : ""}
                                ${!day.isCurrentMonth ? "opacity-40" : "hover:border-rayo-primary/50"}
                            `}
                        >
                            {/* Date Number */}
                            <div className="flex items-start justify-between">
                                <span
                                    className={`
                                        text-sm font-medium
                                        ${isToday(day.date) ? "bg-rayo-primary text-white rounded-full w-6 h-6 flex items-center justify-center" : ""}
                                        ${!day.isCurrentMonth ? "text-muted-foreground" : ""}
                                    `}
                                >
                                    {format(day.date, "d")}
                                </span>

                                {/* Add Order Button (only for current month & past/today dates) */}
                                {day.isCurrentMonth && day.date <= new Date() && onAddOrder && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-rayo-primary/20"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddOrder(day.date);
                                        }}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>

                            {/* Order Stats */}
                            {day.orders.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                    <div className="flex items-center gap-1">
                                        <Package className="h-3 w-3 text-blue-500" />
                                        <span className="text-xs font-medium">
                                            {day.orders.length}
                                        </span>
                                    </div>
                                    {day.totalRevenue > 0 && (
                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium block">
                                            {formatCurrency(day.totalRevenue)}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Today Badge */}
                            {isToday(day.date) && (
                                <Badge className="absolute bottom-1 right-1 text-[10px] px-1 py-0 bg-rayo-primary">
                                    Hari ini
                                </Badge>
                            )}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
                    <span>Sedikit</span>
                    <div className="flex gap-0.5">
                        <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800/50 border" />
                        <div className="w-4 h-4 rounded bg-green-50 dark:bg-green-950/30 border" />
                        <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/40 border" />
                        <div className="w-4 h-4 rounded bg-green-200 dark:bg-green-800/50 border" />
                        <div className="w-4 h-4 rounded bg-green-300 dark:bg-green-700/60 border" />
                    </div>
                    <span>Banyak</span>
                </div>
            </CardContent>
        </Card>
    );
}
