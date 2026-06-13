import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, UserCheck, Shield, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Avatar } from '../../components/ui/Avatar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Role } from '../../types';
import type { StaffMember } from '../../types';
import { formatDate } from '../../utils/date';

const roleConfig: Record<string, { label: string; variant: 'red' | 'orange' | 'blue' | 'green' | 'yellow' | 'gray' | 'purple' }> = {
  [Role.SUPER_ADMIN]: { label: 'Super Admin', variant: 'red' },
  [Role.ADMIN]: { label: 'Administrador', variant: 'orange' },
  [Role.MANAGER]: { label: 'Gerente', variant: 'purple' },
  [Role.FRONT_DESK]: { label: 'Recepção', variant: 'blue' },
  [Role.HOUSEKEEPING]: { label: 'Governança', variant: 'green' },
  [Role.MAINTENANCE]: { label: 'Manutenção', variant: 'yellow' },
  [Role.ACCOUNTANT]: { label: 'Financeiro', variant: 'gray' },
};

const mockStaff: StaffMember[] = [
  { id: 'u1', name: 'Ricardo Mendes', email: 'ricardo@hotel.com', role: Role.ADMIN, phone: '(11) 99001-1111', department: 'Administração', isActive: true, createdAt: '2023-01-15T00:00:00Z', updatedAt: '', hireDate: '2023-01-15T00:00:00Z' },
  { id: 'u2', name: 'Fernanda Lima', email: 'fernanda@hotel.com', role: Role.MANAGER, phone: '(11) 99002-2222', department: 'Operações', isActive: true, createdAt: '2023-03-10T00:00:00Z', updatedAt: '', hireDate: '2023-03-10T00:00:00Z' },
  { id: 'u3', name: 'Bruno Carvalho', email: 'bruno@hotel.com', role: Role.FRONT_DESK, phone: '(11) 99003-3333', department: 'Recepção', isActive: true, createdAt: '2023-06-01T00:00:00Z', updatedAt: '', hireDate: '2023-06-01T00:00:00Z' },
  { id: 'u4', name: 'Amanda Rocha', email: 'amanda@hotel.com', role: Role.FRONT_DESK, phone: '(11) 99004-4444', department: 'Recepção', isActive: true, createdAt: '2023-06-15T00:00:00Z', updatedAt: '', hireDate: '2023-06-15T00:00:00Z' },
  { id: 'u5', name: 'Maria Silva', email: 'maria@hotel.com', role: Role.HOUSEKEEPING, phone: '(11) 99005-5555', department: 'Governança', isActive: true, createdAt: '2022-11-20T00:00:00Z', updatedAt: '', hireDate: '2022-11-20T00:00:00Z' },
  { id: 'u6', name: 'Ana Santos', email: 'ana@hotel.com', role: Role.HOUSEKEEPING, phone: '(11) 99006-6666', department: 'Governança', isActive: true, createdAt: '2023-02-01T00:00:00Z', updatedAt: '', hireDate: '2023-02-01T00:00:00Z' },
  { id: 'u7', name: 'Carlos Técnico', email: 'carlos@hotel.com', role: Role.MAINTENANCE, phone: '(11) 99007-7777', department: 'Manutenção', isActive: true, createdAt: '2023-04-15T00:00:00Z', updatedAt: '', hireDate: '2023-04-15T00:00:00Z' },
  { id: 'u8', name: 'Paula Financeiro', email: 'paula@hotel.com', role: Role.ACCOUNTANT, phone: '(11) 99008-8888', department: 'Financeiro', isActive: false, createdAt: '2022-08-01T00:00:00Z', updatedAt: '', hireDate: '2022-08-01T00:00:00Z' },
];

export const StaffList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [newModal, setNewModal] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', email: '', role: Role.FRONT_DESK, phone: '', department: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => mockStaff,
    staleTime: 60000,
    retry: false,
  });

  const staff = (data ?? mockStaff).filter(s =>
    (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())) &&
    (!roleFilter || s.role === roleFilter)
  );

  const deptCounts = mockStaff.reduce((acc, s) => { acc[s.department] = (acc[s.department] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipe</h1>
          <p className="text-sm text-gray-500">Gestão de colaboradores e permissões</p>
        </div>
        <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setNewModal(true)}>Novo Colaborador</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card padding="md">
          <p className="text-sm text-gray-500">Total Colaboradores</p>
          <p className="text-2xl font-bold text-gray-900">{mockStaff.length}</p>
          <p className="text-xs text-green-600 mt-1">{mockStaff.filter(s => s.isActive).length} ativos</p>
        </Card>
        {Object.entries(deptCounts).slice(0, 3).map(([dept, count]) => (
          <Card key={dept} padding="md">
            <p className="text-sm text-gray-500">{dept}</p>
            <p className="text-2xl font-bold text-gray-900">{count}</p>
          </Card>
        ))}
      </div>

      <Card padding="none">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Buscar colaborador..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select options={[{ value: '', label: 'Todos os cargos' }, ...Object.entries(roleConfig).map(([v, c]) => ({ value: v, label: c.label }))]} value={roleFilter} onChange={e => setRoleFilter(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="divide-y divide-gray-50">
            {staff.map(member => {
              const rc = roleConfig[member.role];
              return (
                <div key={member.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50">
                  <Avatar name={member.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">{member.name}</span>
                      <Badge variant={rc.variant} size="sm">{rc.label}</Badge>
                      {!member.isActive && <Badge variant="gray" size="sm">Inativo</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                      <span>{member.email}</span>
                      {member.phone && <span>{member.phone}</span>}
                      {member.department && <span>{member.department}</span>}
                      {member.hireDate && <span>Desde {formatDate(member.hireDate)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" icon={<Shield className="h-4 w-4" />} onClick={() => toast.success('Permissões abertas')} />
                    <Button variant="ghost" size="sm" icon={<Settings className="h-4 w-4" />} onClick={() => toast.success('Editando colaborador')} />
                  </div>
                </div>
              );
            })}
            {staff.length === 0 && <div className="text-center py-12 text-gray-400">Nenhum colaborador encontrado</div>}
          </div>
        )}
      </Card>

      <Modal isOpen={newModal} onClose={() => setNewModal(false)} title="Novo Colaborador" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nome" placeholder="Nome completo" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="E-mail" type="email" placeholder="email@hotel.com" value={newForm.email} onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Cargo" options={Object.entries(roleConfig).map(([v, c]) => ({ value: v, label: c.label }))} value={newForm.role} onChange={e => setNewForm(f => ({ ...f, role: e.target.value as Role }))} />
            <Input label="Departamento" placeholder="Ex: Recepção" value={newForm.department} onChange={e => setNewForm(f => ({ ...f, department: e.target.value }))} />
          </div>
          <Input label="Telefone" placeholder="(11) 99000-0000" value={newForm.phone} onChange={e => setNewForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setNewModal(false)}>Cancelar</Button>
          <Button onClick={() => { toast.success('Colaborador cadastrado!'); setNewModal(false); }}>
            <UserCheck className="h-4 w-4 mr-1" />Cadastrar
          </Button>
        </div>
      </Modal>
    </div>
  );
};
