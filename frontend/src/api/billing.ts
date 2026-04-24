import apiClient from './client';
import type { Invoice, Payment, ApiResponse, PaginatedResponse } from '../types';

export const billingApi = {
  getInvoices: async (params: Record<string, unknown> = {}): Promise<PaginatedResponse<Invoice>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Invoice>>>('/invoices', { params });
    return data.data;
  },

  getInvoiceById: async (id: string): Promise<Invoice> => {
    const { data } = await apiClient.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return data.data;
  },

  createInvoice: async (invoice: Partial<Invoice>): Promise<Invoice> => {
    const { data } = await apiClient.post<ApiResponse<Invoice>>('/invoices', invoice);
    return data.data;
  },

  updateInvoice: async (id: string, invoice: Partial<Invoice>): Promise<Invoice> => {
    const { data } = await apiClient.put<ApiResponse<Invoice>>(`/invoices/${id}`, invoice);
    return data.data;
  },

  addPayment: async (invoiceId: string, payment: Partial<Payment>): Promise<Payment> => {
    const { data } = await apiClient.post<ApiResponse<Payment>>(`/invoices/${invoiceId}/payments`, payment);
    return data.data;
  },

  getPayments: async (params: Record<string, unknown> = {}): Promise<PaginatedResponse<Payment>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Payment>>>('/payments', { params });
    return data.data;
  },

  downloadInvoice: async (id: string): Promise<Blob> => {
    const { data } = await apiClient.get(`/invoices/${id}/download`, { responseType: 'blob' });
    return data;
  },
};
