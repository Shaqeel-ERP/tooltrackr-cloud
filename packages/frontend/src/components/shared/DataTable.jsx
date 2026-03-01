import * as React from "react"
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

export function DataTable({ columns, data, isLoading, emptyMessage, emptyAction, searchPlaceholder = "Search..." }) {
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [sortKey, setSortKey] = React.useState(null)
  const [sortOrder, setSortOrder] = React.useState("asc")
  const [page, setPage] = React.useState(1)
  const rowsPerPage = 15

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 200)
    return () => clearTimeout(timer)
  }, [search])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  const filteredData = React.useMemo(() => {
    if (!data) return []
    if (!debouncedSearch) return data

    const lowerSearch = debouncedSearch.toLowerCase()
    return data.filter((row) =>
      Object.values(row).some((val) => 
        val !== null && val !== undefined && val.toString().toLowerCase().includes(lowerSearch)
      )
    )
  }, [data, debouncedSearch])

  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal
      }
      
      const aStr = String(aVal || "")
      const bStr = String(bVal || "")
      return sortOrder === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })
  }, [filteredData, sortKey, sortOrder])

  const totalPages = Math.ceil(sortedData.length / rowsPerPage)
  
  // ensure page is valid when data changes
  React.useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(totalPages)
  }, [totalPages, page])

  const paginatedData = sortedData.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  return (
    <div className="flex flex-col gap-4">
      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="w-full rounded-md border border-border pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table Container */}
      <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-muted border-b border-border text-xs uppercase tracking-wider text-muted-foreground sticky top-0">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key || col.header}
                    className={`px-4 py-3 font-medium ${col.sortable !== false ? "cursor-pointer select-none hover:bg-slate-100 transition-colors" : ""}`}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable !== false && (
                        <span className="flex flex-col text-[10px] opacity-70">
                          <ChevronUp 
                            className={`h-2.5 w-2.5 -mb-1 ${sortKey === col.key && sortOrder === "asc" ? "text-blue-600 opacity-100" : "text-slate-400"}`} 
                          />
                          <ChevronDown 
                            className={`h-2.5 w-2.5 ${sortKey === col.key && sortOrder === "desc" ? "text-blue-600 opacity-100" : "text-slate-400"}`} 
                          />
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={idx} className="bg-background animate-pulse">
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} className="px-4 py-4">
                        <div className="h-4 bg-slate-100 rounded w-full max-w-[80%]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((row, rIdx) => (
                  <tr key={rIdx} className="bg-background hover:bg-muted transition-colors">
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} className="px-4 py-3 text-sm text-slate-700">
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    <p className="mb-2">{emptyMessage || "No data found."}</p>
                    {emptyAction && <div>{emptyAction}</div>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!isLoading && filteredData.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted">
            <span className="text-sm text-muted-foreground">
              Showing {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filteredData.length)} of {filteredData.length} results
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded text-muted-foreground hover:bg-background border border-transparent hover:border-border disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                className="p-1 rounded text-muted-foreground hover:bg-background border border-transparent hover:border-border disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors"
                title="Next Page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
