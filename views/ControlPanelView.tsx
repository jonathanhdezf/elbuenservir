import React from 'react';
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
    Power
} from 'lucide-react';
import { soundManager } from '../utils/soundManager';

interface ControlPanelViewProps {
    onNavigate: (view: 'admin' | 'public' | 'kitchen' | 'logistics' | 'tpv' | 'local_dispatch') => void;
    onExit: () => void;
    isDarkMode: boolean;
}

export default function ControlPanelView({ onNavigate, onExit, isDarkMode }: ControlPanelViewProps) {
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
        }
    ];

    const handleAppClick = (view: any) => {
        soundManager.play('navigation');
        onNavigate(view);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center font-sans bg-gray-900">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
            </div>

            {/* Top Bar (OS Style) */}
            <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-center text-white/50 z-20 pointer-events-none">
                <div className="flex items-center gap-4 pointer-events-auto">
                    <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-ping"></div>
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-emerald-400">Sistema Activo</span>
                    </div>
                    <span className="hidden md:inline text-[10px] font-bold uppercase tracking-[0.3em]">v2.4.0 Premium</span>
                </div>
                <div className="flex items-center gap-4 md:gap-6 pointer-events-auto">
                    <Bell className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
                    <Search className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
                    <Settings className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8 w-full animate-in fade-in zoom-in-95 duration-700 delay-200">
                        {apps.map((app, index) => (
                            <button
                                key={app.id}
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
        </div>
    );
}
