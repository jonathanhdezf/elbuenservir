
import React, { useState, useEffect } from 'react';
import {
    Truck, Bike, Clock, CheckCircle, ShieldCheck,
    ArrowRight, X, AlertCircle, Package, Timer,
    User, UserPlus, Send, Search, Bell, Sun, Moon,
    Shield, MapPin
} from 'lucide-react';
import { Order, OrderStatus, DeliveryDriver } from '../types';
import { soundManager } from '../utils/soundManager';

interface LogisticaDespachosProps {
    orders: Order[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    drivers: DeliveryDriver[];
    setDrivers: React.Dispatch<React.SetStateAction<DeliveryDriver[]>>;
    isDarkMode: boolean;
    setIsDarkMode: (val: boolean) => void;
    onExit: () => void;
}

export default function LogisticaDespachos({
    orders,
    setOrders,
    drivers,
    setDrivers,
    isDarkMode,
    setIsDarkMode,
    onExit
}: LogisticaDespachosProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [activeTab, setActiveTab] = useState<'dds' | 'drivers'>('dds');
    const [currentTime, setCurrentTime] = useState(new Date());

    // DDS states for verification
    const [verifyingDispatchOrderId, setVerifyingDispatchOrderId] = useState<string | null>(null);
    const [dispatchTicketInput, setDispatchTicketInput] = useState('');
    const [dispatchError, setDispatchError] = useState<string | null>(null);

    const LOGISTICS_PASSWORD = 'logistica123';

    // Clock and Auto-slide management
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        const slideTimer = setInterval(() => {
            if (!verifyingDispatchOrderId) { // Don't slide if user is verifying an order
                setActiveTab(prev => prev === 'dds' ? 'drivers' : 'dds');
            }
        }, 30000); // 30 seconds as requested

        return () => {
            clearInterval(timer);
            clearInterval(slideTimer);
        };
    }, [verifyingDispatchOrderId]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === LOGISTICS_PASSWORD) {
            setIsAuthenticated(true);
            soundManager.play('confirm', 'dds');
        } else {
            setError(true);
            soundManager.play('error');
            setTimeout(() => setError(false), 2000);
        }
    };

    const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, dispatchedAt: new Date().toISOString() } : o));
    };

    const handleDispatchVerify = (orderId: string) => {
        if (dispatchTicketInput.trim().toUpperCase() === orderId.toUpperCase()) {
            updateOrderStatus(orderId, 'delivery');
            setVerifyingDispatchOrderId(null);
            setDispatchTicketInput('');
            setDispatchError(null);
            soundManager.play('confirm', 'dds');
        } else {
            setDispatchError('Número de orden incorrecto');
            soundManager.play('error');
        }
    };

    const readyOrders = orders.filter(o =>
        o.status === 'ready' &&
        !o.address.toLowerCase().includes('mesa') &&
        !o.address.toLowerCase().includes('mostrador')
    );

    const activeDrivers = drivers.filter(d => d.status !== 'offline');

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-6 transition-colors duration-500">
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[120px]"></div>
                </div>

                <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[48px] shadow-2xl overflow-hidden relative z-10 border border-gray-100 dark:border-gray-800 p-12 text-center animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-blue-50 dark:bg-blue-950/30 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-500/10">
                        <Truck className="w-12 h-12 text-blue-500" />
                    </div>

                    <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-2">Logística</h2>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-10">Control de Despachos y Reparto</p>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="relative">
                            <Shield className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                placeholder="Contraseña Logística"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full pl-16 pr-6 py-6 bg-gray-50 dark:bg-gray-800/50 border-2 rounded-[24px] outline-none transition-all font-black text-lg tracking-widest text-center ${error ? 'border-red-500 animate-shake' : 'border-transparent focus:border-blue-500 dark:text-white'
                                    }`}
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-6 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <span>Acceder al Panel</span>
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 md:w-20 md:h-20 bg-blue-500 rounded-2xl md:rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
                        <Package className="w-7 h-7 md:w-10 md:h-10" />
                    </div>
                    <div>
                        <h1 className="text-[clamp(1.5rem,5vw,3rem)] font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">
                            {activeTab === 'dds' ? 'Despachos' : 'Logística'}
                        </h1>
                        <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-blue-500 font-black text-[8px] md:text-[10px] uppercase tracking-widest">Auto-Slide</span>
                            </div>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[8px] md:text-[10px]">
                                {currentTime.toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-4 md:px-6 py-2 md:py-4 rounded-2xl md:rounded-3xl shadow-sm flex items-center gap-4 md:gap-6 shrink-0">
                        <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                            <span className="font-black text-gray-900 dark:text-white uppercase text-[10px] md:text-xs">{readyOrders.length} Listos</span>
                        </div>
                        <div className="w-px h-4 md:h-6 bg-gray-100 dark:bg-gray-800"></div>
                        <div className="flex items-center gap-2">
                            <Bike className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                            <span className="font-black text-gray-900 dark:text-white uppercase text-[10px] md:text-xs">{activeDrivers.length} Repartidores</span>
                        </div>
                    </div>

                    <button
                        onClick={() => { setIsDarkMode(!isDarkMode); soundManager.play('click'); }}
                        className="p-3 md:p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl md:rounded-3xl shadow-sm hover:scale-105 active:scale-95 transition-all"
                    >
                        {isDarkMode ? <Sun className="w-5 h-5 md:w-6 md:h-6" /> : <Moon className="w-5 h-5 md:w-6 md:h-6" />}
                    </button>

                    <button
                        onClick={onExit}
                        className="p-3 md:p-5 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-2xl md:rounded-3xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-all font-black uppercase text-[10px] md:text-xs tracking-widest flex items-center gap-2 shrink-0"
                    >
                        <X className="w-4 h-4 md:w-5 md:h-5" /> Salir
                    </button>
                </div>
            </div>

            {/* Tabs / Content */}
            <div className="flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'dds' ? (
                    /* DDS Section (Despachos) */
                    <div className="h-full flex flex-col">
                        {readyOrders.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 overflow-y-auto pr-2 pb-12 custom-scrollbar">
                                {readyOrders.map(order => {
                                    const driver = drivers.find(d => d.id === order.assignedDriverId);
                                    const waitTime = Math.floor((currentTime.getTime() - new Date(order.createdAt).getTime()) / 60000);

                                    return (
                                        <div key={order.id} className="bg-white dark:bg-gray-900 rounded-[24px] md:rounded-[32px] shadow-xl overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800 relative transition-transform hover:scale-[1.01]">
                                            {verifyingDispatchOrderId === order.id && (
                                                <div className="absolute inset-0 bg-white/95 dark:bg-gray-950/95 z-20 flex flex-col items-center justify-center p-6 md:p-8 animate-in fade-in duration-300">
                                                    <button title="Cerrar verificación" onClick={() => { setVerifyingDispatchOrderId(null); setDispatchError(null); setDispatchTicketInput(''); }} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-gray-400 hover:text-gray-600"><X className="w-6 h-6 md:w-8 md:h-8" /></button>
                                                    <ShieldCheck className="w-14 h-14 md:w-20 md:h-20 text-blue-500 mb-4 md:mb-6" />
                                                    <h4 className="text-xl md:text-3xl font-black uppercase text-gray-900 dark:text-white mb-1 md:mb-2">Verificar</h4>
                                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] md:text-xs mb-6 md:mb-8">No. de Orden</p>

                                                    <input
                                                        type="text"
                                                        value={dispatchTicketInput}
                                                        onChange={(e) => { setDispatchTicketInput(e.target.value); setDispatchError(null); }}
                                                        placeholder={`No. ${order.id}`}
                                                        className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-2xl md:rounded-[24px] px-4 md:px-6 py-4 md:py-6 font-black text-center text-xl md:text-2xl uppercase mb-4 focus:border-blue-500 outline-none tracking-widest dark:text-white"
                                                        autoFocus
                                                    />

                                                    {dispatchError && <p className="text-[10px] font-black text-red-500 mb-4 md:mb-6 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {dispatchError}</p>}

                                                    <button
                                                        onClick={() => handleDispatchVerify(order.id)}
                                                        className="w-full py-4 md:py-6 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl md:rounded-[24px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/30 active:scale-95 text-sm md:text-base"
                                                    >
                                                        Autorizar Salida
                                                    </button>
                                                </div>
                                            )}

                                            <div className="p-5 md:p-6 bg-blue-600 text-white flex justify-between items-center">
                                                <div className="min-w-0 pr-2">
                                                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60 leading-none">ID: {order.id}</span>
                                                    <h4 className="text-lg md:text-2xl font-black tracking-tight mt-1 uppercase truncate w-full">{order.customerName}</h4>
                                                </div>
                                                <div className="shrink-0 bg-black/10 rounded-2xl p-3 md:p-4 flex items-center gap-2 border border-white/10 text-base md:text-xl">
                                                    <Timer className="w-4 h-4 md:w-6 md:h-6" />
                                                    <span className="font-black">{waitTime}m</span>
                                                </div>
                                            </div>

                                            <div className="p-5 md:p-6 flex-1 space-y-4 md:space-y-6">
                                                <div className="flex items-start gap-3 md:gap-4">
                                                    <div className="p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-xl md:rounded-[24px] text-gray-400"><MapPin className="w-5 h-5 md:w-6 md:h-6" /></div>
                                                    <div className="min-w-0">
                                                        <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Destino</p>
                                                        <p className="font-bold text-sm md:text-base text-gray-800 dark:text-gray-200 leading-tight truncate">{order.address}</p>
                                                    </div>
                                                </div>

                                                <div className="p-4 md:p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl md:rounded-[32px] border-2 border-dashed border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                                        <div className={`w-10 h-10 md:w-14 md:h-14 shrink-0 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg ${driver ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-900 text-gray-300'}`}>
                                                            <Bike className="w-5 h-5 md:w-7 md:h-7" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Repartidor</p>
                                                            <p className="font-black text-xs md:text-sm text-gray-900 dark:text-white uppercase truncate">{driver?.name || '---'}</p>
                                                        </div>
                                                    </div>
                                                    {!driver && (
                                                        <button title="Asignar Repartidor" className="p-2 md:p-3 bg-primary-500 text-white rounded-lg md:rounded-xl shadow-lg animate-bounce shrink-0"><UserPlus className="w-4 h-4" /></button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-5 md:p-6 pt-0">
                                                <button
                                                    onClick={() => { if (driver) setVerifyingDispatchOrderId(order.id); }}
                                                    disabled={!driver}
                                                    className={`w-full py-4 md:py-6 rounded-2xl md:rounded-[32px] font-black text-sm md:text-lg uppercase tracking-wider shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${driver ? 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                >
                                                    <Send className="w-5 h-5 md:w-6 md:h-6" />
                                                    <span>Despachar</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-20 dark:text-white h-full">
                                <Truck className="w-20 h-20 md:w-40 md:h-40 mb-4 md:mb-8" />
                                <h3 className="text-xl md:text-3xl font-black uppercase tracking-[0.3em] text-center">Sin despachos</h3>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Drivers List (Logística) */
                    <div className="h-full flex flex-col">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 overflow-y-auto pr-2 pt-8 pb-12 custom-scrollbar">
                            {activeDrivers.map(driver => {
                                const currentOrder = orders.find(o => o.assignedDriverId === driver.id && o.status === 'delivery');
                                let routeTime = 0;
                                if (currentOrder && currentOrder.dispatchedAt) {
                                    routeTime = Math.floor((currentTime.getTime() - new Date(currentOrder.dispatchedAt).getTime()) / 60000);
                                }

                                return (
                                    <div
                                        key={driver.id}
                                        className={`bg-white dark:bg-gray-900 p-5 md:p-8 rounded-[32px] md:rounded-[48px] shadow-xl border-2 transition-all shrink-0 ${driver.status === 'busy' ? 'border-amber-400 scale-[1.01]' : 'border-gray-100 dark:border-gray-800'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-4 md:mb-6">
                                            <div className="w-14 h-14 md:w-20 md:h-20 bg-gray-50 dark:bg-gray-800 rounded-2xl md:rounded-[28px] flex items-center justify-center text-gray-400 shadow-inner shrink-0">
                                                <User className="w-7 h-7 md:w-10 md:h-10" />
                                            </div>
                                            <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl font-black text-[8px] md:text-[10px] uppercase tracking-widest ${driver.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-700 animate-pulse'
                                                }`}>
                                                {driver.status === 'active' ? 'Libre' : 'En Ruta'}
                                            </div>
                                        </div>

                                        <h4 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-1 truncate">{driver.name}</h4>
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[8px] md:text-[9px] mb-4 md:mb-8 truncate">{driver.vehicleType} • {driver.phone}</p>

                                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 md:p-6 rounded-2xl md:rounded-[32px] text-center">
                                                <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">OK</p>
                                                <p className="text-lg md:text-2xl font-black text-gray-900 dark:text-white">{driver.deliveriesCompleted}</p>
                                            </div>
                                            <div className={`p-4 md:p-6 rounded-2xl md:rounded-[32px] text-center border-2 transition-all ${driver.status === 'busy' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-400 text-amber-600' : 'bg-gray-50 dark:bg-gray-800/50 border-transparent text-gray-400'
                                                }`}>
                                                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-1">Time</p>
                                                <p className={`text-lg md:text-2xl font-black ${driver.status === 'busy' ? 'text-amber-600' : 'text-gray-900 dark:text-white'}`}>
                                                    {driver.status === 'busy' ? `${routeTime}m` : '--'}
                                                </p>
                                            </div>
                                        </div>

                                        {driver.status === 'busy' && currentOrder && (
                                            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-100 dark:border-gray-800">
                                                <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                                                    <span>Pedido</span>
                                                    <span className="text-amber-500">{currentOrder.id}</span>
                                                </p>
                                                <p className="font-bold text-gray-800 dark:text-gray-200 text-[10px] md:text-xs line-clamp-1">{currentOrder.address}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

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
        @keyframes swing {
          0%, 100% { transform: rotate(0); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-10deg); }
          60% { transform: rotate(5deg); }
          80% { transform: rotate(-5deg); }
        }
        .animate-swing { animation: swing 2s ease-in-out infinite; transform-origin: top center; }
      `}</style>
        </div>
    );
}
