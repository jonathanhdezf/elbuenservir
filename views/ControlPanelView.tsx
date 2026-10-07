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
    ShieldCheck
} from 'lucide-react';
import { soundManager } from '../utils/soundManager';
import { useMobileBack } from '../hooks/useMobileBack';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { InstallPwaModal } from '../components/InstallPwaModal';
import { AdminSection } from '../types';

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
    setPanelMode: propSetPanelMode
}: ControlPanelViewProps) {
    const [localPanelMode, setLocalPanelMode] = useState<'basic' | 'advanced'>('basic');
    const panelMode = propPanelMode ?? localPanelMode;

    const { isInstalled, isIos, showInstructions, setShowInstructions, installApp } = usePwaInstall();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);

    const changePanelMode = (mode: 'basic' | 'advanced') => {
        soundManager.play('click');
        if (propSetPanelMode) {
            propSetPanelMode(mode);
        } else {
            setLocalPanelMode(mode);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowWelcome(true);
            soundManager.play('alert');
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (showWelcome) {
            const hideTimer = setTimeout(() => {
                setShowWelcome(false);
            }, 5000);
            return () => clearTimeout(hideTimer);
        }
    }, [showWelcome]);

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

    const renderSettingsModal = () => (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsSettingsOpen(false)}></div>
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Personalización</h3>
                    <button 
                        onClick={() => setIsSettingsOpen(false)} 
                        title="Cerrar personalización"
                        className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
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

                <div className="flex items-center gap-3 sm:gap-6">
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
                    <div className="relative">
                        <button
                            title="Notificaciones"
                            onClick={() => {
                                setShowWelcome(!showWelcome);
                                soundManager.play('click');
                            }}
                            className={`p-1 transition-colors cursor-pointer ${showWelcome ? 'text-primary-400' : 'text-white/50 hover:text-white'}`}
                        >
                            <Bell className={`w-4 h-4 ${showWelcome ? 'animate-bounce' : ''}`} />
                            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-gray-900"></div>
                        </button>

                        {showWelcome && (
                            <div className="absolute right-0 mt-4 w-72 sm:w-80 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-5 animate-in slide-in-from-top-2 fade-in duration-300 z-[210]">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-primary-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/20 shrink-0">
                                        <Bell className="w-5 h-5 animate-swing" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest">
                                                {panelMode === 'basic' ? 'Vista Básica Activa' : 'Sistemas Listos'}
                                            </p>
                                            <button title="Cerrar notificación" aria-label="Cerrar notificación" onClick={() => setShowWelcome(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight">
                                            {panelMode === 'basic'
                                                ? 'Estás en la vista básica con acceso al Editor de Menú. Puedes cambiar a la vista avanzada para ver todos los sistemas.'
                                                : 'Bienvenido Miguel 👋 los sistemas están listos, es un gusto trabajar contigo. :)'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute -top-2 right-4 w-4 h-4 bg-white dark:bg-gray-900 border-t border-l border-gray-100 dark:border-gray-800 rotate-45"></div>
                            </div>
                        )}
                    </div>
                    <button
                        title="Buscar"
                        onClick={() => soundManager.play('click')}
                        className="p-1 text-white/50 hover:text-white transition-colors cursor-pointer"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                    <button
                        title="Configuración de Sistema"
                        onClick={() => { setIsSettingsOpen(true); soundManager.play('click'); }}
                        className={`p-1 transition-all cursor-pointer ${isSettingsOpen ? 'rotate-90 text-primary-400' : 'text-white/50 hover:text-white'}`}
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-white/10"></div>
                    <span className="text-xs md:text-sm font-bold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>

            <div className="relative w-full h-full flex flex-col items-center overflow-y-auto custom-scrollbar">
                <div className="flex flex-col items-center w-full max-w-5xl px-4 sm:px-6 pt-24 pb-16 md:pt-28 md:pb-20 my-auto min-h-min">

                    {/* Logo and Header */}
                    <div className="text-center mb-6 md:mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="relative inline-block mb-3 md:mb-5">
                            <div className={`absolute -inset-4 rounded-full blur-2xl opacity-30 animate-pulse ${
                                panelMode === 'basic' ? 'bg-gradient-to-tr from-amber-500 to-orange-500' : 'bg-gradient-to-tr from-blue-500 to-emerald-500'
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
                                    ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                                    : 'bg-gradient-to-r from-blue-400 to-emerald-400'
                            }`}>Control</span>
                        </h1>
                        <p className="text-white/40 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">
                            {panelMode === 'basic' ? 'Vista Básica • Editor de Menú' : 'Vista Avanzada • Sistema Operativo "El Buen Servir"'}
                        </p>
                    </div>

                    {/* View Switcher Toggle (Vista Básica vs Vista Avanzada) */}
                    <div className="mb-8 md:mb-10 inline-flex p-1.5 bg-black/40 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl animate-in fade-in duration-500">
                        <button
                            type="button"
                            onClick={() => changePanelMode('basic')}
                            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                                panelMode === 'basic'
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 scale-[1.02]'
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
                            <span className="hidden sm:inline text-[9px] bg-black/25 px-2 py-0.5 rounded-md text-blue-200">Completa</span>
                        </button>
                    </div>

                    {/* Basic View: Only Menu Editor Option */}
                    {panelMode === 'basic' ? (
                        <div className="flex flex-col items-center w-full max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-500">
                            <button
                                onClick={() => handleAppClick('admin', 'menu')}
                                title="Abrir Editor de Menú"
                                className="group relative w-full flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8 rounded-[36px] bg-white/5 backdrop-blur-xl border border-white/15 hover:border-amber-500/50 hover:bg-white/10 transition-all duration-300 shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-1.5 text-left cursor-pointer"
                            >
                                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shrink-0 shadow-xl shadow-amber-500/25 group-hover:scale-105 transition-transform duration-300">
                                    <UtensilsCrossed className="w-12 h-12 text-white" />
                                    <div className="absolute -inset-1 bg-amber-400 rounded-[30px] blur opacity-30 group-hover:opacity-60 transition-opacity"></div>
                                </div>
                                
                                <div className="flex-1 text-center sm:text-left">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-widest mb-2">
                                        <Sparkles className="w-3 h-3" />
                                        Módulo Principal
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight group-hover:text-amber-400 transition-colors">
                                        Editor de Menú
                                    </h2>
                                    <p className="text-white/60 text-xs sm:text-sm font-medium mt-1 leading-relaxed">
                                        Gestiona platillos, actualiza precios, organiza categorías y controla la disponibilidad en el restaurante.
                                    </p>
                                    <div className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400 group-hover:translate-x-1 transition-transform">
                                        <span>Abrir Editor de Menú</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </button>

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
                                {advancedApps.map((app, index) => {
                                    const isLastOdd = index === advancedApps.length - 1 && advancedApps.length % 2 !== 0;
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
