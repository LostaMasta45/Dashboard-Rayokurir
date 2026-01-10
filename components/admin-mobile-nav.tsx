"use client";

import { LayoutDashboard, Package, Users, DollarSign, MoreHorizontal, Database, BarChart3, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminMobileNavProps {
    currentPage: string;
    onPageChange: (page: string) => void;
    onLogout: () => void;
}

export function AdminMobileNav({ currentPage, onPageChange, onLogout }: AdminMobileNavProps) {
    const tabs = [
        { id: "dashboard", label: "Home", icon: LayoutDashboard },
        { id: "kurir", label: "Kurir", icon: Users },
        { id: "orders", label: "Orders", icon: Package, isSpecial: true },
        { id: "keuangan", label: "Keuangan", icon: DollarSign },
        { id: "more", label: "Menu", icon: MoreHorizontal },
    ];

    const moreItems = [
        { id: "database", label: "Database", icon: Database },
        { id: "reports", label: "Laporan", icon: BarChart3 },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            {/* Glass Background - Full Width, Docked to Bottom */}
            <div className="absolute inset-x-0 bottom-0 h-[84px] bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-[20px]" />

            <div className="relative flex items-center justify-between px-2 pb-3 pt-2 h-[84px] max-w-md mx-auto w-full">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isMoreActive = tab.id === "more" && moreItems.some(i => i.id === currentPage);
                    const isActive = currentPage === tab.id || isMoreActive;

                    // Special Center Button (Orders)
                    if (tab.isSpecial) {
                        return (
                            <div key={tab.id} className="relative -top-8 flex flex-col items-center justify-center w-20">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    animate={{
                                        boxShadow: isActive
                                            ? "0 10px 25px -5px rgba(59, 130, 246, 0.5)"
                                            : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                    }}
                                    onClick={() => onPageChange(tab.id)}
                                    className={cn(
                                        "w-16 h-16 rounded-full flex items-center justify-center border-[4px] border-white dark:border-gray-950 transition-colors z-20",
                                        isActive
                                            ? "bg-gradient-to-tr from-sky-500 to-blue-600 text-white"
                                            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                                    )}
                                >
                                    <motion.div
                                        animate={isActive ? { rotate: [0, -10, 10, 0] } : {}}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                    >
                                        <Package size={28} strokeWidth={2.5} />
                                    </motion.div>
                                </motion.button>

                                {/* Label for Special Button */}
                                <span className={cn(
                                    "text-[10px] font-bold mt-1 transition-colors duration-200 absolute -bottom-5",
                                    isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                                )}>
                                    {tab.label}
                                </span>

                                {/* Ripple Pulse Effect when active */}
                                {isActive && (
                                    <div className="absolute top-0 inset-0 -z-10 bg-blue-500/20 rounded-full w-16 h-16 animate-ping" />
                                )}
                            </div>
                        );
                    }

                    // Standard Button
                    const ButtonContent = (
                        <div className="flex flex-col items-center gap-1">
                            <motion.div
                                className={cn(
                                    "p-1.5 rounded-xl transition-colors",
                                    isActive && "bg-blue-50 dark:bg-blue-900/20"
                                )}
                                whileTap={{ scale: 0.9 }}
                            >
                                <Icon
                                    size={22}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={cn(
                                        "transition-colors",
                                        isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                                    )}
                                />
                            </motion.div>
                            <span className={cn(
                                "text-[10px] font-medium transition-colors",
                                isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                            )}>
                                {tab.label}
                            </span>
                        </div>
                    );

                    // Dropdown for More
                    if (tab.id === "more") {
                        return (
                            <DropdownMenu key={tab.id}>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex-1 flex items-center justify-center h-full outline-none">
                                        {ButtonContent}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" sideOffset={10} className="w-48 mb-2 z-[60]">
                                    {moreItems.map((item) => (
                                        <DropdownMenuItem
                                            key={item.id}
                                            onClick={() => onPageChange(item.id)}
                                            className={cn("gap-3 py-3 cursor-pointer", currentPage === item.id && "bg-blue-50 dark:bg-blue-900/10 text-blue-600")}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.label}</span>
                                        </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuItem onClick={onLogout} className="gap-3 py-3 text-red-600 cursor-pointer">
                                        <LogOut className="h-4 w-4" />
                                        <span>Logout</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        );
                    }

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onPageChange(tab.id)}
                            className="flex-1 flex items-center justify-center h-full outline-none"
                        >
                            {ButtonContent}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
