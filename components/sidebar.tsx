"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Package, DollarSign, Users, LogOut, Menu, X, Database, BarChart3 } from "lucide-react"

interface SidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
  onLogout: () => void
  userRole: "ADMIN" | "KURIR"
}

export function Sidebar({ currentPage, onPageChange, onLogout, userRole }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  const adminMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: Package },
    { id: "keuangan", label: "Keuangan", icon: DollarSign },
    { id: "kurir", label: "Kurir", icon: Users },
    { id: "database", label: "Database", icon: Database },
    { id: "reports", label: "Laporan", icon: BarChart3 },
  ]

  const kurirMenuItems = [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }]

  const menuItems = userRole === "ADMIN" ? adminMenuItems : kurirMenuItems

  const toggleSidebar = () => setIsOpen(!isOpen)

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden bg-white shadow-lg border border-border hover:bg-gray-50 h-10 w-10 sm:h-12 sm:w-12 sm:top-4 sm:left-4"
        onClick={toggleSidebar}
      >
        {isOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
      </Button>

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-64 sm:w-72 bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-200 z-40 transform transition-all duration-300 ease-in-out shadow-xl",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-0 lg:shadow-none",
        )}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center">
              <img src="/rayo-logo.png" alt="Rayo Kurir Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-lg sm:text-xl text-gray-900">Rayo Kurir</h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">{userRole}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-3 sm:p-4">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2 sm:gap-3 h-10 sm:h-12 px-3 sm:px-4 rounded-xl font-medium transition-all duration-200 text-sm sm:text-base",
                    isActive
                      ? "bg-rayo-primary text-white shadow-lg hover:bg-rayo-dark"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                  )}
                  onClick={() => {
                    onPageChange(item.id)
                    setIsOpen(false)
                  }}
                >
                  <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", isActive ? "text-white" : "text-gray-500")} />
                  <span className="truncate">{item.label}</span>
                </Button>
              )
            })}
          </nav>
        </div>

        <div className="p-3 sm:p-4 border-t border-gray-100">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 sm:gap-3 h-10 sm:h-12 px-3 sm:px-4 rounded-xl font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 text-sm sm:text-base"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">Logout</span>
          </Button>
        </div>
      </div>
    </>
  )
}
