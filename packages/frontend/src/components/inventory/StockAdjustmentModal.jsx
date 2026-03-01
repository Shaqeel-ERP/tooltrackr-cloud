import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react"
import { useAdjustStock } from "@/lib/mutations"

const schema = z.object({
  newQuantity: z.coerce.number().min(0, "Cannot be less than 0").max(9999, "Value too high"),
  reason: z.string().min(3, "Reason is required"),
})

export function StockAdjustmentModal({ isOpen, onClose, tool, locationId, locationName, currentStock }) {
  const { mutateAsync: adjustStock, isPending } = useAdjustStock()

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      newQuantity: currentStock || 0,
      reason: "",
    }
  })

  React.useEffect(() => {
    if (isOpen) {
      reset({
        newQuantity: currentStock || 0,
        reason: "",
      })
    }
  }, [isOpen, currentStock, reset])

  const newQty = watch("newQuantity")
  const diff = Number(newQty) - (currentStock || 0)

  const onSubmit = async (data) => {
    if (!tool || !locationId) return
    try {
      await adjustStock({
        id: tool.id,
        location_id: locationId,
        quantity: data.newQuantity,
        reason: data.reason
      })
      onClose()
    } catch (e) {
      // Toast handled in mutation
    }
  }

  if (!tool) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock — {tool.name}</DialogTitle>
          <DialogDescription>{locationName}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          <div className="flex items-center justify-between p-4 bg-muted border border-border rounded-lg">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Stock</p>
              <p className="text-3xl font-bold text-foreground">{currentStock || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground mb-1">Difference</p>
              {diff > 0 ? (
                <span className="inline-flex items-center text-green-600 font-bold bg-green-100 px-2 py-1 rounded">
                  <ArrowUp className="w-4 h-4 mr-1" /> +{diff} units
                </span>
              ) : diff < 0 ? (
                <span className="inline-flex items-center text-red-600 font-bold bg-red-100 px-2 py-1 rounded">
                  <ArrowDown className="w-4 h-4 mr-1" /> {diff} units
                </span>
              ) : (
                <span className="inline-flex items-center text-muted-foreground font-medium bg-slate-100 px-2 py-1 rounded">
                  No change
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Quantity</Label>
              <Input type="number" {...register("newQuantity")} className="text-lg font-medium h-12" />
              {errors.newQuantity && <p className="text-xs text-red-500">{errors.newQuantity.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Reason for Adjustment</Label>
              <Textarea
                {...register("reason")}
                placeholder="e.g. Stock count correction, received damaged batch..."
              />
              {errors.reason && <p className="text-xs text-red-500">{errors.reason.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending || diff === 0}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Adjustment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
