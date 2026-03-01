import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from './api';

function createMutationProps(queryClient, mutationFn, successMessage, invalidateKeys) {
  return {
    mutationFn,
    onSuccess: () => {
      invalidateKeys.forEach((key) => {
        if (Array.isArray(key)) {
          queryClient.invalidateQueries({ queryKey: key });
        } else {
          queryClient.invalidateQueries({ queryKey: [key] });
        }
      });
      if (successMessage) toast.success(successMessage);
    },
    onError: (err) => {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Something went wrong';
      toast.error(msg);
    },
  };
}

export function useAddTool() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, (data) => api.post('/api/tools', data), 'Tool added successfully', ['tools']));
}

export function useUpdateTool() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, ({ id, ...data }) => api.put(`/api/tools/${id}`, data), 'Tool updated successfully', ['tools']));
}

export function useDeleteTool() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, (id) => api.delete(`/api/tools/${id}`), 'Tool deleted successfully', ['tools']));
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, ({ id, ...data }) => api.post(`/api/tools/${id}/adjust-stock`, data), 'Stock adjusted successfully', ['tools', 'stock']));
}

export function useSendMaintenance() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, ({ id, ...data }) => api.post(`/api/tools/${id}/maintenance/send`, data), 'Sent to maintenance successfully', ['tools', 'stock']));
}

export function useReturnMaintenance() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, ({ id, ...data }) => api.post(`/api/tools/${id}/maintenance/return`, data), 'Returned from maintenance successfully', ['tools', 'stock']));
}

export function useAddWorker() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, (data) => api.post('/api/workers', data), 'Worker added successfully', ['workers']));
}

export function useUpdateWorker() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, ({ id, ...data }) => api.put(`/api/workers/${id}`, data), 'Worker updated successfully', ['workers']));
}

export function useIssueTool() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, (data) => api.post('/api/lending', data), 'Tool issued successfully', ['lending', 'tools', 'stock', 'dashboard']));
}

export function useReturnTool() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, (id) => api.post(`/api/lending/${id}/return`), 'Tool returned successfully', ['lending', 'tools', 'stock', 'dashboard']));
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, (data) => api.post('/api/transfers', data), 'Transfer created successfully', ['transfers']));
}

export function useApproveTransfer() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, (id) => api.post(`/api/transfers/${id}/approve`), 'Transfer approved successfully', ['transfers', 'stock']));
}

export function useCompleteTransfer() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, (id) => api.post(`/api/transfers/${id}/complete`), 'Transfer completed successfully', ['transfers', 'stock']));
}

export function useCancelTransfer() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, (id) => api.delete(`/api/transfers/${id}`), 'Transfer cancelled successfully', ['transfers', 'stock']));
}

export function useAddSupplier() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, (data) => api.post('/api/suppliers', data), 'Supplier added successfully', ['suppliers']));
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, ({ id, ...data }) => api.put(`/api/suppliers/${id}`, data), 'Supplier updated successfully', ['suppliers']));
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, (data) => api.post('/api/purchases', data), 'Purchase created successfully', ['purchases']));
}

export function useReceivePurchase() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, (id) => api.post(`/api/purchases/${id}/receive`), 'Purchase received successfully', ['purchases', 'stock', 'tools']));
}

export function useAddUser() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, (data) => api.post('/api/users', data), 'User added successfully', ['users']));
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, ({ id, ...data }) => api.put(`/api/users/${id}`, data), 'User updated successfully', ['users']));
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, (id) => api.delete(`/api/users/${id}`), 'User deactivated successfully', ['users']));
}

export function useImportCSV(type) {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, (formData) => api.post(`/api/import?type=${type}`, formData), 'Data imported successfully', ['tools', 'workers', 'locations']));
}

export function useAddLocation() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, (data) => api.post('/api/locations', data), 'Location added successfully', ['locations']));
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation(createMutationProps(queryClient, ({ id, ...data }) => api.put(`/api/locations/${id}`, data), 'Location updated successfully', ['locations']));
}
