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
import { PurchaseOrderDetailModal } from "@/components/procurement/PurchaseOrderDetailModal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Plus, ChevronDown, ChevronUp, PackageCheck, AlertCircle, Printer, Loader2 } from "lucide-react"
import { cn, printPO } from "@/lib/utils"
import api from "@/lib/api"

function PrintPOButton({ po, className }) {
  const [loading, setLoading] = React.useState(false)
  const handlePrint = async (e) => {
    e.stopPropagation()
    setLoading(true)
    try {
      const res = await api.get(`/api/purchases/${po.id}`)
      printPO({ ...po, items: res.data.items })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handlePrint} 
      disabled={loading} 
      className={cn("h-8 gap-1 border-slate-200 hover:bg-slate-50", className)}
      title="Print PO"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" /> : <Printer className="w-3.5 h-3.5 text-slate-500" />}
      <span className="hidden sm:inline">Print</span>
    </Button>
  )
}


export function PurchasesPage() {
  const { hasRole } = useAuth()
  const isManager = hasRole('Manager')

  const { data: purchases = [], isLoading } = usePurchases()
  const { mutateAsync: receivePurchase } = useReceivePurchase()
  
  const [modalOpen, setModalOpen] = React.useState(false)
  const [viewingPoId, setViewingPoId] = React.useState(null)

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
                   const itemsCount = po.item_count || 0

                   return (
                     <React.Fragment key={po.id}>
                        <tr className="hover:bg-muted transition-colors">
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
                               <PrintPOButton po={po} />
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
                               <Button variant="ghost" size="sm" onClick={() => setViewingPoId(po.id)} className="h-8 gap-1 text-muted-foreground hover:text-blue-700 hover:bg-blue-50">
                                  View
                                  <ChevronDown className="w-3.5 h-3.5" />
                               </Button>
                            </div>
                         </td>
                       </tr>
                     </React.Fragment>
                   )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PurchaseOrderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <PurchaseOrderDetailModal 
        isOpen={!!viewingPoId} 
        onClose={() => setViewingPoId(null)} 
        poId={viewingPoId} 
        isManager={isManager} 
        onReceive={receivePurchase} 
      />
    </div>
    </ErrorBoundary>
  )
}
