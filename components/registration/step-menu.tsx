"use client";

import React, { useState } from "react";
import { RegistrationData, MenuItemDraft } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/image-upload";
import { Plus, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { generateId } from "@/lib/auth"; // Reuse utility
import { formatCurrency } from "@/lib/auth";

interface StepMenuProps {
    data: RegistrationData;
    updateData: (updates: Partial<RegistrationData>) => void;
}

export function StepMenu({ data, updateData }: StepMenuProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState<MenuItemDraft>({
        id: "",
        nama: "",
        harga: 0,
        gambar: "",
        deskripsi: ""
    });

    const startAdding = () => {
        setNewItem({
            id: generateId(),
            nama: "",
            harga: 0,
            gambar: "",
            deskripsi: ""
        });
        setIsAdding(true);
    };

    const handleSaveItem = () => {
        if (!newItem.nama) return;
        // Add to list
        const updated = [...data.menuItems, newItem];
        updateData({ menuItems: updated });
        setIsAdding(false);
    };

    const handleRemoveItem = (id: string) => {
        const updated = data.menuItems.filter(item => item.id !== id);
        updateData({ menuItems: updated });
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-1 mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Daftar Menu</h2>
                <p className="text-sm text-gray-500">Masukkan beberapa menu andalan Anda.</p>
            </div>

            {/* List of Added Items */}
            <div className="space-y-3">
                {data.menuItems.length === 0 && !isAdding && (
                    <div className="text-center p-6 border-2 border-dashed border-gray-100 rounded-xl">
                        <p className="text-gray-400 text-sm mb-3">Belum ada menu yang ditambahkan</p>
                        <Button onClick={startAdding} variant="outline" className="border-teal-500 text-teal-600 bg-teal-50">
                            <Plus className="w-4 h-4 mr-2" /> Tambah Menu Pertama
                        </Button>
                    </div>
                )}

                {data.menuItems.map((item) => (
                    <Card key={item.id} className="p-3 flex items-center gap-3 relative group">
                        <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden shrink-0">
                            {item.gambar ? (
                                <img src={item.gambar} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-gray-900">{item.nama}</h4>
                            <p className="text-teal-600 text-xs font-medium">{formatCurrency(item.harga)}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-300 hover:text-red-500"
                            onClick={() => handleRemoveItem(item.id)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </Card>
                ))}
            </div>

            {/* Add New Item Form */}
            {isAdding && (
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-black/20 animate-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Menu Baru</h3>
                            <p className="text-sm text-gray-500">Tambahkan detail menu yang akan dijual</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)} className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                            <X className="w-5 h-5 text-gray-500" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 md:gap-8">
                        {/* Image Section */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Foto Menu</Label>
                            <ImageUpload
                                value={newItem.gambar}
                                onChange={(url) => setNewItem({ ...newItem, gambar: url })}
                                folder="menus"
                                aspectRatio="square"
                                className="w-full aspect-square md:w-36 md:h-36"
                                placeholder="Foto Menu"
                            />
                            <p className="text-[10px] text-gray-400 text-center leading-tight">
                                Disarankan rasio 1:1
                            </p>
                        </div>

                        {/* Inputs Section */}
                        <div className="space-y-5">
                            <div>
                                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Nama Menu</Label>
                                <Input
                                    value={newItem.nama}
                                    onChange={e => setNewItem({ ...newItem, nama: e.target.value })}
                                    placeholder="Contoh: Nasi Goreng Spesial"
                                    className="h-11 bg-gray-50 dark:bg-gray-800/50"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Harga</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">Rp</span>
                                        <Input
                                            type="number"
                                            value={newItem.harga || ""}
                                            onChange={e => setNewItem({ ...newItem, harga: parseInt(e.target.value) || 0 })}
                                            placeholder="0"
                                            className="h-11 pl-10 bg-gray-50 dark:bg-gray-800/50"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Deskripsi (Opsional)</Label>
                                    <Input
                                        value={newItem.deskripsi || ""}
                                        onChange={e => setNewItem({ ...newItem, deskripsi: e.target.value })}
                                        placeholder="Penjelasan singkat..."
                                        className="h-11 bg-gray-50 dark:bg-gray-800/50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 gap-3">
                        <Button variant="outline" onClick={() => setIsAdding(false)} className="h-11 px-6">
                            Batal
                        </Button>
                        <Button onClick={handleSaveItem} className="bg-teal-600 hover:bg-teal-700 h-11 px-8 text-white shadow-lg shadow-teal-600/20 font-medium">
                            Simpan Menu
                        </Button>
                    </div>
                </div>
            )}

            {!isAdding && data.menuItems.length > 0 && (
                <Button onClick={startAdding} variant="outline" className="w-full border-dashed border-gray-300 text-gray-500 hover:text-teal-600 hover:border-teal-500">
                    <Plus className="w-4 h-4 mr-2" /> Tambah Menu Lain
                </Button>
            )}
        </div>
    );
}
