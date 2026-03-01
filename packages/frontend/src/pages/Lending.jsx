import * as React from "react"
import { useSearchParams, Link } from "react-router-dom"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Plus, MapPin, Calendar, Phone, RotateCcw } from "lucide-react"
import { useLending } from "@/lib/queries"
import { IssueToolModal } from "@/components/lending/IssueToolModal"
import { ReturnToolModal } from "@/components/lending/ReturnToolModal"
import { cn } from "@/lib/utils"

function getInitials(name) {
  if (!name) return "?"
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  return `${days} day${days > 1 ? "s" : ""} ago`
}

function LoanCard({ loan, isOverdue, onReturn }) {
  const daysOut = Math.floor((Date.now() - new Date(loan.date_out).getTime()) / 86400000)
  const daysOverdue = Math.floor((Date.now() - new Date(loan.expected_return_date).getTime()) / 86400000)
  const daysUntilDue = -daysOverdue

  return (
    <div className={cn(
      "bg-white rounded-xl shadow-sm border p-4 flex flex-col justify-between transition-shadow hover:shadow-md",
      isOverdue ? "border-l-4 border-l-red-500 border-y-slate-200 border-r-slate-200" : "border-slate-200"
    )}>
      {/* TOP ROW */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-2">
           <h3 className="font-semibold text-slate-900 leading-tight mb-1">{loan.tool_name}</h3>
           <Badge variant="outline" className="font-mono text-[10px] bg-slate-50">{loan.sku}</Badge>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">×{loan.quantity}</Badge>
          {isOverdue && <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-0 text-[10px] uppercase font-bold px-1.5">{daysOverdue} DAY{daysOverdue !== 1 ? 'S' : ''} OVERDUE</Badge>}
        </div>
      </div>

      {/* ROW 2: WORKER */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
          {getInitials(loan.worker_name)}
        </div>
        <div className="min-w-0 flex-1">
          <Link to={`/workers/${loan.worker_id}`} className="font-medium text-slate-900 hover:text-blue-600 truncate block">
            {loan.worker_name}
          </Link>
          {loan.phone && (
            isOverdue ? (
              <a href={`tel:${loan.phone}`} className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3" /> Call {loan.phone}
              </a>
            ) : (
              <a href={`tel:${loan.phone}`} className="text-xs text-slate-400 hover:text-blue-600 truncate block">{loan.phone}</a>
            )
          )}
        </div>
      </div>

      {/* ROW 3 & 4: DETAILS */}
      <div className="space-y-2 mb-4">
        {loan.loc_name && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{loan.loc_name}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Issued: {new Date(loan.date_out).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className={cn(
              "font-medium",
              isOverdue ? "text-red-600" : (daysUntilDue <= 3 ? "text-orange-500" : "text-slate-600")
            )}>
              Expected: {new Date(loan.expected_return_date).toLocaleDateString()}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
             {daysOut} day{daysOut !== 1 ? 's' : ''} out
          </span>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex-1 truncate">
           {loan.job_site && <Badge variant="secondary" className="text-[10px] font-normal truncate max-w-full bg-slate-100">{loan.job_site}</Badge>}
        </div>
        <Button 
          variant={isOverdue ? "destructive" : "outline"}
          className={cn("shrink-0", !isOverdue && "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200")} 
          onClick={() => onReturn(loan)}
        >
          Return Tool
        </Button>
      </div>
    </div>
  )
}

export function Lending() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get("tab") || "active"
  
  const [isIssueOpen, setIsIssueOpen] = React.useState(false)
  const [returnLoan, setReturnLoan] = React.useState(null)

  // Worker filter for active/overdue tabs
  const [selectedWorkerId, setSelectedWorkerId] = React.useState("all")

  // Data fetching based on tab
  const statusParam = currentTab === "history" ? undefined : "active"
  const { data: loans = [], isLoading } = useLending(statusParam)

  const handleTabChange = (tab) => {
    setSearchParams({ tab })
    setSelectedWorkerId("all") // Reset worker filter on tab change
  }

  // Derive workers for filter
  const uniqueWorkers = React.useMemo(() => {
    const map = new Map()
    loans.forEach(l => {
      if (l.worker_id && !map.has(l.worker_id)) {
         map.set(l.worker_id, { id: l.worker_id, name: l.worker_name })
      }
    })
    return Array.from(map.values()).sort((a,b) => a.name.localeCompare(b.name))
  }, [loans])

  // Process data for the current tab
  const displayData = React.useMemo(() => {
    let filtered = loans
    
    // Apply worker filter if active
    if (selectedWorkerId !== "all") {
       filtered = filtered.filter(l => String(l.worker_id) === selectedWorkerId)
    }

    if (currentTab === "active") {
       // All active, but could be overdue too. 
       // Often "active" tab shows everything currently out, but prompt says "Overdue" is a separate tab.
       // Let's show all active (including overdue) in "active", or strictly non-overdue?
       // Prompt: "Active: useLending('active')", "Overdue: Same data as Active, filtered client-side... Sort by most overdue first"
       // We'll show all active loans in 'active' tab, but let's sort them (newest first).
       return filtered.sort((a, b) => new Date(b.date_out).getTime() - new Date(a.date_out).getTime())
    } 
    
    if (currentTab === "overdue") {
       const now = Date.now()
       return filtered
         .filter(l => new Date(l.expected_return_date).getTime() < now)
         .sort((a, b) => new Date(a.expected_return_date).getTime() - new Date(b.expected_return_date).getTime())
    }

    // History tab: return everything
    return filtered
  }, [loans, currentTab, selectedWorkerId])

  const historyColumns = [
    { header: "Date Out", key: "date_out", render: (l) => <span className="whitespace-nowrap">{new Date(l.date_out).toLocaleDateString()}</span> },
    { header: "SKU", key: "sku", render: (l) => <span className="font-mono text-xs px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">{l.sku}</span> },
    { header: "Tool Name", key: "tool_name", render: (l) => <span className="font-medium text-slate-900">{l.tool_name}</span> },
    { header: "Worker", key: "worker_name", render: (l) => <span className="text-slate-700">{l.worker_name}</span> },
    { header: "Qty", key: "quantity", render: (l) => <span className="font-bold">{l.quantity}</span> },
    { header: "Location", key: "loc_name", render: (l) => <span className="text-xs text-slate-500">{l.loc_name || '-'}</span> },
    { header: "Job Site", key: "job_site", render: (l) => <span className="text-xs text-slate-500">{l.job_site || '-'}</span> },
    { header: "Expected", key: "expected_return_date", render: (l) => <span className="whitespace-nowrap">{new Date(l.expected_return_date).toLocaleDateString()}</span> },
    { header: "Actual Return", key: "returned_at", render: (l) => <span className="whitespace-nowrap">{l.returned_at ? new Date(l.returned_at).toLocaleDateString() : <span className="text-slate-300">-</span>}</span> },
    { header: "Duration", key: "duration", sortable: false, render: (l) => {
        if (!l.returned_at) return <span className="text-slate-300">-</span>
        const d = Math.floor((new Date(l.returned_at).getTime() - new Date(l.date_out).getTime()) / 86400000)
        return <span>{d} day{d !== 1 ? 's' : ''}</span>
    }},
    { header: "Condition", key: "return_condition", render: (l) => l.return_condition ? <StatusBadge type="maintenance" status={l.return_condition === 'good' ? 'completed' : (l.return_condition === 'damaged' ? 'in_progress' : 'pending')} label={l.return_condition} /> : <span className="text-slate-300">-</span> },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Tool Lending" 
        actions={
          <Button onClick={() => setIsIssueOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Issue Tool
          </Button>
        }
      />

      {/* CUSTOM TABS */}
      <div className="flex items-center gap-6 border-b border-slate-200 overflow-x-auto pb-[1px]">
         <button 
           onClick={() => handleTabChange('active')} 
           className={cn("pb-3 px-1 text-sm font-medium transition-colors whitespace-nowrap", currentTab === 'active' ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500 hover:text-slate-700")}
         >
           Active Loans
         </button>
         <button 
           onClick={() => handleTabChange('overdue')} 
           className={cn("pb-3 px-1 text-sm font-medium transition-colors whitespace-nowrap", currentTab === 'overdue' ? "border-b-2 border-red-600 text-red-600 font-bold" : "text-slate-500 hover:text-slate-700")}
         >
           Overdue
         </button>
         <button 
           onClick={() => handleTabChange('history')} 
           className={cn("pb-3 px-1 text-sm font-medium transition-colors whitespace-nowrap", currentTab === 'history' ? "border-b-2 border-slate-900 text-slate-900" : "text-slate-500 hover:text-slate-700")}
         >
           Loan History
         </button>
      </div>

      {/* FILTER CONTROLS */}
      {(currentTab === "active" || currentTab === "overdue") && (
        <div className="flex items-center w-full md:w-64 max-w-full">
           <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
             <SelectTrigger>
               <SelectValue placeholder="Filter by worker..." />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Workers</SelectItem>
               {uniqueWorkers.map(w => (
                 <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
               ))}
             </SelectContent>
           </Select>
        </div>
      )}

      {/* CONTENT AREA */}
      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-56 bg-slate-200 rounded-xl" />)}
          </div>
        ) : currentTab === "history" ? (
           <DataTable 
             columns={historyColumns} 
             data={displayData} 
             searchKeys={["tool_name", "worker_name", "job_site"]}
             searchPlaceholder="Search tools, workers, or job sites..."
             emptyMessage="No loan history found."
           />
        ) : (
          <div>
            {displayData.length === 0 ? (
               currentTab === "overdue" ? (
                 <div className="flex flex-col items-center justify-center p-12 text-center bg-green-50/50 rounded-xl border border-green-100 mt-4">
                    <RotateCcw className="w-12 h-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold text-green-800 mb-1">No overdue loans — great job! ✓</h3>
                    <p className="text-green-600/80 text-sm max-w-sm">All tools have been returned on time or are still within their expected lending periods.</p>
                 </div>
               ) : (
                 <div className="text-center p-12 text-slate-500 bg-white rounded-xl border border-slate-200 mt-4">
                   No active loans found.
                 </div>
               )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {displayData.map(loan => (
                  <LoanCard 
                    key={loan.id} 
                    loan={loan} 
                    isOverdue={new Date(loan.expected_return_date).getTime() < Date.now()} 
                    onReturn={setReturnLoan} 
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <IssueToolModal isOpen={isIssueOpen} onClose={() => setIsIssueOpen(false)} />
      <ReturnToolModal isOpen={!!returnLoan} onClose={() => setReturnLoan(null)} loan={returnLoan} />
    </div>
  )
}
