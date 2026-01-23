"use client";

import React, { useState } from "react";
import { RegistrationData, INITIAL_DATA, RegistrationStep } from "./types";
import { StepIdentity } from "./step-identity";
import { StepContact } from "./step-contact";
import { StepVisual } from "./step-visual";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Store } from "lucide-react";
import { toast } from "sonner";
import { saveMitra, generateId, MITRA_CATEGORIES } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { MitraCardList, MitraCardWidget, MitraCardGlass, MitraCardStory } from "@/components/mitra2/MitraCards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Simple progress indicator
const ProgressBar = ({ currentStep }: { currentStep: RegistrationStep }) => {
  const steps: RegistrationStep[] = ['identity', 'contact', 'visual'];
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
      setStep('visual');
    } else if (step === 'visual') {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (step === 'contact') setStep('identity');
    if (step === 'visual') setStep('contact');
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mb-4">
          <Check className="w-12 h-12 text-teal-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pendaftaran Berhasil!</h2>
          <p className="text-gray-500 mt-2 max-w-xs mx-auto">
            Data toko Anda sudah tersimpan. Hubungi admin untuk aktivasi toko.
          </p>
        </div>

        <div className="w-full max-w-xs space-y-3">
          <Button onClick={handleOpenWA} className="w-full h-12 text-lg bg-green-500 hover:bg-green-600">
            <span className="mr-2">💬</span> Hubungi Admin
          </Button>
          <Button variant="outline" onClick={() => router.push('/mitra2')} className="w-full h-12">
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg md:max-w-5xl mx-auto bg-white dark:bg-black md:dark:bg-transparent min-h-screen md:min-h-[500px] flex flex-col md:flex-row md:items-start md:gap-8 justify-center">

      {/* LEFT COLUMN: FORM */}
      <div className="flex-1 md:bg-white md:dark:bg-gray-900 md:rounded-3xl md:shadow-xl md:border md:border-gray-200 md:dark:border-gray-800 flex flex-col h-full md:h-auto">
        {/* Header */}
        <div className="p-4 md:p-8 flex items-center border-b border-gray-100 dark:border-gray-800">
          <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/20 rounded-xl flex items-center justify-center mr-3">
            <Store className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white leading-tight md:text-xl">Daftar Mitra Mandiri</h1>
            <p className="text-xs text-gray-400">Gabung Rayo Kurir sekarang</p>
          </div>
        </div>

        <div className="p-4 md:p-8 flex-1 overflow-y-auto">
          <ProgressBar currentStep={step} />

          <div className="min-h-[300px] animate-in slide-in-from-right-4 fade-in duration-300">
            {step === 'identity' && <StepIdentity data={data} updateData={updateData} />}
            {step === 'contact' && <StepContact data={data} updateData={updateData} />}
            {step === 'visual' && <StepVisual data={data} updateData={updateData} />}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-8 border-t border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-black/80 md:bg-transparent backdrop-blur-sm sticky bottom-0 md:static md:rounded-b-3xl">
          <div className="flex gap-3">
            {step !== 'identity' && (
              <Button variant="outline" onClick={handleBack} className="h-12 w-14 shrink-0 rounded-xl" disabled={isSubmitting}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="h-12 flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-base font-bold shadow-lg shadow-teal-600/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : (step === 'visual' ? "Daftarkan Toko" : "Lanjut")}
              {!isSubmitting && step !== 'visual' && <ArrowRight className="w-5 h-5 ml-2" />}
            </Button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: PREVIEW (Desktop Only) */}
      <div className="hidden md:block w-96 shrink-0 sticky top-24 space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-center">Live Preview</h3>
          <p className="text-xs text-gray-500 text-center mb-6">
            Tampilan toko Anda di berbagai posisi aplikasi
          </p>

          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <TabsTrigger value="list" className="text-[10px] h-7 rounded-lg">List</TabsTrigger>
              <TabsTrigger value="widget" className="text-[10px] h-7 rounded-lg">Widget</TabsTrigger>
              <TabsTrigger value="glass" className="text-[10px] h-7 rounded-lg">Glass</TabsTrigger>
              <TabsTrigger value="story" className="text-[10px] h-7 rounded-lg">Story</TabsTrigger>
            </TabsList>

            <div className="bg-gray-50 dark:bg-black/20 rounded-2xl p-4 border border-dashed border-gray-200 dark:border-gray-800 min-h-[350px] flex items-center justify-center relative overflow-hidden">
              <TabsContent value="list" className="w-full mt-0 animate-in zoom-in-50 duration-300">
                <div className="pointer-events-none select-none flex justify-center">
                  <MitraCardList data={previewData as any} />
                </div>
                <p className="text-[10px] text-gray-400 text-center mt-3">Tampilan di hasil pencarian & list kategori</p>
              </TabsContent>
              <TabsContent value="widget" className="w-full mt-0 animate-in zoom-in-50 duration-300 flex flex-col items-center">
                <div className="pointer-events-none select-none px-2">
                  <MitraCardWidget data={previewData as any} />
                </div>
                <p className="text-[10px] text-gray-400 text-center mt-3">Tampilan di rekomendasi "Favorit"</p>
              </TabsContent>
              <TabsContent value="glass" className="w-full mt-0 animate-in zoom-in-50 duration-300 flex flex-col items-center">
                <div className="pointer-events-none select-none">
                  <MitraCardGlass data={previewData as any} />
                </div>
                <p className="text-[10px] text-gray-400 text-center mt-3">Tampilan di "Lagi Rame"</p>
              </TabsContent>
              <TabsContent value="story" className="w-full mt-0 animate-in zoom-in-50 duration-300 flex flex-col items-center">
                <div className="pointer-events-none select-none">
                  <MitraCardStory data={previewData as any} />
                </div>
                <p className="text-[10px] text-gray-400 text-center mt-3">Tampilan di Story Brand</p>
              </TabsContent>
            </div>
          </Tabs>

          <div className="mt-6 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl text-center">
            <p className="text-xs text-teal-700 dark:text-teal-300 font-medium">
              ✨ Upload logo & cover menarik agar toko Anda semakin dilirik pelanggan!
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
