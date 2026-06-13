import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/format';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const generateTrend = (days: number) => Array.from({ length: days }, (_, i) => {
  const date = new Date(Date.now() - (days - 1 - i) * 86400000);
  return {
    date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    standard: 70 + Math.random() * 25,
    deluxe: 60 + Math.random() * 30,
    suite: 45 + Math.random() * 35,
    total: 65 + Math.random() * 25,
  };
});

const mockRoomTypeData = [
  { name: 'Standard', rooms: 20, occupied: 17, occupancy: 85, adr: 199.90, revpar: 169.91 },
  { name: 'Deluxe', rooms: 12, occupied: 9, occupancy: 72, adr: 349.90, revpar: 251.93 },
  { name: 'Suíte Executiva', rooms: 6, occupied: 4, occupancy: 58, adr: 599.90, revpar: 347.94 },
  { name: 'Cobertura', rooms: 4, occupied: 2, occupancy: 40, adr: 999.90, revpar: 399.96 },
];

export const OccupancyReport: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('30d');
  const days = period === '7d' ? 7 : period === '14d' ? 14 : 30;
  const trend = generateTrend(days);
  const avgOccupancy = (trend.reduce((s, d) => s + d.total, 0) / trend.length).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/reports')} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatório de Ocupação</h1>
            <p className="text-sm text-gray-500">Taxa de ocupação por período e tipo de quarto</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {[{ v: '7d', l: '7d' }, { v: '14d', l: '14d' }, { v: '30d', l: '30d' }].map(o => (
              <button key={o.v} onClick={() => setPeriod(o.v)} className={`px-3 py-1.5 text-sm font-medium ${period === o.v ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>{o.l}</button>
            ))}
          </div>
          <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />}>Exportar</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Ocupação Média', value: `${avgOccupancy}%`, color: 'text-blue-600' },
          { label: 'Total Quartos', value: '42', color: 'text-gray-900' },
          { label: 'ADR Médio', value: formatCurrency(324.50), color: 'text-green-600' },
          { label: 'RevPAR', value: formatCurrency(231.00), color: 'text-purple-600' },
        ].map(k => (
          <Card key={k.label} padding="md">
            <p className="text-sm text-gray-500">{k.label}</p>
            <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </Card>
        ))}
      </div>

      <Card padding="md">
        <Card.Header title="Evolução da Ocupação (%)" />
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
            <Legend />
            <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="#eff6ff" name="Total" />
            <Area type="monotone" dataKey="standard" stroke="#10b981" fill="#ecfdf5" name="Standard" />
            <Area type="monotone" dataKey="deluxe" stroke="#8b5cf6" fill="#f5f3ff" name="Deluxe" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card padding="none">
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Por Tipo de Quarto</h3></div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                {['Tipo', 'Total', 'Ocupados', 'Ocupação', 'ADR', 'RevPAR'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mockRoomTypeData.map(rt => (
                <tr key={rt.name} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{rt.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{rt.rooms}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{rt.occupied}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${rt.occupancy >= 80 ? 'bg-green-500' : rt.occupancy >= 60 ? 'bg-blue-500' : 'bg-yellow-500'}`} style={{ width: `${rt.occupancy}%` }} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{rt.occupancy}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700">{formatCurrency(rt.adr)}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-900">{formatCurrency(rt.revpar)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
