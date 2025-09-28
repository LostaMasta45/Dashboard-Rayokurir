"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";
import {
    TrendingUp,
    TrendingDown,
    Package,
    DollarSign,
    Users,
    Calendar,
    FileText,
    Download,
    Filter,
} from "lucide-react";
import {
    getOrders,
    getCouriers,
    getCODHistory,
    getExpenses,
    getContacts,
    formatCurrency,
    type Order,
    type Courier,
    type CODHistory,
    type Expense,
    type Contact,
} from "@/lib/auth";

export function ReportsPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [codHistory, setCodHistory] = useState<CODHistory[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [dateRange, setDateRange] = useState("7"); // days

    useEffect(() => {
        (async () => {
            await loadData();
        })();
    }, []);

    const loadData = async () => {
        const [
            ordersData,
            couriersData,
            codHistoryData,
            expensesData,
            contactsData,
        ] = await Promise.all([
            getOrders(),
            getCouriers(),
            getCODHistory(),
            getExpenses(),
            getContacts(),
        ]);
        setOrders(ordersData);
        setCouriers(couriersData);
        setCodHistory(codHistoryData);
        setExpenses(expensesData);
        setContacts(contactsData);
    };

    // Calculate date range
    const getDateRangeData = (days: number) => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        return { startDate, endDate };
    };

    const { startDate, endDate } = getDateRangeData(Number.parseInt(dateRange));

    // Filter data by date range
    const filteredOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
    });

    const filteredExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.tanggal);
        return expenseDate >= startDate && expenseDate <= endDate;
    });

    const filteredCODHistory = codHistory.filter((history) => {
        const historyDate = new Date(history.tanggal);
        return historyDate >= startDate && historyDate <= endDate;
    });

    // Overall Statistics
    const overallStats = {
        totalOrders: filteredOrders.length,
        completedOrders: filteredOrders.filter(
            (order) => order.status === "SELESAI"
        ).length,
        totalRevenue: filteredOrders.reduce(
            (sum, order) => sum + (order.ongkir || 0),
            0
        ),
        totalExpenses: filteredExpenses.reduce(
            (sum, expense) => sum + expense.nominal,
            0
        ),
        totalCODCollected: filteredCODHistory.reduce(
            (sum, history) => sum + history.nominal,
            0
        ),
        activeCouriers: couriers.filter((courier) => courier.aktif).length,
        onlineCouriers: couriers.filter(
            (courier) => courier.aktif && courier.online
        ).length,
        totalContacts: contacts.length,
    };

    overallStats.profit =
        overallStats.totalRevenue - overallStats.totalExpenses;
    overallStats.completionRate =
        overallStats.totalOrders > 0
            ? (overallStats.completedOrders / overallStats.totalOrders) * 100
            : 0;

    // Daily Orders Chart Data
    const getDailyOrdersData = () => {
        const dailyData: Record<
            string,
            { date: string; orders: number; revenue: number; completed: number }
        > = {};

        for (
            let d = new Date(startDate);
            d <= endDate;
            d.setDate(d.getDate() + 1)
        ) {
            const dateStr = d.toISOString().split("T")[0];
            dailyData[dateStr] = {
                date: d.toLocaleDateString("id-ID", {
                    month: "short",
                    day: "numeric",
                }),
                orders: 0,
                revenue: 0,
                completed: 0,
            };
        }

        filteredOrders.forEach((order) => {
            const dateStr = new Date(order.createdAt)
                .toISOString()
                .split("T")[0];
            if (dailyData[dateStr]) {
                dailyData[dateStr].orders += 1;
                dailyData[dateStr].revenue += order.ongkir || 0;
                if (order.status === "SELESAI") {
                    dailyData[dateStr].completed += 1;
                }
            }
        });

        return Object.values(dailyData);
    };

    // Order Status Distribution
    const getOrderStatusData = () => {
        const statusCounts = {
            MENUNGGU_PICKUP: 0,
            PICKUP_OTW: 0,
            BARANG_DIAMBIL: 0,
            SEDANG_DIKIRIM: 0,
            SELESAI: 0,
        };

        filteredOrders.forEach((order) => {
            statusCounts[order.status] += 1;
        });

        return [
            {
                name: "Menunggu Pickup",
                value: statusCounts.MENUNGGU_PICKUP,
                color: "#6B7280",
            },
            {
                name: "Pickup OTW",
                value: statusCounts.PICKUP_OTW,
                color: "#3B82F6",
            },
            {
                name: "Barang Diambil",
                value: statusCounts.BARANG_DIAMBIL,
                color: "#F59E0B",
            },
            {
                name: "Sedang Dikirim",
                value: statusCounts.SEDANG_DIKIRIM,
                color: "#F97316",
            },
            { name: "Selesai", value: statusCounts.SELESAI, color: "#10B981" },
        ].filter((item) => item.value > 0);
    };

    // Service Type Distribution
    const getServiceTypeData = () => {
        const serviceTypes: Record<string, number> = {};

        filteredOrders.forEach((order) => {
            serviceTypes[order.serviceType] =
                (serviceTypes[order.serviceType] || 0) + 1;
        });

        return Object.entries(serviceTypes).map(([type, count]) => ({
            name: type,
            value: count,
            color:
                type === "Express"
                    ? "#EF4444"
                    : type === "Same Day"
                    ? "#8B5CF6"
                    : "#10B981",
        }));
    };

    // Courier Performance Data
    const getCourierPerformanceData = () => {
        return couriers
            .map((courier) => {
                const courierOrders = filteredOrders.filter(
                    (order) => order.kurirId === courier.id
                );
                const completedOrders = courierOrders.filter(
                    (order) => order.status === "SELESAI"
                );
                const totalRevenue = courierOrders.reduce(
                    (sum, order) => sum + (order.ongkir || 0),
                    0
                );
                const codDeposited = filteredCODHistory
                    .filter((history) => history.kurirId === courier.id)
                    .reduce((sum, history) => sum + history.nominal, 0);

                return {
                    name: courier.nama,
                    orders: courierOrders.length,
                    completed: completedOrders.length,
                    revenue: totalRevenue,
                    codDeposited: codDeposited,
                    completionRate:
                        courierOrders.length > 0
                            ? (completedOrders.length / courierOrders.length) *
                              100
                            : 0,
                };
            })
            .filter((data) => data.orders > 0);
    };

    // Expense Categories Data
    const getExpenseCategoriesData = () => {
        const categories: Record<string, number> = {};

        filteredExpenses.forEach((expense) => {
            categories[expense.kategori] =
                (categories[expense.kategori] || 0) + expense.nominal;
        });

        return Object.entries(categories).map(([category, amount]) => ({
            name: category,
            value: amount,
        }));
    };

    const dailyOrdersData = getDailyOrdersData();
    const orderStatusData = getOrderStatusData();
    const serviceTypeData = getServiceTypeData();
    const courierPerformanceData = getCourierPerformanceData();
    const expenseCategoriesData = getExpenseCategoriesData();

    const chartConfig = {
        orders: { label: "Orders", color: "#3B82F6" },
        revenue: { label: "Revenue", color: "#10B981" },
        completed: { label: "Completed", color: "#F59E0B" },
    };

    const exportReport = () => {
        const reportData = {
            period: `${startDate.toLocaleDateString(
                "id-ID"
            )} - ${endDate.toLocaleDateString("id-ID")}`,
            overallStats,
            dailyOrdersData,
            orderStatusData,
            serviceTypeData,
            courierPerformanceData,
            expenseCategoriesData,
            generatedAt: new Date().toISOString(),
        };

        const dataStr = JSON.stringify(reportData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `rayo-kurir-report-${new Date().toISOString().split("T")[0]}.json`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-rayo-dark">
                        Laporan & Statistik
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Analisis performa bisnis kurir
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="flex-1 sm:flex-none px-3 py-2 border border-gray-200 rounded-lg text-sm min-w-0 bg-white"
                        >
                            <option value="7">7 Hari Terakhir</option>
                            <option value="30">30 Hari Terakhir</option>
                            <option value="90">90 Hari Terakhir</option>
                        </select>
                    </div>
                    <Button
                        onClick={exportReport}
                        variant="outline"
                        className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 h-10"
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8 gap-3 sm:gap-4">
                <Card className="col-span-1 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                <Package className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-600 truncate">
                                    Total Orders
                                </p>
                                <p className="text-xl font-bold text-blue-600">
                                    {overallStats.totalOrders}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-600 truncate">
                                    Completion Rate
                                </p>
                                <p className="text-xl font-bold text-green-600">
                                    {overallStats.completionRate.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rayo-primary/10 rounded-lg flex-shrink-0">
                                <DollarSign className="h-5 w-5 text-rayo-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-600 truncate">
                                    Revenue
                                </p>
                                <p className="text-lg font-bold text-rayo-primary truncate">
                                    {formatCurrency(overallStats.totalRevenue)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                                <TrendingDown className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-600 truncate">
                                    Expenses
                                </p>
                                <p className="text-lg font-bold text-red-600 truncate">
                                    {formatCurrency(overallStats.totalExpenses)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div
                                className={`p-2 rounded-lg flex-shrink-0 ${
                                    overallStats.profit >= 0
                                        ? "bg-green-100"
                                        : "bg-red-100"
                                }`}
                            >
                                {overallStats.profit >= 0 ? (
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                ) : (
                                    <TrendingDown className="h-5 w-5 text-red-600" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-600 truncate">
                                    Profit
                                </p>
                                <p
                                    className={`text-lg font-bold truncate ${
                                        overallStats.profit >= 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                    }`}
                                >
                                    {formatCurrency(overallStats.profit)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                                <Users className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-600 truncate">
                                    Active Couriers
                                </p>
                                <p className="text-xl font-bold text-purple-600">
                                    {overallStats.activeCouriers}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-600 truncate">
                                    Online Now
                                </p>
                                <p className="text-xl font-bold text-blue-600">
                                    {overallStats.onlineCouriers}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                                <FileText className="h-5 w-5 text-orange-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-600 truncate">
                                    Total Contacts
                                </p>
                                <p className="text-xl font-bold text-orange-600">
                                    {overallStats.totalContacts}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Daily Orders Trend */}
                <Card className="col-span-1 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="h-5 w-5 flex-shrink-0" />
                            <span className="truncate">Tren Order Harian</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <ChartContainer
                            config={chartConfig}
                            className="h-[280px] w-full"
                        >
                            <LineChart
                                data={dailyOrdersData}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    fontSize={12}
                                    tick={{ fontSize: 12 }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis fontSize={12} tick={{ fontSize: 12 }} />
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="orders"
                                    stroke="var(--color-orders)"
                                    strokeWidth={2}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="completed"
                                    stroke="var(--color-completed)"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Order Status Distribution */}
                <Card className="col-span-1 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">
                            Distribusi Status Order
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <ChartContainer
                            config={chartConfig}
                            className="h-[280px] w-full"
                        >
                            <PieChart
                                margin={{
                                    top: 5,
                                    right: 5,
                                    left: 5,
                                    bottom: 5,
                                }}
                            >
                                <Pie
                                    data={orderStatusData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={90}
                                    dataKey="value"
                                    label={({ name, percent }) =>
                                        `${name} ${(percent * 100).toFixed(0)}%`
                                    }
                                    labelLine={false}
                                >
                                    {orderStatusData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                        />
                                    ))}
                                </Pie>
                                <ChartTooltip />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Service Type Distribution */}
                <Card className="col-span-1 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">
                            Distribusi Jenis Layanan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <ChartContainer
                            config={chartConfig}
                            className="h-[280px] w-full"
                        >
                            <PieChart
                                margin={{
                                    top: 5,
                                    right: 5,
                                    left: 5,
                                    bottom: 5,
                                }}
                            >
                                <Pie
                                    data={serviceTypeData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={90}
                                    dataKey="value"
                                    label={({ name, percent }) =>
                                        `${name} ${(percent * 100).toFixed(0)}%`
                                    }
                                    labelLine={false}
                                >
                                    {serviceTypeData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                        />
                                    ))}
                                </Pie>
                                <ChartTooltip />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Daily Revenue */}
                <Card className="col-span-1 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">
                            Pendapatan Harian
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <ChartContainer
                            config={chartConfig}
                            className="h-[280px] w-full"
                        >
                            <BarChart
                                data={dailyOrdersData}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    fontSize={12}
                                    tick={{ fontSize: 12 }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis fontSize={12} tick={{ fontSize: 12 }} />
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                    formatter={(value) => [
                                        formatCurrency(Number(value)),
                                        "Revenue",
                                    ]}
                                />
                                <Bar
                                    dataKey="revenue"
                                    fill="var(--color-revenue)"
                                />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Performa Kurir</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="overflow-x-auto -mx-4 sm:-mx-6">
                        <div className="inline-block min-w-full align-middle">
                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                                                Kurir
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                                                Total Orders
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                                                Completed
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                                                Rate
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                                                Revenue
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                                                COD
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {courierPerformanceData.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Users className="h-8 w-8 text-gray-300" />
                                                        <p>
                                                            Tidak ada data kurir
                                                            untuk periode ini
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            courierPerformanceData
                                                .sort(
                                                    (a, b) =>
                                                        b.orders - a.orders
                                                )
                                                .map((courier) => (
                                                    <tr
                                                        key={courier.name}
                                                        className="hover:bg-gray-50 transition-colors"
                                                    >
                                                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                                            <div
                                                                className="truncate max-w-[120px]"
                                                                title={
                                                                    courier.name
                                                                }
                                                            >
                                                                {courier.name}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                                                            {courier.orders}
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-green-600 font-medium">
                                                            {courier.completed}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <Badge
                                                                variant={
                                                                    courier.completionRate >=
                                                                    80
                                                                        ? "default"
                                                                        : courier.completionRate >=
                                                                          60
                                                                        ? "secondary"
                                                                        : "destructive"
                                                                }
                                                                className="text-xs font-medium"
                                                            >
                                                                {courier.completionRate.toFixed(
                                                                    1
                                                                )}
                                                                %
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                                            <div
                                                                className="truncate max-w-[100px]"
                                                                title={formatCurrency(
                                                                    courier.revenue
                                                                )}
                                                            >
                                                                {formatCurrency(
                                                                    courier.revenue
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-blue-600 font-medium">
                                                            <div
                                                                className="truncate max-w-[100px]"
                                                                title={formatCurrency(
                                                                    courier.codDeposited
                                                                )}
                                                            >
                                                                {formatCurrency(
                                                                    courier.codDeposited
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {expenseCategoriesData.length > 0 && (
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">
                            Kategori Pengeluaran
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {expenseCategoriesData.map((category) => (
                                <div
                                    key={category.name}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors hover:shadow-sm"
                                >
                                    <div className="min-w-0 flex-1 mr-4">
                                        <p
                                            className="font-medium text-base truncate"
                                            title={category.name}
                                        >
                                            {category.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {(
                                                (category.value /
                                                    overallStats.totalExpenses) *
                                                100
                                            ).toFixed(1)}
                                            % dari total
                                        </p>
                                    </div>
                                    <p
                                        className="font-bold text-red-600 text-base flex-shrink-0"
                                        title={formatCurrency(category.value)}
                                    >
                                        {formatCurrency(category.value)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
