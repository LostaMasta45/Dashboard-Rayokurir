"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StepIdentity } from "./step-identity";
import { StepContact } from "./step-contact";
import { StepVisual } from "./step-visual";
import { StepReview } from "./step-review";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { saveMitra, generateId, type Mitra } from "@/lib/auth";

export function MitraWizard() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState<Partial<Mitra>>({
    nama: "",
    deskripsi: "",
    kategori: [],
    type: "food",
    whatsapp: "",
    lokasi: "",
    logo: "",
    cover: "",
    waktuAntar: "15-25 menit", // Default
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    // Validation per step
    if (step === 1) {
      if (!formData.nama) return toast.error("Nama usaha wajib diisi");
      if (!formData.type) return toast.error("Pilih tipe usaha");
      if (!formData.kategori || formData.kategori.length === 0)
        return toast.error("Pilih minimal satu kategori");
    }
    if (step === 2) {
      if (!formData.whatsapp) return toast.error("Nomor WhatsApp wajib diisi");
      if (!formData.lokasi) return toast.error("Lokasi wajib diisi");
    }

    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const updateFormData = (data: Partial<Mitra>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const newMitra: Mitra = {
        id: generateId(),
        nama: formData.nama || "",
        deskripsi: formData.deskripsi,
        kategori: formData.kategori || [],
        type: formData.type as any,
        whatsapp: formData.whatsapp,
        lokasi: formData.lokasi,
        logo: formData.logo,
        cover: formData.cover,
        waktuAntar: formData.waktuAntar,
        rating: 0,
        jumlahReview: 0,
        sedangBuka: false, // Default pending
        createdAt: now,
        updatedAt: now,
      };

      const result = await saveMitra(newMitra);
      if (result) {
        setIsSuccess(true);
        // Redirect to WA is handled in success view
      } else {
        toast.error("Gagal mendaftar. Silakan coba lagi.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Pendaftaran Berhasil!</h2>
        <p className="text-gray-600 mb-8">
          Data usaha Anda telah tersimpan. Silakan konfirmasi ke admin via WhatsApp untuk aktivasi.
        </p>
        <Button
          className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
          onClick={() => {
            const message = `Halo Admin, saya baru saja daftar mitra.\n\nNama Usaha: ${formData.nama}\nTipe: ${formData.type}\nLokasi: ${formData.lokasi}\n\nMohon segera di-approve ya!`;
            const url = `https://wa.me/6281234567890?text=${encodeURIComponent(message)}`;
            window.open(url, "_blank");
          }}
        >
          Lanjut ke WhatsApp
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-20">
      {/* Progress Header */}
      <div className="mb-6 sticky top-0 bg-white/80 backdrop-blur-md z-10 py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
          <span>Langkah {step} dari {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card className="p-6 border-0 shadow-sm sm:border sm:shadow-md min-h-[400px]">
        {step === 1 && (
          <StepIdentity formData={formData} updateFormData={updateFormData} />
        )}
        {step === 2 && (
          <StepContact formData={formData} updateFormData={updateFormData} />
        )}
        {step === 3 && (
          <StepVisual formData={formData} updateFormData={updateFormData} />
        )}
        {step === 4 && (
          <StepReview formData={formData} />
        )}
      </Card>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t sm:static sm:bg-transparent sm:border-0 sm:p-0 sm:mt-6 flex gap-3 z-20">
        {step > 1 && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1 h-12 sm:flex-none sm:w-32"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        )}
        
        {step < totalSteps ? (
          <Button
            onClick={handleNext}
            className="flex-1 h-12 bg-teal-600 hover:bg-teal-700 text-white"
          >
            Lanjut
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 h-12 bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isSubmitting ? "Menyimpan..." : "Daftarkan Usaha"}
          </Button>
        )}
      </div>
    </div>
  );
}
