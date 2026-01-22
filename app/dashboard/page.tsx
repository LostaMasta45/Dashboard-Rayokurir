"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { AdminDashboard } from "@/components/admin-dashboard"
import { OrdersPage } from "@/components/orders-page"
import { KeuanganPage } from "@/components/keuangan-page"
import { KurirPage } from "@/components/kurir-page"
import { DatabasePage } from "@/components/database-page"
import { ReportsPage } from "@/components/reports-page"
import { KurirDashboard } from "@/components/kurir-dashboard"
import { AdminMobileNav } from "@/components/admin-mobile-nav"
import { DashboardHeader } from "@/components/dashboard-header"
import { MitraPage } from "@/components/mitra-page"
import { PodGalleryPage } from "@/components/pod-gallery-page"
import { getCurrentSession, logoutUser, type User } from "@/lib/auth"

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null)
    const [currentPage, setCurrentPage] = useState("dashboard")
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const checkSession = async () => {
            const currentUser = await getCurrentSession()
            if (!currentUser) {
                router.push("/login")
                return
            }
            setUser(currentUser)
            setLoading(false)
        }
        checkSession()
    }, [router])

    const handleLogout = async () => {
        await logoutUser()
        setUser(null)
        router.push("/login")
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rayo-primary"></div>
            </div>
        )
    }

    if (!user) {
        return null // Will redirect
    }

    const renderPage = () => {
        if (user.role === "KURIR") {
            const tabMap: Record<string, string> = {
                "dashboard": "home",
                "orders": "orders",
                "upload": "upload",
                "keuangan": "wallet",
                "profile": "profile"
            };
            return <KurirDashboard user={user} viewMode={tabMap[currentPage] || "home"} />
        }

        switch (currentPage) {
            case "dashboard":
                return <AdminDashboard />
            case "orders":
                return <OrdersPage />
            case "keuangan":
                return <KeuanganPage />
            case "kurir":
                return <KurirPage />
            case "mitra":
                return <MitraPage />
            case "database":
                return <DatabasePage />
            case "reports":
                return <ReportsPage />
            case "pod":
                return <PodGalleryPage />
            default:
                return <AdminDashboard />
        }
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-background overflow-x-hidden w-full">
            {/* Sidebar - For all users on desktop */}
            <Sidebar
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onLogout={handleLogout}
                userRole={user.role}
            />

            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:ml-72">
                {/* Header - Visible only on mobile/tablet */}
                <div className="lg:hidden">
                    <DashboardHeader
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        onLogout={handleLogout}
                        userRole={user.role}
                        user={user}
                    />
                </div>

                <main className={`flex-1 w-full mx-auto overflow-x-hidden ${user.role === "KURIR" ? "p-0" : "max-w-7xl p-4 lg:p-8 pb-32 lg:pb-8"}`}>
                    {renderPage()}
                </main>

                {/* Mobile Bottom Nav - Admin Only */}
                {user.role === "ADMIN" && (
                    <div className="lg:hidden">
                        <AdminMobileNav
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                            onLogout={handleLogout}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

