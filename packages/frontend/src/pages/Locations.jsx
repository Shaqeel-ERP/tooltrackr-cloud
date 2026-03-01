import ErrorBoundary from "@/components/shared/ErrorBoundary"
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Plus, MapPin, User, Package, Wrench, ArrowRightLeft, ExternalLink } from "lucide-react"
import { useLocations } from "@/lib/queries"
import { useAuth } from "@/lib/auth"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function StatBox({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
      <div className="flex items-center gap-1.5 mb-1 text-slate-500">
        <Icon className="w-4 h-4" />
        <span className="text-[10px] font-semibold tracking-wider uppercase">{label}</span>
      </div>
      <span className="text-xl font-bold text-slate-800">{value}</span>
    </div>
  )
}

export function LocationsList() {
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const isAdmin = hasRole('Admin')
  const { data: locations, isLoading } = useLocations()

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-6">
      <PageHeader 
        title="Locations" 
        actions={isAdmin && (
          <Button onClick={() => {}} className="gap-2">
            <Plus className="h-4 w-4" /> Add Location
          </Button>
        )}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-slate-200 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(locations || []).map(loc => (
            <div key={loc.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
               <div className="p-5 border-b border-slate-100 flex-1">
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="font-bold text-lg text-slate-900 leading-tight">{loc.name}</h3>
                   <Badge variant="outline" className={cn(
                     "uppercase text-[10px] font-bold tracking-wider",
                     loc.type === 'warehouse' ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                     loc.type === 'site' ? "bg-amber-50 text-amber-700 border-amber-200" :
                     "bg-slate-50 text-slate-700 border-slate-200"
                   )}>
                     {loc.type}
                   </Badge>
                 </div>

                 {loc.address && (
                   <div className="flex items-start gap-2 text-sm text-slate-500 mb-4 mt-3">
                     <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                     <p className="line-clamp-2">{loc.address}</p>
                   </div>
                 )}

                 {loc.manager_name && (
                   <div className="flex flex-col gap-1 text-sm bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                     <div className="flex items-center gap-2 font-medium text-slate-700">
                       <User className="w-4 h-4 text-slate-400" />
                       {loc.manager_name}
                     </div>
                     <div className="pl-6 text-slate-500 text-xs">
                        {loc.manager_phone && <a href={`tel:${loc.manager_phone}`} className="hover:text-blue-600 block">{loc.manager_phone}</a>}
                        {loc.manager_email && <a href={`mailto:${loc.manager_email}`} className="hover:text-blue-600 truncate block">{loc.manager_email}</a>}
                     </div>
                   </div>
                 )}
               </div>

               <div className="bg-slate-50/50 p-5 pt-4">
                 <div className="grid grid-cols-3 gap-2 mb-4">
                  <StatBox icon={Wrench} label="Tools" value={loc.total_tools || 0} />
                  <StatBox icon={Package} label="Units" value={loc.total_quantity || 0} />
                  <StatBox icon={ArrowRightLeft} label="Transfers" value={loc.active_transfers || 0} />
                 </div>
                 <Button className="w-full bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm" onClick={() => navigate(`/locations/${loc.id}`)}>
                    View Details
                 </Button>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </ErrorBoundary>
  )
}
