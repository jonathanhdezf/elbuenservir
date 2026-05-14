
import React, { useState, useEffect } from 'react';
import {
  Bike, CheckCircle, Clock, DollarSign, MapPin, Moon, Package,
  PackageCheck, Star, Sun, User, X, CreditCard, ArrowRight,
  Info, AlertCircle, Shield, ChevronLeft
} from 'lucide-react';
import { DeliveryDriver, Order, PaymentMethod } from '../types';
import { soundManager } from '../utils/soundManager';

interface RepartidorViewProps {
  drivers: DeliveryDriver[];
  setDrivers: React.Dispatch<React.SetStateAction<DeliveryDriver[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  updateCustomerStats: (name: string, phone: string, amount: number, adding?: boolean) => void;
  updateDriverStats: (driverId: string, rating: number, adding?: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onExit: () => void;
}

type ViewState = 'selector' | 'pin' | 'dashboard';

export default function RepartidorView({
  drivers, setDrivers, orders, setOrders,
  updateCustomerStats, updateDriverStats,
  isDarkMode, setIsDarkMode, onExit
}: RepartidorViewProps) {
  const [viewState, setViewState] = useState<ViewState>('selector');
  const [selectedDriver, setSelectedDriver] = useState<DeliveryDriver | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Payment state
  const [cashReceived, setCashReceived] = useState('');
  const [ticketNum, setTicketNum] = useState('');
  const [opNum, setOpNum] = useState('');
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const activeDrivers = drivers.filter(d => !d.isDisabled);

  const currentOrder = selectedDriver
    ? orders.find(o => o.assignedDriverId === selectedDriver.id && o.status === 'delivery')
    : null;

  // Refresh driver ref when drivers state updates
  const driver = selectedDriver ? drivers.find(d => d.id === selectedDriver.id) || selectedDriver : null;

  const handlePinDigit = (digit: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length >= 4) {
      const found = drivers.find(d => d.id === selectedDriver?.id);
      const driverPin = found?.pin || '1234';
      if (newPin === driverPin) {
        soundManager.play('confirm', 'driver_dashboard');
        setViewState('dashboard');
        setPinError(false);
        setPin('');
      } else if (newPin.length === 4) {
        setPinError(true);
        soundManager.play('error');
        setTimeout(() => { setPin(''); setPinError(false); }, 700);
      }
    }
  };

  const handlePinDelete = () => setPin(p => p.slice(0, -1));

  const toggleStatus = () => {
    if (!driver) return;
    if (currentOrder && driver.status !== 'offline') return; // can't clock out mid-delivery
    const newStatus = driver.status === 'offline' ? 'active' : 'offline';
    setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, status: newStatus } : d));
    setSelectedDriver(prev => prev ? { ...prev, status: newStatus } : prev);
    soundManager.play('confirm', 'driver_dashboard');
  };

  const getElapsed = (dateStr?: string) => {
    if (!dateStr) return '00:00';
    const diff = Math.max(0, Math.floor((currentTime.getTime() - new Date(dateStr).getTime()) / 1000));
    return `${String(Math.floor(diff / 60)).padStart(2, '0')}:${String(diff % 60).padStart(2, '0')}`;
  };

  const isPaymentValid = () => {
    if (!currentOrder) return false;
    if (currentOrder.paymentMethod === 'efectivo') {
      const r = parseFloat(cashReceived);
      return !isNaN(r) && r >= currentOrder.total;
    }
    if (currentOrder.paymentMethod === 'tarjeta') return ticketNum.trim() !== '' && opNum.trim() !== '';
    if (currentOrder.paymentMethod === 'transferencia') return opNum.trim() !== '';
    return false;
  };

  const handleConfirmDelivery = () => {
    if (!currentOrder || !driver) return;
    if (!isPaymentValid()) { setPayError('Completa los datos de pago'); return; }
    const received = parseFloat(cashReceived);
    const change = currentOrder.paymentMethod === 'efectivo' ? received - currentOrder.total : 0;
    const updated = {
      ...currentOrder,
      status: 'delivered' as const,
      paymentStatus: 'paid' as const,
      paidAt: new Date().toISOString(),
      cashReceived: currentOrder.paymentMethod === 'efectivo' ? received : undefined,
      change: currentOrder.paymentMethod === 'efectivo' ? change : undefined,
      ticketNumber: ticketNum || undefined,
      operationNumber: opNum || undefined,
      whatsappNotified: false,
    };
    setOrders(prev => prev.map(o => o.id === currentOrder.id ? updated : o));
    updateCustomerStats(updated.customerName, updated.customerPhone, updated.total, true);
    updateDriverStats(driver.id, driver.rating, true);
    setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, status: 'active' } : d));
    setCashReceived(''); setTicketNum(''); setOpNum(''); setPayError(null);
    soundManager.play('confirm', 'driver_dashboard');
  };

  // ─── SCREENS ────────────────────────────────────────────

  if (viewState === 'selector') {
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center p-6 gap-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="text-center z-10">
          <div className="w-20 h-20 bg-teal-500 rounded-[28px] flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-teal-500/30">
            <Bike className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Portal Repartidor</h1>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Selecciona tu perfil para continuar</p>
        </div>

        <div className="w-full max-w-sm z-10 space-y-3">
          {activeDrivers.length === 0 ? (
            <div className="text-center text-white/30 py-10">
              <Bike className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-black uppercase text-sm">No hay repartidores registrados</p>
            </div>
          ) : (
            activeDrivers.map(d => (
              <button
                key={d.id}
                onClick={() => { setSelectedDriver(d); setViewState('pin'); soundManager.play('click'); }}
                className="w-full flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal-500/40 rounded-3xl transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${d.status === 'offline' ? 'bg-gray-700' : 'bg-teal-500'}`}>
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-white uppercase tracking-tight">{d.name}</p>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{d.vehicleType} • {d.deliveriesCompleted} entregas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${d.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : d.status === 'busy' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-700 text-gray-400'}`}>
                    {d.status === 'active' ? 'Libre' : d.status === 'busy' ? 'En Ruta' : 'Offline'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-teal-400 transition-colors" />
                </div>
              </button>
            ))
          )}
        </div>

        <button onClick={onExit} className="z-10 text-white/20 hover:text-white/60 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Volver al Panel
        </button>
      </div>
    );
  }

  if (viewState === 'pin') {
    const dots = Array.from({ length: 4 }, (_, i) => i < pin.length);
    const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center p-8 gap-8">
        <button onClick={() => { setViewState('selector'); setPin(''); setPinError(false); }} className="absolute top-6 left-6 text-white/30 hover:text-white/80 transition-colors flex items-center gap-2">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-widest">Volver</span>
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
            <User className="w-8 h-8 text-teal-400" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">{selectedDriver?.name}</h2>
          <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mt-1">Ingresa tu PIN de acceso</p>
        </div>

        <div className="flex gap-4">
          {dots.map((filled, i) => (
            <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${filled ? (pinError ? 'bg-red-500 scale-110' : 'bg-teal-400 scale-110') : 'bg-white/20'}`} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {keys.map((k, i) => (
            k === '' ? <div key={i} /> :
            k === '⌫' ? (
              <button key={i} onClick={handlePinDelete} className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 font-black text-xl transition-all active:scale-95 flex items-center justify-center">
                ⌫
              </button>
            ) : (
              <button key={i} onClick={() => handlePinDigit(k)} className="h-16 rounded-2xl bg-white/5 hover:bg-teal-500/20 hover:border-teal-500/40 border border-white/5 text-white font-black text-xl transition-all active:scale-95">
                {k}
              </button>
            )
          ))}
        </div>

        {pinError && (
          <p className="text-red-400 text-xs font-black uppercase tracking-widest animate-bounce flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> PIN incorrecto
          </p>
        )}

        <p className="text-white/20 text-[9px] font-bold uppercase tracking-widest">PIN por defecto: 1234</p>
      </div>
    );
  }

  // ─── DASHBOARD ──────────────────────────────────────────
  if (!driver) return null;

  const isLate = currentOrder?.dispatchedAt
    ? (currentTime.getTime() - new Date(currentOrder.dispatchedAt).getTime()) > 1800000
    : false;

  return (
    <div className={`fixed inset-0 ${isDarkMode ? 'dark bg-gray-950' : 'bg-gray-100'} flex flex-col`}>
      {/* Header */}
      <div className="bg-gray-900 text-white p-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setViewState('selector')} title="Volver al selector" className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5 text-white/60" />
          </button>
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-black text-sm uppercase tracking-tight">{driver.name}</p>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">{driver.vehicleType}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${driver.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : driver.status === 'busy' ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-gray-700 text-gray-400'}`}>
            {driver.status === 'active' ? 'En Turno' : driver.status === 'busy' ? 'En Ruta' : 'Fuera de Turno'}
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/50">
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-700">
            <Package className="w-5 h-5 text-teal-500 mx-auto mb-2" />
            <p className="text-xl font-black text-gray-900 dark:text-white">{driver.deliveriesCompleted}</p>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Entregas</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-700">
            <Star className="w-5 h-5 text-amber-400 mx-auto mb-2 fill-current" />
            <p className="text-xl font-black text-gray-900 dark:text-white">{driver.rating}</p>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Puntaje</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-700">
            <Clock className="w-5 h-5 text-blue-500 mx-auto mb-2" />
            <p className="text-lg font-black text-gray-900 dark:text-white font-mono">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Hora Actual</p>
          </div>
        </div>

        {/* Main Card */}
        {currentOrder ? (
          <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Order Header */}
            <div className={`p-6 text-white ${isLate ? 'bg-red-500' : 'bg-teal-600'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Pedido en Ruta</span>
                <div className={`px-3 py-1.5 rounded-xl bg-black/20 font-black font-mono text-lg flex items-center gap-2`}>
                  <Clock className="w-4 h-4" />
                  {getElapsed(currentOrder.dispatchedAt)}
                </div>
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight">{currentOrder.customerName}</h3>
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{currentOrder.id}</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Address */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-xl text-teal-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Dirección de Entrega</p>
                  <p className="font-bold text-gray-800 dark:text-white text-sm mt-0.5">{currentOrder.address || 'Recojo en local'}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Artículos del Pedido</p>
                <div className="space-y-1.5">
                  {currentOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="font-bold text-gray-700 dark:text-gray-300">{item.quantity}x {item.name} <span className="text-gray-400 font-normal">({item.variationLabel})</span></span>
                      <span className="font-black text-gray-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total a Cobrar</span>
                  <span className="text-2xl font-black text-gray-900 dark:text-white">${currentOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment section */}
              <div className="p-5 bg-teal-50 dark:bg-teal-900/10 rounded-2xl border border-teal-100 dark:border-teal-900/30 space-y-4">
                <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest">
                  Pago: {currentOrder.paymentMethod === 'efectivo' ? 'Efectivo' : currentOrder.paymentMethod === 'tarjeta' ? 'Tarjeta' : 'Transferencia'}
                </p>

                {currentOrder.paymentMethod === 'efectivo' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                      <input type="number" value={cashReceived} onChange={e => { setCashReceived(e.target.value); setPayError(null); }}
                        placeholder="Monto recibido" className="w-full pl-9 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl font-black outline-none focus:border-teal-500 transition-colors dark:text-white" />
                    </div>
                    {parseFloat(cashReceived) >= currentOrder.total && parseFloat(cashReceived) > 0 && (
                      <div className="flex justify-between items-center px-4 py-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Cambio</span>
                        <span className="text-lg font-black text-emerald-600">${(parseFloat(cashReceived) - currentOrder.total).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {currentOrder.paymentMethod === 'tarjeta' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[8px] font-black text-blue-600 uppercase tracking-widest">No. Ticket</label>
                      <input type="text" value={ticketNum} onChange={e => { setTicketNum(e.target.value); setPayError(null); }}
                        placeholder="TK-000" className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-xs font-black uppercase outline-none focus:border-teal-500 dark:text-white" />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-blue-600 uppercase tracking-widest">No. Operación</label>
                      <input type="text" value={opNum} onChange={e => { setOpNum(e.target.value); setPayError(null); }}
                        placeholder="OP-000" className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-xs font-black uppercase outline-none focus:border-teal-500 dark:text-white" />
                    </div>
                  </div>
                )}

                {currentOrder.paymentMethod === 'transferencia' && (
                  <div>
                    <label className="text-[8px] font-black text-purple-600 uppercase tracking-widest">No. Referencia</label>
                    <input type="text" value={opNum} onChange={e => { setOpNum(e.target.value); setPayError(null); }}
                      placeholder="Ref: 00000" className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-xs font-black uppercase outline-none focus:border-teal-500 dark:text-white" />
                  </div>
                )}

                {payError && (
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {payError}
                  </p>
                )}
              </div>

              <button
                onClick={handleConfirmDelivery}
                disabled={!isPaymentValid()}
                className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 ${isPaymentValid() ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 hover:bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}
              >
                <CheckCircle className="w-5 h-5" />
                Confirmar Entrega y Cobro
              </button>
            </div>
          </div>
        ) : (
          // No active delivery
          <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-xl border border-gray-100 dark:border-gray-700 p-8 flex flex-col items-center text-center gap-6">
            <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center shadow-inner ${driver.status === 'offline' ? 'bg-gray-100 dark:bg-gray-900' : 'bg-teal-50 dark:bg-teal-900/20'}`}>
              {driver.status === 'offline'
                ? <Moon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                : <PackageCheck className="w-12 h-12 text-teal-300" />}
            </div>
            <div>
              <p className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">
                {driver.status === 'offline' ? 'FUERA DE TURNO' : 'EN ESPERA'}
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {driver.status === 'offline'
                  ? 'Entra a turno para recibir pedidos'
                  : 'Administración te asignará el siguiente pedido'}
              </p>
            </div>

            <button
              onClick={toggleStatus}
              disabled={driver.status === 'busy'}
              className={`px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.15em] transition-all active:scale-95 shadow-xl ${driver.status === 'offline' ? 'bg-teal-500 text-white shadow-teal-500/30 hover:bg-teal-600' : 'bg-gray-900 dark:bg-gray-700 text-white shadow-gray-900/20 hover:bg-black'}`}
            >
              {driver.status === 'offline' ? '▶ Entrar a Turno' : '■ Cerrar Turno'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
