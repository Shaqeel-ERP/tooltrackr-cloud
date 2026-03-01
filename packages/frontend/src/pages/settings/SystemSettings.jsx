import ErrorBoundary from "@/components/shared/ErrorBoundary"
import * as React from "react"
import { useAuditLog } from "@/lib/queries"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Box, Users, MapPin, Download, CheckCircle2, AlertTriangle, FileUp, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 0) return "Today"
  return `${days}d ago`
}

function generateCSVDownload(url, filename) {
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
}

function ImportCard({ title, icon: Icon, expectedCols, onUpload }) {
  const [file, setFile] = React.useState(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [result, setResult] = React.useState(null)
  const fileInputRef = React.useRef(null)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
       setFile(e.target.files[0])
       setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setIsUploading(true)
    try {
      // Simulate API call
      await new Promise(r => setTimeout(r, 1500))
      // Mock result
      setResult({
        success: true,
        count: Math.floor(Math.random() * 50) + 10,
        errors: Math.random() > 0.7 ? ["Row 5: Invalid email", "Row 12: Missing required name"] : []
      })
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-2 bg-muted">
         <Icon className="w-5 h-5 text-muted-foreground" />
         <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-4">
        
        <div className="text-xs text-muted-foreground bg-muted border border-border rounded p-3">
           <span className="font-semibold block mb-1 uppercase tracking-wider text-[10px]">Expected CSV Columns:</span>
           <code className="text-[11px] font-mono text-foreground">{expectedCols}</code>
        </div>

        {!result ? (
          <div className="flex-1 flex flex-col">
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileChange} />
            <div 
              className={cn("flex-1 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors", file ? "border-blue-400 bg-blue-50" : "border-border hover:border-slate-300 hover:bg-muted")}
              onClick={() => fileInputRef.current?.click()}
            >
               {file ? (
                 <>
                   <FileUp className="w-8 h-8 text-blue-500 mb-2" />
                   <span className="text-sm font-semibold text-slate-700 max-w-[200px] truncate">{file.name}</span>
                   <span className="text-xs text-muted-foreground mt-1">Ready to import</span>
                 </>
               ) : (
                 <>
                   <Upload className="w-8 h-8 text-slate-300 mb-2" />
                   <span className="text-sm font-medium text-muted-foreground">Drop CSV here or click to browse</span>
                 </>
               )}
            </div>
            
            <Button 
              className="mt-4 w-full" 
              disabled={!file || isUploading} 
              onClick={handleUpload}
            >
               {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
               Import {title.split(' ')[1]}
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200 bg-muted rounded-lg p-4 text-sm border border-border">
             <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                <CheckCircle2 className="w-5 h-5" /> {result.count} records imported successfully
             </div>
             {result.errors && result.errors.length > 0 && (
               <div className="mt-3">
                 <div className="flex items-center gap-1.5 text-amber-700 font-semibold mb-1 text-xs">
                    <AlertTriangle className="w-4 h-4" /> {result.errors.length} rows skipped:
                 </div>
                 <ul className="text-xs text-amber-800 list-disc list-inside bg-amber-50 p-2 rounded border border-amber-100 space-y-0.5">
                   {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                 </ul>
               </div>
             )}
             <Button variant="outline" size="sm" className="mt-4 bg-background" onClick={() => setResult(null)}>Import Another File</Button>
          </div>
        )}
      </div>
    </div>
  )
}

export function SystemSettings() {
  const { data: logs = [], isLoading } = useAuditLog()
  const [filterType, setFilterType] = React.useState("all")
  
  const entityTypes = React.useMemo(() => [...new Set(logs.map(l => l.entity_type))], [logs])

  const filteredLogs = React.useMemo(() => {
     let res = logs
     if (filterType !== "all") res = res.filter(l => l.entity_type === filterType)
     return res
  }, [logs, filterType])

  const auditColumns = [
    { header: "Time", key: "created_at", render: (l) => <span className="text-sm text-muted-foreground whitespace-nowrap" title={new Date(l.created_at).toLocaleString()}>{timeAgo(l.created_at)}</span> },
    { header: "Action", key: "action", render: (l) => {
        let color = "bg-slate-100 text-slate-700"
        if (l.action.includes('CREATE') || l.action.includes('ADD')) color = "bg-green-100 text-green-800"
        if (l.action.includes('UPDATE') || l.action.includes('EDIT')) color = "bg-blue-100 text-blue-800"
        if (l.action.includes('DELETE') || l.action.includes('REMOVE')) color = "bg-red-100 text-red-800"
        return <Badge className={`${color} font-mono text-[10px] py-0 px-1.5 uppercase border-0 hover:${color}`}>{l.action}</Badge>
    }},
    { header: "Entity Type", key: "entity_type", render: (l) => <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">{l.entity_type}</span> },
    { header: "ID", key: "entity_id", render: (l) => <span className="font-mono text-xs text-slate-400">{l.entity_id}</span> },
    { header: "User", key: "user_name", render: (l) => <span className="font-medium text-foreground">{l.user_name}</span> },
    { header: "Details", key: "details", render: (l) => <span className="text-xs text-muted-foreground truncate max-w-[300px] block" title={l.details ? JSON.stringify(l.details) : ''}>{l.details ? JSON.stringify(l.details) : '-'}</span> }
  ]

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-8 h-full min-h-[calc(100vh-6rem)] pb-8">
      <PageHeader title="System Settings" />

      {/* SECTION 1: IMPORT DATA */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="text-xl">📥</span> Import Data
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <ImportCard 
             title="Import Tools" 
             icon={Box} 
             expectedCols="sku, name, category, brand, model, min_stock_level" 
           />
           <ImportCard 
             title="Import Workers" 
             icon={Users} 
             expectedCols="name, email, phone, address, company, worker_type" 
           />
           <ImportCard 
             title="Import Locations" 
             icon={MapPin} 
             expectedCols="name, address, manager, contact_info, location_type" 
           />
        </div>
      </section>

      {/* SECTION 2: EXPORT DATA */}
      <section className="space-y-4 pt-4 border-t border-border">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="text-xl">📤</span> Export Data
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
           <Button variant="outline" className="h-20 flex-col gap-2 bg-background hover:bg-muted border-border shadow-sm" onClick={() => generateCSVDownload('#', 'tools_export.csv')}>
              <span className="text-xl">📦</span> Export Tools
           </Button>
           <Button variant="outline" className="h-20 flex-col gap-2 bg-background hover:bg-muted border-border shadow-sm" onClick={() => generateCSVDownload('#', 'workers_export.csv')}>
              <span className="text-xl">👷</span> Export Workers
           </Button>
           <Button variant="outline" className="h-20 flex-col gap-2 bg-background hover:bg-muted border-border shadow-sm" onClick={() => generateCSVDownload('#', 'stock_export.csv')}>
              <span className="text-xl">📊</span> Export Stock Levels
           </Button>
           <Button variant="outline" className="h-20 flex-col gap-2 bg-background hover:bg-muted border-border shadow-sm" onClick={() => generateCSVDownload('#', 'movements_export.csv')}>
              <span className="text-xl">📋</span> Export Movements
           </Button>
           <Button variant="outline" className="h-20 flex-col gap-2 bg-background hover:bg-muted border-border shadow-sm" onClick={() => generateCSVDownload('#', 'lending_export.csv')}>
              <span className="text-xl">🤝</span> Export Lending History
           </Button>
        </div>
      </section>

      {/* SECTION 3: AUDIT LOG */}
      <section className="space-y-4 pt-4 border-t border-border flex-1 flex flex-col max-h-[600px]">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="text-xl">📜</span> Audit Log
        </h2>
        
        <div className="flex items-center gap-2 mb-2 w-full md:w-64">
           <Select value={filterType} onValueChange={setFilterType}>
             <SelectTrigger><SelectValue placeholder="Filter Entity" /></SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Entities</SelectItem>
               {entityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
             </SelectContent>
           </Select>
        </div>

        <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden flex-1 flex flex-col min-h-[300px]">
           <DataTable 
             columns={auditColumns} 
             data={filteredLogs} 
             isLoading={isLoading} 
             searchKeys={["action", "user_name", "entity_type"]} 
             searchPlaceholder="Search logs..." 
             emptyMessage="No matching logs." 
           />
        </div>
      </section>

    </div>
  
    </ErrorBoundary>
  )
}
