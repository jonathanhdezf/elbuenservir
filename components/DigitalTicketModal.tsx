import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  CheckCircle2, 
  ShoppingBag, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  Clock, 
  Copy, 
  Check, 
  Sparkles, 
  AlertCircle, 
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Order } from '../types';
import { supabase } from '../utils/supabaseClient';
import { mapOrderFromDb } from '../services/databaseService';

interface DigitalTicketModalProps {
  isOpen: boolean;
  order: Order | null;
  orderId?: string | null;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const DigitalTicketModal: React.FC<DigitalTicketModalProps> = ({
  isOpen,
  order: initialOrder,
  orderId,
  onClose,
  isDarkMode = false,
}) => {
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  // If initialOrder is passed or changes
  useEffect(() => {
    if (initialOrder) {
      setOrder(initialOrder);
      setFetchError(null);
      return;
    }

    // If orderId is provided but no order object, fetch from Supabase
    if (orderId && isOpen) {
      setIsLoading(true);
      setFetchError(null);
      supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle()
        .then(({ data, error }) => {
          setIsLoading(false);
          if (error || !data) {
            setFetchError('No encontramos el pedido solicitado o ya no está disponible.');
          } else {
            setOrder(mapOrderFromDb(data));
          }
        })
        .catch(err => {
          setIsLoading(false);
          setFetchError('Error de conexión al cargar el ticket digital.');
        });
    }
  }, [initialOrder, orderId, isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const ticketUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?ticket=${order?.id || orderId}`
    : `https://elbuenservir.vercel.app/?ticket=${order?.id || orderId}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ticketUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    if (!order) return;
    const msg = `🧾 *Ticket Digital de Pedido - El Buen Servir*\n\nFolio: *${order.id}*\nTotal: *$${order.total.toFixed(2)}*\n\nPuedes consultar el detalle de tu ticket aquí:\n${ticketUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const formattedDate = order?.paidAt || order?.createdAt
    ? new Date(order.paidAt || order.createdAt).toLocaleDateString('es-MX', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/75 backdrop-blur-md animate-in fade-in duration-300 print:p-0 print:bg-white print:static">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:w-full print:max-w-none print:rounded-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Top App Bar (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-700 dark:text-gray-200">
              Comprobante Digital
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Imprimir o Guardar PDF"
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={onClose}
              title="Cerrar"
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 max-h-[82vh] overflow-y-auto custom-scrollbar space-y-5 print:max-h-none print:overflow-visible print:p-0">
          {isLoading && (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                Cargando ticket digital...
              </p>
            </div>
          )}

          {fetchError && !isLoading && (
            <div className="py-14 px-6 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-black text-gray-900 dark:text-white uppercase text-base">
                  Ticket no encontrado
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                  {fetchError}
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest transition-transform active:scale-95"
              >
                Volver al Menú
              </button>
            </div>
          )}

          {order && !isLoading && (
            <>
              {/* Status Header Badge */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                      {order.status === 'delivered' ? 'Pedido Entregado' : order.status === 'delivery' ? 'En Camino / Reparto' : 'En Proceso'}
                    </p>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                      {order.paymentStatus === 'paid' ? 'Pago Completado y Confirmado' : 'Pago Pendiente'}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider rounded-lg shadow-sm">
                  {order.id}
                </span>
              </div>

              {/* Physical Receipt Simulation Card */}
              <div 
                ref={ticketRef}
                className="relative bg-white text-gray-900 rounded-2xl p-6 sm:p-7 shadow-lg border border-gray-200 print:border-none print:shadow-none font-mono text-xs leading-relaxed"
                style={{
                  backgroundImage: 'radial-gradient(circle at 50% 0, rgba(0,0,0,0.02) 0%, transparent 75%)'
                }}
              >
                {/* Brand Header */}
                <div className="text-center pb-5 border-b-2 border-dashed border-gray-300">
                  <img 
                    src="/logo.png" 
                    alt="El Buen Servir" 
                    className="w-16 h-16 mx-auto mb-2 object-contain"
                    onError={(e) => {
                      // Fallback if logo not found
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                    EL BUEN SERVIR
                  </h2>
                  <p className="text-[11px] font-sans font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                    Comida Casera y Tradicional
                  </p>
                  <p className="text-[10px] font-sans text-gray-500 mt-1">
                    Mercado Filomeno Mata #67 • Teziutlán, Puebla
                  </p>
                  <p className="text-[10px] font-sans text-gray-500">
                    Tel / WhatsApp: +52 231 180 8272
                  </p>
                </div>

                {/* Ticket Metadata */}
                <div className="py-4 border-b-2 border-dashed border-gray-300 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-bold uppercase">Folio:</span>
                    <span className="font-black text-gray-900 uppercase">{order.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-bold uppercase">Fecha:</span>
                    <span className="font-semibold text-gray-800">{formattedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-bold uppercase">Cliente:</span>
                    <span className="font-black text-gray-900 uppercase truncate max-w-[200px]">{order.customerName}</span>
                  </div>
                  {order.customerPhone && order.customerPhone !== 'N/A' && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold uppercase">Tel:</span>
                      <span className="font-semibold text-gray-800">{order.customerPhone}</span>
                    </div>
                  )}
                  {order.address && (
                    <div className="flex justify-between items-start pt-1">
                      <span className="text-gray-500 font-bold uppercase shrink-0 mr-2">Entrega:</span>
                      <span className="font-semibold text-right text-gray-800 break-words">{order.address}</span>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div className="py-4 border-b-2 border-dashed border-gray-300">
                  <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 pb-2 border-b border-gray-200">
                    <span className="w-12">Cant</span>
                    <span className="flex-1 text-left">Platillo</span>
                    <span className="w-16 text-right">Importe</span>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex justify-between items-start text-[11px]">
                        <span className="w-12 font-black text-gray-700">{item.quantity}x</span>
                        <div className="flex-1 text-left pr-2">
                          <p className="font-bold text-gray-900 leading-snug">{item.name}</p>
                          {item.variationLabel && (
                            <p className="text-[10px] text-gray-500 font-sans italic">
                              ({item.variationLabel})
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400 font-sans">
                            ${item.price.toFixed(2)} c/u
                          </p>
                        </div>
                        <span className="w-16 text-right font-black text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotals & Final Total */}
                <div className="py-4 border-b-2 border-dashed border-gray-300 space-y-1.5 text-xs">
                  {order.deliveryFee && order.deliveryFee > 0 ? (
                    <>
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal Alimentos:</span>
                        <span>${(order.total - order.deliveryFee).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Costo de Envío:</span>
                        <span>${order.deliveryFee.toFixed(2)}</span>
                      </div>
                    </>
                  ) : null}

                  <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
                    <span className="text-sm font-black uppercase tracking-wider text-gray-900">
                      TOTAL:
                    </span>
                    <span className="text-2xl font-black text-gray-900 tracking-tight">
                      ${order.total.toFixed(2)} MXN
                    </span>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="py-4 border-b-2 border-dashed border-gray-300 text-[11px] space-y-1 bg-gray-50 -mx-6 sm:-mx-7 px-6 sm:px-7">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-bold uppercase">Forma de Pago:</span>
                    <span className="font-black text-gray-900 uppercase">
                      {order.paymentMethod ? order.paymentMethod.toUpperCase() : 'EFECTIVO'}
                    </span>
                  </div>

                  {order.paymentMethod === 'efectivo' && order.cashReceived != null && order.cashReceived > 0 && (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>Efectivo Recibido:</span>
                        <span>${order.cashReceived.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Cambio Devuelto:</span>
                        <span>${(order.change || 0).toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {order.ticketNumber && (
                    <div className="flex justify-between text-gray-600">
                      <span>No. Ticket Físico:</span>
                      <span className="font-bold text-gray-800">{order.ticketNumber}</span>
                    </div>
                  )}

                  {order.operationNumber && (
                    <div className="flex justify-between text-gray-600">
                      <span>Ref / Autorización:</span>
                      <span className="font-bold text-gray-800">{order.operationNumber}</span>
                    </div>
                  )}
                </div>

                {/* QR Code & Appreciation Footer */}
                <div className="pt-6 text-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(ticketUrl)}`}
                    alt="QR Ticket"
                    className="w-28 h-28 mx-auto mb-3 p-1.5 bg-white border border-gray-200 rounded-xl"
                  />
                  <p className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest">
                    Escanea para validar ticket
                  </p>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-black uppercase tracking-wider text-gray-900 font-sans">
                      ¡GRACIAS POR TU PREFERENCIA! 🍽️
                    </p>
                    <p className="text-[10px] font-sans text-gray-500 mt-1">
                      El Buen Servir • Sabor Casero que te Acompaña
                    </p>
                    <p className="text-[9px] font-sans text-gray-400 mt-0.5">
                      elbuenservir.vercel.app
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Hidden on Print) */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2 print:hidden">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex-1 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir en WhatsApp
                </button>

                <button
                  onClick={handleCopyLink}
                  className="py-3.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      ¡Enlace Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar Enlace
                    </>
                  )}
                </button>
              </div>

              <div className="text-center print:hidden">
                <button
                  onClick={onClose}
                  className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 py-1 transition-colors"
                >
                  ← Volver a explorar el Menú
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
