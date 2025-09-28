"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Wallet,
    Edit,
    Trash2,
    Truck,
    CreditCard,
    Info,
} from "lucide-react";
import { CODDepositModal } from "@/components/cod-deposit-modal";
import { AddExpenseModal } from "@/components/add-expense-modal";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    getOrders,
    getCouriers,
    getCODHistory,
    getExpenses,
    formatCurrency,
    formatDate,
    type Order,
    type Courier,
    type CODHistory,
    type Expense,
    deleteExpense,
} from "@/lib/auth";

export function KeuanganPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [codHistory, setCodHistory] = useState<CODHistory[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [showCODModal, setShowCODModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [selectedCourier, setSelectedCourier] = useState<Courier | null>(
        null
    );
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    useEffect(() => {
        (async () => {
            await loadData();
        })();
    }, []);

    const loadData = async () => {
        const [ordersData, couriersData, codHistoryData, expensesData] =
            await Promise.all([
                getOrders(),
                getCouriers(),
                getCODHistory(),
                getExpenses(),
            ]);
        setOrders(ordersData);
        setCouriers(couriersData);
        setCodHistory(codHistoryData);
        setExpenses(expensesData);
    };

    const today = new Date().toDateString();
    const todayExpenses = expenses.filter(
        (expense) => expense.tanggal === today
    );
    const todayCODHistory = codHistory.filter(
        (history) => history.tanggal === today
    );

    const financialSummary = {
        // Total Ongkir Today = Non-COD paid today + Ongkir via COD yang disetor today
        totalOngkirToday: (() => {
            const nonCodOngkirToday = orders
                .filter(
                    (order) =>
                        !order.cod.isCOD &&
                        order.nonCodPaid &&
                        order.createdDate === today
                )
                .reduce((sum, order) => sum + (order.ongkir || 0), 0);

            const codOngkirToday = todayCODHistory.reduce((sum, history) => {
                const order = orders.find((o) => o.id === history.orderId);
                return sum + (order?.ongkir || 0);
            }, 0);

            return nonCodOngkirToday + codOngkirToday;
        })(),

        // Non-COD Today = hanya ongkir NON_COD paid today
        nonCodPaidToday: orders
            .filter(
                (order) =>
                    !order.cod.isCOD &&
                    order.nonCodPaid &&
                    order.createdDate === today
            )
            .reduce((sum, order) => sum + (order.ongkir || 0), 0),

        // COD Outstanding = (codNominal + ongkir via COD) untuk order SELESAI tapi belum disetor
        codOutstanding: (() => {
            const completedCodOrders = orders.filter(
                (order) =>
                    order.cod.isCOD &&
                    order.status === "SELESAI" &&
                    !order.cod.codPaid
            );
            return completedCodOrders.reduce(
                (sum, order) => sum + order.cod.nominal + (order.ongkir || 0),
                0
            );
        })(),

        // COD Paid Today = total nominal CODSettlement created today
        codPaidToday: todayCODHistory.reduce((sum, history) => {
            const order = orders.find((o) => o.id === history.orderId);
            return sum + history.nominal + (order?.ongkir || 0);
        }, 0),

        // Dana Talangan Outstanding = talangan belum diganti
        danaTalanganOutstanding: orders
            .filter(
                (order) => order.danaTalangan > 0 && order.status !== "SELESAI"
            )
            .reduce((sum, order) => sum + order.danaTalangan, 0),

        // Dana Talangan Diganti Today = talangan diganti hari ini
        danaTalanganDiganti: orders
            .filter(
                (order) =>
                    order.danaTalangan > 0 &&
                    order.talanganReimbursed &&
                    order.createdDate === today
            )
            .reduce((sum, order) => sum + order.danaTalangan, 0),

        // Biaya Harian = total expenses hari ini
        dailyExpenses: todayExpenses.reduce(
            (sum, expense) => sum + expense.nominal,
            0
        ),
    };

    // Profit Hari Ini = Total Ongkir Hari Ini – Biaya Harian (jangan campur COD/Talangan)
    financialSummary.profit =
        financialSummary.totalOngkirToday - financialSummary.dailyExpenses;

    const getCODPerCourier = () => {
        const courierData: Record<
            string,
            {
                courier: Courier;
                orders: Order[];
                totalOngkir: number;
                totalCOD: number;
                totalDanaTalangan: number;
                depositedCOD: number;
                danaTalanganDiganti: number;
                outstandingCOD: number;
                outstandingTalangan: number;
            }
        > = {};

        couriers.forEach((courier) => {
            const courierOrders = orders.filter(
                (order) => order.kurirId === courier.id
            );
            const totalOngkir = courierOrders.reduce(
                (sum, order) => sum + (order.ongkir || 0),
                0
            );
            const totalCOD = courierOrders
                .filter((order) => order.cod.isCOD)
                .reduce((sum, order) => sum + order.cod.nominal, 0);
            const totalDanaTalangan = courierOrders.reduce(
                (sum, order) => sum + (order.danaTalangan || 0),
                0
            );

            const depositedCOD = codHistory
                .filter((history) => history.kurirId === courier.id)
                .reduce((sum, history) => sum + history.nominal, 0);

            const danaTalanganDiganti = courierOrders
                .filter(
                    (order) =>
                        order.talanganReimbursed && order.danaTalangan > 0
                )
                .reduce((sum, order) => sum + order.danaTalangan, 0);

            const outstandingCOD = courierOrders
                .filter(
                    (order) =>
                        order.cod.isCOD &&
                        order.status === "SELESAI" &&
                        !order.cod.codPaid
                )
                .reduce(
                    (sum, order) =>
                        sum + order.cod.nominal + (order.ongkir || 0),
                    0
                );

            const outstandingTalangan = courierOrders
                .filter(
                    (order) =>
                        order.danaTalangan > 0 && !order.talanganReimbursed
                )
                .reduce((sum, order) => sum + order.danaTalangan, 0);

            if (courierOrders.length > 0) {
                courierData[courier.id] = {
                    courier,
                    orders: courierOrders,
                    totalOngkir,
                    totalCOD,
                    totalDanaTalangan,
                    depositedCOD,
                    danaTalanganDiganti,
                    outstandingCOD,
                    outstandingTalangan,
                };
            }
        });

        return Object.values(courierData);
    };

    const handleCODDeposit = (courier: Courier) => {
        setSelectedCourier(courier);
        setShowCODModal(true);
    };

    const handleEditExpense = (expense: Expense) => {
        setEditingExpense(expense);
        setShowExpenseModal(true);
    };

    const handleDeleteExpense = async (expenseId: string) => {
        if (confirm("Apakah Anda yakin ingin menghapus biaya ini?")) {
            await deleteExpense(expenseId);
            setExpenses(expenses.filter((expense) => expense.id !== expenseId));
        }
    };

    const handleExpenseModalClose = () => {
        setShowExpenseModal(false);
        setEditingExpense(null);
    };

    const handleMarkTalanganReimbursed = (courierId: string) => {
        const updatedOrders = orders.map((order) => {
            if (
                order.kurirId === courierId &&
                order.danaTalangan > 0 &&
                !order.talanganReimbursed
            ) {
                return { ...order, talanganReimbursed: true };
            }
            return order;
        });
        setOrders(updatedOrders);
        // Assuming there's a function to save orders
        saveOrders(updatedOrders);
    };

    const courierData = getCODPerCourier();

    return (
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-rayo-dark">
                        Keuangan
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Kelola keuangan dan COD
                    </p>
                </div>
                <Button
                    onClick={() => setShowExpenseModal(true)}
                    className="bg-rayo-primary hover:bg-rayo-dark w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="text-sm sm:text-base">Tambah Biaya</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3 sm:gap-4">
                <Card className="p-3 sm:p-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                        <CardTitle className="text-xs sm:text-sm font-medium leading-tight flex items-center gap-1">
                            Total Ongkir Hari Ini
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3 w-3 text-muted-foreground cursor-help flex-shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            Non-COD dibayar hari ini + Ongkir
                                            via COD yang disetor hari ini
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </CardTitle>
                        <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="p-0 pt-2">
                        <div className="text-lg sm:text-xl xl:text-2xl font-bold text-blue-600">
                            {formatCurrency(financialSummary.totalOngkirToday)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Biaya jasa antar
                        </p>
                    </CardContent>
                </Card>

                <Card className="p-3 sm:p-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                        <CardTitle className="text-xs sm:text-sm font-medium leading-tight flex items-center gap-1">
                            Dana Talangan
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3 w-3 text-muted-foreground cursor-help flex-shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            Uang kurir yang belum diganti + yang
                                            sudah diganti hari ini
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </CardTitle>
                        <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="p-0 pt-2">
                        <div className="text-lg sm:text-xl xl:text-2xl font-bold text-orange-600">
                            {formatCurrency(
                                financialSummary.danaTalanganOutstanding
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Outstanding
                        </p>
                        <p className="text-xs text-green-600">
                            Diganti Hari Ini:{" "}
                            {formatCurrency(
                                financialSummary.danaTalanganDiganti
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card className="p-3 sm:p-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                        <CardTitle className="text-xs sm:text-sm font-medium leading-tight flex items-center gap-1">
                            COD Outstanding
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3 w-3 text-muted-foreground cursor-help flex-shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            COD + ongkir via COD untuk order
                                            selesai yang belum disetor
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </CardTitle>
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="p-0 pt-2">
                        <div className="text-lg sm:text-xl xl:text-2xl font-bold text-red-600">
                            {formatCurrency(financialSummary.codOutstanding)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Belum disetor
                        </p>
                    </CardContent>
                </Card>

                <Card className="p-3 sm:p-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                        <CardTitle className="text-xs sm:text-sm font-medium leading-tight flex items-center gap-1">
                            COD Paid Today
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3 w-3 text-muted-foreground cursor-help flex-shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            Total COD + ongkir via COD yang
                                            disetor hari ini
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </CardTitle>
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="p-0 pt-2">
                        <div className="text-lg sm:text-xl xl:text-2xl font-bold text-green-600">
                            {formatCurrency(financialSummary.codPaidToday)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Disetor hari ini
                        </p>
                    </CardContent>
                </Card>

                <Card className="p-3 sm:p-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                        <CardTitle className="text-xs sm:text-sm font-medium leading-tight flex items-center gap-1">
                            Non-COD
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3 w-3 text-muted-foreground cursor-help flex-shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            Ongkir yang dibayar langsung (bukan
                                            via COD) hari ini
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </CardTitle>
                        <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="p-0 pt-2">
                        <div className="text-lg sm:text-xl xl:text-2xl font-bold text-blue-600">
                            {formatCurrency(financialSummary.nonCodPaidToday)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Non-COD hari ini
                        </p>
                    </CardContent>
                </Card>

                <Card className="p-3 sm:p-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                        <CardTitle className="text-xs sm:text-sm font-medium leading-tight flex items-center gap-1">
                            Biaya Harian
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3 w-3 text-muted-foreground cursor-help flex-shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            Total pengeluaran operasional hari
                                            ini
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </CardTitle>
                        <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="p-0 pt-2">
                        <div className="text-lg sm:text-xl xl:text-2xl font-bold text-orange-600">
                            {formatCurrency(financialSummary.dailyExpenses)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Pengeluaran hari ini
                        </p>
                    </CardContent>
                </Card>

                <Card className="p-3 sm:p-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                        <CardTitle className="text-xs sm:text-sm font-medium leading-tight flex items-center gap-1">
                            Profit Hari Ini
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3 w-3 text-muted-foreground cursor-help flex-shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            Total Ongkir Hari Ini - Biaya Harian
                                            (tidak termasuk COD/Talangan)
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </CardTitle>
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-rayo-primary flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="p-0 pt-2">
                        <div
                            className={`text-lg sm:text-xl xl:text-2xl font-bold ${
                                financialSummary.profit >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                            }`}
                        >
                            {formatCurrency(financialSummary.profit)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Keuntungan bersih
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">
                        Performance per Kurir
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Kurir
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Ongkir
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        COD
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Dana Talangan
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Status COD
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Status Talangan
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {courierData.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            Belum ada data kurir
                                        </td>
                                    </tr>
                                ) : (
                                    courierData.map(
                                        ({
                                            courier,
                                            totalOngkir,
                                            totalCOD,
                                            totalDanaTalangan,
                                            depositedCOD,
                                            danaTalanganDiganti,
                                            outstandingCOD,
                                            outstandingTalangan,
                                        }) => {
                                            return (
                                                <tr
                                                    key={courier.id}
                                                    className="border-b hover:bg-muted/50"
                                                >
                                                    <td className="py-3 px-3 sm:px-4">
                                                        <div>
                                                            <div className="font-medium text-sm">
                                                                {courier.nama}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {courier.wa}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3 sm:px-4 font-medium text-sm text-blue-600">
                                                        {formatCurrency(
                                                            totalOngkir
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 sm:px-4 font-medium text-sm">
                                                        {formatCurrency(
                                                            totalCOD
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 sm:px-4 font-medium text-sm text-orange-600">
                                                        {formatCurrency(
                                                            totalDanaTalangan
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 sm:px-4 text-sm">
                                                        <div className="space-y-1">
                                                            <div className="text-green-600">
                                                                Disetor:{" "}
                                                                {formatCurrency(
                                                                    depositedCOD
                                                                )}
                                                            </div>
                                                            <div
                                                                className={
                                                                    outstandingCOD >
                                                                    0
                                                                        ? "text-red-600 font-medium"
                                                                        : "text-green-600"
                                                                }
                                                            >
                                                                Outstanding:{" "}
                                                                {formatCurrency(
                                                                    outstandingCOD
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3 sm:px-4 text-sm">
                                                        <div className="space-y-1">
                                                            <div className="text-green-600">
                                                                Diganti:{" "}
                                                                {formatCurrency(
                                                                    danaTalanganDiganti
                                                                )}
                                                            </div>
                                                            <div
                                                                className={
                                                                    outstandingTalangan >
                                                                    0
                                                                        ? "text-orange-600 font-medium"
                                                                        : "text-green-600"
                                                                }
                                                            >
                                                                Outstanding:{" "}
                                                                {formatCurrency(
                                                                    outstandingTalangan
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3 sm:px-4">
                                                        <div className="flex flex-col sm:flex-row gap-2">
                                                            {outstandingCOD >
                                                                0 && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleCODDeposit(
                                                                            courier
                                                                        )
                                                                    }
                                                                    className="bg-rayo-primary hover:bg-rayo-dark text-xs h-8 px-3"
                                                                >
                                                                    Setor COD
                                                                </Button>
                                                            )}
                                                            {outstandingTalangan >
                                                                0 && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        handleMarkTalanganReimbursed(
                                                                            courier.id
                                                                        )
                                                                    }
                                                                    className="text-xs bg-orange-50 hover:bg-orange-100 h-8 px-3"
                                                                >
                                                                    Talangan
                                                                    Diganti
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">
                        Histori Setoran COD
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Tanggal
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Kurir
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Order
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Nominal
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Bukti
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {codHistory.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            Belum ada histori setoran COD.
                                            Setoran akan muncul di sini setelah
                                            kurir menyetor COD.
                                        </td>
                                    </tr>
                                ) : (
                                    codHistory
                                        .slice()
                                        .reverse()
                                        .map((history) => {
                                            const courier = couriers.find(
                                                (c) => c.id === history.kurirId
                                            );
                                            const order = orders.find(
                                                (o) => o.id === history.orderId
                                            );
                                            return (
                                                <tr
                                                    key={history.id}
                                                    className="border-b hover:bg-muted/50"
                                                >
                                                    <td className="py-3 px-3 sm:px-4 text-sm">
                                                        {formatDate(
                                                            history.tanggal
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 sm:px-4 text-sm">
                                                        {courier?.nama || "-"}
                                                    </td>
                                                    <td className="py-3 px-3 sm:px-4 font-mono text-xs">
                                                        #
                                                        {history.orderId.slice(
                                                            -6
                                                        )}
                                                        {order && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {
                                                                    order
                                                                        .pengirim
                                                                        .nama
                                                                }
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 sm:px-4 font-medium text-sm">
                                                        {formatCurrency(
                                                            history.nominal
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 sm:px-4">
                                                        {history.buktiUrl ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                Ada Bukti
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">
                                                                -
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">
                        Biaya Operasional
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Tanggal
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Kategori
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Deskripsi
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Nominal
                                    </th>
                                    <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            Belum ada biaya operasional. Klik
                                            'Tambah Biaya' untuk mencatat
                                            pengeluaran.
                                        </td>
                                    </tr>
                                ) : (
                                    expenses
                                        .slice()
                                        .reverse()
                                        .map((expense) => (
                                            <tr
                                                key={expense.id}
                                                className="border-b hover:bg-muted/50"
                                            >
                                                <td className="py-3 px-3 sm:px-4 text-sm">
                                                    {formatDate(
                                                        expense.tanggal
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 sm:px-4">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {expense.kategori}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-3 sm:px-4 text-sm">
                                                    {expense.deskripsi}
                                                </td>
                                                <td className="py-3 px-3 sm:px-4 font-medium text-sm">
                                                    {formatCurrency(
                                                        expense.nominal
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 sm:px-4">
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleEditExpense(
                                                                    expense
                                                                )
                                                            }
                                                            className="text-blue-600 hover:text-blue-700 p-1 h-8 w-8"
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleDeleteExpense(
                                                                    expense.id
                                                                )
                                                            }
                                                            className="text-red-600 hover:text-red-700 p-1 h-8 w-8"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <CODDepositModal
                isOpen={showCODModal}
                onClose={() => setShowCODModal(false)}
                courier={selectedCourier}
                onDeposited={() => {
                    loadData();
                    setShowCODModal(false);
                }}
            />

            <AddExpenseModal
                isOpen={showExpenseModal}
                onClose={handleExpenseModalClose}
                editingExpense={editingExpense}
                onExpenseAdded={() => {
                    loadData();
                    handleExpenseModalClose();
                }}
            />
        </div>
    );
}

function saveOrders(updatedOrders: Order[]) {
    // Implementation to save orders
}
