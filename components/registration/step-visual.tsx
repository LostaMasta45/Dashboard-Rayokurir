"use client";

import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/image-upload";
import { ImageIcon } from "lucide-react";
import { type Mitra } from "@/lib/auth";

interface StepVisualProps {
  formData: Partial<Mitra>;
  updateFormData: (data: Partial<Mitra>) => void;
}

export function StepVisual({ formData, updateFormData }: StepVisualProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tampilan Toko</h2>
        <p className="text-gray-500">Buat tokomu menarik di aplikasi</p>
      </div>

      {/* Logo */}
      <div className="space-y-3">
        <Label className="text-base font-semibold block">Logo Toko (Opsional)</Label>
        <div className="flex gap-4 items-start">
          <div className="w-32 h-32 flex-shrink-0">
             <ImageUpload
                value={formData.logo || ""}
                onChange={(url) => updateFormData({ logo: url })}
                bucket="mitra-images"
                folder="logos"
                placeholder="Logo"
                aspectRatio="square"
                className="w-full h-full rounded-full overflow-hidden border-2 border-dashed border-gray-300"
              />
          </div>
          <div className="text-sm text-gray-500 pt-2">
            <p className="mb-2">Disarankan rasio 1:1 (Kotak/Bulat).</p>
            <p>Jika tidak ada, kami akan gunakan inisial nama toko.</p>
          </div>
        </div>
      </div>

      {/* Cover */}
      <div className="space-y-3">
        <Label className="text-base font-semibold block">Foto Depan / Makanan (Cover)</Label>
        <div className="w-full aspect-[2/1]">
           <ImageUpload
              value={formData.cover || ""}
              onChange={(url) => updateFormData({ cover: url })}
              bucket="mitra-images"
              folder="covers"
              placeholder="Upload Foto Cover"
              aspectRatio="video"
              className="w-full h-full rounded-xl border-2 border-dashed border-gray-300"
            />
        </div>
        <div className="flex gap-2 text-xs text-gray-400 mt-2">
          <ImageIcon className="h-4 w-4" />
          <span>Bisa foto depan toko atau foto menu andalan.</span>
        </div>
      </div>

      {/* Preview Mini */}
      <div className="bg-gray-50 p-4 rounded-xl mt-6">
        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Preview Kartu Mitra</p>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex gap-3">
            <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                {(formData.logo || formData.cover) ? (
                    <img src={formData.logo || formData.cover} className="w-full h-full object-cover" alt="preview" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                )}
            </div>
            <div>
                <h4 className="font-bold text-gray-900 line-clamp-1">{formData.nama || "Nama Toko"}</h4>
                <p className="text-xs text-gray-500 mb-1">{formData.type?.toUpperCase()} • {formData.lokasi || "Lokasi"}</p>
                <div className="flex gap-1">
                    {formData.kategori?.slice(0, 2).map(k => (
                        <span key={k} className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">{k}</span>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
