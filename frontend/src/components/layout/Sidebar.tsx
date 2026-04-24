import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import {
  LayoutDashboard,
  CalendarDays,
  BedDouble,
  Users,
  Sparkles,
  Wrench,
  Receipt,
  TrendingUp,
  Globe2,
  BarChart3,
  UserCog,
  Settings,
  ChevronDown,
  ChevronRight,
  Hotel,
  DoorOpen,
  DoorClosed,
  PanelLeftClose,
  PanelLeftOpen,
  ListFilter,
} from 'lucide-react';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: NavItem[];
  badge?: number;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: 'Recepção',
    icon: <Hotel className="h-4 w-4" />,
    children: [
      { label: 'Painel', href: '/front-desk', icon: <Hotel className="h-4 w-4" /> },
      { label: 'Check-in', href: '/front-desk/check-in', icon: <DoorOpen className="h-4 w-4" /> },
      { label: 'Check-out', href: '/front-desk/check-out', icon: <DoorClosed className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Reservas',
    icon: <CalendarDays className="h-4 w-4" />,
    children: [
      { label: 'Lista', href: '/reservations', icon: <ListFilter className="h-4 w-4" /> },
      { label: 'Calendário', href: '/reservations/calendar', icon: <CalendarDays className="h-4 w-4" /> },
      { label: 'Nova Reserva', href: '/reservations/new', icon: <CalendarDays className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Quartos',
    icon: <BedDouble className="h-4 w-4" />,
    children: [
      { label: 'Grade de Quartos', href: '/rooms/grid', icon: <BedDouble className="h-4 w-4" /> },
      { label: 'Lista', href: '/rooms', icon: <ListFilter className="h-4 w-4" /> },
      { label: 'Tipos de Quarto', href: '/rooms/types', icon: <BedDouble className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Hóspedes',
    href: '/guests',
    icon: <Users className="h-4 w-4" />,
  },
  {
    label: 'Governança',
    href: '/housekeeping',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    label: 'Manutenção',
    href: '/maintenance',
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    label: 'Faturamento',
    icon: <Receipt className="h-4 w-4" />,
    children: [
      { label: 'Faturas', href: '/billing', icon: <Receipt className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Receita',
    icon: <TrendingUp className="h-4 w-4" />,
    children: [
      { label: 'Gestão', href: '/revenue', icon: <TrendingUp className="h-4 w-4" /> },
      { label: 'Calendário de Tarifas', href: '/revenue/calendar', icon: <CalendarDays className="h-4 w-4" /> },
      { label: 'Regras de Tarifas', href: '/revenue/rules', icon: <ListFilter className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Canais',
    href: '/channels',
    icon: <Globe2 className="h-4 w-4" />,
  },
  {
    label: 'Relatórios',
    icon: <BarChart3 className="h-4 w-4" />,
    children: [
      { label: 'Visão Geral', href: '/reports', icon: <BarChart3 className="h-4 w-4" /> },
      { label: 'Ocupação', href: '/reports/occupancy', icon: <BarChart3 className="h-4 w-4" /> },
      { label: 'Receita', href: '/reports/revenue', icon: <TrendingUp className="h-4 w-4" /> },
      { label: 'Hóspedes', href: '/reports/guests', icon: <Users className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Equipe',
    href: '/staff',
    icon: <UserCog className="h-4 w-4" />,
  },
  {
    label: 'Configurações',
    href: '/settings',
    icon: <Settings className="h-4 w-4" />,
  },
];

interface SidebarNavItemProps {
  item: NavItem;
  isCollapsed: boolean;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ item, isCollapsed }) => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(() => {
    if (item.children) {
      return item.children.some((child) => child.href && location.pathname.startsWith(child.href));
    }
    return false;
  });

  if (item.children) {
    const isActive = item.children.some((child) => child.href && location.pathname.startsWith(child.href));

    if (isCollapsed) {
      return (
        <div className="relative group">
          <button
            className={cn(
              'w-full flex items-center justify-center p-2.5 rounded-lg transition-colors',
              isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            )}
          >
            {item.icon}
          </button>
        </div>
      );
    }

    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors text-sm',
            isActive ? 'text-blue-700 bg-blue-50 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          )}
        >
          <span className="flex-shrink-0">{item.icon}</span>
          <span className="flex-1 text-left">{item.label}</span>
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          )}
        </button>
        {isExpanded && (
          <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-3">
            {item.children.map((child) => (
              <NavLink
                key={child.href}
                to={child.href!}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'text-blue-700 bg-blue-50 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )
                }
              >
                <span className="flex-shrink-0">{child.icon}</span>
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <NavLink
        to={item.href!}
        title={item.label}
        className={({ isActive }) =>
          cn(
            'flex items-center justify-center p-2.5 rounded-lg transition-colors',
            isActive
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          )
        }
      >
        {item.icon}
      </NavLink>
    );
  }

  return (
    <NavLink
      to={item.href!}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors',
          isActive
            ? 'text-blue-700 bg-blue-50 font-medium'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        )
      }
    >
      <span className="flex-shrink-0">{item.icon}</span>
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && (
        <span className="ml-auto text-xs font-semibold bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5">
          {item.badge}
        </span>
      )}
    </NavLink>
  );
};

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center px-4 h-16 border-b border-gray-200 flex-shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Hotel className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Hotel PMS</p>
              <p className="text-xs text-gray-500">Gestão Hoteleira</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="flex items-center justify-center w-full">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Hotel className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            'p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0',
            isCollapsed && 'hidden'
          )}
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {isCollapsed && (
        <div className="flex justify-center p-2 border-b border-gray-100">
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <SidebarNavItem key={item.label} item={item} isCollapsed={isCollapsed} />
        ))}
      </nav>
    </aside>
  );
};
