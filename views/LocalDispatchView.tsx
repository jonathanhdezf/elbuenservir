import React, { useEffect, useState } from 'react';
import { Order, Staff } from '../types';
import {
    Utensils,
    Clock,
    User,
    CheckCircle,
    ShoppingBag,
    ArrowLeft,
    Key,
    AlertCircle,
    ChevronRight,
    X,
    CreditCard,
    Banknote,
    Building2
} from 'lucide-react';
import { soundManager } from '../utils/soundManager';
import { useMobileBack } from '../hooks/useMobileBack';

interface LocalDispatchViewProps {
    orders: Order[];
    staff: Staff[];
    onUpdateOrder: (order: Partial<Order>) => void;
    updateCustomerStats: (name: string, phone: string, amount: number, adding?: boolean) => void;
    onEditOrder: (order: Order) => void;
    onOpenTableOrder?: (tableNum: string) => void;
    setView: (view: any) => void;
}

const LocalDispatchView: React.FC<LocalDispatchViewProps> = ({
    orders,
    staff,
    onUpdateOrder,
    updateCustomerStats,
    onEditOrder,
    onOpenTableOrder,
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

    // Mobile Back Button Navigation Logic
    const hasOpenLocalModal = isAuthModalOpen || isPaymentModalOpen;
    const handleCloseLocalModal = () => {
        if (isAuthModalOpen) setIsAuthModalOpen(false);
        if (isPaymentModalOpen) setIsPaymentModalOpen(false);
    };

    useMobileBack({
        hasOpenModal: hasOpenLocalModal,
        onCloseModal: handleCloseLocalModal,
        onExit: () => setView('control_panel')
    });

    useEffect(() => {
        if (!hasOpenLocalModal) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleCloseLocalModal();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [hasOpenLocalModal]);

    // TABLES: 1 to 5
    const tables = Array.from({ length: 5 }, (_, i) => (i + 1).toString());

    // Get active order for a table
    const getTableOrder = (tableNum: string) => {
        return orders.find(o =>
            o.address?.toLowerCase().includes(`mesa: ${tableNum}`) &&
            !['delivered', 'cancelled'].includes(o.status)
        );
    };

    // Get waiter name for a table
    const getTableWaiter = (order: Order | undefined) => {
        if (!order || !order.waiterId) return null;
        return staff.find(s => s.id === order.waiterId)?.name || 'Sin asignar';
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
            soundManager.play('navigation');
            if (onOpenTableOrder) {
                onOpenTableOrder(tableNum);
            } else {
                setView('tpv');
            }
        }
    };

    const handleAuthenticate = () => {
        if (!selectedTable) return;
        const order = getTableOrder(selectedTable);
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
        if (!selectedTable) return;
        const order = getTableOrder(selectedTable);
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
        updateCustomerStats(order.customerName, order.customerPhone, order.total, true);

        // Auto-release table after 5 seconds
        if (order.address?.toLowerCase().includes('mesa')) {
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
        o.address?.toLowerCase().includes('mostrador') &&
        o.status === 'ready'
    );

    const occupiedCount = tables.filter(t => !!getTableOrder(t)).length;
    const availableCount = tables.length - occupiedCount;
    const selectedTableOrder = selectedTable ? getTableOrder(selectedTable) : undefined;

    return (
        <div className="min-h-screen bg-[#FDFBFC] dark:bg-[#110a10] text-gray-900 dark:text-gray-100 font-sans transition-colors">
            {/* Top App Bar */}
            <header className="sticky top-0 z-30 h-16 md:h-20 bg-[#FDFBFC]/95 dark:bg-[#110a10]/95 backdrop-blur-xl border-b border-gray-200/80 dark:border-white/10 px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        onClick={() => {
                            soundManager.play('navigation');
                            setView('control_panel');
                        }}
                        title="Volver al Panel de Control"
                        className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 sm:px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-white font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4 text-primary-500" />
                        <span>Panel</span>
                    </button>

                    <div className="min-w-0">
                        <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-gray-900 dark:text-white truncate">
                            Despacho Local
                        </h1>
                        <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                            Mesas y entrega en barra
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-5 text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">
                    <div className="hidden sm:flex items-center gap-2 tabular-nums">
                        <span>{occupiedCount} ocupadas</span>
                        <span aria-hidden="true">·</span>
                        <span>{availableCount} libres</span>
                    </div>
                    <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold text-xs flex items-center gap-2 tabular-nums">
                        <ShoppingBag className="w-4 h-4 shrink-0" />
                        <span>Barra: {counterOrders.length}</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-8">
                {/* Summary Strip (Mobile) */}
                <div className="grid grid-cols-3 gap-3 sm:hidden">
                    <div className="bg-white dark:bg-[#1a1118] border border-gray-200/80 dark:border-white/10 rounded-2xl p-3.5">
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Ocupadas</p>
                        <p className="text-xl font-black text-primary-500 tabular-nums mt-0.5">{occupiedCount}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1a1118] border border-gray-200/80 dark:border-white/10 rounded-2xl p-3.5">
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Libres</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums mt-0.5">{availableCount}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1a1118] border border-gray-200/80 dark:border-white/10 rounded-2xl p-3.5">
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">En barra</p>
                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">{counterOrders.length}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Tables Section */}
                    <section className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                                    <Utensils className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">
                                        Mesas del Comedor
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Toca una mesa libre para tomar orden o una ocupada para gestionarla
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4">
                            {tables.map(table => {
                                const order = getTableOrder(table);
                                const waiter = getTableWaiter(order);
                                const isOccupied = !!order;
                                const isPaid = order?.paymentStatus === 'paid';

                                return (
                                    <button
                                        key={table}
                                        type="button"
                                        onClick={() => handleTableClick(table)}
                                        className={`
                                            group relative text-left rounded-3xl p-4 sm:p-5 min-h-[156px] flex flex-col justify-between transition-all duration-200 border active:scale-[0.98] cursor-pointer
                                            ${isOccupied
                                                ? 'bg-white dark:bg-[#1a1118] border-primary-500/70 shadow-sm hover:border-primary-500 hover:shadow-md'
                                                : 'bg-white dark:bg-[#1a1118] border-gray-200/80 dark:border-white/10 hover:border-primary-300 dark:hover:border-primary-500/40'
                                            }
                                        `}
                                    >
                                        <div className="flex items-start justify-between gap-2 w-full">
                                            <div>
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block">
                                                    Mesa
                                                </span>
                                                <span className={`text-3xl font-black tabular-nums leading-none mt-1 block ${isOccupied ? 'text-primary-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                                    {table}
                                                </span>
                                            </div>
                                            <ChevronRight className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${isOccupied ? 'text-primary-500' : 'text-gray-300 dark:text-gray-600'}`} />
                                        </div>

                                        {isOccupied && order ? (
                                            <div className="space-y-1.5 pt-3 border-t border-gray-100 dark:border-white/10 w-full">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 truncate">
                                                    <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                    <span className="truncate">{waiter}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">
                                                        ${order.total.toFixed(2)}
                                                    </span>
                                                    <span className={`text-[11px] font-bold ${isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                        {isPaid ? 'Pagado' : 'Abierta'}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="pt-3 border-t border-gray-100 dark:border-white/10 w-full">
                                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
                                                    Disponible
                                                </span>
                                                <span className="text-[11px] text-gray-400 dark:text-gray-500 block mt-0.5">
                                                    Abrir comanda
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Counter Delivery Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <ShoppingBag className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">
                                    Por Entregar (Barra)
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Pedidos listos para entregar al cliente
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3.5">
                            {counterOrders.map(order => (
                                <div
                                    key={order.id}
                                    className="bg-white dark:bg-[#1a1118] rounded-3xl p-5 border border-gray-200/80 dark:border-white/10 space-y-4"
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 tabular-nums">
                                                {order.id} · {order.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente de cobro'}
                                            </p>
                                            <h3 className="text-base font-extrabold text-gray-900 dark:text-white truncate mt-0.5">
                                                {order.customerName}
                                            </h3>
                                        </div>
                                        <span className="text-base font-black text-gray-900 dark:text-white tabular-nums shrink-0">
                                            ${order.total.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 border-t border-gray-100 dark:border-white/10 pt-3">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between gap-2 text-xs text-gray-600 dark:text-gray-300">
                                                <span className="truncate font-medium">
                                                    <span className="font-bold tabular-nums">{item.quantity}×</span> {item.name}
                                                </span>
                                                <span className="font-bold tabular-nums shrink-0">
                                                    ${(item.price * item.quantity).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleDeliverCounterOrder(order)}
                                        className={`w-full min-h-[48px] px-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${
                                            order.paymentStatus === 'paid'
                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                                : 'bg-gray-900 dark:bg-primary-500 hover:bg-gray-800 dark:hover:bg-primary-600 text-white'
                                        }`}
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        <span>{order.paymentStatus === 'paid' ? 'Entregar Ahora' : 'Cobrar y Entregar'}</span>
                                    </button>
                                </div>
                            ))}

                            {counterOrders.length === 0 && (
                                <div className="bg-white dark:bg-[#1a1118] rounded-3xl border border-dashed border-gray-200 dark:border-white/10 py-14 px-6 text-center">
                                    <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                        Sin pedidos listos en barra
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        Aparecerán aquí en cuanto cocina los marque listos
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            {/* Authentication Modal */}
            {isAuthModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-white dark:bg-[#1a1118] rounded-3xl shadow-2xl overflow-hidden border border-gray-200/80 dark:border-white/10 animate-in zoom-in-95 duration-200">
                        <div className="p-6 sm:p-8 space-y-6">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-primary-500/20 shrink-0">
                                        <Key className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                            Mesa {selectedTable}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Ingresa contraseña del mesero
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsAuthModalOpen(false)}
                                    aria-label="Cerrar"
                                    className="min-w-[44px] min-h-[44px] rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {selectedTableOrder && (
                                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/10 flex items-center justify-between text-xs">
                                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                                        Mesero: <strong className="text-gray-900 dark:text-white">{getTableWaiter(selectedTableOrder)}</strong>
                                    </span>
                                    <span className="font-black text-primary-600 dark:text-primary-400 tabular-nums">
                                        ${selectedTableOrder.total.toFixed(2)}
                                    </span>
                                </div>
                            )}

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block">
                                    Contraseña del Mesero
                                </label>
                                <input
                                    autoFocus
                                    type="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (authError) setAuthError(null);
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAuthenticate()}
                                    placeholder="••••"
                                    className="w-full min-h-[52px] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-primary-500 rounded-2xl px-5 font-black text-xl tracking-[0.6em] text-center outline-none transition-all placeholder:tracking-normal text-gray-900 dark:text-white"
                                />
                                {authError && (
                                    <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold text-center rounded-2xl flex items-center justify-center gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{authError}</span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-2.5">
                                <button
                                    type="button"
                                    onClick={handleAuthenticate}
                                    className="w-full min-h-[48px] bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-xs uppercase tracking-wider hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                    Gestionar Orden en TPV
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePayTableAccount}
                                    className="w-full min-h-[48px] bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition-all shadow-md shadow-primary-500/20 cursor-pointer"
                                >
                                    Pagar Cuenta
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAuthModalOpen(false)}
                                    className="w-full min-h-[44px] text-gray-500 dark:text-gray-400 font-semibold text-xs hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {isPaymentModalOpen && activeOrderForPayment && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-white dark:bg-[#1a1118] rounded-3xl shadow-2xl overflow-hidden border border-gray-200/80 dark:border-white/10 animate-in zoom-in-95 duration-200">
                        <div className="p-6 sm:p-8 space-y-6">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                            Cobrar Comanda
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {activeOrderForPayment.customerName}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsPaymentModalOpen(false);
                                        setActiveOrderForPayment(null);
                                    }}
                                    aria-label="Cerrar"
                                    className="min-w-[44px] min-h-[44px] rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="bg-gray-50 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/10 rounded-2xl p-5 text-center">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                                    Total a Pagar
                                </span>
                                <span className="text-3xl font-black text-primary-500 tabular-nums">
                                    ${activeOrderForPayment.total.toFixed(2)}
                                </span>

                                <div className="grid grid-cols-3 gap-2 mt-4">
                                    {([
                                        { id: 'efectivo', label: 'Efectivo', icon: Banknote },
                                        { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                                        { id: 'transferencia', label: 'Transf.', icon: Building2 }
                                    ] as const).map(({ id, label, icon: Icon }) => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => setPaymentMethod(id)}
                                            className={`min-h-[44px] px-2 py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                                paymentMethod === id
                                                    ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                                                    : 'bg-white dark:bg-[#1a1118] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span>{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {paymentMethod === 'efectivo' && (
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block">
                                        Monto Recibido
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                                        <input
                                            autoFocus
                                            type="number"
                                            inputMode="decimal"
                                            value={cashReceived}
                                            onChange={(e) => {
                                                setCashReceived(e.target.value);
                                                if (paymentError) setPaymentError(null);
                                            }}
                                            placeholder="0.00"
                                            className="w-full min-h-[48px] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-primary-500 rounded-2xl pl-9 pr-4 font-black text-lg tabular-nums outline-none transition-all text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    {parseFloat(cashReceived) >= activeOrderForPayment.total && (
                                        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl flex justify-between items-center text-emerald-700 dark:text-emerald-300">
                                            <span className="text-xs font-bold uppercase tracking-wider">Cambio:</span>
                                            <span className="text-lg font-black tabular-nums">
                                                ${(parseFloat(cashReceived) - activeOrderForPayment.total).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {paymentError && (
                                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold text-center rounded-2xl">
                                    {paymentError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-2.5">
                                <button
                                    type="button"
                                    onClick={handleConfirmPayment}
                                    className="w-full min-h-[48px] bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition-all shadow-md shadow-primary-500/20 cursor-pointer"
                                >
                                    Confirmar Pago
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsPaymentModalOpen(false);
                                        setActiveOrderForPayment(null);
                                    }}
                                    className="w-full min-h-[44px] text-gray-500 dark:text-gray-400 font-semibold text-xs hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer"
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
