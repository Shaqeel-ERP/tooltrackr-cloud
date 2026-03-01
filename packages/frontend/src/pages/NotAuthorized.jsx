import ErrorBoundary from "@/components/shared/ErrorBoundary"
import * as React from "react"
import { Link } from "react-router-dom"
import { Lock, ArrowLeft } from "lucide-react"

export function NotAuthorized() {
  return (
    <ErrorBoundary>
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-background p-8 rounded-2xl shadow-sm border border-border text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
           <Lock className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Access Restricted</h2>
        <p className="text-muted-foreground mb-8">You don't have permission to view this page. If you believe this is an error, please contact your administrator.</p>
        
        <Link to="/" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Go to Dashboard
        </Link>
      </div>
      </div>
    </ErrorBoundary>
  )
}
