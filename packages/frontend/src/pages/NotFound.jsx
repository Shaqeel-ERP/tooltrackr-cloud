import ErrorBoundary from "@/components/shared/ErrorBoundary"
import * as React from "react"
import { Link } from "react-router-dom"
import { Search, ArrowLeft } from "lucide-react"

export function NotFoundPage() {
  return (
    <ErrorBoundary>
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-background p-8 rounded-2xl shadow-sm border border-border text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
           <Search className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">We couldn't find the page you're looking for. It might have been moved or doesn't exist.</p>
        
        <Link to="/" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Go Home
        </Link>
      </div>
      </div>
    </ErrorBoundary>
  )
}
