"use client";

import { type Mitra } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Clock, Store } from "lucide-react";

interface StepReviewProps {
  formData: Partial<Mitra>;
}

export function StepReview({ formData }: StepReviewProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Cek Kembali</h2>
        <p className="text-gray-500">Pastikan data sudah benar sebelum daftar</p>
      </div>

      <div className="bg-gradient-to-br from-teal-50 to-white border border-teal-100 rounded-2xl p-5 shadow-sm">
         <div className="flex items-start justify-between mb-4">
            <div>
                <Badge className="bg-teal-600 mb-2 hover:bg-teal-700">{formData.type?.toUpperCase()}</Badge>
                <h3 className="text-xl font-bold text-gray-900">{formData.nama}</h3>
                <p className="text-sm text-gray-500 mt-1">{formData.deskripsi || "Tidak ada deskripsi"}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
                {formData.logo ? (
                    <img src={formData.logo} alt="logo" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-teal-100 text-teal-600 font-bold text-xl">
                        {formData.nama?.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
         </div>

         <div className="space-y-3 pt-4 border-t border-teal-100/50">
            <div className="flex items-center gap-3 text-sm text-gray-700">
                <MapPin className="h-4 w-4 text-teal-500" />
                <span>{formData.lokasi}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
                <Phone className="h-4 w-4 text-teal-500" />
                <span>{formData.whatsapp}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
                <Clock className="h-4 w-4 text-teal-500" />
                <span>Estimasi: {formData.waktuAntar}</span>
            </div>
         </div>

         <div className="mt-4 flex flex-wrap gap-2">
            {formData.kategori?.map((k) => (
                <span key={k} className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-600 font-medium shadow-sm">
                    {k}
                </span>
            ))}
         </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-xl text-xs text-yellow-800 flex gap-2 items-start">
         <Store className="h-5 w-5 flex-shrink-0" />
         <p>
            Setelah klik <b>Daftarkan Usaha</b>, data akan dikirim ke admin untuk verifikasi. 
            Toko Anda belum akan tampil di aplikasi sampai diaktifkan oleh Admin.
         </p>
      </div>
    </div>
  );
}
