import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@hotel.com',
      password: 'password',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      await login(data);
      toast.success('Login realizado com sucesso!');
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Email ou senha incorretos. Tente novamente.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Bem-vindo de volta</h2>
      <p className="text-gray-500 text-sm mb-6">Entre com suas credenciais para acessar</p>

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

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Senha <span className="text-red-500">*</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="block w-full rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm py-2.5 px-3 pl-10 pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          loading={loading}
          className="w-full mt-6"
          size="lg"
        >
          Entrar
        </Button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700 font-medium">Credenciais de demonstração:</p>
        <p className="text-xs text-blue-600 mt-1">Email: admin@hotel.com</p>
        <p className="text-xs text-blue-600">Senha: password</p>
      </div>
    </div>
  );
};
