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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    getExpenses,
    saveExpense,
    updateExpense,
    generateId,
    type Expense,
} from "@/lib/auth";

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExpenseAdded: () => void;
    editingExpense?: Expense | null;
}

const EXPENSE_CATEGORIES = [
    "Bensin",
    "Parkir/Tol",
    "Maintenance Motor",
    "Pulsa/Internet",
    "Seragam/Atribut",
    "Lainnya",
];

export function AddExpenseModal({
    isOpen,
    onClose,
    onExpenseAdded,
    editingExpense,
}: AddExpenseModalProps) {
    const [formData, setFormData] = useState({
        kategori: "",
        deskripsi: "",
        nominal: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingExpense) {
            setFormData({
                kategori: editingExpense.kategori,
                deskripsi: editingExpense.deskripsi,
                nominal: editingExpense.nominal.toString(),
            });
        } else {
            resetForm();
        }
    }, [editingExpense, isOpen]);

    const resetForm = () => {
        setFormData({
            kategori: "",
            deskripsi: "",
            nominal: "",
        });
        setErrors({});
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.kategori) {
            newErrors.kategori = "Kategori wajib dipilih";
        }

        if (!formData.deskripsi.trim()) {
            newErrors.deskripsi = "Deskripsi wajib diisi";
        }

        const nominal = Number.parseFloat(formData.nominal);
        if (!formData.nominal || isNaN(nominal) || nominal <= 0) {
            newErrors.nominal = "Nominal harus lebih dari 0";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            if (editingExpense) {
                // Update expense di Supabase
                const updatedExpense: Expense = {
                    ...editingExpense,
                    kategori: formData.kategori,
                    deskripsi: formData.deskripsi.trim(),
                    nominal: Number.parseFloat(formData.nominal),
                };
                await updateExpense(updatedExpense);
            } else {
                const newExpense: Expense = {
                    id: generateId(),
                    tanggal: new Date().toDateString(),
                    kategori: formData.kategori,
                    deskripsi: formData.deskripsi.trim(),
                    nominal: Number.parseFloat(formData.nominal),
                };
                await saveExpense(newExpense);
            }

            resetForm();
            onExpenseAdded();
        } catch (error) {
            console.error("Error saving expense:", error);
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
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">
                        {editingExpense
                            ? "Edit Biaya Operasional"
                            : "Tambah Biaya Operasional"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="kategori"
                            className="text-sm font-medium"
                        >
                            Kategori <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={formData.kategori}
                            onValueChange={(value) =>
                                setFormData({ ...formData, kategori: value })
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih kategori..." />
                            </SelectTrigger>
                            <SelectContent>
                                {EXPENSE_CATEGORIES.map((category) => (
                                    <SelectItem key={category} value={category}>
                                        {category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.kategori && (
                            <p className="text-sm text-red-500">
                                {errors.kategori}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="deskripsi"
                            className="text-sm font-medium"
                        >
                            Deskripsi <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="deskripsi"
                            value={formData.deskripsi}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    deskripsi: e.target.value,
                                })
                            }
                            placeholder="Deskripsi biaya..."
                            rows={3}
                            className="resize-none"
                        />
                        {errors.deskripsi && (
                            <p className="text-sm text-red-500">
                                {errors.deskripsi}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="nominal"
                            className="text-sm font-medium"
                        >
                            Nominal (Rp) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="nominal"
                            type="number"
                            min="0"
                            step="1000"
                            value={formData.nominal}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    nominal: e.target.value,
                                })
                            }
                            placeholder="Masukkan nominal"
                            className="w-full"
                        />
                        {errors.nominal && (
                            <p className="text-sm text-red-500">
                                {errors.nominal}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1 bg-transparent order-2 sm:order-1"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-rayo-primary hover:bg-rayo-dark order-1 sm:order-2"
                        >
                            {isSubmitting
                                ? editingExpense
                                    ? "Memperbarui..."
                                    : "Menyimpan..."
                                : editingExpense
                                ? "Perbarui Biaya"
                                : "Simpan Biaya"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
