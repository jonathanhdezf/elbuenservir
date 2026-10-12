import React, { useState, useEffect } from 'react';
import {
    ChefHat,
    Truck,
    Monitor,
    Utensils,
    Lock,
    LayoutDashboard,
    X,
    Settings,
    Bell,
    Search,
    Power,
    Bike,
    Palette,
    Sparkles,
    Check,
    UtensilsCrossed,
    ArrowRight,
    Download,
    ShieldCheck,
    ShoppingBasket,
    Globe,
    Sliders,
    Layers,
    Boxes,
    CheckCircle2
} from 'lucide-react';
import { soundManager } from '../utils/soundManager';
import { useMobileBack } from '../hooks/useMobileBack';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { InstallPwaModal } from '../components/InstallPwaModal';
import { AdminSection, EnabledModules, DEFAULT_ENABLED_MODULES } from '../types';

interface ControlPanelViewProps {
    onNavigate: (view: 'admin' | 'public' | 'kitchen' | 'logistics' | 'tpv' | 'local_dispatch' | 'driver_portal', section?: AdminSection) => void;
    onExit: () => void;
    isDarkMode: boolean;
    systemBgColor: string;
    setSystemBgColor: (color: string) => void;
    systemBgEffect: 'none' | 'gradient' | 'animated-blobs' | 'stars';
    setSystemBgEffect: (effect: 'none' | 'gradient' | 'animated-blobs' | 'stars') => void;
    panelMode?: 'basic' | 'advanced';
    setPanelMode?: (mode: 'basic' | 'advanced') => void;
    enabledModules?: EnabledModules;
    setEnabledModules?: React.Dispatch<React.SetStateAction<EnabledModules>>;
}

export default function ControlPanelView({
    onNavigate,
    onExit,
    isDarkMode,
    systemBgColor,
    setSystemBgColor,
    systemBgEffect,
    setSystemBgEffect,
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
    const [showWelcome, setShowWelcome] = useState(false);

    const toggleModule = (moduleId: keyof EnabledModules) => {
        soundManager.play('click');
        setEnabledModules(prev => ({
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
            driver_portal: enabled,
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

    // Welcome message is now shown cleanly via tooltip on the notification bell without auto-popping alerts

    useMobileBack({
        hasOpenModal: isSettingsOpen,
        onCloseModal: () => setIsSettingsOpen(false),
        onExit
    });

    const advancedApps = [
        {
            id: 'admin',
            name: 'Administración',
            badge: 'Control Total',
            badgeIcon: ShieldCheck,
            icon: Lock,
            gradient: 'from-blue-600 to-indigo-600',
            glowColor: 'bg-blue-400',
            shadowColor: 'shadow-blue-500/25',
            borderHover: 'hover:border-blue-500/50',
            shadowHover: 'hover:shadow-blue-500/20',
            badgeStyle: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
            titleHover: 'group-hover:text-blue-400',
            actionColor: 'text-blue-400',
            description: 'Métricas del negocio, cortes de caja, usuarios y auditoría global.',
            actionText: 'Abrir Administración',
            view: 'admin' as const,
            section: 'dashboard' as const
        },
        {
            id: 'menu',
            name: 'Editor de Menú',
            badge: 'Catálogo & Precios',
            badgeIcon: Sparkles,
            icon: UtensilsCrossed,
            gradient: 'from-amber-500 to-orange-500',
            glowColor: 'bg-amber-400',
            shadowColor: 'shadow-amber-500/25',
            borderHover: 'hover:border-amber-500/50',
            shadowHover: 'hover:shadow-amber-500/20',
            badgeStyle: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
            titleHover: 'group-hover:text-amber-400',
            actionColor: 'text-amber-400',
            description: 'Gestiona platillos, actualiza precios, organiza categorías y disponibilidad.',
            actionText: 'Abrir Editor de Menú',
            view: 'admin' as const,
            section: 'menu' as const
        },
        {
            id: 'tpv',
            name: 'Punto de Venta',
            badge: 'Caja & Cobros',
            badgeIcon: Monitor,
            icon: Monitor,
            gradient: 'from-emerald-500 to-teal-600',
            glowColor: 'bg-emerald-400',
            shadowColor: 'shadow-emerald-500/25',
            borderHover: 'hover:border-emerald-500/50',
            shadowHover: 'hover:shadow-emerald-500/20',
            badgeStyle: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
            titleHover: 'group-hover:text-emerald-400',
            actionColor: 'text-emerald-400',
            description: 'Toma rápida de pedidos, cobros en caja, tickets de venta y facturación.',
            actionText: 'Abrir Punto de Venta',
            view: 'tpv' as const
        },
        {
            id: 'kitchen',
            name: 'Monitor Cocina KDS',
            badge: 'Producción en Vivo',
            badgeIcon: ChefHat,
            icon: ChefHat,
            gradient: 'from-orange-500 to-rose-600',
            glowColor: 'bg-orange-400',
            shadowColor: 'shadow-orange-500/25',
            borderHover: 'hover:border-orange-500/50',
            shadowHover: 'hover:shadow-orange-500/20',
            badgeStyle: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
            titleHover: 'group-hover:text-orange-400',
            actionColor: 'text-orange-400',
            description: 'Comandas en tiempo real para cocina, tiempos de preparación y pase.',
            actionText: 'Abrir Monitor KDS',
            view: 'kitchen' as const
        },
        {
            id: 'local_dispatch',
            name: 'Despacho Local',
            badge: 'Salón & Mesas',
            badgeIcon: Utensils,
            icon: Utensils,
            gradient: 'from-rose-500 to-pink-600',
            glowColor: 'bg-rose-400',
            shadowColor: 'shadow-rose-500/25',
            borderHover: 'hover:border-rose-500/50',
            shadowHover: 'hover:shadow-rose-500/20',
            badgeStyle: 'bg-rose-500/20 border-rose-500/30 text-rose-300',
            titleHover: 'group-hover:text-rose-400',
            actionColor: 'text-rose-400',
            description: 'Gestión de mesas activas, servicio en barra y entrega de comida para llevar.',
            actionText: 'Abrir Despacho',
            view: 'local_dispatch' as const
        },
        {
            id: 'logistics',
            name: 'Logística y Envíos',
            badge: 'Flota & Domicilio',
            badgeIcon: Truck,
            icon: Truck,
            gradient: 'from-indigo-500 to-purple-600',
            glowColor: 'bg-indigo-400',
            shadowColor: 'shadow-indigo-500/25',
            borderHover: 'hover:border-indigo-500/50',
            shadowHover: 'hover:shadow-indigo-500/20',
            badgeStyle: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300',
            titleHover: 'group-hover:text-indigo-400',
            actionColor: 'text-indigo-400',
            description: 'Asignación de pedidos a domicilio, rutas inteligentes y monitoreo de flota.',
            actionText: 'Abrir Logística',
            view: 'logistics' as const
        },
        {
            id: 'driver_portal',
            name: 'Portal Repartidor',
            badge: 'Turno & Rutas',
            badgeIcon: Bike,
            icon: Bike,
            gradient: 'from-teal-500 to-cyan-600',
            glowColor: 'bg-teal-400',
            shadowColor: 'shadow-teal-500/25',
            borderHover: 'hover:border-teal-500/50',
            shadowHover: 'hover:shadow-teal-500/20',
            badgeStyle: 'bg-teal-500/20 border-teal-500/30 text-teal-300',
            titleHover: 'group-hover:text-teal-400',
            actionColor: 'text-teal-400',
            description: 'Acceso para repartidores: entregas asignadas, navegación y liquidación.',
            actionText: 'Abrir Portal Repartidor',
            view: 'driver_portal' as const
        }
    ];

    const handleAppClick = (view: any, section?: AdminSection) => {
        soundManager.play('navigation');
        onNavigate(view, section);
    };

    const optionalModules = [
        {
            id: 'tpv' as const,
            name: 'Punto de Venta (TPV)',
            badge: 'Caja & Cobros',
            icon: Monitor,
            gradient: 'from-emerald-500 to-teal-600',
            badgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            description: 'Toma rápida de pedidos, cobros en efectivo/tarjeta, tickets de venta y facturación.'
        },
        {
            id: 'kitchen' as const,
            name: 'Monitor Cocina KDS',
            badge: 'Producción en Vivo',
            icon: ChefHat,
            gradient: 'from-orange-500 to-rose-600',
            badgeStyle: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
            description: 'Comandas en tiempo real para cocineros, tiempos de preparación y pase de platillos.'
        },
        {
            id: 'local_dispatch' as const,
            name: 'Despacho Local',
            badge: 'Salón & Mesas',
            icon: Utensils,
            gradient: 'from-rose-500 to-pink-600',
            badgeStyle: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
            description: 'Gestión de mesas activas, servicio en barra y entrega de comida para llevar.'
        },
        {
            id: 'logistics' as const,
            name: 'Logística y Envíos',
            badge: 'Flota & Domicilio',
            icon: Truck,
            gradient: 'from-indigo-500 to-purple-600',
            badgeStyle: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
            description: 'Asignación de pedidos a domicilio, rutas inteligentes y monitoreo de repartidores.'
        },
        {
            id: 'driver_portal' as const,
            name: 'Portal Repartidor',
            badge: 'Turno & Rutas',
            icon: Bike,
            gradient: 'from-teal-500 to-cyan-600',
            badgeStyle: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
            description: 'Acceso para repartidores: entregas asignadas, navegación y liquidación.'
        }
    ];

    const visibleAdvancedApps = advancedApps.filter(app => {
        if (app.id in enabledModules) {
            return enabledModules[app.id as keyof EnabledModules];
        }
        return true;
    });

    const renderSettingsModal = () => (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsSettingsOpen(false)}></div>
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[90vh] rounded-[36px] sm:rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-800">
                
                {/* Modal Header */}
                <div className="p-6 sm:p-7 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/70 dark:bg-white/5 shrink-0">
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                            Configuración del Sistema
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                            Personaliza los módulos activos y la apariencia de tu panel
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsSettingsOpen(false)} 
                        title="Cerrar configuración"
                        className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded-2xl transition-all cursor-pointer active:scale-95"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs bar */}
                <div className="flex border-b border-gray-100 dark:border-gray-800 px-6 sm:px-8 bg-gray-50/30 dark:bg-black/20 shrink-0">
                    <button
                        type="button"
                        onClick={() => { setSettingsTab('modules'); soundManager.play('click'); }}
                        className={`flex items-center gap-2 py-3.5 px-4 font-black text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                            settingsTab === 'modules'
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                        }`}
                    >
                        <Sliders className="w-4 h-4" />
                        <span>Módulos del Negocio</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-500 dark:text-primary-400 font-black">
                            {activeModulesCount}/5
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setSettingsTab('appearance'); soundManager.play('click'); }}
                        className={`flex items-center gap-2 py-3.5 px-4 font-black text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                            settingsTab === 'appearance'
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                        }`}
                    >
                        <Palette className="w-4 h-4" />
                        <span>Apariencia & Fondo</span>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                    {settingsTab === 'modules' ? (
                        <div className="space-y-6">
                            {/* Explanatory banner & quick presets */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-gray-800 dark:text-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-xs sm:text-sm font-black text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                                        Adapta el sistema a tu negocio
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                                        No todo negocio necesita todos los módulos. Puedes comenzar con lo básico (Pedidos y Menú) y activar más herramientas cuando las requieras.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={() => setAllModules(false)}
                                        className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 text-center"
                                        title="Desactivar todos los opcionales y dejar solo lo esencial"
                                    >
                                        Solo Básicos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAllModules(true)}
                                        className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 text-center"
                                        title="Habilitar todos los módulos del sistema"
                                    >
                                        Activar Todos
                                    </button>
                                </div>
                            </div>

                            {/* Core Modules (Always Active) */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                        Módulos Esenciales (Siempre Activos)
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 flex items-start gap-3.5">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 text-white">
                                            <ShoppingBasket className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h5 className="text-sm font-black text-gray-900 dark:text-white truncate">Administración (Pedidos)</h5>
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                                    Esencial
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                                                Supervisión en vivo de pedidos entrantes, comandas y entregas.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 flex items-start gap-3.5">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 text-white">
                                            <UtensilsCrossed className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h5 className="text-sm font-black text-gray-900 dark:text-white truncate">Editor de Menú</h5>
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                                    Esencial
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                                                Gestión de platillos, precios, categorías y disponibilidad.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Optional Modules */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <Boxes className="w-4 h-4 text-primary-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
                                            Módulos Opcionales de Operación
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400">
                                        {activeModulesCount} de 5 habilitados
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {optionalModules.map(mod => {
                                        const isEnabled = enabledModules[mod.id];
                                        return (
                                            <div
                                                key={mod.id}
                                                className={`p-4 sm:p-4.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                                                    isEnabled
                                                        ? 'bg-white dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 shadow-sm'
                                                        : 'bg-gray-50/60 dark:bg-gray-900/40 border-gray-200/60 dark:border-gray-800/60 opacity-60'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${mod.gradient} flex items-center justify-center shrink-0 shadow-md ${isEnabled ? 'scale-100' : 'grayscale opacity-70'} transition-all`}>
                                                        <mod.icon className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h5 className="text-sm font-black text-gray-900 dark:text-white">
                                                                {mod.name}
                                                            </h5>
                                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${mod.badgeStyle}`}>
                                                                {mod.badge}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug line-clamp-2">
                                                            {mod.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:inline ${
                                                        isEnabled ? 'text-emerald-500' : 'text-gray-400'
                                                    }`}>
                                                        {isEnabled ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={isEnabled}
                                                        onClick={() => toggleModule(mod.id)}
                                                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${
                                                            isEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'
                                                        }`}
                                                        title={isEnabled ? `Desactivar ${mod.name}` : `Activar ${mod.name}`}
                                                    >
                                                        <span
                                                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                                isEnabled ? 'translate-x-5' : 'translate-x-0'
                                                            }`}
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Background Color */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Palette className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Color de Fondo</span>
                                </div>
                                <div className="grid grid-cols-5 gap-3">
                                    {['#0f172a', '#1e1b4b', '#312e81', '#111827', '#000000'].map(color => (
                                        <button
                                            key={color}
                                            title={`Cambiar fondo a ${color}`}
                                            aria-label={`Cambiar fondo a ${color}`}
                                            onClick={() => { setSystemBgColor(color); soundManager.play('click'); }}
                                            className={`w-full aspect-square rounded-2xl border-4 transition-all cursor-pointer ${systemBgColor === color ? 'border-primary-500 scale-110 shadow-lg shadow-primary-500/20' : 'border-transparent hover:scale-105'}`}
                                            ref={(el) => { if (el) el.style.backgroundColor = color; }}
                                        >
                                            {systemBgColor === color && <Check className="w-4 h-4 text-white mx-auto" />}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3 mt-4">
                                    <input
                                        type="color"
                                        title="Elegir color de fondo personalizado"
                                        value={systemBgColor}
                                        onChange={(e) => setSystemBgColor(e.target.value)}
                                        className="w-12 h-12 rounded-xl bg-transparent border-none cursor-pointer p-0"
                                    />
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{systemBgColor}</span>
                                </div>
                            </div>

                            {/* Background Effects */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Efectos Visuales</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'none', label: 'Sin Efectos' },
                                        { id: 'gradient', label: 'Degradado Suave' },
                                        { id: 'animated-blobs', label: 'Blobs Animados' },
                                        { id: 'stars', label: 'Cielo Estrellado' }
                                    ].map(effect => (
                                        <button
                                            key={effect.id}
                                            onClick={() => { setSystemBgEffect(effect.id as any); soundManager.play('click'); }}
                                            className={`p-4 rounded-2xl border-2 font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer ${systemBgEffect === effect.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-200'}`}
                                        >
                                            {effect.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/5 flex justify-end shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsSettingsOpen(false)}
                        className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-primary-500/20 cursor-pointer active:scale-95"
                    >
                        Listo / Guardar
                    </button>
                </div>

            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center font-sans overflow-hidden" data-bg={systemBgColor} ref={(el) => { if (el) el.style.backgroundColor = systemBgColor; }}>
            {/* Dynamic Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                {systemBgEffect === 'gradient' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-black/0 via-primary-500/10 to-black/30"></div>
                )}

                {systemBgEffect === 'animated-blobs' && (
                    <>
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse"></div>
                        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
                        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[100px] animate-bounce duration-[10s]"></div>
                    </>
                )}

                {systemBgEffect === 'stars' && (
                    <div className="absolute inset-0">
                        {[...Array(50)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute bg-white rounded-full animate-pulse"
                                ref={(el) => {
                                    if (el) {
                                        el.style.width = Math.random() * 3 + 'px';
                                        el.style.height = el.style.width;
                                        el.style.top = Math.random() * 100 + '%';
                                        el.style.left = Math.random() * 100 + '%';
                                        el.style.animationDelay = Math.random() * 5 + 's';
                                        el.style.opacity = String(Math.random() * 0.5 + 0.2);
                                    }
                                }}
                            ></div>
                        ))}
                    </div>
                )}
            </div>

            {/* Top Bar (OS Style) */}
            <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-center text-white/50 z-20">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                        <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full animate-ping ${panelMode === 'basic' ? 'bg-amber-400' : 'bg-emerald-500'}`}></div>
                        <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${panelMode === 'basic' ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {panelMode === 'basic' ? 'Vista Básica' : 'Vista Avanzada'}
                        </span>
                    </div>
                    <span className="hidden md:inline text-[10px] font-bold uppercase tracking-[0.3em]">v2.4.0 Premium</span>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-4">
                    {/* Botón de acceso directo al sitio web público / index */}
                    <button
                        type="button"
                        title="Ver Sitio Web / Menú Público"
                        onClick={() => {
                            soundManager.play('click');
                            onExit();
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-white/70 hover:text-white transition-all cursor-pointer rounded-xl hover:bg-white/10 group relative border border-white/10 hover:border-emerald-400/40 bg-white/5 active:scale-95 shadow-sm"
                    >
                        <Globe className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline text-[11px] font-bold text-white/80 group-hover:text-white">Sitio Web</span>
                        
                        {/* Tooltip */}
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-900/95 text-white text-[10px] font-bold rounded-lg shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[220]">
                            Ir al Sitio Web / Menú Público
                        </div>
                    </button>

                    {!isInstalled && (
                        <button
                            type="button"
                            title="Instalar aplicación en tu dispositivo"
                            onClick={() => {
                                soundManager.play('click');
                                installApp();
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-500/20 hover:bg-primary-500 text-primary-300 hover:text-white border border-primary-500/40 transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-sm active:scale-95"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Instalar App</span>
                        </button>
                    )}

                    {/* Campana de Notificaciones con Tooltip */}
                    <div className="relative group">
                        <button
                            type="button"
                            title="Notificaciones"
                            onClick={() => {
                                setShowWelcome(!showWelcome);
                                soundManager.play('click');
                            }}
                            className={`p-1.5 transition-colors cursor-pointer rounded-xl hover:bg-white/10 relative ${
                                showWelcome ? 'text-primary-400' : 'text-white/60 hover:text-white'
                            }`}
                        >
                            <Bell className="w-4 h-4" />
                            <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-gray-900"></div>
                        </button>

                        {/* Tooltip con el mensaje */}
                        <div className={`absolute right-0 top-full mt-2 w-72 sm:w-80 p-3.5 bg-gray-900/95 dark:bg-black/95 text-white rounded-2xl shadow-2xl border border-white/15 backdrop-blur-xl z-[220] transition-all duration-200 ${
                            showWelcome
                                ? 'opacity-100 scale-100 visible pointer-events-auto'
                                : 'opacity-0 scale-95 invisible pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:visible'
                        }`}>
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-md bg-primary-500/20 flex items-center justify-center text-primary-400">
                                        <Bell className="w-3 h-3" />
                                    </div>
                                    <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest">
                                        {panelMode === 'basic' ? 'Vista Básica Activa' : 'Sistemas Listos'}
                                    </span>
                                </div>
                                {showWelcome && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowWelcome(false);
                                        }}
                                        className="text-white/40 hover:text-white p-0.5 cursor-pointer"
                                        title="Cerrar tooltip"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                            <p className="text-xs font-medium text-white/80 leading-relaxed">
                                {panelMode === 'basic'
                                    ? 'Estás en la vista básica con acceso a Administración (Pedidos) y Editor de Menú. Puedes cambiar a la vista avanzada para ver todos los sistemas.'
                                    : 'Bienvenido Miguel 👋 los sistemas están listos, es un gusto trabajar contigo. :)'
                                }
                            </p>
                            <div className="absolute -top-1.5 right-3 w-3 h-3 bg-gray-900/95 dark:bg-black/95 border-t border-l border-white/15 rotate-45"></div>
                        </div>
                    </div>

                    <button
                        title="Buscar"
                        onClick={() => soundManager.play('click')}
                        className="p-1.5 text-white/60 hover:text-white transition-colors cursor-pointer rounded-xl hover:bg-white/10"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                    <button
                        title="Configuración de Sistema"
                        onClick={() => { setIsSettingsOpen(true); soundManager.play('click'); }}
                        className={`p-1.5 transition-all cursor-pointer rounded-xl hover:bg-white/10 ${isSettingsOpen ? 'rotate-90 text-primary-400' : 'text-white/60 hover:text-white'}`}
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-white/10"></div>
                    <span className="text-xs md:text-sm font-bold text-white/90">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>

            <div className="relative w-full h-full flex flex-col items-center overflow-y-auto custom-scrollbar">
                <div className="flex flex-col items-center w-full max-w-5xl px-4 sm:px-6 pt-24 pb-16 md:pt-28 md:pb-20 my-auto min-h-min">

                    {/* Logo and Header */}
                    <div className="text-center mb-6 md:mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="relative inline-block mb-3 md:mb-5">
                            <div className={`absolute -inset-4 rounded-full blur-2xl opacity-30 animate-pulse ${
                                panelMode === 'basic' ? 'bg-gradient-to-tr from-blue-500 to-amber-500' : 'bg-gradient-to-tr from-blue-500 to-emerald-500'
                            }`}></div>
                            <img
                                src={`${(import.meta as any).env.BASE_URL}logo.png`}
                                alt="System Logo"
                                className="relative w-16 h-16 md:w-20 md:h-20 rounded-[28px] md:rounded-[32px] shadow-2xl border-2 border-white/20 object-cover"
                            />
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-2">
                            Panel de <span className={`text-transparent bg-clip-text ${
                                panelMode === 'basic' 
                                    ? 'bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-400'
                                    : 'bg-gradient-to-r from-blue-400 to-emerald-400'
                            }`}>Control</span>
                        </h1>
                        <p className="text-white/40 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">
                            {panelMode === 'basic' ? 'Vista Básica • Administración y Menú' : 'Vista Avanzada • Sistema Operativo "El Buen Servir"'}
                        </p>
                    </div>

                    {/* View Switcher Toggle & Modules Config */}
                    <div className="mb-8 md:mb-10 flex flex-wrap items-center justify-center gap-3 animate-in fade-in duration-500">
                        <div className="inline-flex p-1.5 bg-black/40 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl">
                            <button
                                type="button"
                                onClick={() => changePanelMode('basic')}
                                className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                                    panelMode === 'basic'
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Sparkles className="w-4 h-4 text-amber-200" />
                                <span>Vista Básica</span>
                                <span className="hidden sm:inline text-[9px] bg-black/25 px-2 py-0.5 rounded-md text-amber-200">Por Defecto</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => changePanelMode('advanced')}
                                className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                                    panelMode === 'advanced'
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <LayoutDashboard className="w-4 h-4 text-blue-200" />
                                <span>Vista Avanzada</span>
                                <span className="hidden sm:inline text-[9px] bg-black/25 px-2 py-0.5 rounded-md text-blue-200">
                                    {visibleAdvancedApps.length} Apps
                                </span>
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setSettingsTab('modules');
                                setIsSettingsOpen(true);
                                soundManager.play('click');
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2.5 sm:py-3 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/15 hover:border-primary-500/40 text-white text-xs font-black uppercase tracking-wider transition-all shadow-xl active:scale-95 cursor-pointer backdrop-blur-xl group"
                            title="Activar o desactivar módulos del sistema"
                        >
                            <Sliders className="w-4 h-4 text-primary-400 group-hover:rotate-45 transition-transform" />
                            <span>Módulos</span>
                            <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-lg bg-primary-500/20 text-primary-300 border border-primary-500/30">
                                {activeModulesCount}/5 Activos
                            </span>
                        </button>
                    </div>

                    {/* Basic View: Administración (Acceso Directo a Pedidos) + Editor de Menú */}
                    {panelMode === 'basic' ? (
                        <div className="flex flex-col items-center w-full max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 w-full">
                                {/* Módulo Administración: Acceso Directo a Pedidos Únicamente */}
                                <button
                                    onClick={() => handleAppClick('admin', 'orders')}
                                    title="Abrir Administración con Acceso Directo a Pedidos"
                                    className="group relative w-full flex flex-col sm:flex-row items-center gap-5 p-6 sm:p-7 rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/15 hover:border-blue-500/50 hover:bg-white/10 transition-all duration-300 shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1.5 text-left cursor-pointer"
                                >
                                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[26px] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-xl shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
                                        <ShoppingBasket className="w-10 h-10 sm:w-11 sm:h-11 text-white" />
                                        <div className="absolute -inset-1 bg-blue-400 rounded-[28px] blur opacity-30 group-hover:opacity-60 transition-opacity"></div>
                                    </div>
                                    
                                    <div className="flex-1 text-center sm:text-left min-w-0">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-black uppercase tracking-widest mb-1.5">
                                            <ShieldCheck className="w-3 h-3" />
                                            Acceso a Pedidos
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                                            Administración
                                        </h2>
                                        <p className="text-white/60 text-xs sm:text-sm font-medium mt-1 leading-relaxed">
                                            Acceso directo a la supervisión y gestión de pedidos, comandas en curso y entregas.
                                        </p>
                                        <div className="mt-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-400 group-hover:translate-x-1 transition-transform">
                                            <span>Ver Pedidos</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </button>

                                {/* Módulo Editor de Menú */}
                                <button
                                    onClick={() => handleAppClick('admin', 'menu')}
                                    title="Abrir Editor de Menú"
                                    className="group relative w-full flex flex-col sm:flex-row items-center gap-5 p-6 sm:p-7 rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/15 hover:border-amber-500/50 hover:bg-white/10 transition-all duration-300 shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-1.5 text-left cursor-pointer"
                                >
                                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[26px] bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shrink-0 shadow-xl shadow-amber-500/25 group-hover:scale-105 transition-transform duration-300">
                                        <UtensilsCrossed className="w-10 h-10 sm:w-11 sm:h-11 text-white" />
                                        <div className="absolute -inset-1 bg-amber-400 rounded-[28px] blur opacity-30 group-hover:opacity-60 transition-opacity"></div>
                                    </div>
                                    
                                    <div className="flex-1 text-center sm:text-left min-w-0">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-widest mb-1.5">
                                            <Sparkles className="w-3 h-3" />
                                            Catálogo & Precios
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight group-hover:text-amber-400 transition-colors">
                                            Editor de Menú
                                        </h2>
                                        <p className="text-white/60 text-xs sm:text-sm font-medium mt-1 leading-relaxed">
                                            Gestiona platillos, actualiza precios, organiza categorías y disponibilidad.
                                        </p>
                                        <div className="mt-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400 group-hover:translate-x-1 transition-transform">
                                            <span>Abrir Editor de Menú</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {/* Helpful Banner to Switch to Advanced View */}
                            <div className="mt-8 p-4 sm:p-5 w-full rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-center sm:text-left">
                                    <p className="text-xs font-bold text-white">¿Necesitas Punto de Venta, Cocina o Logística?</p>
                                    <p className="text-[11px] text-white/50">Cambia a la Vista Avanzada para acceder a todas las funciones del sistema.</p>
                                </div>
                                <button
                                    onClick={() => changePanelMode('advanced')}
                                    className="shrink-0 px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <LayoutDashboard className="w-3.5 h-3.5" />
                                    <span>Ir a Vista Avanzada</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Advanced View: Full System Apps Grid styled like Basic Panel */
                        <div className="flex flex-col items-center w-full animate-in fade-in zoom-in-95 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
                                {visibleAdvancedApps.map((app, index) => {
                                    const isLastOdd = index === visibleAdvancedApps.length - 1 && visibleAdvancedApps.length % 2 !== 0;
                                    return (
                                        <button
                                            key={app.id}
                                            title={`Abrir ${app.name}`}
                                            onClick={() => handleAppClick(app.view, app.section)}
                                            className={`group relative w-full flex flex-col sm:flex-row items-center sm:items-center gap-5 p-5 sm:p-6 rounded-[30px] sm:rounded-[36px] bg-white/5 backdrop-blur-xl border border-white/15 ${app.borderHover} hover:bg-white/10 transition-all duration-300 shadow-xl ${app.shadowHover} hover:-translate-y-1.5 text-left cursor-pointer ${
                                                isLastOdd ? 'md:col-span-2 md:max-w-2xl md:mx-auto' : ''
                                            }`}
                                        >
                                            <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-[24px] sm:rounded-[28px] bg-gradient-to-tr ${app.gradient} flex items-center justify-center shrink-0 shadow-xl ${app.shadowColor} group-hover:scale-105 transition-transform duration-300`}>
                                                <app.icon className="w-10 h-10 sm:w-11 sm:h-11 text-white" />
                                                <div className={`absolute -inset-1 ${app.glowColor} rounded-[26px] sm:rounded-[30px] blur opacity-30 group-hover:opacity-60 transition-opacity`}></div>
                                            </div>
                                            
                                            <div className="flex-1 text-center sm:text-left min-w-0">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${app.badgeStyle} text-[10px] font-black uppercase tracking-widest mb-1.5`}>
                                                    <app.badgeIcon className="w-3 h-3" />
                                                    {app.badge}
                                                </div>
                                                <h3 className={`text-xl sm:text-2xl font-black text-white uppercase tracking-tight ${app.titleHover} transition-colors truncate`}>
                                                    {app.name}
                                                </h3>
                                                <p className="text-white/60 text-xs sm:text-sm font-medium mt-1 leading-relaxed">
                                                    {app.description}
                                                </p>
                                                <div className={`mt-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider ${app.actionColor} group-hover:translate-x-1 transition-transform`}>
                                                    <span>{app.actionText}</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Return to Basic View button */}
                            <div className="mt-8 sm:mt-10">
                                <button
                                    onClick={() => changePanelMode('basic')}
                                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:border-amber-500/30 active:scale-95"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Regresar a Vista Básica</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Bottom Exit Button */}
                    <div className="mt-10 md:mt-12 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                        <button
                            onClick={onExit}
                            title="Cerrar Sesión y Volver al Sitio Público"
                            className="group flex flex-col items-center gap-2 cursor-pointer"
                        >
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-md flex items-center justify-center group-hover:bg-red-500 group-hover:border-red-500 transition-all duration-300 shadow-lg shadow-red-500/0 group-hover:shadow-red-500/20">
                                <Power className="w-5 h-5 text-red-500 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.3em] group-hover:text-red-400 transition-colors">Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </div>

            {isSettingsOpen && renderSettingsModal()}

            <InstallPwaModal
                isOpen={showInstructions}
                onClose={() => setShowInstructions(false)}
                isIos={isIos}
            />
        </div>
    );
}
