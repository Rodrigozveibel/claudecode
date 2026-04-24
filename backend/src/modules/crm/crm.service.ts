import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPagination } from '../../utils/pagination';
import { Request } from 'express';
import { MessageChannel, MessageDirection, MessageStatus } from '@prisma/client';
import nodemailer from 'nodemailer';
import { config } from '../../config/env';

function createTransporter() {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: { user: config.smtpUser, pass: config.smtpPass },
  });
}

export async function sendMessage(data: {
  propertyId: string;
  guestId: string;
  reservationId?: string;
  channel: MessageChannel;
  subject?: string;
  body: string;
  sendEmail?: boolean;
}) {
  const guest = await prisma.guest.findUnique({ where: { id: data.guestId } });
  if (!guest) throw new AppError('Guest not found', 404);

  let status: MessageStatus = 'SENT';

  if (data.channel === 'EMAIL' && data.sendEmail && guest.email && config.smtpUser) {
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: config.smtpFrom,
        to: guest.email,
        subject: data.subject || 'Message from Hotel',
        html: data.body,
      });
      status = 'DELIVERED';
    } catch {
      status = 'FAILED';
    }
  }

  return prisma.guestMessage.create({
    data: {
      propertyId: data.propertyId,
      guestId: data.guestId,
      reservationId: data.reservationId,
      channel: data.channel,
      direction: 'OUTBOUND' as MessageDirection,
      subject: data.subject,
      body: data.body,
      status,
      sentAt: new Date(),
    },
  });
}

export async function getConversationHistory(guestId: string, req: Request) {
  const { page, limit, skip } = getPagination(req);
  const guest = await prisma.guest.findUnique({ where: { id: guestId } });
  if (!guest) throw new AppError('Guest not found', 404);

  const where: Record<string, unknown> = { guestId };
  if (req.query.reservationId) where.reservationId = req.query.reservationId;
  if (req.query.channel) where.channel = req.query.channel;

  const [items, total] = await Promise.all([
    prisma.guestMessage.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.guestMessage.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function sendPreArrivalMessage(reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      guest: true,
      room: { select: { number: true } },
      roomType: { select: { name: true } },
      property: { select: { name: true, checkInTime: true } },
    },
  });

  if (!reservation) throw new AppError('Reservation not found', 404);

  const checkInDate = reservation.checkIn.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const body = `
    <h2>Pre-Arrival Information</h2>
    <p>Dear ${reservation.guest.firstName},</p>
    <p>We are looking forward to your stay at ${reservation.property.name}!</p>
    <p><strong>Reservation Details:</strong></p>
    <ul>
      <li>Confirmation: ${reservation.confirmationNumber}</li>
      <li>Check-in: ${checkInDate}</li>
      <li>Room Type: ${reservation.roomType.name}</li>
      <li>Check-in Time: ${reservation.property.checkInTime}</li>
    </ul>
    <p>If you have any special requests, please contact us.</p>
    <p>See you soon!</p>
  `;

  return sendMessage({
    propertyId: reservation.propertyId,
    guestId: reservation.guestId,
    reservationId,
    channel: 'EMAIL',
    subject: `Pre-Arrival Information - ${reservation.confirmationNumber}`,
    body,
    sendEmail: true,
  });
}

export async function sendPostStayMessage(reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      guest: true,
      property: { select: { name: true } },
    },
  });

  if (!reservation) throw new AppError('Reservation not found', 404);

  const body = `
    <h2>Thank You for Your Stay!</h2>
    <p>Dear ${reservation.guest.firstName},</p>
    <p>Thank you for choosing ${reservation.property.name}. We hope you enjoyed your stay!</p>
    <p>We would love to hear your feedback. Please take a moment to share your experience.</p>
    <p>We hope to see you again soon!</p>
  `;

  return sendMessage({
    propertyId: reservation.propertyId,
    guestId: reservation.guestId,
    reservationId,
    channel: 'EMAIL',
    subject: `Thank You for Your Stay - ${reservation.confirmationNumber}`,
    body,
    sendEmail: true,
  });
}

export async function getEmailTemplates() {
  return [
    {
      id: 'booking-confirmation',
      name: 'Booking Confirmation',
      subject: 'Your Reservation is Confirmed - {{confirmationNumber}}',
      body: '<h2>Booking Confirmed!</h2><p>Dear {{guestName}}, your reservation {{confirmationNumber}} has been confirmed.</p>',
    },
    {
      id: 'pre-arrival',
      name: 'Pre-Arrival',
      subject: 'We Look Forward to Your Stay - {{propertyName}}',
      body: '<h2>See You Soon!</h2><p>Dear {{guestName}}, we are preparing for your arrival on {{checkInDate}}.</p>',
    },
    {
      id: 'checkout-thank-you',
      name: 'Post-Stay Thank You',
      subject: 'Thank You for Staying at {{propertyName}}',
      body: '<h2>Thank You!</h2><p>Dear {{guestName}}, thank you for your stay. We hope to see you again!</p>',
    },
    {
      id: 'invoice',
      name: 'Invoice',
      subject: 'Invoice {{invoiceNumber}} - {{propertyName}}',
      body: '<h2>Invoice</h2><p>Dear {{guestName}}, please find your invoice {{invoiceNumber}} attached.</p>',
    },
  ];
}

export async function recordInboundMessage(data: {
  propertyId: string;
  guestId: string;
  reservationId?: string;
  channel: MessageChannel;
  subject?: string;
  body: string;
}) {
  return prisma.guestMessage.create({
    data: {
      ...data,
      direction: 'INBOUND' as MessageDirection,
      status: 'READ' as MessageStatus,
    },
  });
}

export async function getGuestFeedback(propertyId: string) {
  const messages = await prisma.guestMessage.findMany({
    where: {
      propertyId,
      direction: 'INBOUND',
    },
    include: {
      guest: { select: { firstName: true, lastName: true } },
      reservation: { select: { confirmationNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return messages;
}
