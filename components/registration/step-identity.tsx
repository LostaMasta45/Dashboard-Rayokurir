"use client";

import React from "react";
import { RegistrationData, MITRA_TYPES } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MitraCardList, MitraCardWidget, MitraCardGlass, MitraCardStory } from "@/components/mitra2/MitraCards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MITRA_CATEGORIES } from "@/lib/auth"; // Reuse existing categories
import { Utensils, Store, Pill, ShoppingBasket, Gift } from "lucide-react"; // Icons for types

interface StepIdentityProps {
  data: RegistrationData;
  updateData: (updates: Partial<RegistrationData>) => void;
}

export function StepIdentity({ data, updateData }: StepIdentityProps) {

  // Map icons for display
  const getIcon = (id: string) => {
    switch (id) {
      case 'food': return <Utensils className="w-6 h-6" />;
      case 'retail': return <Store className="w-6 h-6" />;
      case 'pharmacy': return <Pill className="w-6 h-6" />;
      case 'service': return <ShoppingBasket className="w-6 h-6" />;
      case 'special': return <Gift className="w-6 h-6" />;
      default: return <Store className="w-6 h-6" />;
    }
  };

  // Toggle category
  const toggleCategory = (id: string) => {
    const current = data.kategori || [];
    const updated = current.includes(id)
      ? current.filter(c => c !== id)
      : [...current, id];
    updateData({ kategori: updated });
  };

  // Construct dummy data for preview
  const previewData = {
    id: 0,
    nama: data.nama || "Nama Usaha Anda",
    lokasi: data.lokasi || "Lokasi Anda",
    category: data.kategori.length > 0
      ? MITRA_CATEGORIES.find(c => c.id === data.kategori[0])?.label || "Kategori"
      : "Kategori",
    type: data.type,
    rating: 0, // New
    waktu: "15-30 mnt", // Default
    harga: 15000,
    cover: data.cover || "https://images.unsplash.com/photo-1555126634-323283e090fa?w=500&q=80", // Default placeholder
    isBuka: false // Default closed
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1 mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Identitas Usaha</h2>
        <p className="text-sm text-gray-500">Agar pelanggan mudah mengenali usaha Anda.</p>
      </div>

      {/* LIVE PREVIEW SECTION (Mobile Only) */}
      <div className="md:hidden bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
        <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider text-center">Tampilan di Aplikasi</p>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm">
            <TabsTrigger value="list" className="text-[10px] h-7 rounded-lg">List</TabsTrigger>
            <TabsTrigger value="widget" className="text-[10px] h-7 rounded-lg">Apps</TabsTrigger>
            <TabsTrigger value="glass" className="text-[10px] h-7 rounded-lg">Glass</TabsTrigger>
            <TabsTrigger value="story" className="text-[10px] h-7 rounded-lg">Story</TabsTrigger>
          </TabsList>

          <div className="min-h-[240px] flex items-center justify-center relative">
            <TabsContent value="list" className="w-full mt-0 animate-in zoom-in-50 duration-300">
              <div className="pointer-events-none transform scale-95 origin-center select-none flex justify-center">
                <MitraCardList data={previewData as any} />
              </div>
            </TabsContent>
            <TabsContent value="widget" className="w-full mt-0 animate-in zoom-in-50 duration-300 flex flex-col items-center">
              <div className="pointer-events-none transform scale-95 origin-center select-none px-2">
                <MitraCardWidget data={previewData as any} />
              </div>
            </TabsContent>
            <TabsContent value="glass" className="w-full mt-0 animate-in zoom-in-50 duration-300 flex flex-col items-center">
              <div className="pointer-events-none transform scale-95 origin-center select-none">
                <MitraCardGlass data={previewData as any} />
              </div>
            </TabsContent>
            <TabsContent value="story" className="w-full mt-0 animate-in zoom-in-50 duration-300 flex flex-col items-center">
              <div className="pointer-events-none transform scale-95 origin-center select-none">
                <MitraCardStory data={previewData as any} />
              </div>
            </TabsContent>
          </div>

          <p className="text-[10px] text-gray-400 text-center mt-2 italic">
            *Geser tab untuk melihat variasi tampilan
          </p>
        </Tabs>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Nama Usaha Anda</Label>
          <Input
            placeholder="Contoh: Seblak Prasmanan Mbak Dini"
            value={data.nama}
            onChange={(e) => updateData({ nama: e.target.value })}
            className="mt-1.5 h-12 text-lg"
            autoFocus
          />
        </div>

        <div>
          <Label className="text-base font-semibold mb-2 block">Jenis Usaha</Label>
          <div className="grid grid-cols-2 gap-3">
            {MITRA_TYPES.map((type) => (
              <div
                key={type.id}
                onClick={() => updateData({ type: type.id as any })}
                className={`
                                    cursor-pointer rounded-xl p-3 border-2 transition-all duration-200 relative overflow-hidden
                                    ${data.type === type.id
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200'
                  }
                                `}
              >
                <div className={`mb-2 ${data.type === type.id ? 'text-teal-600' : 'text-gray-400'}`}>
                  {getIcon(type.id)}
                </div>
                <div className="font-bold text-sm text-gray-900 dark:text-white">{type.label}</div>
                <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{type.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-base font-semibold mb-2 block">Kategori (Bisa lebih dari 1)</Label>
          <div className="flex flex-wrap gap-2">
            {MITRA_CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                type="button"
                variant={data.kategori.includes(cat.id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleCategory(cat.id)}
                className={`
                                    rounded-full transition-all
                                    ${data.kategori.includes(cat.id)
                    ? "bg-teal-600 hover:bg-teal-700 text-white border-transparent"
                    : "bg-white dark:bg-gray-900 border-gray-200 text-gray-600 hover:bg-gray-50"
                  }
                                `}
              >
                <span className="mr-1">{cat.icon}</span> {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
