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

  if (isLoading) return <div className="p-6 text-center text-muted-foreground animate-pulse bg-muted">Loading line items...</div>
  if (!po) return <div className="p-6 text-center text-red-500 bg-muted">Failed to load details.</div>

  const items = po.items || []

  return (
    <div className="bg-muted border-x border-b border-border p-4 md:p-6 shadow-inner">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-foreground">Line Items</h4>
        {po.status === 'pending' && isManager && (
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

      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-muted-foreground text-xs uppercase tracking-wider">
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
                     <span className="font-mono text-[10px] bg-slate-100 border border-border px-1.5 py-0.5 rounded text-muted-foreground">{item.sku}</span>
                     <div>
                       <p className="font-medium text-foreground">{item.tool_name}</p>
                       <p className="text-xs text-muted-foreground">To: {item.location_name}</p>
                     </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                <td className="px-4 py-3 text-center">
                  {po.status === 'completed' ? (
                     <Badge className="bg-green-100 text-green-700 hover:bg-green-100 font-bold border-0">{item.quantity_received || item.quantity}</Badge>
                   ) : (
                     <span className="text-slate-400">0</span>
                   )}
                </td>
                <td className="px-4 py-3 text-right">AED {Number(item.unit_price).toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">
                  AED {(item.quantity * Number(item.unit_price)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {po.notes && (
         <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground bg-background p-3 rounded-lg border border-border">
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

      <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
        {isLoading ? (
           <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-border border-t-blue-600 animate-spin" /></div>
        ) : purchases.length === 0 ? (
           <div className="p-12 text-center text-muted-foreground">No purchase orders found.</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
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
                       <tr className={cn("hover:bg-muted transition-colors", isExpanded ? "bg-muted" : "")}>
                         <td className="px-4 py-4 font-mono font-medium text-foreground whitespace-nowrap">{po.invoice_number}</td>
                         <td className="px-4 py-4 font-medium text-slate-700 whitespace-nowrap">{po.supplier_name}</td>
                         <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">{new Date(po.invoice_date).toLocaleDateString()}</td>
                         <td className="px-4 py-4 text-center">
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700">{itemsCount}</Badge>
                         </td>
                         <td className="px-4 py-4 text-right text-xs text-muted-foreground whitespace-nowrap">
                            AED {Number(po.tax_amount).toFixed(2)}
                         </td>
                         <td className="px-4 py-4 text-right font-bold text-foreground whitespace-nowrap">
                            AED {Number(po.total_amount).toFixed(2)}
                         </td>
                         <td className="px-4 py-4 text-center">
                            <StatusBadge type="purchase" status={po.payment_status} />
                         </td>
                         <td className="px-4 py-4 text-center">
                           <StatusBadge type="purchase" status={po.status} />
                         </td>
                         <td className="px-4 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                             {po.status === 'pending' && isManager && (
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
                               <Button variant="ghost" size="sm" onClick={() => toggleRow(po.id)} className="h-8 gap-1 text-muted-foreground hover:text-blue-700 hover:bg-blue-50">
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
