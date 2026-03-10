import React, { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAddLocation, useUpdateLocation } from "@/lib/mutations"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  location_type: z.string().min(1, "Location type is required"),
  address: z.string().optional().or(z.literal("")),
  manager: z.string().optional().or(z.literal("")),
  contact_info: z.string().optional().or(z.literal("")),
})

export function LocationModal({ isOpen, onClose, location }) {
  const { mutateAsync: createLocation, isPending: isCreating } = useAddLocation()
  const { mutateAsync: updateLocation, isPending: isUpdating } = useUpdateLocation()
  const isPending = isCreating || isUpdating

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", location_type: "warehouse", address: "", manager: "", contact_info: ""
    }
  })

  useEffect(() => {
    if (isOpen) {
      if (location) {
        reset({
          name: location.name || "",
          location_type: location.type || location.location_type || "warehouse",
          address: location.address || "",
          manager: location.manager || location.manager_name || "",
          contact_info: location.contact_info || ""
        })
      } else {
        reset({ name: "", location_type: "warehouse", address: "", manager: "", contact_info: "" })
      }
    }
  }, [isOpen, location, reset])

  const locationType = watch("location_type")

  const onSubmit = async (data) => {
    try {
      if (location) {
        await updateLocation({ id: location.id, ...data })
      } else {
        await createLocation(data)
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
          <DialogTitle>{location ? "Edit Location" : "Add Location"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Location Name <span className="text-red-500">*</span></Label>
            <Input {...register("name")} placeholder="e.g. Main Warehouse" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Type <span className="text-red-500">*</span></Label>
            <Select value={locationType} onValueChange={(val) => setValue("location_type", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="warehouse">Warehouse</SelectItem>
                <SelectItem value="site">Project Site</SelectItem>
              </SelectContent>
            </Select>
            {errors.location_type && <p className="text-xs text-red-500">{errors.location_type.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea {...register("address")} placeholder="123 Industrial Area..." className="h-20" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Manager</Label>
              <Input {...register("manager")} placeholder="Manager name" />
            </div>
            <div className="space-y-2">
              <Label>Contact Info</Label>
              <Input {...register("contact_info")} placeholder="Phone or email" />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {location ? "Save Changes" : "Create Location"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
