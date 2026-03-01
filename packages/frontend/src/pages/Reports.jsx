import ErrorBoundary from "@/components/shared/ErrorBoundary"
import * as React from "react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/shared/StatCard"
import { Download, AlertCircle, TrendingUp, CheckCircle2, ChevronDown, ChevronRight, Calculator, FileText, ShoppingBag, Truck } from "lucide-react"
import { useStockReport, useWorkerHoldings, useMovements, usePurchases } from "@/lib/queries"
import { cn } from "@/lib/utils"

function exportCSV(filename, rows) {
  if (!rows || !rows.length) return
  const headers = Object.keys(rows[0])
  const csvContent = [
    headers.join(","),
    ...rows.map(row => headers.map(h => {
      let cell = row[h] === null || row[h] === undefined ? "" : String(row[h])
      if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
         cell = `"${cell.replace(/"/g, '""')}"`
      }
      return cell
    }).join(","))
  ].join("\n")

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function StockLevelsTab() {
  const { data: report = [], isLoading } = useStockReport()
  const [location, setLocation] = React.useState("all")
  const [category, setCategory] = React.useState("all")
  const [status, setStatus] = React.useState("all")

  // Derive unique options
  const locations = React.useMemo(() => [...new Set(report.map(r => r.loc_name).filter(Boolean))], [report])
  const categories = React.useMemo(() => [...new Set(report.map(r => r.category).filter(Boolean))], [report])

  // Filter
  const filtered = React.useMemo(() => {
    return report.filter(r => {
      if (location !== "all" && r.loc_name !== location) return false
       if (category !== "all" && r.category !== category) return false
       const avail = r.quantity - r.reserved_quantity
       const rStatus = avail === 0 ? 'out' : (avail <= (r.min_stock_level || 0) && r.min_stock_level > 0 ? 'low' : 'ok')
       if (status !== "all" && rStatus !== status) return false
       return true
    })
  }, [report, location, category, status])

  // Summary
  const outOfStock = filtered.filter(r => (r.quantity - r.reserved_quantity) === 0).length
  const lowStock = filtered.filter(r => (r.quantity - r.reserved_quantity) > 0 && (r.quantity - r.reserved_quantity) <= (r.min_stock_level || 0) && r.min_stock_level > 0).length
  const okStock = filtered.filter(r => (r.quantity - r.reserved_quantity) > (r.min_stock_level || 0) || ((r.quantity - r.reserved_quantity) > 0 && !(r.min_stock_level > 0))).length

  const handleExport = () => {
    exportCSV("stock_levels_report", filtered.map(r => ({
      SKU: r.sku,
      ToolName: r.name,
      Category: r.category,
      Location: r.loc_name,
      TotalQuantity: r.quantity,
      Reserved: r.reserved_quantity,
      Available: r.quantity - r.reserved_quantity,
      MinLevel: r.min_stock_level || 0
    })))
  }

  const columns = [
    { header: "SKU", key: "sku", render: (r) => <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">{r.sku}</span> },
    { header: "Tool Name", key: "name", render: (r) => <span className="font-medium">{r.name}</span> },
    { header: "Category", key: "category", render: (r) => <span className="text-slate-500 text-sm">{r.category}</span> },
    { header: "Location", key: "loc_name", render: (r) => <span className="text-slate-600 text-sm">{r.loc_name}</span> },
    { header: "Total", key: "quantity", render: (r) => <span className="text-slate-500">{r.quantity}</span> },
    { header: "Reserved", key: "reserved_quantity", render: (r) => <span className="text-slate-500">{r.reserved_quantity}</span> },
    { header: "Available", key: "avail", render: (r) => {
        const avail = r.quantity - r.reserved_quantity
        return <span className={cn("font-bold text-base", avail === 0 ? "text-red-600" : (avail <= (r.min_stock_level || 0) && r.min_stock_level > 0 ? "text-amber-600" : "text-green-600"))}>{avail}</span>
    }},
    { header: "Min Level", key: "min_stock_level", render: (r) => <span className="text-slate-400">{r.min_stock_level || 0}</span> },
    { header: "Status", key: "status", render: (r) => {
        const avail = r.quantity - r.reserved_quantity
        const s = avail === 0 ? 'out' : (avail <= (r.min_stock_level || 0) && r.min_stock_level > 0 ? 'low' : 'ok')
        return <StatusBadge type="stock" status={s} />
    }}
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
         <div className="flex flex-wrap items-center gap-3">
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ok">OK</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
         </div>
         <Button onClick={handleExport} variant="outline" className="gap-2 bg-white">
           <Download className="w-4 h-4" /> Export CSV
         </Button>
      </div>

      <div className="flex gap-4">
         <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm font-medium">
            <AlertCircle className="w-4 h-4" /> {outOfStock} out of stock
         </div>
         <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 text-sm font-medium">
            <TrendingUp className="w-4 h-4" /> {lowStock} low stock
         </div>
         <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" /> {okStock} ok
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <DataTable columns={columns} data={filtered} isLoading={isLoading} searchKeys={["sku", "name"]} emptyMessage="No stock data found." />
      </div>
    </div>
  )
}

function WorkerHoldingsTab() {
  const { data: holdings = [], isLoading } = useWorkerHoldings()
  const [expanded, setExpanded] = React.useState(new Set())

  const handleExport = () => {
    const rows = []
    holdings.forEach(w => {
       w.loans.forEach(l => {
          rows.push({
             WorkerName: w.worker_name,
             Phone: w.phone || '',
             Company: w.company || '',
             ToolSKU: l.sku,
             ToolName: l.tool_name,
             Quantity: l.quantity,
             DateOut: new Date(l.date_out).toLocaleDateString(),
             ExpectedReturn: new Date(l.expected_return_date).toLocaleDateString(),
             IsOverdue: new Date(l.expected_return_date).getTime() < Date.now() ? 'Yes' : 'No'
          })
       })
    })
    exportCSV("worker_holdings_report", rows)
  }

  if (isLoading) return <div className="p-8 text-center animate-pulse text-slate-400">Loading holdings...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
         <Button onClick={handleExport} variant="outline" className="gap-2 bg-white">
           <Download className="w-4 h-4" /> Export CSV
         </Button>
      </div>

      <div className="space-y-3">
        {holdings.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-xl border border-slate-200 text-slate-500">No active worker holdings.</div>
        ) : (
          holdings.map(worker => {
            const isExp = expanded.has(worker.worker_id)
            return (
              <div key={worker.worker_id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div 
                  className={cn("p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors", isExp ? "bg-slate-50 border-b border-slate-100" : "")}
                  onClick={() => {
                     const next = new Set(expanded)
                     if (next.has(worker.worker_id)) next.delete(worker.worker_id)
                     else next.add(worker.worker_id)
                     setExpanded(next)
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 text-lg">{worker.worker_name}</span>
                      <span className="text-xs text-slate-500">{worker.phone} {worker.company ? `· ${worker.company}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 font-bold">{worker.loans.length} Items</Badge>
                      <Badge variant="outline" className={cn(
                        "text-[10px] uppercase font-bold",
                        worker.reliability_score >= 80 ? "bg-green-50 text-green-700 border-green-200" :
                        worker.reliability_score >= 50 ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-red-50 text-red-700 border-red-200"
                      )}>
                         {worker.reliability_score !== null ? `${Math.round(worker.reliability_score)}% Rel` : 'New'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-slate-400">
                    {isExp ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                </div>

                {isExp && (
                  <div className="p-0 bg-slate-50/50">
                     <table className="w-full text-sm text-left">
                       <thead className="bg-slate-100/50 text-slate-600 text-xs uppercase tracking-wider">
                         <tr>
                           <th className="px-6 py-2">Item</th>
                           <th className="px-6 py-2">Qty</th>
                           <th className="px-6 py-2">Date Out</th>
                           <th className="px-6 py-2">Expected Return</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {worker.loans.map(loan => {
                           const overdue = new Date(loan.expected_return_date).getTime() < Date.now()
                           return (
                             <tr key={loan.id} className="hover:bg-white transition-colors">
                               <td className="px-6 py-3">
                                 <div className="flex items-center gap-2">
                                   <span className="font-mono text-[10px] bg-slate-100 border border-slate-200 px-1 py-0.5 rounded text-slate-500">{loan.sku}</span>
                                   <span className="font-medium text-slate-800">{loan.tool_name}</span>
                                 </div>
                               </td>
                               <td className="px-6 py-3 font-semibold text-slate-700">{loan.quantity}</td>
                               <td className="px-6 py-3 text-slate-600">{new Date(loan.date_out).toLocaleDateString()}</td>
                               <td className="px-6 py-3">
                                 <span className={overdue ? "text-red-600 font-medium" : "text-slate-600"}>
                                    {new Date(loan.expected_return_date).toLocaleDateString()}
                                    {overdue && <span className="ml-2 uppercase text-[9px] font-bold bg-red-100 text-red-700 px-1 py-0.5 rounded">Overdue</span>}
                                 </span>
                               </td>
                             </tr>
                           )
                         })}
                       </tbody>
                     </table>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function MovementsTab() {
  const { data: movements = [], isLoading } = useMovements({ limit: 500 })
  const [type, setType] = React.useState("all")

  // Generate last 30 days default range
  const today = new Date().toISOString().split('T')[0]
  const lastMonth = new Date()
  lastMonth.setDate(lastMonth.getDate() - 30)
  const defaultFrom = lastMonth.toISOString().split('T')[0]

  const [dateFrom, setDateFrom] = React.useState(defaultFrom)
  const [dateTo, setDateTo] = React.useState(today)

  const types = React.useMemo(() => [...new Set(movements.map(m => m.movement_type))], [movements])

  const filtered = React.useMemo(() => {
    return movements.filter(m => {
      if (type !== "all" && m.movement_type !== type) return false
      const mDate = new Date(m.performed_at).getTime()
      if (dateFrom && mDate < new Date(dateFrom).getTime()) return false
      if (dateTo && mDate > new Date(dateTo).getTime() + 86400000) return false // incl end of day
      return true
    })
  }, [movements, type, dateFrom, dateTo])

  const handleExport = () => {
    exportCSV("movements_report", filtered.map(m => ({
      DateTime: new Date(m.performed_at).toLocaleString(),
      Type: m.movement_type,
      ToolSKU: m.sku,
      ToolName: m.tool_name,
      Location: m.loc_name,
      Quantity: m.quantity,
      PerformedBy: m.performed_by,
      InvoiceRef: m.reference_id || '',
      Notes: m.notes || ''
    })))
  }

  const columns = [
    { header: "Date/Time", key: "performed_at", render: (m) => <span className="text-sm whitespace-nowrap text-slate-600">{new Date(m.performed_at).toLocaleString()}</span> },
    { header: "Type", key: "movement_type", render: (m) => <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-slate-50">{m.movement_type.replace('_', ' ')}</Badge> },
    { header: "Tool", key: "tool", render: (m) => (
      <div className="flex flex-col">
        <span className="font-medium text-slate-900">{m.tool_name}</span>
        <span className="font-mono text-[10px] text-slate-400">{m.sku}</span>
      </div>
    )},
    { header: "Location", key: "loc_name", render: (m) => <span className="text-sm text-slate-600">{m.loc_name}</span> },
    { header: "Qty", key: "quantity", render: (m) => {
       const isPositive = m.quantity > 0
       return <span className={cn("font-bold", isPositive ? "text-green-600" : "text-red-600")}>{isPositive ? '+' : ''}{m.quantity}</span>
    }},
    { header: "By", key: "performed_by", render: (m) => <span className="text-sm text-slate-600">{m.performed_by}</span> },
    { header: "Notes", key: "notes", sortable: false, render: (m) => (
      <span className="text-xs text-slate-500 max-w-[150px] truncate block" title={m.notes}>{m.notes || '-'}</span>
    )},
    { header: "Ref", key: "reference_id", render: (m) => <span className="text-xs text-slate-400 font-mono">{m.reference_id || '-'}</span> }
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
         <div className="flex flex-wrap items-center gap-3">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Movement Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map(t => <SelectItem key={t} value={t}>{String(t).replace('_', ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-auto" />
              <span className="text-slate-400">to</span>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-auto" />
            </div>
         </div>
         <Button onClick={handleExport} variant="outline" className="gap-2 bg-white">
           <Download className="w-4 h-4" /> Export CSV
         </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <DataTable columns={columns} data={filtered} isLoading={isLoading} searchKeys={["tool_name", "sku", "performed_by"]} emptyMessage="No movements found in this range." />
      </div>
    </div>
  )
}

function CostAnalysisTab() {
  const { data: purchases = [], isLoading } = usePurchases()

  // Calc summaries
  const totalSpend = purchases.reduce((acc, p) => acc + Number(p.total_amount || 0), 0)
  const totalTax = purchases.reduce((acc, p) => acc + Number(p.tax_amount || 0), 0)
  const totalItems = purchases.reduce((acc, p) => acc + (p.items || []).reduce((sum, item) => sum + item.quantity_received, 0), 0)

  // Group by supplier
  const supplierStats = React.useMemo(() => {
    const map = {}
    purchases.forEach(p => {
      const name = p.supplier_name
      if (!map[name]) map[name] = { name, count: 0, spend: 0, lastDate: 0 }
      map[name].count++
      map[name].spend += Number(p.total_amount || 0)
      const d = new Date(p.invoice_date).getTime()
      if (d > map[name].lastDate) map[name].lastDate = d
    })
    return Object.values(map).sort((a,b) => b.spend - a.spend)
  }, [purchases])

  // Group by category (requires items analysis)
  const categoryStats = React.useMemo(() => {
    const map = {}
    purchases.forEach(p => {
      (p.items || []).forEach(item => {
        // We might not have category on po item in current mock, let's assume item has tool_name, we'll group by tool name as proxy if category missing
        // Standardizing it for demo
        const cat = item.category || "General Tools" 
        if (!map[cat]) map[cat] = { cat, items: 0, cost: 0 }
        map[cat].items += item.quantity_received || item.quantity
        map[cat].cost += (item.quantity_received || item.quantity) * Number(item.unit_price || 0)
      })
    })
    return Object.values(map).sort((a,b) => b.cost - a.cost)
  }, [purchases])

  const handleExportSuppliers = () => {
    exportCSV("spend_by_supplier", supplierStats.map(s => ({
       Supplier: s.name,
       OrdersCount: s.count,
       TotalSpend_AED: s.spend.toFixed(2),
       AvgOrderValue_AED: (s.spend / s.count).toFixed(2),
       LastOrderDate: new Date(s.lastDate).toLocaleDateString()
    })))
  }

  if (isLoading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-amber-600 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <StatCard title="Total Spend" value={`AED ${totalSpend.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`} icon={Calculator} variant="default" />
         <StatCard title="Total Tax Paid" value={`AED ${totalTax.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`} icon={FileText} variant="default" />
         <StatCard title="Total POs" value={purchases.length} icon={ShoppingBag} variant="default" />
         <StatCard title="Items Received" value={totalItems} icon={Truck} variant="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
             <h3 className="font-semibold text-slate-800">Spend by Supplier</h3>
             <Button variant="ghost" size="sm" onClick={handleExportSuppliers} className="h-8 gap-2 text-slate-500 hover:text-blue-600">
                <Download className="w-3.5 h-3.5" /> Export
             </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3 text-center">Orders</th>
                  <th className="px-4 py-3 text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierStats.map(s => (
                  <tr key={s.name} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{s.count}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">AED {s.spend.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                  </tr>
                ))}
                {supplierStats.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-slate-400">No purchase data.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <h3 className="font-semibold text-slate-800">Spend by Category</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Items</th>
                  <th className="px-4 py-3 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryStats.map(c => (
                  <tr key={c.cat} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.cat}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{c.items}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">AED {c.cost.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                  </tr>
                ))}
                {categoryStats.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-slate-400">No purchase data.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ReportsPage() {
  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-6 h-full min-h-[calc(100vh-6rem)]">
      <PageHeader title="Reports & Analytics" />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col">
        <Tabs defaultValue="stock" className="flex flex-col h-full">
          <div className="px-4 pt-4 border-b border-slate-100">
            <TabsList className="bg-slate-50 border border-slate-200">
              <TabsTrigger value="stock" className="text-sm px-4">Stock Levels</TabsTrigger>
              <TabsTrigger value="workers" className="text-sm px-4">Worker Holdings</TabsTrigger>
              <TabsTrigger value="movements" className="text-sm px-4">Movements</TabsTrigger>
              <TabsTrigger value="cost" className="text-sm px-4">Cost Analysis</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 p-4 md:p-6 bg-slate-50/30 rounded-b-xl overflow-y-auto">
            <TabsContent value="stock" className="m-0"><StockLevelsTab /></TabsContent>
            <TabsContent value="workers" className="m-0"><WorkerHoldingsTab /></TabsContent>
            <TabsContent value="movements" className="m-0"><MovementsTab /></TabsContent>
            <TabsContent value="cost" className="m-0"><CostAnalysisTab /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>

    </ErrorBoundary>
  )
}
