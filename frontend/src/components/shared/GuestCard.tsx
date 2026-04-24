import React from 'react';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Phone, Mail, MapPin, Star } from 'lucide-react';
import type { Guest } from '../../types';
import { formatCurrency } from '../../utils/format';

interface GuestCardProps {
  guest: Guest;
  onClick?: () => void;
  compact?: boolean;
}

export const GuestCard: React.FC<GuestCardProps> = ({ guest, onClick, compact = false }) => {
  const fullName = `${guest.firstName} ${guest.lastName}`;

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
        onClick={onClick}
      >
        <Avatar name={fullName} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">{fullName}</p>
          {guest.email && (
            <p className="text-xs text-gray-500 truncate">{guest.email}</p>
          )}
        </div>
        {guest.vipLevel && guest.vipLevel > 0 && (
          <Badge variant="warning" size="sm">VIP</Badge>
        )}
      </div>
    );
  }

  return (
    <div
      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Avatar name={fullName} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{fullName}</h3>
            {guest.vipLevel && guest.vipLevel > 0 && (
              <Badge variant="warning">
                <Star className="h-3 w-3 mr-0.5" />
                VIP
              </Badge>
            )}
          </div>
          <div className="mt-1 space-y-0.5">
            {guest.email && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Mail className="h-3 w-3" />
                {guest.email}
              </div>
            )}
            {guest.phone && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Phone className="h-3 w-3" />
                {guest.phone}
              </div>
            )}
            {guest.city && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                {guest.city}, {guest.country}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500">Total de Estadias</p>
          <p className="text-sm font-semibold text-gray-900">{guest.totalStays}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total Gasto</p>
          <p className="text-sm font-semibold text-gray-900">{formatCurrency(guest.totalSpent)}</p>
        </div>
      </div>
    </div>
  );
};
