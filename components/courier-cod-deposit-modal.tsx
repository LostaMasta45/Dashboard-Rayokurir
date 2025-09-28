"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  getOrders,
  saveOrders,
  getCODHistory,
  saveCODHistory,
  generateId,
  formatCurrency,
  type Order,
  type CODHistory,
} from "@/lib/auth"

interface CourierCODDepositModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
  courierId: string
  onDeposited: () => void
}

export function CourierCODDepositModal({
  isOpen,
  onClose,
  order,
  courierId,
  onDeposited,
}: CourierCODDepositModalProps) {
  const [buktiUrl, setBuktiUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setBuktiUrl("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!order || !order.cod.isCOD) return

    setIsSubmitting(true)

    try {
      const orders = getOrders()
      const codHistory = getCODHistory()
      const now = new Date()

      // Mark order as COD paid
      const updatedOrders = orders.map((o) => {
        if (o.id === order.id) {
          return {
            ...o,
            cod: { ...o.cod, codPaid: true },
          }
        }
        return o
      })

      // Add to COD history
      const newHistoryEntry: CODHistory = {
        id: generateId(),
        orderId: order.id,
        kurirId: courierId,
        nominal: order.cod.nominal,
        tanggal: now.toDateString(),
        buktiUrl: buktiUrl.trim() || undefined,
      }

      // Save updated data
      saveOrders(updatedOrders)
      saveCODHistory([...codHistory, newHistoryEntry])

      resetForm()
      onDeposited()
    } catch (error) {
      console.error("Error processing COD deposit:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!order || !order.cod.isCOD) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Setor COD</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Detail Order</h4>
            <p className="text-sm text-muted-foreground">ID: #{order.id.slice(-6)}</p>
            <p className="text-sm text-muted-foreground">Pengirim: {order.pengirim.nama}</p>
            <p className="text-sm text-muted-foreground">Nominal COD: {formatCurrency(order.cod.nominal)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="buktiUrl">Bukti Transfer (Opsional)</Label>
            <Input
              id="buktiUrl"
              type="url"
              value={buktiUrl}
              onChange={(e) => setBuktiUrl(e.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">Link foto bukti transfer atau setoran</p>
          </div>

          <div className="text-sm text-muted-foreground p-3 bg-green-50 rounded-lg">
            <p className="font-medium mb-1">Konfirmasi:</p>
            <p>Saya telah menyetor COD sebesar {formatCurrency(order.cod.nominal)} untuk order ini</p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-rayo-primary hover:bg-rayo-dark">
              {isSubmitting ? "Memproses..." : "Konfirmasi Setor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
