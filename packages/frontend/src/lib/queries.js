import { useQuery } from '@tanstack/react-query';
import api from './api';

const STALE_TIME = 30000;

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/analytics/dashboard').then((r) => r.data),
    staleTime: STALE_TIME,
    refetchInterval: 60000,
  });
}

export function useTools(filters = {}) {
  return useQuery({
    queryKey: ['tools', filters],
    queryFn: () => api.get('/api/tools', { params: filters }).then((r) => r.data),
    staleTime: STALE_TIME,
  });
}

export function useToolDetail(id) {
  return useQuery({
    queryKey: ['tools', id],
    queryFn: () => api.get(`/api/tools/${id}`).then((r) => r.data),
    staleTime: STALE_TIME,
    enabled: !!id,
  });
}

export function useStock() {
  return useQuery({
    queryKey: ['stock'],
    queryFn: () => api.get('/api/stock').then((r) => r.data),
    staleTime: STALE_TIME,
  });
}

export function useMovements(filters = {}) {
  return useQuery({
    queryKey: ['movements', filters],
    queryFn: () => api.get('/api/stock/movements', { params: { limit: 200, ...filters } }).then((r) => r.data),
    staleTime: STALE_TIME,
  });
}

export function useWorkers() {
  return useQuery({
    queryKey: ['workers'],
    queryFn: () => api.get('/api/workers').then((r) => r.data),
    staleTime: STALE_TIME,
  });
}

export function useWorkerDetail(id) {
  return useQuery({
    queryKey: ['workers', id],
    queryFn: () => api.get(`/api/workers/${id}`).then((r) => r.data),
    staleTime: STALE_TIME,
    enabled: !!id,
  });
}

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: () => api.get('/api/locations').then((r) => r.data),
    staleTime: STALE_TIME,
  });
}

export function useLocationDetail(id) {
  return useQuery({
    queryKey: ['locations', id],
    queryFn: () => api.get(`/api/locations/${id}`).then((r) => r.data),
    staleTime: STALE_TIME,
    enabled: !!id,
  });
}

export function useLending(status, workerId) {
  return useQuery({
    queryKey: ['lending', { status, worker_id: workerId }],
    queryFn: () => api.get('/api/lending', { params: { status, worker_id: workerId } }).then((r) => r.data),
    staleTime: STALE_TIME,
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/api/suppliers').then((r) => r.data),
    staleTime: STALE_TIME,
  });
}

export function usePurchases() {
  return useQuery({
    queryKey: ['purchases'],
    queryFn: () => api.get('/api/purchases').then((r) => r.data),
    staleTime: STALE_TIME,
  });
}

export function usePurchaseDetail(id) {
  return useQuery({
    queryKey: ['purchases', id],
    queryFn: () => api.get(`/api/purchases/${id}`).then((r) => r.data),
    staleTime: STALE_TIME,
    enabled: !!id,
  });
}

export function useTransfers() {
  return useQuery({
    queryKey: ['transfers'],
    queryFn: () => api.get('/api/transfers').then((r) => r.data),
    staleTime: STALE_TIME,
  });
}

export function useAuditLog(filters = {}) {
  return useQuery({
    queryKey: ['audit', filters],
    queryFn: () => api.get('/api/audit', { params: filters }).then((r) => r.data),
    staleTime: STALE_TIME,
  });
}

export function useStockReport() {
  return useQuery({
    queryKey: ['stockReport'],
    queryFn: () => api.get('/api/analytics/stock-report').then((r) => r.data),
    staleTime: STALE_TIME,
  });
}

export function useWorkerHoldings() {
  return useQuery({
    queryKey: ['workerHoldings'],
    queryFn: () => api.get('/api/analytics/worker-holdings').then((r) => r.data),
    staleTime: STALE_TIME,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/api/users').then((r) => r.data),
    staleTime: STALE_TIME,
  });
}
