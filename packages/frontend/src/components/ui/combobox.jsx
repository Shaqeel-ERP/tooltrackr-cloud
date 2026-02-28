import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"

export function Combobox({ value, onValueChange, options = [], placeholder = "Select...", emptyText = "No results found." }) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filtered = options.filter(o => 
    (o.label || "").toLowerCase().includes(search.toLowerCase()) ||
    (o.searchKey || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal bg-white h-auto py-2 text-left"
        >
          <span className="truncate flex-1">
            {value && options.find((o) => String(o.value) === String(value))?.renderLabel
              ? options.find((o) => String(o.value) === String(value))?.renderLabel
              : value ? options.find((o) => String(o.value) === String(value))?.label : <span className="text-slate-500">{placeholder}</span>}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="flex items-center border-b border-slate-100 px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50 border-0 ring-0 focus:ring-0"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">{emptyText}</p>
          ) : (
            filtered.map((item) => (
              <div
                key={item.value}
                onClick={() => {
                  onValueChange(item.value)
                  setOpen(false)
                  setSearch("")
                }}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 hover:text-slate-900 transition-colors",
                  value === item.value ? "bg-slate-100 text-slate-900" : ""
                )}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  {value === item.value && <Check className="h-4 w-4" />}
                </span>
                {item.renderOption ? item.renderOption : item.label}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
