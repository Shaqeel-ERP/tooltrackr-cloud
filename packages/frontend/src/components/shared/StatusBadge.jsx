import * as React from "react"
import { Badge } from "@/components/ui/badge"

const STATUS_MAP = {
  lending: {
    active: { color: "bg-blue-100 text-blue-800", label: "Active" },
    returned: { color: "bg-green-100 text-green-800", label: "Returned" },
    overdue: { color: "bg-red-100 text-red-800", label: "Overdue" },
  },
  stock: {
    ok: { color: "bg-green-100 text-green-800", label: "In Stock" },
    low: { color: "bg-amber-100 text-amber-800", label: "Low Stock" },
    out: { color: "bg-red-100 text-red-800", label: "Out of Stock" },
  },
  transfer: {
    draft: { color: "bg-slate-100 text-foreground", label: "Draft" },
    approved: { color: "bg-blue-100 text-blue-800", label: "Approved" },
    completed: { color: "bg-green-100 text-green-800", label: "Completed" },
    cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
  },
  purchase: {
    pending: { color: "bg-amber-100 text-amber-800", label: "Pending" },
    completed: { color: "bg-green-100 text-green-800", label: "Received" },
    cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
    paid: { color: "bg-green-100 text-green-800", label: "Paid" },
  },
  payment: {
    pending: { color: "bg-amber-100 text-amber-800", label: "Pending" },
    paid: { color: "bg-green-100 text-green-800", label: "Paid" },
  },
  maintenance: {
    in_progress: { color: "bg-amber-100 text-amber-800", label: "In Maintenance" },
    completed: { color: "bg-green-100 text-green-800", label: "Completed" },
  },
  role: {
    Admin: { color: "bg-purple-100 text-purple-800", label: "Admin" },
    Manager: { color: "bg-blue-100 text-blue-800", label: "Manager" },
    User: { color: "bg-slate-100 text-foreground", label: "User" },
  },
  condition: {
    good: { color: "bg-green-100 text-green-800", label: "Good" },
    damaged: { color: "bg-amber-100 text-amber-800", label: "Damaged" },
    lost: { color: "bg-red-100 text-red-800", label: "Lost/Stolen" },
  },
}

export function StatusBadge({ status, type }) {
  if (!status || !type || !STATUS_MAP[type]?.[status]) {
    return <Badge variant="outline" className="text-muted-foreground bg-muted">{status}</Badge>
  }

  const { color, label } = STATUS_MAP[type][status]

  return (
    <Badge variant="outline" className={`border-transparent ${color}`}>
      {label}
    </Badge>
  )
}
