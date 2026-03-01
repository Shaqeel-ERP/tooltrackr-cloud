import * as React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from './pages/Login';
import { NotAuthorized } from './pages/NotAuthorized';
import { NotFoundPage } from './pages/NotFound';
import { PageSkeleton } from "@/components/shared/PageSkeleton";

// Lazy load actual pages
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const ToolsList = React.lazy(() => import('./pages/inventory/ToolsList').then(m => ({ default: m.ToolsList })));
const ToolDetail = React.lazy(() => import('./pages/inventory/ToolDetail').then(m => ({ default: m.ToolDetail })));
const LocationsList = React.lazy(() => import('./pages/Locations').then(m => ({ default: m.LocationsList })));
const LocationDetail = React.lazy(() => import('./pages/LocationDetail').then(m => ({ default: m.LocationDetail })));
const WorkersList = React.lazy(() => import('./pages/Workers').then(m => ({ default: m.WorkersList })));
const WorkerDetail = React.lazy(() => import('./pages/WorkerDetail').then(m => ({ default: m.WorkerDetail })));
const Lending = React.lazy(() => import('./pages/Lending').then(m => ({ default: m.Lending })));
const SuppliersPage = React.lazy(() => import('./pages/procurement/Suppliers').then(m => ({ default: m.SuppliersPage })));
const PurchasesPage = React.lazy(() => import('./pages/procurement/Purchases').then(m => ({ default: m.PurchasesPage })));
const TransfersPage = React.lazy(() => import('./pages/Transfers').then(m => ({ default: m.TransfersPage })));
const ReportsPage = React.lazy(() => import('./pages/Reports').then(m => ({ default: m.ReportsPage })));
const UserManagement = React.lazy(() => import('./pages/settings/UserManagement').then(m => ({ default: m.UserManagement })));
const SystemSettings = React.lazy(() => import('./pages/settings/SystemSettings').then(m => ({ default: m.SystemSettings })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children ? children : <Outlet />;
}

function RoleRoute({ requiredRole, children }) {
  const { hasRole } = useAuth();

  if (!hasRole(requiredRole)) {
    return <NotAuthorized />;
  }
  return children ? children : <Outlet />;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

            <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route path="/" element={<React.Suspense fallback={<PageSkeleton />}><Dashboard /></React.Suspense>} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/inventory" element={<React.Suspense fallback={<PageSkeleton />}><ToolsList /></React.Suspense>} />
              <Route path="/inventory/:id" element={<React.Suspense fallback={<PageSkeleton />}><ToolDetail /></React.Suspense>} />
              <Route path="/locations" element={<React.Suspense fallback={<PageSkeleton />}><LocationsList /></React.Suspense>} />
              <Route path="/locations/:id" element={<React.Suspense fallback={<PageSkeleton />}><LocationDetail /></React.Suspense>} />
              <Route path="/workers" element={<React.Suspense fallback={<PageSkeleton />}><WorkersList /></React.Suspense>} />
              <Route path="/workers/:id" element={<React.Suspense fallback={<PageSkeleton />}><WorkerDetail /></React.Suspense>} />
              <Route path="/lending" element={<React.Suspense fallback={<PageSkeleton />}><Lending /></React.Suspense>} />
              <Route path="/transfers" element={<React.Suspense fallback={<PageSkeleton />}><TransfersPage /></React.Suspense>} />
              <Route path="/reports" element={<React.Suspense fallback={<PageSkeleton />}><ReportsPage /></React.Suspense>} />

              {/* Manager+ Routes */}
              <Route element={<RoleRoute requiredRole="Manager" />}>
                <Route path="/procurement/suppliers" element={<React.Suspense fallback={<PageSkeleton />}><SuppliersPage /></React.Suspense>} />
                <Route path="/procurement/purchases" element={<React.Suspense fallback={<PageSkeleton />}><PurchasesPage /></React.Suspense>} />
              </Route>

              {/* Admin Routes */}
              <Route element={<RoleRoute requiredRole="Admin" />}>
                <Route path="/settings/users" element={<React.Suspense fallback={<PageSkeleton />}><UserManagement /></React.Suspense>} />
                <Route path="/settings/system" element={<React.Suspense fallback={<PageSkeleton />}><SystemSettings /></React.Suspense>} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
