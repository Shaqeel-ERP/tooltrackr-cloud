import { useMemo } from 'react';
import { useCostAnalysisReport } from '@/lib/queries';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Download, ShoppingBag, Truck, FileText, Calculator, FileSpreadsheet } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { exportCSV, exportPDF, cn } from '@/lib/utils';

export function ProcurementTab() {
  const { data = {}, isLoading } = useCostAnalysisReport();

  const overview = data.overview || { total_spend: 0, total_tax: 0, total_pos: 0, items_received: 0 };
  const supplierStats = data.bySupplier || [];
  const categoryStats = data.byCategory || [];

  const handleExportSuppliersCSV = () => {
    exportCSV("spend_by_supplier", supplierStats.map(s => ({
      Supplier: s.supplier_name,
      OrdersCount: s.order_count,
      TotalSpend_AED: s.total_spent.toFixed(2),
      AvgOrderValue_AED: (s.total_spent / s.order_count).toFixed(2)
    })));
  };

  const handleExportSuppliersPDF = () => {
    const data = supplierStats.map(s => ({
      Supplier: s.supplier_name,
      OrdersCount: s.order_count,
      TotalSpend_AED: s.total_spent.toFixed(2),
      AvgOrderValue_AED: (s.total_spent / s.order_count).toFixed(2)
    }));
    exportPDF('spend_by_supplier', 'Spend by Supplier', Object.keys(data[0] || {}), data);
  };

  const handleExportCategoriesCSV = () => {
    exportCSV("spend_by_category", categoryStats.map(c => ({
      Category: c.category,
      ItemsCount: c.item_count,
      TotalSpend_AED: c.total_cost.toFixed(2),
    })));
  };

  const handleExportCategoriesPDF = () => {
    const data = categoryStats.map(c => ({
      Category: c.category,
      ItemsCount: c.item_count,
      TotalSpend_AED: c.total_cost.toFixed(2),
    }));
    exportPDF('spend_by_category', 'Spend by Category', Object.keys(data[0] || {}), data);
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading procurement analysis...</div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Spend" value={`AED ${overview.total_spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={Calculator} variant="default" />
        <StatCard title="Total Tax Paid" value={`AED ${overview.total_tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={FileText} variant="default" />
        <StatCard title="Total POs" value={overview.total_pos} icon={ShoppingBag} variant="default" />
        <StatCard title="Items Received" value={overview.items_received} icon={Truck} variant="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Table */}
        <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted">
            <h3 className="font-semibold text-foreground">Spend by Supplier</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground hover:text-blue-600">
                  <Download className="w-3.5 h-3.5" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportSuppliersCSV} className="gap-2"><FileSpreadsheet className="w-4 h-4 text-green-600" /> Export CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportSuppliersPDF} className="gap-2"><FileText className="w-4 h-4 text-red-600" /> Export PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                  <tr key={s.supplier_name} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{s.supplier_name}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{s.order_count}</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">AED {s.total_spent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground hover:text-blue-600">
                  <Download className="w-3.5 h-3.5" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCategoriesCSV} className="gap-2"><FileSpreadsheet className="w-4 h-4 text-green-600" /> Export CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCategoriesPDF} className="gap-2"><FileText className="w-4 h-4 text-red-600" /> Export PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                  <tr key={c.category} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{c.category || "General Tools"}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{c.item_count}</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">AED {c.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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
