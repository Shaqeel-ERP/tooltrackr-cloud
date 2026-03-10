import { useMemo, useState } from 'react';
import { useLoanHistoryReport } from '@/lib/queries';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { exportCSV, exportPDF, cn } from '@/lib/utils';

export function LoanHistoryTab() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 90); return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  // Pass filter params to hook
  const { data: history = [], isLoading } = useLoanHistoryReport({
    startDate: new Date(dateFrom).getTime(),
    endDate: new Date(dateTo).getTime() + 86400000 // include EOD
  });

  const [statusFilter, setStatusFilter] = useState('all');
  const [workerFilter, setWorkerFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const workers = useMemo(() => [...new Set(history.map(h => h.worker_name).filter(Boolean))], [history]);
  const locations = useMemo(() => [...new Set(history.map(h => h.location_name).filter(Boolean))], [history]);

  const filtered = useMemo(() => {
    return history.filter(h => {
      // Analyze current status logically for filters
      const isReturned = !!h.returned_at;
      const isLate = isReturned && h.due_date && new Date(h.returned_at) > new Date(h.due_date);
      const isOverdue = !isReturned && h.due_date && new Date() > new Date(h.due_date);

      let derivedStatus = 'active';
      if (isReturned && !isLate) derivedStatus = 'returned_on_time';
      if (isReturned && isLate) derivedStatus = 'returned_late';
      if (isOverdue) derivedStatus = 'overdue';

      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && derivedStatus !== 'active') return false;
        if (statusFilter === 'returned' && !isReturned) return false;
        if (statusFilter === 'overdue' && derivedStatus !== 'overdue') return false;
      }

      if (workerFilter !== 'all' && h.worker_name !== workerFilter) return false;
      if (locationFilter !== 'all' && h.location_name !== locationFilter) return false;

      return true;
    });
  }, [history, statusFilter, workerFilter, locationFilter]);

  // Summaries
  const currentlyActive = filtered.filter(h => !h.returned_at).length;
  const returnedOnTime = filtered.filter(h => h.returned_at && (!h.due_date || new Date(h.returned_at) <= new Date(h.due_date))).length;
  const returnedLate = filtered.filter(h => h.returned_at && h.due_date && new Date(h.returned_at) > new Date(h.due_date)).length;
  const stillOverdue = filtered.filter(h => !h.returned_at && h.due_date && new Date() > new Date(h.due_date)).length;
  const totalDays = filtered.reduce((acc, h) => acc + (h.days_out || 0), 0);
  const avgDuration = filtered.length > 0 ? (totalDays / filtered.length).toFixed(1) : 0;

  const handleExportCSV = () => exportCSV('loan_history_report', filtered.map(h => {
    const isReturned = !!h.returned_at;
    const isLate = isReturned && h.due_date && new Date(h.returned_at) > new Date(h.due_date);
    const isOverdue = !isReturned && h.due_date && new Date() > new Date(h.due_date);
    let statusLabel = 'Active';
    if (isReturned) {
      statusLabel = isLate ? 'Returned Late' : 'Returned';
    } else if (isOverdue) {
      statusLabel = 'Overdue';
    }
  
    return {
      ToolName: h.tool_name,
      SKU: h.sku,
      WorkerName: h.worker_name,
      Location: h.location_name,
      IssuedDate: new Date(h.issued_date).toLocaleDateString(),
      ReturnDate: h.returned_at ? new Date(h.returned_at).toLocaleDateString() : '-',
      DaysOut: h.days_out,
      Condition: h.return_condition || '-',
      Status: statusLabel,
      IssuedBy: h.issued_by
    };
  }));

  const handleExportPDF = () => {
    const data = filtered.map(h => {
      const isReturned = !!h.returned_at;
      const isLate = isReturned && h.due_date && new Date(h.returned_at) > new Date(h.due_date);
      const isOverdue = !isReturned && h.due_date && new Date() > new Date(h.due_date);
      let statusLabel = 'Active';
      if (isReturned) {
        statusLabel = isLate ? 'Returned Late' : 'Returned';
      } else if (isOverdue) {
        statusLabel = 'Overdue';
      }
      return {
        ToolName: h.tool_name,
        SKU: h.sku,
        WorkerName: h.worker_name,
        Location: h.location_name,
        IssuedDate: new Date(h.issued_date).toLocaleDateString(),
        ReturnDate: h.returned_at ? new Date(h.returned_at).toLocaleDateString() : '-',
        DaysOut: h.days_out,
        Condition: h.return_condition || '-',
        Status: statusLabel,
        IssuedBy: h.issued_by
      }
    });
    exportPDF('loan_history_report', 'Loan History Report', Object.keys(data[0] || {}), data);
  };

  const columns = [
    {
      header: "Tool Name", key: "tool_name", render: (h) => (
        <div className="flex flex-col">
          <span className="font-medium">{h.tool_name}</span>
          <span className="text-[10px] font-mono text-muted-foreground">{h.sku}</span>
        </div>
      )
    },
    { header: "Worker Name", key: "worker_name", render: (h) => <span className="font-medium text-muted-foreground">{h.worker_name}</span> },
    { header: "Location", key: "location_name", render: (h) => <span className="text-sm text-foreground">{h.location_name}</span> },
    { header: "Issued Date", key: "issued_date", render: (h) => <span className="text-sm">{new Date(h.issued_date).toLocaleDateString()}</span> },
    {
      header: "Return Date", key: "returned_at", render: (h) => (
        <span className="text-sm">
          {h.returned_at ? new Date(h.returned_at).toLocaleDateString() : <span className="text-slate-400 italic">Not returned</span>}
        </span>
      )
    },
    { header: "Days Out", key: "days_out", render: (h) => <span className="font-bold">{h.days_out}</span> },
    {
      header: "Condition", key: "return_condition", render: (h) => {
        if (!h.return_condition) return "-";
        const c = h.return_condition.toLowerCase();
        return <Badge variant="outline" className={cn(
          "uppercase text-[10px] tracking-wider",
          c === 'good' ? "bg-green-50 text-green-700 border-green-200" :
            c === 'lost' ? "bg-red-50 text-red-700 border-red-200" :
              "bg-amber-50 text-amber-700 border-amber-200"
        )}>{h.return_condition}</Badge>;
      }
    },
    {
      header: "Status", key: "status", render: (h) => {
        const isReturned = !!h.returned_at;
        const isLate = isReturned && h.due_date && new Date(h.returned_at) > new Date(h.due_date);
        const isOverdue = !isReturned && h.due_date && new Date() > new Date(h.due_date);

        if (isReturned) {
          return isLate
            ? <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Returned Late</Badge>
            : <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Returned</Badge>;
        }
        if (isOverdue) return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Active</Badge>;
      }
    },
    { header: "Issued By", key: "issued_by", render: (h) => <span className="text-xs text-muted-foreground">{h.issued_by}</span> }
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-muted rounded-xl border border-border text-center justify-between">
        <div className="flex flex-col"><span className="text-xs font-medium text-muted-foreground uppercase">Total Loans</span><span className="text-xl font-bold">{filtered.length}</span></div>
        <div className="flex flex-col"><span className="text-xs font-medium text-muted-foreground uppercase">Active</span><span className="text-xl font-bold text-blue-600">{currentlyActive}</span></div>
        <div className="flex flex-col"><span className="text-xs font-medium text-muted-foreground uppercase">On Time</span><span className="text-xl font-bold text-green-600">{returnedOnTime}</span></div>
        <div className="flex flex-col"><span className="text-xs font-medium text-muted-foreground uppercase">Late</span><span className="text-xl font-bold text-orange-600">{returnedLate}</span></div>
        <div className="flex flex-col"><span className="text-xs font-medium text-muted-foreground uppercase">Overdue</span><span className="text-xl font-bold text-red-600">{stillOverdue}</span></div>
        <div className="flex flex-col"><span className="text-xs font-medium text-muted-foreground uppercase">Avg Duration</span><span className="text-xl font-bold">{avgDuration} d</span></div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[140px]" title="Issued From" />
            <span className="text-muted-foreground">→</span>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[140px]" title="Issued To" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={workerFilter} onValueChange={setWorkerFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Worker" /></SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="all">All Workers</SelectItem>
              {workers.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Location" /></SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
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
        <DataTable columns={columns} data={filtered} isLoading={isLoading} searchKeys={["tool_name", "sku", "worker_name"]} emptyMessage="No loan history found in this period." />
      </div>
    </div>
  );
}
