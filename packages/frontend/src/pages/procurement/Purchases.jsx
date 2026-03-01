import ErrorBoundary from "@/components/shared/ErrorBoundary"
import * as React from "react"
import { usePurchases, usePurchaseDetail } from "@/lib/queries"
import { useAuth } from "@/lib/auth"
import { useReceivePurchase } from "@/lib/mutations"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PurchaseOrderModal } from "@/components/procurement/PurchaseOrderModal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Plus, ChevronDown, ChevronUp, PackageCheck, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

function ExpandedRow({ poId, isManager, onReceive }) {
  const { data: po, isLoading } = usePurchaseDetail(poId)

  if (isLoading) return <div className="p-6 text-center text-slate-500 animate-pulse bg-slate-50">Loading line items...</div>
  if (!po) return <div className="p-6 text-center text-red-500 bg-slate-50">Failed to load details.</div>

  const items = po.items || []

  return (
    <div className="bg-slate-50 border-x border-b border-slate-200 p-4 md:p-6 shadow-inner">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-slate-800">Line Items</h4>
        {po.order_status === 'pending' && isManager && (
           <ConfirmDialog 
             title="Receive Stock" 
             description="This will add all items in this Purchase Order to inventory stock levels at their designated locations. Proceed?" 
             onConfirm={() => onReceive(po.id)}
           >
             <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 h-8">
               <PackageCheck className="w-4 h-4" /> Receive All Stock
             </Button>
           </ConfirmDialog>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-semibold">Tool</th>
              <th className="px-4 py-3 font-semibold text-center">Qty Ordered</th>
              <th className="px-4 py-3 font-semibold text-center">Qty Received</th>
              <th className="px-4 py-3 font-semibold text-right">Unit Cost</th>
              <th className="px-4 py-3 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                     <span className="font-mono text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-500">{item.sku}</span>
                     <div>
                       <p className="font-medium text-slate-900">{item.tool_name}</p>
                       <p className="text-xs text-slate-500">To: {item.location_name}</p>
                     </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                <td className="px-4 py-3 text-center">
                   {po.order_status === 'completed' ? (
                     <Badge className="bg-green-100 text-green-700 hover:bg-green-100 font-bold border-0">{item.quantity_received || item.quantity}</Badge>
                   ) : (
                     <span className="text-slate-400">0</span>
                   )}
                </td>
                <td className="px-4 py-3 text-right">AED {Number(item.unit_price).toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-800">
                  AED {(item.quantity * Number(item.unit_price)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {po.notes && (
         <div className="mt-4 flex items-start gap-2 text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p><span className="font-semibold text-slate-700 mr-1">Notes:</span>{po.notes}</p>
         </div>
      )}
    </div>
  )
}

export function PurchasesPage() {
  const { hasRole } = useAuth()
  const isManager = hasRole('Manager')

  const { data: purchases = [], isLoading } = usePurchases()
  const { mutateAsync: receivePurchase } = useReceivePurchase()
  
  const [modalOpen, setModalOpen] = React.useState(false)
  const [expandedRows, setExpandedRows] = React.useState(new Set())

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) newExpanded.delete(id)
    else newExpanded.add(id)
    setExpandedRows(newExpanded)
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-6">
      <PageHeader 
        title="Purchase Orders" 
        actions={isManager && (
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New PO
          </Button>
        )}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
           <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" /></div>
        ) : purchases.length === 0 ? (
           <div className="p-12 text-center text-slate-500">No purchase orders found.</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-center">Items</th>
                  <th className="px-4 py-3 text-right">Tax</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Payment</th>
                  <th className="px-4 py-3 text-center">Order Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map(po => {
                   const isExpanded = expandedRows.has(po.id)
                  const itemsCount = po.item_count || 0

                   return (
                     <React.Fragment key={po.id}>
                       <tr className={cn("hover:bg-slate-50 transition-colors", isExpanded ? "bg-slate-50" : "")}>
                         <td className="px-4 py-4 font-mono font-medium text-slate-900 whitespace-nowrap">{po.invoice_number}</td>
                         <td className="px-4 py-4 font-medium text-slate-700 whitespace-nowrap">{po.supplier_name}</td>
                         <td className="px-4 py-4 whitespace-nowrap text-slate-600">{new Date(po.invoice_date).toLocaleDateString()}</td>
                         <td className="px-4 py-4 text-center">
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700">{itemsCount}</Badge>
                         </td>
                         <td className="px-4 py-4 text-right text-xs text-slate-500 whitespace-nowrap">
                            AED {Number(po.tax_amount).toFixed(2)}
                         </td>
                         <td className="px-4 py-4 text-right font-bold text-slate-900 whitespace-nowrap">
                            AED {Number(po.total_amount).toFixed(2)}
                         </td>
                         <td className="px-4 py-4 text-center">
                            <StatusBadge type="purchase" status={po.payment_status} />
                         </td>
                         <td className="px-4 py-4 text-center">
                            <StatusBadge type="purchase" status={po.order_status} />
                         </td>
                         <td className="px-4 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                               {po.order_status === 'pending' && isManager && (
                                  <ConfirmDialog 
                                    title="Receive Stock" 
                                    description="This will add all items in this Purchase Order to inventory stock levels at their designated locations. Proceed?" 
                                    onConfirm={() => receivePurchase(po.id)}
                                  >
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 px-2.5 text-xs hidden sm:flex">
                                       Receive
                                    </Button>
                                  </ConfirmDialog>
                               )}
                               <Button variant="ghost" size="sm" onClick={() => toggleRow(po.id)} className="h-8 gap-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50">
                                  {isExpanded ? "Close" : "View"}
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                               </Button>
                            </div>
                         </td>
                       </tr>
                       {isExpanded && (
                         <tr>
                            <td colSpan="9" className="p-0 border-0">
                               <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                               <ExpandedRow poId={po.id} isManager={isManager} onReceive={receivePurchase} />
                               </div>
                            </td>
                         </tr>
                       )}
                     </React.Fragment>
                   )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PurchaseOrderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
    </ErrorBoundary>
  )
}
