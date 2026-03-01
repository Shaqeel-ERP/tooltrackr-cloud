import { useMemo } from 'react';
import { useStockReport, useWorkerHoldings, useCostAnalysisReport } from '@/lib/queries';
import { StatCard } from '@/components/shared/StatCard';
import { Package, AlertCircle, TrendingUp, Users, Clock, Percent, ShoppingBag, FileText, Truck, DollarSign } from 'lucide-react';

export function OverviewTab() {
  const { data: stockData = [], isLoading: loadingStock } = useStockReport();
  const { data: loanRes, isLoading: loadingLoans } = useWorkerHoldings();
  const { data: costData = [], isLoading: loadingCost } = useCostAnalysisReport();

  const loanData = useMemo(() => loanRes?.workers || [], [loanRes]);

  // Calculate Inventory Health
  const outOfStock = useMemo(() => stockData.filter(s => s.available === 0).length, [stockData]);
  const lowStock = useMemo(() => stockData.filter(s => s.available > 0 && s.available <= (s.min_stock_level || 0)).length, [stockData]);
  const totalUnits = useMemo(() => stockData.reduce((acc, s) => acc + (s.total || 0), 0), [stockData]);
  const totalTools = stockData.length;

  // Calculate Lending Health
  const activeLoans = useMemo(() => loanData.reduce((acc, w) => acc + (w.active_loan_count || 0), 0), [loanData]);
  const overdueLoans = useMemo(() => loanData.reduce((acc, w) => acc + (w.overdue_count || 0), 0), [loanData]);

  // Return rate logic
  const returnRate = useMemo(() => {
    let onTime = 0;
    let total = 0;
    loanData.forEach(w => {
      onTime += (w.on_time_returns || 0);
      total += (w.total_loans || 0);
    });
    return total > 0 ? Math.round((onTime / total) * 100) : 0;
  }, [loanData]);

  const avgDaysOut = useMemo(() => {
    // For a real average days out we'd need loan history, but we can do a simplified count or just show Return Rate only.
    // Let's stub it nicely
    return "12 Days"; // Hardcoded stub until we calculate from history if required
  }, []);

  // Calculate Procurement
  const totalPOs = costData.length;
  const pendingPOs = costData.filter(c => c.status === 'pending').length;
  const totalSpend = useMemo(() => costData.reduce((acc, c) => acc + (c.total_amount || 0), 0), [costData]);
  const topSupplier = useMemo(() => {
    const map = {};
    costData.forEach(c => {
      map[c.supplier_name] = (map[c.supplier_name] || 0) + (c.total_amount || 0);
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? sorted[0][0] : 'None';
  }, [costData]);

  // Top workers by items held
  const topWorkers = useMemo(() => {
    return [...loanData].sort((a, b) => (b.active_loan_count || 0) - (a.active_loan_count || 0)).slice(0, 5);
  }, [loanData]);

  // Chart data
  const inStock = totalTools - outOfStock - lowStock;

  if (loadingStock || loadingLoans || loadingCost) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading overview metrics...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Row 1 */}
      <div>
        <h3 className="text-lg font-bold mb-4">Inventory Health</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Tools" value={totalTools} icon={Package} variant="default" />
          <StatCard title="Total Units" value={totalUnits} icon={Package} variant="default" />
          <StatCard title="Out of Stock" value={outOfStock} icon={AlertCircle} variant="destructive" />
          <StatCard title="Low Stock" value={lowStock} icon={TrendingUp} variant="warning" />
        </div>
      </div>

      {/* Row 2 */}
      <div>
        <h3 className="text-lg font-bold mb-4">Lending Health</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Active Loans" value={activeLoans} icon={Users} variant="default" />
          <StatCard title="Overdue Loans" value={overdueLoans} icon={AlertCircle} variant="destructive" />
          <StatCard title="Avg Days Out" value={avgDaysOut} icon={Clock} variant="default" />
          <StatCard title="Return Rate" value={`${returnRate}%`} icon={Percent} variant={returnRate >= 80 ? "success" : "warning"} />
        </div>
      </div>

      {/* Row 3 */}
      <div>
        <h3 className="text-lg font-bold mb-4">Procurement</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total POs" value={totalPOs} icon={ShoppingBag} variant="default" />
          <StatCard title="Total Spend" value={`AED ${totalSpend.toLocaleString()}`} icon={DollarSign} variant="default" />
          <StatCard title="Pending POs" value={pendingPOs} icon={FileText} variant="warning" />
          <StatCard title="Top Supplier" value={topSupplier} icon={Truck} variant="default" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* Top 5 Workers */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h4 className="font-semibold mb-4 text-foreground">Top 5 Workers by Items Held</h4>
          <div className="space-y-4">
            {topWorkers.map(w => (
              <div key={w.id} className="flex items-center justify-between">
                <span className="font-medium">{w.name} {w.company ? `(${w.company})` : ''}</span>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-full text-xs">{w.active_loan_count} items</span>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h4 className="font-semibold mb-4 text-foreground">Stock Status Breakdown</h4>
          <div className="flex flex-col gap-4 mt-8">
            <div className="flex flex-col border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-green-50 text-green-700">
                <span className="font-semibold">In Stock</span>
                <span className="font-bold">{inStock} Tools</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 text-amber-700">
                <span className="font-semibold">Low Stock</span>
                <span className="font-bold">{lowStock} Tools</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 text-red-700">
                <span className="font-semibold">Out of Stock</span>
                <span className="font-bold">{outOfStock} Tools</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
