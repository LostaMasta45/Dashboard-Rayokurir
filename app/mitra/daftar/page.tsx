import { MitraWizard } from "@/components/registration/mitra-wizard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DaftarMitraPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Mobile-friendly */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/mitra2" className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Daftar Mitra Baru</h1>
            <p className="text-xs text-gray-500">Isi data usaha mandiri</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <MitraWizard />
      </div>
    </div>
  );
}
