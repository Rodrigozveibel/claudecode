import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { generateInvoiceNumber } from '../../utils/crypto';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';

export async function createInvoice(reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { addons: true, invoice: true },
  });

  if (!reservation) throw new AppError('Reservation not found', 404);
  if (reservation.invoice) throw new AppError('Invoice already exists for this reservation', 409);

  const property = await prisma.property.findUnique({ where: { id: reservation.propertyId } });
  const taxRate = property?.taxRate || 0;

  const roomTotal = reservation.roomRate * reservation.nightsCount;
  const addonsTotal = reservation.addons.reduce((sum, a) => sum + a.total, 0);
  const subtotal = roomTotal + addonsTotal;
  const taxes = subtotal * (taxRate / 100);
  const total = subtotal + taxes;

  const items = [
    {
      description: `Room ${reservation.nightsCount} night(s)`,
      quantity: reservation.nightsCount,
      unitPrice: reservation.roomRate,
      total: roomTotal,
    },
    ...reservation.addons.map((a) => ({
      description: a.name,
      quantity: a.quantity,
      unitPrice: a.unitPrice,
      total: a.total,
    })),
  ];

  return prisma.invoice.create({
    data: {
      reservationId,
      number: generateInvoiceNumber(),
      status: 'DRAFT',
      subtotal,
      taxes,
      discounts: 0,
      total,
      items: { create: items },
    },
    include: { items: true, reservation: { include: { guest: true } } },
  });
}

export async function getInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: true,
      reservation: {
        include: {
          guest: { select: { id: true, firstName: true, lastName: true, email: true } },
          room: { select: { number: true } },
          roomType: { select: { name: true } },
          payments: true,
        },
      },
    },
  });
  if (!invoice) throw new AppError('Invoice not found', 404);
  return invoice;
}

export async function updateInvoice(id: string, data: { notes?: string; discounts?: number }) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new AppError('Invoice not found', 404);
  if (invoice.status !== 'DRAFT') throw new AppError('Can only update draft invoices', 400);

  const discounts = data.discounts !== undefined ? data.discounts : invoice.discounts;
  const total = invoice.subtotal + invoice.taxes - discounts;

  return prisma.invoice.update({
    where: { id },
    data: { notes: data.notes, discounts, total },
    include: { items: true },
  });
}

export async function issueInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new AppError('Invoice not found', 404);
  if (invoice.status !== 'DRAFT') throw new AppError('Invoice must be in DRAFT status', 400);

  return prisma.invoice.update({
    where: { id },
    data: { status: 'ISSUED' },
    include: { items: true },
  });
}

export async function recordPayment(
  invoiceId: string,
  amount: number,
  method: PaymentMethod,
  reference?: string,
  notes?: string,
  processedBy?: string
) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { reservation: { include: { payments: true } } },
  });
  if (!invoice) throw new AppError('Invoice not found', 404);

  const payment = await prisma.payment.create({
    data: {
      reservationId: invoice.reservationId,
      amount,
      method,
      status: 'COMPLETED',
      reference,
      notes,
      processedBy,
    },
  });

  const allPayments = await prisma.payment.findMany({
    where: { reservationId: invoice.reservationId, status: 'COMPLETED' },
  });
  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

  await prisma.reservation.update({
    where: { id: invoice.reservationId },
    data: { paidAmount: totalPaid },
  });

  if (totalPaid >= invoice.total) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID' },
    });
  }

  return payment;
}

export async function getInvoices(
  propertyId: string,
  filters: { status?: InvoiceStatus; page?: number; limit?: number }
) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    reservation: { propertyId },
  };
  if (filters.status) where.status = filters.status;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      include: {
        reservation: {
          include: {
            guest: { select: { firstName: true, lastName: true } },
          },
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.invoice.count({ where }),
  ]);

  return { invoices, total, page, limit };
}
