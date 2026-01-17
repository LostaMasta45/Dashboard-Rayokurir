/**
 * Pricing utility for Rayo Kurir Ongkir Calculator
 * 
 * Model:
 * - D1 = pickup cost (basecamp → pickup location) with CAP at Rp4,000
 * - D2 = delivery cost (pickup → dropoff) 
 * - Total = MAX(3000, D1 + D2) + add-ons
 */

// Basecamp coordinates (Sumobito)
export const BASECAMP = {
    lat: -7.520653,
    lng: 112.343111,
    label: "Basecamp Rayo Kurir"
}

// Express fee
export const EXPRESS_FEE = 2000

// Minimum ongkir
export const MIN_ONGKIR = 3000

/**
 * Calculate D1 (pickup fee) based on distance from basecamp
 * Tier: 0-1km=1k, 1-3km=2k, 3-5km=3k, >5km=4k (cap)
 */
export function calculateD1(distanceKm: number): number {
    if (distanceKm <= 1) return 1000
    if (distanceKm <= 3) return 2000
    if (distanceKm <= 5) return 3000
    return 4000 // cap
}

/**
 * Calculate D2 (delivery fee) based on distance from pickup to dropoff
 * Tier: 0-0.7km=3k, 0.7-1.5km=4k, 1.5-2.5km=5k, 2.5-3.5km=6k, 3.5-4.5km=7k, >4.5km=8k+
 */
export function calculateD2(distanceKm: number): number {
    if (distanceKm <= 0.7) return 3000
    if (distanceKm <= 1.5) return 4000
    if (distanceKm <= 2.5) return 5000
    if (distanceKm <= 3.5) return 6000
    if (distanceKm <= 4.5) return 7000
    // Beyond 4.5km: 8k base + 1k per additional km
    const extraKm = Math.ceil(distanceKm - 4.5)
    return 8000 + (extraKm * 1000)
}

/**
 * Calculate total ongkir
 */
export function calculateOngkir(
    d1Km: number,
    d2Km: number,
    isExpress: boolean = false
): {
    d1Fee: number
    d2Fee: number
    expressFee: number
    subtotal: number
    total: number
} {
    const d1Fee = calculateD1(d1Km)
    const d2Fee = calculateD2(d2Km)
    const subtotal = Math.max(MIN_ONGKIR, d1Fee + d2Fee)
    const expressFee = isExpress ? EXPRESS_FEE : 0
    const total = subtotal + expressFee

    return {
        d1Fee,
        d2Fee,
        expressFee,
        subtotal,
        total
    }
}

/**
 * Calculate Haversine distance (straight-line) between two coordinates
 * Used as fallback when API fails
 */
export function haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371 // Earth's radius in km
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180)
}

/**
 * Format price to Indonesian Rupiah
 */
export function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount)
}

/**
 * Generate WhatsApp link with prefilled message
 */
export function generateWhatsAppLink(
    pickupLabel: string,
    dropoffLabel: string,
    total: number,
    isExpress: boolean,
    notes: string = ""
): string {
    const phone = "6281234567890" // Replace with actual number
    const message = encodeURIComponent(
        `Halo Rayo Kurir, mau order 🙏
• Jemput: ${pickupLabel}
• Antar: ${dropoffLabel}
• Estimasi ongkir: ${formatRupiah(total)}
• Express: ${isExpress ? "YA" : "TIDAK"}

Catatan barang/titip beli:
${notes || "..."}`)

    return `https://wa.me/${phone}?text=${message}`
}
