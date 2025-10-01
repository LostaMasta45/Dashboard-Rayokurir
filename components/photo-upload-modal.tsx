"use client"

import type React from "react"

import { useState, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Camera, Upload, X } from "lucide-react"

interface PhotoUploadModalProps {
  isOpen: boolean
  onClose: () => void
  courierId: string
  courierName: string
  onPhotoUploaded: () => void
}

export function PhotoUploadModal({ isOpen, onClose, courierId, courierName, onPhotoUploaded }: PhotoUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [orderId, setOrderId] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !description.trim()) return

    setIsUploading(true)

    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${courierId}_${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('courier-photos')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('courier-photos')
        .getPublicUrl(fileName)

      const photoUrl = publicUrlData?.publicUrl || ""

      // Save photo metadata to localStorage (for now, should be to DB in production)
      const photoData = {
        id: Date.now().toString(),
        kurirId: courierId,
        kurirName: courierName,
        photoUrl,
        description: description.trim(),
        orderId: orderId.trim() || undefined,
        timestamp: new Date().toISOString(),
      }
      const existingPhotos = JSON.parse(localStorage.getItem("courier_photos") || "[]")
      existingPhotos.push(photoData)
      localStorage.setItem("courier_photos", JSON.stringify(existingPhotos))

      // Reset form
      setSelectedFile(null)
      setPreviewUrl(null)
      setDescription("")
      setOrderId("")
      setIsUploading(false)

      onPhotoUploaded()
    } catch (error) {
      console.error("Error uploading photo:", error)
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setDescription("")
    setOrderId("")
    onClose()
  }

  const removePhoto = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Upload Foto Testimoni
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="photo">Foto</Label>
            {!previewUrl ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-rayo-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Klik untuk pilih foto</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, atau WEBP (max 5MB)</p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={removePhoto}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi *</Label>
            <Textarea
              id="description"
              placeholder="Contoh: Paket berhasil diantar ke customer dengan selamat"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Order ID (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="orderId">ID Order (Opsional)</Label>
            <Input
              id="orderId"
              placeholder="Contoh: #ABC123"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
              Batal
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !description.trim() || isUploading}
              className="flex-1 bg-rayo-primary hover:bg-rayo-dark"
            >
              {isUploading ? "Mengupload..." : "Upload Foto"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
