import * as React from "react"
import { useParams, Link } from "react-router-dom"
import { Edit, Mail, Phone, MapPin, Building2, Package, CheckCircle2, RotateCcw } from "lucide-react"
import { useWorkerDetail } from "@/lib/queries"
import { useAuth } from "@/lib/auth"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ReturnToolModal } from "../../components/lending/ReturnToolModal"
import { DataTable } from "@/components/shared/DataTable"
import { cn } from "@/lib/utils"

function InfoItem({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
      <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  )
}

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  return `${days} day${days > 1 ? "s" : ""} ago`
}

export function WorkerDetail() {
  const { id } = useParams()
  const { data: worker, isLoading } = useWorkerDetail(id)
  const { hasRole } = useAuth()
  const isManager = hasRole('Manager')

  const [returnLoan, setReturnLoan] = React.useState(null)

  if (isLoading) {
    return <div className="space-y-6 animate-pulse">
      <div className="h-16 bg-slate-200 rounded-lg w-1/3"></div>
      <div className="h-32 bg-slate-200 rounded-xl"></div>
    </div>
  }

  if (!worker) return <div className="p-8 text-center text-slate-500">Worker not found.</div>

  const activeLoans = worker.active_loans || []
  const historyLoans = worker.history || []

  // Stats calculation
  const totalCompleted = worker.total_completed_loans || 0
  const reliability = worker.reliability_score
  let relColor = "default"
  if (reliability !== null && reliability !== undefined) {
    if (reliability >= 80) relColor = "success"
    else if (reliability >= 50) relColor = "warning"
    else relColor = "danger"
  }

  const historyColumns = [
    { header: "Date Out", key: "date_out", render: (l) => <span className="whitespace-nowrap">{new Date(l.date_out).toLocaleDateString()}</span> },
    { header: "Tool", key: "tool_name", render: (l) => (
       <div className="flex items-center gap-2">
         <span className="font-mono text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">{l.sku}</span>
         <span className="font-medium text-slate-900">{l.tool_name}</span>
       </div>
    )},
    { header: "Qty", key: "quantity", render: (l) => <span className="font-bold">{l.quantity}</span> },
    { header: "Location", key: "loc_name", render: (l) => <span className="text-xs text-slate-500">{l.loc_name || '-'}</span> },
    { header: "Duration", key: "duration", sortable: false, render: (l) => {
        if (!l.returned_at) return <span className="text-slate-300">-</span>
        const d = Math.floor((new Date(l.returned_at).getTime() - new Date(l.date_out).getTime()) / 86400000)
        return <span className="text-sm">{d} day{d !== 1 ? 's' : ''}</span>
    }},
    { header: "Condition", key: "return_condition", render: (l) => l.return_condition ? <StatusBadge type="maintenance" status={l.return_condition === 'good' ? 'completed' : (l.return_condition === 'damaged' ? 'in_progress' : 'pending')} label={l.return_condition} /> : <span className="text-slate-300">-</span> },
    { header: "Notes", key: "notes", render: (l) => <span className="text-xs text-slate-500 truncate max-w-[200px]" title={l.return_note}>{l.return_note || '-'}</span> }
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title={worker.name} 
        subtitle={`${worker.worker_type} ${worker.company ? `· ${worker.company}` : ''}`}
        backTo="/workers"
        actions={isManager && (
          <Button variant="outline" onClick={() => {}} className="gap-2">
            <Edit className="h-4 w-4" /> Edit
          </Button>
        )}
      />

      {/* INFO GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <InfoItem icon={Mail} label="Email Address" value={worker.email ? <a href={`mailto:${worker.email}`} className="text-blue-600 hover:underline">{worker.email}</a> : null} />
        <InfoItem icon={Phone} label="Phone Number" value={worker.phone ? <a href={`tel:${worker.phone}`} className="text-blue-600 hover:underline">{worker.phone}</a> : null} />
        <InfoItem icon={Building2} label="Company" value={worker.company} />
        <InfoItem icon={MapPin} label="Address" value={worker.address} />
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Loans" value={worker.active_loans_count || 0} icon={Package} variant="default" />
        <StatCard title="Total Loans" value={worker.total_loans || 0} icon={RotateCcw} variant="default" />
        <StatCard title="On-Time Returns" value={worker.on_time_returns || 0} icon={CheckCircle2} variant="success" />
        <div className={cn("bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between", 
            relColor === 'success' ? "border-green-200" : relColor === 'warning' ? "border-amber-200" : relColor === 'danger' ? "border-red-200" : "border-slate-200"
        )}>
          <h3 className="text-sm font-medium text-slate-500 mb-1">Reliability %</h3>
          <div className="flex items-end gap-2 mb-2">
            <span className={cn("text-3xl font-bold tracking-tight", 
               relColor === 'success' ? "text-green-600" : relColor === 'warning' ? "text-amber-600" : relColor === 'danger' ? "text-red-600" : "text-slate-900"
            )}>
              {reliability !== null && reliability !== undefined ? `${Math.round(reliability)}%` : "100%"}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
             {totalCompleted === 0 ? "No returns recorded yet — score defaults to 100%" : `Based on ${totalCompleted} completed return${totalCompleted !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col min-h-[400px]">
        <Tabs defaultValue="active" className="flex flex-col h-full">
          <div className="px-4 pt-4 border-b border-slate-100">
            <TabsList className="bg-slate-50 border border-slate-200">
              <TabsTrigger value="active" className="text-sm px-4">Currently Holding</TabsTrigger>
              <TabsTrigger value="history" className="text-sm px-4">Loan History</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 p-4 bg-slate-50/30 rounded-b-xl overflow-y-auto">
            <TabsContent value="active" className="m-0 h-full">
              {activeLoans.length === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-slate-500 text-sm">
                   <CheckCircle2 className="w-10 h-10 text-slate-300 mb-3" />
                   This worker has no active loans.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeLoans.map(loan => {
                    const isOverdue = new Date(loan.expected_return_date).getTime() < Date.now()
                    return (
                      <div key={loan.id} className={cn("bg-white p-4 rounded-xl shadow-sm border flex flex-col", isOverdue ? "border-red-200" : "border-slate-200")}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-slate-900">{loan.tool_name}</p>
                            <span className="text-[10px] font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-500">{loan.sku}</span>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">x{loan.quantity}</Badge>
                        </div>
                        <div className="text-xs text-slate-600 mb-4 space-y-1">
                          <p>Out: {new Date(loan.date_out).toLocaleDateString()} <span className="text-slate-400">({timeAgo(loan.date_out)})</span></p>
                          <p className={isOverdue ? "text-red-600 font-medium" : ""}>
                            Due: {new Date(loan.expected_return_date).toLocaleDateString()}
                            {isOverdue && <span className="ml-1 uppercase text-[9px] font-bold bg-red-100 text-red-700 px-1 py-0.5 rounded">Overdue</span>}
                          </p>
                        </div>
                        <Button variant={isOverdue ? "destructive" : "outline"} className="w-full mt-auto" onClick={() => setReturnLoan(loan)}>Return</Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="m-0 h-full overflow-hidden flex flex-col">
              <div className="flex-1 bg-white rounded-lg border border-slate-200 overflow-hidden">
                <DataTable 
                  columns={historyColumns} 
                  data={[...historyLoans].sort((a,b) => new Date(b.date_out).getTime() - new Date(a.date_out).getTime())}
                  emptyMessage="No loan history."
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <ReturnToolModal isOpen={!!returnLoan} onClose={() => setReturnLoan(null)} loan={returnLoan} />
    </div>
  )
}
