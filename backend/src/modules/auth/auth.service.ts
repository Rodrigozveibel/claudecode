import { prisma } from '../../config/database';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/crypto';
import { AppError } from '../../middleware/errorHandler';
import nodemailer from 'nodemailer';
import { config } from '../../config/env';
import crypto from 'crypto';
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  UpdateProfileInput,
} from './auth.schema';

const resetTokenStore = new Map<string, { userId: string; expires: Date }>();

function createTransporter() {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
}

export async function register(data: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError('Email already in use', 409);

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role ?? 'FRONT_DESK',
      propertyId: data.propertyId,
    },
    select: { id: true, email: true, name: true, role: true, propertyId: true, createdAt: true },
  });

  const tokenPayload = { userId: user.id, email: user.email, role: user.role, propertyId: user.propertyId ?? undefined };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return { user, accessToken, refreshToken };
}

export async function login(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true, email: true, name: true, role: true, propertyId: true, password: true, isActive: true },
  });

  if (!user || !user.isActive) throw new AppError('Invalid credentials', 401);

  const valid = await comparePassword(data.password, user.password);
  if (!valid) throw new AppError('Invalid credentials', 401);

  const tokenPayload = { userId: user.id, email: user.email, role: user.role, propertyId: user.propertyId ?? undefined };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, accessToken, refreshToken };
}

export async function refreshToken(token: string) {
  const decoded = verifyRefreshToken(token);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, role: true, propertyId: true, isActive: true },
  });

  if (!user || !user.isActive) throw new AppError('User not found or inactive', 401);

  const tokenPayload = { userId: user.id, email: user.email, role: user.role, propertyId: user.propertyId ?? undefined };
  const accessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function forgotPassword(data: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) return; // Don't reveal if email exists

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  resetTokenStore.set(token, { userId: user.id, expires });

  if (config.smtpUser) {
    const transporter = createTransporter();
    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: config.smtpFrom,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link expires in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });
  }
}

export async function resetPassword(data: ResetPasswordInput) {
  const entry = resetTokenStore.get(data.token);
  if (!entry || entry.expires < new Date()) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const hashedPassword = await hashPassword(data.password);
  await prisma.user.update({
    where: { id: entry.userId },
    data: { password: hashedPassword },
  });

  resetTokenStore.delete(data.token);
}

export async function changePassword(userId: string, data: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const valid = await comparePassword(data.currentPassword, user.password);
  if (!valid) throw new AppError('Current password is incorrect', 400);

  const hashedPassword = await hashPassword(data.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      propertyId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      property: {
        select: { id: true, name: true, slug: true, currency: true, timezone: true },
      },
    },
  });

  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, NOT: { id: userId } },
    });
    if (existing) throw new AppError('Email already in use', 409);
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, name: true, role: true, propertyId: true, updatedAt: true },
  });
}
