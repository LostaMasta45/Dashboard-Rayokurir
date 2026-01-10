import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    MapPin,
    User,
    Phone,
    Clock,
    Zap,
    Package,
    CreditCard,
    Calendar,
    StickyNote,
    Truck
} from "lucide-react";
import { formatCurrency, type Order, type Courier } from "@/lib/auth";

interface OrderDetailModalProps {
    order: Order | null;
    couriers: Courier[];
    open: boolean;
    onClose: () => void;
}

export function OrderDetailModal({
    order,
    couriers,
    open,
    onClose,
}: OrderDetailModalProps) {
    if (!order) return null;

    const courier = couriers.find(c => c.id === order.kurirId) || null;

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            BARU: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
            ASSIGNED: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
            PICKUP: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
            DIKIRIM: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200",
            SELESAI: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    const getPriorityBadge = () => {
        switch (order.serviceType) {
            case "Same Day":
                return (
                    <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 gap-1">
                        <Clock className="h-3 w-3" /> Urgent
                    </Badge>
                );
            case "Express":
                return (
                    <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400 gap-1">
                        <Zap className="h-3 w-3" /> Express
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="text-gray-600 border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-400 gap-1">
                        <Package className="h-3 w-3" /> Reguler
                    </Badge>
                );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                Order #{order.id.slice(-6)}
                                <Badge className={`${getStatusColor(order.status)} border-0`}>
                                    {order.status.replace("_", " ")}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className="flex items-center gap-2 text-sm">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(order.createdAt).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </DialogDescription>
                        </div>
                        {getPriorityBadge()}
                    </div>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Route Section */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Rute Pengiriman
                        </h4>
                        <div className="relative pl-6 space-y-6">
                            {/* Line connector */}
                            <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-800" />

                            <div className="relative">
                                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-green-500 bg-background z-10" />
                                <div className="space-y-1">
                                    <span className="text-xs text-green-600 font-medium uppercase tracking-wider">Pickup</span>
                                    <p className="text-sm sm:text-base font-medium leading-normal">{order.pickup.alamat}</p>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-red-500 bg-background z-10" />
                                <div className="space-y-1">
                                    <span className="text-xs text-red-600 font-medium uppercase tracking-wider">Dropoff</span>
                                    <p className="text-sm sm:text-base font-medium leading-normal">{order.dropoff.alamat}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Sender */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <User className="h-4 w-4" /> Informasi Pengirim
                            </h4>
                            <div className="bg-muted/40 p-3 rounded-lg space-y-2">
                                <p className="font-medium">{order.pengirim.nama}</p>
                                {order.pengirim.wa && (
                                    <div className="flex items-center gap-2 text-sm text-blue-600">
                                        <Phone className="h-3.5 w-3.5" />
                                        <a href={`https://wa.me/${order.pengirim.wa}`} target="_blank" rel="noreferrer" className="hover:underline">
                                            {order.pengirim.wa}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Courier */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Truck className="h-4 w-4" /> Informasi Kurir
                            </h4>
                            <div className="bg-muted/40 p-3 rounded-lg h-full">
                                {courier ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                {courier.nama.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{courier.nama}</p>
                                                <Badge variant={courier.online ? "default" : "secondary"} className="text-[10px] h-5">
                                                    {courier.online ? "Online" : "Offline"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground italic flex items-center gap-2 h-full">
                                        Belum ada kurir
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Financials */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CreditCard className="h-4 w-4" /> Rincian Biaya
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 border rounded-lg bg-background">
                                <span className="text-xs text-muted-foreground block mb-1">Ongkos Kirim</span>
                                <span className="font-bold text-lg text-blue-600">{formatCurrency(order.ongkir)}</span>
                            </div>
                            {order.cod.isCOD && (
                                <div className="p-3 border rounded-lg bg-background">
                                    <span className="text-xs text-muted-foreground block mb-1">Nilai COD</span>
                                    <span className="font-bold text-lg text-purple-600">{formatCurrency(order.cod.nominal)}</span>
                                </div>
                            )}
                            {order.danaTalangan > 0 && (
                                <div className="p-3 border rounded-lg bg-background">
                                    <span className="text-xs text-muted-foreground block mb-1">Dana Talangan</span>
                                    <span className="font-bold text-lg text-orange-600">{formatCurrency(order.danaTalangan)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {order.notes && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/50 text-sm">
                            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 font-medium mb-1">
                                <StickyNote className="h-4 w-4" /> Catatan Tambahan
                            </div>
                            <p className="text-yellow-700 dark:text-yellow-300">{order.notes}</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={onClose}>Tutup</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

