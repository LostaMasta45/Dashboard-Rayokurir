"use client";

import type React from "react";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, CheckCircle, Loader2 } from "lucide-react";
import type { Order } from "@/lib/auth";

interface PODUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    courierId: string;
    onUploaded: () => void;
}

export function PODUploadModal({
    isOpen,
    onClose,
    order,
    courierId,
    onUploaded,
}: PODUploadModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setErrorMessage(null);
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrl(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !order) return;

        setIsUploading(true);
        setErrorMessage(null);

        try {
            // Upload file to Supabase Storage
            const fileExt = selectedFile.name.split(".").pop();
            const fileName = `pod_${order.id}_${Date.now()}.${fileExt}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("courier-photos")
                .upload(fileName, selectedFile, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (uploadError) {
                throw new Error(`Upload gagal: ${uploadError.message}`);
            }

            // Get public URL
            const { data: publicUrlData } = supabase.storage
                .from("courier-photos")
                .getPublicUrl(fileName);

            const photoUrl = publicUrlData?.publicUrl || "";

            // Get current order data to preserve auditLog
            const { data: currentOrder } = await supabase
                .from("orders")
                .select("podPhotos, auditLog")
                .eq("id", order.id)
                .single();

            // Update order with POD photo and set status to DELIVERED
            const currentPodPhotos = currentOrder?.podPhotos || [];
            const currentAuditLog = currentOrder?.auditLog || [];

            // Add audit log entry
            currentAuditLog.push({
                event: "POD_UPLOADED",
                at: new Date().toISOString(),
                actorType: "COURIER",
                actorId: courierId,
                meta: { photoUrl, previousStatus: order.status },
            });

            const { error: updateError } = await supabase
                .from("orders")
                .update({
                    podPhotos: [...currentPodPhotos, photoUrl],
                    status: "DELIVERED",
                    auditLog: currentAuditLog,
                })
                .eq("id", order.id);

            if (updateError) {
                throw new Error(`Gagal update order: ${updateError.message}`);
            }

            setUploadSuccess(true);
            setIsUploading(false);

            // Wait a moment then close
            setTimeout(() => {
                handleClose();
                onUploaded();
            }, 1500);
        } catch (error) {
            console.error("Error uploading POD:", error);
            setErrorMessage(error instanceof Error ? error.message : "Terjadi kesalahan saat upload");
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setUploadSuccess(false);
        setErrorMessage(null);
        onClose();
    };

    const removePhoto = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setErrorMessage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    if (!order) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-pink-500" />
                        Upload Foto POD
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Order Info */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Order</p>
                        <p className="font-mono font-bold text-gray-900 dark:text-white">
                            #{order.id.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {order.dropoff?.alamat || "Alamat dropoff"}
                        </p>
                    </div>

                    {/* Success Message */}
                    {uploadSuccess && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-green-500" />
                            <div>
                                <p className="font-semibold text-green-700 dark:text-green-300">
                                    POD Berhasil Diupload!
                                </p>
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    Status order diubah ke SELESAI
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {errorMessage && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {errorMessage}
                            </p>
                        </div>
                    )}

                    {/* File Upload - only show if not success */}
                    {!uploadSuccess && (
                        <>
                            <div className="space-y-2">
                                {!previewUrl ? (
                                    <div
                                        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-pink-500 dark:hover:border-pink-500 transition-colors"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Klik untuk pilih foto
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Foto bukti pengiriman (POD)
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-full h-56 object-cover rounded-lg"
                                        />
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="absolute top-2 right-2"
                                            onClick={removePhoto}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={handleClose}
                                    className="flex-1"
                                    disabled={isUploading}
                                >
                                    Batal
                                </Button>
                                <Button
                                    onClick={handleUpload}
                                    disabled={!selectedFile || isUploading}
                                    className="flex-1 bg-pink-500 hover:bg-pink-600"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Mengupload...
                                        </>
                                    ) : (
                                        <>
                                            <Camera className="h-4 w-4 mr-2" />
                                            Upload & Selesai
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
