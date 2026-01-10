"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, updateOrder, type Order } from "@/lib/auth";
import { toast } from "sonner";
import { CheckCircle, Banknote } from "lucide-react";

interface CourierTalanganModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    onConfirmed: () => void;
}

export function CourierTalanganModal({
    isOpen,
    onClose,
    order,
    onConfirmed,
}: CourierTalanganModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        if (!order) return;

        setIsSubmitting(true);
        try {
            await updateOrder({ ...order, talanganReimbursed: true });
            toast.success(`Talangan ${formatCurrency(order.danaTalangan)} berhasil dikonfirmasi!`);
            onConfirmed();
            onClose();
        } catch (error) {
            console.error("Error confirming talangan:", error);
            toast.error("Gagal konfirmasi talangan");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!order) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-orange-500" />
                        Konfirmasi Talangan
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <p className="text-sm text-muted-foreground mb-2">
                            Order #{order.id.slice(-6)}
                        </p>
                        <p className="text-sm font-medium">
                            Pengirim: {order.pengirim.nama}
                        </p>
                        <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-700">
                            <p className="text-sm text-muted-foreground">Dana Talangan</p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {formatCurrency(order.danaTalangan)}
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground text-center">
                        Konfirmasi bahwa dana talangan sudah dikembalikan oleh penerima?
                    </p>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={isSubmitting}
                            className="flex-1 bg-orange-500 hover:bg-orange-600"
                        >
                            {isSubmitting ? (
                                "Menyimpan..."
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Sudah Diganti
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
