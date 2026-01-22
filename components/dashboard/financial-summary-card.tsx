"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Order, formatCurrency } from "@/lib/auth"
import { DollarSign, Wallet, ArrowUpRight, AlertCircle } from "lucide-react"

interface FinancialSummaryCardProps {
    orders: Order[]
}

export function FinancialSummaryCard({ orders }: FinancialSummaryCardProps) {
    // 1. Revenue Today (Ongkir from completed orders today)
    const todayStr = new Date().toDateString()
    const revenueToday = orders
        .filter(o =>
            (o.status === "SELESAI" || o.status === "DELIVERED") &&
            new Date(o.createdAt).toDateString() === todayStr
        )
        .reduce((sum, o) => sum + (o.ongkir || 0), 0)

    // 2. Talangan Outstanding (Completed orders, has talangan, not reimbursed)
    const talanganOutstanding = orders
        .filter(o =>
            (o.status === "SELESAI" || o.status === "DELIVERED") &&
            o.danaTalangan > 0 &&
            !o.talanganReimbursed
        )
        .reduce((sum, o) => sum + o.danaTalangan, 0)

    // 3. COD Held by Couriers (Completed orders, is COD, not paid/settled)
    const codHeld = orders
        .filter(o =>
            (o.status === "SELESAI" || o.status === "DELIVERED") &&
            o.cod?.isCOD &&
            !o.cod?.codPaid
        )
        .reduce((sum, o) => sum + (o.cod?.nominal || 0), 0)

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                        Pendapatan Ongkir Hari Ini
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {formatCurrency(revenueToday)}
                    </div>
                    <p className="text-xs text-green-600/80 mt-1">
                        Pemasukan bersih dari pengiriman
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                        Uang COD di Kurir
                    </CardTitle>
                    <Wallet className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {formatCurrency(codHeld)}
                    </div>
                    <p className="text-xs text-blue-600/80 mt-1">
                        Aset tunai yang dipegang kurir
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">
                        Talangan Belum Diganti
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                        {formatCurrency(talanganOutstanding)}
                    </div>
                    <p className="text-xs text-orange-600/80 mt-1">
                        Uang kurir yang perlu direimburse
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
