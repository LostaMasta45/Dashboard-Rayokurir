"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { type Order } from "@/lib/auth"
import { Info } from "lucide-react"

interface OrderTrendChartProps {
    orders: Order[]
}

export function OrderTrendChart({ orders }: OrderTrendChartProps) {
    const chartData = useMemo(() => {
        const last7Days = new Array(7).fill(0).map((_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (6 - i))
            d.setHours(0, 0, 0, 0)
            return d
        })

        return last7Days.map(date => {
            const dateStr = date.toLocaleDateString("id-ID", {
                weekday: 'short',
                day: 'numeric'
            })

            // Count orders for this date
            const count = orders.filter(order => {
                const orderDate = new Date(order.createdAt)
                return orderDate.toDateString() === date.toDateString() &&
                    (order.status === "SELESAI" || order.status === "DELIVERED")
            }).length

            return {
                name: dateStr,
                total: count
            }
        })
    }, [orders])

    // Calculate growth trend (Today vs Yesterday)
    const todayCount = chartData[6].total
    const yesterdayCount = chartData[5].total
    const growth = yesterdayCount > 0
        ? ((todayCount - yesterdayCount) / yesterdayCount) * 100
        : todayCount > 0 ? 100 : 0

    return (
        <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">Tren Order Mingguan</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Performa 7 hari terakhir
                    </p>
                </div>
                {todayCount > 0 && (
                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${growth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {growth > 0 ? '+' : ''}{Math.round(growth)}% vs Kemarin
                    </div>
                )}
            </CardHeader>
            <CardContent className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#8884d8"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
