import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, Star } from 'lucide-react';
import { guestsApi } from '../../api/guests';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Pagination } from '../../components/ui/Pagination';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { Guest } from '../../types';
import { formatDate } from '../../utils/date';
import { formatCurrency } from '../../utils/format';

const mockGuests: Guest[] = Array.from({ length: 20 }, (_, i) => ({
  id: `g-${i + 1}`,
  firstName: ['Carlos', 'Maria', 'João', 'Ana', 'Pedro', 'Lucia', 'Roberto', 'Fernanda', 'Marcos', 'Juliana'][i % 10],
  lastName: ['Oliveira', 'Santos', 'Silva', 'Costa', 'Ferreira', 'Alves', 'Rodrigues', 'Lima', 'Souza', 'Martins'][i % 10],
  email: `guest${i + 1}@email.com`,
  phone: `(11) 9${String(9000 + i).padStart(4, '0')}-${String(1000 + i).padStart(4, '0')}`,
  nationality: ['Brasileiro', 'Americano', 'Argentino', 'Português', 'Espanhol'][i % 5],
  vipLevel: i % 4,
  totalStays: Math.floor(Math.random() * 20) + 1,
  totalSpent: (Math.floor(Math.random() * 50) + 5) * 500,
  createdAt: new Date(Date.now() - i * 30 * 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
}));

const nationalityOptions = [
  { value: '', label: 'Todas as nacionalidades' },
  { value: 'Brasileiro', label: 'Brasileiro' },
  { value: 'Americano', label: 'Americano' },
  { value: 'Argentino', label: 'Argentino' },
  { value: 'Português', label: 'Português' },
  { value: 'Espanhol', label: 'Espanhol' },
];

const vipOptions = [
  { value: '', label: 'Todos os níveis VIP' },
  { value: '0', label: 'Sem VIP' },
  { value: '1', label: 'VIP Bronze' },
  { value: '2', label: 'VIP Prata' },
  { value: '3', label: 'VIP Ouro' },
];

const vipConfig: Record<number, { label: string; variant: 'gray' | 'orange' | 'default' | 'warning' }> = {
  0: { label: '-', variant: 'gray' },
  1: { label: 'Bronze', variant: 'orange' },
  2: { label: 'Prata', variant: 'default' },
  3: { label: 'Ouro', variant: 'warning' },
};

export const GuestList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [nationalityFilter, setNationalityFilter] = useState('');
  const [vipFilter, setVipFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['guests', page, search, nationalityFilter, vipFilter],
    queryFn: () =>
      guestsApi.getGuests({
        page,
        limit: 15,
        search,
        nationality: nationalityFilter || undefined,
        vipLevel: vipFilter ? Number(vipFilter) : undefined,
      }),
    retry: false,
    placeholderData: {
      data: mockGuests,
      total: 48,
      page: 1,
      limit: 15,
      totalPages: 4,
    },
  });

  const guests = data?.data ?? mockGuests;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hóspedes</h1>
          <p className="text-gray-500 text-sm">Gestão de hóspedes cadastrados</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/guests/new')}>
          Novo Hóspede
        </Button>
      </div>

      <Card padding="md">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Buscar por nome, e-mail..."
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            containerClassName="flex-1 min-w-48"
          />
          <Select
            options={nationalityOptions}
            value={nationalityFilter}
            onChange={(e) => { setNationalityFilter(e.target.value); setPage(1); }}
            containerClassName="w-52"
          />
          <Select
            options={vipOptions}
            value={vipFilter}
            onChange={(e) => { setVipFilter(e.target.value); setPage(1); }}
            containerClassName="w-44"
          />
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" message="Carregando hóspedes..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Hóspede</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">E-mail</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Telefone</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Nacionalidade</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Estadias</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Total Gasto</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">VIP</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Cadastrado em</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {guests.map((guest) => {
                  const vip = vipConfig[guest.vipLevel ?? 0] ?? vipConfig[0];
                  return (
                    <tr
                      key={guest.id}
                      className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/guests/${guest.id}`)}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={`${guest.firstName} ${guest.lastName}`} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {guest.firstName} {guest.lastName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{guest.email}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{guest.phone ?? '-'}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{guest.nationality ?? '-'}</td>
                      <td className="px-5 py-3 text-center text-sm font-medium text-gray-700">{guest.totalStays}</td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(guest.totalSpent)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {(guest.vipLevel ?? 0) > 0 ? (
                          <Badge variant={vip.variant} size="sm">
                            <Star className="h-3 w-3" />
                            {vip.label}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">{formatDate(guest.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="xs"
                            variant="ghost"
                            icon={<Eye className="h-3.5 w-3.5" />}
                            onClick={(e) => { e.stopPropagation(); navigate(`/guests/${guest.id}`); }}
                          >
                            Ver
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            icon={<Edit2 className="h-3.5 w-3.5" />}
                            onClick={(e) => { e.stopPropagation(); navigate(`/guests/${guest.id}?edit=true`); }}
                          >
                            Editar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          limit={data.limit}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};
