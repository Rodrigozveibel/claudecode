import React from 'react';
import { Badge } from '../ui/Badge';
import { ReservationStatus } from '../../types';

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
}

const statusConfig: Record<ReservationStatus, { label: string; variant: 'success' | 'danger' | 'warning' | 'info' | 'default' | 'gray' | 'purple' | 'orange' }> = {
  [ReservationStatus.PENDING]: { label: 'Pendente', variant: 'warning' },
  [ReservationStatus.CONFIRMED]: { label: 'Confirmada', variant: 'info' },
  [ReservationStatus.CHECKED_IN]: { label: 'Check-in', variant: 'success' },
  [ReservationStatus.CHECKED_OUT]: { label: 'Check-out', variant: 'gray' },
  [ReservationStatus.CANCELLED]: { label: 'Cancelada', variant: 'danger' },
  [ReservationStatus.NO_SHOW]: { label: 'No-show', variant: 'orange' },
};

export const ReservationStatusBadge: React.FC<ReservationStatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] ?? { label: status, variant: 'default' as const };
  return <Badge variant={config.variant} dot>{config.label}</Badge>;
};
