"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getCouriers, updateCourier, type Courier } from "@/lib/auth";

interface EditCourierModalProps {
    isOpen: boolean;
    onClose: () => void;
    courier: Courier | null;
    onCourierUpdated: () => void;
}

export function EditCourierModal({
    isOpen,
    onClose,
    courier,
    onCourierUpdated,
}: EditCourierModalProps) {
    const [formData, setFormData] = useState({
        nama: "",
        wa: "",
        aktif: true,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (courier && isOpen) {
            setFormData({
                nama: courier.nama,
                wa: courier.wa,
                aktif: courier.aktif,
            });
        }
    }, [courier, isOpen]);

    const resetForm = () => {
        setFormData({
            nama: "",
            wa: "",
            aktif: true,
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

        // Check if courier with same name or WA already exists (excluding current courier)
        const existingCouriers = await getCouriers();
        if (
            existingCouriers.some(
                (c) =>
                    c.id !== courier?.id &&
                    c.nama.toLowerCase() === formData.nama.toLowerCase().trim()
            )
        ) {
            newErrors.nama = "Kurir dengan nama ini sudah ada";
        }
        if (
            existingCouriers.some(
                (c) => c.id !== courier?.id && c.wa === formData.wa.trim()
            )
        ) {
            newErrors.wa = "Nomor WhatsApp ini sudah terdaftar";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!courier || !(await validateForm())) return;

        setIsSubmitting(true);

        try {
            await updateCourier({
                ...courier,
                nama: formData.nama.trim(),
                wa: formData.wa.trim(),
                aktif: formData.aktif,
            });
            onCourierUpdated();
        } catch (error) {
            console.error("Error updating courier:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!courier) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Kurir</DialogTitle>
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

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-0.5">
                            <Label htmlFor="aktif" className="text-base">
                                Status Aktif
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                {formData.aktif
                                    ? "Kurir dapat menerima order"
                                    : "Kurir tidak dapat menerima order"}
                            </p>
                        </div>
                        <Switch
                            id="aktif"
                            checked={formData.aktif}
                            onCheckedChange={(checked) =>
                                setFormData({ ...formData, aktif: checked })
                            }
                        />
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
                            {isSubmitting ? "Menyimpan..." : "Update Kurir"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
