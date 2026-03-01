import { useMemo } from 'react';
import { useCostAnalysisReport } from '@/lib/queries';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Download, ShoppingBag, Truck, FileText, Calculator } from 'lucide-react';
import { exportCSV } from '@/lib/utils';

export function ProcurementTab() {
  const { data: purchases = [], isLoading } = useCostAnalysisReport();

  // Calc summaries
  const totalSpend = useMemo(() => purchases.reduce((acc, p) => acc + Number(p.total_amount || 0), 0), [purchases]);
  const totalTax = useMemo(() => purchases.reduce((acc, p) => acc + Number(p.tax_amount || 0), 0), [purchases]);
  const totalItems = useMemo(() => purchases.reduce((acc, p) => acc + (p.items?.length || 0), 0), [purchases]);

  // Group by supplier
  const supplierStats = useMemo(() => {
    const map = {};
    purchases.forEach(p => {
      const name = p.supplier_name || 'Unknown Supplier';
      if (!map[name]) map[name] = { name, count: 0, spend: 0, lastDate: 0 };
      map[name].count++;
      map[name].spend += Number(p.total_amount || 0);
      const d = new Date(p.invoice_date).getTime();
      if (d > map[name].lastDate) map[name].lastDate = d;
    });
    return Object.values(map).sort((a, b) => b.spend - a.spend);
  }, [purchases]);

  // Group by category (requires items analysis)
  const categoryStats = useMemo(() => {
    const map = {};
    purchases.forEach(p => {
      (p.items || []).forEach(item => {
        const cat = item.category || "General Tools";
        if (!map[cat]) map[cat] = { cat, items: 0, cost: 0 };
        map[cat].items += item.quantity_received || item.quantity || 1;
        map[cat].cost += (item.quantity_received || item.quantity || 1) * Number(item.unit_price || 0);
      });
    });
    return Object.values(map).sort((a, b) => b.cost - a.cost);
  }, [purchases]);

  const handleExportSuppliers = () => {
    exportCSV("spend_by_supplier", supplierStats.map(s => ({
      Supplier: s.name,
      OrdersCount: s.count,
      TotalSpend_AED: s.spend.toFixed(2),
      AvgOrderValue_AED: (s.spend / s.count).toFixed(2),
      LastOrderDate: new Date(s.lastDate).toLocaleDateString()
    })));
  };

  const handleExportCategories = () => {
    exportCSV("spend_by_category", categoryStats.map(c => ({
      Category: c.cat,
      ItemsCount: c.items,
      TotalSpend_AED: c.cost.toFixed(2),
    })));
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading procurement analysis...</div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Spend" value={`AED ${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={Calculator} variant="default" />
        <StatCard title="Total Tax Paid" value={`AED ${totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={FileText} variant="default" />
        <StatCard title="Total POs" value={purchases.length} icon={ShoppingBag} variant="default" />
        <StatCard title="Items Received" value={totalItems} icon={Truck} variant="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Table */}
        <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted">
            <h3 className="font-semibold text-foreground">Spend by Supplier</h3>
            <Button variant="ghost" size="sm" onClick={handleExportSuppliers} className="h-8 gap-2 text-muted-foreground hover:text-blue-600">
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3 text-center">Orders</th>
                  <th className="px-4 py-3 text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {supplierStats.map(s => (
                  <tr key={s.name} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{s.count}</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">AED {s.spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {supplierStats.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-muted-foreground bg-background">No purchase data.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Table */}
        <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-muted flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Spend by Category</h3>
            <Button variant="ghost" size="sm" onClick={handleExportCategories} className="h-8 gap-2 text-muted-foreground hover:text-blue-600">
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Items</th>
                  <th className="px-4 py-3 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categoryStats.map(c => (
                  <tr key={c.cat} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{c.cat}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{c.items}</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">AED {c.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {categoryStats.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-muted-foreground bg-background">No purchase data.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
