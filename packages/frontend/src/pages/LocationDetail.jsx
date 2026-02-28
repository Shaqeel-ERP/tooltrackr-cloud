import * as React from "react"
import { useParams, Link } from "react-router-dom"
import { useLocationDetail } from "@/lib/queries"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { ArrowRightLeft, PackageOpen } from "lucide-react"
import { cn } from "@/lib/utils"

export function LocationDetail() {
  const { id } = useParams()
  const { data: location, isLoading } = useLocationDetail(id)

  if (isLoading) {
    return <div className="space-y-6 animate-pulse">
      <div className="h-16 bg-slate-200 rounded-lg w-1/3"></div>
      <div className="h-64 bg-slate-200 rounded-xl"></div>
    </div>
  }

  if (!location) return <div className="p-8 text-center text-slate-500">Location not found.</div>

  const stockColumns = [
    { header: "SKU", key: "sku", render: (s) => <span className="font-mono text-xs px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-600">{s.sku}</span> },
    { header: "Tool Name", key: "tool_name", render: (s) => <Link to={`/inventory/${s.tool_id}`} className="font-medium text-slate-900 hover:text-blue-600">{s.tool_name}</Link> },
    { header: "Category", key: "category", render: (s) => <Badge variant="outline" className="text-xs bg-white text-slate-500 font-normal">{s.category}</Badge> },
    { header: "Qty", key: "quantity", render: (s) => <span className="font-bold text-slate-800">{s.quantity}</span> },
    { header: "Reserved", key: "reserved_quantity", render: (s) => <span className="text-slate-500">{s.reserved_quantity}</span> },
    { 
       header: "Available", 
       key: "available", 
       render: (s) => {
         const avail = s.quantity - s.reserved_quantity
         const min = s.min_stock_level || 0
         let color = "text-green-600"
         if (avail === 0) color = "text-red-600"
         else if (avail <= min) color = "text-amber-600"
         return <span className={`font-bold ${color}`}>{avail}</span>
       }
    },
    { header: "Min Level", key: "min_stock_level", render: (s) => <span className="text-slate-400">{s.min_stock_level || 0}</span> },
    { header: "Status", key: "status", render: (s) => {
         const avail = s.quantity - s.reserved_quantity
         const min = s.min_stock_level || 0
         let status = 'ok'
         if (avail === 0) status = 'out'
         else if (avail <= min) status = 'low'
         return <StatusBadge type="stock" status={status} />
    }}
  ]

  const hasTransfers = (location.active_transfers_in > 0 || location.active_transfers_out > 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title={location.name} 
        subtitle={location.address}
        backTo="/locations"
      />

      {/* ACTIVE TRANSFERS SUMMARY */}
      {hasTransfers && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="bg-blue-100 p-2 rounded-full text-blue-600">
               <ArrowRightLeft className="w-5 h-5" />
             </div>
             <div>
                <h3 className="font-bold text-blue-900">Active Transfers</h3>
                <p className="text-sm text-blue-700">Stock movements involving this location are currently pending or in transit.</p>
             </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
             {location.active_transfers_in > 0 && (
               <div className="text-center px-4 py-2 bg-white rounded-lg shadow-sm border border-blue-100">
                 <span className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">In</span>
                 <span className="font-bold text-lg text-slate-900">{location.active_transfers_in}</span>
                 <span className="text-xs text-slate-500 ml-1">arriving</span>
               </div>
             )}
             {location.active_transfers_out > 0 && (
               <div className="text-center px-4 py-2 bg-white rounded-lg shadow-sm border border-blue-100">
                 <span className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Out</span>
                 <span className="font-bold text-lg text-slate-900">{location.active_transfers_out}</span>
                 <span className="text-xs text-slate-500 ml-1">leaving</span>
               </div>
             )}
             <Link to="/transfers" className="text-sm font-semibold text-blue-700 hover:text-blue-900 px-3 py-2">
                View All →
             </Link>
          </div>
        </div>
      )}

      {/* STOCK TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-800 text-lg">Inventory at Location</h2>
        </div>
        
        {(!location.stock || location.stock.length === 0) ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
             <PackageOpen className="w-12 h-12 text-slate-300 mb-4" />
             <h3 className="text-lg font-medium text-slate-600">No stock at this location</h3>
             <p className="text-sm text-slate-400">Transfer tools here to build up inventory.</p>
          </div>
        ) : (
          <DataTable 
            columns={stockColumns} 
            data={location.stock} 
            searchKeys={["tool_name", "sku", "category"]}
            searchPlaceholder="Search tools..."
          />
        )}
      </div>

    </div>
  )
}
