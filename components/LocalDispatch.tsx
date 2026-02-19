
import React, { useState } from 'react';
import {
    Store, Utensils, CheckCircle, Clock,
    ShieldCheck, AlertCircle, X, Scan,
    Plus, DollarSign, LayoutGrid, Receipt, Users, User, UserPlus,
    Banknote, CreditCard
} from 'lucide-react';
import { Order, Staff } from '../types';

interface LocalDispatchProps {
    orders: Order[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    activeTableOrders: Record<number, string>;
    setActiveTableOrders: React.Dispatch<React.SetStateAction<Record<number, string>>>;
    onAddOrder: (tableNum: number, waiterId: string) => void;
    onPrintTicket: (order: Order) => void;
    staff: Staff[];
    lockedWaiterId?: string;
}

export const LocalDispatchSection: React.FC<LocalDispatchProps> = ({
    orders,
    setOrders,
    activeTableOrders,
    setActiveTableOrders,
    onAddOrder,
    onPrintTicket,
    staff,
    lockedWaiterId
}) => {
    const [verifyingOrder, setVerifyingOrder] = useState<string | null>(null);
    const [payingOrder, setPayingOrder] = useState<Order | null>(null);
    const [assigningWaiterToTable, setAssigningWaiterToTable] = useState<number | null>(null);
    const [assigningWaiterToOrderId, setAssigningWaiterToOrderId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
    const [selectedWaiterId, setSelectedWaiterId] = useState<string>(lockedWaiterId || '');
    const [ticketRef, setTicketRef] = useState('');
    const [opRef, setOpRef] = useState('');
    const [ticketInput, setTicketInput] = useState('');
    const [cashReceived, setCashReceived] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'orders' | 'tables'>('tables');

    const waiters = staff.filter(s => s.role === 'waiter' && s.status === 'active');

    const handleOpenTable = (tableNum: number, waiterId: string) => {
        onAddOrder(tableNum, waiterId);
    };

    const handleFinalizePayment = () => {
        if (!payingOrder) return;
        if (!selectedWaiterId) {
            setError('Debe seleccionar un mesero');
            return;
        }

        if (paymentMethod !== 'efectivo' && !ticketRef && !opRef) {
            setError('Falta número de ticket o referencia');
            return;
        }

        const received = parseFloat(cashReceived);
        const change = paymentMethod === 'efectivo' ? (received - payingOrder.total) : 0;

        if (paymentMethod === 'efectivo' && (isNaN(received) || received < payingOrder.total)) {
            setError('Monto recibido insuficiente');
            return;
        }

        setOrders(prev => prev.map(o => o.id === payingOrder.id ? {
            ...o,
            status: 'delivered',
            paymentStatus: 'paid',
            paymentMethod: paymentMethod,
            waiterId: selectedWaiterId,
            ticketNumber: ticketRef || undefined,
            operationNumber: opRef || undefined,
            cashReceived: paymentMethod === 'efectivo' ? received : undefined,
            change: paymentMethod === 'efectivo' ? change : undefined,
            paidAt: new Date().toISOString()
        } : o));

        // Clear table if applicable
        const tableNum = Object.keys(activeTableOrders).find(key => activeTableOrders[parseInt(key)] === payingOrder.id);
        if (tableNum) {
            setActiveTableOrders(prev => {
                const newState = { ...prev };
                delete newState[parseInt(tableNum)];
                return newState;
            });
        }

        onPrintTicket({
            ...payingOrder,
            paymentStatus: 'paid',
            paymentMethod,
            waiterId: selectedWaiterId,
            ticketNumber: ticketRef || undefined,
            operationNumber: opRef || undefined,
            cashReceived: paymentMethod === 'efectivo' ? parseFloat(cashReceived) : undefined,
            change: paymentMethod === 'efectivo' ? (parseFloat(cashReceived) - payingOrder.total) : undefined
        });
        setPayingOrder(null);
        setVerifyingOrder(null);
        setTicketRef('');
        setOpRef('');
        setCashReceived('');
        setTicketInput('');
        setError(null);
    };

    const localOrders = orders.filter(o => {
        const isTable = o.address.includes('Mesa');
        const isMostrador = o.address.includes('Mostrador');

        if (o.status === 'cancelled' || o.status === 'delivered') return false;
        if (o.source !== 'tpv') return false;
        if (lockedWaiterId && o.waiterId !== lockedWaiterId) return false;

        if (isTable) return true;
        if (isMostrador && o.status === 'ready') return true;

        return false;
    });

    const handleVerify = (orderId: string) => {
        if (ticketInput.trim().toUpperCase() === orderId.toUpperCase()) {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'delivered' } : o));

            // If it was a table order, clear the table
            const tableNum = Object.keys(activeTableOrders).find(key => activeTableOrders[parseInt(key)] === orderId);
            if (tableNum) {
                setActiveTableOrders(prev => {
                    const newState = { ...prev };
                    delete newState[parseInt(tableNum)];
                    return newState;
                });
            }

            setVerifyingOrder(null);
            setTicketInput('');
            setError(null);
        } else {
            setError('Número de ticket incorrecto');
        }
    };

    const tables = [1, 2, 3, 4, 5];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Despacho Local</h3>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2 px-1">Gestión de Mesas y Mostrador</p>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setViewMode('tables')}
                        className={`flex items-center px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${viewMode === 'tables' ? 'bg-white dark:bg-gray-700 shadow-lg text-primary-500' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <LayoutGrid className="w-4 h-4 mr-2" />
                        Mesas
                    </button>
                    <button
                        onClick={() => setViewMode('orders')}
                        className={`flex items-center px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${viewMode === 'orders' ? 'bg-white dark:bg-gray-700 shadow-lg text-primary-500' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Receipt className="w-4 h-4 mr-2" />
                        Comandas ({localOrders.length})
                    </button>
                </div>
            </div>

            {viewMode === 'tables' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-32">
                    {tables.map(num => {
                        const orderId = activeTableOrders[num];
                        const order = orderId ? orders.find(o => o.id === orderId) : null;
                        const isOccupied = !!order;

                        return (
                            <div key={num} className={`group relative bg-white dark:bg-gray-800 rounded-[48px] overflow-hidden border transition-all duration-300 ${isOccupied ? 'border-primary-500 shadow-2xl shadow-primary-500/10' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'}`}>
                                {/* Table Header */}
                                <div className={`p-8 ${isOccupied ? 'bg-primary-500 text-white' : 'bg-gray-50 dark:bg-gray-900/50 text-gray-400'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-4xl font-black tracking-tight leading-none mb-1">MESA {num}</h4>
                                            <div className="flex flex-col">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">
                                                    {isOccupied ? 'Ocupada • ' + orderId : 'Disponible'}
                                                </p>
                                                {isOccupied && order?.waiterId && (
                                                    <p className="text-[9px] font-bold uppercase tracking-widest mt-1 bg-white/20 w-fit px-2 py-0.5 rounded-lg">
                                                        Atiende: {staff.find(s => s.id === order.waiterId)?.name || 'Personal'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center ${isOccupied ? 'bg-white/20' : 'bg-white dark:bg-gray-800 shadow-sm'}`}>
                                            <Utensils className={`w-8 h-8 ${isOccupied ? 'text-white' : 'text-gray-200'}`} />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 space-y-6">
                                    {isOccupied && order ? (
                                        <>
                                            <div className="space-y-3">
                                                {order.items.slice(0, 4).map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm font-bold text-gray-600 dark:text-gray-300 italic">
                                                        <span className="uppercase truncate pr-4">{item.name}</span>
                                                        <span className="text-gray-400 tabular-nums">x{item.quantity}</span>
                                                    </div>
                                                ))}
                                                {order.items.length > 4 && (
                                                    <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest text-center pt-2">+ {order.items.length - 4} items adicionales</p>
                                                )}
                                            </div>

                                            <div className="pt-6 border-t border-dashed border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-2">Total Acumulado</span>
                                                <span className="text-3xl font-black text-gray-900 dark:text-white">${order.total.toFixed(2)}</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-4">
                                                <button
                                                    onClick={() => onAddOrder(num, order.waiterId || '')}
                                                    disabled={!!lockedWaiterId && order.waiterId !== lockedWaiterId}
                                                    className={`flex items-center justify-center py-4 rounded-[24px] font-black uppercase text-[10px] tracking-widest transition-all shadow-xl ${!!lockedWaiterId && order.waiterId !== lockedWaiterId ? 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none' : 'bg-gray-900 dark:bg-gray-700 text-white hover:bg-black shadow-gray-200 dark:shadow-none'}`}
                                                >
                                                    <Plus className="w-4 h-4 mr-2" /> Agregar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setPayingOrder(order);
                                                        setSelectedWaiterId(order.waiterId || (waiters[0]?.id || ''));
                                                        setError(null);
                                                    }}
                                                    disabled={!!lockedWaiterId && order.waiterId !== lockedWaiterId}
                                                    className={`flex items-center justify-center py-4 rounded-[24px] font-black uppercase text-[10px] tracking-widest transition-all shadow-xl ${!!lockedWaiterId && order.waiterId !== lockedWaiterId ? 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'}`}
                                                >
                                                    <DollarSign className="w-4 h-4 mr-2" /> Cobrar
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="py-12 flex flex-col items-center justify-center space-y-4">
                                            <div className="w-20 h-20 rounded-[32px] border-2 border-dashed border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-100">
                                                <Plus className="w-10 h-10" />
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (lockedWaiterId) {
                                                        handleOpenTable(num, lockedWaiterId);
                                                    } else {
                                                        setAssigningWaiterToTable(num);
                                                    }
                                                }}
                                                className="px-8 py-4 bg-primary-500 text-white rounded-[24px] font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary-500/20"
                                            >
                                                Abrir Mesa
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {localOrders.length === 0 ? (
                        <div className="col-span-full py-40 text-center opacity-30">
                            <Store className="w-24 h-24 mx-auto mb-4" />
                            <p className="text-2xl font-black uppercase tracking-widest">Sin órdenes activas</p>
                        </div>
                    ) : (
                        localOrders.map(order => (
                            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-[32px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 relative">
                                {verifyingOrder === order.id && (
                                    <div className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 z-10 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
                                        <button onClick={() => { setVerifyingOrder(null); setError(null); setTicketInput(''); }} title="Cerrar" className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                                        <ShieldCheck className="w-12 h-12 text-blue-500 mb-4" />
                                        <h4 className="text-lg font-black uppercase text-gray-900 dark:text-white mb-2">Confirmar Entrega</h4>
                                        <p className="text-xs text-gray-500 mb-4 text-center px-4">Ingrese ID de Orden para validar salida del pedido</p>

                                        <input
                                            type="text"
                                            value={ticketInput}
                                            onChange={(e) => { setTicketInput(e.target.value); setError(null); }}
                                            placeholder={`Ej. ${order.id}`}
                                            className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 font-bold text-center uppercase mb-2 focus:border-blue-500 outline-none"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleVerify(order.id);
                                            }}
                                        />

                                        {error && <p className="text-xs font-bold text-red-500 mb-2 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> {error}</p>}

                                        <button
                                            onClick={() => handleVerify(order.id)}
                                            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg"
                                        >
                                            Completar Entrega
                                        </button>
                                    </div>
                                )}

                                <div className={`p-6 ${order.paymentStatus === 'paid' ? 'bg-blue-600 text-white' : order.status === 'ready' ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white'} flex justify-between items-center`}>
                                    <div>
                                        <span className="text-[10px] uppercase opacity-70 font-black tracking-widest">Ticket {order.id}</span>
                                        <h5 className="font-black text-xl uppercase tracking-tight truncate max-w-[150px]">{order.customerName}</h5>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black">${order.total.toFixed(2)}</p>
                                        <p className="text-[10px] uppercase tracking-widest opacity-70">
                                            {order.paymentStatus === 'paid' ? 'Pagado' : 'Por Cobrar'}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-600 dark:text-gray-300 font-medium uppercase">{item.quantity}x {item.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                                        {order.waiterId ? (
                                            <>
                                                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                    <Users className="w-4 h-4 text-primary-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 truncate">Asignado: {staff.find(s => s.id === order.waiterId)?.name}</span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        if (order.paymentStatus === 'paid') {
                                                            setVerifyingOrder(order.id);
                                                            setError(null);
                                                        } else {
                                                            setPayingOrder(order);
                                                            setSelectedWaiterId(order.waiterId || '');
                                                            setError(null);
                                                        }
                                                    }}
                                                    className={`w-full py-4 ${order.paymentStatus === 'paid' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl flex items-center justify-center gap-2`}
                                                >
                                                    {order.paymentStatus === 'paid' ? (
                                                        <>
                                                            <CheckCircle className="w-4 h-4" /> Entregar Pedido
                                                        </>
                                                    ) : (
                                                        <>
                                                            <DollarSign className="w-4 h-4" /> Cobrar Pedido
                                                        </>
                                                    )}
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    if (lockedWaiterId) {
                                                        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, waiterId: lockedWaiterId } : o));
                                                    } else {
                                                        setAssigningWaiterToOrderId(order.id);
                                                    }
                                                }}
                                                className="w-full py-4 bg-primary-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2"
                                            >
                                                <UserPlus className="w-4 h-4" /> Asignar Mesero
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Payment Modal */}
            {payingOrder && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setPayingOrder(null)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-[48px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 bg-gray-900 text-white flex justify-between items-center">
                            <div>
                                <h4 className="text-2xl font-black uppercase tracking-tighter">Registrar Pago</h4>
                                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{payingOrder.id} • {payingOrder.customerName}</p>
                            </div>
                            <button title="Cerrar" onClick={() => setPayingOrder(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                            {/* Waiter Selection */}
                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Asignar Mesero</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {waiters.map(waiter => (
                                        <button
                                            key={waiter.id}
                                            onClick={() => setSelectedWaiterId(waiter.id)}
                                            disabled={!!lockedWaiterId}
                                            className={`p-4 rounded-3xl border-2 transition-all flex items-center space-x-3 ${selectedWaiterId === waiter.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-gray-100 dark:border-gray-700 text-gray-400 hover:border-gray-200'} ${!!lockedWaiterId && selectedWaiterId !== waiter.id ? 'opacity-30' : ''}`}
                                        >
                                            <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <span className="font-black text-[10px] uppercase truncate">{waiter.name}</span>
                                        </button>
                                    ))}
                                    {waiters.length === 0 && (
                                        <p className="col-span-2 text-center py-4 text-[10px] font-bold text-amber-500 uppercase">No hay meseros activos.</p>
                                    )}
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Método de Pago</label>
                                <div className="flex gap-4">
                                    {(['efectivo', 'tarjeta', 'transferencia'] as const).map(method => (
                                        <button
                                            key={method}
                                            onClick={() => {
                                                setPaymentMethod(method);
                                                setTicketRef('');
                                                setOpRef('');
                                            }}
                                            className={`flex-1 py-6 rounded-3xl border-2 font-black text-[10px] uppercase tracking-widest transition-all flex flex-col items-center gap-2 ${paymentMethod === method ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 shadow-xl' : 'border-gray-100 dark:border-gray-700 text-gray-400'}`}
                                        >
                                            {method === 'efectivo' ? <Banknote className="w-6 h-6" /> : method === 'tarjeta' ? <CreditCard className="w-6 h-6" /> : <Scan className="w-6 h-6" />}
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Cash Input */}
                            {paymentMethod === 'efectivo' && (
                                <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Monto Recibido</label>
                                        <div className="relative">
                                            <Banknote className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-emerald-500" />
                                            <input
                                                type="number"
                                                value={cashReceived}
                                                onChange={e => {
                                                    setCashReceived(e.target.value);
                                                    setError(null);
                                                }}
                                                className="w-full pl-20 pr-8 py-8 bg-emerald-50 dark:bg-emerald-900/10 border-4 border-emerald-100 dark:border-emerald-900/30 rounded-[32px] font-black text-4xl outline-none focus:border-emerald-500 transition-all text-emerald-600"
                                                placeholder="0.00"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleFinalizePayment();
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {parseFloat(cashReceived) >= payingOrder.total && (
                                        <div className="p-6 bg-gray-900 rounded-[32px] flex justify-between items-center animate-in zoom-in duration-300">
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Cambio a entregar</span>
                                            <span className="text-3xl font-black text-emerald-400">${(parseFloat(cashReceived) - payingOrder.total).toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Reference Inputs for non-cash */}
                            {paymentMethod !== 'efectivo' && (
                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">No. Ticket</label>
                                            <input
                                                type="text"
                                                value={ticketRef}
                                                onChange={e => setTicketRef(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-2xl px-4 py-3 font-bold text-sm outline-none transition-all uppercase"
                                                placeholder="Ej. TK-001"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleFinalizePayment();
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">No. Operación</label>
                                            <input
                                                type="text"
                                                value={opRef}
                                                onChange={e => setOpRef(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-2xl px-4 py-3 font-bold text-sm outline-none transition-all uppercase"
                                                placeholder="Ej. OP-441"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleFinalizePayment();
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between mb-2">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Importe Total</span>
                                <span className="text-4xl font-black text-gray-900 dark:text-white">${payingOrder.total.toFixed(2)}</span>
                            </div>

                            {error && <p className="text-xs font-bold text-red-500 text-center animate-bounce">{error}</p>}

                            <button
                                onClick={handleFinalizePayment}
                                className="w-full py-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                <CheckCircle className="w-6 h-6" />
                                Finalizar y Entregar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Waiter Assignment Modal (Generalized) */}
            {(assigningWaiterToTable !== null || assigningWaiterToOrderId !== null) && (
                <div className="absolute inset-0 z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => { setAssigningWaiterToTable(null); setAssigningWaiterToOrderId(null); }}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-100 dark:border-gray-700">
                            <h4 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
                                {assigningWaiterToTable !== null ? `Mesa ${assigningWaiterToTable}` : `Pedido ${assigningWaiterToOrderId}`}
                            </h4>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Seleccione un mesero responsable</p>
                        </div>
                        <div className="p-6 space-y-3">
                            {waiters.map(waiter => (
                                <button
                                    key={waiter.id}
                                    onClick={() => {
                                        if (assigningWaiterToTable !== null) {
                                            handleOpenTable(assigningWaiterToTable, waiter.id);
                                            setAssigningWaiterToTable(null);
                                        } else if (assigningWaiterToOrderId !== null) {
                                            setOrders(prev => prev.map(o => o.id === assigningWaiterToOrderId ? { ...o, waiterId: waiter.id } : o));
                                            setAssigningWaiterToOrderId(null);
                                        }
                                    }}
                                    className="w-full flex items-center p-4 bg-gray-50 dark:bg-gray-900 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-2xl transition-all border-2 border-transparent hover:border-primary-500 group"
                                >
                                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-primary-500 shadow-sm mr-4">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <span className="font-black text-sm uppercase dark:text-white">{waiter.name}</span>
                                </button>
                            ))}
                            {waiters.length === 0 && (
                                <p className="text-center py-4 text-xs font-bold text-amber-500">No hay meseros activos.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

