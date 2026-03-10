import React, { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAddWorker, useUpdateWorker } from "@/lib/mutations"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  worker_type: z.string().min(1, "Worker type is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
})

export function WorkerModal({ isOpen, onClose, worker }) {
  const { mutateAsync: createWorker, isPending: isCreating } = useAddWorker()
  const { mutateAsync: updateWorker, isPending: isUpdating } = useUpdateWorker()
  const isPending = isCreating || isUpdating

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", worker_type: "Employee", email: "", phone: "", address: "", company: ""
    }
  })

  useEffect(() => {
    if (isOpen) {
      if (worker) {
        reset({
          name: worker.name || "",
          worker_type: worker.worker_type || "Employee",
          email: worker.email || "",
          phone: worker.phone || "",
          address: worker.address || "",
          company: worker.company || ""
        })
      } else {
        reset({ name: "", worker_type: "Employee", email: "", phone: "", address: "", company: "" })
      }
    }
  }, [isOpen, worker, reset])

  const workerType = watch("worker_type")

  const onSubmit = async (data) => {
    try {
      if (worker) {
        await updateWorker({ id: worker.id, ...data })
      } else {
        await createWorker(data)
      }
      onClose()
    } catch (e) {
      // Toast handled in mutation
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md w-[95vw] max-w-md max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle>{worker ? "Edit Worker" : "Add Worker"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Worker Name <span className="text-red-500">*</span></Label>
            <Input {...register("name")} placeholder="e.g. John Doe" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type <span className="text-red-500">*</span></Label>
              <Select value={workerType} onValueChange={(val) => setValue("worker_type", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="Employee">Employee</SelectItem>
                  <SelectItem value="Contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>
              {errors.worker_type && <p className="text-xs text-red-500">{errors.worker_type.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input {...register("company")} placeholder="Company Name" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} placeholder="john@example.com" />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...register("phone")} placeholder="+971 50..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea {...register("address")} placeholder="123 Site Road..." className="h-20" />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {worker ? "Save Changes" : "Create Worker"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
