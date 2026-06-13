import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const nationalityData = [
  { name: 'Brasil', value: 142, color: '#10b981' },
  { name: 'Argentina', value: 48, color: '#3b82f6' },
  { name: 'EUA', value: 35, color: '#f59e0b' },
  { name: 'Portugal', value: 28, color: '#8b5cf6' },
  { name: 'Outros', value: 47, color: '#6b7280' },
];

const sourceData = [
  { month: 'Jan', novos: 45, recorrentes: 18 },
  { month: 'Fev', novos: 38, recorrentes: 22 },
  { month: 'Mar', novos: 52, recorrentes: 30 },
  { month: 'Abr', novos: 41, recorrentes: 25 },
  { month: 'Mai', novos: 60, recorrentes: 35 },
  { month: 'Jun', novos: 48, recorrentes: 29 },
];

const topGuests = [
  { name: 'Carlos Oliveira', stays: 12, spent: 28400, points: 2840, nationality: 'Brasileiro', lastStay: '2024-12-01' },
  { name: 'Maria Santos', stays: 8, spent: 18900, points: 1890, nationality: 'Brasileira', lastStay: '2024-11-28' },
  { name: 'João Silva', stays: 6, spent: 15200, points: 1520, nationality: 'Português', lastStay: '2024-12-05' },
  { name: 'Ana Costa', stays: 5, spent: 12800, points: 1280, nationality: 'Argentina', lastStay: '2024-11-20' },
  { name: 'Robert Johnson', stays: 4, spent: 11000, points: 1100, nationality: 'Americano', lastStay: '2024-12-03' },
];

export const GuestReport: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('6m');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/reports')} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatório de Hóspedes</h1>
            <p className="text-sm text-gray-500">Perfil, origem e métricas de fidelidade</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {[{ v: '3m', l: '3 meses' }, { v: '6m', l: '6 meses' }, { v: '1y', l: '1 ano' }].map(o => (
              <button key={o.v} onClick={() => setPeriod(o.v)} className={`px-3 py-1.5 text-sm font-medium ${period === o.v ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>{o.l}</button>
            ))}
          </div>
          <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />}>Exportar</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total de Hóspedes', value: '300', sub: '+48 novos este mês' },
          { label: 'Taxa de Retorno', value: '32%', sub: 'Última análise' },
          { label: 'Ticket Médio', value: formatCurrency(1890), sub: 'Por estadia' },
          { label: 'Pontos de Fidelidade', value: '48.250', sub: 'Em circulação' },
        ].map(k => (
          <Card key={k.label} padding="md">
            <p className="text-sm text-gray-500">{k.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{k.value}</p>
            <p className="text-xs text-green-600 mt-0.5">{k.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card padding="md">
          <Card.Header title="Novos vs Recorrentes (mensal)" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sourceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="novos" fill="#3b82f6" name="Novos" radius={[4, 4, 0, 0]} />
              <Bar dataKey="recorrentes" fill="#10b981" name="Recorrentes" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card padding="md">
          <Card.Header title="Origem (Nacionalidade)" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={nationalityData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                {nationalityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card padding="none">
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Top Hóspedes por Gasto</h3></div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                {['#', 'Hóspede', 'Estadias', 'Total Gasto', 'Pontos', 'Origem', 'Última Estadia'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topGuests.map((g, i) => (
                <tr key={g.name} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3"><span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{i + 1}</span></td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{g.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{g.stays}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-900">{formatCurrency(g.spent)}</td>
                  <td className="px-5 py-3"><Badge variant="blue" size="sm">{g.points.toLocaleString()} pts</Badge></td>
                  <td className="px-5 py-3 text-sm text-gray-500">{g.nationality}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{g.lastStay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
