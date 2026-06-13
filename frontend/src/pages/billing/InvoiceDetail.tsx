import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { formatCurrency } from '../../utils/format';
import { formatDate } from '../../utils/date';
import { InvoiceStatus, PaymentMethod } from '../../types';

const mockInvoice = {
  id: 'inv-1', number: 'INV-2024-1001', reservationId: 'RES-2024-1247',
  status: InvoiceStatus.ISSUED, subtotal: 1049.70, taxes: 157.46, discounts: 0, total: 1207.16,
  guestName: 'Carlos Oliveira', guestEmail: 'carlos@email.com',
  createdAt: new Date().toISOString(), dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
  items: [
    { id: 'i1', description: 'Hospedagem Deluxe (3 noites)', quantity: 3, unitPrice: 349.90, total: 1049.70 },
    { id: 'i2', description: 'Café da Manhã', quantity: 2, unitPrice: 45, total: 90 },
    { id: 'i3', description: 'Estacionamento', quantity: 3, unitPrice: 30, total: 90 },
  ],
  payments: [{ id: 'p1', amount: 500, method: PaymentMethod.CREDIT_CARD, createdAt: new Date().toISOString(), status: 'completed' }],
};

const statusConfig: Record<string, { label: string; variant: 'green' | 'blue' | 'gray' | 'red' }> = {
  [InvoiceStatus.PAID]: { label: 'Paga', variant: 'green' },
  [InvoiceStatus.ISSUED]: { label: 'Emitida', variant: 'blue' },
  [InvoiceStatus.DRAFT]: { label: 'Rascunho', variant: 'gray' },
  [InvoiceStatus.CANCELLED]: { label: 'Cancelada', variant: 'red' },
};

const methodLabels: Record<string, string> = {
  [PaymentMethod.CREDIT_CARD]: 'Cartão de Crédito', [PaymentMethod.DEBIT_CARD]: 'Cartão de Débito',
  [PaymentMethod.CASH]: 'Dinheiro', [PaymentMethod.PIX]: 'PIX', [PaymentMethod.BANK_TRANSFER]: 'Transferência',
};

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [paymentModal, setPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState(PaymentMethod.PIX);

  const inv = mockInvoice;
  const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
  const balance = inv.total - paid;
  const sc = statusConfig[inv.status];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/billing')} />
          <div>
            <h1 className="text-xl font-bold text-gray-900">{inv.number}</h1>
            <p className="text-sm text-gray-500">Reserva: {inv.reservationId}</p>
          </div>
          <Badge variant={sc.variant}>{sc.label}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<Printer className="h-4 w-4" />} onClick={() => toast.success('Imprimindo...')}>Imprimir</Button>
          {balance > 0 && <Button size="sm" icon={<CreditCard className="h-4 w-4" />} onClick={() => setPaymentModal(true)}>Registrar Pagamento</Button>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <Card padding="md"><div className="space-y-1"><p className="font-semibold text-gray-900">{inv.guestName}</p><p className="text-gray-500">{inv.guestEmail}</p></div></Card>
        <Card padding="md"><div className="grid grid-cols-2 gap-1 text-sm"><span className="text-gray-500">Emissão:</span><span>{formatDate(inv.createdAt)}</span><span className="text-gray-500">Vencimento:</span><span>{formatDate(inv.dueDate)}</span></div></Card>
      </div>

      <Card padding="none">
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Itens</h3></div>
        <table className="min-w-full">
          <thead><tr className="bg-gray-50"><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Descrição</th><th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Qtd</th><th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Unit.</th><th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Total</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {inv.items.map(item => (
              <tr key={item.id}><td className="px-5 py-3 text-sm text-gray-900">{item.description}</td><td className="px-5 py-3 text-sm text-gray-600 text-right">{item.quantity}</td><td className="px-5 py-3 text-sm text-gray-600 text-right">{formatCurrency(item.unitPrice)}</td><td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.total)}</td></tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr><td colSpan={3} className="px-5 py-2 text-sm text-gray-500 text-right">Subtotal</td><td className="px-5 py-2 text-sm font-medium text-gray-900 text-right">{formatCurrency(inv.subtotal)}</td></tr>
            <tr><td colSpan={3} className="px-5 py-2 text-sm text-gray-500 text-right">Impostos (15%)</td><td className="px-5 py-2 text-sm font-medium text-gray-900 text-right">{formatCurrency(inv.taxes)}</td></tr>
            <tr><td colSpan={3} className="px-5 py-3 text-sm font-bold text-gray-900 text-right">Total</td><td className="px-5 py-3 text-base font-bold text-gray-900 text-right">{formatCurrency(inv.total)}</td></tr>
          </tfoot>
        </table>
      </Card>

      {inv.payments.length > 0 && (
        <Card padding="none">
          <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Pagamentos Recebidos</h3></div>
          <div className="divide-y divide-gray-50">
            {inv.payments.map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div><p className="text-sm font-medium text-gray-900">{methodLabels[p.method] ?? p.method}</p><p className="text-xs text-gray-500">{formatDate(p.createdAt)}</p></div>
                <span className="text-sm font-semibold text-green-600">{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-gray-50 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Saldo Devedor</span>
            <span className={`text-base font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(balance)}</span>
          </div>
        </Card>
      )}

      <Modal isOpen={paymentModal} onClose={() => setPaymentModal(false)} title="Registrar Pagamento" size="sm">
        <div className="space-y-4">
          <Input label="Valor" type="number" step="0.01" placeholder="0,00" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
          <Select label="Método" options={Object.entries(methodLabels).map(([v, l]) => ({ value: v, label: l }))} value={payMethod} onChange={e => setPayMethod(e.target.value as PaymentMethod)} />
          <Input label="Referência (opcional)" placeholder="Número do comprovante..." />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setPaymentModal(false)}>Cancelar</Button>
          <Button onClick={() => { toast.success(`Pagamento de ${formatCurrency(parseFloat(payAmount) || 0)} registrado!`); setPaymentModal(false); }}>Confirmar</Button>
        </div>
      </Modal>
    </div>
  );
};
