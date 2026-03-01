import ErrorBoundary from "@/components/shared/ErrorBoundary"
import * as React from "react"
import { useParams } from "react-router-dom"
import { Edit, PackageOpen, Wrench, FileClock, HandMetal, AlertTriangle } from "lucide-react"
import { useToolDetail } from "@/lib/queries"
import { useAuth } from "@/lib/auth"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { StockAdjustmentModal } from "@/components/inventory/StockAdjustmentModal"
import { MaintenanceModal } from "@/components/inventory/MaintenanceModal"
import { ToolFormDialog } from "@/components/inventory/ToolFormDialog"
import { useReturnMaintenance } from "@/lib/mutations"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

function InfoField({ label, value, render }) {
  return (
    <div className="flex flex-col gap-1 border border-border rounded-lg p-3 bg-slate-50/50">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <div className="text-sm font-medium text-foreground">
        {render ? render(value) : (value || <span className="text-slate-400 font-normal">-</span>)}
      </div>
    </div>
  )
}

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export function ToolDetail() {
  const { id } = useParams()
  const toolId = Number(id)
  const { data, isPending, isLoading, error } = useToolDetail(id)
  const tool = data?.tool ?? data
  const { hasRole } = useAuth()
  const isManager = hasRole('Manager')
  
  const { mutateAsync: returnMaintenance } = useReturnMaintenance()

  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [adjustToolData, setAdjustToolData] = React.useState(null)
  const [maintenanceToolData, setMaintenanceToolData] = React.useState(null)

  if (isLoading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-16 bg-slate-200 rounded-lg w-1/3"></div>
      <div className="h-40 bg-slate-200 rounded-xl"></div>
    </div>
  }

  if (error) return <div className="p-8 text-center text-red-500">Tool not found or failed to load.</div>
  if (!tool) return <div className="p-8 text-center text-muted-foreground">Tool not found.</div>

  const stockByLocation = tool.stock_by_location || []
  const expectedTotal = stockByLocation.reduce((acc, loc) => acc + (loc.quantity || 0), 0)

  return (
    <ErrorBoundary>
    <div className="flex flex-col gap-6">
      <PageHeader 
        title={tool.name} 
        subtitle={<span className="font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">SKU: {tool.sku}</span>}
        backTo="/inventory"
        actions={isManager && (
          <Button onClick={() => setIsEditOpen(true)} className="gap-2">
            <Edit className="h-4 w-4" /> Edit Tool
          </Button>
        )}
      />

      {/* SECTION 1: Info Grid */}
      <div className="bg-background rounded-xl shadow-sm border border-border p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoField label="Brand" value={tool.brand} />
        <InfoField label="Model" value={tool.model} />
        <InfoField label="Serial Number" value={tool.serial_number} />
        <InfoField label="Supplier" value={tool.supplier?.name} />
        <InfoField label="Category" value={tool.category} render={v => <Badge variant="outline" className="font-normal">{v}</Badge>} />
        <InfoField label="Unit of Measure" value={tool.unit_of_measure} className="capitalize" />
        <InfoField label="Min Stock Level" value={tool.min_stock_level} />
        <InfoField label="Status" value={tool.status} render={v => (
           <Badge variant={v === 'Active' ? 'default' : 'destructive'}>{v}</Badge>
        )} />
      </div>

      {/* SECTION 2: Stock by Location */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-foreground">Stock Availability</h2>
        
        {stockByLocation.length === 0 ? (
          <div className="bg-background rounded-xl shadow-sm border border-border p-8 text-center text-muted-foreground">
            <PackageOpen className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            No stock records found for this tool.
          </div>
        ) : (
          <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 gap-4 snap-x">
            {stockByLocation.map(loc => {
              const qty = loc.quantity || 0
              const reserved = loc.reserved_quantity || 0
              const available = qty - reserved
              const min = tool.min_stock_level || 0
              
              let status = 'ok'
              if (available === 0) status = 'out'
              else if (available <= min) status = 'low'

              return (
                <div key={loc.location_id} className="min-w-[300px] flex-1 bg-background rounded-xl shadow-sm border border-border p-5 snap-center flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-foreground">{loc.name}</h3>
                      <StatusBadge type="stock" status={status} />
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                       <span className="text-4xl font-extrabold text-foreground tracking-tighter">{available}</span>
                       <span className="text-sm text-muted-foreground mb-1 font-medium">available</span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium tracking-wide">
                      Total: {qty} <span className="mx-1">|</span> Reserved: {reserved} <span className="mx-1">|</span> Min: {min}
                    </p>
                  </div>
                  
                  <div className="mt-6 flex items-center gap-2 pt-4 border-t border-border">
                    <Button 
                      variant="outline" 
                      className="flex-1 text-xs h-8" 
                      onClick={() => setAdjustToolData({ locationId: loc.location_id, locationName: loc.name, quantity: qty })}
                    >
                      Adjust Stock
                    </Button>
                    {isManager && available > 0 && (
                      <Button 
                        variant="secondary" 
                        className="flex-1 text-xs h-8 text-amber-700 bg-amber-50 hover:bg-amber-100"
                        onClick={() => setMaintenanceToolData({ locationId: loc.location_id, locationName: loc.name, availableStock: available })}
                      >
                        Maintenance
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* TABS SECTION */}
      <div className="bg-background rounded-xl shadow-sm border border-border mt-4 h-[500px] flex flex-col">
        <Tabs defaultValue="history" className="flex flex-col h-full">
          <div className="px-4 pt-4 border-b border-border">
            <TabsList className="bg-muted border border-border">
              <TabsTrigger value="history" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm px-4">
                <FileClock className="h-4 w-4 mr-2" /> Stock History
              </TabsTrigger>
              <TabsTrigger value="loans" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm px-4">
                <HandMetal className="h-4 w-4 mr-2" /> Active Loans
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm px-4">
                <Wrench className="h-4 w-4 mr-2" /> Maintenance Log
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="history" className="m-0 h-full">
              {(!tool.movements || tool.movements.length === 0) ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No stock history available.</div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-xs uppercase text-muted-foreground bg-muted sticky top-0">
                    <tr>
                      <th className="py-2 px-3 font-medium rounded-tl-md">Date</th>
                      <th className="py-2 px-3 font-medium">Type</th>
                      <th className="py-2 px-3 font-medium">Qty</th>
                      <th className="py-2 px-3 font-medium">Location</th>
                      <th className="py-2 px-3 font-medium">Performed By</th>
                      <th className="py-2 px-3 font-medium w-full rounded-tr-md">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {tool.movements.map((m, i) => (
                      <tr key={i} className="hover:bg-muted">
                        <td className="py-3 px-3">
                          <div className="font-medium text-foreground">{timeAgo(m.performed_at)}</div>
                          <div className="text-[10px] text-slate-400">{new Date(m.performed_at).toLocaleDateString()}</div>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">{m.movement_type.replace('_', ' ')}</Badge>
                        </td>
                        <td className={`py-3 px-3 font-bold ${m.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {m.quantity > 0 ? '+' : ''}{m.quantity}
                        </td>
                        <td className="py-3 px-3">{m.loc_name}</td>
                        <td className="py-3 px-3">{m.performed_by}</td>
                        <td className="py-3 px-3 text-muted-foreground truncate max-w-[200px]" title={m.notes || m.reference_id}>{m.notes || m.reference_id || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </TabsContent>

            <TabsContent value="loans" className="m-0 h-full">
               {(!tool.active_loans || tool.active_loans.length === 0) ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No active loans for this tool.</div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-xs uppercase text-muted-foreground bg-muted sticky top-0">
                    <tr>
                      <th className="py-2 px-3 font-medium rounded-tl-md">Worker</th>
                      <th className="py-2 px-3 font-medium">Qty</th>
                      <th className="py-2 px-3 font-medium">Date Out</th>
                      <th className="py-2 px-3 font-medium">Expected Return</th>
                      <th className="py-2 px-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {tool.active_loans.map((loan, i) => {
                      const daysOut = Math.floor((Date.now() - new Date(loan.date_out).getTime()) / 86400000)
                      const isOverdue = new Date(loan.expected_return_date).getTime() < Date.now()
                      return (
                      <tr key={i} className="hover:bg-muted">
                        <td className="py-3 px-3 font-medium text-foreground">{loan.worker_name} <br/><span className="text-xs text-slate-400 font-normal">{loan.phone || '-'}</span></td>
                        <td className="py-3 px-3 font-bold">{loan.quantity}</td>
                        <td className="py-3 px-3">{new Date(loan.date_out).toLocaleDateString()} <br/><span className="text-xs text-slate-400">{daysOut} days ago</span></td>
                        <td className="py-3 px-3">{new Date(loan.expected_return_date).toLocaleDateString()}</td>
                        <td className="py-3 px-3">
                           {isOverdue ? <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">Overdue</Badge> : <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Active</Badge>}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              )}
            </TabsContent>

            <TabsContent value="maintenance" className="m-0 h-full">
               {(!tool.maintenance_logs || tool.maintenance_logs.length === 0) ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No maintenance records.</div>
              ) : (
                 <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-xs uppercase text-muted-foreground bg-muted sticky top-0">
                    <tr>
                      <th className="py-2 px-3 font-medium rounded-tl-md">Status</th>
                      <th className="py-2 px-3 font-medium">Units</th>
                      <th className="py-2 px-3 font-medium">Reason</th>
                      <th className="py-2 px-3 font-medium">Started</th>
                      <th className="py-2 px-3 font-medium">Exp. Completion</th>
                      <th className="py-2 px-3 font-medium rounded-tr-md">Action / Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {tool.maintenance_logs.map((log, i) => (
                      <tr key={i} className="hover:bg-muted">
                        <td className="py-3 px-3"><StatusBadge type="maintenance" status={log.status} /></td>
                        <td className="py-3 px-3 font-bold">{log.units}</td>
                        <td className="py-3 px-3 max-w-[200px] truncate" title={log.reason}>{log.reason}</td>
                        <td className="py-3 px-3">{new Date(log.started_at).toLocaleDateString()}</td>
                        <td className="py-3 px-3">{log.expected_completion ? new Date(log.expected_completion).toLocaleDateString() : '-'}</td>
                        <td className="py-3 px-3">
                          {log.status === 'in_progress' ? (
                            <ConfirmDialog
                              title="Return from Maintenance"
                              description={`Mark ${log.units}x ${tool.name} as returned from maintenance? This will restock them.`}
                              confirmText="Return"
                              onConfirm={() => returnMaintenance({ id: tool.id, maintenance_id: log.id })}
                            >
                               <Button size="sm" variant="outline" className="h-7 text-xs text-green-700 bg-green-50 border-green-200 hover:bg-green-100">Return</Button>
                            </ConfirmDialog>
                          ) : (
                            <span className="text-xs text-slate-400">{log.completed_at ? new Date(log.completed_at).toLocaleDateString() : '-'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <ToolFormDialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} tool={tool} />
      
      {adjustToolData && (
        <StockAdjustmentModal 
          isOpen={true} 
          onClose={() => setAdjustToolData(null)} 
          tool={tool} 
          locationId={adjustToolData.locationId}
          locationName={adjustToolData.locationName}
          currentStock={adjustToolData.quantity}
        />
      )}
      
      {maintenanceToolData && (
        <MaintenanceModal 
          isOpen={true} 
          onClose={() => setMaintenanceToolData(null)} 
          tool={tool} 
          locationId={maintenanceToolData.locationId}
          locationName={maintenanceToolData.locationName}
          availableStock={maintenanceToolData.availableStock}
        />
      )}
    </div>

    </ErrorBoundary>
  )
}
