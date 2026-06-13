import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { formatDate } from '../../utils/date';

const mockRules = [
  { id: 'r1', name: 'Fin de Semana', type: 'WEEKEND', modifier: 20, modifierType: 'PERCENTAGE', startDate: '', endDate: '', priority: 1, isActive: true, createdAt: new Date().toISOString() },
  { id: 'r2', name: 'Temporada Alta', type: 'DATE_RANGE', modifier: 35, modifierType: 'PERCENTAGE', startDate: '2024-12-15', endDate: '2025-01-05', priority: 2, isActive: true, createdAt: new Date().toISOString() },
  { id: 'r3', name: 'Antecipação 30 dias', type: 'EARLY_BIRD', modifier: -10, modifierType: 'PERCENTAGE', startDate: '', endDate: '', priority: 3, isActive: true, createdAt: new Date().toISOString() },
  { id: 'r4', name: 'Last Minute', type: 'LAST_MINUTE', modifier: -15, modifierType: 'PERCENTAGE', startDate: '', endDate: '', priority: 4, isActive: false, createdAt: new Date().toISOString() },
  { id: 'r5', name: 'Alta Ocupação', type: 'OCCUPANCY', modifier: 25, modifierType: 'PERCENTAGE', startDate: '', endDate: '', priority: 5, isActive: true, createdAt: new Date().toISOString() },
];

const typeLabels: Record<string, string> = {
  WEEKEND: 'Fim de Semana', DATE_RANGE: 'Período', EARLY_BIRD: 'Antecipação',
  LAST_MINUTE: 'Last Minute', OCCUPANCY: 'Por Ocupação', SEASONAL: 'Sazonal',
};

export const RateRules: React.FC = () => {
  const navigate = useNavigate();
  const [rules, setRules] = useState(mockRules);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<typeof mockRules[0] | null>(null);
  const [form, setForm] = useState({ name: '', type: 'WEEKEND', modifier: '0', modifierType: 'PERCENTAGE', startDate: '', endDate: '', priority: '1' });

  const openNew = () => { setEditingRule(null); setForm({ name: '', type: 'WEEKEND', modifier: '0', modifierType: 'PERCENTAGE', startDate: '', endDate: '', priority: String(rules.length + 1) }); setShowModal(true); };
  const openEdit = (rule: typeof mockRules[0]) => { setEditingRule(rule); setForm({ name: rule.name, type: rule.type, modifier: String(rule.modifier), modifierType: rule.modifierType, startDate: rule.startDate, endDate: rule.endDate, priority: String(rule.priority) }); setShowModal(true); };

  const handleSave = () => {
    if (!form.name) { toast.error('Nome é obrigatório'); return; }
    if (editingRule) {
      setRules(r => r.map(x => x.id === editingRule.id ? { ...x, ...form, modifier: Number(form.modifier), priority: Number(form.priority) } : x));
      toast.success('Regra atualizada!');
    } else {
      setRules(r => [...r, { id: `r${Date.now()}`, ...form, modifier: Number(form.modifier), priority: Number(form.priority), isActive: true, createdAt: new Date().toISOString() }]);
      toast.success('Regra criada!');
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => { setRules(r => r.filter(x => x.id !== id)); toast.success('Regra removida!'); };
  const toggleActive = (id: string) => { setRules(r => r.map(x => x.id === id ? { ...x, isActive: !x.isActive } : x)); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/revenue')} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Regras de Tarifas</h1>
            <p className="text-sm text-gray-500">Configure ajustes automáticos de preço</p>
          </div>
        </div>
        <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={openNew}>Nova Regra</Button>
      </div>

      <Card padding="none">
        <div className="divide-y divide-gray-100">
          {rules.map(rule => (
            <div key={rule.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">{rule.priority}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">{rule.name}</span>
                  <Badge variant={rule.isActive ? 'green' : 'gray'} size="sm">{rule.isActive ? 'Ativa' : 'Inativa'}</Badge>
                  <Badge variant="blue" size="sm">{typeLabels[rule.type] ?? rule.type}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span>Modificador: <strong className={rule.modifier > 0 ? 'text-green-600' : 'text-red-600'}>{rule.modifier > 0 ? '+' : ''}{rule.modifier}{rule.modifierType === 'PERCENTAGE' ? '%' : ' R$'}</strong></span>
                  {rule.startDate && <span>De {formatDate(rule.startDate)} até {formatDate(rule.endDate)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(rule.id)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${rule.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${rule.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
                <Button variant="ghost" size="sm" icon={<Edit2 className="h-4 w-4" />} onClick={() => openEdit(rule)} />
                <Button variant="ghost" size="sm" icon={<Trash2 className="h-4 w-4 text-red-500" />} onClick={() => handleDelete(rule.id)} />
              </div>
            </div>
          ))}
          {rules.length === 0 && <div className="text-center py-12 text-gray-400">Nenhuma regra configurada</div>}
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingRule ? 'Editar Regra' : 'Nova Regra de Tarifa'} size="md">
        <div className="space-y-4">
          <Input label="Nome da Regra" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Alta Temporada" />
          <Select label="Tipo" options={Object.entries(typeLabels).map(([v, l]) => ({ value: v, label: l }))} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Modificador" type="number" step="0.01" value={form.modifier} onChange={e => setForm(f => ({ ...f, modifier: e.target.value }))} placeholder="Ex: 20 ou -10" />
            <Select label="Tipo do Modificador" options={[{ value: 'PERCENTAGE', label: 'Percentual (%)' }, { value: 'FIXED', label: 'Valor Fixo (R$)' }]} value={form.modifierType} onChange={e => setForm(f => ({ ...f, modifierType: e.target.value }))} />
          </div>
          {form.type === 'DATE_RANGE' && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Data Início" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              <Input label="Data Fim" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          )}
          <Input label="Prioridade" type="number" min="1" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button onClick={handleSave}>{editingRule ? 'Salvar' : 'Criar Regra'}</Button>
        </div>
      </Modal>
    </div>
  );
};
