import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePurchaseDetail } from "@/lib/queries"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { FileText, Printer, Building2, Calendar, CreditCard, ChevronDown, PackageCheck, AlertCircle, Loader2 } from "lucide-react"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { printPO } from "@/lib/utils"

export function PurchaseOrderDetailModal({ poId, isOpen, onClose, isManager, onReceive }) {
  const { data: po, isLoading } = usePurchaseDetail(isOpen ? poId : null)
  const [printing, setPrinting] = React.useState(false)

  const handlePrint = async () => {
    if (!po) return
    setPrinting(true)
    try {
      printPO(po)
    } finally {
      setPrinting(false)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl w-[95vw] max-w-[95vw] p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="p-4 md:p-6 pb-0 shrink-0 flex flex-row items-center justify-between border-b border-border mr-8">
          <div>
             <DialogTitle className="text-xl flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Purchase Order Details
             </DialogTitle>
             {po && (
               <p className="text-sm text-muted-foreground mt-1 font-mono">
                 {po.invoice_number}
               </p>
             )}
          </div>
          {po && (
             <div className="flex gap-2 mb-4">
                 <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={handlePrint} 
                   disabled={printing} 
                   className="gap-1.5"
                 >
                   {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />} 
                   Print PO
                 </Button>
               {po.status === 'pending' && isManager && (
                  <ConfirmDialog 
                    title="Receive Stock" 
                    description="This will add all items in this Purchase Order to inventory stock levels at their designated locations. Proceed?" 
                    onConfirm={() => {
                        onReceive?.(po.id)
                        onClose()
                    }}
                  >
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 h-9">
                      <PackageCheck className="w-4 h-4" /> Receive Items
                    </Button>
                  </ConfirmDialog>
               )}
             </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 dark:bg-slate-900/50">
          {isLoading ? (
             <div className="flex justify-center items-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
             </div>
          ) : !po ? (
             <div className="text-center text-red-500 py-12 bg-white dark:bg-slate-900 rounded-xl border border-border">Failed to load purchase details.</div>
          ) : (
            <div className="space-y-6">
               
               {/* Metadata Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-card p-4 rounded-xl border border-border flex flex-col gap-1">
                     <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> Supplier
                     </span>
                     <span className="font-semibold text-foreground">{po.supplier_name}</span>
                  </div>
                  <div className="bg-card p-4 rounded-xl border border-border flex flex-col gap-1">
                     <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Date
                     </span>
                     <span className="font-semibold text-foreground">{new Date(po.invoice_date).toLocaleDateString()}</span>
                  </div>
                  <div className="bg-card p-4 rounded-xl border border-border flex flex-col gap-1">
                     <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" /> Payment Terms
                     </span>
                     <span className="font-semibold text-foreground capitalize">{po.payment_terms?.replace('_', ' ')}</span>
                  </div>
                  <div className="bg-card p-4 rounded-xl border border-border flex flex-col gap-1">
                     <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Statuses</span>
                     <div className="flex gap-2 items-center mt-0.5">
                        <StatusBadge type="purchase" status={po.status} />
                        <StatusBadge type="purchase" status={po.payment_status} />
                     </div>
                  </div>
               </div>

               {/* Line Items Table */}
               <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-border font-semibold text-sm flex justify-between items-center">
                     Line Items
                     <Badge variant="secondary" className="bg-blue-100 text-blue-700">{po.items?.length || 0} items</Badge>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left">
                     <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                        <tr>
                           <th className="px-4 py-3 font-semibold">Tool</th>
                           <th className="px-4 py-3 font-semibold text-center">Qty Ordered</th>
                           <th className="px-4 py-3 font-semibold text-center">Qty Received</th>
                           <th className="px-4 py-3 font-semibold text-right">Unit Cost</th>
                           <th className="px-4 py-3 font-semibold text-right">Total</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {po.items?.map((item, idx) => {
                           const unitCost = Number(item.unit_price ?? item.unitPrice ?? item.unit_cost ?? 0);
                           const qty = Number(item.quantity ?? item.qty_ordered ?? 0);
                           const total = unitCost * qty;
                           return (
                              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                              <td className="px-4 py-3">
                                 <div className="flex items-center gap-2">
                                     <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-900 border border-border px-1.5 py-0.5 rounded text-muted-foreground whitespace-nowrap">{item.sku}</span>
                                    <div>
                                      <p className="font-medium text-foreground">{item.tool_name}</p>
                                      <p className="text-xs text-muted-foreground">To: {item.location_name}</p>
                                    </div>
                                 </div>
                              </td>
                                 <td className="px-4 py-3 text-center font-medium">{qty}</td>
                              <td className="px-4 py-3 text-center">
                                 {po.status === 'completed' ? (
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 font-bold border-0">{item.quantity_received || qty}</Badge>
                                 ) : (
                                    <span className="text-slate-400">0</span>
                                 )}
                              </td>
                                 <td className="px-4 py-3 text-right whitespace-nowrap">AED {unitCost.toFixed(2)}</td>
                              <td className="px-4 py-3 text-right font-medium text-foreground whitespace-nowrap">
                                   AED {total.toFixed(2)}
                              </td>
                           </tr>
                           )
                        })}
                     </tbody>
                     </table>
                  </div>
               </div>

               {/* Financials Summary */}
               <div className="flex justify-end pr-4">
                  <div className="w-full sm:w-64 space-y-2 text-sm">
                     <div className="flex justify-between items-center text-slate-500">
                        <span>Subtotal</span>
                        <span className="font-medium text-foreground">AED {Number((po.total_amount || 0) - (po.tax_amount || 0)).toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between items-center text-slate-500">
                        <span>Tax Amount</span>
                        <span className="font-medium text-foreground">AED {Number(po.tax_amount || 0).toFixed(2)}</span>
                     </div>
                     <div className="pt-2 border-t border-border flex justify-between items-center text-base lg:text-lg">
                        <span className="font-bold text-foreground">Total</span>
                        <span className="font-bold text-blue-600">AED {Number(po.total_amount || 0).toFixed(2)}</span>
                     </div>
                  </div>
               </div>

               {/* Notes block */}
               {po.notes && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50">
                     <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                     <div>
                        <span className="font-semibold text-amber-800 dark:text-amber-500 block mb-1">Notes / Instructions</span>
                        <p className="text-amber-700/80 dark:text-amber-500/80">{po.notes}</p>
                     </div>
                  </div>
               )}

            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
