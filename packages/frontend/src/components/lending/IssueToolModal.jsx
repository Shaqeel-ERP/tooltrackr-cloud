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
import { Wrench, User, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { useTools, useLocations, useWorkers } from "@/lib/queries"
import { useIssueTool } from "@/lib/mutations"
import { Badge } from "@/components/ui/badge"

const schema = z.object({
  toolId: z.string().min(1, "Tool is required"),
  locationId: z.string().min(1, "Location is required"),
  quantity: z.coerce.number().min(1, "Must issue at least 1 unit"),
  workerId: z.string().min(1, "Worker is required"),
  dateOut: z.string().min(1, "Issue date is required"),
  expectedReturnDate: z.string().optional(),
  projectCode: z.string().optional(),
  jobSite: z.string().optional(),
  notes: z.string().optional(),
})

export function IssueToolModal({ isOpen, onClose }) {
  const [showDetails, setShowDetails] = React.useState(false)

  // Data fetching
  const { data: tools = [] } = useTools()
  const { data: locations = [] } = useLocations()
  const { data: workers = [] } = useWorkers()
  const { mutateAsync: issueTool, isPending } = useIssueTool()

  // Set default dates
  const today = new Date()
  const nextWeek = new Date()
  nextWeek.setDate(today.getDate() + 7)
  const defaultDateOut = today.toISOString().split('T')[0]
  const defaultExpectedReturn = nextWeek.toISOString().split('T')[0]

  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      toolId: "",
      locationId: "",
      quantity: 1,
      workerId: "",
      dateOut: defaultDateOut,
      expectedReturnDate: defaultExpectedReturn,
      projectCode: "",
      jobSite: "",
      notes: "",
    }
  })

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      reset({
        toolId: "",
        locationId: "",
        quantity: 1,
        workerId: "",
        dateOut: defaultDateOut,
        expectedReturnDate: defaultExpectedReturn,
        projectCode: "",
        jobSite: "",
        notes: "",
      })
      setShowDetails(false)
    }
  }, [isOpen, reset, defaultDateOut, defaultExpectedReturn])

  const selectedToolId = watch("toolId")
  const selectedLocationId = watch("locationId")
  const quantity = watch("quantity")
  const workerId = watch("workerId")

  // Find selected tool to get stock
  const selectedTool = React.useMemo(() => tools.find(t => String(t.id) === selectedToolId), [tools, selectedToolId])

  // Filter tools: only show tools with available stock > 0
  const toolOptions = React.useMemo(() => {
    return tools
      .filter(t => {
        const totalAvail = (t.stock_by_location || []).reduce((acc, loc) => acc + ((loc.quantity || 0) - (loc.reserved_quantity || 0)), 0)
        return totalAvail > 0
      })
      .map(t => {
        const totalAvail = (t.stock_by_location || []).reduce((acc, loc) => acc + ((loc.quantity || 0) - (loc.reserved_quantity || 0)), 0)
        return {
          value: String(t.id),
          label: t.name,
          searchKey: `${t.sku} ${t.name}`,
          renderLabel: (
            <div className="flex items-center gap-2 max-w-full overflow-hidden">
               <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex-shrink-0">{t.sku}</span>
               <span className="truncate">{t.name}</span>
            </div>
          ),
          renderOption: (
            <div className="flex items-center justify-between w-full pr-2">
               <div className="flex items-center gap-2 overflow-hidden mr-2">
                 <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex-shrink-0">{t.sku}</span>
                 <span className="font-medium truncate">{t.name}</span>
               </div>
               <span className="text-xs text-slate-500 whitespace-nowrap">{totalAvail} available</span>
            </div>
          )
        }
      })
  }, [tools])

  // Filter available locations for the selected tool
  const availableLocations = React.useMemo(() => {
    if (!selectedTool) return []
    return (selectedTool.stock_by_location || [])
      .filter(loc => (loc.quantity - loc.reserved_quantity) > 0)
      .map(loc => {
         const fullLoc = locations.find(l => l.id === loc.location_id)
         return {
            id: loc.location_id,
            name: fullLoc ? fullLoc.name : `Location ${loc.location_id}`,
            available: loc.quantity - loc.reserved_quantity
         }
      })
  }, [selectedTool, locations])

  // Reset location if tool changes
  React.useEffect(() => {
    if (selectedToolId && availableLocations.length > 0) {
      if (!availableLocations.find(l => String(l.id) === selectedLocationId)) {
         setValue("locationId", String(availableLocations[0].id))
      }
    } else {
      setValue("locationId", "")
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedToolId, availableLocations])

  // Worker options
  const workerOptions = React.useMemo(() => {
    return workers.map(w => ({
      value: String(w.id),
      label: w.name,
      searchKey: `${w.name} ${w.phone || ''} ${w.worker_type}`,
      renderLabel: (
        <span className="truncate">{w.name}</span>
      ),
      renderOption: (
        <div className="flex items-center justify-between w-full pr-2">
           <div className="flex items-center gap-2 overflow-hidden mr-2">
             <span className="font-medium truncate">{w.name}</span>
             <Badge variant="outline" className="text-[10px] py-0 h-4">{w.worker_type}</Badge>
           </div>
           {w.phone && <span className="text-xs text-slate-400 whitespace-nowrap">{w.phone}</span>}
        </div>
      )
    }))
  }, [workers])

  const onSubmit = async (data) => {
    try {
      const payload = {
        toolId: parseInt(data.toolId, 10),
        workerId: parseInt(data.workerId, 10),
        locationId: parseInt(data.locationId, 10), // The API expects to know where it was issued from if not default
        quantity: data.quantity,
        dateOut: new Date(data.dateOut).toISOString(),
      }
      if (data.expectedReturnDate) payload.expectedReturnDate = new Date(data.expectedReturnDate).toISOString()
      if (data.projectCode) payload.projectCode = data.projectCode
      if (data.jobSite) payload.jobSite = data.jobSite
      if (data.notes) payload.notes = data.notes

      await issueTool(payload)
      onClose()
    } catch (e) {
      // Handled in mutation
    }
  }

  // Calculate remaining preview
  const selectedLocStock = React.useMemo(() => {
    if (!selectedTool || !selectedLocationId) return 0
    const loc = availableLocations.find(l => String(l.id) === selectedLocationId)
    return loc ? loc.available : 0
  }, [selectedTool, selectedLocationId, availableLocations])

  const remaining = selectedLocStock - (Number(quantity) || 0)
  const isFormValid = selectedToolId && selectedLocationId && workerId && quantity > 0 && quantity <= selectedLocStock

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] max-w-2xl p-4 md:p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Issue Tool to Worker</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* TOOL SECTION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
               <Wrench className="w-4 h-4 text-blue-600" />
               <h3 className="font-semibold text-slate-800">Tool & Location</h3>
            </div>

            <div className="space-y-4">
               <div>
                 <Label className="mb-1.5 block">Select Tool <span className="text-red-500">*</span></Label>
                 <Controller
                   control={control}
                   name="toolId"
                   render={({ field }) => (
                     <Combobox 
                       value={field.value} 
                       onValueChange={field.onChange} 
                       options={toolOptions} 
                       placeholder="Search to select tool..." 
                       emptyText="No tools with stock available."
                     />
                   )}
                 />
                 {errors.toolId && <p className="text-xs text-red-500 mt-1">{errors.toolId.message}</p>}
               </div>

               {selectedToolId && availableLocations.length > 0 && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                   <div>
                     <Label className="mb-1.5 block">Issue From Location <span className="text-red-500">*</span></Label>
                     <Select value={selectedLocationId} onValueChange={(v) => setValue("locationId", v)}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select location" />
                       </SelectTrigger>
                       <SelectContent>
                         {availableLocations.map(l => (
                            <SelectItem key={l.id} value={String(l.id)}>
                               {l.name} <span className="text-slate-400 ml-1">({l.available} avail)</span>
                            </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                     {errors.locationId && <p className="text-xs text-red-500 mt-1">{errors.locationId.message}</p>}
                   </div>

                   <div>
                     <Label className="mb-1.5 block">Quantity <span className="text-red-500">*</span></Label>
                     <Input 
                       type="number" 
                       min="1" 
                       max={selectedLocStock || 1} 
                       {...register("quantity")} 
                     />
                     {selectedLocationId && (
                       <p className={`text-xs mt-1.5 font-medium ${remaining >= 0 ? (remaining === 0 ? 'text-amber-600' : 'text-green-600') : 'text-red-600'}`}>
                         {selectedLocStock} available → {Math.max(0, remaining)} remaining
                       </p>
                     )}
                     {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
                     {remaining < 0 && <p className="text-xs text-red-500 mt-1">Exceeds available stock</p>}
                   </div>
                 </div>
               )}
            </div>
          </div>

          {/* WORKER SECTION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
               <User className="w-4 h-4 text-blue-600" />
               <h3 className="font-semibold text-slate-800">Worker</h3>
            </div>
            
            <div>
               <Label className="mb-1.5 block">Select Worker <span className="text-red-500">*</span></Label>
               <Controller
                 control={control}
                 name="workerId"
                 render={({ field }) => (
                   <Combobox 
                     value={field.value} 
                     onValueChange={field.onChange} 
                     options={workerOptions} 
                     placeholder="Search to select worker..." 
                     emptyText="No workers found."
                   />
                 )}
               />
               {errors.workerId && <p className="text-xs text-red-500 mt-1">{errors.workerId.message}</p>}
            </div>
          </div>

          {/* DETAILS SECTION */}
          <div className="space-y-4">
             <button 
               type="button" 
               className="flex items-center justify-between w-full border-b border-slate-100 pb-2 text-left"
               onClick={() => setShowDetails(!showDetails)}
             >
               <h3 className="font-semibold text-slate-800">Additional Details</h3>
               {showDetails ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
             </button>

             {showDetails && (
               <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <Label className="mb-1.5 block">Date Out <span className="text-red-500">*</span></Label>
                     <Input type="date" {...register("dateOut")} />
                     {errors.dateOut && <p className="text-xs text-red-500 mt-1">{errors.dateOut.message}</p>}
                   </div>
                   <div>
                     <Label className="mb-1.5 block">Expected Return</Label>
                     <Input type="date" {...register("expectedReturnDate")} />
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <Label className="mb-1.5 block">Project Code</Label>
                     <Input {...register("projectCode")} placeholder="e.g. PRJ-2026-X" />
                   </div>
                   <div>
                     <Label className="mb-1.5 block">Job Site</Label>
                     <Input {...register("jobSite")} placeholder="e.g. Building A - Floor 3" />
                   </div>
                 </div>

                 <div>
                   <Label className="mb-1.5 block">Notes</Label>
                   <Textarea {...register("notes")} placeholder="Any specific instructions or condition details..." className="h-20" />
                 </div>
               </div>
             )}
          </div>

          <DialogFooter className="pt-4 mt-2">
             <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
             <Button type="submit" disabled={isPending || !isFormValid || remaining < 0} className="w-full sm:w-auto mt-2 sm:mt-0">
               {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Issue Tool
             </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  )
}
