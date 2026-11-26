import React, { useState } from 'react';
import {
  ChefHat,
  Truck,
  Monitor,
  Utensils,
  LayoutDashboard,
  LayoutGrid,
  X,
  Settings,
  Search,
  Power,
  Bike,
  UtensilsCrossed,
  ChevronRight,
  Download,
  ShieldCheck,
  ShoppingBasket,
  Globe,
  Sliders,
  Boxes,
  Sun,
  Moon,
  LogOut,
  Home
} from 'lucide-react';
import { soundManager } from '../utils/soundManager';
import { useMobileBack } from '../hooks/useMobileBack';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { InstallPwaModal } from '../components/InstallPwaModal';
import { AdminSection, EnabledModules, DEFAULT_ENABLED_MODULES } from '../types';

interface ControlPanelViewProps {
  onNavigate: (
    view: 'admin' | 'public' | 'kitchen' | 'logistics' | 'tpv' | 'local_dispatch' | 'driver_portal',
    section?: AdminSection
  ) => void;
  onExit: () => void;
  onGoToPublicSite?: () => void;
  isDarkMode: boolean;
  setIsDarkMode?: (isDark: boolean) => void;
  activeOrdersCount?: number;
  menuItemsCount?: number;
  activeDriversCount?: number;
  systemBgColor?: string;
  setSystemBgColor?: (color: string) => void;
  systemBgEffect?: 'none' | 'gradient' | 'animated-blobs' | 'stars';
  setSystemBgEffect?: (effect: 'none' | 'gradient' | 'animated-blobs' | 'stars') => void;
  panelMode?: 'basic' | 'advanced';
  setPanelMode?: (mode: 'basic' | 'advanced') => void;
  enabledModules?: EnabledModules;
  setEnabledModules?: React.Dispatch<React.SetStateAction<EnabledModules>>;
}

interface SystemAppItem {
  id: string;
  name: string;
  shortName: string;
  category: string;
  description: string;
  metricLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconGradient: string;
  iconShadow: string;
  tintSurface: string;
  view: 'admin' | 'kitchen' | 'logistics' | 'tpv' | 'local_dispatch' | 'driver_portal';
  section?: AdminSection;
}

export default function ControlPanelView({
  onNavigate,
  onExit,
  onGoToPublicSite,
  isDarkMode,
  setIsDarkMode,
  activeOrdersCount = 0,
  menuItemsCount = 0,
  activeDriversCount = 0,
  panelMode: propPanelMode,
  setPanelMode: propSetPanelMode,
  enabledModules: propEnabledModules,
  setEnabledModules: propSetEnabledModules
}: ControlPanelViewProps) {
  const [localPanelMode, setLocalPanelMode] = useState<'basic' | 'advanced'>('basic');
  const panelMode = propPanelMode ?? localPanelMode;

  const [localEnabledModules, setLocalEnabledModules] = useState<EnabledModules>(DEFAULT_ENABLED_MODULES);
  const enabledModules = propEnabledModules ?? localEnabledModules;
  const setEnabledModules = propSetEnabledModules ?? setLocalEnabledModules;

  const { isInstalled, isIos, showInstructions, setShowInstructions, installApp } = usePwaInstall();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'modules' | 'appearance'>('modules');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleModule = (moduleId: keyof EnabledModules) => {
    soundManager.play('click');
    setEnabledModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const setAllModules = (enabled: boolean) => {
    soundManager.play('click');
    setEnabledModules({
      tpv: enabled,
      kitchen: enabled,
      local_dispatch: enabled,
      logistics: enabled,
      driver_portal: enabled
    });
  };

  const activeModulesCount = Object.values(enabledModules).filter(Boolean).length;

  const changePanelMode = (mode: 'basic' | 'advanced') => {
    soundManager.play('click');
    if (propSetPanelMode) {
      propSetPanelMode(mode);
    } else {
      setLocalPanelMode(mode);
    }
  };

  useMobileBack({
    hasOpenModal: isSettingsOpen,
    onCloseModal: () => setIsSettingsOpen(false),
    onExit
  });

  const handleAppClick = (
    targetView: 'admin' | 'kitchen' | 'logistics' | 'tpv' | 'local_dispatch' | 'driver_portal',
    section?: AdminSection
  ) => {
    soundManager.play('navigation');
    onNavigate(targetView, section);
  };

  const handleOpenPublicSite = () => {
    soundManager.play('click');
    if (onGoToPublicSite) {
      onGoToPublicSite();
    } else {
      onExit();
    }
  };

  const baseUrl = (import.meta as any).env.BASE_URL || '/';
  const brandLogoSrc = `${baseUrl}assets/aistudio/${
    isDarkMode ? 'Designer__3__462aa070.png' : 'crea_el_Logotipo_vectorial_profesional_de_Tlayoyos_bbff3d24.png'
  }`;

  const basicApps: SystemAppItem[] = [
    {
      id: 'orders',
      name: 'Pedidos y Caja',
      shortName: 'Pedidos',
      category: 'Operación diaria',
      description: 'Supervisa comandas entrantes, estados de preparación, cobros y entregas en curso.',
      metricLabel: `${activeOrdersCount} activos`,
      icon: ShoppingBasket,
      iconGradient: 'from-primary-500 to-rose-600',
      iconShadow: 'shadow-primary-500/25',
      tintSurface: 'bg-primary-50 dark:bg-primary-950/40',
      view: 'admin',
      section: 'orders'
    },
    {
      id: 'menu',
      name: 'Editor de Menú',
      shortName: 'Menú',
      category: 'Carta y precios',
      description: 'Actualiza platillos, precios, categorías y disponibilidad del menú digital.',
      metricLabel: `${menuItemsCount} platillos`,
      icon: UtensilsCrossed,
      iconGradient: 'from-amber-500 to-orange-600',
      iconShadow: 'shadow-amber-500/25',
      tintSurface: 'bg-amber-50 dark:bg-amber-950/40',
      view: 'admin',
      section: 'menu'
    }
  ];

  const allAdvancedApps: SystemAppItem[] = [
    {
      id: 'admin',
      name: 'Administración',
      shortName: 'Admin',
      category: 'Control global',
      description: 'Métricas del negocio, cortes de caja, clientes, personal y auditoría.',
      metricLabel: `${activeOrdersCount} pedidos`,
      icon: ShieldCheck,
      iconGradient: 'from-blue-600 to-indigo-600',
      iconShadow: 'shadow-blue-500/25',
      tintSurface: 'bg-blue-50 dark:bg-blue-950/40',
      view: 'admin',
      section: 'dashboard'
    },
    {
      id: 'menu',
      name: 'Editor de Menú',
      shortName: 'Menú',
      category: 'Carta y precios',
      description: 'Gestiona platillos, actualiza precios, organiza categorías y disponibilidad.',
      metricLabel: `${menuItemsCount} platillos`,
      icon: UtensilsCrossed,
      iconGradient: 'from-amber-500 to-orange-600',
      iconShadow: 'shadow-amber-500/25',
      tintSurface: 'bg-amber-50 dark:bg-amber-950/40',
      view: 'admin',
      section: 'menu'
    },
    {
      id: 'tpv',
      name: 'Punto de Venta',
      shortName: 'TPV',
      category: 'Caja y cobros',
      description: 'Toma rápida de pedidos en mostrador, cobros, tickets y facturación.',
      icon: Monitor,
      iconGradient: 'from-emerald-500 to-teal-600',
      iconShadow: 'shadow-emerald-500/25',
      tintSurface: 'bg-emerald-50 dark:bg-emerald-950/40',
      view: 'tpv'
    },
    {
      id: 'kitchen',
      name: 'Monitor Cocina KDS',
      shortName: 'Cocina',
      category: 'Producción en vivo',
      description: 'Comandas en pantalla para cocina, tiempos de preparación y pase.',
      icon: ChefHat,
      iconGradient: 'from-orange-500 to-rose-600',
      iconShadow: 'shadow-orange-500/25',
      tintSurface: 'bg-orange-50 dark:bg-orange-950/40',
      view: 'kitchen'
    },
    {
      id: 'local_dispatch',
      name: 'Despacho Local',
      shortName: 'Despacho',
      category: 'Salón y mesas',
      description: 'Control de mesas activas, servicio en comedor y órdenes para llevar.',
      icon: Utensils,
      iconGradient: 'from-primary-500 to-pink-600',
      iconShadow: 'shadow-primary-500/25',
      tintSurface: 'bg-rose-50 dark:bg-rose-950/40',
      view: 'local_dispatch'
    },
    {
      id: 'logistics',
      name: 'Logística y Envíos',
      shortName: 'Logística',
      category: 'Flota a domicilio',
      description: 'Asignación de entregas, seguimiento de rutas y despacho a domicilio.',
      metricLabel: `${activeDriversCount} activos`,
      icon: Truck,
      iconGradient: 'from-indigo-500 to-violet-600',
      iconShadow: 'shadow-indigo-500/25',
      tintSurface: 'bg-indigo-50 dark:bg-indigo-950/40',
      view: 'logistics'
    },
    {
      id: 'driver_portal',
      name: 'Portal Repartidor',
      shortName: 'Reparto',
      category: 'Turno y rutas',
      description: 'Vista móvil para repartidores: pedidos asignados, mapa y liquidación.',
      metricLabel: `${activeDriversCount} en turno`,
      icon: Bike,
      iconGradient: 'from-teal-500 to-cyan-600',
      iconShadow: 'shadow-teal-500/25',
      tintSurface: 'bg-teal-50 dark:bg-teal-950/40',
      view: 'driver_portal'
    }
  ];

  const optionalModules = [
    {
      id: 'tpv' as const,
      name: 'Punto de Venta (TPV)',
      category: 'Caja y cobros',
      icon: Monitor,
      gradient: 'from-emerald-500 to-teal-600',
      description: 'Toma rápida de pedidos, cobros en efectivo/tarjeta y tickets de venta.'
    },
    {
      id: 'kitchen' as const,
      name: 'Monitor Cocina KDS',
      category: 'Producción en vivo',
      icon: ChefHat,
      gradient: 'from-orange-500 to-rose-600',
      description: 'Comandas en tiempo real para cocineros y control de preparación.'
    },
    {
      id: 'local_dispatch' as const,
      name: 'Despacho Local',
      category: 'Salón y mesas',
      icon: Utensils,
      gradient: 'from-primary-500 to-pink-600',
      description: 'Gestión de mesas activas, servicio en barra y entregas en mostrador.'
    },
    {
      id: 'logistics' as const,
      name: 'Logística y Envíos',
      category: 'Flota y domicilio',
      icon: Truck,
      gradient: 'from-indigo-500 to-violet-600',
      description: 'Asignación de pedidos a domicilio y monitoreo de repartidores.'
    },
    {
      id: 'driver_portal' as const,
      name: 'Portal Repartidor',
      category: 'Turno y rutas',
      icon: Bike,
      gradient: 'from-teal-500 to-cyan-600',
      description: 'Acceso directo para repartidores con entregas asignadas y cobros.'
    }
  ];

  const visibleAdvancedApps = allAdvancedApps.filter((app) => {
    if (app.id in enabledModules) {
      return enabledModules[app.id as keyof EnabledModules];
    }
    return true;
  });

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredAdvancedApps = normalizedQuery
    ? visibleAdvancedApps.filter(
        (app) =>
          app.name.toLowerCase().includes(normalizedQuery) ||
          app.category.toLowerCase().includes(normalizedQuery) ||
          app.description.toLowerCase().includes(normalizedQuery)
      )
    : visibleAdvancedApps;

  const displayedApps = panelMode === 'basic' ? basicApps : filteredAdvancedApps;

  const renderSettingsModal = () => (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsSettingsOpen(false)}
      />

      <div className="relative z-10 w-full sm:max-w-2xl max-h-[88vh] bg-[#FDFBFC] dark:bg-[#190f17] rounded-t-[32px] sm:rounded-[32px] shadow-2xl border border-gray-200/80 dark:border-white/10 overflow-hidden flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Android Bottom Sheet Drag Handle */}
        <div className="w-10 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mt-3 sm:hidden shrink-0" />

        {/* Sheet Header */}
        <div className="px-6 py-4 sm:px-7 sm:py-5 border-b border-gray-200/70 dark:border-white/10 flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h3
              id="settings-modal-title"
              className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight truncate"
            >
              Configuración del Panel
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
              Personaliza módulos activos y tema visual
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            aria-label="Cerrar configuración"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Material Segmented Tabs */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                setSettingsTab('modules');
                soundManager.play('click');
              }}
              className={`min-h-[40px] flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                settingsTab === 'modules'
                  ? 'bg-white dark:bg-[#261823] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4 text-primary-500" />
              <span>Módulos ({activeModulesCount}/5)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSettingsTab('appearance');
                soundManager.play('click');
              }}
              className={`min-h-[40px] flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                settingsTab === 'appearance'
                  ? 'bg-white dark:bg-[#261823] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {isDarkMode ? (
                <Moon className="w-4 h-4 text-primary-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span>Tema y Pantalla</span>
            </button>
          </div>
        </div>

        {/* Sheet Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          {settingsTab === 'modules' ? (
            <>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#22151f] border border-gray-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Módulos de operación
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    Activa únicamente las pantallas que usa tu equipo hoy.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAllModules(false)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Solo Esenciales
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllModules(true)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Activar Todos
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200/70 dark:divide-white/10 rounded-3xl bg-white dark:bg-[#22151f] border border-gray-200/80 dark:border-white/10 overflow-hidden">
                {optionalModules.map((mod) => {
                  const isEnabled = enabledModules[mod.id];
                  return (
                    <div
                      key={mod.id}
                      className="p-4 flex items-center justify-between gap-4 transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.03]"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div
                          className={`w-11 h-11 rounded-[16px] bg-gradient-to-br ${mod.gradient} flex items-center justify-center shrink-0 text-white shadow-sm transition-opacity ${
                            isEnabled ? 'opacity-100' : 'opacity-40 grayscale'
                          }`}
                        >
                          <mod.icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {mod.name}
                          </h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {mod.category} · {mod.description}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={isEnabled}
                        aria-label={`${isEnabled ? 'Desactivar' : 'Activar'} ${mod.name}`}
                        onClick={() => toggleModule(mod.id)}
                        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-200 ${
                          isEnabled
                            ? 'bg-primary-500'
                            : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                            isEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-[#22151f] border border-gray-200/80 dark:border-white/10 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Apariencia del sistema
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Sincronizada con el diseño editorial de tu sitio principal.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.play('click');
                      setIsDarkMode?.(false);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      !isDarkMode
                        ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/30 text-gray-900 dark:text-white'
                        : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Modo Claro</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Día · Limpio</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundManager.play('click');
                      setIsDarkMode?.(true);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      isDarkMode
                        ? 'border-primary-500 bg-primary-500/10 text-white'
                        : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#2a1726] text-primary-400 flex items-center justify-center shrink-0">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Modo Oscuro</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Noche · Suave</p>
                    </div>
                  </button>
                </div>
              </div>

              {!isInstalled && (
                <div className="p-5 rounded-3xl bg-white dark:bg-[#22151f] border border-gray-200/80 dark:border-white/10 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Instalar como aplicación Android / PWA
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Abre el panel directo desde la pantalla de inicio de tu teléfono.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.play('click');
                      installApp();
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Instalar</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sheet Footer */}
        <div className="px-6 py-4 border-t border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-black/20 flex justify-end shrink-0">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="min-h-[44px] px-6 py-2.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-primary-500 dark:hover:bg-primary-500 dark:hover:text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBFC] dark:bg-[#110a10] text-gray-900 dark:text-gray-100 font-sans flex flex-col md:flex-row transition-colors duration-300">
      {/* Desktop Navigation Rail (Android Tablet / ChromeOS Executive Sidebar) */}
      <aside className="hidden md:flex w-64 lg:w-72 shrink-0 flex-col justify-between border-r border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-[#160d14]/90 backdrop-blur-xl p-5 sticky top-0 h-screen">
        <div className="space-y-6 overflow-y-auto custom-scrollbar pr-1">
          {/* Single-Element Brand Header */}
          <div className="flex items-center gap-3 px-2 pt-1">
            <img
              src={brandLogoSrc}
              alt="Tlayoyos 3 Marías"
              referrerPolicy="no-referrer"
              className="w-10 h-10 object-contain shrink-0"
            />
            <div className="min-w-0">
              <span className="block text-base font-black tracking-tight text-gray-900 dark:text-white truncate">
                Tlayoyos 3 Marías
              </span>
              <span className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">
                Centro operativo
              </span>
            </div>
          </div>

          {/* Primary Mode Navigation */}
          <nav aria-label="Modos del panel" className="space-y-1">
            <button
              type="button"
              onClick={() => changePanelMode('basic')}
              className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl flex items-center gap-3 text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                panelMode === 'basic'
                  ? 'bg-primary-500/12 text-primary-600 dark:bg-primary-500/20 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span className="truncate">Vista Esencial</span>
            </button>

            <button
              type="button"
              onClick={() => changePanelMode('advanced')}
              className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl flex items-center gap-3 text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                panelMode === 'advanced'
                  ? 'bg-primary-500/12 text-primary-600 dark:bg-primary-500/20 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span className="truncate">Todos los Módulos ({visibleAdvancedApps.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSettingsTab('modules');
                setIsSettingsOpen(true);
                soundManager.play('click');
              }}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span className="truncate">Configurar Módulos</span>
            </button>
          </nav>

          {/* Direct App Launchers inside Rail */}
          <div className="pt-2 border-t border-gray-200/70 dark:border-white/10 space-y-1.5">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Accesos rápidos
            </p>
            {(panelMode === 'basic' ? basicApps : visibleAdvancedApps).map((app) => (
              <button
                key={`rail-${app.id}`}
                type="button"
                onClick={() => handleAppClick(app.view, app.section)}
                className="w-full min-h-[40px] px-3 py-2 rounded-xl flex items-center gap-3 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span
                  className={`w-7 h-7 rounded-[10px] bg-gradient-to-br ${app.iconGradient} flex items-center justify-center text-white shrink-0 shadow-xs`}
                >
                  <app.icon className="w-3.5 h-3.5" />
                </span>
                <span className="truncate">{app.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Rail Bottom Controls */}
        <div className="pt-4 border-t border-gray-200/70 dark:border-white/10 space-y-1.5">
          {!isInstalled && (
            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                installApp();
              }}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-2xl flex items-center gap-3 text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Instalar App Móvil</span>
            </button>
          )}

          {setIsDarkMode && (
            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setIsDarkMode(!isDarkMode);
              }}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-2xl flex items-center gap-3 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer whitespace-nowrap"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Moon className="w-4 h-4 text-gray-500 shrink-0" />
              )}
              <span>{isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenPublicSite}
            className="w-full min-h-[42px] px-3.5 py-2 rounded-2xl flex items-center gap-3 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>Ver Sitio Público</span>
          </button>

          <button
            type="button"
            onClick={onExit}
            className="w-full min-h-[42px] px-3.5 py-2 rounded-2xl flex items-center gap-3 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Compact Android Top App Bar */}
      <header className="md:hidden sticky top-0 z-30 h-14 px-4 bg-[#FDFBFC]/95 dark:bg-[#110a10]/95 backdrop-blur-xl border-b border-gray-200/80 dark:border-white/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={brandLogoSrc}
            alt="Tlayoyos 3 Marías"
            referrerPolicy="no-referrer"
            className="w-8 h-8 object-contain shrink-0"
          />
          <span className="text-sm font-black tracking-tight text-gray-900 dark:text-white truncate">
            Panel de Control
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {setIsDarkMode && (
            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setIsDarkMode(!isDarkMode);
              }}
              aria-label={isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setSettingsTab('modules');
              setIsSettingsOpen(true);
              soundManager.play('click');
            }}
            aria-label="Configurar módulos"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onExit}
            aria-label="Cerrar sesión"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
          >
            <Power className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 pb-24 md:pb-12">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 lg:px-10 py-6 sm:py-10 space-y-6 sm:space-y-8">
          {/* Editorial Header Section (Clean Index Aesthetic) */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-gray-200/80 dark:border-white/10">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary-600 dark:text-primary-400">
                Administración · Tlayoyos 3 Marías
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 dark:text-white text-balance">
                Panel de{' '}
                <span className="text-primary-500 font-serif italic font-normal">Control</span>
              </h1>
              {/* Clean Unboxed Live Operational Summary (Tabular Numerals, Zero Pills) */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 tabular-nums pt-1">
                <span>
                  <strong className="text-gray-900 dark:text-white font-bold">{activeOrdersCount}</strong>{' '}
                  {activeOrdersCount === 1 ? 'pedido activo' : 'pedidos activos'}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="text-gray-900 dark:text-white font-bold">{menuItemsCount}</strong>{' '}
                  platillos en carta
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="text-gray-900 dark:text-white font-bold">{activeModulesCount}/5</strong>{' '}
                  módulos opcionales
                </span>
              </div>
            </div>

            {/* Android Material Segmented Mode Control & Modules Trigger */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div className="inline-flex p-1 rounded-2xl bg-gray-100 dark:bg-[#1c1119] border border-gray-200/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => changePanelMode('basic')}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    panelMode === 'basic'
                      ? 'bg-white dark:bg-[#2a1b26] text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Home className="w-3.5 h-3.5 text-primary-500" />
                  <span>Esencial</span>
                </button>
                <button
                  type="button"
                  onClick={() => changePanelMode('advanced')}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    panelMode === 'advanced'
                      ? 'bg-white dark:bg-[#2a1b26] text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-primary-500" />
                  <span>Avanzado</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSettingsTab('modules');
                  setIsSettingsOpen(true);
                  soundManager.play('click');
                }}
                className="hidden sm:inline-flex min-h-[44px] px-4 py-2 rounded-2xl bg-white dark:bg-[#1c1119] border border-gray-200/80 dark:border-white/10 hover:border-primary-500/50 text-xs font-bold text-gray-700 dark:text-gray-200 items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Boxes className="w-4 h-4 text-primary-500" />
                <span>Módulos</span>
              </button>
            </div>
          </div>

          {/* Search Bar in Advanced Mode */}
          {panelMode === 'advanced' && (
            <div className="relative max-w-md">
              <Search
                className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar módulo (ej. cocina, caja, menú)..."
                aria-label="Buscar módulo del panel"
                className="w-full h-12 pl-11 pr-10 rounded-2xl bg-white dark:bg-[#1a1118] border border-gray-200/90 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Native Android App Launcher Grid */}
          {displayedApps.length > 0 ? (
            <div
              className={
                panelMode === 'basic'
                  ? 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'
                  : 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5'
              }
            >
              {displayedApps.map((app) => {
                const IconComponent = app.icon;
                if (panelMode === 'basic') {
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => handleAppClick(app.view, app.section)}
                      className="group w-full text-left p-5 sm:p-7 rounded-[28px] bg-white dark:bg-[#1a1118] border border-gray-200/80 dark:border-white/10 hover:border-primary-500/40 shadow-sm hover:shadow-xl hover:shadow-primary-950/5 dark:hover:shadow-black/40 transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] flex items-center gap-4 sm:gap-5 cursor-pointer"
                    >
                      {/* Adaptive Android Squircle App Icon */}
                      <div
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[22px] sm:rounded-[26px] bg-gradient-to-br ${app.iconGradient} flex items-center justify-center shrink-0 text-white shadow-lg ${app.iconShadow} ring-1 ring-inset ring-white/25 group-hover:scale-105 transition-transform duration-200`}
                      >
                        <IconComponent className="w-8 h-8 sm:w-9 sm:h-9" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                          <span className="truncate">{app.category}</span>
                          {app.metricLabel && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-bold text-primary-600 dark:text-primary-400 tabular-nums whitespace-nowrap">
                                {app.metricLabel}
                              </span>
                            </>
                          )}
                        </div>
                        <h2 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight mt-0.5 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {app.name}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                          {app.description}
                        </p>
                      </div>

                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-primary-500 group-hover:text-white transition-colors shrink-0">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </button>
                  );
                }

                // Advanced Mode: Compact Android App Icon Card on Mobile, Rich Module Tile on Desktop
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleAppClick(app.view, app.section)}
                    className="group text-left p-4 sm:p-6 rounded-[26px] sm:rounded-[28px] bg-white dark:bg-[#1a1118] border border-gray-200/80 dark:border-white/10 hover:border-primary-500/40 shadow-sm hover:shadow-xl hover:shadow-primary-950/5 dark:hover:shadow-black/40 transition-all duration-200 hover:-translate-y-1 active:scale-[0.97] flex flex-col justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Adaptive Android Squircle App Icon */}
                      <div
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] sm:rounded-[22px] bg-gradient-to-br ${app.iconGradient} flex items-center justify-center shrink-0 text-white shadow-md ${app.iconShadow} ring-1 ring-inset ring-white/25 group-hover:scale-105 transition-transform duration-200`}
                      >
                        <IconComponent className="w-7 h-7 sm:w-8 sm:h-8" />
                      </div>

                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-primary-500 group-hover:text-white transition-colors shrink-0">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">
                        <span className="truncate">{app.category}</span>
                        {app.metricLabel && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-bold text-primary-600 dark:text-primary-400 tabular-nums shrink-0">
                              {app.metricLabel}
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white tracking-tight truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {app.name}
                      </h3>
                      <p className="hidden sm:line-clamp-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {app.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 sm:p-12 rounded-[28px] bg-white dark:bg-[#1a1118] border border-gray-200/80 dark:border-white/10 text-center space-y-3">
              <p className="text-base font-bold text-gray-900 dark:text-white">
                No se encontraron módulos para "{searchQuery}"
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Prueba otra palabra o revisa qué módulos están activos en Configuración.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-xs font-bold text-gray-800 dark:text-white cursor-pointer"
                >
                  Limpiar búsqueda
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSettingsTab('modules');
                    setIsSettingsOpen(true);
                  }}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-primary-500 text-xs font-bold text-white cursor-pointer"
                >
                  Configurar Módulos
                </button>
              </div>
            </div>
          )}

          {/* Contextual Mode Switch Callout */}
          <div className="p-5 rounded-[24px] bg-white dark:bg-[#1a1118] border border-gray-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {panelMode === 'basic'
                  ? '¿Operas Punto de Venta, Cocina o Repartidores?'
                  : '¿Prefieres solo Pedidos y Editor de Menú?'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {panelMode === 'basic'
                  ? `Cambia a Vista Avanzada para abrir los ${visibleAdvancedApps.length} sistemas operativos del restaurante.`
                  : 'Regresa a la Vista Esencial para enfocarte únicamente en pedidos entrantes y carta.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => changePanelMode(panelMode === 'basic' ? 'advanced' : 'basic')}
              className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-primary-500 dark:hover:bg-primary-500 dark:hover:text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {panelMode === 'basic' ? 'Ir a Vista Avanzada' : 'Ir a Vista Esencial'}
            </button>
          </div>
        </div>
      </main>

      {/* Mobile Android Material-3 Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Navegación móvil del panel"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-[#180e16]/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-white/10 grid grid-cols-4 items-center px-2"
      >
        <button
          type="button"
          onClick={() => changePanelMode('basic')}
          className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 cursor-pointer"
        >
          <span
            className={`px-4 py-1 rounded-full transition-colors ${
              panelMode === 'basic'
                ? 'bg-primary-500/15 text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Home className="w-5 h-5" />
          </span>
          <span
            className={`text-[10px] font-bold tracking-tight ${
              panelMode === 'basic'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Esencial
          </span>
        </button>

        <button
          type="button"
          onClick={() => changePanelMode('advanced')}
          className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 cursor-pointer"
        >
          <span
            className={`px-4 py-1 rounded-full transition-colors ${
              panelMode === 'advanced'
                ? 'bg-primary-500/15 text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
          </span>
          <span
            className={`text-[10px] font-bold tracking-tight ${
              panelMode === 'advanced'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Módulos
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSettingsTab('modules');
            setIsSettingsOpen(true);
            soundManager.play('click');
          }}
          className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 cursor-pointer"
        >
          <span
            className={`px-4 py-1 rounded-full transition-colors ${
              isSettingsOpen
                ? 'bg-primary-500/15 text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Sliders className="w-5 h-5" />
          </span>
          <span
            className={`text-[10px] font-bold tracking-tight ${
              isSettingsOpen
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Ajustes
          </span>
        </button>

        <button
          type="button"
          onClick={handleOpenPublicSite}
          className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 cursor-pointer text-gray-500 dark:text-gray-400 hover:text-primary-500"
        >
          <span className="px-4 py-1 rounded-full">
            <Globe className="w-5 h-5" />
          </span>
          <span className="text-[10px] font-bold tracking-tight">Sitio Web</span>
        </button>
      </nav>

      {isSettingsOpen && renderSettingsModal()}

      <InstallPwaModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        isIos={isIos}
      />
    </div>
  );
}
