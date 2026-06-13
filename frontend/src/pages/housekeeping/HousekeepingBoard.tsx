import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Sparkles, Clock, CheckCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { HousekeepingStatus, HousekeepingType, Priority } from '../../types';
import type { HousekeepingTask } from '../../types';
import { formatDate, formatDateTime } from '../../utils/date';
import { cn } from '../../utils/cn';

const mockTasks: HousekeepingTask[] = [
  { id: 't1', propertyId: 'p1', roomId: 'r101', room: { id: 'r101', number: '101', floor: 1, status: 'dirty' as never, roomTypeId: 'rt1', propertyId: 'p1', isActive: true, createdAt: '', updatedAt: '' }, type: HousekeepingType.CHECKOUT, status: HousekeepingStatus.PENDING, priority: Priority.HIGH, scheduledDate: new Date().toISOString(), assignedTo: { id: 'u1', name: 'Maria Silva', email: '', role: 'housekeeping' as never, isActive: true, createdAt: '', updatedAt: '' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 't2', propertyId: 'p1', roomId: 'r201', room: { id: 'r201', number: '201', floor: 2, status: 'dirty' as never, roomTypeId: 'rt2', propertyId: 'p1', isActive: true, createdAt: '', updatedAt: '' }, type: HousekeepingType.STAYOVER, status: HousekeepingStatus.IN_PROGRESS, priority: Priority.MEDIUM, scheduledDate: new Date().toISOString(), assignedTo: { id: 'u2', name: 'Ana Santos', email: '', role: 'housekeeping' as never, isActive: true, createdAt: '', updatedAt: '' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 't3', propertyId: 'p1', roomId: 'r301', room: { id: 'r301', number: '301', floor: 3, status: 'cleaning' as never, roomTypeId: 'rt3', propertyId: 'p1', isActive: true, createdAt: '', updatedAt: '' }, type: HousekeepingType.CHECKOUT, status: HousekeepingStatus.COMPLETED, priority: Priority.URGENT, scheduledDate: new Date().toISOString(), completedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 't4', propertyId: 'p1', roomId: 'r102', room: { id: 'r102', number: '102', floor: 1, status: 'inspected' as never, roomTypeId: 'rt1', propertyId: 'p1', isActive: true, createdAt: '', updatedAt: '' }, type: HousekeepingType.DEEP_CLEAN, status: HousekeepingStatus.INSPECTED, priority: Priority.LOW, scheduledDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 't5', propertyId: 'p1', roomId: 'r202', room: { id: 'r202', number: '202', floor: 2, status: 'dirty' as never, roomTypeId: 'rt2', propertyId: 'p1', isActive: true, createdAt: '', updatedAt: '' }, type: HousekeepingType.STAYOVER, status: HousekeepingStatus.PENDING, priority: Priority.MEDIUM, scheduledDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 't6', propertyId: 'p1', roomId: 'r401', room: { id: 'r401', number: '401', floor: 4, status: 'dirty' as never, roomTypeId: 'rt4', propertyId: 'p1', isActive: true, createdAt: '', updatedAt: '' }, type: HousekeepingType.TURNDOWN, status: HousekeepingStatus.PENDING, priority: Priority.LOW, scheduledDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const typeLabels: Record<string, string> = {
  [HousekeepingType.CHECKOUT]: 'Limpeza Checkout', [HousekeepingType.STAYOVER]: 'Limpeza Estadia',
  [HousekeepingType.DEEP_CLEAN]: 'Limpeza Profunda', [HousekeepingType.TURNDOWN]: 'Turndown',
};

const priorityConfig: Record<string, { label: string; variant: 'red' | 'orange' | 'yellow' | 'gray' }> = {
  [Priority.URGENT]: { label: 'Urgente', variant: 'red' },
  [Priority.HIGH]: { label: 'Alta', variant: 'orange' },
  [Priority.MEDIUM]: { label: 'Média', variant: 'yellow' },
  [Priority.LOW]: { label: 'Baixa', variant: 'gray' },
};

const columns = [
  { status: HousekeepingStatus.PENDING, label: 'Pendente', icon: <Clock className="h-4 w-4 text-yellow-500" />, bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { status: HousekeepingStatus.IN_PROGRESS, label: 'Em Andamento', icon: <Sparkles className="h-4 w-4 text-blue-500" />, bg: 'bg-blue-50', border: 'border-blue-200' },
  { status: HousekeepingStatus.COMPLETED, label: 'Concluído', icon: <CheckCircle className="h-4 w-4 text-green-500" />, bg: 'bg-green-50', border: 'border-green-200' },
  { status: HousekeepingStatus.INSPECTED, label: 'Inspecionado', icon: <CheckCircle className="h-4 w-4 text-purple-500" />, bg: 'bg-purple-50', border: 'border-purple-200' },
];

const TaskCard: React.FC<{ task: HousekeepingTask; onClick: () => void }> = ({ task, onClick }) => {
  const p = priorityConfig[task.priority];
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-bold text-gray-900">Quarto {task.room?.number}</span>
        <Badge variant={p.variant} size="sm">{p.label}</Badge>
      </div>
      <p className="text-xs text-gray-600 mb-2">{typeLabels[task.type] ?? task.type}</p>
      {task.assignedTo && (
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">{task.assignedTo.name[0]}</div>
          <span className="text-xs text-gray-500">{task.assignedTo.name}</span>
        </div>
      )}
      {task.completedAt && <p className="text-xs text-gray-400 mt-1">Concluído {formatDateTime(task.completedAt)}</p>}
    </div>
  );
};

export const HousekeepingBoard: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null);
  const [newTaskModal, setNewTaskModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['housekeeping', selectedDate],
    queryFn: async () => mockTasks,
    staleTime: 30000,
  });

  const tasks = data ?? mockTasks;

  const getTasksByStatus = (status: HousekeepingStatus) => tasks.filter(t => t.status === status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Governança</h1>
          <p className="text-sm text-gray-500">Gestão de limpeza e tarefas</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={() => refetch()}>Atualizar</Button>
          <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setNewTaskModal(true)}>Nova Tarefa</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {columns.map(col => (
          <div key={col.status} className={cn('rounded-xl border p-3 text-center', col.bg, col.border)}>
            <div className="flex items-center justify-center gap-1 mb-1">{col.icon}<span className="text-xs font-semibold text-gray-700">{col.label}</span></div>
            <span className="text-2xl font-bold text-gray-900">{getTasksByStatus(col.status).length}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {columns.map(col => (
            <div key={col.status}>
              <div className={cn('rounded-t-lg border-b-0 border px-4 py-3 flex items-center gap-2', col.bg, col.border)}>
                {col.icon}
                <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                <span className="ml-auto bg-white rounded-full px-2 py-0.5 text-xs font-bold text-gray-700">{getTasksByStatus(col.status).length}</span>
              </div>
              <div className={cn('rounded-b-lg border border-t-0 min-h-[300px] p-2 space-y-2', col.border, col.bg)}>
                {getTasksByStatus(col.status).map(task => (
                  <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                ))}
                {getTasksByStatus(col.status).length === 0 && (
                  <div className="text-center text-xs text-gray-400 py-8">Nenhuma tarefa</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <Modal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} title={`Quarto ${selectedTask.room?.number} — ${typeLabels[selectedTask.type]}`} size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Status:</span> <Badge variant={selectedTask.status === HousekeepingStatus.COMPLETED ? 'green' : 'yellow'} size="sm">{selectedTask.status}</Badge></div>
              <div><span className="text-gray-500">Prioridade:</span> <Badge variant={priorityConfig[selectedTask.priority].variant} size="sm">{priorityConfig[selectedTask.priority].label}</Badge></div>
              {selectedTask.assignedTo && <div className="col-span-2"><span className="text-gray-500">Atribuído a:</span> <span className="font-semibold"> {selectedTask.assignedTo.name}</span></div>}
              {selectedTask.notes && <div className="col-span-2"><span className="text-gray-500">Notas:</span> <span>{selectedTask.notes}</span></div>}
            </div>
            <div className="border-t pt-3 flex gap-2 flex-wrap">
              {selectedTask.status === HousekeepingStatus.PENDING && <Button size="sm" onClick={() => { toast.success('Tarefa iniciada!'); setSelectedTask(null); }}>Iniciar</Button>}
              {selectedTask.status === HousekeepingStatus.IN_PROGRESS && <Button size="sm" variant="success" onClick={() => { toast.success('Limpeza concluída!'); setSelectedTask(null); }}>Concluir</Button>}
              {selectedTask.status === HousekeepingStatus.COMPLETED && <Button size="sm" onClick={() => { toast.success('Quarto inspecionado!'); setSelectedTask(null); }}>Aprovar Inspeção</Button>}
              <Button size="sm" variant="outline" onClick={() => setSelectedTask(null)}>Fechar</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* New Task Modal */}
      <Modal isOpen={newTaskModal} onClose={() => setNewTaskModal(false)} title="Nova Tarefa de Limpeza" size="md">
        <div className="space-y-4">
          <Select label="Quarto" options={[{ value: 'r101', label: 'Quarto 101' }, { value: 'r201', label: 'Quarto 201' }, { value: 'r301', label: 'Quarto 301' }]} />
          <Select label="Tipo de Limpeza" options={Object.entries(typeLabels).map(([v, l]) => ({ value: v, label: l }))} />
          <Select label="Prioridade" options={[{ value: Priority.LOW, label: 'Baixa' }, { value: Priority.MEDIUM, label: 'Média' }, { value: Priority.HIGH, label: 'Alta' }, { value: Priority.URGENT, label: 'Urgente' }]} />
          <Input label="Data Programada" type="date" defaultValue={selectedDate} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setNewTaskModal(false)}>Cancelar</Button>
          <Button onClick={() => { toast.success('Tarefa criada!'); setNewTaskModal(false); }}>Criar Tarefa</Button>
        </div>
      </Modal>
    </div>
  );
};
