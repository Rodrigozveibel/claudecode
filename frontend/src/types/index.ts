// Enums
export enum Role {
  SUPER_ADMIN = 'super_admin',
  PROPERTY_MANAGER = 'property_manager',
  FRONT_DESK = 'front_desk',
  HOUSEKEEPING = 'housekeeping',
  MAINTENANCE = 'maintenance',
  ACCOUNTANT = 'accountant',
}

export enum RoomStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  DIRTY = 'dirty',
  CLEANING = 'cleaning',
  INSPECTED = 'inspected',
  MAINTENANCE = 'maintenance',
  OUT_OF_ORDER = 'out_of_order',
  BLOCKED = 'blocked',
}

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  REFUNDED = 'refunded',
  OVERDUE = 'overdue',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CASH = 'cash',
  PIX = 'pix',
  BANK_TRANSFER = 'bank_transfer',
  OTA_COLLECT = 'ota_collect',
}

export enum HousekeepingStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  INSPECTED = 'inspected',
}

export enum HousekeepingType {
  CHECKOUT = 'checkout',
  STAYOVER = 'stayover',
  DEEP_CLEAN = 'deep_clean',
  TURNDOWN = 'turndown',
  TOUCH_UP = 'touch_up',
}

export enum MaintenanceStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum MaintenancePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ChannelType {
  DIRECT = 'direct',
  BOOKING_COM = 'booking_com',
  EXPEDIA = 'expedia',
  AIRBNB = 'airbnb',
  HOTELS_COM = 'hotels_com',
  TRIPADVISOR = 'tripadvisor',
  OWN_WEBSITE = 'own_website',
  PHONE = 'phone',
  WALK_IN = 'walk_in',
}

// Core Entities
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  propertyIds: string[];
  phone?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  currency: string;
  timezone: string;
  checkInTime: string;
  checkOutTime: string;
  taxRate: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoomType {
  id: string;
  propertyId: string;
  name: string;
  description: string;
  maxOccupancy: number;
  baseRate: number;
  amenities: string[];
  images: string[];
  bedType: string;
  size?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  propertyId: string;
  roomTypeId: string;
  roomType?: RoomType;
  number: string;
  floor: number;
  status: RoomStatus;
  notes?: string;
  isSmokingAllowed: boolean;
  isAccessible: boolean;
  currentReservationId?: string;
  currentGuestName?: string;
  lastCleaned?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  nationality?: string;
  documentType?: string;
  documentNumber?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  country?: string;
  vipLevel?: number;
  notes?: string;
  totalStays: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationAddon {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Reservation {
  id: string;
  confirmationNumber: string;
  propertyId: string;
  roomId: string;
  room?: Room;
  guestId: string;
  guest?: Guest;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  adults: number;
  children: number;
  status: ReservationStatus;
  channel: ChannelType;
  ratePerNight: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  paymentStatus: PaymentStatus;
  addons: ReservationAddon[];
  specialRequests?: string;
  notes?: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  reservationId: string;
  invoiceId?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference?: string;
  notes?: string;
  processedAt: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  reservationId: string;
  reservation?: Reservation;
  guestId: string;
  guest?: Guest;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: PaymentStatus;
  dueDate: string;
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface HousekeepingTask {
  id: string;
  propertyId: string;
  roomId: string;
  room?: Room;
  assignedToId?: string;
  assignedTo?: User;
  type: HousekeepingType;
  status: HousekeepingStatus;
  priority: 'normal' | 'high' | 'urgent';
  notes?: string;
  completedAt?: string;
  inspectedAt?: string;
  scheduledDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  roomId?: string;
  room?: Room;
  reportedById: string;
  reportedBy?: User;
  assignedToId?: string;
  assignedTo?: User;
  title: string;
  description: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  category: string;
  images?: string[];
  resolvedAt?: string;
  notes?: string;
  estimatedCost?: number;
  actualCost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RateRule {
  id: string;
  propertyId: string;
  roomTypeId: string;
  roomType?: RoomType;
  name: string;
  baseRate: number;
  startDate: string;
  endDate: string;
  daysOfWeek?: number[];
  minNights?: number;
  maxNights?: number;
  rateModifier?: number;
  modifierType?: 'percentage' | 'fixed';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelMapping {
  id: string;
  propertyId: string;
  channel: ChannelType;
  channelName: string;
  channelPropertyId?: string;
  active: boolean;
  lastSyncAt?: string;
  bookingsCount: number;
  commission: number;
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface GuestMessage {
  id: string;
  guestId: string;
  guest?: Guest;
  reservationId?: string;
  message: string;
  channel: 'email' | 'sms' | 'whatsapp';
  direction: 'inbound' | 'outbound';
  read: boolean;
  createdAt: string;
}

export interface DashboardStats {
  todayArrivals: number;
  todayDepartures: number;
  currentOccupancy: number;
  occupancyPercent: number;
  totalRooms: number;
  revenueToday: number;
  revenueThisMonth: number;
  pendingHousekeeping: number;
  openMaintenanceRequests: number;
  averageDailyRate: number;
  revpar: number;
  arrivals: Reservation[];
  departures: Reservation[];
  upcomingReservations: Reservation[];
  roomStatusCounts: Record<RoomStatus, number>;
}

export interface OccupancyTrend {
  date: string;
  occupancy: number;
  revenue: number;
}

export interface RevenueByChannel {
  channel: string;
  revenue: number;
  bookings: number;
}

export interface StaffMember {
  id: string;
  userId: string;
  user?: User;
  propertyId: string;
  department: string;
  position: string;
  hireDate: string;
  salary?: number;
  schedule?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReservationFilters extends PaginationParams {
  status?: ReservationStatus;
  checkInFrom?: string;
  checkInTo?: string;
  channel?: ChannelType;
  guestId?: string;
}

export interface RoomFilters extends PaginationParams {
  status?: RoomStatus;
  floor?: number;
  roomTypeId?: string;
}

export interface GuestFilters extends PaginationParams {
  nationality?: string;
  vipLevel?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}
