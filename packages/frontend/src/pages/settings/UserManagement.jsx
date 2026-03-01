import ErrorBoundary from "@/components/shared/ErrorBoundary"
import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Plus, Edit, EyeIcon, EyeOffIcon, ShieldOff, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth"
import api from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function mockUsers() {
  return [
    { id: 1, full_name: "Admin User", username: "admin", email: "admin@tooltrackr.com", role_name: "Admin", is_active: true, last_login: new Date().toISOString() },
    { id: 2, full_name: "Warehouse Manager", username: "manager1", email: "manager@tooltrackr.com", role_name: "Manager", is_active: true, last_login: new Date(Date.now() - 86400000).toISOString() },
    { id: 3, full_name: "Stock Clerk", username: "clerk_joe", email: "joe@tooltrackr.com", role_name: "User", is_active: true, last_login: new Date(Date.now() - 86400000*3).toISOString() },
    { id: 4, full_name: "Old Staff", username: "old_staff", email: "gone@tooltrackr.com", role_name: "User", is_active: false, last_login: null },
  ]
}

const userSchema = z.object({
  username: z.string().min(3, "Min 3 chars").regex(/^[a-zA-Z0-9_]+$/, "No spaces or special chars"),
  full_name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  password: z.string().optional(),
  role_id: z.coerce.number().min(1)
})

function getInitials(name) {
  if (!name) return "?"
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

function timeAgo(dateString) {
  if (!dateString) return "Never"
  const diff = Date.now() - new Date(dateString).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  return `${days}d ago`
}

function UserModal({ isOpen, onClose, user, currentUser }) {
  const [showPassword, setShowPassword] = React.useState(false)
  const queryClient = useQueryClient()

  // Define dynamic schema requiring password if new user
  const schema = userSchema.refine(data => {
     if (!user && !data.password) return false
     return true
  }, { message: "Password required for new users", path: ["password"] }).refine(data => {
     if (data.password && data.password.length > 0 && data.password.length < 8) return false
     return true
  }, { message: "Password must be at least 8 characters", path: ["password"] })

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "", full_name: "", email: "", password: "", role_id: 3 // Default User
    }
  })

  React.useEffect(() => {
    if (isOpen) {
      if (user) {
        let roleId = 3
        if (user.role_name === 'Admin') roleId = 1
        else if (user.role_name === 'Manager') roleId = 2
        reset({
          username: user.username, full_name: user.full_name, email: user.email || "", password: "", role_id: roleId
        })
      } else {
        reset({ username: "", full_name: "", email: "", password: "", role_id: 3 })
      }
      setShowPassword(false)
    }
  }, [isOpen, user, reset])

  // Mock roles
  const roles = [{ id: 1, name: 'Admin'}, { id: 2, name: 'Manager'}, { id: 3, name: 'User'}]

  const onSubmit = async (data) => {
     try {
       // Mock mutation
       await new Promise(r => setTimeout(r, 500))
       toast.success(user ? "User updated" : "User created")
       queryClient.invalidateQueries(["users"])
       onClose()
     } catch (e) {
       toast.error("Action failed")
     }
  }

  const isSelf = user && currentUser && user.username === currentUser.username

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md w-full">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Add User"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name <span className="text-red-500">*</span></Label>
            <Input {...register("full_name")} placeholder="John Doe" />
            {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Username <span className="text-red-500">*</span></Label>
              <Input {...register("username")} placeholder="johndoe" disabled={!!user} className={user ? "bg-slate-50 opacity-70" : ""} />
              {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Role <span className="text-red-500">*</span></Label>
              <Controller
                 control={control}
                 name="role_id"
                 render={({ field }) => (
                   <Select value={String(field.value)} onValueChange={v => field.onChange(Number(v))} disabled={isSelf}>
                     <SelectTrigger className={isSelf ? "bg-slate-50 opacity-70" : ""}>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       {roles.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                     </SelectContent>
                   </Select>
                 )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...register("email")} placeholder="john@example.com" />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2 relative">
             <Label>{user ? "New Password (optional)" : "Password"}</Label>
             <div className="relative">
               <Input type={showPassword ? "text" : "password"} {...register("password")} placeholder={user ? "Leave blank to keep current" : "Min 8 characters"} className="pr-10" />
               <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none">
                 {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
               </button>
             </div>
             {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <DialogFooter className="pt-4">
             <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
             <Button type="submit">{user ? "Save Changes" : "Create User"}</Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  )
}

export function UserManagement() {
  const { user: currentUser } = useAuth()
  const { data: users = [], isLoading } = useQuery({ queryKey: ["users"], queryFn: mockUsers })
  const queryClient = useQueryClient()

  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState(null)

  const handleDeactivate = async (id) => {
     try {
       await new Promise(r => setTimeout(r, 500))
       toast.success("User status changed")
       queryClient.invalidateQueries(["users"])
     } catch(e) {}
  }

  const columns = [
    {
      header: "User",
      key: "user",
      render: (u) => {
        let bg = "bg-slate-100 text-slate-600"
        if (u.role_name === 'Admin') bg = "bg-purple-100 text-purple-700"
        else if (u.role_name === 'Manager') bg = "bg-blue-100 text-blue-700"
        return (
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-full font-bold text-sm shrink-0 flex items-center justify-center ${bg}`}>
               {getInitials(u.full_name)}
             </div>
             <div className="flex flex-col">
               <span className="font-semibold text-slate-900">{u.full_name}</span>
               <span className="text-xs text-slate-400">@{u.username}</span>
             </div>
          </div>
        )
      }
    },
    { header: "Email", key: "email", render: (u) => <span className="text-sm text-slate-600">{u.email || '-'}</span> },
    { header: "Role", key: "role", render: (u) => {
        let bClass = "bg-slate-100 text-slate-700"
        if (u.role_name === 'Admin') bClass = "bg-purple-100 text-purple-700"
        else if (u.role_name === 'Manager') bClass = "bg-blue-100 text-blue-700"
        return <Badge className={`${bClass} hover:${bClass} border-0 shadow-none font-semibold uppercase tracking-wider text-[10px]`}>{u.role_name}</Badge>
    }},
    { header: "Status", key: "status", render: (u) => (
       u.is_active 
         ? <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0">ACTIVE</Badge> 
         : <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-0">INACTIVE</Badge>
    )},
    { header: "Last Login", key: "last_login", render: (u) => <span className="text-sm text-slate-500">{timeAgo(u.last_login)}</span> },
    {
      header: "Actions",
      key: "actions",
      sortable: false,
      render: (u) => {
        const isSelf = currentUser && currentUser.username === u.username
        return (
          <div className="flex items-center justify-end gap-1">
             <Button variant="ghost" size="icon" onClick={() => { setEditingUser(u); setModalOpen(true) }} className="text-slate-500 hover:text-blue-600 h-8 w-8">
               <Edit className="w-4 h-4" />
             </Button>
             {!isSelf && (
               <ConfirmDialog 
                 title={u.is_active ? "Deactivate User" : "Reactivate User"}
                 description={u.is_active ? `Are you sure you want to deactivate ${u.username}? They will no longer be able to log in.` : `Reactivate ${u.username}?`}
                 destructive={u.is_active}
                 onConfirm={() => handleDeactivate(u.id)}
               >
                 <Button variant="ghost" size="icon" className={cn("h-8 w-8", u.is_active ? "text-slate-500 hover:text-red-600 hover:bg-red-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50")}>
                   <ShieldOff className="w-4 h-4" />
                 </Button>
               </ConfirmDialog>
             )}
          </div>
        )
      }
    }
  ]

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-6 h-full">
      <PageHeader 
        title="User Management" 
        actions={
          <Button onClick={() => { setEditingUser(null); setModalOpen(true) }} className="gap-2">
            <Plus className="h-4 w-4" /> Add User
          </Button>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-[500px]">
        <DataTable 
          columns={columns} 
          data={users} 
          isLoading={isLoading} 
          searchKeys={["full_name", "username", "email"]} 
          searchPlaceholder="Search users..." 
        />
      </div>

      <UserModal isOpen={modalOpen} onClose={() => setModalOpen(false)} user={editingUser} currentUser={currentUser} />
    </div>
  
    </ErrorBoundary>
  )
}
