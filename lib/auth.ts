export async function deleteExpense(expenseId: string): Promise<boolean> {
    const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId);
    return !error;
}
export async function updateExpense(expense: Expense): Promise<Expense | null> {
    const { data, error } = await supabase
        .from("expenses")
        .update(expense)
        .eq("id", expense.id)
        .select()
        .single();
    return data || null;
}
export interface User {
    username: string;
    role: "ADMIN" | "KURIR";
    name: string;
    courierId?: string;
}

export interface Order {
    id: string;
    createdAt: string;
    createdDate: string;
    pengirim: {
        nama: string;
        wa: string;
    };
    pickup: {
        alamat: string;
        mapsLink?: string;
    };
    dropoff: {
        alamat: string;
        mapsLink?: string;
    };
    kurirId: string | null;
    status:
    | "NEW"
    | "OFFERED"
    | "ACCEPTED"
    | "REJECTED"
    | "OTW_PICKUP"
    | "PICKED"
    | "OTW_DROPOFF"
    | "NEED_POD"
    | "DELIVERED"
    | "CANCELLED"
    // Legacy status (backward compatibility)
    | "BARU"
    | "ASSIGNED"
    | "PICKUP"
    | "DIKIRIM"
    | "SELESAI";
    jenisOrder:
    | "Antar Barang"
    | "Jemput Barang"
    | "Titip Beli"
    | "Dokumen"
    | "Lainnya"
    // Legacy types
    | "Barang"
    | "Makanan"
    | "Antar Jemput";
    serviceType:
    | "Regular"
    | "Express"
    // Legacy types
    | "Reguler"
    | "Same Day";
    addons?: {
        returnPP: boolean;
        bulky: boolean;
        heavy: boolean;
        waitingFee: boolean;
        waitingFeeAmount?: number;
    };
    ongkir: number;
    danaTalangan: number;
    talanganDiganti?: boolean;
    bayarOngkir: "NON_COD" | "COD";
    talanganReimbursed?: boolean;
    cod: {
        nominal: number;
        isCOD: boolean;
        codPaid: boolean;
    };
    codSettled?: boolean;
    nonCodPaid: boolean;
    // Payment method tracking
    ongkirPaymentMethod?: "CASH" | "QRIS" | "TRANSFER";
    ongkirPaymentStatus?: "PENDING" | "PAID";
    ongkirPaidAt?: string;
    notes?: string;
    podPhotos?: Array<{
        url: string;
        fileId?: string;
        uploadedAt: string;
        uploadedBy: string;
    }>;
    auditLog?: Array<{
        event: string;
        at: string;
        actorType: "ADMIN" | "COURIER" | "SYSTEM";
        actorId: string;
        meta?: Record<string, unknown>;
    }>;
}

export interface Courier {
    id: string;
    nama: string;
    wa: string;
    email?: string;
    aktif: boolean;
    online: boolean;
    // Telegram integration fields
    telegramUserId?: number;
    telegramChatId?: number;
    telegramUsername?: string;
    pairingCode?: string;
    pairingCodeExpiresAt?: string;
}

export interface CODHistory {
    id: string;
    orderId: string;
    kurirId: string;
    nominal: number;
    tanggal: string;
    buktiUrl?: string;
}

export interface Expense {
    id: string;
    tanggal: string;
    kategori: string;
    deskripsi: string;
    nominal: number;
}

export interface Contact {
    id: string;
    name: string;
    whatsapp: string;
    address: string;
    tags: string[];
    notes?: string;
    createdAt: string;
    lastContacted?: string;
}

export interface Mitra {
    id: string;
    nama: string;
    deskripsi?: string;
    kategori: string[];
    type?: 'food' | 'retail' | 'pharmacy' | 'service' | 'special';
    logo?: string;
    cover?: string;
    lokasi?: string;
    waktuAntar?: string;
    rating: number;
    jumlahReview: number;
    sedangBuka: boolean;
    whatsapp?: string;
    createdAt: string;
    updatedAt: string;
}

export interface MenuItem {
    id: string;
    mitraId: string;
    nama: string;
    deskripsi?: string;
    harga: number;
    gambar?: string;
    kategoriMenu?: string;
    terlaris: boolean;
    tersedia: boolean;
    createdAt: string;
    updatedAt: string;
}

import { supabase } from "./supabaseClient";

// Storage keys (hanya untuk fallback, akan dihapus setelah migrasi total)
const STORAGE_KEYS = {
    ORDERS: "rk_orders",
    COURIERS: "rk_couriers",
    COD_HISTORY: "rk_cod_history",
    EXPENSES: "rk_expenses",
    USERS: "rk_users",
    CURRENT_USER: "rk_current_user",
    CONTACTS: "rayo-contacts",
};

// Fungsi seed data awal ke Supabase (hanya insert jika tabel kosong)
export async function seedSupabaseData() {
    // Seed users
    const { data: users } = await supabase.from("users").select("*");
    if (!users || users.length === 0) {
        const defaultUsers: User[] = [
            { username: "admin", role: "ADMIN", name: "Administrator" },
            {
                username: "kurir1",
                role: "KURIR",
                name: "Budi Santoso",
                courierId: "1",
            },
            {
                username: "kurir2",
                role: "KURIR",
                name: "Sari Dewi",
                courierId: "2",
            },
        ];
        await supabase.from("users").insert(defaultUsers);
    }

    // Seed couriers
    const { data: couriers } = await supabase.from("couriers").select("*");
    if (!couriers || couriers.length === 0) {
        const defaultCouriers: Courier[] = [
            {
                id: "1",
                nama: "Budi Santoso",
                wa: "081234567890",
                aktif: true,
                online: true,
            },
            {
                id: "2",
                nama: "Sari Dewi",
                wa: "081234567891",
                aktif: true,
                online: false,
            },
        ];
        await supabase.from("couriers").insert(defaultCouriers);
    }

    // Seed data lain (orders, cod_history, expenses, contacts) jika perlu
    // Contoh: pastikan tabel tidak kosong, insert [] jika kosong
    const tables = ["orders", "cod_history", "expenses", "contacts"];
    for (const table of tables) {
        const { data } = await supabase.from(table).select("*");
        if (!data || data.length === 0) {
            await supabase.from(table).insert([]);
        }
    }
}

// Authentication functions (Supabase)
// === NEW AUTHENTICATION (Supabase Auth) ===

export async function loginWithEmail(email: string, password: string): Promise<User | null> {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error || !data.user) {
        console.error("Login failed:", error?.message);
        return null;
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("email", email) // Use email correlation
        .single();

    if (profile) {
        if (typeof window !== "undefined") {
            sessionStorage.setItem("rk_current_user", JSON.stringify(profile));
        }
        return profile as User;
    }

    return null;
}

export async function logoutUser() {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
        sessionStorage.removeItem("rk_current_user");
    }
}

export async function getCurrentSession(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    // Try cache first
    if (typeof window !== "undefined") {
        const cached = sessionStorage.getItem("rk_current_user");
        if (cached) return JSON.parse(cached);
    }

    // Fetch from DB if not in cache
    const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", session.user.id)
        .single();

    return profile as User | null;
}


// === LEGACY AUTH (To be deprecated) ===
export async function login(username: string): Promise<User | null> {
    // Query ke tabel users di Supabase
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();
    if (error || !data) return null;
    // Simpan user ke sessionStorage (bukan localStorage, agar lebih aman)
    if (typeof window !== "undefined") {
        sessionStorage.setItem("rk_current_user", JSON.stringify(data));
    }
    return data as User;
}

export function logout() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("rk_current_user");
}

export function getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    const userStr = sessionStorage.getItem("rk_current_user");
    return userStr ? JSON.parse(userStr) : null;
}

// Data access functions (Supabase)
export async function getOrders(): Promise<Order[]> {
    const { data, error } = await supabase.from("orders").select("*");
    return data || [];
}

export async function saveOrder(order: Order): Promise<Order | null> {
    // Validasi field NOT NULL
    const requiredFields = [
        "id",
        "createdAt",
        "createdDate",
        "pengirim",
        "pickup",
        "dropoff",
        "status",
        "jenisOrder",
        "serviceType",
        "ongkir",
        "danaTalangan",
        "bayarOngkir",
        "cod",
        "nonCodPaid",
    ];
    for (const field of requiredFields) {
        if (
            order[field as keyof Order] === undefined ||
            order[field as keyof Order] === null
        ) {
            console.error("[saveOrder] Field wajib kosong:", field, order);
            throw new Error(`Field '${field}' wajib diisi!`);
        }
    }
    const { data, error } = await supabase
        .from("orders")
        .insert([order])
        .select()
        .single();
    if (error) {
        console.error("[saveOrder] Supabase error:", error, order);
    }
    return data || null;
}

export async function updateOrder(order: Order): Promise<Order | null> {
    // Kirim object JS langsung untuk JSONB
    const { data, error } = await supabase
        .from("orders")
        .update(order)
        .eq("id", order.id)
        .select()
        .single();
    return data || null;
}

export async function deleteOrder(orderId: string): Promise<boolean> {
    const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

    if (error) {
        console.error("[deleteOrder] Supabase error:", error);
        return false;
    }
    return true;
}

export async function saveOrders(orders: Order[]): Promise<Order[] | null> {
    if (!orders || orders.length === 0) return [];

    // Use upsert for bulk save/updates
    const { data, error } = await supabase
        .from("orders")
        .upsert(orders)
        .select();

    if (error) {
        console.error("[saveOrders] Supabase error:", error);
        return null;
    }
    return data || [];
}

export async function getCouriers(): Promise<Courier[]> {
    const { data, error } = await supabase.from("couriers").select("*");
    if (!data) return [];
    // Map snake_case from DB to camelCase for TypeScript
    return data.map((c: Record<string, unknown>) => ({
        id: c.id as string,
        nama: c.nama as string,
        wa: c.wa as string,
        email: c.email as string | undefined,
        aktif: c.aktif as boolean,
        online: c.online as boolean,
        telegramUserId: c.telegram_user_id as number | undefined,
        telegramChatId: c.telegram_chat_id as number | undefined,
        telegramUsername: c.telegram_username as string | undefined,
        pairingCode: c.pairing_code as string | undefined,
        pairingCodeExpiresAt: c.pairing_code_expires_at as string | undefined,
    }));
}

export async function saveCourier(courier: Courier): Promise<Courier | null> {
    // Map camelCase to snake_case for DB
    const dbCourier = {
        id: courier.id,
        nama: courier.nama,
        wa: courier.wa,
        email: courier.email,
        aktif: courier.aktif,
        online: courier.online,
        telegram_user_id: courier.telegramUserId,
        telegram_chat_id: courier.telegramChatId,
        telegram_username: courier.telegramUsername,
        pairing_code: courier.pairingCode,
        pairing_code_expires_at: courier.pairingCodeExpiresAt,
    };
    const { data, error } = await supabase
        .from("couriers")
        .insert([dbCourier])
        .select()
        .single();
    if (!data) return null;
    return {
        ...courier,
        telegramUserId: data.telegram_user_id,
    };
}

export async function updateCourier(courier: Courier): Promise<Courier | null> {
    // Map camelCase to snake_case for DB
    const dbCourier = {
        nama: courier.nama,
        wa: courier.wa,
        email: courier.email,
        aktif: courier.aktif,
        online: courier.online,
        telegram_user_id: courier.telegramUserId,
        telegram_chat_id: courier.telegramChatId,
        telegram_username: courier.telegramUsername,
        pairing_code: courier.pairingCode,
        pairing_code_expires_at: courier.pairingCodeExpiresAt,
    };
    const { data, error } = await supabase
        .from("couriers")
        .update(dbCourier)
        .eq("id", courier.id)
        .select()
        .single();
    if (!data) return null;
    return {
        ...courier,
        telegramUserId: data.telegram_user_id,
    };
}

export async function getCODHistory(): Promise<CODHistory[]> {
    const { data, error } = await supabase.from("cod_history").select("*");
    return data || [];
}

export async function saveCODHistory(
    history: CODHistory
): Promise<CODHistory | null> {
    const { data, error } = await supabase
        .from("cod_history")
        .insert([history])
        .select()
        .single();
    return data || null;
}

export async function getExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase.from("expenses").select("*");
    return data || [];
}

export async function saveExpense(expense: Expense): Promise<Expense | null> {
    const { data, error } = await supabase
        .from("expenses")
        .insert([expense])
        .select()
        .single();
    return data || null;
}

export async function getContacts(): Promise<Contact[]> {
    const { data, error } = await supabase.from("contacts").select("*");
    return data || [];
}

export async function saveContact(contact: Contact): Promise<Contact | null> {
    // Validasi field NOT NULL
    const requiredFields = [
        "id",
        "name",
        "whatsapp",
        "address",
        "tags",
        "createdAt",
    ];
    for (const field of requiredFields) {
        if (
            contact[field as keyof Contact] === undefined ||
            contact[field as keyof Contact] === null
        ) {
            console.error("[saveContact] Field wajib kosong:", field, contact);
            throw new Error(`Field '${field}' wajib diisi!`);
        }
    }
    const { data, error } = await supabase
        .from("contacts")
        .insert([contact])
        .select()
        .single();
    if (error) {
        console.error("[saveContact] Supabase error:", error, contact);
    }
    return data || null;
}

export async function updateContact(contact: Contact): Promise<Contact | null> {
    const { data, error } = await supabase
        .from("contacts")
        .update(contact)
        .eq("id", contact.id)
        .select()
        .single();
    return data || null;
}

export async function addOrUpdateContact(
    name: string,
    whatsapp: string,
    address: string,
    tags: string[],
    notes?: string,
    lastContacted?: string
) {
    // Cari kontak existing di Supabase
    const { data: contacts } = await supabase
        .from("contacts")
        .select("*")
        .eq("name", name.trim())
        .eq("whatsapp", whatsapp.trim());
    if (contacts && contacts.length > 0) {
        // Update existing contact
        const existingContact = contacts[0];
        await updateContact({
            ...existingContact,
            address: address.trim(),
            tags: tags.map((tag) => tag.trim()),
            notes: notes?.trim(),
            lastContacted: lastContacted
                ? new Date(lastContacted).toISOString()
                : undefined,
        });
    } else {
        // Add new contact
        const newContact: Contact = {
            id: generateId(),
            name: name.trim(),
            whatsapp: whatsapp.trim(),
            address: address.trim(),
            tags: tags.map((tag) => tag.trim()),
            notes: notes?.trim(),
            createdAt: new Date().toISOString(),
            lastContacted: lastContacted
                ? new Date(lastContacted).toISOString()
                : undefined,
        };
        await saveContact(newContact);
    }
}

// Utility functions
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export function exportContactsToCSV(contacts: Contact[]) {
    if (typeof window === "undefined") return;

    const headers = [
        "Nama",
        "WhatsApp",
        "Alamat",
        "Tags",
        "Catatan",
        "Tanggal Dibuat",
        "Terakhir Dihubungi",
    ];
    const csvContent = [
        headers.join(","),
        ...contacts.map((contact) =>
            [
                `"${contact.name}"`,
                `"${contact.whatsapp}"`,
                `"${contact.address}"`,
                `"${contact.tags.join("; ")}"`,
                `"${contact.notes || ""}"`,
                `"${formatDate(contact.createdAt)}"`,
                `"${contact.lastContacted
                    ? formatDate(contact.lastContacted)
                    : ""
                }"`,
            ].join(",")
        ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
        "download",
        `contacts-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function exportContactsToJSON(contacts: Contact[]) {
    if (typeof window === "undefined") return;

    const dataStr = JSON.stringify(contacts, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
        "download",
        `contacts-${new Date().toISOString().split("T")[0]}.json`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export async function getContactTags(): Promise<string[]> {
    const contacts = await getContacts();
    const allTags = contacts.flatMap((contact) => contact.tags || []);
    return [...new Set(allTags)].sort() as string[];
}

// Service type pricing configuration
export const SERVICE_TYPE_PRICING = {
    Reguler: 0,
    Express: 5000,
    "Same Day": 10000,
};

// Status badge configuration with colors
export const ORDER_STATUS_CONFIG = {
    // New statuses
    NEW: {
        label: "Order Baru",
        color: "bg-gray-100 text-gray-800",
    },
    OFFERED: {
        label: "Ditawarkan ke Kurir",
        color: "bg-purple-100 text-purple-800",
    },
    ACCEPTED: {
        label: "Diterima Kurir",
        color: "bg-blue-100 text-blue-800",
    },
    REJECTED: {
        label: "Ditolak Kurir",
        color: "bg-red-100 text-red-800",
    },
    OTW_PICKUP: {
        label: "OTW Jemput",
        color: "bg-amber-100 text-amber-800",
    },
    PICKED: {
        label: "Sudah Dijemput",
        color: "bg-yellow-100 text-yellow-800",
    },
    OTW_DROPOFF: {
        label: "OTW Antar",
        color: "bg-orange-100 text-orange-800",
    },
    NEED_POD: {
        label: "Butuh Foto POD",
        color: "bg-pink-100 text-pink-800",
    },
    DELIVERED: {
        label: "Terkirim",
        color: "bg-green-100 text-green-800",
    },
    CANCELLED: {
        label: "Dibatalkan",
        color: "bg-gray-100 text-gray-600",
    },
    // Legacy statuses (backward compatibility)
    BARU: {
        label: "Menunggu Kurir",
        color: "bg-gray-100 text-gray-800",
    },
    ASSIGNED: {
        label: "Kurir Ditugaskan",
        color: "bg-blue-100 text-blue-800",
    },
    PICKUP: {
        label: "Barang Diambil",
        color: "bg-amber-100 text-amber-800",
    },
    DIKIRIM: {
        label: "Sedang Dikirim",
        color: "bg-orange-100 text-orange-800",
    },
    SELESAI: { label: "Selesai", color: "bg-green-100 text-green-800" },
};

export async function toggleCourierOnlineStatus(courierId: string) {
    const couriers = await getCouriers();
    const courier = couriers.find((c) => c.id === courierId);
    if (!courier) return null;
    const updated = await updateCourier({
        ...courier,
        online: !courier.online,
    });
    return updated;
}

export async function getCourierPerformanceMetrics(courierId: string) {
    const orders = await getOrders();
    const codHistory = await getCODHistory();
    const courierOrders = orders.filter((order) => order.kurirId === courierId);
    const completedOrders = courierOrders.filter(
        (order) => order.status === "SELESAI"
    );
    const totalOngkir = courierOrders.reduce(
        (sum, order) => sum + (order.ongkir || 0),
        0
    );
    const codDeposited = codHistory
        .filter((history) => history.kurirId === courierId)
        .reduce((sum, history) => sum + history.nominal, 0);
    const danaTalanganDiganti = courierOrders
        .filter((order) => order.status === "SELESAI" && order.danaTalangan > 0)
        .reduce((sum, order) => sum + order.danaTalangan, 0);
    return {
        totalOrderSelesai: completedOrders.length,
        codDisetor: codDeposited,
        ongkirDikumpulkan: totalOngkir,
        danaTalanganDiganti: danaTalanganDiganti,
        onTimePercentage: 95, // Dummy percentage for now
    };
}

export async function markTalanganReimbursed(orderId: string) {
    const orders = await getOrders();
    const order = orders.find((order) => order.id === orderId);
    if (!order) return false;
    await updateOrder({ ...order, talanganReimbursed: true });
    return true;
}

export async function updateOrderStatus(
    orderId: string,
    newStatus: Order["status"],
    userRole: "ADMIN" | "KURIR"
) {
    const orders = await getOrders();
    const order = orders.find((order) => order.id === orderId);
    if (!order) return false;
    // Define allowed status transitions for couriers (new state machine)
    const courierAllowedTransitions: Partial<Record<Order["status"], Order["status"][]>> = {
        // New statuses
        NEW: [],           // Kurir cannot act on NEW orders
        OFFERED: ["ACCEPTED", "REJECTED"],
        ACCEPTED: ["OTW_PICKUP"],
        OTW_PICKUP: ["PICKED"],
        PICKED: ["OTW_DROPOFF"],
        OTW_DROPOFF: ["NEED_POD"],
        NEED_POD: ["DELIVERED"],
        DELIVERED: [],
        REJECTED: [],
        CANCELLED: [],
        // Legacy statuses (backward compatibility)
        BARU: [],          // Kurir cannot change from BARU
        ASSIGNED: ["OTW_PICKUP", "PICKUP"],
        PICKUP: ["OTW_DROPOFF", "DIKIRIM"],
        DIKIRIM: ["NEED_POD", "SELESAI"],
        SELESAI: [],
    };
    // Check if courier can make this transition
    if (userRole === "KURIR") {
        const allowedNextStatuses =
            courierAllowedTransitions[order.status] || [];
        if (!allowedNextStatuses.includes(newStatus)) {
            return false; // Courier cannot make this transition
        }
    }
    // Admin can override any status
    await updateOrder({ ...order, status: newStatus });
    return true;
}

// ==================== MITRA CRUD FUNCTIONS ====================

export async function getMitra(): Promise<Mitra[]> {
    const { data, error } = await supabase
        .from("mitra")
        .select("*")
        .order("createdAt", { ascending: false });
    if (error) {
        console.error("[getMitra] Supabase error:", error);
        return [];
    }
    return data || [];
}

export async function getMitraById(id: string): Promise<Mitra | null> {
    const { data, error } = await supabase
        .from("mitra")
        .select("*")
        .eq("id", id)
        .single();
    if (error) {
        console.error("[getMitraById] Supabase error:", error);
        return null;
    }
    return data || null;
}

export async function saveMitra(mitra: Mitra): Promise<Mitra | null> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type, ...mitraWithoutType } = mitra; // Exclude 'type' as it doesn't exist in the DB schema
    const { data, error } = await supabase
        .from("mitra")
        .insert([mitraWithoutType])
        .select()
        .single();
    if (error) {
        console.error("[saveMitra] Supabase error:", error, mitra);
        return null;
    }
    return data || null;
}

export async function updateMitra(mitra: Mitra): Promise<Mitra | null> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type, ...mitraWithoutType } = mitra; // Exclude 'type' as it doesn't exist in the DB schema
    const { data, error } = await supabase
        .from("mitra")
        .update({ ...mitraWithoutType, updatedAt: new Date().toISOString() })
        .eq("id", mitra.id)
        .select()
        .single();
    if (error) {
        console.error("[updateMitra] Supabase error:", error);
        return null;
    }
    return data || null;
}

export async function deleteMitra(mitraId: string): Promise<boolean> {
    const { error } = await supabase
        .from("mitra")
        .delete()
        .eq("id", mitraId);
    if (error) {
        console.error("[deleteMitra] Supabase error:", error);
        return false;
    }
    return true;
}

export async function toggleMitraStatus(mitraId: string): Promise<Mitra | null> {
    const mitra = await getMitraById(mitraId);
    if (!mitra) return null;
    return await updateMitra({ ...mitra, sedangBuka: !mitra.sedangBuka });
}

// ==================== MENU ITEM CRUD FUNCTIONS ====================

export async function getMenuItems(mitraId?: string): Promise<MenuItem[]> {
    let query = supabase.from("menu_items").select("*");
    if (mitraId) {
        query = query.eq("mitraId", mitraId);
    }
    const { data, error } = await query.order("createdAt", { ascending: false });
    if (error) {
        console.error("[getMenuItems] Supabase error:", error);
        return [];
    }
    return data || [];
}

export async function getMenuItemById(id: string): Promise<MenuItem | null> {
    const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("id", id)
        .single();
    if (error) {
        console.error("[getMenuItemById] Supabase error:", error);
        return null;
    }
    return data || null;
}

export async function saveMenuItem(menuItem: MenuItem): Promise<MenuItem | null> {
    const { data, error } = await supabase
        .from("menu_items")
        .insert([menuItem])
        .select()
        .single();
    if (error) {
        console.error("[saveMenuItem] Supabase error:", error, menuItem);
        return null;
    }
    return data || null;
}

export async function updateMenuItem(menuItem: MenuItem): Promise<MenuItem | null> {
    const { data, error } = await supabase
        .from("menu_items")
        .update({ ...menuItem, updatedAt: new Date().toISOString() })
        .eq("id", menuItem.id)
        .select()
        .single();
    if (error) {
        console.error("[updateMenuItem] Supabase error:", error);
        return null;
    }
    return data || null;
}

export async function deleteMenuItem(menuItemId: string): Promise<boolean> {
    const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", menuItemId);
    if (error) {
        console.error("[deleteMenuItem] Supabase error:", error);
        return false;
    }
    return true;
}

export async function toggleMenuItemTerlaris(menuItemId: string): Promise<MenuItem | null> {
    const menuItem = await getMenuItemById(menuItemId);
    if (!menuItem) return null;
    return await updateMenuItem({ ...menuItem, terlaris: !menuItem.terlaris });
}

export async function toggleMenuItemTersedia(menuItemId: string): Promise<MenuItem | null> {
    const menuItem = await getMenuItemById(menuItemId);
    if (!menuItem) return null;
    return await updateMenuItem({ ...menuItem, tersedia: !menuItem.tersedia });
}

// ==================== MITRA CATEGORIES ====================

export const MITRA_CATEGORIES = [
    { id: "makanan", label: "Makanan", icon: "🍜" },
    { id: "kopi", label: "Kopi", icon: "☕" },
    { id: "retail", label: "Retail / Sembako", icon: "🛒" },
    { id: "frozen", label: "Frozen Food", icon: "🧊" },
    { id: "apotek", label: "Apotek", icon: "💊" },
    { id: "laundry", label: "Laundry", icon: "🧺" },
    { id: "atk", label: "ATK / Fotokopi", icon: "📄" },
    { id: "kue", label: "Kue & Jajanan", icon: "🎂" },
    { id: "lainnya", label: "Lainnya", icon: "⋯" },
];

// ==================== SEED MITRA DATA ====================

export async function seedMitraData() {
    const { data: existingMitra } = await supabase.from("mitra").select("id");
    if (existingMitra && existingMitra.length > 0) {
        console.log("[seedMitraData] Mitra data already exists, skipping seed");
        return;
    }

    const now = new Date().toISOString();
    const mitraData: Mitra[] = [
        // KATEGORI MAKANAN (6 mitra)
        { id: "m1", nama: "Warung Bu Yanti", deskripsi: "Masakan rumahan Jawa Timur", kategori: ["makanan"], logo: "https://picsum.photos/seed/m1logo/200", cover: "https://picsum.photos/seed/m1cover/800/400", lokasi: "Sumobito, Jombang", waktuAntar: "15-25 menit", rating: 4.8, jumlahReview: 120, sedangBuka: true, whatsapp: "6281234567001", createdAt: now, updatedAt: now },
        { id: "m2", nama: "Geprek Mantap", deskripsi: "Ayam geprek berbagai level", kategori: ["makanan"], logo: "https://picsum.photos/seed/m2logo/200", cover: "https://picsum.photos/seed/m2cover/800/400", lokasi: "Pasar Sumobito", waktuAntar: "10-20 menit", rating: 4.6, jumlahReview: 89, sedangBuka: true, whatsapp: "6281234567002", createdAt: now, updatedAt: now },
        { id: "m3", nama: "Bakso Pak Budi", deskripsi: "Bakso urat dan bakso halus", kategori: ["makanan"], logo: "https://picsum.photos/seed/m3logo/200", cover: "https://picsum.photos/seed/m3cover/800/400", lokasi: "Jl. Raya Sumobito", waktuAntar: "15-25 menit", rating: 4.7, jumlahReview: 150, sedangBuka: true, whatsapp: "6281234567003", createdAt: now, updatedAt: now },
        { id: "m4", nama: "Mie Ayam Cak Nur", deskripsi: "Mie ayam dan pangsit", kategori: ["makanan"], logo: "https://picsum.photos/seed/m4logo/200", cover: "https://picsum.photos/seed/m4cover/800/400", lokasi: "Perumahan Griya", waktuAntar: "10-15 menit", rating: 4.5, jumlahReview: 75, sedangBuka: true, whatsapp: "6281234567004", createdAt: now, updatedAt: now },
        { id: "m5", nama: "Sate Kambing Madura", deskripsi: "Sate kambing asli Madura", kategori: ["makanan"], logo: "https://picsum.photos/seed/m5logo/200", cover: "https://picsum.photos/seed/m5cover/800/400", lokasi: "Depan Masjid Agung", waktuAntar: "20-30 menit", rating: 4.9, jumlahReview: 200, sedangBuka: false, whatsapp: "6281234567005", createdAt: now, updatedAt: now },
        { id: "m6", nama: "Nasi Goreng Jaya", deskripsi: "Nasi goreng seafood spesial", kategori: ["makanan"], logo: "https://picsum.photos/seed/m6logo/200", cover: "https://picsum.photos/seed/m6cover/800/400", lokasi: "Jl. Pahlawan", waktuAntar: "15-20 menit", rating: 4.4, jumlahReview: 60, sedangBuka: true, whatsapp: "6281234567006", createdAt: now, updatedAt: now },

        // KATEGORI MINUMAN (6 mitra)
        { id: "m7", nama: "Kopi Nusantara", deskripsi: "Kopi dan minuman kekinian", kategori: ["minuman"], logo: "https://picsum.photos/seed/m7logo/200", cover: "https://picsum.photos/seed/m7cover/800/400", lokasi: "Ruko Sumobito", waktuAntar: "10-15 menit", rating: 4.8, jumlahReview: 180, sedangBuka: true, whatsapp: "6281234567007", createdAt: now, updatedAt: now },
        { id: "m8", nama: "Es Dawet Pak Rohmat", deskripsi: "Minuman tradisional Jawa", kategori: ["minuman"], logo: "https://picsum.photos/seed/m8logo/200", cover: "https://picsum.photos/seed/m8cover/800/400", lokasi: "Depan SD 1", waktuAntar: "15-20 menit", rating: 4.7, jumlahReview: 140, sedangBuka: true, whatsapp: "6281234567008", createdAt: now, updatedAt: now },
        { id: "m9", nama: "Boba Queen", deskripsi: "Boba dan milk tea", kategori: ["minuman"], logo: "https://picsum.photos/seed/m9logo/200", cover: "https://picsum.photos/seed/m9cover/800/400", lokasi: "Mall Sumobito", waktuAntar: "10-15 menit", rating: 4.6, jumlahReview: 95, sedangBuka: true, whatsapp: "6281234567009", createdAt: now, updatedAt: now },
        { id: "m10", nama: "Juice Fresh", deskripsi: "Jus buah segar", kategori: ["minuman"], logo: "https://picsum.photos/seed/m10logo/200", cover: "https://picsum.photos/seed/m10cover/800/400", lokasi: "Pasar Buah", waktuAntar: "10-20 menit", rating: 4.5, jumlahReview: 70, sedangBuka: true, whatsapp: "6281234567010", createdAt: now, updatedAt: now },
        { id: "m11", nama: "Thai Tea Corner", deskripsi: "Thai tea dan minuman thai", kategori: ["minuman"], logo: "https://picsum.photos/seed/m11logo/200", cover: "https://picsum.photos/seed/m11cover/800/400", lokasi: "Jl. Merdeka", waktuAntar: "15-25 menit", rating: 4.4, jumlahReview: 55, sedangBuka: false, whatsapp: "6281234567011", createdAt: now, updatedAt: now },
        { id: "m12", nama: "Smoothie Bar", deskripsi: "Smoothie dan shake sehat", kategori: ["minuman"], logo: "https://picsum.photos/seed/m12logo/200", cover: "https://picsum.photos/seed/m12cover/800/400", lokasi: "GYM Center", waktuAntar: "10-15 menit", rating: 4.3, jumlahReview: 40, sedangBuka: true, whatsapp: "6281234567012", createdAt: now, updatedAt: now },

        // KATEGORI RETAIL (6 mitra)
        { id: "m13", nama: "Frozen Mart", deskripsi: "Frozen food lengkap", kategori: ["retail"], logo: "https://picsum.photos/seed/m13logo/200", cover: "https://picsum.photos/seed/m13cover/800/400", lokasi: "Ruko Niaga", waktuAntar: "20-30 menit", rating: 4.7, jumlahReview: 110, sedangBuka: true, whatsapp: "6281234567013", createdAt: now, updatedAt: now },
        { id: "m14", nama: "Snack Corner", deskripsi: "Aneka snack dan cemilan", kategori: ["retail"], logo: "https://picsum.photos/seed/m14logo/200", cover: "https://picsum.photos/seed/m14cover/800/400", lokasi: "Terminal Bus", waktuAntar: "15-25 menit", rating: 4.5, jumlahReview: 85, sedangBuka: true, whatsapp: "6281234567014", createdAt: now, updatedAt: now },
        { id: "m15", nama: "Bumbu Dapur", deskripsi: "Bumbu masak dan rempah", kategori: ["retail"], logo: "https://picsum.photos/seed/m15logo/200", cover: "https://picsum.photos/seed/m15cover/800/400", lokasi: "Pasar Tradisional", waktuAntar: "20-30 menit", rating: 4.6, jumlahReview: 90, sedangBuka: true, whatsapp: "6281234567015", createdAt: now, updatedAt: now },
        { id: "m16", nama: "Sembako Murah", deskripsi: "Beras, gula, minyak dll", kategori: ["retail"], logo: "https://picsum.photos/seed/m16logo/200", cover: "https://picsum.photos/seed/m16cover/800/400", lokasi: "Jl. Pasar Baru", waktuAntar: "25-35 menit", rating: 4.4, jumlahReview: 65, sedangBuka: true, whatsapp: "6281234567016", createdAt: now, updatedAt: now },
        { id: "m17", nama: "Baby Shop", deskripsi: "Perlengkapan bayi", kategori: ["retail"], logo: "https://picsum.photos/seed/m17logo/200", cover: "https://picsum.photos/seed/m17cover/800/400", lokasi: "Ruko Baru", waktuAntar: "20-30 menit", rating: 4.8, jumlahReview: 130, sedangBuka: false, whatsapp: "6281234567017", createdAt: now, updatedAt: now },
        { id: "m18", nama: "Kosmetik Cantik", deskripsi: "Kosmetik dan skincare", kategori: ["retail"], logo: "https://picsum.photos/seed/m18logo/200", cover: "https://picsum.photos/seed/m18cover/800/400", lokasi: "Mall Sumobito", waktuAntar: "15-25 menit", rating: 4.5, jumlahReview: 75, sedangBuka: true, whatsapp: "6281234567018", createdAt: now, updatedAt: now },

        // KATEGORI TOKO (6 mitra)
        { id: "m19", nama: "Elektronik Jaya", deskripsi: "Elektronik dan gadget", kategori: ["toko"], logo: "https://picsum.photos/seed/m19logo/200", cover: "https://picsum.photos/seed/m19cover/800/400", lokasi: "Jl. Raya Utama", waktuAntar: "30-45 menit", rating: 4.6, jumlahReview: 100, sedangBuka: true, whatsapp: "6281234567019", createdAt: now, updatedAt: now },
        { id: "m20", nama: "ATK Lengkap", deskripsi: "Alat tulis dan kantor", kategori: ["toko"], logo: "https://picsum.photos/seed/m20logo/200", cover: "https://picsum.photos/seed/m20cover/800/400", lokasi: "Depan Sekolah", waktuAntar: "15-25 menit", rating: 4.7, jumlahReview: 120, sedangBuka: true, whatsapp: "6281234567020", createdAt: now, updatedAt: now },
        { id: "m21", nama: "Toko Bangunan", deskripsi: "Material bangunan", kategori: ["toko"], logo: "https://picsum.photos/seed/m21logo/200", cover: "https://picsum.photos/seed/m21cover/800/400", lokasi: "Jl. Industri", waktuAntar: "45-60 menit", rating: 4.4, jumlahReview: 50, sedangBuka: true, whatsapp: "6281234567021", createdAt: now, updatedAt: now },
        { id: "m22", nama: "Pet Shop Sayang", deskripsi: "Makanan dan aksesoris hewan", kategori: ["toko"], logo: "https://picsum.photos/seed/m22logo/200", cover: "https://picsum.photos/seed/m22cover/800/400", lokasi: "Perumahan Elite", waktuAntar: "20-30 menit", rating: 4.8, jumlahReview: 95, sedangBuka: true, whatsapp: "6281234567022", createdAt: now, updatedAt: now },
        { id: "m23", nama: "Toko Mainan", deskripsi: "Mainan anak lengkap", kategori: ["toko"], logo: "https://picsum.photos/seed/m23logo/200", cover: "https://picsum.photos/seed/m23cover/800/400", lokasi: "Mall Sumobito", waktuAntar: "20-30 menit", rating: 4.5, jumlahReview: 80, sedangBuka: false, whatsapp: "6281234567023", createdAt: now, updatedAt: now },
        { id: "m24", nama: "Toko Olahraga", deskripsi: "Peralatan olahraga", kategori: ["toko"], logo: "https://picsum.photos/seed/m24logo/200", cover: "https://picsum.photos/seed/m24cover/800/400", lokasi: "Stadion", waktuAntar: "25-35 menit", rating: 4.6, jumlahReview: 70, sedangBuka: true, whatsapp: "6281234567024", createdAt: now, updatedAt: now },
    ];

    const { error: mitraError } = await supabase.from("mitra").insert(mitraData);
    if (mitraError) { console.error("[seedMitraData] Error:", mitraError); return; }

    // Menu items - 3 items per mitra
    const menuData: MenuItem[] = [
        // Makanan
        { id: "mn1", mitraId: "m1", nama: "Nasi Pecel", harga: 15000, gambar: "https://picsum.photos/seed/mn1/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn2", mitraId: "m1", nama: "Nasi Rawon", harga: 18000, gambar: "https://picsum.photos/seed/mn2/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn3", mitraId: "m1", nama: "Soto Ayam", harga: 12000, gambar: "https://picsum.photos/seed/mn3/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn4", mitraId: "m2", nama: "Geprek Original", harga: 15000, gambar: "https://picsum.photos/seed/mn4/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn5", mitraId: "m2", nama: "Geprek Mozza", harga: 22000, gambar: "https://picsum.photos/seed/mn5/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn6", mitraId: "m2", nama: "Geprek Sambal Matah", harga: 18000, gambar: "https://picsum.photos/seed/mn6/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn7", mitraId: "m3", nama: "Bakso Urat", harga: 15000, gambar: "https://picsum.photos/seed/mn7/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn8", mitraId: "m3", nama: "Bakso Halus", harga: 12000, gambar: "https://picsum.photos/seed/mn8/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn9", mitraId: "m3", nama: "Mie Ayam Bakso", harga: 15000, gambar: "https://picsum.photos/seed/mn9/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn10", mitraId: "m4", nama: "Mie Ayam Biasa", harga: 12000, gambar: "https://picsum.photos/seed/mn10/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn11", mitraId: "m4", nama: "Mie Ayam Pangsit", harga: 15000, gambar: "https://picsum.photos/seed/mn11/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn12", mitraId: "m4", nama: "Pangsit Goreng", harga: 8000, gambar: "https://picsum.photos/seed/mn12/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn13", mitraId: "m5", nama: "Sate Kambing 10pcs", harga: 35000, gambar: "https://picsum.photos/seed/mn13/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn14", mitraId: "m5", nama: "Gulai Kambing", harga: 30000, gambar: "https://picsum.photos/seed/mn14/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn15", mitraId: "m5", nama: "Tongseng Kambing", harga: 28000, gambar: "https://picsum.photos/seed/mn15/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn16", mitraId: "m6", nama: "Nasi Goreng Seafood", harga: 20000, gambar: "https://picsum.photos/seed/mn16/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn17", mitraId: "m6", nama: "Nasi Goreng Kampung", harga: 15000, gambar: "https://picsum.photos/seed/mn17/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn18", mitraId: "m6", nama: "Mie Goreng Spesial", harga: 18000, gambar: "https://picsum.photos/seed/mn18/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        // Minuman
        { id: "mn19", mitraId: "m7", nama: "Es Kopi Susu", harga: 15000, gambar: "https://picsum.photos/seed/mn19/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn20", mitraId: "m7", nama: "Americano", harga: 12000, gambar: "https://picsum.photos/seed/mn20/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn21", mitraId: "m7", nama: "Matcha Latte", harga: 18000, gambar: "https://picsum.photos/seed/mn21/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn22", mitraId: "m8", nama: "Es Dawet", harga: 8000, gambar: "https://picsum.photos/seed/mn22/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn23", mitraId: "m8", nama: "Es Cendol", harga: 10000, gambar: "https://picsum.photos/seed/mn23/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn24", mitraId: "m8", nama: "Es Campur", harga: 12000, gambar: "https://picsum.photos/seed/mn24/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn25", mitraId: "m9", nama: "Brown Sugar Boba", harga: 18000, gambar: "https://picsum.photos/seed/mn25/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn26", mitraId: "m9", nama: "Taro Milk Tea", harga: 15000, gambar: "https://picsum.photos/seed/mn26/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn27", mitraId: "m9", nama: "Thai Green Tea", harga: 15000, gambar: "https://picsum.photos/seed/mn27/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn28", mitraId: "m10", nama: "Jus Alpukat", harga: 12000, gambar: "https://picsum.photos/seed/mn28/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn29", mitraId: "m10", nama: "Jus Mangga", harga: 10000, gambar: "https://picsum.photos/seed/mn29/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn30", mitraId: "m10", nama: "Jus Jeruk", harga: 8000, gambar: "https://picsum.photos/seed/mn30/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn31", mitraId: "m11", nama: "Thai Tea Original", harga: 12000, gambar: "https://picsum.photos/seed/mn31/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn32", mitraId: "m11", nama: "Thai Green Tea", harga: 12000, gambar: "https://picsum.photos/seed/mn32/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn33", mitraId: "m11", nama: "Thai Coffee", harga: 15000, gambar: "https://picsum.photos/seed/mn33/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn34", mitraId: "m12", nama: "Berry Smoothie", harga: 20000, gambar: "https://picsum.photos/seed/mn34/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn35", mitraId: "m12", nama: "Green Smoothie", harga: 18000, gambar: "https://picsum.photos/seed/mn35/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn36", mitraId: "m12", nama: "Protein Shake", harga: 25000, gambar: "https://picsum.photos/seed/mn36/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        // Retail
        { id: "mn37", mitraId: "m13", nama: "Dimsum 10pcs", harga: 25000, gambar: "https://picsum.photos/seed/mn37/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn38", mitraId: "m13", nama: "Nugget 500g", harga: 35000, gambar: "https://picsum.photos/seed/mn38/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn39", mitraId: "m13", nama: "Sosis Sapi 1kg", harga: 45000, gambar: "https://picsum.photos/seed/mn39/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn40", mitraId: "m14", nama: "Keripik Singkong", harga: 15000, gambar: "https://picsum.photos/seed/mn40/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn41", mitraId: "m14", nama: "Kacang Atom", harga: 12000, gambar: "https://picsum.photos/seed/mn41/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn42", mitraId: "m14", nama: "Rempeyek Kacang", harga: 20000, gambar: "https://picsum.photos/seed/mn42/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn43", mitraId: "m15", nama: "Bumbu Rendang", harga: 15000, gambar: "https://picsum.photos/seed/mn43/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn44", mitraId: "m15", nama: "Bumbu Opor", harga: 12000, gambar: "https://picsum.photos/seed/mn44/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn45", mitraId: "m15", nama: "Santan 1L", harga: 18000, gambar: "https://picsum.photos/seed/mn45/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn46", mitraId: "m16", nama: "Beras 5kg", harga: 65000, gambar: "https://picsum.photos/seed/mn46/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn47", mitraId: "m16", nama: "Gula 1kg", harga: 15000, gambar: "https://picsum.photos/seed/mn47/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn48", mitraId: "m16", nama: "Minyak 2L", harga: 35000, gambar: "https://picsum.photos/seed/mn48/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn49", mitraId: "m17", nama: "Popok Bayi M", harga: 85000, gambar: "https://picsum.photos/seed/mn49/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn50", mitraId: "m17", nama: "Susu Formula", harga: 120000, gambar: "https://picsum.photos/seed/mn50/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn51", mitraId: "m17", nama: "Baby Wipes", harga: 25000, gambar: "https://picsum.photos/seed/mn51/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn52", mitraId: "m18", nama: "Sunscreen SPF50", harga: 75000, gambar: "https://picsum.photos/seed/mn52/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn53", mitraId: "m18", nama: "Lip Tint", harga: 45000, gambar: "https://picsum.photos/seed/mn53/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn54", mitraId: "m18", nama: "Serum Vitamin C", harga: 95000, gambar: "https://picsum.photos/seed/mn54/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        // Toko
        { id: "mn55", mitraId: "m19", nama: "Charger Fast 20W", harga: 85000, gambar: "https://picsum.photos/seed/mn55/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn56", mitraId: "m19", nama: "Earphone Bluetooth", harga: 150000, gambar: "https://picsum.photos/seed/mn56/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn57", mitraId: "m19", nama: "Power Bank 10000", harga: 180000, gambar: "https://picsum.photos/seed/mn57/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn58", mitraId: "m20", nama: "Buku Tulis 10pcs", harga: 25000, gambar: "https://picsum.photos/seed/mn58/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn59", mitraId: "m20", nama: "Pensil 2B 12pcs", harga: 15000, gambar: "https://picsum.photos/seed/mn59/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn60", mitraId: "m20", nama: "Penghapus Set", harga: 8000, gambar: "https://picsum.photos/seed/mn60/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn61", mitraId: "m21", nama: "Cat Tembok 5kg", harga: 150000, gambar: "https://picsum.photos/seed/mn61/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn62", mitraId: "m21", nama: "Semen 50kg", harga: 65000, gambar: "https://picsum.photos/seed/mn62/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn63", mitraId: "m21", nama: "Paku 1kg", harga: 25000, gambar: "https://picsum.photos/seed/mn63/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn64", mitraId: "m22", nama: "Makanan Kucing 1kg", harga: 45000, gambar: "https://picsum.photos/seed/mn64/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn65", mitraId: "m22", nama: "Pasir Kucing 5L", harga: 35000, gambar: "https://picsum.photos/seed/mn65/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn66", mitraId: "m22", nama: "Mainan Kucing", harga: 25000, gambar: "https://picsum.photos/seed/mn66/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn67", mitraId: "m23", nama: "Lego Set", harga: 150000, gambar: "https://picsum.photos/seed/mn67/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn68", mitraId: "m23", nama: "Boneka Bear", harga: 85000, gambar: "https://picsum.photos/seed/mn68/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn69", mitraId: "m23", nama: "Mobil Remote", harga: 120000, gambar: "https://picsum.photos/seed/mn69/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn70", mitraId: "m24", nama: "Bola Sepak", harga: 95000, gambar: "https://picsum.photos/seed/mn70/300", terlaris: true, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn71", mitraId: "m24", nama: "Raket Badminton", harga: 150000, gambar: "https://picsum.photos/seed/mn71/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
        { id: "mn72", mitraId: "m24", nama: "Sepatu Futsal", harga: 250000, gambar: "https://picsum.photos/seed/mn72/300", terlaris: false, tersedia: true, createdAt: now, updatedAt: now },
    ];

    const { error: menuError } = await supabase.from("menu_items").insert(menuData);
    if (menuError) { console.error("[seedMitraData] Menu error:", menuError); return; }

    console.log("[seedMitraData] Successfully seeded 24 mitra with 72 menu items");
}
