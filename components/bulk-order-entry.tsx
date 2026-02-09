"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    getCouriers,
    saveOrder,
    generateId,
    type Order,
    type Courier,
} from "@/lib/auth";
import { toast } from "sonner";
import { Zap, Plus, Trash2, CalendarIcon, Save, AlertTriangle, Package } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface BulkOrderEntryProps {
    onOrdersAdded: () => void;
}

interface BulkOrderRow {
    id: string;
    pengirimNama: string;
    pickupAlamat: string;
    dropoffAlamat: string;
    ongkir: string;
    kurirId: string;
    notes: string;
}

const emptyRow = (): BulkOrderRow => ({
    id: crypto.randomUUID(),
    pengirimNama: "",
    pickupAlamat: "",
    dropoffAlamat: "",
    ongkir: "",
    kurirId: "",
    notes: "",
});

export function BulkOrderEntry({ onOrdersAdded }: BulkOrderEntryProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [rows, setRows] = useState<BulkOrderRow[]>([emptyRow(), emptyRow(), emptyRow()]);
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadCouriers();
    }, []);

    const loadCouriers = async () => {
        const data = await getCouriers();
        setCouriers(data.filter((c) => c.aktif));
    };

    const addRow = () => {
        setRows([...rows, emptyRow()]);
    };

    const removeRow = (id: string) => {
        if (rows.length <= 1) return;
        setRows(rows.filter((r) => r.id !== id));
    };

    const updateRow = (id: string, field: keyof BulkOrderRow, value: string) => {
        setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    };

    const getValidRows = () => {
        return rows.filter(
            (r) =>
                r.pengirimNama.trim() &&
                r.pickupAlamat.trim() &&
                r.dropoffAlamat.trim() &&
                r.ongkir &&
                parseFloat(r.ongkir) > 0 &&
                r.kurirId
        );
    };

    const handleSubmitAll = async () => {
        const validRows = getValidRows();

        if (validRows.length === 0) {
            toast.error("Tidak ada data valid untuk disimpan. Pastikan semua field terisi.");
            return;
        }

        setIsSubmitting(true);

        try {
            const now = new Date();

            for (const row of validRows) {
                const ongkir = parseFloat(row.ongkir) || 0;

                const newOrder: Order = {
                    id: generateId(),
                    createdAt: selectedDate.toISOString(),
                    createdDate: selectedDate.toDateString(),
                    pengirim: {
                        nama: row.pengirimNama.trim(),
                        wa: "",
                    },
                    pickup: {
                        alamat: row.pickupAlamat.trim(),
                    },
                    dropoff: {
                        alamat: row.dropoffAlamat.trim(),
                    },
                    kurirId: row.kurirId,
                    status: "SELESAI",
                    jenisOrder: "Antar Barang",
                    serviceType: "Regular",
                    addons: {
                        returnPP: false,
                        bulky: false,
                        heavy: false,
                        waitingFee: false,
                        waitingFeeAmount: 0,
                    },
                    ongkir: ongkir,
                    danaTalangan: 0,
                    talanganDiganti: true,
                    bayarOngkir: "COD",
                    talanganReimbursed: true,
                    cod: {
                        nominal: 0,
                        isCOD: false,
                        codPaid: true,
                    },
                    codSettled: true,
                    nonCodPaid: true,
                    ongkirPaymentStatus: "PAID",
                    notes: row.notes.trim(),
                    podPhotos: [],
                    auditLog: [
                        {
                            event: "ORDER_BULK_HISTORICAL_ENTRY",
                            at: now.toISOString(),
                            actorType: "ADMIN",
                            actorId: "admin",
                            meta: {
                                isHistoricalEntry: true,
                                originalDate: selectedDate.toISOString(),
                                bulkEntry: true,
                            },
                        },
                    ],
                };

                await saveOrder(newOrder);
            }

            toast.success(
                `✅ ${validRows.length} order historis berhasil disimpan untuk ${format(selectedDate, "d MMMM yyyy", { locale: idLocale })}!`
            );

            // Reset form
            setRows([emptyRow(), emptyRow(), emptyRow()]);
            onOrdersAdded();
        } catch (error) {
            console.error("Error saving bulk orders:", error);
            toast.error("Gagal menyimpan order. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const validCount = getValidRows().length;
    const totalOngkir = getValidRows().reduce((sum, r) => sum + (parseFloat(r.ongkir) || 0), 0);

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Zap className="h-5 w-5 text-orange-500" />
                            Quick Entry Mode
                        </CardTitle>
                        <CardDescription>
                            Input cepat banyak orderan historis sekaligus
                        </CardDescription>
                    </div>

                    {/* Date Picker */}
                    <div className="flex items-center gap-2">
                        <Label className="text-sm whitespace-nowrap">📅 Tanggal:</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-[200px] justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(selectedDate, "EEEE, d MMM yyyy", { locale: idLocale })}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => date && setSelectedDate(date)}
                                    disabled={(date) => date > new Date()}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Warning Alert */}
                <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-300 text-sm">
                        Semua order akan disimpan sebagai <strong>SELESAI</strong> tanpa notifikasi ke Bot Telegram.
                    </AlertDescription>
                </Alert>

                {/* Table */}
                <div className="border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[40px]">#</TableHead>
                                <TableHead className="min-w-[140px]">Pengirim</TableHead>
                                <TableHead className="min-w-[180px]">Alamat Pickup</TableHead>
                                <TableHead className="min-w-[180px]">Alamat Dropoff</TableHead>
                                <TableHead className="min-w-[100px]">Ongkir</TableHead>
                                <TableHead className="min-w-[140px]">Kurir</TableHead>
                                <TableHead className="min-w-[120px]">Catatan</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((row, index) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium text-muted-foreground">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            placeholder="Nama"
                                            value={row.pengirimNama}
                                            onChange={(e) => updateRow(row.id, "pengirimNama", e.target.value)}
                                            className="h-9"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            placeholder="Alamat pickup"
                                            value={row.pickupAlamat}
                                            onChange={(e) => updateRow(row.id, "pickupAlamat", e.target.value)}
                                            className="h-9"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            placeholder="Alamat dropoff"
                                            value={row.dropoffAlamat}
                                            onChange={(e) => updateRow(row.id, "dropoffAlamat", e.target.value)}
                                            className="h-9"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            placeholder="Rp"
                                            value={row.ongkir}
                                            onChange={(e) => updateRow(row.id, "ongkir", e.target.value)}
                                            className="h-9"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={row.kurirId}
                                            onValueChange={(value) => updateRow(row.id, "kurirId", value)}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Pilih" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {couriers.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.nama}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            placeholder="Optional"
                                            value={row.notes}
                                            onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                                            className="h-9"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeRow(row.id)}
                                            disabled={rows.length <= 1}
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Add Row Button */}
                <Button variant="outline" onClick={addRow} className="w-full border-dashed">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Baris
                </Button>

                {/* Summary & Submit */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-muted-foreground">Valid:</span>
                            <Badge variant={validCount > 0 ? "default" : "secondary"}>
                                {validCount} order
                            </Badge>
                        </div>
                        {validCount > 0 && (
                            <div className="text-sm">
                                <span className="text-muted-foreground">Total:</span>{" "}
                                <span className="font-semibold text-green-600">
                                    Rp {totalOngkir.toLocaleString("id-ID")}
                                </span>
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={handleSubmitAll}
                        disabled={validCount === 0 || isSubmitting}
                        className="bg-rayo-primary hover:bg-rayo-dark"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {isSubmitting
                            ? "Menyimpan..."
                            : `Simpan ${validCount} Order`}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
