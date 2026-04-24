import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { guestsApi } from '../../api/guests';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

const schema = z.object({
  firstName: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  lastName: z.string().min(2, 'Sobrenome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  documentType: z.string().optional(),
  documentNumber: z.string().optional(),
  nationality: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const documentTypeOptions = [
  { value: '', label: 'Selecionar tipo' },
  { value: 'CPF', label: 'CPF' },
  { value: 'RG', label: 'RG' },
  { value: 'Passaporte', label: 'Passaporte' },
  { value: 'CNH', label: 'CNH' },
];

const nationalityOptions = [
  { value: '', label: 'Selecionar nacionalidade' },
  { value: 'Brasileiro', label: 'Brasileiro' },
  { value: 'Americano', label: 'Americano' },
  { value: 'Argentino', label: 'Argentino' },
  { value: 'Português', label: 'Português' },
  { value: 'Espanhol', label: 'Espanhol' },
  { value: 'Italiano', label: 'Italiano' },
  { value: 'Francês', label: 'Francês' },
  { value: 'Alemão', label: 'Alemão' },
  { value: 'Outro', label: 'Outro' },
];

export const NewGuest: React.FC = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: guestsApi.createGuest,
    onSuccess: (data) => {
      navigate(`/guests/${data.id}`);
    },
    onError: () => {
      // toast.error handled inline
    },
  });

  const onSubmit = (formData: FormData) => {
    mutation.mutate(formData);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/guests')}>
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Hóspede</h1>
          <p className="text-gray-500 text-sm">Cadastrar novo hóspede no sistema</p>
        </div>
      </div>

      {mutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          Erro ao cadastrar hóspede. Tente novamente.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Dados Pessoais */}
        <Card padding="md">
          <h3 className="text-base font-semibold text-gray-900 mb-5">Dados Pessoais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Primeiro Nome"
              required
              placeholder="Carlos"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Sobrenome"
              required
              placeholder="Oliveira"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
            <Input
              label="E-mail"
              type="email"
              required
              placeholder="carlos@email.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Telefone"
              placeholder="(11) 99999-0000"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Select
              label="Tipo de Documento"
              options={documentTypeOptions}
              {...register('documentType')}
            />
            <Input
              label="Número do Documento"
              placeholder="000.000.000-00"
              error={errors.documentNumber?.message}
              {...register('documentNumber')}
            />
            <Select
              label="Nacionalidade"
              options={nationalityOptions}
              {...register('nationality')}
            />
            <Input
              label="Data de Nascimento"
              type="date"
              error={errors.dateOfBirth?.message}
              {...register('dateOfBirth')}
            />
          </div>
        </Card>

        {/* Endereço */}
        <Card padding="md">
          <h3 className="text-base font-semibold text-gray-900 mb-5">Endereço</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Endereço"
              placeholder="Rua das Flores, 123"
              containerClassName="md:col-span-2"
              error={errors.address?.message}
              {...register('address')}
            />
            <Input
              label="Cidade"
              placeholder="São Paulo"
              error={errors.city?.message}
              {...register('city')}
            />
            <Input
              label="País"
              placeholder="Brasil"
              error={errors.country?.message}
              {...register('country')}
            />
          </div>
        </Card>

        {/* Observações */}
        <Card padding="md">
          <h3 className="text-base font-semibold text-gray-900 mb-5">Observações</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas Internas</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Preferências, alergias, necessidades especiais..."
              rows={4}
              {...register('notes')}
            />
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/guests')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={mutation.isPending}
            icon={<UserPlus className="h-4 w-4" />}
          >
            Cadastrar Hóspede
          </Button>
        </div>
      </form>
    </div>
  );
};
