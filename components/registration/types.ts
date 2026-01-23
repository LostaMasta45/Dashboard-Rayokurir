export type RegistrationStep = 'identity' | 'contact' | 'menu' | 'visual' | 'success';

export interface MenuItemDraft {
    id: string; // temp id
    nama: string;
    harga: number;
    gambar?: string;
    deskripsi?: string;
}

export interface RegistrationData {
    // Identity
    nama: string;
    kategori: string[]; // IDs
    type: 'food' | 'retail' | 'pharmacy' | 'service' | 'special';

    // Contact
    ownerName: string;
    whatsapp: string;
    lokasi: string;

    // Menu
    menuItems: MenuItemDraft[];

    // Visual
    logo?: string;
    cover?: string;
}

export const INITIAL_DATA: RegistrationData = {
    nama: "",
    kategori: [],
    type: "food",
    ownerName: "",
    whatsapp: "",
    lokasi: "",
    menuItems: [],
    logo: "",
    cover: ""
};

export const MITRA_TYPES = [
    { id: "food", label: "Kuliner", icon: "🍔", description: "Restoran, Cafe, Warung Makan" },
    { id: "retail", label: "Toko/Warung", icon: "🛒", description: "Sembako, Kelontong, Minimarket" },
    { id: "pharmacy", label: "Apotek/Kesehatan", icon: "💊", description: "Apotek, Toko Obat" },
    { id: "service", label: "Jasa", icon: "🧺", description: "Laundry, Tukang Cukur, Bengkel" },
    { id: "special", label: "Pre-Order", icon: "🎁", description: "Kue Kering, Hampers, PO" },
];
