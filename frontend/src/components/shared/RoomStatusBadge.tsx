import React from 'react';
import { Badge } from '../ui/Badge';
import { RoomStatus } from '../../types';

interface RoomStatusBadgeProps {
  status: RoomStatus;
}

const statusConfig: Record<RoomStatus, { label: string; variant: 'success' | 'danger' | 'warning' | 'info' | 'default' | 'gray' | 'purple' | 'orange' }> = {
  [RoomStatus.AVAILABLE]: { label: 'Disponível', variant: 'success' },
  [RoomStatus.OCCUPIED]: { label: 'Ocupado', variant: 'danger' },
  [RoomStatus.DIRTY]: { label: 'Sujo', variant: 'warning' },
  [RoomStatus.CLEANING]: { label: 'Em Limpeza', variant: 'info' },
  [RoomStatus.INSPECTED]: { label: 'Inspecionado', variant: 'purple' },
  [RoomStatus.MAINTENANCE]: { label: 'Manutenção', variant: 'orange' },
  [RoomStatus.OUT_OF_ORDER]: { label: 'Fora de Uso', variant: 'danger' },
  [RoomStatus.BLOCKED]: { label: 'Bloqueado', variant: 'gray' },
};

export const RoomStatusBadge: React.FC<RoomStatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] ?? { label: status, variant: 'default' as const };
  return <Badge variant={config.variant} dot>{config.label}</Badge>;
};
