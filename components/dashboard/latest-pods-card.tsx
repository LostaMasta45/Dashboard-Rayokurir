"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Order } from "@/lib/auth"
import { Image as ImageIcon, ExternalLink } from "lucide-react"

interface LatestPODsCardProps {
    orders: Order[]
}

export function LatestPODsCard({ orders }: LatestPODsCardProps) {
    const latestPhotos = useMemo(() => {
        // Flatten all POD photos from all completed orders
        const allPhotos: Array<{
            url: string,
            orderId: string,
            customerName: string,
            uploadedAt: string,
            fileId?: string
        }> = []

        orders.forEach(order => {
            if (order.podPhotos && order.podPhotos.length > 0) {
                order.podPhotos.forEach(photo => {
                    // Handle both legacy string format and new object format
                    const photoObj = typeof photo === 'string'
                        ? { url: photo, uploadedAt: order.createdAt } // Legacy fallback
                        : photo

                    allPhotos.push({
                        url: photoObj.url || (typeof photo === 'string' ? photo : ''),
                        fileId: typeof photo !== 'string' ? photoObj.fileId : undefined,
                        orderId: order.id,
                        customerName: order.pengirim.nama,
                        uploadedAt: photoObj.uploadedAt || order.createdAt
                    })
                })
            }
        })

        // Sort by uploadedAt desc and take top 8
        return allPhotos
            .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
            .slice(0, 8)
    }, [orders])

    const getPhotoUrl = (photo: { url: string, fileId?: string }) => {
        if (photo.url && photo.url.startsWith("http")) return photo.url
        // If not http, assume it's a fileId
        const id = photo.fileId || photo.url
        return `/api/telegram/image?fileId=${id}`
    }

    if (latestPhotos.length === 0) return null

    return (
        <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg sm:text-xl">
                    Bukti Pengiriman Terbaru
                </CardTitle>
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {latestPhotos.map((photo, idx) => (
                        <div
                            key={`${photo.orderId}-${idx}`}
                            className="group relative aspect-square rounded-md overflow-hidden border bg-muted"
                        >
                            <img
                                src={getPhotoUrl(photo)}
                                alt={`POD ${photo.customerName}`}
                                className="object-cover w-full h-full transition-transform hover:scale-105"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center text-white text-xs">
                                <p className="font-medium truncate w-full">{photo.customerName}</p>
                                <p className="opacity-80">#{photo.orderId.slice(-4)}</p>
                                <p className="mt-1 opacity-60 text-[10px]">
                                    {new Date(photo.uploadedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
