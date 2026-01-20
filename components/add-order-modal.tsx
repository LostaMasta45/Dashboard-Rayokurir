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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Zap, FileText, UserPlus, User, MapPin, Package, Wallet, Settings, AlertTriangle, ExternalLink } from "lucide-react";

interface AddOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOrderAdded: () => void;
}

// Section header component
function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
    return (
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="p-2 rounded-lg bg-gradient-to-br from-rayo-primary/10 to-rayo-primary/5">
                <Icon className="h-5 w-5 text-rayo-primary" />
            </div>
            <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
        </div>
    );
}

export function AddOrderModal({
    isOpen,
    onClose,
    onOrderAdded,
}: AddOrderModalProps) {
    const [formData, setFormData] = useState({
        // Section A: Customer
        pengirimNama: "",
        pengirimWa: "",
        // Section B: Rute
        pickupAlamat: "",
        pickupMapsLink: "",
        dropoffAlamat: "",
        dropoffMapsLink: "",
        // Section C: Layanan
        jenisOrder: "",
        serviceType: "",
        addonReturnPP: false,
        addonBulky: false,
        addonHeavy: false,
        addonWaitingFee: false,
        addonWaitingFeeAmount: "",
        // Section D: Keuangan
        ongkir: "",
        danaTalangan: "",
        codNominal: "",
        bayarOngkir: "NON_COD",
        // Section E: Operasional
        notes: "",
        kurirId: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [warnings, setWarnings] = useState<string[]>([]);
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

    // Check for warnings when COD/bayar fields change
    useEffect(() => {
        const newWarnings: string[] = [];
        const codNominal = Number.parseFloat(formData.codNominal) || 0;

        if (formData.bayarOngkir === "COD" && codNominal === 0) {
            newWarnings.push("Mode COD biasanya dipakai kalau ada setoran COD. Pastikan ini benar.");
        }

        if (codNominal > 0 && formData.bayarOngkir === "NON_COD") {
            newWarnings.push("Ada COD barang, tapi ongkir dibayar langsung—pastikan sesuai kesepakatan.");
        }

        setWarnings(newWarnings);
    }, [formData.bayarOngkir, formData.codNominal]);

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

    // Normalize WhatsApp number: 08xxx -> 62xxx
    const normalizeWhatsApp = (wa: string): string => {
        if (!wa) return wa;
        const cleaned = wa.replace(/\s/g, "").replace(/[^0-9+]/g, "");
        if (cleaned.startsWith("08")) {
            return "62" + cleaned.substring(1);
        }
        if (cleaned.startsWith("+62")) {
            return cleaned.substring(1);
        }
        return cleaned;
    };

    const resetForm = () => {
        setFormData({
            pengirimNama: "",
            pengirimWa: "",
            pickupAlamat: "",
            pickupMapsLink: "",
            dropoffAlamat: "",
            dropoffMapsLink: "",
            jenisOrder: "",
            serviceType: "",
            addonReturnPP: false,
            addonBulky: false,
            addonHeavy: false,
            addonWaitingFee: false,
            addonWaitingFeeAmount: "",
            ongkir: "",
            danaTalangan: "",
            codNominal: "",
            bayarOngkir: "NON_COD",
            notes: "",
            kurirId: "",
        });
        setErrors({});
        setWarnings([]);
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Section A: Customer
        if (!formData.pengirimNama.trim()) {
            newErrors.pengirimNama = "Nama pengirim wajib diisi";
        } else if (formData.pengirimNama.trim().length < 2) {
            newErrors.pengirimNama = "Nama pengirim minimal 2 karakter";
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

        // Section B: Rute
        if (!formData.pickupAlamat.trim()) {
            newErrors.pickupAlamat = "Alamat pickup wajib diisi";
        } else if (formData.pickupAlamat.trim().length < 10) {
            newErrors.pickupAlamat = "Alamat pickup minimal 10 karakter (tambahkan patokan)";
        }

        if (!formData.dropoffAlamat.trim()) {
            newErrors.dropoffAlamat = "Alamat dropoff wajib diisi";
        } else if (formData.dropoffAlamat.trim().length < 10) {
            newErrors.dropoffAlamat = "Alamat dropoff minimal 10 karakter (tambahkan patokan)";
        }

        // Section C: Layanan
        if (!formData.jenisOrder) {
            newErrors.jenisOrder = "Jenis order wajib dipilih";
        }

        if (!formData.serviceType) {
            newErrors.serviceType = "Service type wajib dipilih";
        }

        // Section D: Keuangan
        if (!formData.ongkir || Number.parseFloat(formData.ongkir) <= 0) {
            newErrors.ongkir = "Ongkir wajib diisi dan harus lebih dari 0";
        } else if (Number.parseFloat(formData.ongkir) < 3000) {
            newErrors.ongkir = "Ongkir minimal Rp 3.000";
        }

        const codNominal = Number.parseFloat(formData.codNominal) || 0;
        if (codNominal < 0) {
            newErrors.codNominal = "Nominal COD tidak boleh negatif";
        }

        const danaTalangan = Number.parseFloat(formData.danaTalangan) || 0;
        if (danaTalangan < 0) {
            newErrors.danaTalangan = "Dana talangan tidak boleh negatif";
        }

        // Waiting fee validation
        if (formData.addonWaitingFee && !formData.addonWaitingFeeAmount) {
            newErrors.addonWaitingFeeAmount = "Nominal waiting fee wajib diisi";
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
            const waitingFeeAmount = Number.parseFloat(formData.addonWaitingFeeAmount) || 0;
            const now = new Date();

            // Normalize WA before saving
            const normalizedWa = normalizeWhatsApp(formData.pengirimWa.trim());

            // Add to contacts if valid data
            if (formData.pengirimNama.trim() && formData.pickupAlamat.trim()) {
                addOrUpdateContact(
                    formData.pengirimNama.trim(),
                    normalizedWa || "Tidak ada",
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
                    wa: normalizedWa,
                },
                pickup: {
                    alamat: formData.pickupAlamat.trim(),
                    mapsLink: formData.pickupMapsLink.trim() || undefined,
                },
                dropoff: {
                    alamat: formData.dropoffAlamat.trim(),
                    mapsLink: formData.dropoffMapsLink.trim() || undefined,
                },
                kurirId: (formData.kurirId && formData.kurirId !== "no-assign") ? formData.kurirId : null,
                status: (formData.kurirId && formData.kurirId !== "no-assign") ? "OFFERED" : "NEW",
                jenisOrder: formData.jenisOrder as
                    | "Antar Barang"
                    | "Jemput Barang"
                    | "Titip Beli"
                    | "Dokumen"
                    | "Lainnya",
                serviceType: formData.serviceType as
                    | "Regular"
                    | "Express",
                addons: {
                    returnPP: formData.addonReturnPP,
                    bulky: formData.addonBulky,
                    heavy: formData.addonHeavy,
                    waitingFee: formData.addonWaitingFee,
                    waitingFeeAmount: waitingFeeAmount,
                },
                ongkir: ongkir,
                danaTalangan: danaTalangan,
                talanganDiganti: false,
                bayarOngkir: formData.bayarOngkir as "NON_COD" | "COD",
                talanganReimbursed: false,
                cod: {
                    nominal: codNominal,
                    isCOD: codNominal > 0,
                    codPaid: false,
                },
                codSettled: false,
                nonCodPaid:
                    codNominal === 0 && formData.bayarOngkir === "NON_COD",
                notes: formData.notes.trim(),
                podPhotos: [],
                auditLog: [{
                    event: "ORDER_CREATED",
                    at: now.toISOString(),
                    actorType: "ADMIN",
                    actorId: "admin",
                    meta: { kurirAssigned: formData.kurirId && formData.kurirId !== "no-assign" }
                }],
            };

            await saveOrder(newOrder);

            // Push notification to courier's Telegram if assigned
            const actualKurirId = (formData.kurirId && formData.kurirId !== "no-assign") ? formData.kurirId : null;
            if (actualKurirId) {
                try {
                    const pushRes = await fetch('/api/telegram/kurir/push-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId: newOrder.id, courierId: actualKurirId }),
                    });
                    const pushData = await pushRes.json();
                    if (!pushData.ok) {
                        console.warn('[push-order] Warning:', pushData.error);
                    }
                } catch (pushError) {
                    console.error('[push-order] Error:', pushError);
                }
            }

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
            const waitingFeeAmount = Number.parseFloat(formData.addonWaitingFeeAmount) || 0;
            const now = new Date();

            const normalizedWa = normalizeWhatsApp(formData.pengirimWa.trim());

            if (formData.pengirimNama.trim() && formData.pickupAlamat.trim()) {
                addOrUpdateContact(
                    formData.pengirimNama.trim(),
                    normalizedWa || "Tidak ada",
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
                    wa: normalizedWa,
                },
                pickup: {
                    alamat: formData.pickupAlamat.trim(),
                    mapsLink: formData.pickupMapsLink.trim() || undefined,
                },
                dropoff: {
                    alamat: formData.dropoffAlamat.trim(),
                    mapsLink: formData.dropoffMapsLink.trim() || undefined,
                },
                kurirId: (formData.kurirId && formData.kurirId !== "no-assign") ? formData.kurirId : null,
                status: (formData.kurirId && formData.kurirId !== "no-assign") ? "OFFERED" : "NEW",
                jenisOrder: formData.jenisOrder as
                    | "Antar Barang"
                    | "Jemput Barang"
                    | "Titip Beli"
                    | "Dokumen"
                    | "Lainnya",
                serviceType: formData.serviceType as
                    | "Regular"
                    | "Express",
                addons: {
                    returnPP: formData.addonReturnPP,
                    bulky: formData.addonBulky,
                    heavy: formData.addonHeavy,
                    waitingFee: formData.addonWaitingFee,
                    waitingFeeAmount: waitingFeeAmount,
                },
                ongkir: ongkir,
                danaTalangan: danaTalangan,
                talanganDiganti: false,
                bayarOngkir: formData.bayarOngkir as "NON_COD" | "COD",
                talanganReimbursed: false,
                cod: {
                    nominal: codNominal,
                    isCOD: codNominal > 0,
                    codPaid: false,
                },
                codSettled: false,
                nonCodPaid:
                    codNominal === 0 && formData.bayarOngkir === "NON_COD",
                notes: formData.notes.trim(),
                podPhotos: [],
                auditLog: [{
                    event: "ORDER_CREATED",
                    at: now.toISOString(),
                    actorType: "ADMIN",
                    actorId: "admin",
                    meta: { kurirAssigned: formData.kurirId && formData.kurirId !== "no-assign" }
                }],
            };

            await saveOrder(newOrder);

            // Push notification to courier's Telegram if assigned
            const actualKurirId = (formData.kurirId && formData.kurirId !== "no-assign") ? formData.kurirId : null;
            if (actualKurirId) {
                try {
                    const pushRes = await fetch('/api/telegram/kurir/push-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId: newOrder.id, courierId: actualKurirId }),
                    });
                    const pushData = await pushRes.json();
                    if (!pushData.ok) {
                        console.warn('[push-order] Warning:', pushData.error);
                    }
                } catch (pushError) {
                    console.error('[push-order] Error:', pushError);
                }
            }

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
                pickupMapsLink: "",
                dropoffAlamat: "",
                dropoffMapsLink: "",
                jenisOrder: formData.jenisOrder,
                serviceType: formData.serviceType,
                addonReturnPP: false,
                addonBulky: false,
                addonHeavy: false,
                addonWaitingFee: false,
                addonWaitingFeeAmount: "",
                ongkir: formData.ongkir,
                danaTalangan: "",
                codNominal: "",
                bayarOngkir: "NON_COD",
                notes: "",
                kurirId: formData.kurirId,
            });
            setErrors({});
            setWarnings([]);
            onOrderAdded();
        } catch (error) {
            console.error("Error adding order:", error);
            toast.error("Gagal menambahkan order. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleServiceTypeChange = (value: string) => {
        setFormData({
            ...formData,
            serviceType: value,
        });
        if (errors.serviceType) {
            setErrors({ ...errors, serviceType: "" });
        }
    };

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: "" });
        }
    };

    // Paste maps link handler
    const handlePasteMaps = async (field: 'pickupMapsLink' | 'dropoffMapsLink') => {
        try {
            const text = await navigator.clipboard.readText();
            if (text.includes('google.com/maps') || text.includes('goo.gl') || text.includes('maps.app')) {
                handleInputChange(field, text);
                toast.success("Link Maps berhasil ditempel!");
            } else {
                toast.error("Clipboard tidak berisi link Google Maps yang valid");
            }
        } catch {
            toast.error("Tidak bisa mengakses clipboard");
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
                    className="space-y-6"
                >
                    {/* ===== SECTION A: CUSTOMER ===== */}
                    <div className="space-y-4">
                        <SectionHeader icon={User} title="Customer" description="Data pengirim order" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                <p className="text-xs text-muted-foreground mt-1">
                                    Akan otomatis dinormalisasi ke format 62xxx
                                </p>
                            </FormField>
                        </div>
                    </div>

                    {/* ===== SECTION B: RUTE ===== */}
                    <div className="space-y-4">
                        <SectionHeader icon={MapPin} title="Rute" description="Alamat pickup dan dropoff" />

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
                                placeholder="Masukkan alamat pickup lengkap dengan patokan (dekat masjid/gang/toko)"
                                rows={3}
                                error={errors.pickupAlamat}
                                disabled={isSubmitting}
                                className="min-h-[80px] resize-none"
                            />
                        </FormField>

                        <div className="flex items-center gap-2">
                            <FormInput
                                id="pickupMapsLink"
                                value={formData.pickupMapsLink}
                                onChange={(e) => handleInputChange("pickupMapsLink", e.target.value)}
                                placeholder="Link Google Maps pickup (opsional)"
                                disabled={isSubmitting}
                                className="h-9 text-sm flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handlePasteMaps('pickupMapsLink')}
                                className="shrink-0"
                            >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Tempel Maps
                            </Button>
                        </div>

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
                                placeholder="Masukkan alamat dropoff lengkap dengan patokan (dekat masjid/gang/toko)"
                                rows={3}
                                error={errors.dropoffAlamat}
                                disabled={isSubmitting}
                                className="min-h-[80px] resize-none"
                            />
                        </FormField>

                        <div className="flex items-center gap-2">
                            <FormInput
                                id="dropoffMapsLink"
                                value={formData.dropoffMapsLink}
                                onChange={(e) => handleInputChange("dropoffMapsLink", e.target.value)}
                                placeholder="Link Google Maps dropoff (opsional)"
                                disabled={isSubmitting}
                                className="h-9 text-sm flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handlePasteMaps('dropoffMapsLink')}
                                className="shrink-0"
                            >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Tempel Maps
                            </Button>
                        </div>
                    </div>

                    {/* ===== SECTION C: LAYANAN ===== */}
                    <div className="space-y-4">
                        <SectionHeader icon={Package} title="Layanan" description="Jenis order dan layanan tambahan" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                        <SelectItem value="Antar Barang">
                                            📦 Antar Barang
                                        </SelectItem>
                                        <SelectItem value="Jemput Barang">
                                            🚚 Jemput Barang
                                        </SelectItem>
                                        <SelectItem value="Titip Beli">
                                            🛒 Titip Beli
                                        </SelectItem>
                                        <SelectItem value="Dokumen">
                                            📄 Dokumen
                                        </SelectItem>
                                        <SelectItem value="Lainnya">
                                            📋 Lainnya
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
                                        <SelectItem value="Regular">
                                            🚚 Regular
                                        </SelectItem>
                                        <SelectItem value="Express">
                                            ⚡ Express (+Rp 2.000)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Express: label saja, ongkir tetap manual
                                </p>
                            </FormField>
                        </div>

                        {/* Add-on checkboxes */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Add-on (opsional)</p>
                            <p className="text-xs text-muted-foreground mb-3">Data saja untuk tracking, tidak otomatis menambah ongkir</p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="addonReturnPP"
                                        checked={formData.addonReturnPP}
                                        onCheckedChange={(checked) => handleInputChange("addonReturnPP", checked as boolean)}
                                        disabled={isSubmitting}
                                    />
                                    <Label htmlFor="addonReturnPP" className="text-sm cursor-pointer">
                                        🔄 Return/PP
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="addonBulky"
                                        checked={formData.addonBulky}
                                        onCheckedChange={(checked) => handleInputChange("addonBulky", checked as boolean)}
                                        disabled={isSubmitting}
                                    />
                                    <Label htmlFor="addonBulky" className="text-sm cursor-pointer">
                                        📦 Bulky
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="addonHeavy"
                                        checked={formData.addonHeavy}
                                        onCheckedChange={(checked) => handleInputChange("addonHeavy", checked as boolean)}
                                        disabled={isSubmitting}
                                    />
                                    <Label htmlFor="addonHeavy" className="text-sm cursor-pointer">
                                        🏋️ Heavy/Repot
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="addonWaitingFee"
                                        checked={formData.addonWaitingFee}
                                        onCheckedChange={(checked) => handleInputChange("addonWaitingFee", checked as boolean)}
                                        disabled={isSubmitting}
                                    />
                                    <Label htmlFor="addonWaitingFee" className="text-sm cursor-pointer">
                                        ⏱️ Waiting Fee
                                    </Label>
                                </div>
                            </div>

                            {formData.addonWaitingFee && (
                                <div className="pt-2">
                                    <FormField label="Nominal Waiting Fee (Rp)" error={errors.addonWaitingFeeAmount}>
                                        <FormInput
                                            id="addonWaitingFeeAmount"
                                            type="number"
                                            min="0"
                                            value={formData.addonWaitingFeeAmount}
                                            onChange={(e) => handleInputChange("addonWaitingFeeAmount", e.target.value)}
                                            placeholder="5000"
                                            error={errors.addonWaitingFeeAmount}
                                            disabled={isSubmitting}
                                            className="h-9 max-w-[200px]"
                                        />
                                    </FormField>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ===== SECTION D: KEUANGAN ===== */}
                    <div className="space-y-4">
                        <SectionHeader icon={Wallet} title="Keuangan" description="Ongkir, talangan, dan COD" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                    Isi total ongkir manual. Minimal Rp3.000.
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
                                    Bukan pendapatan. Centang &apos;Talangan Diganti&apos; setelah customer mengganti.
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
                                    Bukan pendapatan. Kurir wajib setor ke toko. Jika tidak ada COD → isi 0.
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
                                        💰 COD (ongkir digabung dengan COD)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </FormField>

                        {/* Warning alerts */}
                        {warnings.length > 0 && (
                            <div className="space-y-2">
                                {warnings.map((warning, idx) => (
                                    <Alert key={idx} className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
                                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                        <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm">
                                            {warning}
                                        </AlertDescription>
                                    </Alert>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ===== SECTION E: OPERASIONAL ===== */}
                    <div className="space-y-4">
                        <SectionHeader icon={Settings} title="Operasional" description="Catatan dan assign kurir" />

                        <FormField label="Catatan (Opsional)">
                            <FormTextarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) =>
                                    handleInputChange("notes", e.target.value)
                                }
                                placeholder="Contoh: Titip beli: Indomaret, beli susu 2, roti 1"
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
                            {formData.kurirId && formData.kurirId !== "no-assign" && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                                    ✓ Order akan langsung di-assign dan status menjadi &quot;OFFERED&quot;
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
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

                    {/* Hint */}
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
