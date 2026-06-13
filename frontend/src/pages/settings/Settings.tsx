import React, { useState } from 'react';
import { Building2, Bell, Shield, CreditCard, Globe, Palette, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { cn } from '../../utils/cn';

const sections = [
  { id: 'property', label: 'Propriedade', icon: <Building2 className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notificações', icon: <Bell className="h-4 w-4" /> },
  { id: 'security', label: 'Segurança', icon: <Shield className="h-4 w-4" /> },
  { id: 'billing', label: 'Financeiro', icon: <CreditCard className="h-4 w-4" /> },
  { id: 'integrations', label: 'Integrações', icon: <Globe className="h-4 w-4" /> },
  { id: 'appearance', label: 'Aparência', icon: <Palette className="h-4 w-4" /> },
];

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button onClick={() => onChange(!checked)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}>
    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
  </button>
);

export const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('property');
  const [property, setProperty] = useState({ name: 'Hotel Grand Palace', email: 'contato@grandpalace.com', phone: '(11) 3000-4000', address: 'Av. Paulista, 1000', city: 'São Paulo', country: 'Brasil', timezone: 'America/Sao_Paulo', currency: 'BRL', checkInTime: '14:00', checkOutTime: '12:00', taxRate: '15' });
  const [notifs, setNotifs] = useState({ newReservation: true, checkIn: true, checkOut: true, payment: true, maintenance: true, housekeeping: false, email: true, sms: false, push: true });
  const [security, setSecurity] = useState({ twoFactor: false, sessionTimeout: '8', passwordExpiry: '90' });

  const handleSave = () => toast.success('Configurações salvas!');

  return (
    <div className="flex gap-6">
      <aside className="w-48 flex-shrink-0">
        <Card padding="none">
          <nav className="py-2">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)} className={cn('w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors', activeSection === s.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50')}>
                {s.icon}{s.label}
              </button>
            ))}
          </nav>
        </Card>
      </aside>

      <div className="flex-1 space-y-6">
        {activeSection === 'property' && (
          <Card padding="md">
            <Card.Header title="Dados da Propriedade" />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nome do Hotel" value={property.name} onChange={e => setProperty(p => ({ ...p, name: e.target.value }))} />
                <Input label="E-mail" type="email" value={property.email} onChange={e => setProperty(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Telefone" value={property.phone} onChange={e => setProperty(p => ({ ...p, phone: e.target.value }))} />
                <Input label="Endereço" value={property.address} onChange={e => setProperty(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Cidade" value={property.city} onChange={e => setProperty(p => ({ ...p, city: e.target.value }))} />
                <Select label="País" options={[{ value: 'Brasil', label: 'Brasil' }, { value: 'Argentina', label: 'Argentina' }, { value: 'Portugal', label: 'Portugal' }]} value={property.country} onChange={e => setProperty(p => ({ ...p, country: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Select label="Fuso Horário" options={[{ value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' }, { value: 'America/Manaus', label: 'Manaus (AMT)' }, { value: 'America/Fortaleza', label: 'Fortaleza (BRT)' }]} value={property.timezone} onChange={e => setProperty(p => ({ ...p, timezone: e.target.value }))} />
                <Input label="Hora Check-in" type="time" value={property.checkInTime} onChange={e => setProperty(p => ({ ...p, checkInTime: e.target.value }))} />
                <Input label="Hora Check-out" type="time" value={property.checkOutTime} onChange={e => setProperty(p => ({ ...p, checkOutTime: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Moeda" options={[{ value: 'BRL', label: 'Real Brasileiro (BRL)' }, { value: 'USD', label: 'Dólar (USD)' }, { value: 'EUR', label: 'Euro (EUR)' }]} value={property.currency} onChange={e => setProperty(p => ({ ...p, currency: e.target.value }))} />
                <Input label="Taxa de Imposto (%)" type="number" step="0.1" value={property.taxRate} onChange={e => setProperty(p => ({ ...p, taxRate: e.target.value }))} />
              </div>
              <div className="flex justify-end pt-2">
                <Button icon={<Save className="h-4 w-4" />} onClick={handleSave}>Salvar Alterações</Button>
              </div>
            </div>
          </Card>
        )}

        {activeSection === 'notifications' && (
          <Card padding="md">
            <Card.Header title="Configurações de Notificações" />
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Eventos</h4>
                <div className="space-y-3">
                  {[
                    { key: 'newReservation', label: 'Nova reserva' },
                    { key: 'checkIn', label: 'Check-in realizado' },
                    { key: 'checkOut', label: 'Check-out realizado' },
                    { key: 'payment', label: 'Pagamento recebido' },
                    { key: 'maintenance', label: 'Nova ordem de manutenção' },
                    { key: 'housekeeping', label: 'Tarefa de governança concluída' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <Toggle checked={notifs[item.key as keyof typeof notifs] as boolean} onChange={v => setNotifs(n => ({ ...n, [item.key]: v }))} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Canais</h4>
                <div className="space-y-3">
                  {[{ key: 'email', label: 'E-mail' }, { key: 'sms', label: 'SMS' }, { key: 'push', label: 'Notificação Push' }].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <Toggle checked={notifs[item.key as keyof typeof notifs] as boolean} onChange={v => setNotifs(n => ({ ...n, [item.key]: v }))} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button icon={<Save className="h-4 w-4" />} onClick={handleSave}>Salvar</Button>
              </div>
            </div>
          </Card>
        )}

        {activeSection === 'security' && (
          <Card padding="md">
            <Card.Header title="Segurança" />
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">Autenticação em dois fatores (2FA)</p>
                  <p className="text-xs text-gray-500">Requer código adicional no login</p>
                </div>
                <Toggle checked={security.twoFactor} onChange={v => setSecurity(s => ({ ...s, twoFactor: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Timeout de sessão (horas)" options={[{ value: '4', label: '4 horas' }, { value: '8', label: '8 horas' }, { value: '24', label: '24 horas' }]} value={security.sessionTimeout} onChange={e => setSecurity(s => ({ ...s, sessionTimeout: e.target.value }))} />
                <Select label="Expiração de senha (dias)" options={[{ value: '30', label: '30 dias' }, { value: '60', label: '60 dias' }, { value: '90', label: '90 dias' }, { value: '0', label: 'Nunca' }]} value={security.passwordExpiry} onChange={e => setSecurity(s => ({ ...s, passwordExpiry: e.target.value }))} />
              </div>
              <div className="flex justify-end pt-2">
                <Button icon={<Save className="h-4 w-4" />} onClick={handleSave}>Salvar</Button>
              </div>
            </div>
          </Card>
        )}

        {activeSection === 'billing' && (
          <Card padding="md">
            <Card.Header title="Configurações Financeiras" />
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                Configure métodos de pagamento, emissão de notas fiscais e integração com gateways de pagamento.
              </div>
              <Select label="Gateway de Pagamento" options={[{ value: 'stripe', label: 'Stripe' }, { value: 'pagseguro', label: 'PagSeguro' }, { value: 'mercadopago', label: 'Mercado Pago' }, { value: 'none', label: 'Nenhum' }]} defaultValue="none" onChange={() => {}} />
              <Select label="Emissão de NF-e" options={[{ value: 'manual', label: 'Manual' }, { value: 'nfse_io', label: 'nfse.io' }, { value: 'enotas', label: 'eNotas' }]} defaultValue="manual" onChange={() => {}} />
              <div className="flex justify-end pt-2">
                <Button icon={<Save className="h-4 w-4" />} onClick={handleSave}>Salvar</Button>
              </div>
            </div>
          </Card>
        )}

        {activeSection === 'integrations' && (
          <Card padding="md">
            <Card.Header title="Integrações" />
            <div className="space-y-3">
              {[{ name: 'Booking.com', desc: 'Sincronização de disponibilidade e tarifas', connected: true }, { name: 'Expedia', desc: 'Gestão de reservas e inventário', connected: true }, { name: 'Airbnb', desc: 'Listagens e reservas', connected: true }, { name: 'Google Analytics', desc: 'Métricas do site de reservas', connected: false }, { name: 'WhatsApp Business', desc: 'Comunicação com hóspedes', connected: false }].map(integ => (
                <div key={integ.name} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{integ.name}</p>
                    <p className="text-xs text-gray-500">{integ.desc}</p>
                  </div>
                  <Button variant={integ.connected ? 'outline' : 'primary'} size="sm" onClick={() => toast.success(integ.connected ? `${integ.name} desconectado` : `${integ.name} conectado!`)}>
                    {integ.connected ? 'Desconectar' : 'Conectar'}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeSection === 'appearance' && (
          <Card padding="md">
            <Card.Header title="Aparência" />
            <div className="space-y-4">
              <Select label="Tema" options={[{ value: 'light', label: 'Claro' }, { value: 'dark', label: 'Escuro' }, { value: 'system', label: 'Sistema' }]} defaultValue="light" onChange={() => {}} />
              <Select label="Idioma" options={[{ value: 'pt-BR', label: 'Português (Brasil)' }, { value: 'en-US', label: 'English (US)' }, { value: 'es', label: 'Español' }]} defaultValue="pt-BR" onChange={() => {}} />
              <div className="flex justify-end pt-2">
                <Button icon={<Save className="h-4 w-4" />} onClick={handleSave}>Salvar</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
