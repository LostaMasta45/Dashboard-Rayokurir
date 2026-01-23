"use client";

import React from "react";
import { RegistrationData } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, User, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StepContactProps {
  data: RegistrationData;
  updateData: (updates: Partial<RegistrationData>) => void;
}

export function StepContact({ data, updateData }: StepContactProps) {

  // Auto-format WA (+62)
  const handleWaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // Remove non-digits

    // If starts with 0 (e.g. 0812...), remove 0 and ensure 62 prefix logic if needed, 
    // but for simplicity let's just keep it raw but hint user.
    // Actually, let's auto-strip 62 or 0 and just save the number, then append 62 when saving if we want.
    // Or just let user type 08... and handle it in backend.
    // Best practice for Indo: Let them type 08... and we convert to 628... on submit.

    updateData({ whatsapp: val });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1 mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Kontak & Lokasi</h2>
        <p className="text-sm text-gray-500">Info ini untuk Admin dan Kurir.</p>
      </div>

      <div className="space-y-5">
        <div>
          <Label className="text-base font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            Nama Pemilik
          </Label>
          <Input
            placeholder="Nama lengkap Anda"
            value={data.ownerName}
            onChange={(e) => updateData({ ownerName: e.target.value })}
            className="mt-1.5 h-12"
          />
        </div>

        <div>
          <Label className="text-base font-semibold flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-500" />
            Nomor WhatsApp
          </Label>
          <div className="relative mt-1.5">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              +62
            </div>
            <Input
              type="tel"
              placeholder="81234567890"
              value={data.whatsapp.startsWith('62') ? data.whatsapp.substring(2) : (data.whatsapp.startsWith('0') ? data.whatsapp.substring(1) : data.whatsapp)}
              onChange={(e) => {
                // Always store clean number, we can format on submit
                const val = e.target.value.replace(/\D/g, '');
                updateData({ whatsapp: val });
              }}
              className="h-12 pl-12"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Pastikan nomor aktif WA untuk konfirmasi pendaftaran.</p>
        </div>

        <div>
          <Label className="text-base font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            Alamat / Lokasi
          </Label>
          <Input
            placeholder="Contoh: Desa Sumobito, Dsn. Ingas Pendowo"
            value={data.lokasi}
            onChange={(e) => updateData({ lokasi: e.target.value })}
            className="mt-1.5 h-12"
          />
          <Alert className="mt-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-none">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Tulis alamat yang jelas, atau patokan agar kurir mudah menemukan.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
