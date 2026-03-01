import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAddTool, useUpdateTool } from "@/lib/mutations"
import { useSuppliers } from "@/lib/queries"
import { Loader2 } from "lucide-react"

const schema = z.object({
  sku: z.string().min(1, "SKU is required").max(20, "SKU too long"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  supplier_id: z.string().optional(),
  unit_of_measure: z.string().min(1, "Required"),
  min_stock_level: z.coerce.number().min(0, "Must be >= 0"),
  description: z.string().optional(),
})

export function ToolFormDialog({ isOpen, onClose, tool }) {
  const isEditing = !!tool
  const { data: suppliers } = useSuppliers()
  const { mutateAsync: addTool, isPending: isAdding } = useAddTool()
  const { mutateAsync: updateTool, isPending: isUpdating } = useUpdateTool()
  const isPending = isAdding || isUpdating

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      sku: "",
      name: "",
      category: "",
      brand: "",
      model: "",
      serial_number: "",
      supplier_id: "none",
      unit_of_measure: "piece",
      min_stock_level: 0,
      description: "",
    }
  })

  React.useEffect(() => {
    if (tool && isOpen) {
      reset({
        sku: tool.sku || "",
        name: tool.name || "",
        category: tool.category || "",
        brand: tool.brand || "",
        model: tool.model || "",
        serial_number: tool.serial_number || "",
        supplier_id: tool.supplier_id ? String(tool.supplier_id) : "none",
        unit_of_measure: tool.unit_of_measure || "piece",
        min_stock_level: tool.min_stock_level || 0,
        description: tool.description || "",
      })
    } else if (!tool && isOpen) {
      reset()
    }
  }, [tool, isOpen, reset])

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      supplier_id: data.supplier_id === "none" ? null : parseInt(data.supplier_id, 10),
    }

    try {
      if (isEditing) {
        await updateTool({ id: tool.id, ...payload })
      } else {
        await addTool(payload)
      }
      onClose()
    } catch (e) {
      // toast is handled in mutation
    }
  }

  const handleSkuChange = (e) => {
    setValue("sku", e.target.value.toUpperCase(), { shouldValidate: true })
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{isEditing ? `Edit Tool — ${tool.sku}` : "Add New Tool"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <Label>SKU <span className="text-red-500">*</span></Label>
              <Input {...register("sku")} onChange={handleSkuChange} className="font-mono uppercase" placeholder="BLA001" disabled={isEditing} />
              {errors.sku && <p className="text-xs text-red-500">{errors.sku.message}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input {...register("name")} placeholder="Bosch Hammer Drill" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category <span className="text-red-500">*</span></Label>
              <Input {...register("category")} placeholder="e.g. Power Tools" />
              {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input {...register("brand")} placeholder="e.g. Bosch" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Model</Label>
              <Input {...register("model")} placeholder="e.g. GBH 2-28" />
            </div>
            <div className="space-y-2">
              <Label>Serial Number</Label>
              <Input {...register("serial_number")} placeholder="e.g. 123456789" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select value={watch("supplier_id")} onValueChange={(val) => setValue("supplier_id", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {suppliers?.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit of Measure <span className="text-red-500">*</span></Label>
              <Select value={watch("unit_of_measure")} onValueChange={(val) => setValue("unit_of_measure", val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="piece">Piece</SelectItem>
                  <SelectItem value="set">Set</SelectItem>
                  <SelectItem value="pair">Pair</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="roll">Roll</SelectItem>
                  <SelectItem value="metre">Metre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Min Stock Level</Label>
            <Input type="number" min="0" {...register("min_stock_level")} />
            {errors.min_stock_level && <p className="text-xs text-red-500">{errors.min_stock_level.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...register("description")} placeholder="Add any additional details here..." />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Tool"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
