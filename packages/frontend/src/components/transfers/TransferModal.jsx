import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { Loader2, Info } from "lucide-react"
import { useTools, useLocations } from "@/lib/queries"
import { useCreateTransfer } from "@/lib/mutations"

const schema = z.object({
  fromLocationId: z.string().min(1, "Required"),
  toLocationId: z.string().min(1, "Required"),
  toolId: z.string().min(1, "Tool is required"),
  quantity: z.coerce.number().min(1, "Must transfer at least 1 unit"),
  notes: z.string().optional(),
}).refine(data => data.fromLocationId !== data.toLocationId, {
  message: "Must be different locations",
  path: ["toLocationId"],
})

export function TransferModal({ isOpen, onClose }) {
  const { data: locations = [] } = useLocations()
  const { data: tools = [] } = useTools()
  const { mutateAsync: createTransfer, isPending } = useCreateTransfer()

  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fromLocationId: "",
      toLocationId: "",
      toolId: "",
      quantity: 1,
      notes: "",
    }
  })

  React.useEffect(() => {
    if (isOpen) {
      reset({
        fromLocationId: "",
        toLocationId: "",
        toolId: "",
        quantity: 1,
        notes: "",
      })
    }
  }, [isOpen, reset])

  const fromLocationId = watch("fromLocationId")
  const toLocationId = watch("toLocationId")
  const selectedToolId = watch("toolId")
  const quantity = watch("quantity")

  // Filter tools based on selected From Location
  const toolOptions = React.useMemo(() => {
    if (!fromLocationId) return []
    return tools
      .filter(t => {
        const locStock = (t.stock_by_location || []).find(l => String(l.location_id) === fromLocationId)
        if (!locStock) return false
        return (locStock.quantity - locStock.reserved_quantity) > 0
      })
      .map(t => {
        const locStock = (t.stock_by_location || []).find(l => String(l.location_id) === fromLocationId)
        const avail = locStock.quantity - locStock.reserved_quantity
        return {
          value: String(t.id),
          label: t.name,
          searchKey: `${t.sku} ${t.name}`,
          renderLabel: (
            <div className="flex items-center gap-2 max-w-full overflow-hidden">
               <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex-shrink-0">{t.sku}</span>
               <span className="truncate text-sm">{t.name}</span>
            </div>
          ),
          renderOption: (
            <div className="flex items-center justify-between w-full pr-2">
               <div className="flex items-center gap-2 overflow-hidden mr-2">
                 <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex-shrink-0">{t.sku}</span>
                 <span className="font-medium truncate text-sm">{t.name}</span>
               </div>
               <span className="text-xs text-slate-500 whitespace-nowrap">{avail} available</span>
            </div>
          )
        }
      })
  }, [tools, fromLocationId])

  // Get max available for selected tool + from location
  const maxAvailable = React.useMemo(() => {
    if (!fromLocationId || !selectedToolId) return 0
    const tool = tools.find(t => String(t.id) === selectedToolId)
    if (!tool) return 0
    const locStock = (tool.stock_by_location || []).find(l => String(l.location_id) === fromLocationId)
    if (!locStock) return 0
    return locStock.quantity - locStock.reserved_quantity
  }, [tools, fromLocationId, selectedToolId])

  // Reset tool when location changes
  React.useEffect(() => {
    setValue("toolId", "")
    setValue("quantity", 1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromLocationId])

  const onSubmit = async (data) => {
    try {
      await createTransfer({
        toolId: parseInt(data.toolId, 10),
        fromLocationId: parseInt(data.fromLocationId, 10),
        toLocationId: parseInt(data.toLocationId, 10),
        quantity: data.quantity,
        notes: data.notes
      })
      onClose()
    } catch (e) {
      // Toast on error is in mutation
    }
  }

  const remaining = maxAvailable - (Number(quantity) || 0)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>New Transfer Request</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Location <span className="text-red-500">*</span></Label>
              <Select value={fromLocationId} onValueChange={(v) => setValue("fromLocationId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(l => (
                     <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.fromLocationId && <p className="text-xs text-red-500">{errors.fromLocationId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>To Location <span className="text-red-500">*</span></Label>
              <Select value={toLocationId} onValueChange={(v) => setValue("toLocationId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Destination" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(l => (
                     <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.toLocationId && <p className="text-xs text-red-500">{errors.toLocationId.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tool <span className="text-red-500">*</span></Label>
            <Controller
              control={control}
              name="toolId"
              render={({ field }) => (
                <Combobox 
                  value={field.value} 
                  onValueChange={field.onChange} 
                  options={toolOptions} 
                  placeholder={fromLocationId ? "Select tool to transfer..." : "Select From Location first"} 
                  emptyText="No tools with stock available at source."
                />
              )}
            />
            {errors.toolId && <p className="text-xs text-red-500">{errors.toolId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Quantity <span className="text-red-500">*</span></Label>
            <Input 
              type="number" 
              min="1" 
              max={maxAvailable || 1} 
              disabled={!selectedToolId}
              {...register("quantity")} 
            />
            {selectedToolId && (
              <p className={`text-xs mt-1.5 font-medium ${remaining >= 0 ? (remaining === 0 ? 'text-amber-600' : 'text-green-600') : 'text-red-600'}`}>
                {maxAvailable} available → {Math.max(0, remaining)} remaining at source
              </p>
            )}
            {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
            {remaining < 0 && <p className="text-xs text-red-500 mt-1">Exceeds available stock</p>}
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...register("notes")} placeholder="Reason for transfer, priority, or other details..." className="h-20" />
          </div>

          {/* INFO NOTICE */}
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex gap-3 text-sm items-start">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>Stock will not be reserved until a Manager approves this request.</p>
          </div>

          <DialogFooter className="pt-2">
             <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
             <Button type="submit" disabled={isPending || !selectedToolId || remaining < 0 || fromLocationId === toLocationId}>
               {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Request Transfer
             </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  )
}
