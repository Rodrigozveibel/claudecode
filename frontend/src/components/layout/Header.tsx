import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Search, ChevronDown, LogOut, User, Settings, Building2, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useProperty } from '../../hooks/useProperty';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../utils/cn';
import { formatDateTime } from '../../utils/date';
import { authApi } from '../../api/auth';
import toast from 'react-hot-toast';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const { activeProperty, properties, setActiveProperty } = useProperty();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPropertyMenu, setShowPropertyMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const propertyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (propertyRef.current && !propertyRef.current.contains(e.target as Node)) {
        setShowPropertyMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    logout();
    navigate('/login');
    toast.success('Você saiu com sucesso');
  };

  const notifVariantColors: Record<string, string> = {
    info: 'bg-blue-100 border-blue-200',
    success: 'bg-green-100 border-green-200',
    warning: 'bg-yellow-100 border-yellow-200',
    error: 'bg-red-100 border-red-200',
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4 flex-shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar reservas, hóspedes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Property Selector */}
        {properties.length > 1 && (
          <div className="relative" ref={propertyRef}>
            <button
              onClick={() => setShowPropertyMenu(!showPropertyMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            >
              <Building2 className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-700 max-w-32 truncate">
                {activeProperty?.name ?? 'Selecionar'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>

            {showPropertyMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-xl z-50">
                <div className="p-2">
                  {properties.map((prop) => (
                    <button
                      key={prop.id}
                      onClick={() => {
                        setActiveProperty(prop);
                        setShowPropertyMenu(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                        activeProperty?.id === prop.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <Building2 className="h-4 w-4" />
                      {prop.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl border border-gray-200 shadow-xl z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Notificações</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500">
                    Nenhuma notificação
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'flex gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors',
                        !notif.read && 'bg-blue-50/50'
                      )}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 w-2 h-2 rounded-full mt-1.5',
                          !notif.read ? 'bg-blue-500' : 'bg-transparent'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDateTime(notif.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Avatar name={user?.name ?? 'User'} src={user?.avatar} size="sm" />
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-700 leading-none">{user?.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{user?.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-gray-200 shadow-xl z-50">
              <div className="p-2">
                <Link
                  to="/settings/account"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="h-4 w-4" />
                  Meu Perfil
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="h-4 w-4" />
                  Configurações
                </Link>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
