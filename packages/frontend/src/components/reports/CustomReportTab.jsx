import { Wrench } from 'lucide-react';

export function CustomReportTab() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
        <Wrench className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Custom Report Builder</h2>
      <p className="text-muted-foreground max-w-md">
        This feature is under development. Soon you will be able to construct pivot UI tables,
        select custom dimensions, and build specialized ad-hoc charts.
      </p>
    </div>
  );
}
