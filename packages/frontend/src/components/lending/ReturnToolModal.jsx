import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react"
import { useLocations } from "@/lib/queries"
import { useReturnTool } from "@/lib/mutations"
import { Badge } from "@/components/ui/badge"

const schema = z.object({
  condition: z.enum(["good", "damaged", "lost"]),
  returnLocationId: z.string().min(1, "Return location is required"),
  notes: z.string().optional(),
})

export function ReturnToolModal({ isOpen, onClose, loan }) {
  const { data: locations = [] } = useLocations()
  const { mutateAsync: returnTool, isPending } = useReturnTool()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      condition: "good",
      returnLocationId: "",
      notes: "",
    }
  })

  // Set default return location when modal opens
  React.useEffect(() => {
    if (isOpen && loan && locations.length > 0) {
      setValue("returnLocationId", String(locations[0].id))
      setValue("condition", "good")
      setValue("notes", "")
    }
  }, [isOpen, loan, locations, setValue])

  const condition = watch("condition")
  const returnLocId = watch("returnLocationId")

  const onSubmit = async (data) => {
    if (!loan) return
    try {
      await returnTool({
        lendingId: loan.id,
        condition: data.condition,
        returnLocationId: parseInt(data.returnLocationId, 10),
        returnNote: data.notes
      })
      onClose()
    } catch (e) {
      // Toast handled by mutation
    }
  }

  if (!loan) return null

  const daysOut = Math.floor((Date.now() - new Date(loan.date_out).getTime()) / 86400000)
  const isOverdue = new Date(loan.expected_return_date).getTime() < Date.now()
  const daysOverdue = Math.floor((Date.now() - new Date(loan.expected_return_date).getTime()) / 86400000)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Return Tool</DialogTitle>
        </DialogHeader>

        {/* LOAN SUMMARY CARD */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-2 gap-y-3 gap-x-4 mb-2">
          <div className="col-span-2 flex justify-between items-start">
            <div>
              <p className="font-semibold text-slate-900">{loan.tool_name}</p>
              <Badge variant="outline" className="font-mono text-[10px] mt-1 bg-white">{loan.sku}</Badge>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium">Qty</span>
              <p className="font-bold text-lg text-slate-800">x{loan.quantity}</p>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-500 block mb-0.5">Worker</span>
            <span className="text-sm font-medium">{loan.worker_name}</span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block mb-0.5">Days Out</span>
            <span className="text-sm font-medium">{daysOut} days</span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block mb-0.5">Issued</span>
            <span className="text-sm">{new Date(loan.date_out).toLocaleDateString()}</span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block mb-0.5">Expected Return</span>
            <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-slate-800'}`}>
              {new Date(loan.expected_return_date).toLocaleDateString()}
              {isOverdue && <span className="text-[10px] ml-1 uppercase bg-red-100 text-red-700 px-1 py-0.5 rounded font-bold">Overdue</span>}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* CONDITION SELECTION */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Return Condition <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-1 gap-3">

              <div
                onClick={() => setValue("condition", "good")}
                className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${condition === 'good' ? 'border-green-500 bg-green-50/30' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className={`w-5 h-5 ${condition === 'good' ? 'text-green-600' : 'text-slate-400'}`} />
                  <span className={`font-semibold ${condition === 'good' ? 'text-green-800' : 'text-slate-700'}`}>Good / Working</span>
                </div>
                <p className="text-xs text-slate-500 pl-7">Tool returned in working condition. Stock will be restored to location.</p>
              </div>

              <div
                onClick={() => setValue("condition", "damaged")}
                className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${condition === 'damaged' ? 'border-amber-500 bg-amber-50/30' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={`w-5 h-5 ${condition === 'damaged' ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span className={`font-semibold ${condition === 'damaged' ? 'text-amber-800' : 'text-slate-700'}`}>Damaged / Needs Repair</span>
                </div>
                <p className="text-xs text-slate-500 pl-7">Tool is damaged or needs repair.</p>
                {condition === 'damaged' && (
                  <div className="ml-7 mt-2 bg-amber-100 text-amber-800 text-xs px-2 py-1.5 rounded font-medium inline-flex items-center">
                    ⚠️ Stock will NOT be restored to inventory.
                  </div>
                )}
              </div>

              <div
                onClick={() => setValue("condition", "lost")}
                className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${condition === 'lost' ? 'border-red-500 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert className={`w-5 h-5 ${condition === 'lost' ? 'text-red-600' : 'text-slate-400'}`} />
                  <span className={`font-semibold ${condition === 'lost' ? 'text-red-800' : 'text-slate-700'}`}>Lost / Missing</span>
                </div>
                <p className="text-xs text-slate-500 pl-7">Tool cannot be located.</p>
                {condition === 'lost' && (
                  <div className="ml-7 mt-2 bg-red-100 text-red-800 text-xs px-2 py-1.5 rounded font-medium inline-flex items-center">
                    ⚠️ Stock will NOT be restored. This permanently reduces inventory count.
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* RETURN LOCATION */}
          <div className="space-y-2">
            <Label>Return to Location <span className="text-red-500">*</span></Label>
            <Select value={returnLocId} onValueChange={(v) => setValue("returnLocationId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(l => (
                  <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.returnLocationId && <p className="text-xs text-red-500">{errors.returnLocationId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Return Notes</Label>
            <Textarea
              {...register("notes")}
              placeholder="Add any relevant details about the return..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending || !returnLocId} className={condition === 'lost' ? 'bg-red-600 hover:bg-red-700' : condition === 'damaged' ? 'bg-amber-600 hover:bg-amber-700' : ''}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Return
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  )
}
