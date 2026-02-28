import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Loader2 } from "lucide-react"
import { useSendMaintenance } from "@/lib/mutations"

export function MaintenanceModal({ isOpen, onClose, tool, locationId, locationName, availableStock }) {
  const { mutateAsync: sendMaintenance, isPending } = useSendMaintenance()

  const schema = z.object({
    units: z.coerce.number()
      .min(1, "Must send at least 1 unit")
      .max(availableStock || 0, `Only ${availableStock} units available`),
    reason: z.string().min(3, "Reason is required"),
    expected_completion: z.string().optional(),
    notes: z.string().optional(),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      units: 1,
      reason: "",
      expected_completion: "",
      notes: "",
    }
  })

  React.useEffect(() => {
    if (isOpen) {
      reset({ units: 1, reason: "", expected_completion: "", notes: "" })
    }
  }, [isOpen, reset])

  const onSubmit = async (data) => {
    if (!tool || !locationId) return
    try {
      const payload = {
        id: tool.id,
        location_id: locationId,
        units: data.units,
        reason: data.reason,
        notes: data.notes || undefined,
      }
      if (data.expected_completion) {
        payload.expected_completion = new Date(data.expected_completion).toISOString()
      }
      await sendMaintenance(payload)
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
          <DialogTitle>Send to Maintenance — {tool.name}</DialogTitle>
        </DialogHeader>

        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex gap-3 text-sm items-start">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>Tools sent for maintenance will be removed from available inventory until returned.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Units to Send <span className="text-red-500">*</span></Label>
            <Input type="number" {...register("units")} />
            <p className="text-xs text-slate-500">Maximum {availableStock} available at {locationName}</p>
            {errors.units && <p className="text-xs text-red-500">{errors.units.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Reason <span className="text-red-500">*</span></Label>
            <Input {...register("reason")} placeholder="Describe the issue..." />
            {errors.reason && <p className="text-xs text-red-500">{errors.reason.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Expected Completion Date</Label>
            <Input type="date" {...register("expected_completion")} min={new Date().toISOString().split('T')[0]} />
          </div>

          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea {...register("notes")} placeholder="Optional details..." />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send to Maintenance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
