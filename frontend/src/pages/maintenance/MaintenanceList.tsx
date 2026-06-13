import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { MaintenanceStatus, MaintenancePriority } from '../../types';
import type { MaintenanceRequest } from '../../types';
import { formatDateTime } from '../../utils/date';
import { cn } from '../../utils/cn';

const mockRequests: MaintenanceRequest[] = [
  { id: 'm1', propertyId: 'p1', roomId: 'r101', room: { id: 'r101', number: '101', floor: 1 } as never, title: 'Ar-condicionado não funciona', description: 'O ar-condicionado do quarto apresenta barulho e não resfria adequadamente', status: MaintenanceStatus.OPEN, priority: MaintenancePriority.HIGH, reportedById: 'u1', reportedBy: { id: 'u1', name: 'Front Desk', email: '' } as never, createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'm2', propertyId: 'p1', roomId: 'r201', room: { id: 'r201', number: '201', floor: 2 } as never, title: 'Torneira com vazamento', description: 'Torneira do banheiro com vazamento constante', status: MaintenanceStatus.IN_PROGRESS, priority: MaintenancePriority.URGENT, reportedById: 'u2', reportedBy: { id: 'u2', name: 'Governança', email: '' } as never, assignedToId: 'u3', assignedTo: { id: 'u3', name: 'Carlos Técnico', email: '' } as never, createdAt: new Date(Date.now() - 5 * 3600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'm3', propertyId: 'p1', roomId: 'r301', room: { id: 'r301', number: '301', floor: 3 } as never, title: 'TV sem sinal', description: 'Televisão não recebe sinal de cabo', status: MaintenanceStatus.OPEN, priority: MaintenancePriority.MEDIUM, reportedById: 'u1', reportedBy: { id: 'u1', name: 'Front Desk', email: '' } as never, createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'm4', propertyId: 'p1', roomId: 'r102', room: { id: 'r102', number: '102', floor: 1 } as never, title: 'Lâmpada queimada', description: 'Lâmpada do banheiro precisa de troca', status: MaintenanceStatus.COMPLETED, priority: MaintenancePriority.LOW, reportedById: 'u2', reportedBy: { id: 'u2', name: 'Governança', email: '' } as never, assignedToId: 'u3', assignedTo: { id: 'u3', name: 'Carlos Técnico', email: '' } as never, completedAt: new Date(Date.now() - 3600000).toISOString(), createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'm5', propertyId: 'p1', title: 'Elevador com trepidação', description: 'Elevador principal apresenta trepidação ao parar', status: MaintenanceStatus.IN_PROGRESS, priority: MaintenancePriority.URGENT, reportedById: 'u1', reportedBy: { id: 'u1', name: 'Segurança', email: '' } as never, assignedToId: 'u4', assignedTo: { id: 'u4', name: 'Manutenção Externa', email: '' } as never, createdAt: new Date(Date.now() - 6 * 3600000).toISOString(), updatedAt: new Date().toISOString() },
];

const statusConfig: Record<string, { label: string; variant: 'yellow' | 'blue' | 'green' | 'gray'; icon: React.ReactNode }> = {
  [MaintenanceStatus.OPEN]: { label: 'Aberto', variant: 'yellow', icon: <Clock className="h-3.5 w-3.5" /> },
  [MaintenanceStatus.IN_PROGRESS]: { label: 'Em Andamento', variant: 'blue', icon: <Wrench className="h-3.5 w-3.5" /> },
  [MaintenanceStatus.COMPLETED]: { label: 'Concluído', variant: 'green', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  [MaintenanceStatus.CANCELLED]: { label: 'Cancelado', variant: 'gray', icon: null },
};

const priorityConfig: Record<string, { label: string; variant: 'red' | 'orange' | 'yellow' | 'gray' }> = {
  [MaintenancePriority.URGENT]: { label: 'Urgente', variant: 'red' },
  [MaintenancePriority.HIGH]: { label: 'Alta', variant: 'orange' },
  [MaintenancePriority.MEDIUM]: { label: 'Média', variant: 'yellow' },
  [MaintenancePriority.LOW]: { label: 'Baixa', variant: 'gray' },
};

export const MaintenanceList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [newModal, setNewModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState<MaintenanceRequest | null>(null);
  const [newForm, setNewForm] = useState({ title: '', description: '', priority: MaintenancePriority.MEDIUM, room: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => mockRequests,
    staleTime: 30000,
    retry: false,
  });

  const requests = (data ?? mockRequests).filter(r =>
    (!search || r.title.toLowerCase().includes(search.toLowerCase()) || r.room?.number?.includes(search)) &&
    (!statusFilter || r.status === statusFilter) &&
    (!priorityFilter || r.priority === priorityFilter)
  );

  const counts = { open: mockRequests.filter(r => r.status === MaintenanceStatus.OPEN).length, inProgress: mockRequests.filter(r => r.status === MaintenanceStatus.IN_PROGRESS).length, completed: mockRequests.filter(r => r.status === MaintenanceStatus.COMPLETED).length };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manutenção</h1>
          <p className="text-sm text-gray-500">Gestão de ordens de manutenção</p>
        </div>
        <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setNewModal(true)}>Nova Ordem</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Abertas', count: counts.open, color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: <AlertTriangle className="h-5 w-5 text-yellow-600" /> }, { label: 'Em Andamento', count: counts.inProgress, color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <Wrench className="h-5 w-5 text-blue-600" /> }, { label: 'Concluídas', count: counts.completed, color: 'text-green-600 bg-green-50 border-green-200', icon: <CheckCircle className="h-5 w-5 text-green-600" /> }].map(s => (
          <div key={s.label} className={cn('border rounded-xl p-4 flex items-center gap-3', s.color)}>
            {s.icon}
            <div>
              <p className="text-xs font-semibold">{s.label}</p>
              <p className="text-2xl font-bold">{s.count}</p>
            </div>
          </div>
        ))}
      </div>

      <Card padding="none">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select options={[{ value: '', label: 'Todos os status' }, ...Object.entries(statusConfig).map(([v, c]) => ({ value: v, label: c.label }))]} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} />
          <Select options={[{ value: '', label: 'Todas prioridades' }, ...Object.entries(priorityConfig).map(([v, c]) => ({ value: v, label: c.label }))]} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="divide-y divide-gray-50">
            {requests.map(req => {
              const sc = statusConfig[req.status];
              const pc = priorityConfig[req.priority];
              return (
                <div key={req.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50/50 cursor-pointer" onClick={() => setSelectedReq(req)}>
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', req.priority === MaintenancePriority.URGENT ? 'bg-red-100 text-red-600' : req.priority === MaintenancePriority.HIGH ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600')}>
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">{req.title}</span>
                      <Badge variant={sc.variant} size="sm">{sc.label}</Badge>
                      <Badge variant={pc.variant} size="sm">{pc.label}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{req.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {req.room && <span>Quarto {req.room.number}</span>}
                      <span>Reportado por {req.reportedBy?.name}</span>
                      {req.assignedTo && <span>Responsável: {req.assignedTo.name}</span>}
                      <span>{formatDateTime(req.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {requests.length === 0 && <div className="text-center py-12 text-gray-400">Nenhuma ordem encontrada</div>}
          </div>
        )}
      </Card>

      {selectedReq && (
        <Modal isOpen={!!selectedReq} onClose={() => setSelectedReq(null)} title={selectedReq.title} size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Status:</span> <Badge variant={statusConfig[selectedReq.status].variant} size="sm">{statusConfig[selectedReq.status].label}</Badge></div>
              <div><span className="text-gray-500">Prioridade:</span> <Badge variant={priorityConfig[selectedReq.priority].variant} size="sm">{priorityConfig[selectedReq.priority].label}</Badge></div>
              {selectedReq.room && <div><span className="text-gray-500">Quarto:</span> <span className="font-semibold"> {selectedReq.room.number}</span></div>}
              <div><span className="text-gray-500">Reportado por:</span> <span className="font-semibold"> {selectedReq.reportedBy?.name}</span></div>
              {selectedReq.assignedTo && <div className="col-span-2"><span className="text-gray-500">Responsável:</span> <span className="font-semibold"> {selectedReq.assignedTo.name}</span></div>}
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">{selectedReq.description}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {selectedReq.status === MaintenanceStatus.OPEN && <Button size="sm" onClick={() => { toast.success('Ordem iniciada!'); setSelectedReq(null); }}>Iniciar</Button>}
              {selectedReq.status === MaintenanceStatus.IN_PROGRESS && <Button size="sm" variant="success" onClick={() => { toast.success('Ordem concluída!'); setSelectedReq(null); }}>Concluir</Button>}
              <Button size="sm" variant="outline" onClick={() => setSelectedReq(null)}>Fechar</Button>
            </div>
          </div>
        </Modal>
      )}

      <Modal isOpen={newModal} onClose={() => setNewModal(false)} title="Nova Ordem de Manutenção" size="md">
        <div className="space-y-4">
          <Input label="Título" placeholder="Descreva o problema..." value={newForm.title} onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))} />
          <Input label="Descrição" placeholder="Detalhes do problema..." value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Quarto (opcional)" placeholder="Ex: 101" value={newForm.room} onChange={e => setNewForm(f => ({ ...f, room: e.target.value }))} />
            <Select label="Prioridade" options={Object.entries(priorityConfig).map(([v, c]) => ({ value: v, label: c.label }))} value={newForm.priority} onChange={e => setNewForm(f => ({ ...f, priority: e.target.value as MaintenancePriority }))} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setNewModal(false)}>Cancelar</Button>
          <Button onClick={() => { toast.success('Ordem criada!'); setNewModal(false); }}>Criar Ordem</Button>
        </div>
      </Modal>
    </div>
  );
};
