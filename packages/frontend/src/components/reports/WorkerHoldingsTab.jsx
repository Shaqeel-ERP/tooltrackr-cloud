import { useState, useMemo } from 'react';
import { useWorkerHoldings } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronRight, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { ReturnToolModal } from '@/components/lending/ReturnToolModal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { exportCSV, exportPDF, cn } from '@/lib/utils';

export function WorkerHoldingsTab() {
  const { data: res, isLoading } = useWorkerHoldings();
  const holdings = useMemo(() => res?.workers || [], [res]);

  const [expanded, setExpanded] = useState(new Set());
  const [returnLoan, setReturnLoan] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [company, setCompany] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const companies = useMemo(() => [...new Set(holdings.map(w => w.company).filter(c => c && c.trim() !== ''))], [holdings]);

  const filtered = useMemo(() => {
    return holdings.filter(w => {
      // Search by name
      if (search && !(w.name || '').toLowerCase().includes(search.toLowerCase())) return false;
      // Filter by company
      if (company !== 'all' && w.company !== company) return false;
      // Filter by status (has overdue / no items)
      if (statusFilter === 'overdue' && (w.overdue_count || 0) === 0) return false;
      if (statusFilter === 'no_items' && (w.active_loan_count || 0) > 0) return false;
      if (statusFilter === 'has_items' && (w.active_loan_count || 0) === 0) return false;

      return true;
    });
  }, [holdings, search, company, statusFilter]);

  const handleExportCSV = () => {
    exportCSV('worker_holdings_report', filtered.map(w => ({
      WorkerName: w.name,
      Phone: w.phone || '',
      Company: w.company || '',
      ActiveItems: w.active_loan_count || 0,
      OverdueCount: w.overdue_count || 0,
      ReliabilityScore: w.total_loans && w.total_loans > 0 ? Math.round((w.on_time_returns / w.total_loans) * 100) : 'N/A'
    })));
  };

  const handleExportPDF = () => {
    const data = filtered.map(w => ({
      WorkerName: w.name,
      Phone: w.phone || '',
      Company: w.company || '',
      ActiveItems: w.active_loan_count || 0,
      OverdueCount: w.overdue_count || 0,
      ReliabilityScore: w.total_loans && w.total_loans > 0 ? Math.round((w.on_time_returns / w.total_loans) * 100) : 'N/A'
    }));
    exportPDF('worker_holdings_report', 'Worker Holdings Report', Object.keys(data[0] || {}), data);
  };

  // SummaryStats
  const totalWorkersActive = holdings.filter(w => (w.active_loan_count || 0) > 0).length;
  const totalItemsOnLoan = holdings.reduce((acc, w) => acc + (w.active_loan_count || 0), 0);
  const totalOverdue = holdings.reduce((acc, w) => acc + (w.overdue_count || 0), 0);
  const avgItems = totalWorkersActive > 0 ? (totalItemsOnLoan / totalWorkersActive).toFixed(1) : 0;

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading holdings...</div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-xl border border-border">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">Workers w/ Active Loans</span>
          <span className="text-2xl font-bold text-foreground">{totalWorkersActive}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">Total Items on Loan</span>
          <span className="text-2xl font-bold text-foreground">{totalItemsOnLoan}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">Total Overdue Items</span>
          <span className="text-2xl font-bold text-red-600">{totalOverdue}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">Avg Items / Worker</span>
          <span className="text-2xl font-bold text-foreground">{avgItems}</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <Input
            type="search"
            placeholder="Search workers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[200px]"
          />
          <Select value={company} onValueChange={setCompany}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Company" /></SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter By" /></SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="all">All Workers</SelectItem>
              <SelectItem value="has_items">Has Active Items</SelectItem>
              <SelectItem value="no_items">No Items Currently</SelectItem>
              <SelectItem value="overdue">Has Overdue Items</SelectItem>
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

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center p-12 bg-background rounded-xl border border-border text-muted-foreground">No workers found matching filters.</div>
        ) : (
          filtered.map(worker => {
            const isExp = expanded.has(worker.id);
            const totalReturns = worker.total_loans || 0;
            const onTime = worker.on_time_returns || 0;
            const relScore = totalReturns > 0 ? Math.round((onTime / totalReturns) * 100) : null;
            const displayRel = relScore !== null ? `${relScore}%` : 'No returns yet';

            return (
              <div key={worker.id} className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
                <div
                  className={cn("p-4 flex items-center justify-between cursor-pointer hover:bg-muted transition-colors", isExp ? "bg-muted border-b border-border" : "")}
                  onClick={() => {
                    const next = new Set(expanded);
                    if (next.has(worker.id)) next.delete(worker.id);
                    else next.add(worker.id);
                    setExpanded(next);
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground text-lg">{worker.name}</span>
                      <span className="text-sm text-muted-foreground">{worker.phone ? worker.phone : 'No phone'} {worker.company ? `· ${worker.company}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 font-bold px-2 py-1">{(worker.active_loan_count || 0)} Items</Badge>
                      {(worker.overdue_count || 0) > 0 && (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 font-bold px-2 py-1">{(worker.overdue_count)} Overdue</Badge>
                      )}
                      <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 uppercase text-[10px] font-bold">Rel: {displayRel}</Badge>
                    </div>
                  </div>
                  <div className="text-slate-400">
                    {isExp ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                </div>

                {isExp && (
                  <div className="p-0 bg-card overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-2">Item</th>
                          <th className="px-6 py-2">Date Out</th>
                          <th className="px-6 py-2">Due Date</th>
                          <th className="px-6 py-2">Status</th>
                          <th className="px-6 py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(worker.loans || []).map(loan => {
                          const overdue = loan.expected_return_date && new Date(loan.expected_return_date).getTime() < Date.now();
                          const daysOut = Math.floor((Date.now() - new Date(loan.date_out).getTime()) / 86400000);

                          return (
                            <tr key={loan.id} className="hover:bg-muted/50 transition-colors">
                              <td className="px-6 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] bg-background border border-border px-1 py-0.5 rounded text-muted-foreground">{loan.sku}</span>
                                  <span className="font-medium text-foreground">{loan.tool_name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-3 text-muted-foreground">{new Date(loan.date_out).toLocaleDateString()}</td>
                              <td className="px-6 py-3">
                                {loan.expected_return_date ? new Date(loan.expected_return_date).toLocaleDateString() : 'No Due Date'}
                              </td>
                              <td className="px-6 py-3">
                                {overdue ? (
                                  <span className="uppercase text-[10px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded">Overdue ({daysOut}d)</span>
                                ) : (
                                  <span className="uppercase text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded">Active ({daysOut}d)</span>
                                )}
                              </td>
                              <td className="px-6 py-3 text-right">
                                <Button size="sm" variant="outline" onClick={() => setReturnLoan(loan)}>Return</Button>
                              </td>
                            </tr>
                          )
                        })}
                        {(worker.loans || []).length === 0 && (
                          <tr><td colSpan="5" className="p-4 text-center text-muted-foreground bg-background">No active items for this worker.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
      <ReturnToolModal isOpen={!!returnLoan} onClose={() => setReturnLoan(null)} loan={returnLoan} />
    </div>
  );
}
