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
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-teal-100 dark:border-teal-900/30 animate-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-sm text-teal-700">Menu Baru</span>
                        <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="h-6 w-6 p-0 rounded-full">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label className="text-xs font-semibold mb-2 block">Foto (Opsional)</Label>
                            <ImageUpload
                                value={newItem.gambar}
                                onChange={(url) => setNewItem({ ...newItem, gambar: url })}
                                folder="menus"
                                aspectRatio="square"
                                className="w-24 h-24"
                                placeholder="Foto"
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-semibold">Nama Menu</Label>
                            <Input
                                value={newItem.nama}
                                onChange={e => setNewItem({ ...newItem, nama: e.target.value })}
                                placeholder="Cth: Nasi Goreng Spesial"
                                className="h-9 mt-1"
                                autoFocus
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-semibold">Harga</Label>
                            <Input
                                type="number"
                                value={newItem.harga || ""}
                                onChange={e => setNewItem({ ...newItem, harga: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                                className="h-9 mt-1"
                            />
                        </div>

                        <Button onClick={handleSaveItem} className="w-full bg-teal-600 hover:bg-teal-700 h-9 text-sm">
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
