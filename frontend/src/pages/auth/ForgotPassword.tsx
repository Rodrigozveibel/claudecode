import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authApi } from '../../api/auth';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotPasswordForm = z.infer<typeof schema>;

export const ForgotPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setLoading(true);
      await authApi.forgotPassword(data.email);
      setSent(true);
    } catch {
      toast.error('Erro ao enviar email. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Email enviado!</h2>
        <p className="text-gray-500 text-sm mb-6">
          Enviamos um link para redefinir sua senha para{' '}
          <strong>{getValues('email')}</strong>. Verifique sua caixa de entrada.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Redefinir senha</h2>
      <p className="text-gray-500 text-sm mb-6">
        Informe seu email para receber as instruções de redefinição de senha.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Enviar Link de Redefinição
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o login
        </Link>
      </div>
    </div>
  );
};
