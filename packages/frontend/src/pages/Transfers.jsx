import ErrorBoundary from "@/components/shared/ErrorBoundary"
import * as React from "react"
import { useTransfers, useLocations, useTools } from "@/lib/queries"
import { useAuth } from "@/lib/auth"
import { useApproveTransfer, useCompleteTransfer, useCancelTransfer } from "@/lib/mutations"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Plus, Loader2, Info, Lock } from "lucide-react"
import { TransferModal } from "@/components/transfers/TransferModal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { cn } from "@/lib/utils"

function TransferCard({ transfer, isManager }) {
  const { mutateAsync: approveTransfer } = useApproveTransfer()
  const { mutateAsync: completeTransfer } = useCompleteTransfer()
  const { mutateAsync: cancelTransfer } = useCancelTransfer()

  return (
    <div className="bg-background rounded-xl shadow-sm border border-border p-4 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
         <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-semibold text-foreground leading-tight mb-1 truncate">{transfer.tool_name}</h3>
            <Badge variant="outline" className="font-mono text-[10px] bg-muted text-muted-foreground border-border font-normal">
              {transfer.sku}
            </Badge>
         </div>
         <div className="shrink-0 bg-blue-100 text-blue-800 text-lg font-bold px-2.5 py-1 rounded border border-blue-200">
            ×{transfer.quantity}
         </div>
      </div>

      <div className="flex flex-col gap-2 mb-4 bg-muted rounded-lg p-3 border border-border">
         <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            {transfer.from_loc_name}
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
            {transfer.to_loc_name}
         </div>
         <div className="text-[10px] text-slate-400 font-medium">
            Requested by {transfer.requested_by_name} · {new Date(transfer.created_at).toLocaleDateString()}
         </div>
         {transfer.notes && (
            <p className="text-xs text-muted-foreground italic mt-1 border-t border-border pt-2 line-clamp-2" title={transfer.notes}>"{transfer.notes}"</p>
         )}
      </div>

      <div className="mt-auto flex flex-col gap-3">
        {transfer.status === 'pending' && (
          <>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded uppercase tracking-wider">
               <Info className="w-3 h-3" /> Stock not yet reserved
            </div>
            {isManager && (
              <div className="flex gap-2">
                 <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => approveTransfer(transfer.id)} title="Approving will reserve this stock">
                    Approve
                 </Button>
                 <ConfirmDialog 
                   title="Cancel Transfer" 
                   description="Are you sure you want to cancel this transfer request?" 
                   destructive 
                   onConfirm={() => cancelTransfer(transfer.id)}
                 >
                   <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-border">Cancel</Button>
                 </ConfirmDialog>
              </div>
            )}
          </>
        )}

        {transfer.status === 'approved' && (
          <>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider">
               <Lock className="w-3 h-3" /> Stock is reserved at source
            </div>
            {isManager && (
              <div className="flex gap-2">
                 <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-700" onClick={() => completeTransfer(transfer.id)}>
                    Mark Complete
                 </Button>
                 <ConfirmDialog 
                   title="Cancel Transfer" 
                   description="Cancelling this approved transfer will release the reserved stock back to the source location inventory." 
                   destructive 
                   onConfirm={() => cancelTransfer(transfer.id)}
                 >
                   <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-border">Cancel</Button>
                 </ConfirmDialog>
              </div>
            )}
          </>
        )}

        {transfer.status === 'completed' && (
           <div className="flex items-center justify-center gap-2 text-xs font-bold text-green-700 bg-green-50/50 border border-green-200 px-3 py-2 rounded-lg uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              Completed {new Date(transfer.completed_at || transfer.updated_at).toLocaleDateString()}
           </div>
        )}
      </div>
    </div>
  )
}

export function TransfersPage() {
  const { hasRole } = useAuth()
  const isManager = hasRole('Manager')

  const { data: transfers = [], isLoading } = useTransfers()
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  // Split into columns
  const draft = transfers.filter(t => t.status === 'pending')
  const approved = transfers.filter(t => t.status === 'approved' || t.status === 'in_transit')
  const completed = transfers.filter(t => t.status === 'completed')
    .sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 10) // Only show last 10 completed

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="h-[500px] bg-slate-200 rounded-xl"></div>
           <div className="h-[500px] bg-slate-200 rounded-xl"></div>
           <div className="h-[500px] bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-6 h-full min-h-[calc(100vh-6rem)]">
      <PageHeader 
        title="Stock Transfers" 
        actions={
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New Transfer
          </Button>
        }
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start pb-6">
        
        {/* COL 1: PENDING (DRAFT) */}
        <div className="bg-slate-100 rounded-xl border border-border p-4 flex flex-col h-full max-h-min lg:max-h-full min-h-[400px]">
          <div className="flex items-center justify-between mb-4 px-1">
             <h2 className="font-bold text-slate-700 flex items-center gap-2">
               <span className="text-xl">📋</span> Pending Approval
             </h2>
             <Badge variant="secondary" className="bg-slate-200 text-slate-700 font-bold">{draft.length}</Badge>
          </div>
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 pb-2">
             {draft.length === 0 ? (
                <div className="my-auto text-center p-6 text-sm text-muted-foreground font-medium bg-muted rounded-lg border border-border border-dashed">
                  No pending requests.
                </div>
             ) : (
                draft.map(t => <TransferCard key={t.id} transfer={t} isManager={isManager} />)
             )}
          </div>
        </div>

        {/* COL 2: APPROVED / IN TRANSIT */}
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 flex flex-col h-full max-h-min lg:max-h-full min-h-[400px]">
          <div className="flex items-center justify-between mb-4 px-1">
             <h2 className="font-bold text-blue-800 flex items-center gap-2">
               <span className="text-xl">✅</span> In Transit
             </h2>
             <Badge variant="secondary" className="bg-blue-200 text-blue-800 font-bold">{approved.length}</Badge>
          </div>
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 pb-2">
             {approved.length === 0 ? (
                <div className="my-auto text-center p-6 text-sm text-blue-500 font-medium bg-blue-50/50 rounded-lg border border-blue-200 border-dashed">
                  No active transfers.
                </div>
             ) : (
                approved.map(t => <TransferCard key={t.id} transfer={t} isManager={isManager} />)
             )}
          </div>
        </div>

        {/* COL 3: COMPLETED */}
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 flex flex-col h-full max-h-min lg:max-h-full min-h-[400px]">
          <div className="flex items-center justify-between mb-4 px-1">
             <h2 className="font-bold text-emerald-800 flex items-center gap-2">
               <span className="text-xl">✓</span> Completed
             </h2>
             <Badge variant="secondary" className="bg-emerald-200 text-emerald-800 font-bold">{completed.length}</Badge>
          </div>
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 pb-2">
             {completed.length === 0 ? (
                <div className="my-auto text-center p-6 text-sm text-emerald-600 font-medium bg-emerald-50/50 rounded-lg border border-emerald-200 border-dashed">
                  No completed transfers.
                </div>
             ) : (
                completed.map(t => <TransferCard key={t.id} transfer={t} isManager={isManager} />)
             )}
          </div>
        </div>

      </div>

      <TransferModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  
    </ErrorBoundary>
  )
}
