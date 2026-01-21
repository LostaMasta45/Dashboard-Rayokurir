"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, MapPin } from "lucide-react";
import { type Mitra } from "@/lib/auth";

interface StepContactProps {
  formData: Partial<Mitra>;
  updateFormData: (data: Partial<Mitra>) => void;
}

const DESA_LIST = [
  "Sumobito", "Mentoro", "Mlaras", "Segodorejo", "Sebani", 
  "Curahmalang", "Budugsidorejo", "Trawasan", "Jogoloyo", 
  "Palrejo", "Plemahan", "Talunkidul", "Kendalsari", "Badas"
];

export function StepContact({ formData, updateFormData }: StepContactProps) {
  // Auto-format WA number
  const handleWaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.startsWith("0")) val = "62" + val.slice(1);
    if (val.startsWith("8")) val = "628" + val.slice(1);
    updateFormData({ whatsapp: val });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Kontak & Lokasi</h2>
        <p className="text-gray-500">Agar kurir dan pelanggan mudah menemukanmu</p>
      </div>

      {/* WhatsApp */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Nomor WhatsApp Admin/Toko</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="tel"
            placeholder="8123xxxxxxx"
            value={formData.whatsapp}
            onChange={handleWaChange}
            className="pl-10 h-12 text-lg"
          />
        </div>
        <p className="text-xs text-gray-500">
          *Pastikan nomor aktif WA. Format otomatis diubah ke 62.
        </p>
      </div>

      {/* Area / Desa */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Area / Desa</Label>
        <Select
          value={formData.lokasi?.split(",")[0] || ""}
          onValueChange={(val) => {
             // Keep existing detail if any
             const currentDetail = formData.lokasi?.includes(",") ? formData.lokasi.split(",").slice(1).join(",").trim() : "";
             updateFormData({ lokasi: currentDetail ? `${val}, ${currentDetail}` : val });
          }}
        >
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Pilih Desa" />
          </SelectTrigger>
          <SelectContent>
            {DESA_LIST.sort().map((desa) => (
              <SelectItem key={desa} value={desa}>
                {desa}
              </SelectItem>
            ))}
            <SelectItem value="Lainnya">Lainnya (Luar Sumobito)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alamat Lengkap */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Detail Alamat / Patokan</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Contoh: Depan Balai Desa, Pagar Hitam"
            value={formData.lokasi?.includes(",") ? formData.lokasi.split(",").slice(1).join(",").trim() : ""}
            onChange={(e) => {
                const desa = formData.lokasi?.split(",")[0] || "";
                updateFormData({ lokasi: desa ? `${desa}, ${e.target.value}` : e.target.value });
            }}
            className="pl-10 h-12"
          />
        </div>
        <p className="text-xs text-gray-500">
          *Tulis patokan agar kurir tidak nyasar.
        </p>
      </div>
    </div>
  );
}
