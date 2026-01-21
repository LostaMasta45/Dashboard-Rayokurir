"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Utensils, Store, Pill, Shirt, Star } from "lucide-react";
import { MITRA_CATEGORIES, type Mitra } from "@/lib/auth";

interface StepIdentityProps {
  formData: Partial<Mitra>;
  updateFormData: (data: Partial<Mitra>) => void;
}

export function StepIdentity({ formData, updateFormData }: StepIdentityProps) {
  const toggleCategory = (catId: string) => {
    const current = formData.kategori || [];
    const updated = current.includes(catId)
      ? current.filter((c) => c !== catId)
      : [...current, catId];
    updateFormData({ kategori: updated });
  };

  const types = [
    { id: "food", label: "Kuliner", icon: <Utensils className="h-6 w-6" /> },
    { id: "retail", label: "Warung/Toko", icon: <Store className="h-6 w-6" /> },
    { id: "pharmacy", label: "Apotek", icon: <Pill className="h-6 w-6" /> },
    { id: "service", label: "Jasa", icon: <Shirt className="h-6 w-6" /> },
    { id: "special", label: "PO / Katering", icon: <Star className="h-6 w-6" /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mulai dari Identitas</h2>
        <p className="text-gray-500">Ceritakan sedikit tentang usaha Anda</p>
      </div>

      {/* Tipe Usaha */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Jenis Usaha Utama</Label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {types.map((t) => (
            <div
              key={t.id}
              onClick={() => updateFormData({ type: t.id as any })}
              className={`cursor-pointer flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${
                formData.type === t.id
                  ? "border-teal-500 bg-teal-50 text-teal-700"
                  : "border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              <div className={formData.type === t.id ? "text-teal-600" : "text-gray-400"}>
                {t.icon}
              </div>
              <span className="text-xs font-medium text-center">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nama Usaha */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Nama Usaha / Toko</Label>
        <Input
          placeholder="Contoh: Seblak Prasmanan Mbak Dini"
          value={formData.nama}
          onChange={(e) => updateFormData({ nama: e.target.value })}
          className="h-12 text-lg"
          autoFocus
        />
      </div>

      {/* Kategori */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Kategori Produk (Boleh > 1)</Label>
        <div className="flex flex-wrap gap-2">
          {MITRA_CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => toggleCategory(cat.id)}
              className={`rounded-full transition-all ${
                formData.kategori?.includes(cat.id)
                  ? "border-teal-500 bg-teal-50 text-teal-700 font-medium"
                  : "text-gray-600 border-gray-200"
              }`}
            >
              <span className="mr-1.5">{cat.icon}</span>
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Deskripsi */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Deskripsi Singkat (Opsional)</Label>
        <Textarea
          placeholder="Sedia aneka seblak, bakso aci, dan minuman segar..."
          value={formData.deskripsi}
          onChange={(e) => updateFormData({ deskripsi: e.target.value })}
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
}
