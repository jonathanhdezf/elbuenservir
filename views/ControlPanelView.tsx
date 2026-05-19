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
    Check
} from 'lucide-react';
import { soundManager } from '../utils/soundManager';
import { useMobileBack } from '../hooks/useMobileBack';

interface ControlPanelViewProps {
    onNavigate: (view: 'admin' | 'public' | 'kitchen' | 'logistics' | 'tpv' | 'local_dispatch' | 'driver_portal') => void;
    onExit: () => void;
    isDarkMode: boolean;
    systemBgColor: string;
    setSystemBgColor: (color: string) => void;
    systemBgEffect: 'none' | 'gradient' | 'animated-blobs' | 'stars';
    setSystemBgEffect: (effect: 'none' | 'gradient' | 'animated-blobs' | 'stars') => void;
}

export default function ControlPanelView({
    onNavigate,
    onExit,
    isDarkMode,
    systemBgColor,
    setSystemBgColor,
    systemBgEffect,
    setSystemBgEffect
}: ControlPanelViewProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);

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

    const apps = [
        {
            id: 'admin',
            name: 'Administración',
            icon: Lock,
            color: 'bg-blue-500',
            description: 'Gestión total del sistema',
            view: 'admin' as const
        },
        {
            id: 'tpv',
            name: 'Punto de Venta',
            icon: Monitor,
            color: 'bg-emerald-500',
            description: 'Toma de pedidos y cobros',
            view: 'tpv' as const
        },
        {
            id: 'kitchen',
            name: 'Monitor KDS',
            icon: ChefHat,
            color: 'bg-amber-500',
            description: 'Control de cocina en tiempo real',
            view: 'kitchen' as const
        },
        {
            id: 'local_dispatch',
            name: 'Despacho Local',
            icon: Utensils,
            color: 'bg-rose-500',
            description: 'Gestión de mesas y barra',
            view: 'local_dispatch' as const
        },
        {
            id: 'logistics',
            name: 'Logística',
            icon: Truck,
            color: 'bg-indigo-500',
            description: 'Repartos y última milla',
            view: 'logistics' as const
        },
        {
            id: 'driver_portal',
            name: 'Portal Repartidor',
            icon: Bike,
            color: 'bg-teal-500',
            description: 'Turno y entregas personales',
            view: 'driver_portal' as const
        }
    ];

    const handleAppClick = (view: any) => {
        soundManager.play('navigation');
        onNavigate(view);
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
                        className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
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
                                    className={`w-full aspect-square rounded-2xl border-4 transition-all ${systemBgColor === color ? 'border-primary-500 scale-110 shadow-lg shadow-primary-500/20' : 'border-transparent hover:scale-105'}`}
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
                                    className={`p-4 rounded-2xl border-2 font-bold text-[10px] uppercase tracking-widest transition-all ${systemBgEffect === effect.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-200'}`}
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
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-ping"></div>
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-emerald-400">Sistema Activo</span>
                    </div>
                    <span className="hidden md:inline text-[10px] font-bold uppercase tracking-[0.3em]">v2.4.0 Premium</span>
                </div>
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="relative">
                        <button
                            title="Notificaciones"
                            onClick={() => {
                                setShowWelcome(!showWelcome);
                                soundManager.play('click');
                            }}
                            className={`p-1 transition-colors ${showWelcome ? 'text-primary-400' : 'text-white/50 hover:text-white'}`}
                        >
                            <Bell className={`w-4 h-4 ${showWelcome ? 'animate-bounce' : ''}`} />
                            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-gray-900"></div>
                        </button>

                        {showWelcome && (
                            <div className="absolute right-0 mt-4 w-72 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-5 animate-in slide-in-from-top-2 fade-in duration-300 z-[210]">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-primary-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/20 shrink-0">
                                        <Bell className="w-5 h-5 animate-swing" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Sistemas Listos</p>
                                            <button title="Cerrar notificación" aria-label="Cerrar notificación" onClick={() => setShowWelcome(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight">
                                            Bienvenido Miguel 👋 los sistemas estan listos, es un gusto trabajar contigo. :)
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
                        className="p-1 text-white/50 hover:text-white transition-colors"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                    <button
                        title="Configuración de Sistema"
                        onClick={() => { setIsSettingsOpen(true); soundManager.play('click'); }}
                        className={`p-1 transition-all ${isSettingsOpen ? 'rotate-90 text-primary-400' : 'text-white/50 hover:text-white'}`}
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-white/10"></div>
                    <span className="text-xs md:text-sm font-bold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>

            <div className="relative w-full h-full flex flex-col items-center justify-center overflow-y-auto custom-scrollbar">
                <div className="flex flex-col items-center justify-center w-full max-w-6xl p-6 py-32 md:py-32 min-h-min">

                    {/* Logo and Header */}
                    <div className="text-center mb-8 md:mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="relative inline-block mb-3 md:mb-6">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                            <img
                                src={`${(import.meta as any).env.BASE_URL}logo.png`}
                                alt="System Logo"
                                className="relative w-16 h-16 md:w-24 md:h-24 rounded-[28px] md:rounded-[32px] shadow-2xl border-2 border-white/20 object-cover"
                            />
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter uppercase mb-2">
                            Panel de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Control</span>
                        </h1>
                        <p className="text-white/40 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">Sistema Operativo "El Buen Servir"</p>
                    </div>

                    {/* App Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-8 w-full animate-in fade-in zoom-in-95 duration-700 delay-200">
                        {apps.map((app, index) => (
                            <button
                                key={app.id}
                                title={`Abrir ${app.name}`}
                                onClick={() => handleAppClick(app.view)}
                                className="group relative flex flex-col items-center gap-3 md:gap-4 transition-all duration-300 hover:-translate-y-1 md:hover:-translate-y-2 tap-highlight-transparent"
                            >
                                <div className={`
                    relative w-20 h-20 md:w-32 md:h-32 rounded-[32px] md:rounded-[40px] flex items-center justify-center
                    bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl
                    group-hover:bg-white/10 group-hover:border-white/20 group-hover:shadow-${app.color.split('-')[1]}-500/20
                    transition-all duration-500
                  `}>
                                    <div className={`absolute inset-0 rounded-[32px] md:rounded-[40px] ${app.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                                    <app.icon className={`w-8 h-8 md:w-14 md:h-14 text-white group-hover:scale-110 transition-transform duration-500`} />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] md:text-sm font-black text-white uppercase tracking-widest group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/50">{app.name}</p>
                                    <p className="hidden md:block text-[9px] text-white/30 font-bold uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">{app.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Bottom Dock Control */}
                    <div className="mt-8 md:mt-12 flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                        <button
                            onClick={onExit}
                            title="Cerrar Sesión"
                            className="group flex flex-col items-center gap-3"
                        >
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-md flex items-center justify-center group-hover:bg-red-500 group-hover:border-red-500 transition-all duration-300 shadow-lg shadow-red-500/0 group-hover:shadow-red-500/20">
                                <Power className="w-5 h-5 md:w-6 md:h-6 text-red-500 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.3em] group-hover:text-red-400 transition-colors">Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </div>

            {isSettingsOpen && renderSettingsModal()}
        </div>
    );
}
