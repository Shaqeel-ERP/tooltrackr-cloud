import { useState, useMemo } from 'react';
import { useTransfersReport } from '@/lib/queries';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, ArrowRight, FileSpreadsheet, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { exportCSV, exportPDF, cn } from '@/lib/utils';

export function TransfersTab() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 90); return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: transfers = [], isLoading } = useTransfersReport({
    startDate: new Date(dateFrom).getTime(),
    endDate: new Date(dateTo).getTime() + 86400000
  });

  const [statusFilter, setStatusFilter] = useState('all');
  const [fromLocation, setFromLocation] = useState('all');
  const [toLocation, setToLocation] = useState('all');

  const fromLocations = useMemo(() => [...new Set(transfers.map(t => t.from_location).filter(Boolean))], [transfers]);
  const toLocations = useMemo(() => [...new Set(transfers.map(t => t.to_location).filter(Boolean))], [transfers]);

  const filtered = useMemo(() => {
    return transfers.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (fromLocation !== 'all' && t.from_location !== fromLocation) return false;
      if (toLocation !== 'all' && t.to_location !== toLocation) return false;
      return true;
    });
  }, [transfers, statusFilter, fromLocation, toLocation]);

  const handleExportCSV = () => exportCSV('transfers_report', filtered.map(t => ({
    ToolName: t.tool_name,
    SKU: t.sku,
    Quantity: t.quantity,
    From: t.from_location,
    To: t.to_location,
    Status: String(t.status).toUpperCase(),
    RequestedBy: t.requested_by,
    RequestedDate: new Date(t.requested_date).toLocaleDateString(),
    CompletedDate: t.completed_at ? new Date(t.completed_at).toLocaleDateString() : '-'
  })));

  const handleExportPDF = () => {
    const data = filtered.map(t => ({
      ToolName: t.tool_name,
      SKU: t.sku,
      Quantity: t.quantity,
      From: t.from_location,
      To: t.to_location,
      Status: String(t.status).toUpperCase(),
      RequestedBy: t.requested_by,
      RequestedDate: new Date(t.requested_date).toLocaleDateString(),
      CompletedDate: t.completed_at ? new Date(t.completed_at).toLocaleDateString() : '-'
    }));
    exportPDF('transfers_report', 'Transfers Report', Object.keys(data[0] || {}), data);
  };

  // Summaries
  const pending = filtered.filter(t => t.status === 'draft' || t.status === 'approved').length;
  const completed = filtered.filter(t => t.status === 'completed').length;
  const cancelled = filtered.filter(t => t.status === 'cancelled').length;

  const routesMap = {};
  const toolMap = {};
  filtered.forEach(t => {
    const route = `${t.from_location} → ${t.to_location}`;
    routesMap[route] = (routesMap[route] || 0) + 1;
    toolMap[t.tool_name] = (toolMap[t.tool_name] || 0) + 1;
  });
  const topRoute = Object.entries(routesMap).sort((a, b) => b[1] - a[1])[0];
  const topTool = Object.entries(toolMap).sort((a, b) => b[1] - a[1])[0];

  const columns = [
    {
      header: "Tool", key: "tool_name", render: (t) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{t.tool_name}</span>
          <span className="text-[10px] font-mono text-muted-foreground">{t.sku}</span>
        </div>
      )
    },
    { header: "Qty", key: "quantity", render: (t) => <span className="font-bold">{t.quantity}</span> },
    { header: "From", key: "from_location", render: (t) => <span className="text-sm font-medium text-amber-700">{t.from_location}</span> },
    { header: "To", key: "to_location", render: (t) => <span className="text-sm font-medium text-indigo-700">{t.to_location}</span> },
    { header: "Status", key: "status", render: (t) => <StatusBadge type="transfer" status={t.status} /> },
    { header: "Requested By", key: "requested_by", render: (t) => <span className="text-xs text-muted-foreground">{t.requested_by}</span> },
    { header: "Requested Date", key: "requested_date", render: (t) => <span className="text-sm">{new Date(t.requested_date).toLocaleDateString()}</span> },
    {
      header: "Completed Date", key: "completed_at", render: (t) => (
        <span className="text-sm">{t.completed_at ? new Date(t.completed_at).toLocaleDateString() : '-'}</span>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 p-4 bg-muted rounded-xl border border-border">
        <div className="flex flex-col"><span className="text-xs font-medium text-muted-foreground uppercase">Total Transfers</span><span className="text-2xl font-bold">{filtered.length}</span></div>
        <div className="flex flex-col"><span className="text-xs font-medium text-muted-foreground uppercase">Pending</span><span className="text-2xl font-bold text-amber-600">{pending}</span></div>
        <div className="flex flex-col"><span className="text-xs font-medium text-muted-foreground uppercase">Completed</span><span className="text-2xl font-bold text-green-600">{completed}</span></div>
        <div className="flex flex-col"><span className="text-xs font-medium text-muted-foreground uppercase">Cancelled</span><span className="text-2xl font-bold text-red-600">{cancelled}</span></div>
        <div className="flex flex-col truncate" title={topTool ? topTool[0] : '-'}><span className="text-xs font-medium text-muted-foreground uppercase">Top Tool Moved</span><span className="text-sm font-bold truncate mt-1">{topTool ? topTool[0] : '-'}</span></div>
        <div className="flex flex-col truncate" title={topRoute ? topRoute[0] : '-'}><span className="text-xs font-medium text-muted-foreground uppercase">Top Route</span><span className="text-sm font-bold truncate mt-1">{topRoute ? topRoute[0] : '-'}</span></div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[140px]" />
            <span className="text-muted-foreground">→</span>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[140px]" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft / Pend</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 bg-background border border-border rounded-lg pl-3 pr-1 py-1">
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Route:</span>
            <Select value={fromLocation} onValueChange={setFromLocation}>
              <SelectTrigger className="w-[130px] border-none shadow-none h-8"><SelectValue placeholder="From Loc" /></SelectTrigger>
              <SelectContent className="z-50 border-border">
                <SelectItem value="all">Any Origin</SelectItem>
                {fromLocations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <Select value={toLocation} onValueChange={setToLocation}>
              <SelectTrigger className="w-[130px] border-none shadow-none h-8"><SelectValue placeholder="To Loc" /></SelectTrigger>
              <SelectContent className="z-50 border-border">
                <SelectItem value="all">Any Dest</SelectItem>
                {toLocations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-background">
              <Download className="w-4 h-4" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCSV} className="gap-2">
              <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF} className="gap-2">
              <FileText className="w-4 h-4 text-red-600" /> Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
        <DataTable columns={columns} data={filtered} isLoading={isLoading} searchKeys={["tool_name", "sku", "requested_by"]} emptyMessage="No transfers found." />
      </div>
    </div>
  );
}
