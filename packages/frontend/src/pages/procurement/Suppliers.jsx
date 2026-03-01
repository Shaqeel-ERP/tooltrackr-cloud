import ErrorBoundary from "@/components/shared/ErrorBoundary"
import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  Building2, Plus, Edit, Mail, Phone, MapPin, Loader2
} from "lucide-react"
import { useSuppliers } from "@/lib/queries"
import { useAddSupplier, useUpdateSupplier } from "@/lib/mutations"
import { useAuth } from "@/lib/auth"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  contact_name: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

function SupplierModal({ isOpen, onClose, supplier }) {
  const { mutateAsync: createSupplier, isPending: isCreating } = useAddSupplier()
  const { mutateAsync: updateSupplier, isPending: isUpdating } = useUpdateSupplier()
  const isPending = isCreating || isUpdating

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      contact_name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    }
  })

  React.useEffect(() => {
    if (isOpen) {
      if (supplier) {
        reset({
          name: supplier.name || "",
          contact_name: supplier.contact_name || "",
          email: supplier.email || "",
          phone: supplier.phone || "",
          address: supplier.address || "",
          notes: supplier.notes || "",
        })
      } else {
        reset({ name: "", contact_name: "", email: "", phone: "", address: "", notes: "" })
      }
    }
  }, [isOpen, supplier, reset])

  const onSubmit = async (data) => {
    try {
      if (supplier) {
        await updateSupplier({ id: supplier.id, ...data })
      } else {
        await createSupplier(data)
      }
      onClose()
    } catch (e) {
      // Toast on error is in mutation
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md w-full">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Supplier Name <span className="text-red-500">*</span></Label>
            <Input {...register("name")} placeholder="e.g. Acme Tools Inc." />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Contact Person</Label>
            <Input {...register("contact_name")} placeholder="e.g. John Doe" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} placeholder="sales@acme.com" />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...register("phone")} placeholder="+971 50 123 4567" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Input {...register("address")} placeholder="123 Warehouse St, Dubai..." />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...register("notes")} placeholder="Payment terms, delivery days..." className="h-20" />
          </div>

          <DialogFooter className="pt-4">
             <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
             <Button type="submit" disabled={isPending}>
               {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               {supplier ? "Save Changes" : "Create Supplier"}
             </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  )
}

export function SuppliersPage() {
  const { hasRole } = useAuth()
  const isManager = hasRole('Manager')
  const { data: suppliers, isLoading } = useSuppliers()

  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingSupplier, setEditingSupplier] = React.useState(null)

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier)
    setModalOpen(true)
  }

  const columns = [
    {
      header: "Supplier",
      key: "name",
      render: (s) => (
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
             <Building2 className="w-5 h-5" />
           </div>
           <div>
             <span className="font-semibold text-slate-900">{s.name}</span>
             {s.contact_name && <span className="block text-xs text-slate-500">Attn: {s.contact_name}</span>}
           </div>
        </div>
      )
    },
    {
      header: "Contact Info",
      key: "contact",
      sortable: false,
      render: (s) => (
        <div className="flex flex-col gap-1 text-sm text-slate-600">
           {s.phone ? (
             <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 hover:text-blue-600">
               <Phone className="w-3.5 h-3.5 text-slate-400" /> {s.phone}
             </a>
           ) : null}
           {s.email ? (
             <a href={`mailto:${s.email}`} className="flex items-center gap-1.5 hover:text-blue-600">
               <Mail className="w-3.5 h-3.5 text-slate-400" /> {s.email}
             </a>
           ) : null}
           {!s.phone && !s.email && <span className="text-slate-400 italic">No contact info</span>}
        </div>
      )
    },
    {
      header: "Address",
      key: "address",
      render: (s) => s.address ? (
        <div className="flex items-start gap-1.5 text-sm text-slate-600">
           <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
           <span className="max-w-[200px] truncate" title={s.address}>{s.address}</span>
        </div>
      ) : <span className="text-slate-400">-</span>
    },
    {
      header: "Notes",
      key: "notes",
      render: (s) => (
        <span className="text-xs text-slate-500 max-w-[150px] truncate block" title={s.notes}>
          {s.notes || '-'}
        </span>
      )
    },
    {
      header: "Actions",
      key: "actions",
      sortable: false,
      render: (s) => (
        <div className="flex items-center justify-end">
          {isManager && (
            <Button variant="ghost" size="icon" onClick={() => handleEdit(s)} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50">
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ]

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-6">
      <PageHeader 
        title="Suppliers" 
        actions={isManager && (
          <Button onClick={() => { setEditingSupplier(null); setModalOpen(true) }} className="gap-2">
            <Plus className="h-4 w-4" /> Add Supplier
          </Button>
        )}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <DataTable 
          columns={columns} 
          data={suppliers || []} 
          isLoading={isLoading} 
          searchKeys={["name", "contact_name", "email", "phone", "address"]}
          searchPlaceholder="Search suppliers..."
          emptyMessage="No suppliers found."
        />
      </div>

      <SupplierModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        supplier={editingSupplier} 
      />
    </div>

    </ErrorBoundary>
  )
}
