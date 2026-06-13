import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Receipt } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatCurrency } from '../../utils/format';
import { formatDate } from '../../utils/date';
import { InvoiceStatus } from '../../types';
import type { Invoice } from '../../types';

const mockInvoices: Invoice[] = Array.from({ length: 8 }, (_, i) => ({
  id: `inv-${i}`,
  number: `INV-2024-${1000 + i}`,
  reservationId: `res-${i}`,
  status: [InvoiceStatus.PAID, InvoiceStatus.ISSUED, InvoiceStatus.DRAFT, InvoiceStatus.CANCELLED][i % 4],
  subtotal: 800 + i * 150,
  taxes: (800 + i * 150) * 0.15,
  discounts: 0,
  total: (800 + i * 150) * 1.15,
  items: [],
  createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
  updatedAt: new Date().toISOString(),
  reservation: { id: `res-${i}`, confirmationNumber: `RES-2024-${1200 + i}`, guest: { id: `g${i}`, firstName: ['Carlos', 'Maria', 'João', 'Ana'][i % 4], lastName: ['Oliveira', 'Santos', 'Silva', 'Costa'][i % 4], email: `guest${i}@email.com`, blacklisted: false, totalStays: 1, totalSpent: 800, loyaltyPoints: 80, createdAt: '', updatedAt: '' } } as never,
}));

const statusConfig: Record<string, { label: string; variant: 'green' | 'blue' | 'gray' | 'red' }> = {
  [InvoiceStatus.PAID]: { label: 'Paga', variant: 'green' },
  [InvoiceStatus.ISSUED]: { label: 'Emitida', variant: 'blue' },
  [InvoiceStatus.DRAFT]: { label: 'Rascunho', variant: 'gray' },
  [InvoiceStatus.CANCELLED]: { label: 'Cancelada', variant: 'red' },
};

export const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', search, statusFilter],
    queryFn: async () => mockInvoices,
    staleTime: 30000,
    retry: false,
  });

  const invoices = (data ?? mockInvoices).filter(inv =>
    (!search || inv.number.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || inv.status === statusFilter)
  );

  const totals = { total: mockInvoices.reduce((s, i) => s + i.total, 0), paid: mockInvoices.filter(i => i.status === InvoiceStatus.PAID).reduce((s, i) => s + i.total, 0), pending: mockInvoices.filter(i => i.status === InvoiceStatus.ISSUED).reduce((s, i) => s + i.total, 0) };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Faturamento</h1><p className="text-sm text-gray-500">Gestão de faturas e pagamentos</p></div>
        <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/reservations')}>Nova Fatura</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Total Faturado', value: totals.total, color: 'text-gray-900' }, { label: 'Recebido', value: totals.paid, color: 'text-green-600' }, { label: 'A Receber', value: totals.pending, color: 'text-blue-600' }].map(s => (
          <Card key={s.label} padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><Receipt className="h-5 w-5 text-gray-600" /></div>
              <div><p className="text-sm text-gray-500">{s.label}</p><p className={`text-xl font-bold ${s.color}`}>{formatCurrency(s.value)}</p></div>
            </div>
          </Card>
        ))}
      </div>

      <Card padding="none">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Buscar fatura..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <Select options={[{ value: '', label: 'Todos os status' }, ...Object.entries(statusConfig).map(([v, c]) => ({ value: v, label: c.label }))]} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead><tr className="bg-gray-50"><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Número</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Hóspede</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Reserva</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Data</th><th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Subtotal</th><th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Total</th><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Status</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map(inv => {
                  const sc = statusConfig[inv.status];
                  return (
                    <tr key={inv.id} className="hover:bg-blue-50/30 cursor-pointer transition-colors" onClick={() => navigate(`/billing/${inv.id}`)}>
                      <td className="px-5 py-3 text-sm font-medium text-blue-600">{inv.number}</td>
                      <td className="px-5 py-3 text-sm text-gray-900">{(inv.reservation as never as { guest?: { firstName: string; lastName: string } })?.guest?.firstName} {(inv.reservation as never as { guest?: { firstName: string; lastName: string } })?.guest?.lastName}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{inv.reservationId}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{formatDate(inv.createdAt)}</td>
                      <td className="px-5 py-3 text-sm text-gray-700 text-right">{formatCurrency(inv.subtotal)}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(inv.total)}</td>
                      <td className="px-5 py-3"><Badge variant={sc.variant} size="sm">{sc.label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {invoices.length === 0 && <div className="text-center py-12 text-gray-400">Nenhuma fatura encontrada</div>}
          </div>
        )}
      </Card>
    </div>
  );
};
