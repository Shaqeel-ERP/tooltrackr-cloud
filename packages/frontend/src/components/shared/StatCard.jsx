import * as React from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

const BORDER_COLORS = {
  default: "border-l-slate-400",
  success: "border-l-green-500",
  warning: "border-l-amber-500",
  danger: "border-l-red-500",
}

const ICON_BG_COLORS = {
  default: "bg-slate-100 text-slate-600",
  success: "bg-green-100 text-green-600",
  warning: "bg-amber-100 text-amber-600",
  danger: "bg-red-100 text-red-600",
}

export function StatCard({ title, value, subtitle, icon: Icon, variant = "default", onClick, trend }) {
  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col bg-white rounded-xl shadow-sm p-6 border border-slate-200 border-l-[4px] ${BORDER_COLORS[variant]} ${
        onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-slate-600">{title}</h3>
        {Icon && (
          <div className={`p-2 rounded-full ${ICON_BG_COLORS[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        {trend && (
          <span
            className={`flex items-center text-xs font-semibold ${
              trend > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-slate-400 mt-2">{subtitle}</p>}
    </div>
  )
}
