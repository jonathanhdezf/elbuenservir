
import React, { useState } from 'react';
import { Order, Staff, OrderItem } from '../types';
import {
    Monitor,
    Utensils,
    ChevronRight,
    Clock,
    User,
    CheckCircle,
    ShoppingBag,
    ArrowLeft,
    Key,
    AlertCircle
} from 'lucide-react';
import { soundManager } from '../utils/soundManager';

interface LocalDispatchViewProps {
    orders: Order[];
    staff: Staff[];
    onUpdateOrder: (order: Partial<Order>) => void;
    onEditOrder: (order: Order) => void;
    setView: (view: any) => void;
}

const LocalDispatchView: React.FC<LocalDispatchViewProps> = ({
    orders,
    staff,
    onUpdateOrder,
    onEditOrder,
    setView
}) => {
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState<string | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Payment Logic States
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [activeOrderForPayment, setActiveOrderForPayment] = useState<Order | null>(null);
    const [cashReceived, setCashReceived] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
    const [paymentError, setPaymentError] = useState<string | null>(null);

    // TABLES: 1 to 5
    const tables = Array.from({ length: 5 }, (_, i) => (i + 1).toString());

    // Get active order for a table
    const getTableOrder = (tableNum: string) => {
        return orders.find(o =>
            o.address?.includes(`Mesa: ${tableNum}`) &&
            !['delivered', 'cancelled'].includes(o.status)
        );
    };

    // Get waiter name for a table
    const getTableWaiter = (order: Order | undefined) => {
        if (!order || !order.waiterId) return null;
        return staff.find(s => s.id === order.waiterId)?.name || 'Desconocido';
    };

    const handleTableClick = (tableNum: string) => {
        const order = getTableOrder(tableNum);
        if (order) {
            setSelectedTable(tableNum);
            setIsAuthModalOpen(true);
            setAuthError(null);
            setPassword('');
            soundManager.play('click');
        } else {
            // If table is free, go to TPV to create new order
            soundManager.play('navigation');
            setView('tpv');
            // Pass table info somehow? 
            // For now let's just go to TPV.
        }
    };

    const handleAuthenticate = () => {
        const order = getTableOrder(selectedTable!);
        if (!order) return;

        const waiter = staff.find(s => s.id === order.waiterId);
        if (waiter && waiter.password === password) {
            setIsAuthModalOpen(false);
            soundManager.play('confirm');
            onEditOrder(order);
        } else {
            setAuthError('Contraseña incorrecta');
            soundManager.play('error');
        }
    };

    const handlePayTableAccount = () => {
        const order = getTableOrder(selectedTable!);
        if (!order) return;

        const waiter = staff.find(s => s.id === order.waiterId);
        if (waiter && waiter.password === password) {
            setIsAuthModalOpen(false);
            handleOpenPayment(order);
        } else {
            setAuthError('Contraseña incorrecta');
            soundManager.play('error');
        }
    };

    const handleOpenPayment = (order: Order) => {
        setActiveOrderForPayment(order);
        setIsPaymentModalOpen(true);
        setCashReceived('');
        setPaymentMethod('efectivo');
        setPaymentError(null);
        soundManager.play('click');
    };

    const handleConfirmPayment = () => {
        const order = activeOrderForPayment;
        if (!order) return;

        if (paymentMethod === 'efectivo') {
            const received = parseFloat(cashReceived);
            if (isNaN(received) || received < order.total) {
                setPaymentError('Efectivo insuficiente');
                soundManager.play('error');
                return;
            }
        }

        const updatedOrder: Partial<Order> = {
            id: order.id,
            paymentStatus: 'paid',
            paymentMethod: paymentMethod,
            cashReceived: paymentMethod === 'efectivo' ? parseFloat(cashReceived) : undefined,
            change: paymentMethod === 'efectivo' ? (parseFloat(cashReceived) - order.total) : undefined
        };

        onUpdateOrder(updatedOrder);

        // Auto-release table after 5 seconds
        if (order.address?.includes('Mesa')) {
            setTimeout(() => {
                onUpdateOrder({ id: order.id, status: 'delivered' });
            }, 5000);
        }

        setIsPaymentModalOpen(false);
        setActiveOrderForPayment(null);
        soundManager.play('confirm');
    };

    const handleDeliverCounterOrder = (order: Order) => {
        if (order.paymentStatus !== 'paid') {
            handleOpenPayment(order);
            return;
        }
        onUpdateOrder({ id: order.id, status: 'delivered' });
        soundManager.play('confirm');
    };

    const counterOrders = orders.filter(o =>
        o.address?.includes('Mostrador') &&
        o.status === 'ready'
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 lg:p-10 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setView('control_panel')}
                            title="Volver al inicio"
                            className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm text-gray-400 hover:text-primary-500 transition-all"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Despacho Local</h1>
                            <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1">Gestión de Mesas y Entrega en Barra</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4" />
                            Barra: {counterOrders.length}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Tables Section */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <Utensils className="w-6 h-6 text-gray-400" />
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Estado de Mesas</h2>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {tables.map(table => {
                                const order = getTableOrder(table);
                                const waiter = getTableWaiter(order);
                                const isOccupied = !!order;

                                return (
                                    <button
                                        key={table}
                                        onClick={() => handleTableClick(table)}
                                        className={`
                      aspect-square rounded-[40px] p-6 flex flex-col items-center justify-center gap-2 transition-all border-4
                      ${isOccupied
                                                ? 'bg-white dark:bg-gray-900 border-primary-500 shadow-xl shadow-primary-500/10'
                                                : 'bg-gray-100 dark:bg-gray-800/50 border-transparent hover:border-gray-200 dark:hover:border-gray-700 opacity-60'}
                    `}
                                    >
                                        <span className={`text-4xl font-black ${isOccupied ? 'text-primary-500' : 'text-gray-400'}`}>
                                            {table}
                                        </span>
                                        {isOccupied ? (
                                            <div className="text-center">
                                                <div className="flex items-center justify-center gap-1 text-[9px] font-black text-gray-500 uppercase">
                                                    <User className="w-3 h-3" />
                                                    {waiter}
                                                </div>
                                                <div className={`mt-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'}`}>
                                                    ${order.total} {order.paymentStatus === 'paid' ? '(Pagado)' : ''}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Disponible</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Counter Delivery Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <ShoppingBag className="w-6 h-6 text-gray-400" />
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Por Entregar (Mostrador)</h2>
                        </div>

                        <div className="space-y-4">
                            {counterOrders.map(order => (
                                <div key={order.id} className="bg-white dark:bg-gray-900 rounded-[32px] p-6 shadow-xl border border-gray-100 dark:border-gray-800">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest">{order.id}</p>
                                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase leading-none mt-1">{order.customerName}</h3>
                                        </div>
                                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-xs font-bold text-gray-500">
                                                <span>{item.quantity}x {item.name}</span>
                                                <span>${item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleDeliverCounterOrder(order)}
                                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all ${order.paymentStatus === 'paid' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'}`}
                                    >
                                        {order.paymentStatus === 'paid' ? 'Entregar Ahora' : 'Cobrar y Entregar'}
                                    </button>
                                </div>
                            ))}
                            {counterOrders.length === 0 && (
                                <div className="py-20 text-center opacity-20 grayscale">
                                    <Clock className="w-16 h-16 mx-auto mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">No hay pedidos listos</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Authentication Modal */}
            {isAuthModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm transition-all duration-300">
                    <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-[40px] shadow-2xl overflow-hidden border-4 border-white dark:border-gray-800">
                        <div className="p-10">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-primary-500/30">
                                    <Key className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Mesa {selectedTable}</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 px-6">Se requiere autenticación para gestionar esta mesa</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Contraseña del Mesero</label>
                                    <input
                                        autoFocus
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAuthenticate()}
                                        placeholder="••••"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary-500 rounded-2xl px-6 py-4 font-black text-xl tracking-[1em] text-center outline-none transition-all placeholder:tracking-normal"
                                    />
                                </div>
                                {authError && (
                                    <div className="p-2 bg-red-50 dark:bg-red-500/10 text-red-500 text-[10px] font-black uppercase text-center rounded-2xl flex items-center justify-center gap-2">
                                        <AlertCircle className="w-3 h-3" />
                                        {authError}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={handleAuthenticate}
                                    className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-3xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                                >
                                    Gestionar Orden
                                </button>
                                <button
                                    onClick={handlePayTableAccount}
                                    className="w-full py-5 bg-primary-500 text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary-500/20"
                                >
                                    Pagar Cuenta
                                </button>
                                <button
                                    onClick={() => setIsAuthModalOpen(false)}
                                    className="w-full py-2 text-gray-400 font-black uppercase tracking-widest text-[9px] hover:text-gray-600 transition-all"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {isPaymentModalOpen && activeOrderForPayment && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-[40px] shadow-2xl overflow-hidden border-4 border-white dark:border-gray-800">
                        <div className="p-10">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Cobrar Comanda</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{activeOrderForPayment.customerName}</p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-6 mb-8 text-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Total a Pagar</span>
                                <span className="text-4xl font-black text-primary-500">${activeOrderForPayment.total.toFixed(2)}</span>

                                <div className="grid grid-cols-3 gap-2 mt-6">
                                    {(['efectivo', 'tarjeta', 'transferencia'] as const).map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setPaymentMethod(m)}
                                            className={`py-3 rounded-2xl text-[9px] font-black uppercase border-2 transition-all ${paymentMethod === m
                                                ? 'bg-primary-500 border-primary-500 text-white shadow-md'
                                                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-400'
                                                }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {paymentMethod === 'efectivo' && (
                                <div className="space-y-4 mb-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Monto Recibido</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                                            <input
                                                autoFocus
                                                type="number"
                                                value={cashReceived}
                                                onChange={(e) => setCashReceived(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary-500 rounded-2xl pl-12 pr-6 py-4 font-black text-lg outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    {parseFloat(cashReceived) >= activeOrderForPayment.total && (
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex justify-between items-center text-emerald-600">
                                            <span className="text-[10px] font-black uppercase">Cambio:</span>
                                            <span className="text-lg font-black">${(parseFloat(cashReceived) - activeOrderForPayment.total).toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {paymentError && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 text-red-500 text-[10px] font-black uppercase text-center rounded-2xl">
                                    {paymentError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={handleConfirmPayment}
                                    className="w-full py-5 bg-primary-500 text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary-500/20"
                                >
                                    Confirmar Pago
                                </button>
                                <button
                                    onClick={() => {
                                        setIsPaymentModalOpen(false);
                                        setActiveOrderForPayment(null);
                                    }}
                                    className="w-full py-2 text-gray-400 font-black uppercase tracking-widest text-[9px] hover:text-gray-600 transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocalDispatchView;
