"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Package,
    CheckCircle,
    Clock,
    Truck,
    DollarSign,
    TrendingUp,
    Target,
    Flame,
    Award,
} from "lucide-react";
import { formatCurrency, type Order } from "@/lib/auth";

interface CourierStatsProps {
    orders: Order[];
    userName: string;
}

export function CourierStats({ orders, userName }: CourierStatsProps) {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Filter orders for today only
    const todayOrders = orders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= today && orderDate < tomorrow;
    });

    // Calculate stats for TODAY
    const todayStats = {
        total: todayOrders.length,
        menunggu: todayOrders.filter((o) =>
            ["BARU", "NEW", "OFFERED"].includes(o.status)
        ).length,
        otw: todayOrders.filter((o) =>
            ["ASSIGNED", "PICKUP", "DIKIRIM", "ACCEPTED", "OTW_PICKUP", "PICKED", "OTW_DROPOFF", "NEED_POD"].includes(o.status)
        ).length,
        selesai: todayOrders.filter((o) =>
            ["SELESAI", "DELIVERED"].includes(o.status)
        ).length,
        totalEarnings: todayOrders
            .filter((o) => ["SELESAI", "DELIVERED"].includes(o.status))
            .reduce((sum, o) => sum + o.ongkir * 0.1, 0), // Assume 10% commission
    };

    // Calculate stats for ALL time (for COD)
    const allTimeStats = {
        codOutstanding: orders
            .filter((o) => o.cod.isCOD && !o.cod.codPaid)
            .reduce((sum, o) => sum + o.cod.nominal, 0),
        codDeposited: orders
            .filter((o) => o.cod.isCOD && o.cod.codPaid)
            .reduce((sum, o) => sum + o.cod.nominal, 0),
    };

    // Calculate completion rate for today
    const completionRate = todayStats.total > 0
        ? Math.round((todayStats.selesai / todayStats.total) * 100)
        : 0;

    // Calculate streak (based on consecutive days with completed orders)
    const streak = 1; // Will be calculated from actual data later

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-600 p-6 text-white">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-teal-100 text-sm">Selamat datang kembali!</p>
                            <h2 className="text-2xl font-bold">{userName}</h2>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                            <Flame size={16} className="text-orange-300" />
                            <span className="text-sm font-medium">{streak} Hari Streak</span>
                        </div>
                    </div>

                    {/* Progress Ring */}
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <svg className="w-20 h-20 transform -rotate-90">
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="35"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth="6"
                                />
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="35"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    strokeDasharray={`${completionRate * 2.2} 220`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-bold">{completionRate}%</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="text-teal-100 text-sm mb-1">Target Hari Ini</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold">{todayStats.selesai}</span>
                                <span className="text-teal-100">/ {todayStats.total} order</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                                <TrendingUp size={14} className="text-green-300" />
                                <span className="text-xs text-green-200">+15% dari kemarin</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Active Orders */}
                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <Truck size={20} className="text-blue-200" />
                            <Badge className="bg-white/20 text-white border-0 text-[10px]">
                                Aktif
                            </Badge>
                        </div>
                        <div className="text-2xl font-bold">{todayStats.otw}</div>
                        <p className="text-xs text-blue-100">Order dalam proses</p>
                    </CardContent>
                </Card>

                {/* Pending Pickup */}
                <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <Clock size={20} className="text-amber-200" />
                            <Badge className="bg-white/20 text-white border-0 text-[10px]">
                                Menunggu
                            </Badge>
                        </div>
                        <div className="text-2xl font-bold">{todayStats.menunggu}</div>
                        <p className="text-xs text-amber-100">Perlu dijemput</p>
                    </CardContent>
                </Card>

                {/* Completed */}
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle size={20} className="text-emerald-200" />
                            <Badge className="bg-white/20 text-white border-0 text-[10px]">
                                Selesai
                            </Badge>
                        </div>
                        <div className="text-2xl font-bold">{todayStats.selesai}</div>
                        <p className="text-xs text-emerald-100">Order terselesaikan</p>
                    </CardContent>
                </Card>

                {/* Earnings */}
                <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-500 to-violet-600 text-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign size={20} className="text-purple-200" />
                            <Badge className="bg-white/20 text-white border-0 text-[10px]">
                                Hari ini
                            </Badge>
                        </div>
                        <div className="text-2xl font-bold">
                            {formatCurrency(todayStats.totalEarnings)}
                        </div>
                        <p className="text-xs text-purple-100">Estimasi pendapatan</p>
                    </CardContent>
                </Card>
            </div>

            {/* COD Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* COD Outstanding */}
                <Card className="border-2 border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">
                                    COD Belum Disetor
                                </p>
                                <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                                    {formatCurrency(allTimeStats.codOutstanding)}
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <DollarSign size={24} className="text-red-500" />
                            </div>
                        </div>
                        {allTimeStats.codOutstanding > 0 && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                                âš ï¸ Segera setor ke admin
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* COD Deposited */}
                <Card className="border-2 border-green-100 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/10">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                                    COD Sudah Disetor
                                </p>
                                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                    {formatCurrency(allTimeStats.codDeposited)}
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CheckCircle size={24} className="text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Achievements Preview */}
            <Card className="border-0 shadow-sm bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Award size={18} className="text-amber-500" />
                            <span className="font-semibold text-gray-900 dark:text-white">
                                Pencapaian
                            </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                            3 Badge
                        </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white shadow-lg">
                            <Flame size={18} />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                            <Target size={18} />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white shadow-lg">
                            <CheckCircle size={18} />
                        </div>
                        <div className="flex-1 text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Kumpulkan lebih banyak badge!
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

