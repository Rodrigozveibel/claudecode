import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Calendar, Settings, DollarSign, Percent, BarChart3 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatCurrency } from '../../utils/format';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const mockRevenueTrend = Array.from({ length: 14 }, (_, i) => {
  const date = new Date(Date.now() - (13 - i) * 86400000);
  return {
    date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    adr: 280 + Math.random() * 100,
    revpar: 200 + Math.random() * 80,
    occupancy: 65 + Math.random() * 25,
  };
});

const mockRoomTypePerf = [
  { name: 'Standard', adr: 199.90, occupancy: 85, revpar: 169.91, revenue: 15290 },
  { name: 'Deluxe', adr: 349.90, occupancy: 72, revpar: 251.93, revenue: 22674 },
  { name: 'Suíte Executiva', adr: 599.90, occupancy: 58, revpar: 347.94, revenue: 17397 },
  { name: 'Cobertura', adr: 999.90, occupancy: 40, revpar: 399.96, revenue: 7999 },
];

const mockKPIs = {
  adr: 324.50, adrChange: 8.3,
  revpar: 231.20, revparChange: 12.1,
  occupancy: 71.2, occupancyChange: 3.5,
  totalRevenue: 63360, revenueChange: 15.8,
};

export const RevenueManagement: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('14d');

  const { data, isLoading } = useQuery({
    queryKey: ['revenue', period],
    queryFn: async () => ({ trend: mockRevenueTrend, roomTypes: mockRoomTypePerf, kpis: mockKPIs }),
    staleTime: 60000,
    retry: false,
  });

  const kpis = data?.kpis ?? mockKPIs;
  const trend = data?.trend ?? mockRevenueTrend;
  const roomTypes = data?.roomTypes ?? mockRoomTypePerf;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Management</h1>
          <p className="text-sm text-gray-500">Análise e otimização de receitas</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {[{ v: '7d', l: '7 dias' }, { v: '14d', l: '14 dias' }, { v: '30d', l: '30 dias' }].map(opt => (
              <button key={opt.v} onClick={() => setPeriod(opt.v)} className={`px-3 py-1.5 text-sm font-medium transition-colors ${period === opt.v ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>{opt.l}</button>
            ))}
          </div>
          <Button variant="outline" size="sm" icon={<Calendar className="h-4 w-4" />} onClick={() => navigate('/revenue/calendar')}>Calendário de Tarifas</Button>
          <Button size="sm" icon={<Settings className="h-4 w-4" />} onClick={() => navigate('/revenue/rules')}>Regras de Tarifas</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'ADR', value: formatCurrency(kpis.adr), change: kpis.adrChange, icon: <DollarSign className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50' },
              { label: 'RevPAR', value: formatCurrency(kpis.revpar), change: kpis.revparChange, icon: <TrendingUp className="h-5 w-5 text-green-600" />, bg: 'bg-green-50' },
              { label: 'Ocupação', value: `${kpis.occupancy.toFixed(1)}%`, change: kpis.occupancyChange, icon: <Percent className="h-5 w-5 text-purple-600" />, bg: 'bg-purple-50' },
              { label: 'Receita Total', value: formatCurrency(kpis.totalRevenue), change: kpis.revenueChange, icon: <BarChart3 className="h-5 w-5 text-orange-600" />, bg: 'bg-orange-50' },
            ].map(kpi => (
              <Card key={kpi.label} padding="md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{kpi.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>{kpi.icon}</div>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs font-semibold text-green-600">+{kpi.change}%</span>
                  <span className="text-xs text-gray-400">vs período anterior</span>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Card padding="md">
              <Card.Header title="ADR & RevPAR (diário)" />
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="adr" stroke="#3b82f6" fill="#eff6ff" name="ADR" />
                  <Area type="monotone" dataKey="revpar" stroke="#10b981" fill="#ecfdf5" name="RevPAR" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card padding="md">
              <Card.Header title="Taxa de Ocupação (%)" />
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  <Bar dataKey="occupancy" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Ocupação" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card padding="none">
            <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Performance por Tipo de Quarto</h3></div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Tipo</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">ADR</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Ocupação</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">RevPAR</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Receita</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {roomTypes.map(rt => (
                    <tr key={rt.name} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{rt.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-700 text-right">{formatCurrency(rt.adr)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${rt.occupancy}%` }} />
                          </div>
                          <span className="text-sm text-gray-700 w-10">{rt.occupancy}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700 text-right">{formatCurrency(rt.revpar)}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(rt.revenue)}</td>
                      <td className="px-5 py-3 text-right">
                        <Badge variant={rt.occupancy >= 80 ? 'green' : rt.occupancy >= 60 ? 'blue' : 'yellow'} size="sm">
                          {rt.occupancy >= 80 ? 'Alto' : rt.occupancy >= 60 ? 'Médio' : 'Baixo'}
                        </Badge>
                      </td>
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
