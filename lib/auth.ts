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
    };
    dropoff: {
        alamat: string;
    };
    kurirId: string | null;
    status:
        | "MENUNGGU_PICKUP"
        | "PICKUP_OTW"
        | "BARANG_DIAMBIL"
        | "SEDANG_DIKIRIM"
        | "SELESAI";
    jenisOrder: "Barang" | "Makanan" | "Dokumen" | "Antar Jemput";
    serviceType: "Reguler" | "Express" | "Same Day";
    ongkir: number;
    danaTalangan: number;
    bayarOngkir: "NON_COD" | "COD";
    talanganReimbursed?: boolean;
    cod: {
        nominal: number;
        isCOD: boolean;
        codPaid: boolean;
    };
    nonCodPaid: boolean;
    notes?: string;
}

export interface Courier {
    id: string;
    nama: string;
    wa: string;
    aktif: boolean;
    online: boolean;
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

export async function getCouriers(): Promise<Courier[]> {
    const { data, error } = await supabase.from("couriers").select("*");
    return data || [];
}

export async function saveCourier(courier: Courier): Promise<Courier | null> {
    const { data, error } = await supabase
        .from("couriers")
        .insert([courier])
        .select()
        .single();
    return data || null;
}

export async function updateCourier(courier: Courier): Promise<Courier | null> {
    const { data, error } = await supabase
        .from("couriers")
        .update(courier)
        .eq("id", courier.id)
        .select()
        .single();
    return data || null;
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
                `"${
                    contact.lastContacted
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
    MENUNGGU_PICKUP: {
        label: "Menunggu Pickup",
        color: "bg-gray-100 text-gray-800",
    },
    PICKUP_OTW: { label: "Pickup OTW", color: "bg-blue-100 text-blue-800" },
    BARANG_DIAMBIL: {
        label: "Barang Diambil",
        color: "bg-yellow-100 text-yellow-800",
    },
    SEDANG_DIKIRIM: {
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
    // Define allowed status transitions for couriers
    const courierAllowedTransitions: Record<
        Order["status"],
        Order["status"][]
    > = {
        MENUNGGU_PICKUP: ["PICKUP_OTW"],
        PICKUP_OTW: ["BARANG_DIAMBIL"],
        BARANG_DIAMBIL: ["SEDANG_DIKIRIM"],
        SEDANG_DIKIRIM: ["SELESAI"],
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
