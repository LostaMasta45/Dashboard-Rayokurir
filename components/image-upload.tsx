"use client";

import type React from "react";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Upload, X, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    onRemove?: () => void;
    bucket?: string;
    folder?: string;
    label?: string;
    placeholder?: string;
    aspectRatio?: "square" | "video" | "banner";
    className?: string;
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    bucket = "mitra-images",
    folder = "general",
    label = "Upload Gambar",
    placeholder = "Klik atau drag foto di sini",
    aspectRatio = "square",
    className = "",
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const aspectRatioClass = {
        square: "aspect-square",
        video: "aspect-video",
        banner: "aspect-[3/1]",
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("File harus berupa gambar");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran file maksimal 5MB");
            return;
        }

        setIsUploading(true);

        try {
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrl(e.target?.result as string);
            };
            reader.readAsDataURL(file);

            // Upload to Supabase Storage
            const fileExt = file.name.split(".").pop();
            const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (error) throw error;

            // Get public URL
            const { data: publicUrlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            const photoUrl = publicUrlData?.publicUrl || "";
            setPreviewUrl(photoUrl);
            onChange(photoUrl);
            toast.success("Foto berhasil diupload");
        } catch (error) {
            console.error("Error uploading photo:", error);
            toast.error("Gagal mengupload foto");
            setPreviewUrl(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        onChange("");
        onRemove?.();
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file && fileInputRef.current) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInputRef.current.files = dataTransfer.files;
            fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    return (
        <div className={className}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {!previewUrl ? (
                <div
                    className={`relative ${aspectRatioClass[aspectRatio]} w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 transition-all group`}
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 text-teal-500 animate-spin" />
                            <span className="text-sm text-gray-500">Mengupload...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 p-4">
                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 transition-colors">
                                <ImagePlus className="h-6 w-6 text-gray-400 group-hover:text-teal-500 transition-colors" />
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 text-center">
                                {placeholder}
                            </p>
                            <p className="text-xs text-gray-400">
                                JPG, PNG, WEBP (max 5MB)
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className={`relative ${aspectRatioClass[aspectRatio]} w-full rounded-xl overflow-hidden group`}>
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white/90 hover:bg-white"
                        >
                            <Upload className="h-4 w-4 mr-1" />
                            Ganti
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleRemove}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Hapus
                        </Button>
                    </div>
                    {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
