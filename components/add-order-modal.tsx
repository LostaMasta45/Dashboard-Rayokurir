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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FormField, FormInput, FormTextarea } from "@/components/ui/form-field";
import { ContactAutocomplete } from "@/components/contact-autocomplete";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    getOrders,
    saveOrder,
    generateId,
    addOrUpdateContact,
    getCouriers,
    type Order,
    type Contact,
    type Courier,
    SERVICE_TYPE_PRICING,
} from "@/lib/auth";
import { toast } from "sonner";
import { Zap, FileText, UserPlus } from "lucide-react";

interface AddOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOrderAdded: () => void;
}

export function AddOrderModal({
    isOpen,
    onClose,
    onOrderAdded,
}: AddOrderModalProps) {
    const [formData, setFormData] = useState({
        pengirimNama: "",
        pengirimWa: "",
        pickupAlamat: "",
        dropoffAlamat: "",
        jenisOrder: "",
        serviceType: "",
        ongkir: "",
        danaTalangan: "",
        codNominal: "",
        bayarOngkir: "NON_COD",
        notes: "",
        kurirId: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isQuickMode, setIsQuickMode] = useState(true);
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);

    // Fetch couriers when modal opens
    useEffect(() => {
        if (isOpen) {
            loadCouriersAndOrders();
        }
    }, [isOpen]);

    const loadCouriersAndOrders = async () => {
        const [couriersData, ordersData] = await Promise.all([
            getCouriers(),
            getOrders(),
        ]);
        setCouriers(couriersData.filter(c => c.aktif));
        setOrders(ordersData);
    };

    // Calculate active order count per courier
    const getCourierOrderCount = (courierId: string) => {
        return orders.filter(o => o.status !== "SELESAI" && o.kurirId === courierId).length;
    };

    const resetForm = () => {
        setFormData({
            pengirimNama: "",
            pengirimWa: "",
            pickupAlamat: "",
            dropoffAlamat: "",
            jenisOrder: "",
            serviceType: "",
            ongkir: "",
            danaTalangan: "",
            codNominal: "",
            bayarOngkir: "NON_COD",
            notes: "",
            kurirId: "",
        });
        setErrors({});
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.pengirimNama.trim()) {
            newErrors.pengirimNama = "Nama pengirim wajib diisi";
        } else if (formData.pengirimNama.trim().length < 2) {
            newErrors.pengirimNama = "Nama pengirim minimal 2 karakter";
        }

        if (!formData.pickupAlamat.trim()) {
            newErrors.pickupAlamat = "Alamat pickup wajib diisi";
        } else if (formData.pickupAlamat.trim().length < 10) {
            newErrors.pickupAlamat = "Alamat pickup minimal 10 karakter";
        }

        if (!formData.dropoffAlamat.trim()) {
            newErrors.dropoffAlamat = "Alamat dropoff wajib diisi";
        } else if (formData.dropoffAlamat.trim().length < 10) {
            newErrors.dropoffAlamat = "Alamat dropoff minimal 10 karakter";
        }

        if (!formData.jenisOrder) {
            newErrors.jenisOrder = "Jenis order wajib dipilih";
        }

        if (!formData.serviceType) {
            newErrors.serviceType = "Service type wajib dipilih";
        }

        if (!formData.ongkir || Number.parseFloat(formData.ongkir) <= 0) {
            newErrors.ongkir = "Ongkir wajib diisi dan harus lebih dari 0";
        } else if (Number.parseFloat(formData.ongkir) < 5000) {
            newErrors.ongkir = "Ongkir minimal Rp 5.000";
        }

        if (
            formData.pengirimWa &&
            !/^(\+62|62|0)[0-9]{9,13}$/.test(
                formData.pengirimWa.replace(/\s/g, "")
            )
        ) {
            newErrors.pengirimWa =
                "Format nomor WhatsApp tidak valid (contoh: 08123456789)";
        }

        const codNominal = Number.parseFloat(formData.codNominal) || 0;
        if (codNominal < 0) {
            newErrors.codNominal = "Nominal COD tidak boleh negatif";
        }

        const danaTalangan = Number.parseFloat(formData.danaTalangan) || 0;
        if (danaTalangan < 0) {
            newErrors.danaTalangan = "Dana talangan tidak boleh negatif";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Mohon periksa kembali form yang diisi");
            return;
        }

        setIsSubmitting(true);

        try {
            const codNominal = Number.parseFloat(formData.codNominal) || 0;
            const danaTalangan = Number.parseFloat(formData.danaTalangan) || 0;
            const ongkir = Number.parseFloat(formData.ongkir) || 0;
            const now = new Date();

            // Add to contacts if valid data
            if (formData.pengirimNama.trim() && formData.pickupAlamat.trim()) {
                addOrUpdateContact(
                    formData.pengirimNama.trim(),
                    formData.pengirimWa.trim() || "Tidak ada",
                    formData.pickupAlamat.trim(),
                    [], // tags
                    formData.notes.trim() || undefined
                );
            }

            const newOrder: Order = {
                id: generateId(),
                createdAt: now.toISOString(),
                createdDate: now.toDateString(),
                pengirim: {
                    nama: formData.pengirimNama.trim(),
                    wa: formData.pengirimWa.trim(),
                },
                pickup: {
                    alamat: formData.pickupAlamat.trim(),
                },
                dropoff: {
                    alamat: formData.dropoffAlamat.trim(),
                },
                kurirId: (formData.kurirId && formData.kurirId !== "no-assign") ? formData.kurirId : null,
                status: (formData.kurirId && formData.kurirId !== "no-assign") ? "ASSIGNED" : "BARU",
                jenisOrder: formData.jenisOrder as
                    | "Barang"
                    | "Makanan"
                    | "Dokumen"
                    | "Antar Jemput",
                serviceType: formData.serviceType as
                    | "Reguler"
                    | "Express"
                    | "Same Day",
                ongkir: ongkir,
                danaTalangan: danaTalangan,
                bayarOngkir: formData.bayarOngkir as "NON_COD" | "COD",
                talanganReimbursed: false,
                cod: {
                    nominal: codNominal,
                    isCOD: codNominal > 0,
                    codPaid: false,
                },
                nonCodPaid:
                    codNominal === 0 && formData.bayarOngkir === "NON_COD",
                notes: formData.notes.trim(),
            };

            await saveOrder(newOrder);

            const actualKurirId = (formData.kurirId && formData.kurirId !== "no-assign") ? formData.kurirId : null;
            const courierName = actualKurirId ? couriers.find(c => c.id === actualKurirId)?.nama : null;
            toast.success(courierName
                ? `Order berhasil ditambahkan dan di-assign ke ${courierName}!`
                : "Order berhasil ditambahkan!"
            );
            resetForm();
            onOrderAdded();
        } catch (error) {
            console.error("Error adding order:", error);
            toast.error("Gagal menambahkan order. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSubmitting) return;
        resetForm();
        onClose();
    };

    // Handle contact selection from autocomplete
    const handleContactSelect = (contact: Contact) => {
        setFormData({
            ...formData,
            pengirimNama: contact.name,
            pengirimWa: contact.whatsapp || "",
            pickupAlamat: contact.address || "",
        });
        // Clear related errors
        setErrors({
            ...errors,
            pengirimNama: "",
            pengirimWa: "",
            pickupAlamat: "",
        });
    };

    // Handle submit and continue (for consecutive entries)
    const handleSubmitAndContinue = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Mohon periksa kembali form yang diisi");
            return;
        }

        setIsSubmitting(true);

        try {
            const codNominal = Number.parseFloat(formData.codNominal) || 0;
            const danaTalangan = Number.parseFloat(formData.danaTalangan) || 0;
            const ongkir = Number.parseFloat(formData.ongkir) || 0;
            const now = new Date();

            if (formData.pengirimNama.trim() && formData.pickupAlamat.trim()) {
                addOrUpdateContact(
                    formData.pengirimNama.trim(),
                    formData.pengirimWa.trim() || "Tidak ada",
                    formData.pickupAlamat.trim(),
                    [],
                    formData.notes.trim() || undefined
                );
            }

            const newOrder: Order = {
                id: generateId(),
                createdAt: now.toISOString(),
                createdDate: now.toDateString(),
                pengirim: {
                    nama: formData.pengirimNama.trim(),
                    wa: formData.pengirimWa.trim(),
                },
                pickup: {
                    alamat: formData.pickupAlamat.trim(),
                },
                dropoff: {
                    alamat: formData.dropoffAlamat.trim(),
                },
                kurirId: (formData.kurirId && formData.kurirId !== "no-assign") ? formData.kurirId : null,
                status: (formData.kurirId && formData.kurirId !== "no-assign") ? "ASSIGNED" : "BARU",
                jenisOrder: formData.jenisOrder as
                    | "Barang"
                    | "Makanan"
                    | "Dokumen"
                    | "Antar Jemput",
                serviceType: formData.serviceType as
                    | "Reguler"
                    | "Express"
                    | "Same Day",
                ongkir: ongkir,
                danaTalangan: danaTalangan,
                bayarOngkir: formData.bayarOngkir as "NON_COD" | "COD",
                talanganReimbursed: false,
                cod: {
                    nominal: codNominal,
                    isCOD: codNominal > 0,
                    codPaid: false,
                },
                nonCodPaid:
                    codNominal === 0 && formData.bayarOngkir === "NON_COD",
                notes: formData.notes.trim(),
            };

            await saveOrder(newOrder);

            const actualKurirId = (formData.kurirId && formData.kurirId !== "no-assign") ? formData.kurirId : null;
            const courierName = actualKurirId ? couriers.find(c => c.id === actualKurirId)?.nama : null;
            toast.success(courierName
                ? `Order berhasil di-assign ke ${courierName}! Lanjut ke order berikutnya.`
                : "Order berhasil ditambahkan! Silakan lanjut ke order berikutnya."
            );

            // Reset form but keep modal open for next entry
            setFormData({
                pengirimNama: "",
                pengirimWa: "",
                pickupAlamat: "",
                dropoffAlamat: "",
                jenisOrder: formData.jenisOrder, // Keep jenis order
                serviceType: formData.serviceType, // Keep service type
                ongkir: formData.ongkir, // Keep ongkir
                danaTalangan: "",
                codNominal: "",
                bayarOngkir: "NON_COD",
                notes: "",
                kurirId: formData.kurirId, // Keep selected courier
            });
            setErrors({});
            onOrderAdded(); // Refresh list
        } catch (error) {
            console.error("Error adding order:", error);
            toast.error("Gagal menambahkan order. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateSuggestedOngkir = (serviceType: string) => {
        const basePrice = 15000; // Base price for regular service
        const additionalPrice =
            SERVICE_TYPE_PRICING[
            serviceType as keyof typeof SERVICE_TYPE_PRICING
            ] || 0;
        return basePrice + additionalPrice;
    };

    const handleServiceTypeChange = (value: string) => {
        setFormData({
            ...formData,
            serviceType: value,
            ongkir: calculateSuggestedOngkir(value).toString(),
        });
        // Clear service type error when user selects
        if (errors.serviceType) {
            setErrors({ ...errors, serviceType: "" });
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors({ ...errors, [field]: "" });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className={`${isQuickMode ? 'max-w-2xl' : 'max-w-4xl'} w-[95vw] max-h-[95vh] overflow-y-auto mx-4 sm:mx-auto`}>
                <DialogHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl sm:text-2xl font-bold text-rayo-dark flex items-center gap-2">
                            {isQuickMode ? (
                                <><Zap className="h-5 w-5 text-orange-500" /> Quick Add Order</>
                            ) : (
                                <><FileText className="h-5 w-5 text-blue-500" /> Tambah Order Baru</>
                            )}
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="quick-mode" className="text-sm text-muted-foreground">
                                {isQuickMode ? "Quick" : "Full"}
                            </Label>
                            <Switch
                                id="quick-mode"
                                checked={isQuickMode}
                                onCheckedChange={setIsQuickMode}
                            />
                        </div>
                    </div>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4 sm:space-y-6"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <FormField
                            label="Nama Pengirim"
                            required
                            error={errors.pengirimNama}
                        >
                            <ContactAutocomplete
                                value={formData.pengirimNama}
                                onChange={(value) =>
                                    handleInputChange("pengirimNama", value)
                                }
                                onSelect={handleContactSelect}
                                placeholder="Ketik nama untuk autocomplete..."
                                error={errors.pengirimNama}
                                disabled={isSubmitting}
                                className="h-10 sm:h-11"
                            />
                        </FormField>

                        <FormField
                            label="Nomor WhatsApp"
                            error={errors.pengirimWa}
                        >
                            <FormInput
                                id="pengirimWa"
                                value={formData.pengirimWa}
                                onChange={(e) =>
                                    handleInputChange(
                                        "pengirimWa",
                                        e.target.value
                                    )
                                }
                                placeholder="08123456789"
                                error={errors.pengirimWa}
                                disabled={isSubmitting}
                                className="h-10 sm:h-11"
                            />
                        </FormField>
                    </div>

                    <FormField
                        label="Alamat Pickup"
                        required
                        error={errors.pickupAlamat}
                    >
                        <FormTextarea
                            id="pickupAlamat"
                            value={formData.pickupAlamat}
                            onChange={(e) =>
                                handleInputChange(
                                    "pickupAlamat",
                                    e.target.value
                                )
                            }
                            placeholder="Masukkan alamat pickup lengkap dengan patokan"
                            rows={3}
                            error={errors.pickupAlamat}
                            disabled={isSubmitting}
                            className="min-h-[80px] resize-none"
                        />
                    </FormField>

                    <FormField
                        label="Alamat Dropoff"
                        required
                        error={errors.dropoffAlamat}
                    >
                        <FormTextarea
                            id="dropoffAlamat"
                            value={formData.dropoffAlamat}
                            onChange={(e) =>
                                handleInputChange(
                                    "dropoffAlamat",
                                    e.target.value
                                )
                            }
                            placeholder="Masukkan alamat dropoff lengkap dengan patokan"
                            rows={3}
                            error={errors.dropoffAlamat}
                            disabled={isSubmitting}
                            className="min-h-[80px] resize-none"
                        />
                    </FormField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <FormField
                            label="Jenis Order"
                            required
                            error={errors.jenisOrder}
                        >
                            <Select
                                value={formData.jenisOrder}
                                onValueChange={(value) =>
                                    handleInputChange("jenisOrder", value)
                                }
                                disabled={isSubmitting}
                            >
                                <SelectTrigger
                                    className={`h-10 sm:h-11 ${errors.jenisOrder
                                        ? "border-red-500"
                                        : ""
                                        }`}
                                >
                                    <SelectValue placeholder="Pilih jenis order" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Barang">
                                        📦 Barang
                                    </SelectItem>
                                    <SelectItem value="Makanan">
                                        🍔 Makanan
                                    </SelectItem>
                                    <SelectItem value="Dokumen">
                                        📄 Dokumen
                                    </SelectItem>
                                    <SelectItem value="Antar Jemput">
                                        🚗 Antar Jemput
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </FormField>

                        <FormField
                            label="Service Type"
                            required
                            error={errors.serviceType}
                        >
                            <Select
                                value={formData.serviceType}
                                onValueChange={handleServiceTypeChange}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger
                                    className={`h-10 sm:h-11 ${errors.serviceType
                                        ? "border-red-500"
                                        : ""
                                        }`}
                                >
                                    <SelectValue placeholder="Pilih service type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Reguler">
                                        🚚 Reguler
                                    </SelectItem>
                                    <SelectItem value="Express">
                                        ⚡ Express (+Rp 5.000)
                                    </SelectItem>
                                    <SelectItem value="Same Day">
                                        🏃 Same Day (+Rp 10.000)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </FormField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <FormField
                            label="Ongkir (Rp)"
                            required
                            error={errors.ongkir}
                        >
                            <FormInput
                                id="ongkir"
                                type="number"
                                min="0"
                                value={formData.ongkir}
                                onChange={(e) =>
                                    handleInputChange("ongkir", e.target.value)
                                }
                                placeholder="15000"
                                error={errors.ongkir}
                                disabled={isSubmitting}
                                className="h-10 sm:h-11"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Biaya jasa antar. Masuk ke pendapatan saat
                                dibayar.
                            </p>
                        </FormField>

                        <FormField
                            label="Dana Talangan (Rp)"
                            error={errors.danaTalangan}
                        >
                            <FormInput
                                id="danaTalangan"
                                type="number"
                                min="0"
                                value={formData.danaTalangan}
                                onChange={(e) =>
                                    handleInputChange(
                                        "danaTalangan",
                                        e.target.value
                                    )
                                }
                                placeholder="0"
                                error={errors.danaTalangan}
                                disabled={isSubmitting}
                                className="h-10 sm:h-11"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Uang yang kurir keluarkan di muka (titip beli).
                                Bukan pendapatan. Tandai 'Talangan Diganti'
                                setelah customer mengganti.
                            </p>
                        </FormField>

                        <FormField
                            label="Nominal COD (Rp)"
                            error={errors.codNominal}
                        >
                            <FormInput
                                id="codNominal"
                                type="number"
                                min="0"
                                value={formData.codNominal}
                                onChange={(e) =>
                                    handleInputChange(
                                        "codNominal",
                                        e.target.value
                                    )
                                }
                                placeholder="0"
                                error={errors.codNominal}
                                disabled={isSubmitting}
                                className="h-10 sm:h-11"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Harga barang titipan dari toko/merchant. Bukan
                                pendapatan. Kurir wajib setor ke toko. Jika
                                tidak ada COD → isi 0.
                            </p>
                        </FormField>
                    </div>

                    <FormField label="Cara Bayar Ongkir" required>
                        <Select
                            value={formData.bayarOngkir}
                            onValueChange={(value) =>
                                handleInputChange("bayarOngkir", value)
                            }
                            disabled={isSubmitting}
                        >
                            <SelectTrigger className="h-10 sm:h-11">
                                <SelectValue placeholder="Pilih cara bayar ongkir" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NON_COD">
                                    💳 Non-COD (dibayar langsung)
                                </SelectItem>
                                <SelectItem value="COD">
                                    💰 COD (ongkir digabung dengan COD, masuk
                                    kas saat setoran COD)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                            Non-COD: Ongkir dibayar langsung. COD: Ongkir
                            digabung dengan COD, masuk kas saat setoran COD.
                        </p>
                    </FormField>

                    <FormField label="Catatan (Opsional)">
                        <FormTextarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) =>
                                handleInputChange("notes", e.target.value)
                            }
                            placeholder="Catatan tambahan untuk order ini"
                            rows={3}
                            disabled={isSubmitting}
                            className="min-h-[80px] resize-none"
                        />
                    </FormField>

                    {/* Courier Selection */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <h3 className="font-medium text-blue-900 dark:text-blue-100">Langsung Assign ke Kurir (Opsional)</h3>
                        </div>
                        <Select
                            value={formData.kurirId}
                            onValueChange={(value) => handleInputChange("kurirId", value)}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger className="h-11 bg-white dark:bg-gray-900">
                                <SelectValue placeholder="Pilih kurir untuk langsung di-assign..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="no-assign">
                                    ⏳ Nanti saja (assign manual)
                                </SelectItem>
                                {couriers.length === 0 ? (
                                    <SelectItem value="none" disabled>
                                        Tidak ada kurir aktif
                                    </SelectItem>
                                ) : (
                                    couriers
                                        .sort((a, b) => {
                                            // Online first, then by order count
                                            if (a.online && !b.online) return -1;
                                            if (!a.online && b.online) return 1;
                                            return getCourierOrderCount(a.id) - getCourierOrderCount(b.id);
                                        })
                                        .map((courier) => {
                                            const orderCount = getCourierOrderCount(courier.id);
                                            return (
                                                <SelectItem key={courier.id} value={courier.id}>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${courier.online ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                        <span>{courier.nama}</span>
                                                        <Badge
                                                            variant="secondary"
                                                            className={`ml-1 text-xs ${orderCount === 0
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                : orderCount >= 3
                                                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                                }`}
                                                        >
                                                            {orderCount} order
                                                        </Badge>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })
                                )}
                            </SelectContent>
                        </Select>
                        {formData.kurirId && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                                ✓ Order akan langsung di-assign dan status menjadi "ASSIGNED"
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="sm:flex-1 bg-transparent h-10 sm:h-11"
                            disabled={isSubmitting}
                        >
                            Batal
                        </Button>
                        {isQuickMode && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleSubmitAndContinue}
                                disabled={isSubmitting}
                                className="sm:flex-1 border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 h-10 sm:h-11"
                            >
                                {isSubmitting ? (
                                    <span>Menyimpan...</span>
                                ) : (
                                    "+ Tambah & Lanjut"
                                )}
                            </Button>
                        )}
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="sm:flex-1 bg-rayo-primary hover:bg-rayo-dark h-10 sm:h-11"
                        >
                            {isSubmitting ? (
                                <span>Menyimpan...</span>
                            ) : (
                                isQuickMode ? "+ Simpan & Tutup" : "Simpan Order"
                            )}
                        </Button>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                        <p className="text-sm text-blue-800">
                            💡 <strong>Hint:</strong> Isi Nominal COD hanya jika
                            ada barang titipan dari toko. Jika hanya talangan +
                            ongkir → COD = 0.
                        </p>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
