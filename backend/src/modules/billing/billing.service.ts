import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPagination } from '../../utils/pagination';
import { generateInvoiceNumber } from '../../utils/crypto';
import { Request } from 'express';
import { PaymentMethod, InvoiceStatus } from '@prisma/client';

export async function createInvoice(data: {
  reservationId?: string;
  guestId: string;
  propertyId: string;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
  discounts?: number;
  notes?: string;
  dueDate?: Date;
}) {
  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const property = await prisma.property.findUnique({ where: { id: data.propertyId } });
  const taxRate = property?.taxRate ?? 0;
  const taxes = subtotal * (taxRate / 100);
  const discounts = data.discounts ?? 0;
  const total = subtotal + taxes - discounts;
  const number = generateInvoiceNumber();

  return prisma.invoice.create({
    data: {
      reservationId: data.reservationId,
      guestId: data.guestId,
      propertyId: data.propertyId,
      number,
      status: 'DRAFT',
      subtotal,
      taxes,
      discounts,
      total,
      dueDate: data.dueDate,
      notes: data.notes,
      items: {
        create: data.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
    include: { items: true, guest: { select: { firstName: true, lastName: true, email: true } } },
  });
}

export async function getInvoices(req: Request, propertyId?: string) {
  const { page, limit, skip } = getPagination(req);
  const where: Record<string, unknown> = {};

  if (propertyId) where.propertyId = propertyId;
  if (req.query.status) where.status = req.query.status;
  if (req.query.guestId) where.guestId = req.query.guestId;
  if (req.query.reservationId) where.reservationId = req.query.reservationId;

  const [items, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        guest: { select: { firstName: true, lastName: true } },
        items: true,
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function getInvoiceById(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: true,
      guest: true,
      reservation: {
        select: { confirmationNumber: true, checkIn: true, checkOut: true },
      },
    },
  });
  if (!invoice) throw new AppError('Invoice not found', 404);
  return invoice;
}

export async function updateInvoice(id: string, data: Partial<{
  notes: string;
  discounts: number;
  dueDate: Date;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
}>) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: { items: true } });
  if (!invoice) throw new AppError('Invoice not found', 404);
  if (invoice.status !== 'DRAFT') throw new AppError('Can only update draft invoices', 400);

  const updateData: Record<string, unknown> = {};

  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.discounts !== undefined) updateData.discounts = data.discounts;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;

  if (data.items) {
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
    const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const property = await prisma.property.findUnique({ where: { id: invoice.propertyId } });
    const taxRate = property?.taxRate ?? 0;
    const taxes = subtotal * (taxRate / 100);
    const discounts = (data.discounts ?? invoice.discounts) as number;
    updateData.subtotal = subtotal;
    updateData.taxes = taxes;
    updateData.total = subtotal + taxes - discounts;
    updateData.items = {
      create: data.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      })),
    };
  }

  return prisma.invoice.update({
    where: { id },
    data: updateData as Parameters<typeof prisma.invoice.update>[0]['data'],
    include: { items: true },
  });
}

export async function issueInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new AppError('Invoice not found', 404);
  if (invoice.status !== 'DRAFT') throw new AppError('Invoice must be in draft state to issue', 400);

  return prisma.invoice.update({
    where: { id },
    data: { status: 'ISSUED' },
  });
}

export async function applyDiscount(id: string, discount: number, reason?: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new AppError('Invoice not found', 404);
  if (['PAID', 'CANCELLED'].includes(invoice.status)) {
    throw new AppError('Cannot apply discount to paid or cancelled invoice', 400);
  }

  const newTotal = invoice.subtotal + invoice.taxes - discount;

  return prisma.invoice.update({
    where: { id },
    data: {
      discounts: discount,
      total: newTotal,
      notes: reason ? `${invoice.notes ?? ''}\nDiscount: ${reason}`.trim() : invoice.notes,
    },
  });
}

export async function recordPayment(data: {
  reservationId?: string;
  guestId: string;
  propertyId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  processedBy: string;
}) {
  const payment = await prisma.payment.create({
    data: {
      ...data,
      status: 'COMPLETED',
    },
  });

  if (data.reservationId) {
    const reservation = await prisma.reservation.findUnique({ where: { id: data.reservationId } });
    if (reservation) {
      const newPaid = reservation.paidAmount + data.amount;
      await prisma.reservation.update({
        where: { id: data.reservationId },
        data: { paidAmount: newPaid },
      });

      if (newPaid >= reservation.totalAmount) {
        await prisma.invoice.updateMany({
          where: { reservationId: data.reservationId, status: 'ISSUED' },
          data: { status: 'PAID', paidAt: new Date() },
        });
      }
    }
  }

  return payment;
}

export async function refundPayment(paymentId: string, reason?: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new AppError('Payment not found', 404);
  if (payment.status !== 'COMPLETED') throw new AppError('Can only refund completed payments', 400);

  const refundPayment = await prisma.payment.create({
    data: {
      reservationId: payment.reservationId,
      guestId: payment.guestId,
      propertyId: payment.propertyId,
      amount: -payment.amount,
      method: payment.method,
      status: 'REFUNDED',
      reference: `REFUND-${payment.id}`,
      notes: reason ?? 'Refund',
    },
  });

  await prisma.payment.update({ where: { id: paymentId }, data: { status: 'REFUNDED' } });

  if (payment.reservationId) {
    const reservation = await prisma.reservation.findUnique({ where: { id: payment.reservationId } });
    if (reservation) {
      await prisma.reservation.update({
        where: { id: payment.reservationId },
        data: { paidAmount: Math.max(0, reservation.paidAmount - payment.amount) },
      });
    }
  }

  return refundPayment;
}

export async function getBillingReport(propertyId: string, startDate: Date, endDate: Date) {
  const [payments, invoices] = await Promise.all([
    prisma.payment.findMany({
      where: {
        propertyId,
        status: 'COMPLETED',
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.invoice.findMany({
      where: {
        propertyId,
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const byMethod = payments.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalRevenue,
    byMethod,
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter((i) => i.status === 'PAID').length,
    pendingInvoices: invoices.filter((i) => i.status === 'ISSUED').length,
    totalPayments: payments.length,
  };
}
