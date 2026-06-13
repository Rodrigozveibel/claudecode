import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, TrendingUp, BedDouble, Download, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/format';

const reportCards = [
  { title: 'Relatório de Ocupação', description: 'Taxa de ocupação, RevPAR, ADR por período e tipo de quarto', icon: <BedDouble className="h-6 w-6 text-blue-600" />, bg: 'bg-blue-50', path: '/reports/occupancy', stats: [{ label: 'Ocupação Média', value: '71.2%' }, { label: 'ADR', value: 'R$ 324,50' }] },
  { title: 'Relatório de Receita', description: 'Receita total, por canal, por tipo de quarto e tendências', icon: <TrendingUp className="h-6 w-6 text-green-600" />, bg: 'bg-green-50', path: '/reports/revenue', stats: [{ label: 'Receita Mensal', value: 'R$ 63.360' }, { label: 'vs mês anterior', value: '+15.8%' }] },
  { title: 'Relatório de Hóspedes', description: 'Perfil, origem, frequência e métricas de fidelidade', icon: <Users className="h-6 w-6 text-purple-600" />, bg: 'bg-purple-50', path: '/reports/guests', stats: [{ label: 'Novos Hóspedes', value: '48' }, { label: 'Recorrentes', value: '32%' }] },
  { title: 'Relatório Gerencial', description: 'Visão consolidada para tomada de decisão', icon: <BarChart3 className="h-6 w-6 text-orange-600" />, bg: 'bg-orange-50', path: '/reports', stats: [{ label: 'Satisfação', value: '4.7/5' }, { label: 'NPS', value: '72' }] },
];

const quickStats = [
  { label: 'Check-ins hoje', value: '8', change: '+2 vs ontem' },
  { label: 'Check-outs hoje', value: '6', change: '-1 vs ontem' },
  { label: 'Ocupação hoje', value: '73%', change: '+3% vs ontem' },
  { label: 'Receita hoje', value: formatCurrency(12400), change: '+8% vs ontem' },
  { label: 'Reservas pendentes', value: '14', change: '' },
  { label: 'Tarefas governança', value: '9', change: '3 urgentes' },
];

export const Reports: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios & Analytics</h1>
          <p className="text-sm text-gray-500">Análises e métricas operacionais</p>
        </div>
        <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />}>Exportar PDF</Button>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {quickStats.map(s => (
          <Card key={s.label} padding="md">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{s.value}</p>
            {s.change && <p className="text-xs text-green-600 mt-0.5">{s.change}</p>}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {reportCards.map(rc => (
          <Card key={rc.title} padding="md" className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(rc.path)}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${rc.bg} flex items-center justify-center flex-shrink-0`}>{rc.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{rc.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{rc.description}</p>
                <div className="flex items-center gap-4 mt-3">
                  {rc.stats.map(s => (
                    <div key={s.label}>
                      <p className="text-xs text-gray-400">{s.label}</p>
                      <p className="text-sm font-bold text-gray-900">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
