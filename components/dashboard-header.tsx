"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Package, DollarSign, Users, LogOut, Database, BarChart3, Sun, Moon, Bell } from "lucide-react"
import { useTheme } from "next-themes"
import { NotificationCenter } from "@/components/notification-center"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface DashboardHeaderProps {
    currentPage: string
    onPageChange: (page: string) => void
    onLogout: () => void
    userRole: "ADMIN" | "KURIR"
    user?: any
}

export function DashboardHeader({ currentPage, onPageChange, onLogout, userRole, user }: DashboardHeaderProps) {
    const { setTheme, theme } = useTheme()

    const adminMenuItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "orders", label: "Orders", icon: Package },
        { id: "keuangan", label: "Keuangan", icon: DollarSign },
        { id: "kurir", label: "Kurir", icon: Users },
        { id: "database", label: "Database", icon: Database },
        { id: "reports", label: "Laporan", icon: BarChart3 },
    ]

    // For Desktop Navigation
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-gray-200 dark:border-gray-800">
            <div className="w-full max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Left: Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-rayo-primary/10">
                        <img src="/rayo-logo.png" alt="Rayo Kurir Logo" className="w-full h-full object-contain p-1" />
                    </div>
                    <span className="font-bold text-lg sm:text-xl text-gray-900 dark:text-gray-100 hidden sm:block">
                        Rayo Kurir
                    </span>
                </div>

                {/* Center: Desktop Navigation (Hidden on Mobile) */}
                {userRole === "ADMIN" && (
                    <nav className="hidden lg:flex items-center gap-1 mx-6">
                        {adminMenuItems.map((item) => {
                            const Icon = item.icon
                            const isActive = currentPage === item.id
                            return (
                                <Button
                                    key={item.id}
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                                        isActive
                                            ? "bg-rayo-primary/10 text-rayo-primary font-medium"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    )}
                                    onClick={() => onPageChange(item.id)}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                </Button>
                            )
                        })}
                    </nav>
                )}

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    >
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    {/* Notifications (Admin Only) */}
                    {userRole === "ADMIN" && <NotificationCenter />}

                    {/* User Profile / Logout */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src="/avatars/01.png" alt="Avatar" />
                                    <AvatarFallback>{user?.username?.slice(0, 2).toUpperCase() || "AD"}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
