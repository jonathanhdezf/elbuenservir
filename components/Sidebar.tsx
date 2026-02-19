
import React, { useState } from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBasket,
  Users,
  BarChart3,
  Moon,
  Sun,
  LogOut,
  X,
  ExternalLink,
  Bike,
  ChefHat,
  Monitor,
  Truck,
  Store,
  Shield,
  ChevronDown,
  Package,
  Briefcase
} from 'lucide-react';
import { AdminSection } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onExitToSite?: () => void;
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  isFullScreen?: boolean;
}

interface NavGroup {
  title: string;
  icon: any;
  items: { icon: any; label: string; id: AdminSection; badge?: number }[];
  collapsible?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  toggleDarkMode,
  onExitToSite,
  activeSection,
  onSectionChange,
  badges = {} as Partial<Record<AdminSection, number>>,
  isFullScreen = false
}) => {
  const [logisticsOpen, setLogisticsOpen] = useState(true);
  const [managementOpen, setManagementOpen] = useState(true);

  const mainItems: { icon: any; label: string; id: AdminSection; badge?: number }[] = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { icon: Monitor, label: 'En Directo TPV', id: 'tpv' },
    { icon: ShoppingBasket, label: 'Pedidos', id: 'orders', badge: badges['orders'] },
  ];

  const logisticsItems: { icon: any; label: string; id: AdminSection; badge?: number }[] = [
    { icon: ChefHat, label: 'Monitor KDS', id: 'kds', badge: badges['kds'] },
    { icon: Truck, label: 'Repartos', id: 'dds', badge: badges['dds'] },
    { icon: Store, label: 'Despacho Local', id: 'local_dispatch', badge: badges['local_dispatch'] },
    { icon: Bike, label: 'Panel Repartidores', id: 'driver_dashboard' },
  ];

  const managementItems: { icon: any; label: string; id: AdminSection; badge?: number }[] = [
    { icon: UtensilsCrossed, label: 'Editor de Menú', id: 'menu' },
    { icon: Users, label: 'Clientes', id: 'customers' },
    { icon: BarChart3, label: 'Reportes', id: 'reports' },
    { icon: Shield, label: 'Gestión Personal', id: 'staff_management' },
  ];

  const isLogisticsActive = logisticsItems.some(item => item.id === activeSection);
  const isManagementActive = managementItems.some(item => item.id === activeSection);

  const renderNavItem = (item: { icon: any; label: string; id: AdminSection; badge?: number }) => (
    <button
      key={item.id}
      onClick={() => onSectionChange(item.id)}
      className={`
        w-full flex items-center px-4 py-3.5 rounded-2xl transition-all group
        ${activeSection === item.id
          ? 'bg-primary-500 text-white shadow-lg shadow-primary-200 dark:shadow-none font-semibold'
          : 'text-gray-500 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400'}
      `}
    >
      <item.icon className={`w-5 h-5 mr-3.5 ${activeSection === item.id ? 'text-white' : 'text-gray-400 group-hover:text-primary-500'}`} />
      <span>{item.label}</span>
      {item.badge ? (
        <span className={`ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full ring-2 ring-white dark:ring-gray-900 ${activeSection === item.id ? 'bg-white text-primary-600 ring-primary-400' : ''}`}>
          {item.badge}
        </span>
      ) : null}
    </button>
  );

  return (
    <aside className={`
      fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#0f172a] border-r border-gray-100 dark:border-gray-800
      transform transition-transform duration-300 ease-in-out z-50 flex flex-col
      ${!isFullScreen ? 'lg:relative lg:translate-x-0' : ''}
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <button
        onClick={onClose}
        title="Cerrar menú"
        className={`${!isFullScreen ? 'lg:hidden' : ''} absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg`}
      >
        <X className="w-6 h-6" />
      </button>

      <div className="p-8 flex flex-col items-center border-b border-gray-50 dark:border-gray-800">
        <div className="relative group cursor-pointer" onClick={onExitToSite}>
          <div className="absolute -inset-1 bg-gradient-to-tr from-primary-400 to-amber-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
          <img
            alt="El Buen Servir Logo"
            className="relative w-24 h-24 rounded-full shadow-xl mb-4 object-cover border-4 border-white dark:border-gray-800"
            src={`${(import.meta as any).env.BASE_URL}logo.png`}
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white">El Buen Servir</h1>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-[0.2em] font-bold">Panel de Administrador</p>
      </div>

      <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar space-y-1">
        {/* Operaciones */}
        <p className="text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-[0.2em] px-4 mb-2 mt-2">Operaciones</p>
        {mainItems.map(renderNavItem)}

        {/* Logística */}
        <div className="pt-4">
          <button
            onClick={() => setLogisticsOpen(!logisticsOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group ${isLogisticsActive ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
          >
            <div className="flex items-center">
              <Package className={`w-5 h-5 mr-3.5 ${isLogisticsActive ? 'text-blue-500' : 'text-gray-400'}`} />
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isLogisticsActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>Logística</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${logisticsOpen ? 'rotate-180' : ''}`} />
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${logisticsOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
            <div className="pl-2 space-y-1">
              {logisticsItems.map(renderNavItem)}
            </div>
          </div>
        </div>

        {/* Gestión */}
        <div className="pt-4">
          <button
            onClick={() => setManagementOpen(!managementOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group ${isManagementActive ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
          >
            <div className="flex items-center">
              <Briefcase className={`w-5 h-5 mr-3.5 ${isManagementActive ? 'text-blue-500' : 'text-gray-400'}`} />
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isManagementActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>Gestión</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${managementOpen ? 'rotate-180' : ''}`} />
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${managementOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
            <div className="pl-2 space-y-1">
              {managementItems.map(renderNavItem)}
            </div>
          </div>
        </div>

        <div className="pt-6 mt-4 border-t border-gray-50 dark:border-gray-800 space-y-2">
          {onExitToSite && (
            <button
              onClick={onExitToSite}
              className="w-full flex items-center px-4 py-3.5 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-2xl transition-all group"
            >
              <ExternalLink className="w-5 h-5 mr-3.5" />
              <span>Ver Sitio Público</span>
            </button>
          )}

          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center px-4 py-3.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all group"
          >
            {isDarkMode ? <Sun className="w-5 h-5 mr-3.5 text-amber-500" /> : <Moon className="w-5 h-5 mr-3.5 text-indigo-500" />}
            <span>{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </button>
        </div>
      </nav>

      <div className="p-6 bg-gray-50/50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 dark:text-white truncate">Admin User</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">admin@elbuenservir.com</p>
          </div>
          <button title="Cerrar sesión" className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
