
import React from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBasket,
  Users,
  BarChart3,
  Settings,
  Moon,
  Sun,
  LogOut,
  X,
  ExternalLink,
  Bike,
  ChefHat,
  Monitor,
  Truck
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
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  toggleDarkMode,
  onExitToSite,
  activeSection,
  onSectionChange
}) => {
  const menuItems: { icon: any; label: string; id: AdminSection; badge?: number }[] = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { icon: Monitor, label: 'En Directo TPV', id: 'tpv' },
    { icon: UtensilsCrossed, label: 'Comandas', id: 'kds', badge: 3 },
    { icon: Truck, label: 'Reparto', id: 'dds' },
    { icon: Bike, label: 'Panel Repartidores', id: 'driver_dashboard' },
    { icon: ShoppingBasket, label: 'Pedidos', id: 'orders' },
    { icon: ChefHat, label: 'Logística Cocina', id: 'kitchen' },
    { icon: UtensilsCrossed, label: 'Editor de Menú', id: 'menu' },
    { icon: Users, label: 'Equipo Reparto', id: 'delivery_drivers' },
    { icon: Users, label: 'Clientes', id: 'customers' },
    { icon: BarChart3, label: 'Reportes', id: 'reports' },
  ];


  return (
    <aside className={`
      fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#0f172a] border-r border-gray-100 dark:border-gray-800
      transform transition-transform duration-300 ease-in-out z-50 flex flex-col
      lg:relative lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <button
        onClick={onClose}
        title="Cerrar menú"
        className="lg:hidden absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="p-8 flex flex-col items-center border-b border-gray-50 dark:border-gray-800">
        <div className="relative group cursor-pointer" onClick={onExitToSite}>
          <div className="absolute -inset-1 bg-gradient-to-tr from-primary-400 to-amber-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
          <img
            alt="El Buen Servir Logo"
            className="relative w-24 h-24 rounded-full shadow-xl mb-4 object-cover border-4 border-white dark:border-gray-800"
            src="https://picsum.photos/seed/restaurant/200"
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white">El Buen Servir</h1>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-[0.2em] font-bold">Admin Panel</p>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
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
            {item.badge && activeSection !== item.id && (
              <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full ring-2 ring-white dark:ring-gray-900">
                {item.badge}
              </span>
            )}
          </button>
        ))}

        <div className="pt-6 mt-6 border-t border-gray-50 dark:border-gray-800 space-y-2">
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
