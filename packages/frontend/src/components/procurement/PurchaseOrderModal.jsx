import * as React from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
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
import { Loader2, Plus, Trash2 } from "lucide-react"
import { useSuppliers, useTools, useLocations } from "@/lib/queries"
import { useCreatePurchaseOrder } from "@/lib/mutations"

const itemSchema = z.object({
  toolId: z.string().min(1, "Required"),
  locationId: z.string().min(1, "Required"),
  quantity: z.coerce.number().min(1, "Min 1"),
  unitPrice: z.coerce.number().min(0, "Min 0").optional(),
})

const schema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  notes: z.string().optional(),
  taxAmount: z.coerce.number().min(0).optional().default(0),
  discountAmount: z.coerce.number().min(0).optional().default(0),
  items: z.array(itemSchema).min(1, "Add at least one item"),
})

export function PurchaseOrderModal({ isOpen, onClose }) {
  const { data: suppliers = [] } = useSuppliers()
  const { data: tools = [] } = useTools()
  const { data: locations = [] } = useLocations()
  const { mutateAsync: createPO, isPending } = useCreatePurchaseOrder()

  const defaultDate = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      supplierId: "",
      invoiceNumber: "",
      invoiceDate: defaultDate,
      notes: "",
      taxAmount: 0,
      discountAmount: 0,
      items: [{ toolId: "", locationId: "", quantity: 1, unitPrice: 0 }]
    }
  })

  const { fields, append, remove } = useFieldArray({ control, name: "items" })

  React.useEffect(() => {
    if (isOpen) {
      reset({
        supplierId: "",
        invoiceNumber: "",
        invoiceDate: defaultDate,
        notes: "",
        taxAmount: 0,
        discountAmount: 0,
        items: [{ toolId: "", locationId: "", quantity: 1, unitPrice: 0 }]
      })
    }
  }, [isOpen, reset, defaultDate])

  const watchItems = watch("items")
  const watchTax = watch("taxAmount") || 0
  const watchDiscount = watch("discountAmount") || 0

  const subtotal = watchItems.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.unitPrice) || 0
    return acc + (qty * price)
  }, 0)

  const total = subtotal + Number(watchTax) - Number(watchDiscount)

  const toolOptions = React.useMemo(() => {
    return tools.map(t => ({
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
        <div className="flex items-center gap-2 overflow-hidden w-full">
           <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex-shrink-0">{t.sku}</span>
           <span className="font-medium truncate text-sm">{t.name}</span>
        </div>
      )
    }))
  }, [tools])

  const onSubmit = async (data) => {
    try {
      await createPO({
        supplierId: parseInt(data.supplierId, 10),
        invoiceNumber: data.invoiceNumber,
        invoiceDate: new Date(data.invoiceDate).toISOString(),
        notes: data.notes,
        taxAmount: data.taxAmount,
        discountAmount: data.discountAmount,
        totalAmount: total,
        items: data.items.map(i => ({
          toolId: parseInt(i.toolId, 10),
          locationId: parseInt(i.locationId, 10),
          quantity: i.quantity,
          unitPrice: i.unitPrice || 0
        }))
      })
      onClose()
    } catch (e) {
      // Handled by mutation
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Purchase Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* SECTION 1: DETAILS */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="font-semibold text-slate-800 border-b border-slate-200 pb-2">Order Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier <span className="text-red-500">*</span></Label>
                <Controller
                  control={control}
                  name="supplierId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.supplierId && <p className="text-xs text-red-500">{errors.supplierId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Invoice # <span className="text-red-500">*</span></Label>
                  <Input {...register("invoiceNumber")} placeholder="INV-12345" />
                  {errors.invoiceNumber && <p className="text-xs text-red-500">{errors.invoiceNumber.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Invoice Date <span className="text-red-500">*</span></Label>
                  <Input type="date" {...register("invoiceDate")} />
                  {errors.invoiceDate && <p className="text-xs text-red-500">{errors.invoiceDate.message}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-2">
               <Label>Notes</Label>
               <Input {...register("notes")} placeholder="Delivery instructions or references..." />
            </div>
          </div>

          {/* SECTION 2: LINE ITEMS */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Line Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ toolId: "", locationId: "", quantity: 1, unitPrice: 0 })} className="h-8 gap-1">
                   <Plus className="w-3.5 h-3.5" /> Add Item
                </Button>
             </div>

             {errors.items?.root && <p className="text-xs text-red-500">{errors.items.root.message}</p>}

             <div className="space-y-3">
               {fields.map((field, index) => {
                 const currentQty = watchItems[index]?.quantity || 0
                 const currentPrice = watchItems[index]?.unitPrice || 0
                 const lineTotal = currentQty * currentPrice

                 return (
                   <div key={field.id} className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-lg border border-slate-200 items-start md:items-end">
                     
                     <div className="flex-1 w-full space-y-1">
                        {index === 0 && <Label className="text-xs text-slate-500 hidden md:block">Tool Item</Label>}
                        <Controller
                          control={control}
                          name={`items.${index}.toolId`}
                          render={({ field }) => (
                            <Combobox 
                              value={field.value} 
                              onValueChange={field.onChange} 
                              options={toolOptions} 
                              placeholder="Select tool..." 
                            />
                          )}
                        />
                        {errors.items?.[index]?.toolId && <p className="text-[10px] text-red-500 absolute">{errors.items[index].toolId.message}</p>}
                     </div>

                     <div className="w-full md:w-48 space-y-1 shrink-0">
                        {index === 0 && <Label className="text-xs text-slate-500 hidden md:block">Destination</Label>}
                        <Controller
                          control={control}
                          name={`items.${index}.locationId`}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Location" />
                              </SelectTrigger>
                              <SelectContent>
                                {locations.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.items?.[index]?.locationId && <p className="text-[10px] text-red-500 absolute">{errors.items[index].locationId.message}</p>}
                     </div>

                     <div className="flex items-center gap-3 w-full md:w-auto overflow-visible">
                       <div className="w-20 space-y-1">
                          {index === 0 && <Label className="text-xs text-slate-500 hidden md:block">Qty</Label>}
                          <Input type="number" min="1" {...register(`items.${index}.quantity`)} />
                       </div>
                       
                       <div className="w-24 space-y-1">
                          {index === 0 && <Label className="text-xs text-slate-500 hidden md:block">Unit Cost</Label>}
                          <div className="relative">
                            <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">AED</span>
                            <Input type="number" step="0.01" min="0" className="pl-9" {...register(`items.${index}.unitPrice`)} />
                          </div>
                       </div>
                       
                       <div className="w-24 space-y-1 flex flex-col justify-end h-10">
                          {index === 0 && <Label className="text-xs text-slate-500 hidden md:block">Total</Label>}
                          <div className="text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-100 h-10 rounded-md px-3 flex items-center justify-end">
                            {lineTotal.toFixed(2)}
                          </div>
                       </div>
                     </div>

                     <Button 
                       type="button" 
                       variant="ghost" 
                       size="icon" 
                       className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-10 w-10 shrink-0 self-end md:ml-1 absolute top-2 right-2 md:relative md:top-auto md:right-auto"
                       onClick={() => remove(index)}
                       disabled={fields.length === 1}
                     >
                       <Trash2 className="w-4 h-4" />
                     </Button>

                   </div>
                 )
               })}
             </div>
          </div>

          {/* SECTION 3: TOTALS */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <div className="w-full md:w-72 space-y-3">
              <div className="flex justify-between items-center text-sm font-medium text-slate-600 px-2">
                 <span>Subtotal:</span>
                 <span>AED {subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-600 font-medium px-2">Tax:</span>
                 <div className="relative w-32">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400">AED</span>
                    <Input type="number" step="0.01" min="0" className="pl-9 h-8 text-right" {...register("taxAmount")} />
                 </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-600 font-medium px-2">Discount:</span>
                 <div className="relative w-32">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400">AED</span>
                    <Input type="number" step="0.01" min="0" className="pl-9 h-8 text-right" {...register("discountAmount")} />
                 </div>
              </div>

              <div className="flex justify-between items-center text-lg font-bold text-slate-900 bg-slate-100 p-3 rounded-lg border border-slate-200 mt-2">
                 <span>TOTAL:</span>
                 <span>AED {Math.max(0, total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
             <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
             <Button type="submit" disabled={isPending || fields.length === 0}>
               {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Create Purchase Order
             </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  )
}
