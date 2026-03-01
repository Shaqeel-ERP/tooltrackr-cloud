import { useState, useMemo } from 'react';
import { useMovementsReport } from '@/lib/queries';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportCSV, cn } from '@/lib/utils';

export function MovementsTab() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: movements = [], isLoading } = useMovementsReport({
    startDate: new Date(dateFrom).getTime(),
    endDate: new Date(dateTo).getTime() + 86400000
  });

  const [type, setType] = useState('all');
  const [location, setLocation] = useState('all');

  const types = useMemo(() => [...new Set(movements.map(m => m.movement_type).filter(Boolean))], [movements]);
  const locations = useMemo(() => [...new Set(movements.map(m => m.location_name).filter(Boolean))], [movements]);

  const filtered = useMemo(() => {
    return movements.filter(m => {
      if (type !== 'all' && m.movement_type !== type) return false;
      if (location !== 'all' && m.location_name !== location) return false;
      return true;
    });
  }, [movements, type, location]);

  const handleExport = () => {
    exportCSV('movements_report', filtered);
  };

  // Summaries
  let stockIn = 0;
  let stockOut = 0;
  const toolsMap = {};
  filtered.forEach(m => {
    const q = m.quantity_change || 0;
    if (q > 0) stockIn += q;
    else stockOut += Math.abs(q);

    if (!toolsMap[m.tool_name]) toolsMap[m.tool_name] = 0;
    toolsMap[m.tool_name]++;
  });

  const netChange = stockIn - stockOut;
  const mostMovedTool = Object.entries(toolsMap).sort((a, b) => b[1] - a[1])[0];

  const columns = [
    { header: "Date/Time", key: "created_at", render: (m) => <span className="text-sm whitespace-nowrap text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span> },
    { header: "Type", key: "movement_type", render: (m) => <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-muted">{String(m.movement_type).replace('_', ' ')}</Badge> },
    {
      header: "Tool", key: "tool_name", render: (m) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{m.tool_name}</span>
          <span className="font-mono text-[10px] text-slate-400">{m.sku}</span>
        </div>
      )
    },
    { header: "Location", key: "location_name", render: (m) => <span className="text-sm text-muted-foreground">{m.location_name}</span> },
    { header: "Actor", key: "created_by", render: (m) => <span className="text-sm font-medium text-foreground">{m.created_by}</span> },
    {
      header: "Qty Change", key: "quantity_change", render: (m) => {
        const isPositive = m.quantity_change > 0;
        return <span className={cn("font-bold text-lg", isPositive ? "text-green-600" : "text-red-600")}>{isPositive ? '+' : ''}{m.quantity_change}</span>;
      }
    },
    {
      header: "Notes", key: "notes", sortable: false, render: (m) => (
        <span className="text-xs text-muted-foreground max-w-[200px] truncate block" title={m.notes}>{m.notes || '-'}</span>
      )
    },
    { header: "Ref ID", key: "reference_id", render: (m) => <span className="text-xs text-slate-400 font-mono">{m.reference_id || '-'}</span> }
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-muted rounded-xl border border-border">
        <div className="flex flex-col"><span className="text-xs font-medium text-muted-foreground uppercase">Total Movements</span><span className="text-2xl font-bold">{filtered.length}</span></div>
        <div className="flex flex-col"><span className="text-xs font-medium text-muted-foreground uppercase">Stock In</span><span className="text-2xl font-bold text-green-600">+{stockIn} units</span></div>
        <div className="flex flex-col"><span className="text-xs font-medium text-muted-foreground uppercase">Stock Out</span><span className="text-2xl font-bold text-red-600">-{stockOut} units</span></div>
        <div className="flex flex-col"><span className="text-xs font-medium text-muted-foreground uppercase">Net Change</span><span className={cn("text-2xl font-bold", netChange >= 0 ? "text-green-600" : "text-red-600")}>{netChange >= 0 ? '+' : ''}{netChange} units</span></div>
        <div className="flex flex-col col-span-2 lg:col-span-1 justify-center"><span className="text-xs font-medium text-muted-foreground uppercase leading-tight">Most Moved Tool</span><span className="text-sm font-bold truncate" title={mostMovedTool ? mostMovedTool[0] : '-'}>{mostMovedTool ? mostMovedTool[0] : '-'}</span></div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[140px]" />
            <span className="text-muted-foreground">→</span>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[140px]" />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="all">All Types</SelectItem>
              {types.map(t => <SelectItem key={t} value={t}>{String(t).replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Location" /></SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2 bg-background">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
        <DataTable columns={columns} data={filtered} isLoading={isLoading} searchKeys={["tool_name", "sku", "created_by"]} emptyMessage="No movements found." />
      </div>
    </div>
  );
}
