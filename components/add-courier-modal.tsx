"use client";

import type React from "react";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCouriers, saveCourier, generateId, type Courier } from "@/lib/auth";

interface AddCourierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCourierAdded: () => void;
}

export function AddCourierModal({
    isOpen,
    onClose,
    onCourierAdded,
}: AddCourierModalProps) {
    const [formData, setFormData] = useState({
        nama: "",
        wa: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setFormData({
            nama: "",
            wa: "",
        });
        setErrors({});
    };

    const validateForm = async () => {
        const newErrors: Record<string, string> = {};

        if (!formData.nama.trim()) {
            newErrors.nama = "Nama kurir wajib diisi";
        }

        if (!formData.wa.trim()) {
            newErrors.wa = "Nomor WhatsApp wajib diisi";
        } else if (
            !/^(2|62|0)[0-9]{9,13}$/.test(formData.wa.replace(/\s/g, ""))
        ) {
            newErrors.wa = "Format nomor WhatsApp tidak valid";
        }

        // Check if courier with same name or WA already exists
        const existingCouriers = await getCouriers();
        if (
            existingCouriers.some(
                (courier) =>
                    courier.nama.toLowerCase() ===
                    formData.nama.toLowerCase().trim()
            )
        ) {
            newErrors.nama = "Kurir dengan nama ini sudah ada";
        }
        if (
            existingCouriers.some(
                (courier) => courier.wa === formData.wa.trim()
            )
        ) {
            newErrors.wa = "Nomor WhatsApp ini sudah terdaftar";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!(await validateForm())) return;

        setIsSubmitting(true);

        try {
            const newCourier: Courier = {
                id: generateId(),
                nama: formData.nama.trim(),
                wa: formData.wa.trim(),
                aktif: true,
                online: false,
            };

            await saveCourier(newCourier);

            resetForm();
            onCourierAdded();
        } catch (error) {
            console.error("Error adding courier:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Tambah Kurir Baru</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="nama">
                            Nama Kurir <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="nama"
                            value={formData.nama}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    nama: e.target.value,
                                })
                            }
                            placeholder="Masukkan nama kurir"
                        />
                        {errors.nama && (
                            <p className="text-sm text-red-500">
                                {errors.nama}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="wa">
                            Nomor WhatsApp{" "}
                            <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="wa"
                            value={formData.wa}
                            onChange={(e) =>
                                setFormData({ ...formData, wa: e.target.value })
                            }
                            placeholder="08xxxxxxxxxx"
                        />
                        {errors.wa && (
                            <p className="text-sm text-red-500">{errors.wa}</p>
                        )}
                    </div>

                    <div className="text-sm text-muted-foreground p-3 bg-blue-50 rounded-lg">
                        <p className="font-medium mb-1">Catatan:</p>
                        <p>
                            Kurir baru akan otomatis berstatus aktif dan dapat
                            menerima order
                        </p>
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
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-rayo-primary hover:bg-rayo-dark"
                        >
                            {isSubmitting ? "Menyimpan..." : "Tambah Kurir"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
