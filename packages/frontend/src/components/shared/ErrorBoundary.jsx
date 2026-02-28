import * as React from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from '@/components/ui/button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, expanded: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-lg w-full text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">An unexpected error occurred in the application.</p>

            {this.state.error && (
              <div className="w-full mb-6 text-left">
                <Button variant="ghost" size="sm" onClick={() => this.setState(s => ({ expanded: !s.expanded }))} className="text-xs mb-2 text-slate-500 dark:text-slate-400">
                  {this.state.expanded ? 'Hide Details' : 'Show Details'}
                </Button>
                {this.state.expanded && (
                  <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg overflow-auto max-h-48 text-xs font-mono text-slate-700 dark:text-slate-300">
                    <p className="font-bold mb-2 text-red-600 dark:text-red-400">{this.state.error.toString()}</p>
                    <p className="whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button onClick={() => window.location.reload()} className="flex-1">Reload Page</Button>
              <Button variant="outline" onClick={() => window.location.href = '/'} className="flex-1 bg-white dark:bg-slate-800">Go to Dashboard</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
