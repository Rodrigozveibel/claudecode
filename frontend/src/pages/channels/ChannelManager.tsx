import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Link2, Settings, TrendingUp, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatCurrency } from '../../utils/format';
import { ChannelType } from '../../types';

const mockChannels = [
  { id: 'c1', channel: ChannelType.BOOKING_COM, name: 'Booking.com', isActive: true, commission: 15, lastSync: new Date(Date.now() - 5 * 60000).toISOString(), reservations: 142, revenue: 58420, status: 'connected', logo: '🏨' },
  { id: 'c2', channel: ChannelType.EXPEDIA, name: 'Expedia', isActive: true, commission: 18, lastSync: new Date(Date.now() - 12 * 60000).toISOString(), reservations: 87, revenue: 34100, status: 'connected', logo: '✈️' },
  { id: 'c3', channel: ChannelType.AIRBNB, name: 'Airbnb', isActive: true, commission: 3, lastSync: new Date(Date.now() - 2 * 60000).toISOString(), reservations: 63, revenue: 28900, status: 'connected', logo: '🏠' },
  { id: 'c4', channel: ChannelType.OWN_WEBSITE, name: 'Site Próprio', isActive: true, commission: 0, lastSync: new Date().toISOString(), reservations: 211, revenue: 91300, status: 'connected', logo: '🌐' },
  { id: 'c5', channel: ChannelType.DIRECT, name: 'Direto / Telefone', isActive: true, commission: 0, lastSync: new Date().toISOString(), reservations: 54, revenue: 21600, status: 'manual', logo: '📞' },
];

const mockInventory = [
  { roomType: 'Standard', total: 20, available: { 'Booking.com': 18, 'Expedia': 15, 'Airbnb': 10, 'Site Próprio': 20 } },
  { roomType: 'Deluxe', total: 12, available: { 'Booking.com': 10, 'Expedia': 8, 'Airbnb': 6, 'Site Próprio': 12 } },
  { roomType: 'Suíte Executiva', total: 6, available: { 'Booking.com': 5, 'Expedia': 4, 'Airbnb': 3, 'Site Próprio': 6 } },
];

const timeSince = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m atrás`;
  return `${Math.floor(mins / 60)}h atrás`;
};

export const ChannelManager: React.FC = () => {
  const [syncing, setSyncing] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: async () => ({ channels: mockChannels, inventory: mockInventory }),
    staleTime: 30000,
    retry: false,
  });

  const channels = data?.channels ?? mockChannels;
  const inventory = data?.inventory ?? mockInventory;
  const channelNames = ['Booking.com', 'Expedia', 'Airbnb', 'Site Próprio'];

  const handleSync = (id: string, name: string) => {
    setSyncing(id);
    setTimeout(() => { setSyncing(null); toast.success(`${name} sincronizado!`); }, 2000);
  };

  const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Channel Manager</h1>
          <p className="text-sm text-gray-500">Gestão de canais de distribuição e inventário</p>
        </div>
        <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={() => { channels.forEach(c => handleSync(c.id, c.name)); }}>Sincronizar Todos</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card padding="md">
              <p className="text-sm text-gray-500">Canais Ativos</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{channels.filter(c => c.isActive).length}</p>
            </Card>
            <Card padding="md">
              <p className="text-sm text-gray-500">Reservas via Canais (mês)</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{channels.reduce((s, c) => s + c.reservations, 0)}</p>
            </Card>
            <Card padding="md">
              <p className="text-sm text-gray-500">Receita Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenue)}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {channels.map(ch => (
              <Card key={ch.id} padding="md">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">{ch.logo}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{ch.name}</h3>
                      <Badge variant={ch.status === 'connected' ? 'green' : 'gray'} size="sm">
                        {ch.status === 'connected' ? 'Conectado' : 'Manual'}
                      </Badge>
                      {ch.isActive && <Badge variant="blue" size="sm">Ativo</Badge>}
                    </div>
                    <div className="flex items-center gap-6 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Link2 className="h-3 w-3" />Comissão: {ch.commission}%</span>
                      <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{ch.reservations} reservas</span>
                      <span>{formatCurrency(ch.revenue)} receita</span>
                      {ch.status === 'connected' && <span>Última sync: {timeSince(ch.lastSync)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(ch.revenue / totalRevenue) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-12">{((ch.revenue / totalRevenue) * 100).toFixed(1)}%</span>
                    {ch.status === 'connected' && (
                      <Button variant="outline" size="sm" icon={<RefreshCw className={`h-3.5 w-3.5 ${syncing === ch.id ? 'animate-spin' : ''}`} />} onClick={() => handleSync(ch.id, ch.name)} disabled={syncing === ch.id}>Sync</Button>
                    )}
                    <Button variant="ghost" size="sm" icon={<Settings className="h-4 w-4" />} onClick={() => toast.success('Abrindo configurações...')} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card padding="none">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Inventário por Canal</h3>
              <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Quartos disponíveis hoje</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Tipo de Quarto</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Total</th>
                    {channelNames.map(n => <th key={n} className="px-5 py-3 text-center text-xs font-semibold text-gray-500">{n}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {inventory.map(inv => (
                    <tr key={inv.roomType} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{inv.roomType}</td>
                      <td className="px-5 py-3 text-sm text-gray-700 text-center font-semibold">{inv.total}</td>
                      {channelNames.map(n => {
                        const avail = (inv.available as Record<string, number>)[n] ?? 0;
                        return (
                          <td key={n} className="px-5 py-3 text-center">
                            <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${avail === inv.total ? 'text-green-700 bg-green-100' : avail > 0 ? 'text-blue-700 bg-blue-100' : 'text-red-700 bg-red-100'}`}>{avail}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
