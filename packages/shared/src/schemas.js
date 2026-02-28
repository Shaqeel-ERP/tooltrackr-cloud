import { z } from 'zod';

export const ToolSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  category: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  supplier_id: z.number().nullable().optional(),
  min_stock_level: z.number().default(1),
  unit_of_measure: z.string().default('piece'),
  price: z.number().optional()
});
export const WorkerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  worker_type: z.string().optional()
});
export const LendingSchema = z.object({
  tool_id: z.number(),
  worker_id: z.number(),
  location_id: z.number(),
  quantity: z.number().min(1),
  date_out: z.number(),
  expected_return_date: z.number().nullable().optional(),
  job_site: z.string().optional(),
  project_code: z.string().optional(),
  notes: z.string().optional()
});
export const TransferSchema = z.object({
  from_location_id: z.number(),
  to_location_id: z.number(),
  notes: z.string().optional(),
  items: z.array(z.object({ tool_id: z.number(), quantity: z.number().min(1) }))
});
export const PurchaseSchema = z.object({
  supplier_id: z.number().nullable().optional(),
  invoice_number: z.string().min(1),
  invoice_date: z.number().optional(),
  total_amount: z.number().default(0),
  tax_amount: z.number().default(0),
  notes: z.string().optional(),
  items: z.array(z.object({
    tool_id: z.number(),
    location_id: z.number(),
    quantity: z.number().min(1),
    unit_cost: z.number().default(0)
  }))
});
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
