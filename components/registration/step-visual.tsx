"use client";

import React from "react";
import { RegistrationData } from "./types";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/image-upload";

interface StepVisualProps {
  data: RegistrationData;
  updateData: (updates: Partial<RegistrationData>) => void;
}

export function StepVisual({ data, updateData }: StepVisualProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1 mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Foto & Visual</h2>
        <p className="text-sm text-gray-500">Buat toko Anda menarik di mata pelanggan.</p>
      </div>

      <div className="space-y-8">
        <div>
          <Label className="text-base font-semibold mb-3 block">Logo Toko (Opsional)</Label>
          <ImageUpload
            value={data.logo}
            onChange={(url) => updateData({ logo: url })}
            folder="logos"
            placeholder="Upload Logo"
            aspectRatio="square"
            className="w-32 mx-auto"
          />
          <p className="text-center text-xs text-gray-400 mt-2">Bisa dilewati jika belum ada</p>
        </div>

        <div>
          <Label className="text-base font-semibold mb-3 block">Foto Sampul / Tempat</Label>
          <ImageUpload
            value={data.cover}
            onChange={(url) => updateData({ cover: url })}
            folder="covers"
            placeholder="Upload Foto Tempat"
            aspectRatio="video"
          />
          <p className="text-xs text-gray-400 mt-2">
            Foto depan toko atau makanan andalan.
          </p>
        </div>
      </div>
    </div>
  );
}
