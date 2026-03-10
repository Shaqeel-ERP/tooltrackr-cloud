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
        {transfer.status === 'completed' && (
           <div className="flex items-center justify-center gap-2 text-xs font-bold text-green-700 bg-green-50/50 border border-green-200 px-3 py-2 rounded-lg uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              Completed {new Date(transfer.completed_at || transfer.updated_at || transfer.created_at).toLocaleDateString()}
           </div>
        )}
        {transfer.status === 'cancelled' && (
           <div className="flex items-center justify-center gap-2 text-xs font-bold text-red-700 bg-red-50/50 border border-red-200 px-3 py-2 rounded-lg uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              Cancelled
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

  const sortedTransfers = [...transfers].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           <div className="h-40 bg-slate-200 rounded-xl"></div>
           <div className="h-40 bg-slate-200 rounded-xl"></div>
           <div className="h-40 bg-slate-200 rounded-xl"></div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
         {sortedTransfers.length === 0 ? (
            <div className="col-span-full my-auto text-center p-12 text-sm text-slate-500 font-medium bg-muted rounded-lg border border-border">
              No transfers.
            </div>
         ) : (
            sortedTransfers.map(t => <TransferCard key={t.id} transfer={t} isManager={isManager} />)
         )}
      </div>

      <TransferModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  
    </ErrorBoundary>
  )
}
