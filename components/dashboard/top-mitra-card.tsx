"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Order } from "@/lib/auth"
import { Store, User } from "lucide-react"

interface TopMitraCardProps {
    orders: Order[]
}

export function TopMitraCard({ orders }: TopMitraCardProps) {
    const topMitra = useMemo(() => {
        // Only count completed orders
        const completedOrders = orders.filter(
            o => o.status === "SELESAI" || o.status === "DELIVERED"
        )

        const counts: Record<string, number> = {}

        completedOrders.forEach(order => {
            const name = order.pengirim.nama
            counts[name] = (counts[name] || 0) + 1
        })

        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
    }, [orders])

    // Calculate total completed orders for percentage
    const totalCompleted = orders.filter(
        o => o.status === "SELESAI" || o.status === "DELIVERED"
    ).length

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">
                    Top Customer/Mitra
                </CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {topMitra.map((mitra, index) => (
                        <div key={index} className="flex items-center">
                            <div className={`mr-4 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border ${index === 0 ? 'bg-yellow-100 border-yellow-200' : 'bg-secondary'}`}>
                                {index === 0 ? '👑' : <User className="h-4 w-4 text-muted-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0 mr-4">
                                <p className="text-sm font-medium leading-none truncate" title={mitra.name}>
                                    {mitra.name}
                                </p>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {totalCompleted > 0 ? Math.round((mitra.count / totalCompleted) * 100) : 0}% dari total
                                </div>
                            </div>
                            <div className="font-bold whitespace-nowrap">
                                {mitra.count} Order
                            </div>
                        </div>
                    ))}
                    {topMitra.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            Belum ada data pelanggan
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
