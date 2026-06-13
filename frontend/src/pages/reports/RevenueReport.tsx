import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const generateRevenueTrend = (days: number) => Array.from({ length: days }, (_, i) => {
  const date = new Date(Date.now() - (days - 1 - i) * 86400000);
  return {
    date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    hospedagem: 4000 + Math.random() * 2000,
    servicos: 500 + Math.random() * 800,
    fb: 300 + Math.random() * 500,
  };
});

const channelRevenue = [
  { name: 'Booking.com', value: 58420, color: '#3b82f6' },
  { name: 'Site Próprio', value: 91300, color: '#10b981' },
  { name: 'Expedia', value: 34100, color: '#f59e0b' },
  { name: 'Airbnb', value: 28900, color: '#ef4444' },
  { name: 'Direto', value: 21600, color: '#8b5cf6' },
];

const totalChannel = channelRevenue.reduce((s, c) => s + c.value, 0);

export const RevenueReport: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('30d');
  const days = period === '7d' ? 7 : period === '14d' ? 14 : 30;
  const trend = generateRevenueTrend(days);
  const totalRevenue = trend.reduce((s, d) => s + d.hospedagem + d.servicos + d.fb, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/reports')} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatório de Receita</h1>
            <p className="text-sm text-gray-500">Análise de receita por categoria e canal</p>
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
          { label: 'Receita Total', value: formatCurrency(totalRevenue), color: 'text-gray-900' },
          { label: 'Hospedagem', value: formatCurrency(trend.reduce((s, d) => s + d.hospedagem, 0)), color: 'text-blue-600' },
          { label: 'Serviços', value: formatCurrency(trend.reduce((s, d) => s + d.servicos, 0)), color: 'text-green-600' },
          { label: 'F&B', value: formatCurrency(trend.reduce((s, d) => s + d.fb, 0)), color: 'text-purple-600' },
        ].map(k => (
          <Card key={k.label} padding="md">
            <p className="text-sm text-gray-500">{k.label}</p>
            <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card padding="md">
          <Card.Header title="Receita Diária por Categoria" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trend.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="hospedagem" stackId="a" fill="#3b82f6" name="Hospedagem" />
              <Bar dataKey="servicos" stackId="a" fill="#10b981" name="Serviços" />
              <Bar dataKey="fb" stackId="a" fill="#8b5cf6" name="F&B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card padding="md">
          <Card.Header title="Receita por Canal" />
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={channelRevenue} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" nameKey="name">
                {channelRevenue.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [formatCurrency(v), 'Receita']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {channelRevenue.map(c => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-gray-700">{c.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">{((c.value / totalChannel) * 100).toFixed(1)}%</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(c.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
