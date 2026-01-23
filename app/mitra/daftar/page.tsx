import { MitraWizard } from "@/components/registration/mitra-wizard";

export const metadata = {
  title: "Daftar Mitra Mandiri | Rayo Kurir",
  description: "Gabung menjadi mitra Rayo Kurir dan tingkatkan penjualan Anda.",
};

export default function PendaftaranMitraPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black font-sans">
      <MitraWizard />
    </div>
  );
}
