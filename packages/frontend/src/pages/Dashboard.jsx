import ErrorBoundary from "@/components/shared/ErrorBoundary"
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wrench, Users, ArrowUpRight, AlertTriangle, Package, Activity, 
  CheckCircle2, ArrowDownLeft, ArrowRight, ArrowLeft, HandMetal, 
  RotateCcw, SlidersHorizontal, Loader2
} from 'lucide-react';
import { useDashboard } from "@/lib/queries";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { StockAdjustmentModal } from "@/components/inventory/StockAdjustmentModal";
import { ReturnToolModal } from "@/components/lending/ReturnToolModal";

const todayFormatted = new Date().toLocaleDateString('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

function MovementIcon({ type }) {
  switch (type) {
    case 'stock_in': return <div className="p-2 bg-green-100 text-green-600 rounded-full"><ArrowDownLeft className="w-4 h-4" /></div>;
    case 'stock_out': return <div className="p-2 bg-orange-100 text-orange-600 rounded-full"><ArrowUpRight className="w-4 h-4" /></div>;
    case 'transfer_in': return <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><ArrowRight className="w-4 h-4" /></div>;
    case 'transfer_out': return <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><ArrowLeft className="w-4 h-4" /></div>;
    case 'lending': return <div className="p-2 bg-yellow-100 text-yellow-600 rounded-full"><HandMetal className="w-4 h-4" /></div>;
    case 'lending_return': return <div className="p-2 bg-green-100 text-green-600 rounded-full"><RotateCcw className="w-4 h-4" /></div>;
    case 'adjustment': return <div className="p-2 bg-slate-100 text-slate-600 rounded-full"><SlidersHorizontal className="w-4 h-4" /></div>;
    default: return <div className="p-2 bg-slate-100 text-slate-600 rounded-full"><Activity className="w-4 h-4" /></div>;
  }
}

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function Dashboard() {
  const { data, isLoading } = useDashboard();
  const [adjustItem, setAdjustItem] = useState(null);
  const [returnLoan, setReturnLoan] = useState(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
         <div className="h-20 bg-slate-200 rounded-lg w-1/3 mb-4"></div>
         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-white rounded-xl border border-slate-200" />)}
         </div>
         <div className="grid md:grid-cols-2 gap-6">
            <div className="h-96 bg-white rounded-xl border border-slate-200" />
            <div className="h-96 bg-white rounded-xl border border-slate-200" />
         </div>
      </div>
    );
  }

  // Fallback defaults
  const stats = data || {
    tools_total: 0, workers_total: 0, active_loans: 0, 
    overdue: 0, low_stock: 0, movements_today: 0,
    low_items: [], overdue_items: [], recent_movements: []
  };

  // Filter out low items where min_stock_level is 0
  const validLowItems = (stats.low_items || []).filter(item => 
    item.min_stock_level > 0 && item.quantity <= item.min_stock_level
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" subtitle={todayFormatted} />

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Tools" value={stats.tools_total} icon={Wrench} variant="default" />
        <StatCard title="Active Workers" value={stats.workers_total} icon={Users} variant="default" />
        <Link to="/lending"><StatCard title="Active Loans" value={stats.active_loans} icon={ArrowUpRight} variant="default" onClick={() => {}} /></Link>
        <Link to="/lending?tab=overdue"><StatCard title="Overdue Items" value={stats.overdue} icon={AlertTriangle} variant={stats.overdue > 0 ? "danger" : "default"} onClick={() => {}} /></Link>
        <Link to="/inventory"><StatCard title="Low Stock Alerts" value={stats.low_stock} icon={Package} variant={stats.low_stock > 0 ? "warning" : "default"} onClick={() => {}} /></Link>
        <StatCard title="Today's Movements" value={stats.movements_today} icon={Activity} variant="default" />
      </div>

      {/* TWO COL GRID */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* LEFT: Low Stock */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-slate-800 tracking-tight">Low Stock Alerts</h2>
            </div>
            {validLowItems.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {validLowItems.length}
              </span>
            )}
          </div>
          <div className="flex-1 p-0">
            {validLowItems.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
                  <p className="text-slate-500 text-sm">All tools are well stocked</p>
               </div>
            ) : (
               <div className="divide-y divide-slate-100">
                 {validLowItems.slice(0, 8).map((item, idx) => (
                   <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                     <div className="min-w-0 pr-4">
                       <div className="flex items-center gap-2 mb-1">
                         <span className="font-medium text-slate-900 truncate">{item.name}</span>
                         <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 font-mono text-[10px] rounded border border-slate-200 flex-shrink-0">{item.sku}</span>
                       </div>
                       <p className="text-xs text-slate-500">{item.loc_name}</p>
                     </div>
                     <div className="flex items-center gap-3 flex-shrink-0">
                       <span className={`px-2 py-1 text-xs font-semibold rounded-md ${item.quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                         {item.quantity === 0 ? 'OUT' : `${item.quantity}/${item.min_stock_level}`}
                       </span>
                       <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => setAdjustItem(item)}>Adjust</Button>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
          {validLowItems.length > 8 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
                <Link to="/inventory" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">View all alerts →</Link>
              </div>
          )}
        </div>

        {/* RIGHT: Overdue Loans */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="bg-red-100 p-1 rounded-md text-red-600">
                 <AlertTriangle className="w-4 h-4" />
              </div>
              <h2 className="font-semibold text-slate-800 tracking-tight">Overdue Loans</h2>
            </div>
            {(stats.overdue_items || []).length > 0 && (
              <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {(stats.overdue_items || []).length}
              </span>
            )}
          </div>
          <div className="flex-1 p-0">
            {(!stats.overdue_items || stats.overdue_items.length === 0) ? (
               <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
                  <p className="text-slate-500 text-sm">No overdue loans</p>
               </div>
            ) : (
               <div className="divide-y divide-slate-100">
                 {stats.overdue_items.slice(0, 8).map((loan, idx) => {
                   const daysOverdue = Math.floor((Date.now() - new Date(loan.expected_return_date).getTime()) / 86400000);
                   return (
                     <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                       <div className="min-w-0 pr-4">
                         <div className="flex items-center gap-2 mb-1">
                           <span className="font-medium text-slate-900 truncate">{loan.worker_name}</span>
                           {loan.phone && <a href={`tel:${loan.phone}`} className="text-xs text-slate-400 hover:text-blue-600 hover:underline">{loan.phone}</a>}
                         </div>
                         <div className="flex items-center gap-2">
                           <p className="text-xs text-slate-600 truncate">{loan.tool_name}</p>
                           <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 font-mono text-[10px] rounded border border-slate-200">{loan.sku}</span>
                         </div>
                       </div>
                       <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                         <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                           {daysOverdue > 0 ? `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} late` : `Due Today`}
                         </span>
                         <Button variant="outline" size="sm" className="h-7 text-xs px-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300" onClick={() => setReturnLoan(loan)}>Return x{loan.quantity}</Button>
                       </div>
                     </div>
                   )
                 })}
               </div>
            )}
          </div>
          {(stats.overdue_items || []).length > 8 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
                <Link to="/lending?tab=overdue" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">View all overdue →</Link>
              </div>
          )}
        </div>

      </div>

      {/* RECENT ACTIVITY */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
         <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 tracking-tight">Recent Activity</h2>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-full border border-green-100">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
               </span>
               <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Live</span>
            </div>
         </div>
         <div className="divide-y divide-slate-100">
           {(!stats.recent_movements || stats.recent_movements.length === 0) ? (
              <div className="p-8 text-center text-sm text-slate-500">No recent activity.</div>
           ) : (
             stats.recent_movements.slice(0, 10).map((mov, idx) => (
                <div key={idx} className="p-4 flex items-center md:items-start lg:items-center gap-4 hover:bg-slate-50 transition-colors">
                   <MovementIcon type={mov.movement_type} />
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                         <span className="font-medium text-slate-900 truncate">{mov.tool_name}</span>
                         <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 font-mono text-[10px] rounded border border-slate-200 hidden sm:inline-block">{mov.sku}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{mov.loc_name} <span className="mx-1">·</span> {mov.performed_by}</p>
                   </div>
                   <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right">
                      <span className={`font-semibold text-sm ${mov.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                         {mov.quantity > 0 ? '+' : ''}{mov.quantity}
                      </span>
                      <span className="text-xs text-slate-400">{timeAgo(mov.performed_at)}</span>
                   </div>
                </div>
             ))
           )}
         </div>
      </div>

      <StockAdjustmentModal isOpen={!!adjustItem} onClose={() => setAdjustItem(null)} item={adjustItem} />
      <ReturnToolModal isOpen={!!returnLoan} onClose={() => setReturnLoan(null)} loan={returnLoan} />
    </div>
    </ErrorBoundary>
  );
}
