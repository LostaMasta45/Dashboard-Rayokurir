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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    getCouriers,
    updateOrder,
    type Order,
    type Courier,
} from "@/lib/auth";
import { toast } from "sonner";
import { Pencil, User, MapPin, Package, Wallet, Settings, AlertTriangle } from "lucide-react";

interface EditOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOrderUpdated: () => void;
    order: Order | null;
}

// Section header component
function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
    return (
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                <Icon className="h-5 w-5 text-blue-500" />
            </div>
            <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
        </div>
    );
}

export function EditOrderModal({
    isOpen,
    onClose,
    onOrderUpdated,
    order,
}: EditOrderModalProps) {
    const [formData, setFormData] = useState({
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
        ongkirPaymentMethod: "CASH",
        notes: "",
        kurirId: "",
        status: "NEW" as Order["status"],
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [couriers, setCouriers] = useState<Courier[]>([]);

    // Load couriers and populate form when modal opens
    useEffect(() => {
        if (isOpen && order) {
            loadCouriers();
            populateForm(order);
        }
    }, [isOpen, order]);

    const loadCouriers = async () => {
        const data = await getCouriers();
        setCouriers(data.filter((c) => c.aktif));
    };

    const populateForm = (order: Order) => {
        setFormData({
            pengirimNama: order.pengirim.nama || "",
            pengirimWa: order.pengirim.wa || "",
            pickupAlamat: order.pickup.alamat || "",
            pickupMapsLink: order.pickup.mapsLink || "",
            dropoffAlamat: order.dropoff.alamat || "",
            dropoffMapsLink: order.dropoff.mapsLink || "",
            jenisOrder: order.jenisOrder || "",
            serviceType: order.serviceType || "",
            addonReturnPP: order.addons?.returnPP || false,
            addonBulky: order.addons?.bulky || false,
            addonHeavy: order.addons?.heavy || false,
            addonWaitingFee: order.addons?.waitingFee || false,
            addonWaitingFeeAmount: order.addons?.waitingFeeAmount?.toString() || "",
            ongkir: order.ongkir?.toString() || "",
            danaTalangan: order.danaTalangan?.toString() || "",
            codNominal: order.cod?.nominal?.toString() || "",
            bayarOngkir: order.bayarOngkir || "NON_COD",
            ongkirPaymentMethod: order.ongkirPaymentMethod || "CASH",
            notes: order.notes || "",
            kurirId: order.kurirId || "",
            status: order.status,
        });
        setErrors({});
    };

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.pengirimNama.trim()) newErrors.pengirimNama = "Nama wajib diisi";
        if (!formData.pickupAlamat.trim()) newErrors.pickupAlamat = "Alamat pickup wajib diisi";
        if (!formData.dropoffAlamat.trim()) newErrors.dropoffAlamat = "Alamat dropoff wajib diisi";
        if (!formData.ongkir || parseFloat(formData.ongkir) <= 0) newErrors.ongkir = "Ongkir wajib diisi";
        if (!formData.jenisOrder) newErrors.jenisOrder = "Jenis order wajib dipilih";
        if (!formData.serviceType) newErrors.serviceType = "Service type wajib dipilih";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || !order) return;

        setIsSubmitting(true);

        try {
            const codNominal = Number.parseFloat(formData.codNominal) || 0;
            const danaTalangan = Number.parseFloat(formData.danaTalangan) || 0;
            const ongkir = Number.parseFloat(formData.ongkir) || 0;
            const waitingFeeAmount = Number.parseFloat(formData.addonWaitingFeeAmount) || 0;
            const now = new Date();

            const updatedOrder: Order = {
                ...order,
                pengirim: {
                    nama: formData.pengirimNama.trim(),
                    wa: formData.pengirimWa.trim(),
                },
                pickup: {
                    alamat: formData.pickupAlamat.trim(),
                    mapsLink: formData.pickupMapsLink.trim() || undefined,
                },
                dropoff: {
                    alamat: formData.dropoffAlamat.trim(),
                    mapsLink: formData.dropoffMapsLink.trim() || undefined,
                },
                kurirId: formData.kurirId && formData.kurirId !== "no-assign" ? formData.kurirId : null,
                status: formData.status,
                jenisOrder: formData.jenisOrder as Order["jenisOrder"],
                serviceType: formData.serviceType as Order["serviceType"],
                addons: {
                    returnPP: formData.addonReturnPP,
                    bulky: formData.addonBulky,
                    heavy: formData.addonHeavy,
                    waitingFee: formData.addonWaitingFee,
                    waitingFeeAmount: waitingFeeAmount,
                },
                ongkir: ongkir,
                danaTalangan: danaTalangan,
                bayarOngkir: formData.bayarOngkir as "NON_COD" | "COD",
                cod: {
                    nominal: codNominal,
                    isCOD: codNominal > 0,
                    codPaid: order.cod.codPaid,
                },
                ongkirPaymentMethod: formData.bayarOngkir === "COD"
                    ? formData.ongkirPaymentMethod as "CASH" | "QRIS" | "TRANSFER"
                    : undefined,
                notes: formData.notes.trim(),
                auditLog: [
                    ...(order.auditLog || []),
                    {
                        event: "ORDER_UPDATED",
                        at: now.toISOString(),
                        actorType: "ADMIN" as const,
                        actorId: "admin",
                        meta: { updatedFields: Object.keys(formData) }
                    }
                ],
            };

            await updateOrder(updatedOrder);
            toast.success("✅ Order berhasil diupdate!");
            onOrderUpdated();
            onClose();
        } catch (error) {
            console.error("Error updating order:", error);
            toast.error("Gagal mengupdate order");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!order) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl w-[95vw] max-h-[95vh] overflow-y-auto mx-4 sm:mx-auto">
                <DialogHeader className="pb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Pencil className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">Edit Order</DialogTitle>
                            <p className="text-sm text-muted-foreground">
                                Order #{order.id.slice(-6)} • {new Date(order.createdAt).toLocaleDateString("id-ID")}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Status Section */}
                    <div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-800/50">
                        <Label className="text-sm font-medium">Status Order</Label>
                        <Select value={formData.status} onValueChange={(v) => handleInputChange("status", v)}>
                            <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NEW">🆕 Baru</SelectItem>
                                <SelectItem value="OFFERED">📤 Ditawarkan</SelectItem>
                                <SelectItem value="ACCEPTED">✅ Diterima</SelectItem>
                                <SelectItem value="OTW_PICKUP">🚗 OTW Pickup</SelectItem>
                                <SelectItem value="PICKED">📦 Sudah Dijemput</SelectItem>
                                <SelectItem value="OTW_DROPOFF">🚚 OTW Dropoff</SelectItem>
                                <SelectItem value="NEED_POD">📸 Butuh POD</SelectItem>
                                <SelectItem value="DELIVERED">🎉 Terkirim</SelectItem>
                                <SelectItem value="SELESAI">✅ Selesai</SelectItem>
                                <SelectItem value="CANCELLED">❌ Dibatalkan</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Customer Section */}
                    <div className="space-y-4">
                        <SectionHeader icon={User} title="Customer" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="Nama Pengirim" required error={errors.pengirimNama}>
                                <FormInput
                                    value={formData.pengirimNama}
                                    onChange={(e) => handleInputChange("pengirimNama", e.target.value)}
                                    placeholder="Nama pengirim"
                                />
                            </FormField>
                            <FormField label="Nomor WhatsApp">
                                <FormInput
                                    value={formData.pengirimWa}
                                    onChange={(e) => handleInputChange("pengirimWa", e.target.value)}
                                    placeholder="08xxxxxxxxxx"
                                />
                            </FormField>
                        </div>
                    </div>

                    {/* Route Section */}
                    <div className="space-y-4">
                        <SectionHeader icon={MapPin} title="Rute" />
                        <div className="grid grid-cols-1 gap-4">
                            <FormField label="Alamat Pickup" required error={errors.pickupAlamat}>
                                <FormTextarea
                                    value={formData.pickupAlamat}
                                    onChange={(e) => handleInputChange("pickupAlamat", e.target.value)}
                                    placeholder="Alamat lengkap pickup"
                                    rows={2}
                                />
                            </FormField>
                            <FormField label="Alamat Dropoff" required error={errors.dropoffAlamat}>
                                <FormTextarea
                                    value={formData.dropoffAlamat}
                                    onChange={(e) => handleInputChange("dropoffAlamat", e.target.value)}
                                    placeholder="Alamat lengkap dropoff"
                                    rows={2}
                                />
                            </FormField>
                        </div>
                    </div>

                    {/* Service Section */}
                    <div className="space-y-4">
                        <SectionHeader icon={Package} title="Layanan" />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Jenis Order" required error={errors.jenisOrder}>
                                <Select value={formData.jenisOrder} onValueChange={(v) => handleInputChange("jenisOrder", v)}>
                                    <SelectTrigger><SelectValue placeholder="Pilih jenis" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Antar Barang">📦 Antar Barang</SelectItem>
                                        <SelectItem value="Jemput Barang">🏠 Jemput Barang</SelectItem>
                                        <SelectItem value="Titip Beli">🛒 Titip Beli</SelectItem>
                                        <SelectItem value="Dokumen">📄 Dokumen</SelectItem>
                                        <SelectItem value="Lainnya">🔧 Lainnya</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormField>
                            <FormField label="Service Type" required error={errors.serviceType}>
                                <Select value={formData.serviceType} onValueChange={(v) => handleInputChange("serviceType", v)}>
                                    <SelectTrigger><SelectValue placeholder="Pilih service" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Regular">🚗 Regular</SelectItem>
                                        <SelectItem value="Express">⚡ Express</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormField>
                        </div>
                    </div>

                    {/* Financial Section */}
                    <div className="space-y-4">
                        <SectionHeader icon={Wallet} title="Keuangan" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <FormField label="Ongkir (Rp)" required error={errors.ongkir}>
                                <FormInput
                                    type="number"
                                    value={formData.ongkir}
                                    onChange={(e) => handleInputChange("ongkir", e.target.value)}
                                    placeholder="0"
                                />
                            </FormField>
                            <FormField label="Dana Talangan (Rp)">
                                <FormInput
                                    type="number"
                                    value={formData.danaTalangan}
                                    onChange={(e) => handleInputChange("danaTalangan", e.target.value)}
                                    placeholder="0"
                                />
                            </FormField>
                            <FormField label="COD (Rp)">
                                <FormInput
                                    type="number"
                                    value={formData.codNominal}
                                    onChange={(e) => handleInputChange("codNominal", e.target.value)}
                                    placeholder="0"
                                />
                            </FormField>
                        </div>
                        <div className="flex items-center gap-4">
                            <Label>Cara Bayar Ongkir:</Label>
                            <Select value={formData.bayarOngkir} onValueChange={(v) => handleInputChange("bayarOngkir", v)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NON_COD">Transfer</SelectItem>
                                    <SelectItem value="COD">COD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Courier Section */}
                    <div className="space-y-4">
                        <SectionHeader icon={Settings} title="Kurir" />
                        <Select value={formData.kurirId || "no-assign"} onValueChange={(v) => handleInputChange("kurirId", v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih kurir" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="no-assign">-- Belum assign kurir --</SelectItem>
                                {couriers.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${c.online ? 'bg-green-500' : 'bg-gray-400'}`} />
                                            {c.nama}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Notes */}
                    <FormField label="Catatan">
                        <FormTextarea
                            value={formData.notes}
                            onChange={(e) => handleInputChange("notes", e.target.value)}
                            placeholder="Catatan tambahan..."
                            rows={2}
                        />
                    </FormField>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
                            {isSubmitting ? "Menyimpan..." : "💾 Simpan Perubahan"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
