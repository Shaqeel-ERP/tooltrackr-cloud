import { useMemo, useState } from 'react';
import { useStockReport } from '@/lib/queries';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingUp, CheckCircle2, Download } from 'lucide-react';
import { exportCSV } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function StockLevelsTab() {
  const { data: stockData = [], isLoading } = useStockReport();

  const [location, setLocation] = useState('all');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  const locations = useMemo(() => [...new Set(stockData.map(s => s.location_name).filter(Boolean))], [stockData]);
  const categories = useMemo(() => [...new Set(stockData.map(s => s.category).filter(Boolean))], [stockData]);

  const filtered = useMemo(() => {
    return stockData.filter(s => {
      if (location !== 'all' && s.location_name !== location) return false;
      if (category !== 'all' && s.category !== category) return false;

      const avail = s.available || 0;
      const sStat = avail === 0 ? 'out' : (avail <= (s.min_stock_level || 0) && s.min_stock_level > 0 ? 'low' : 'ok');
      if (status !== 'all' && sStat !== status) return false;

      return true;
    });
  }, [stockData, location, category, status]);

  const outOfStock = filtered.filter(s => (s.available || 0) === 0).length;
  const lowStock = filtered.filter(s => (s.available || 0) > 0 && (s.available || 0) <= (s.min_stock_level || 0) && s.min_stock_level > 0).length;
  const okStock = filtered.filter(s => (s.available || 0) > (s.min_stock_level || 0) || ((s.available || 0) > 0 && !(s.min_stock_level > 0))).length;

  const handleExport = () => {
    exportCSV('stock_levels_report', filtered);
  };

  const columns = [
    { header: "SKU", key: "sku", render: (r) => <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded border border-border text-muted-foreground">{r.sku}</span> },
    { header: "Tool Name", key: "name", render: (r) => <span className="font-medium">{r.name}</span> },
    { header: "Category", key: "category", render: (r) => <span className="text-muted-foreground text-sm">{r.category}</span> },
    { header: "Location", key: "location_name", render: (r) => <span className="text-muted-foreground text-sm">{r.location_name}</span> },
    { header: "Total", key: "total", render: (r) => <span className="text-muted-foreground">{r.total}</span> },
    { header: "Reserved", key: "reserved", render: (r) => <span className="text-muted-foreground">{r.reserved}</span> },
    {
      header: "Available", key: "available", render: (r) => {
        const avail = r.available || 0;
        return <span className={cn("font-bold text-base", avail === 0 ? "text-red-600" : (avail <= (r.min_stock_level || 0) && r.min_stock_level > 0 ? "text-amber-600" : "text-green-600"))}>{avail}</span>
      }
    },
    { header: "Min Level", key: "min_stock_level", render: (r) => <span className="text-slate-400">{r.min_stock_level || 0}</span> },
    {
      header: "Status", key: "status", render: (r) => {
        const avail = r.available || 0;
        const s = avail === 0 ? 'out' : (avail <= (r.min_stock_level || 0) && r.min_stock_level > 0 ? 'low' : 'ok');
        return <StatusBadge type="stock" status={s} />
      }
    },
    { header: "Last Movement", key: "last_movement", render: (r) => <span className="text-xs text-muted-foreground">{r.last_movement ? new Date(r.last_movement).toLocaleDateString() : '-'}</span> }
  ];

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Location" /></SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ok">In Stock (OK)</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2 bg-background">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm font-medium">
          <AlertCircle className="w-4 h-4" /> {outOfStock} out of stock
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 text-sm font-medium">
          <TrendingUp className="w-4 h-4" /> {lowStock} low stock
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" /> {okStock} ok
        </div>
      </div>

      <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
        <DataTable columns={columns} data={filtered} isLoading={isLoading} searchKeys={["sku", "name", "category"]} emptyMessage="No stock data found." />
      </div>
    </div>
  );
}
