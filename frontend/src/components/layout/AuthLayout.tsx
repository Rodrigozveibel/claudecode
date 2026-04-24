import React from 'react';
import { Outlet } from 'react-router-dom';
import { Hotel } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-2xl mb-4">
            <Hotel className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Hotel PMS</h1>
          <p className="text-blue-200 mt-1 text-sm">Sistema de Gestão Hoteleira</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <Outlet />
        </div>
        <p className="text-center text-blue-200 text-xs mt-6">
          &copy; {new Date().getFullYear()} Hotel PMS. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};
