"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Package, DollarSign, Users, LogOut, Menu, X, Database, BarChart3, Sun, Moon, Camera, Store } from "lucide-react"
import { useTheme } from "next-themes"
import { NotificationCenter } from "@/components/notification-center"

interface SidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
  onLogout: () => void
  userRole: "ADMIN" | "KURIR"
}

export function Sidebar({ currentPage, onPageChange, onLogout, userRole }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { setTheme, theme } = useTheme()

  const adminMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: Package },
    { id: "keuangan", label: "Keuangan", icon: DollarSign },
    { id: "kurir", label: "Kurir", icon: Users },
    { id: "mitra", label: "Mitra", icon: Store },
    { id: "database", label: "Database", icon: Database },
    { id: "reports", label: "Laporan", icon: BarChart3 },
    { id: "pod", label: "Bukti Pengiriman", icon: Camera },
  ]

  const kurirMenuItems = [
    { id: "dashboard", label: "Home", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: Package },
    { id: "upload", label: "Upload Foto", icon: Camera },
    { id: "keuangan", label: "Keuangan", icon: DollarSign },
    { id: "profile", label: "Profil", icon: Users },
  ]

  const menuItems = userRole === "ADMIN" ? adminMenuItems : kurirMenuItems

  const toggleSidebar = () => setIsOpen(!isOpen)

  return (
    <>
      {/* Mobile menu button */}
      {userRole !== "KURIR" && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-3 left-3 z-50 lg:hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm border border-border h-10 w-10 sm:h-12 sm:w-12 rounded-xl"
          onClick={toggleSidebar}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      )}

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-72 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 z-40 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:fixed lg:inset-y-0 lg:z-0 lg:shadow-none",
        )}
      >
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-rayo-primary to-rayo-dark shadow-lg shadow-rayo-primary/20">
              <img src="/rayo-logo.png" alt="Rayo Kurir Logo" className="w-10 h-10 object-contain brightness-0 invert" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-rayo-dark dark:text-rayo-primary">Rayo Kurir</h1>
              <p className="text-[10px] font-bold text-white bg-rayo-primary px-2 py-0.5 rounded-full inline-block mt-1 tracking-wide uppercase">{userRole} PANEL</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-2 overflow-y-auto custom-scrollbar">
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3.5 h-12 px-4 rounded-xl font-medium transition-all duration-300 relative overflow-hidden group",
                    isActive
                      ? "bg-rayo-primary text-white shadow-md shadow-rayo-primary/25"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-200",
                  )}
                  onClick={() => {
                    onPageChange(item.id)
                    setIsOpen(false)
                  }}
                >
                  <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-white" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300")} />
                  <span className="text-[15px] relative z-10">{item.label}</span>
                </Button>
              )
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2 bg-gray-50/50 dark:bg-gray-900/50">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11 px-4 rounded-xl font-medium text-gray-600 hover:text-gray-900 hover:bg-white dark:hover:bg-gray-800 dark:text-gray-400 transition-all shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="text-sm">Tampilan: {theme === 'light' ? 'Terang' : 'Gelap'}</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11 px-4 rounded-xl font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
            onClick={onLogout}
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm">Keluar Aplikasi</span>
          </Button>
        </div>
      </div>
    </>
  )
}
