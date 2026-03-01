import ErrorBoundary from "@/components/shared/ErrorBoundary"
import { PageHeader } from "@/components/shared/PageHeader"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { OverviewTab } from "@/components/reports/OverviewTab"
import { StockLevelsTab } from "@/components/reports/StockLevelsTab"
import { WorkerHoldingsTab } from "@/components/reports/WorkerHoldingsTab"
import { LoanHistoryTab } from "@/components/reports/LoanHistoryTab"
import { MovementsTab } from "@/components/reports/MovementsTab"
import { TransfersTab } from "@/components/reports/TransfersTab"
import { ProcurementTab } from "@/components/reports/ProcurementTab"
import { CustomReportTab } from "@/components/reports/CustomReportTab"

export function ReportsPage() {
  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-6 h-full min-h-[calc(100vh-6rem)]">
        <PageHeader title="Reports & Analytics" />

        <div className="bg-background rounded-xl shadow-sm border border-border flex-1 flex flex-col">
          <Tabs defaultValue="overview" className="flex flex-col h-full w-full">
            <div className="px-4 pt-4 border-b border-border overflow-x-auto pb-1">
              <TabsList className="bg-muted border border-border inline-flex min-w-max">
                <TabsTrigger value="overview" className="text-sm px-4">Overview</TabsTrigger>
                <TabsTrigger value="stock" className="text-sm px-4">Stock Levels</TabsTrigger>
                <TabsTrigger value="workers" className="text-sm px-4">Worker Holdings</TabsTrigger>
                <TabsTrigger value="loans" className="text-sm px-4">Loan History</TabsTrigger>
                <TabsTrigger value="movements" className="text-sm px-4">Movements</TabsTrigger>
                <TabsTrigger value="transfers" className="text-sm px-4">Transfers</TabsTrigger>
                <TabsTrigger value="cost" className="text-sm px-4">Procurement / Cost</TabsTrigger>
                <TabsTrigger value="custom" className="text-sm px-4">Custom Builder</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 p-4 md:p-6 bg-slate-50/30 rounded-b-xl overflow-y-auto w-full">
              <TabsContent value="overview" className="m-0"><OverviewTab /></TabsContent>
              <TabsContent value="stock" className="m-0"><StockLevelsTab /></TabsContent>
              <TabsContent value="workers" className="m-0"><WorkerHoldingsTab /></TabsContent>
              <TabsContent value="loans" className="m-0"><LoanHistoryTab /></TabsContent>
              <TabsContent value="movements" className="m-0"><MovementsTab /></TabsContent>
              <TabsContent value="transfers" className="m-0"><TransfersTab /></TabsContent>
              <TabsContent value="cost" className="m-0"><ProcurementTab /></TabsContent>
              <TabsContent value="custom" className="m-0"><CustomReportTab /></TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </ErrorBoundary>
  )
}
