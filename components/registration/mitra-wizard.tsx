"use client";

import React, { useState } from "react";
import { RegistrationData, INITIAL_DATA, RegistrationStep } from "./types";
import { StepIdentity } from "./step-identity";
import { StepContact } from "./step-contact";
import { StepMenu } from "./step-menu";
import { StepVisual } from "./step-visual";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Store } from "lucide-react";
import { toast } from "sonner";
import { saveMitra, saveMenuItem, generateId, MITRA_CATEGORIES } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { MitraCardList, MitraCardWidget, MitraCardGlass, MitraCardStory } from "@/components/mitra2/MitraCards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeToggle } from "@/components/mode-toggle";

// Simple progress indicator
const ProgressBar = ({ currentStep }: { currentStep: RegistrationStep }) => {
  const steps: RegistrationStep[] = ['identity', 'contact', 'menu', 'visual'];
  const currentIndex = steps.indexOf(currentStep); // -1 for success

  if (currentStep === 'success') return null;

  return (
    <div className="flex gap-2 mb-6 px-1">
      {steps.map((s, idx) => (
        <div
          key={s}
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${idx <= currentIndex ? 'bg-teal-500' : 'bg-gray-200 dark:bg-gray-800'
            }`}
        />
      ))}
    </div>
  );
};

export function MitraWizard() {
  const [step, setStep] = useState<RegistrationStep>('identity');
  const [data, setData] = useState<RegistrationData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const updateData = (updates: Partial<RegistrationData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = async () => {
    if (step === 'identity') {
      if (!data.nama) return toast.error("Nama usaha wajib diisi");
      if (data.kategori.length === 0) return toast.error("Pilih minimal 1 kategori");
      setStep('contact');
    } else if (step === 'contact') {
      if (!data.ownerName) return toast.error("Nama pemilik wajib diisi");
      if (!data.whatsapp) return toast.error("Nomor WhatsApp wajib diisi");
      if (!data.lokasi) return toast.error("Lokasi wajib diisi");
      setStep('menu');
    } else if (step === 'menu') {
      // Validation for menu is optional, but maybe nice to have at least 1 item?
      // if (data.menuItems.length === 0) return toast.error("Tambahkan minimal 1 menu");
      setStep('visual');
    } else if (step === 'visual') {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (step === 'contact') setStep('identity');
    if (step === 'menu') setStep('contact');
    if (step === 'visual') setStep('menu');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let cleanWa = data.whatsapp.replace(/\D/g, '');
      if (!cleanWa.startsWith('62')) {
        if (cleanWa.startsWith('0')) cleanWa = '62' + cleanWa.substring(1);
        else cleanWa = '62' + cleanWa;
      }

      const now = new Date().toISOString();

      const payload = {
        id: generateId(),
        nama: data.nama,
        deskripsi: `Mitra ${data.type} oleh ${data.ownerName}`,
        kategori: data.kategori,
        type: data.type,
        logo: data.logo,
        cover: data.cover,
        lokasi: data.lokasi,
        waktuAntar: "15-30 menit", // Default
        whatsapp: cleanWa,
        rating: 0,
        jumlahReview: 0,
        sedangBuka: false,
        createdAt: now,
        updatedAt: now,
      };

      const result = await saveMitra(payload as any);



      if (result) {
        // Save Menu Items
        if (data.menuItems.length > 0) {
          for (const item of data.menuItems) {
            await saveMenuItem({
              id: generateId(),
              mitraId: result.id,
              nama: item.nama,
              harga: item.harga,
              gambar: item.gambar,
              deskripsi: item.deskripsi,
              kategoriMenu: "Utama", // Default category
              terlaris: false,
              tersedia: true,
              createdAt: now,
              updatedAt: now
            });
          }
        }
        setStep('success');
      } else {
        toast.error("Gagal mendaftar. Silakan coba lagi.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenWA = () => {
    const adminWA = "62895413151817";
    const text = `Halo Admin Rayo, saya baru mendaftar mitra: *${data.nama}*. Mohon di-approve ya!`;
    window.open(`https://wa.me/${adminWA}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Preview Data Reconstruction
  const previewData = {
    id: 0,
    nama: data.nama || "Nama Usaha Anda",
    lokasi: data.lokasi || "Lokasi Anda",
    category: data.kategori.length > 0
      ? MITRA_CATEGORIES.find(c => c.id === data.kategori[0])?.label || "Kategori"
      : "Kategori",
    type: data.type,
    rating: 0,
    waktu: "15-30 mnt",
    harga: 15000,
    cover: data.cover || "https://images.unsplash.com/photo-1555126634-323283e090fa?w=500&q=80",
    isBuka: false
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 space-y-8 animate-in fade-in zoom-in duration-500 bg-white dark:bg-black">
        <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mb-4">
          <Check className="w-12 h-12 text-teal-600" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Pendaftaran Berhasil!</h2>
          <p className="text-gray-500 mt-3 max-w-sm mx-auto text-lg">
            Data toko Anda sudah tersimpan. Hubungi admin untuk aktivasi toko.
          </p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <Button onClick={handleOpenWA} className="w-full h-14 text-lg bg-green-500 hover:bg-green-600 rounded-xl font-bold uppercase tracking-wide shadow-lg shadow-green-500/20">
            <span className="mr-2">💬</span> Hubungi Admin
          </Button>
          <Button variant="outline" onClick={() => router.push('/mitra2')} className="w-full h-14 text-lg rounded-xl">
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white dark:bg-black">

      {/* LEFT COLUMN: FORM */}
      <div className="flex-1 flex flex-col h-auto min-h-screen relative z-10">
        <div className="w-full max-w-2xl mx-auto flex flex-col h-full p-6 lg:p-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 lg:mb-12">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center mr-4">
                <Store className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white text-2xl lg:text-3xl">Daftar Mitra</h1>
                <p className="text-sm text-gray-500 font-medium">Gabung Rayo Kurir & Mulai Jualan</p>
              </div>
            </div>
            <ModeToggle />
          </div>

          <div className="flex-1 mb-12">
            <ProgressBar currentStep={step} />

            <div className="animate-in slide-in-from-right-4 fade-in duration-300 py-4">
              {step === 'identity' && <StepIdentity data={data} updateData={updateData} />}
              {step === 'contact' && <StepContact data={data} updateData={updateData} />}
              {step === 'menu' && <StepMenu data={data} updateData={updateData} />}
              {step === 'visual' && <StepVisual data={data} updateData={updateData} />}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white/90 dark:bg-black/90 backdrop-blur-lg py-6 border-t border-gray-100 dark:border-gray-800 -mx-6 px-6 lg:mx-0 lg:px-0 lg:border-none lg:bg-transparent">
            <div className="flex gap-4">
              {step !== 'identity' && (
                <Button variant="outline" onClick={handleBack} className="h-14 w-16 shrink-0 rounded-2xl border-2" disabled={isSubmitting}>
                  <ArrowLeft className="w-6 h-6" />
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="h-14 flex-1 rounded-2xl bg-teal-600 hover:bg-teal-700 text-lg font-bold shadow-xl shadow-teal-600/20 transition-all hover:scale-[1.01]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Menyimpan..." : (step === 'visual' ? "Daftarkan Toko" : "Lanjut")}
                {!isSubmitting && step !== 'visual' && <ArrowRight className="w-6 h-6 ml-2" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: PREVIEW (Desktop Only) */}
      <div className="hidden lg:flex w-[45%] bg-slate-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex-col sticky top-0 h-screen overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-12 relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

          <div className="relative z-10 w-full max-w-md">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
                Live Preview
              </div>
              <h3 className="font-bold text-2xl text-gray-900 dark:text-white mb-2">Tampilan Toko Anda</h3>
              <p className="text-gray-500">
                Begini tampilan toko Anda di aplikasi pelanggan
              </p>
            </div>

            <div className="bg-white dark:bg-black rounded-[2.5rem] p-6 shadow-2xl border-8 border-white dark:border-gray-800 ring-1 ring-gray-900/5 dark:ring-white/10 relative mx-auto transform transition-all duration-500">
              <Tabs defaultValue="list" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
                  <TabsTrigger value="list" className="text-xs h-9 rounded-xl font-medium">List</TabsTrigger>
                  <TabsTrigger value="widget" className="text-xs h-9 rounded-xl font-medium">Widget</TabsTrigger>
                  <TabsTrigger value="glass" className="text-xs h-9 rounded-xl font-medium">Glass</TabsTrigger>
                  <TabsTrigger value="story" className="text-xs h-9 rounded-xl font-medium">Story</TabsTrigger>
                </TabsList>

                <div className="min-h-[300px] flex items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                  <TabsContent value="list" className="w-full mt-0 animate-in zoom-in-50 duration-300">
                    <div className="pointer-events-none select-none flex justify-center py-4">
                      <MitraCardList data={previewData as any} />
                    </div>
                  </TabsContent>
                  <TabsContent value="widget" className="w-full mt-0 animate-in zoom-in-50 duration-300 flex flex-col items-center">
                    <div className="pointer-events-none select-none px-2 py-4">
                      <MitraCardWidget data={previewData as any} />
                    </div>
                  </TabsContent>
                  <TabsContent value="glass" className="w-full mt-0 animate-in zoom-in-50 duration-300 flex flex-col items-center">
                    <div className="pointer-events-none select-none py-4">
                      <MitraCardGlass data={previewData as any} />
                    </div>
                  </TabsContent>
                  <TabsContent value="story" className="w-full mt-0 animate-in zoom-in-50 duration-300 flex flex-col items-center">
                    <div className="pointer-events-none select-none py-4">
                      <MitraCardStory data={previewData as any} />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400">
                Design yang profesional meningkatkan kepercayaan pelanggan hingga <span className="text-teal-500 font-bold">85%</span>
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
