import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/layout/Layout';
import { AuthLayout } from './components/layout/AuthLayout';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Auth pages
const Login = lazy(() => import('./pages/auth/Login').then(m => ({ default: m.Login })));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword').then(m => ({ default: m.ForgotPassword })));

// Main pages
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));

// Front Desk
const FrontDesk = lazy(() => import('./pages/checkin/FrontDesk').then(m => ({ default: m.FrontDesk })));

// Reservations
const ReservationList = lazy(() => import('./pages/reservations/ReservationList').then(m => ({ default: m.ReservationList })));
const ReservationCalendar = lazy(() => import('./pages/reservations/ReservationCalendar').then(m => ({ default: m.ReservationCalendar })));
const ReservationDetail = lazy(() => import('./pages/reservations/ReservationDetail').then(m => ({ default: m.ReservationDetail })));
const NewReservation = lazy(() => import('./pages/reservations/NewReservation').then(m => ({ default: m.NewReservation })));

// Rooms
const RoomGrid = lazy(() => import('./pages/rooms/RoomGrid').then(m => ({ default: m.RoomGrid })));
const RoomList = lazy(() => import('./pages/rooms/RoomList').then(m => ({ default: m.RoomList })));
const RoomDetail = lazy(() => import('./pages/rooms/RoomDetail').then(m => ({ default: m.RoomDetail })));
const RoomTypeList = lazy(() => import('./pages/rooms/RoomTypeList').then(m => ({ default: m.RoomTypeList })));

// Guests
const GuestList = lazy(() => import('./pages/guests/GuestList').then(m => ({ default: m.GuestList })));
const GuestDetail = lazy(() => import('./pages/guests/GuestDetail').then(m => ({ default: m.GuestDetail })));
const NewGuest = lazy(() => import('./pages/guests/NewGuest').then(m => ({ default: m.NewGuest })));

// Housekeeping
const HousekeepingBoard = lazy(() => import('./pages/housekeeping/HousekeepingBoard').then(m => ({ default: m.HousekeepingBoard })));

// Billing
const InvoiceList = lazy(() => import('./pages/billing/InvoiceList').then(m => ({ default: m.InvoiceList })));
const InvoiceDetail = lazy(() => import('./pages/billing/InvoiceDetail').then(m => ({ default: m.InvoiceDetail })));

// Revenue
const RevenueManagement = lazy(() => import('./pages/revenue/RevenueManagement').then(m => ({ default: m.RevenueManagement })));
const RateCalendar = lazy(() => import('./pages/revenue/RateCalendar').then(m => ({ default: m.RateCalendar })));
const RateRules = lazy(() => import('./pages/revenue/RateRules').then(m => ({ default: m.RateRules })));

// Channels
const ChannelManager = lazy(() => import('./pages/channels/ChannelManager').then(m => ({ default: m.ChannelManager })));

// Reports
const Reports = lazy(() => import('./pages/reports/Reports').then(m => ({ default: m.Reports })));
const OccupancyReport = lazy(() => import('./pages/reports/OccupancyReport').then(m => ({ default: m.OccupancyReport })));
const RevenueReport = lazy(() => import('./pages/reports/RevenueReport').then(m => ({ default: m.RevenueReport })));
const GuestReport = lazy(() => import('./pages/reports/GuestReport').then(m => ({ default: m.GuestReport })));

// Maintenance
const MaintenanceList = lazy(() => import('./pages/maintenance/MaintenanceList').then(m => ({ default: m.MaintenanceList })));

// Staff
const StaffList = lazy(() => import('./pages/staff/StaffList').then(m => ({ default: m.StaffList })));

// Settings
const Settings = lazy(() => import('./pages/settings/Settings').then(m => ({ default: m.Settings })));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <LoadingSpinner size="lg" message="Carregando..." />
  </div>
);

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Protected app routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Front Desk */}
          <Route path="/front-desk" element={<FrontDesk />} />
          <Route path="/front-desk/check-in" element={<FrontDesk />} />
          <Route path="/front-desk/check-out" element={<FrontDesk />} />

          {/* Reservations */}
          <Route path="/reservations" element={<ReservationList />} />
          <Route path="/reservations/calendar" element={<ReservationCalendar />} />
          <Route path="/reservations/new" element={<NewReservation />} />
          <Route path="/reservations/:id" element={<ReservationDetail />} />

          {/* Rooms */}
          <Route path="/rooms/grid" element={<RoomGrid />} />
          <Route path="/rooms" element={<RoomList />} />
          <Route path="/rooms/types" element={<RoomTypeList />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />

          {/* Guests */}
          <Route path="/guests" element={<GuestList />} />
          <Route path="/guests/new" element={<NewGuest />} />
          <Route path="/guests/:id" element={<GuestDetail />} />

          {/* Housekeeping */}
          <Route path="/housekeeping" element={<HousekeepingBoard />} />

          {/* Billing */}
          <Route path="/billing" element={<InvoiceList />} />
          <Route path="/billing/:id" element={<InvoiceDetail />} />

          {/* Revenue */}
          <Route path="/revenue" element={<RevenueManagement />} />
          <Route path="/revenue/calendar" element={<RateCalendar />} />
          <Route path="/revenue/rules" element={<RateRules />} />

          {/* Channels */}
          <Route path="/channels" element={<ChannelManager />} />

          {/* Reports */}
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/occupancy" element={<OccupancyReport />} />
          <Route path="/reports/revenue" element={<RevenueReport />} />
          <Route path="/reports/guests" element={<GuestReport />} />

          {/* Maintenance */}
          <Route path="/maintenance" element={<MaintenanceList />} />

          {/* Staff */}
          <Route path="/staff" element={<StaffList />} />

          {/* Settings */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/*" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
