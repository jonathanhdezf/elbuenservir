
import React, { useState, useEffect } from 'react';
import {
    Monitor, Bell, Sun, Moon, Clock, CheckCircle,
    ChefHat, Lock, ShieldCheck, ArrowRight, X, AlertCircle
} from 'lucide-react';
import { Order, OrderItem, OrderStatus } from '../types';
import { soundManager } from '../utils/soundManager';

interface MonitorCocinaProps {
    orders: Order[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    isDarkMode: boolean;
    setIsDarkMode: (val: boolean) => void;
    onExit: () => void;
}

export default function MonitorCocina({
    orders,
    setOrders,
    isDarkMode,
    setIsDarkMode,
    onExit
}: MonitorCocinaProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Password for the Chef
    const CHEF_PASSWORD = 'chef123';

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 10000);
        return () => clearInterval(timer);
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === CHEF_PASSWORD) {
            setIsAuthenticated(true);
            soundManager.play('confirm', 'kds');
        } else {
            setError(true);
            soundManager.play('error');
            setTimeout(() => setError(false), 2000);
        }
    };

    const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    };

    const activeOrders = orders.filter(o => o.status === 'kitchen');

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-6 transition-colors duration-500">
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/20 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
                </div>

                <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[48px] shadow-2xl overflow-hidden relative z-10 border border-gray-100 dark:border-gray-800 p-12 text-center animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-primary-50 dark:bg-primary-950/30 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary-500/10">
                        <ChefHat className="w-12 h-12 text-primary-500" />
                    </div>

                    <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-2">Acceso Chef</h2>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-10">Monitor de Cocina Autorizado</p>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="relative">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                placeholder="Contraseña del Chef"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full pl-16 pr-6 py-6 bg-gray-50 dark:bg-gray-800/50 border-2 rounded-[24px] outline-none transition-all font-black text-lg tracking-widest text-center ${error ? 'border-red-500 animate-shake' : 'border-transparent focus:border-primary-500 dark:text-white'
                                    }`}
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-6 bg-gray-900 dark:bg-primary-500 text-white rounded-[24px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <span>Entrar al Monitor</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>

                    <button
                        onClick={onExit}
                        className="mt-8 text-gray-400 font-bold uppercase tracking-widest text-[10px] hover:text-gray-600 dark:hover:text-white transition-colors"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 p-4 md:p-8 transition-colors duration-500 flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 md:w-20 md:h-20 bg-primary-500 rounded-2xl md:rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-primary-500/20">
                        <Monitor className="w-7 h-7 md:w-10 md:h-10" />
                    </div>
                    <div>
                        <h1 className="text-[clamp(1.5rem,5vw,2.5rem)] font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Monitor KDS</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-emerald-500 flex items-center gap-1 font-black text-[9px] md:text-[10px] uppercase tracking-widest">
                                <ShieldCheck className="w-3 h-3" /> Tiempo Real
                            </span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Cocina</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-4 md:px-6 py-2 md:py-4 rounded-2xl md:rounded-3xl shadow-sm flex items-center gap-3 shrink-0">
                        <Bell className="w-4 h-4 md:w-5 md:h-5 text-amber-500 animate-swing" />
                        <span className="font-black text-gray-900 dark:text-white uppercase text-[10px] md:text-xs">{activeOrders.length} Pendientes</span>
                    </div>

                    <button
                        onClick={() => { setIsDarkMode(!isDarkMode); soundManager.play('click'); }}
                        className="p-3 md:p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl md:rounded-3xl shadow-sm hover:scale-105 active:scale-95 transition-all"
                    >
                        {isDarkMode ? <Sun className="w-5 h-5 md:w-6 md:h-6" /> : <Moon className="w-5 h-5 md:w-6 md:h-6" />}
                    </button>

                    <button
                        onClick={onExit}
                        className="p-3 md:p-5 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-2xl md:rounded-3xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-all font-black uppercase text-[10px] md:text-xs tracking-widest flex items-center gap-2"
                    >
                        <X className="w-4 h-4 md:w-5 md:h-5" /> Salir
                    </button>
                </div>
            </div>

            {/* Grid of Orders */}
            <div className="flex-1 min-h-0">
                {activeOrders.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 h-full content-start overflow-y-auto pr-2 pb-12 custom-scrollbar">
                        {activeOrders.map(order => {
                            const waitTime = Math.floor((currentTime.getTime() - new Date(order.createdAt).getTime()) / 60000);
                            const isUrgent = waitTime > 12;

                            return (
                                <div
                                    key={order.id}
                                    className={`bg-white dark:bg-gray-900 rounded-[32px] md:rounded-[48px] shadow-xl overflow-hidden flex flex-col border-2 transition-all duration-300 animate-in fade-in zoom-in-95 ${isUrgent ? 'border-amber-400 shadow-amber-400/10' : 'border-gray-100 dark:border-gray-800 shadow-black/5'
                                        }`}
                                >
                                    {/* Order Header */}
                                    <div className={`p-5 md:p-6 ${isUrgent ? 'bg-amber-400 text-gray-900' : 'bg-gray-900 text-white'} flex flex-col items-start gap-4`}>
                                        <div className="w-full flex justify-between items-start">
                                            <div className="flex-1 min-w-0 pr-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest opacity-60 block leading-none">{order.id}</span>
                                                <h4 className="text-xl md:text-2xl font-black tracking-tight mt-1 uppercase leading-none truncate w-full">
                                                    {order.customerName}
                                                </h4>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isUrgent ? 'bg-white/30' : 'bg-primary-500/20 text-primary-400'}`}>
                                                        {order.source === 'tpv' ? 'Local' : 'Online'}
                                                    </span>
                                                    {order.paymentStatus === 'paid' && (
                                                        <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-100/20 text-emerald-400 px-2 py-0.5 rounded-full">
                                                            OK
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="shrink-0 bg-black/10 rounded-2xl p-2 md:p-3 flex items-center gap-2 font-black text-lg md:text-xl">
                                                <Clock className={`w-4 h-4 md:w-5 md:h-5 ${isUrgent ? 'animate-pulse text-red-600' : ''}`} />
                                                <span>{waitTime}m</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="p-5 md:p-6 flex-1 space-y-4 overflow-y-auto max-h-[300px] md:max-h-[400px] custom-scrollbar">
                                        {order.items.map((it, i) => (
                                            <div key={i} className={`flex justify-between items-start gap-3 ${it.isOld ? 'opacity-30' : ''}`}>
                                                <div className="flex-1 min-w-0">
                                                    <h5 className={`text-sm md:text-base font-black leading-tight uppercase truncate ${it.isOld ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                                        {it.name}
                                                    </h5>
                                                    <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 truncate ${it.isOld ? 'text-gray-300' : 'text-gray-400'}`}>
                                                        {it.variationLabel}
                                                    </p>
                                                </div>
                                                <div className={`w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-xl font-black ${it.isOld ? 'bg-gray-100 text-gray-300' : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700'
                                                    }`}>
                                                    {it.quantity}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action Footer */}
                                    <div className="p-5 md:p-6 pt-0">
                                        <button
                                            onClick={() => { updateOrderStatus(order.id, 'ready'); soundManager.play('confirm', 'kds'); }}
                                            className="w-full py-4 md:py-6 rounded-2xl md:rounded-[32px] font-black text-sm md:text-xl uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 bg-emerald-500 text-white shadow-emerald-500/30 hover:bg-emerald-600"
                                        >
                                            <CheckCircle className="w-5 h-5 md:w-8 md:h-8" />
                                            <span>Listo</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-20 dark:text-white h-full">
                        <ChefHat className="w-20 h-20 md:w-40 md:h-40 mb-4 md:mb-8" />
                        <h3 className="text-xl md:text-4xl font-black uppercase tracking-[0.3em] text-center">Sin pendiente</h3>
                    </div>
                )}
            </div>

            {/* CSS for custom scrollbar and animations */}
            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out infinite; }
      `}</style>
        </div>
    );
}
