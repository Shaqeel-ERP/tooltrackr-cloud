import ErrorBoundary from "@/components/shared/ErrorBoundary"
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Plus, ExternalLink, Edit } from "lucide-react"
import { useWorkers } from "@/lib/queries"
import { useAuth } from "@/lib/auth"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

function getInitials(name) {
  if (!name) return "?"
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

function ReliabilityBar({ value }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground text-sm">100% (No returns)</span>
  
  let colorClass = "bg-green-500"
  if (value < 50) colorClass = "bg-red-500"
  else if (value < 80) colorClass = "bg-amber-500"

  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-sm font-medium text-slate-700">{Math.round(value)}%</span>
    </div>
  )
}

export function WorkersList() {
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const isManager = hasRole('Manager')
  const { data: workers, isLoading } = useWorkers()

  const columns = [
    {
      header: "Worker",
      key: "name",
      render: (w) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-muted-foreground font-bold text-sm shrink-0">
            {getInitials(w.name)}
          </div>
          <div>
            <div className="font-medium text-foreground leading-tight">{w.name}</div>
            <Badge variant="outline" className="text-[10px] mt-0.5 bg-background border-border text-muted-foreground h-4 py-0 leading-none">{w.worker_type}</Badge>
          </div>
        </div>
      )
    },
    {
      header: "Contact",
      key: "contact",
      sortable: false,
      render: (w) => (
        <div className="flex flex-col text-sm">
          {w.phone ? <a href={`tel:${w.phone}`} className="text-blue-600 hover:underline">{w.phone}</a> : <span className="text-slate-400">-</span>}
          {w.email ? <a href={`mailto:${w.email}`} className="text-muted-foreground hover:text-blue-600 mt-0.5">{w.email}</a> : null}
        </div>
      )
    },
    {
      header: "Company",
      key: "company",
      render: (w) => <span className="text-sm text-muted-foreground font-medium">{w.company || '-'}</span>
    },
    {
      header: "Active Loans",
      key: "active_loans",
      render: (w) => (
         w.active_loans > 0 
           ? <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 font-bold">{w.active_loans}</Badge>
           : <span className="text-slate-400 text-sm font-medium ml-2">0</span>
      )
    },
    {
      header: "Reliability",
      key: "reliability_score",
      render: (w) => <ReliabilityBar value={w.reliability_score} />
    },
    {
      header: "Actions",
      key: "actions",
      sortable: false,
      render: (w) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/workers/${w.id}`)} className="h-8 w-8 text-muted-foreground hover:text-blue-600">
            <ExternalLink className="h-4 w-4" />
          </Button>
          {isManager && (
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); /* TODO Edit Worker */ }} className="h-8 w-8 text-muted-foreground hover:text-amber-600">
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
        title="Workers" 
        actions={isManager && (
          <Button onClick={() => {}} className="gap-2">
            <Plus className="h-4 w-4" /> Add Worker
          </Button>
        )}
      />

      <div onClick={(e) => {
        const tr = e.target.closest('tr')
        if (!tr || tr.closest('thead')) return
        const index = Array.from(tr.parentNode.children).indexOf(tr)
        if (index >= 0 && workers && workers[index]) {
          navigate(`/workers/${workers[index].id}`)
        }
      }}>
        <DataTable 
          columns={columns} 
          data={workers || []} 
          isLoading={isLoading} 
          searchKeys={["name", "company", "phone", "email"]}
          searchPlaceholder="Search workers by name, company, or contact info..."
          emptyMessage="No workers found."
        />
      </div>
    </div>
  
    </ErrorBoundary>
  )
}
