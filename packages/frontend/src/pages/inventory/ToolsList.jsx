import ErrorBoundary from "@/components/shared/ErrorBoundary"
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Eye, Edit, Trash2, Search, X } from "lucide-react"
import { useTools, useLocations } from "@/lib/queries"
import { useDeleteTool } from "@/lib/mutations"
import { useAuth } from "@/lib/auth"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { ToolFormDialog } from "@/components/inventory/ToolFormDialog"
import { StockAdjustmentModal } from "@/components/inventory/StockAdjustmentModal"
import { MaintenanceModal } from "@/components/inventory/MaintenanceModal"

export function ToolsList() {
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const isManager = hasRole('Manager')
  const isAdmin = hasRole('Admin')

  const [search, setSearch] = React.useState("")
  const [category, setCategory] = React.useState("all")
  const [locationId, setLocationId] = React.useState("all")
  const [status, setStatus] = React.useState("active")

  // Modals state
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingTool, setEditingTool] = React.useState(null)
  const [adjustTool, setAdjustTool] = React.useState(null)
  const [maintenanceTool, setMaintenanceTool] = React.useState(null)

  const { data: tools, isLoading } = useTools({ 
    search: search || undefined, 
    locationId: locationId !== "all" ? locationId : undefined,
    status: status !== "all" ? status : undefined 
  })
  const { data: locations } = useLocations()
  const { mutateAsync: deleteTool } = useDeleteTool()

  // Extract unique categories from tools data
  const categories = React.useMemo(() => {
    if (!tools) return []
    return [...new Set(tools.map(t => t.category).filter(Boolean))]
  }, [tools])

  const clearFilters = () => {
    setSearch("")
    setCategory("all")
    setLocationId("all")
    setStatus("active")
  }

  const hasActiveFilters = search || category !== "all" || locationId !== "all" || status !== "active"

  // Filter tools client-side for category (since API doesn't have it in prompt)
  const filteredTools = React.useMemo(() => {
    if (!tools) return []
    let result = tools
    if (category !== "all") {
      result = result.filter(t => t.category === category)
    }
    return result
  }, [tools, category])

  const handleEdit = (e, tool) => {
    e.stopPropagation()
    setEditingTool(tool)
    setIsFormOpen(true)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    await deleteTool(id)
  }

  const columns = [
    {
      header: "SKU",
      key: "sku",
      render: (tool) => (
        <span className="px-2 py-1 bg-blue-50 text-blue-700 font-mono text-xs font-medium border border-blue-200 rounded">
          {tool.sku}
        </span>
      ),
    },
    {
      header: "Name",
      key: "name",
      render: (tool) => (
        <span className="font-medium text-slate-900 block min-w-[150px]">{tool.name}</span>
      ),
    },
    {
      header: "Category",
      key: "category",
      render: (tool) => (
        <Badge variant="outline" className="text-xs text-slate-600 bg-white">
          {tool.category}
        </Badge>
      ),
    },
    {
      header: "Brand",
      key: "brand",
      render: (tool) => <span className="text-slate-500 text-sm">{tool.brand || '-'}</span>,
    },
    {
      header: "Stock",
      key: "total_quantity",
      sortable: false,
      render: (tool) => {
        const stocks = tool.stock_by_location || []
        if (stocks.length === 0) return <span className="text-slate-400 text-xs">No stock data</span>
        return (
          <div className="flex flex-wrap gap-1.5">
            {stocks.map(s => {
               const qty = s.quantity || 0
               const min = tool.min_stock_level || 0
               let color = "bg-green-100 text-green-700 border-green-200"
               if (qty === 0) color = "bg-red-100 text-red-700 border-red-200"
               else if (qty <= min) color = "bg-amber-100 text-amber-700 border-amber-200"
               
               return (
                 <span key={s.location_id} className={`px-2 py-0.5 text-[11px] font-semibold border rounded-sm ${color}`}>
                   {s.name}: {qty}
                 </span>
               )
            })}
          </div>
        )
      },
    },
    {
      header: "Min Level",
      key: "min_stock_level",
      render: (tool) => <span className="text-slate-700">{tool.min_stock_level || 0}</span>,
    },
    {
      header: "Actions",
      key: "actions",
      sortable: false,
      render: (tool) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/inventory/${tool.id}`)} className="h-8 w-8 text-slate-500 hover:text-blue-600">
            <Eye className="h-4 w-4" />
          </Button>
          {isManager && (
            <Button variant="ghost" size="icon" onClick={(e) => handleEdit(e, tool)} className="h-8 w-8 text-slate-500 hover:text-amber-600">
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {isAdmin && (
            <ConfirmDialog 
              title="Delete Tool" 
              description={`Are you sure you want to delete ${tool.name} (${tool.sku})? This action cannot be undone.`} 
              destructive 
              onConfirm={(e) => handleDelete(e, tool.id)}
            >
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ]

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-6">
      <PageHeader 
        title="Tools Inventory" 
        actions={isManager && (
          <Button onClick={() => { setEditingTool(null); setIsFormOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Add Tool
          </Button>
        )}
      />

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1 w-full min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by name, SKU, brand..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-9 w-full"
          />
        </div>
        
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations?.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
          </SelectContent>
        </Select>

        {isManager && (
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="text-slate-500 w-full md:w-auto">
            <X className="h-4 w-4 mr-2" /> Clear
          </Button>
        )}
      </div>

      <div onClick={(e) => {
        const tr = e.target.closest('tr')
        if (!tr || tr.closest('thead')) return
        // find row index to get tool ID
        const index = Array.from(tr.parentNode.children).indexOf(tr)
        if (index >= 0 && filteredTools[index]) {
          navigate(`/inventory/${filteredTools[index].id}`)
        }
      }}>
        <DataTable 
          columns={columns} 
          data={filteredTools} 
          isLoading={isLoading} 
          emptyMessage="No tools found matching your filters."
          searchPlaceholder="Filter table contents..."
        />
      </div>

      <ToolFormDialog 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        tool={editingTool} 
      />
      {adjustTool && (
        <StockAdjustmentModal 
          isOpen={true} 
          onClose={() => setAdjustTool(null)} 
          tool={adjustTool.tool} 
          locationId={adjustTool.locationId}
          locationName={adjustTool.locationName}
          currentStock={adjustTool.quantity}
        />
      )}
      {maintenanceTool && (
        <MaintenanceModal 
          isOpen={true} 
          onClose={() => setMaintenanceTool(null)} 
          tool={maintenanceTool.tool} 
          locationId={maintenanceTool.locationId}
          locationName={maintenanceTool.locationName}
          availableStock={maintenanceTool.availableStock}
        />
      )}
    </div>

    </ErrorBoundary>
  )
}
