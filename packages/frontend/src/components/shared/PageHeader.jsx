import * as React from "react"
import { ChevronLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function PageHeader({ title, subtitle, actions, backTo }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col xs:flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-4">
      <div>
        {backTo && (
          <Button
            variant="ghost"
            className="mb-2 -ml-3 text-slate-500 hover:text-slate-900"
            onClick={() => navigate(backTo)}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
