"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateOrder, type Order, type Courier } from "@/lib/auth";

interface AssignCourierModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    couriers: Courier[];
    onAssigned: () => void;
}

export function AssignCourierModal({
    isOpen,
    onClose,
    order,
    couriers,
    onAssigned,
}: AssignCourierModalProps) {
    const [selectedCourierId, setSelectedCourierId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const activeCouriers = couriers.filter((courier) => courier.aktif);

    const handleSubmit = async () => {
        if (!order || !selectedCourierId) return;

        setIsSubmitting(true);

        try {
            // Update order di Supabase
            const updated = { ...order, kurirId: selectedCourierId };
            await updateOrder(updated);
            onAssigned();
        } catch (error) {
            console.error("Error assigning courier:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedCourierId("");
        onClose();
    };

    if (!order) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign Kurir</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Order Details</h4>
                        <p className="text-sm text-muted-foreground">
                            ID: #{order.id.slice(-6)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Pengirim: {order.pengirim.nama}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Tujuan: {order.dropoff.alamat}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Pilih Kurir
                        </label>
                        <Select
                            value={selectedCourierId}
                            onValueChange={setSelectedCourierId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih kurir..." />
                            </SelectTrigger>
                            <SelectContent>
                                {activeCouriers.map((courier) => (
                                    <SelectItem
                                        key={courier.id}
                                        value={courier.id}
                                    >
                                        {courier.nama} - {courier.wa}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1 bg-transparent"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!selectedCourierId || isSubmitting}
                            className="flex-1 bg-rayo-primary hover:bg-rayo-dark"
                        >
                            {isSubmitting ? "Menyimpan..." : "Assign Kurir"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
