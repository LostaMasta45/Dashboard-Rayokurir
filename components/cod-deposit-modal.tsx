"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
  type Courier,
  type CODHistory,
} from "@/lib/auth"

interface CODDepositModalProps {
  isOpen: boolean
  onClose: () => void
  courier: Courier | null
  onDeposited: () => void
}

export function CODDepositModal({ isOpen, onClose, courier, onDeposited }: CODDepositModalProps) {
  const [amount, setAmount] = useState("")
  const [buktiUrl, setBuktiUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [courierOrders, setCourierOrders] = useState<Order[]>([])
  const [outstanding, setOutstanding] = useState(0)
  const [totalOngkirViaCOD, setTotalOngkirViaCOD] = useState(0)

  useEffect(() => {
    if (courier && isOpen) {
      const orders = getOrders()

      const courierCODOrders = orders.filter(
        (order) => order.kurirId === courier.id && order.cod.isCOD && order.status === "SELESAI" && !order.cod.codPaid,
      )

      const totalCODNominal = courierCODOrders.reduce((sum, order) => sum + order.cod.nominal, 0)
      const totalOngkirViaCOD = courierCODOrders.reduce((sum, order) => sum + (order.ongkir || 0), 0)
      const totalOutstanding = totalCODNominal + totalOngkirViaCOD

      setCourierOrders(courierCODOrders)
      setOutstanding(totalOutstanding)
      setTotalOngkirViaCOD(totalOngkirViaCOD)
      setAmount(totalOutstanding.toString())
    }
  }, [courier, isOpen])

  const resetForm = () => {
    setAmount("")
    setBuktiUrl("")
    setCourierOrders([])
    setOutstanding(0)
    setTotalOngkirViaCOD(0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!courier || !amount) return

    setIsSubmitting(true)

    try {
      const depositAmount = Number.parseFloat(amount)
      if (depositAmount <= 0 || depositAmount > outstanding) {
        alert("Jumlah setoran tidak valid")
        return
      }

      const orders = getOrders()
      const codHistory = getCODHistory()
      const now = new Date()

      // FIFO: Mark orders as paid starting from the earliest
      let remainingAmount = depositAmount
      const updatedOrders = [...orders]
      const newHistoryEntries: CODHistory[] = []

      // Sort courier orders by creation date (earliest first)
      const sortedCourierOrders = courierOrders.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )

      for (const order of sortedCourierOrders) {
        if (remainingAmount <= 0) break

        const orderIndex = updatedOrders.findIndex((o) => o.id === order.id)
        if (orderIndex === -1) continue

        const orderTotal = order.cod.nominal + (order.ongkir || 0)

        if (remainingAmount >= orderTotal) {
          // Fully pay this order
          updatedOrders[orderIndex] = {
            ...updatedOrders[orderIndex],
            cod: { ...updatedOrders[orderIndex].cod, codPaid: true },
          }

          newHistoryEntries.push({
            id: generateId(),
            orderId: order.id,
            kurirId: courier.id,
            nominal: order.cod.nominal,
            tanggal: now.toDateString(),
            buktiUrl: buktiUrl.trim() || undefined,
          })

          remainingAmount -= orderTotal
        } else {
          // Partial payment (this shouldn't happen with current UI, but keeping for completeness)
          break
        }
      }

      // Save updated data
      saveOrders(updatedOrders)
      saveCODHistory([...codHistory, ...newHistoryEntries])

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

  if (!courier) return null

  const totalCODNominal = courierOrders.reduce((sum, order) => sum + order.cod.nominal, 0)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Setor COD - {courier.nama}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium mb-3 text-blue-900">📋 Ringkasan Setoran COD</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Jumlah Order:</span>
                <span className="font-medium">{courierOrders.length} order</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Total COD:</span>
                <span className="font-medium">{formatCurrency(totalCODNominal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Ongkir via COD:</span>
                <span className="font-medium">{formatCurrency(totalOngkirViaCOD)}</span>
              </div>
              <hr className="border-blue-200" />
              <div className="flex justify-between text-base">
                <span className="font-medium text-blue-900">Total Setoran:</span>
                <span className="font-bold text-blue-900">{formatCurrency(outstanding)}</span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              💡 Total COD {formatCurrency(totalCODNominal)}, termasuk ongkir via COD{" "}
              {formatCurrency(totalOngkirViaCOD)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">
              Jumlah Setoran <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              min="0"
              max={outstanding}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Masukkan jumlah setoran"
              required
            />
            <p className="text-xs text-muted-foreground">Maksimal: {formatCurrency(outstanding)}</p>
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
          </div>

          <div className="text-sm text-muted-foreground p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="font-medium mb-1 text-amber-800">⚠️ Catatan Penting:</p>
            <ul className="text-amber-700 space-y-1">
              <li>• Order akan dilunasi berdasarkan urutan waktu (FIFO)</li>
              <li>• Setoran mencakup COD + ongkir via COD</li>
              <li>• Pastikan jumlah setoran sesuai dengan total</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-rayo-primary hover:bg-rayo-dark">
              {isSubmitting ? "Memproses..." : "Setor COD"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
