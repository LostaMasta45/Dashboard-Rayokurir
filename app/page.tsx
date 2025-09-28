"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/login-form"
import { Sidebar } from "@/components/sidebar"
import { AdminDashboard } from "@/components/admin-dashboard"
import { OrdersPage } from "@/components/orders-page"
import { KeuanganPage } from "@/components/keuangan-page"
import { KurirPage } from "@/components/kurir-page"
import { DatabasePage } from "@/components/database-page"
import { ReportsPage } from "@/components/reports-page"
import { KurirDashboard } from "@/components/kurir-dashboard"
import { getCurrentUser, logout, type User } from "@/lib/auth"

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser)
  }

  const handleLogout = () => {
    logout()
    setUser(null)
    setCurrentPage("dashboard")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rayo-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />
  }

  const renderPage = () => {
    if (user.role === "KURIR") {
      return <KurirDashboard user={user} />
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
      case "database":
        return <DatabasePage />
      case "reports":
        return <ReportsPage />
      default:
        return <AdminDashboard />
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} onLogout={handleLogout} userRole={user.role} />
      <main className="flex-1 lg:ml-0 w-full overflow-x-hidden">
        <div className="p-3 sm:p-4 lg:p-6 xl:p-8 pt-16 sm:pt-20 lg:pt-6 min-h-screen max-w-full">{renderPage()}</div>
      </main>
    </div>
  )
}
