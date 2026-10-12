import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X, Mic, MicOff, ShoppingCart, Send, Trash2, Loader2, Zap,
  Volume2, VolumeX, ChevronRight, MessageCircle, Phone, Lock,
  Check, Store, Truck, Sparkles, Key, Plus, Minus, CreditCard,
  Banknote, RefreshCw, ChevronUp, ChevronDown, Utensils, Award,
  Clock, ArrowRight, Keyboard, History, AlertCircle, PhoneCall, PhoneOff
} from 'lucide-react';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';
import { MenuItem, Category, Order, Customer, PaymentMethod, CustomerCreditMovement } from '../types';
import { soundManager } from '../utils/soundManager';

export interface SofiaCartItem {
  id: string;
  dishId?: string;
  name: string;
  variation: string;
  price: number;
  quantity: number;
  image?: string;
  notes?: string;
}

interface LiveOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  categories: Category[];
  onAddOrder?: (order: Order) => void;
  loggedCustomer: Customer | null;
  onOpenAuth: () => void;
  onTransferToCart?: (items: { dishId: string; name: string; variationLabel: string; price: number; quantity: number; comments?: string }[]) => void;
  onUpdateCustomer?: (customer: Customer) => void;
}

type SessionStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'thinking' | 'error';

const RESTAURANT_PHONE = '2311024672';
const WHATSAPP_NUMBER = '522311024672';
const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';
const LIVE_VOICE = 'Aoede'; // Prebuilt natural neural voice for Sofia
const SAMPLE_RATE = 24000;

// Visual image mapping for featured dishes
const getDishImage = (name: string): string | null => {
  const n = name.toLowerCase();
  const baseUrl = (import.meta as any).env.BASE_URL || '/';
  if (n.includes('chilaquiles verdes')) return `${baseUrl}chilaquiles_verdes.png`;
  if (n.includes('chilaquiles')) return `${baseUrl}chilaquiles_especiales.png`;
  if (n.includes('tampiqueña') || n.includes('tampiquena')) return `${baseUrl}dish_tampiquena.png`;
  if (n.includes('chilpozo') || n.includes('pancita') || n.includes('pozole')) return `${baseUrl}pozole_tradicional.png`;
  return null;
};

// PCM & Resampling Utilities for 24kHz Bidirectional Audio
function downsampleTo24kHz(input: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === 24000) return input;
  const ratio = inputSampleRate / 24000;
  const newLength = Math.round(input.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const origIndex = Math.min(Math.round(i * ratio), input.length - 1);
    result[i] = input[origIndex];
  }
  return result;
}

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output;
}

function base64FromPCM16(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Gemini Function Calling Declarations
const updateOrderTool = {
  name: "updateOrder",
  description: "Agrega, actualiza la cantidad o elimina platillos del ticket vivo del pedido.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: ["add", "remove", "update"],
        description: "Acción a realizar: add para agregar, remove para quitar, update para cambiar."
      },
      item: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Nombre del platillo del menú (ej. Chilaquiles, Chilpozo de res, Enchiladas suizas, Jugo de naranja)" },
          variation: { type: Type.STRING, description: "Variación o tamaño (ej. Chicos, Grandes, Con asada de pollo, Platillo, Medio litro)" },
          price: { type: Type.NUMBER, description: "Precio unitario" },
          quantity: { type: Type.NUMBER, description: "Cantidad de porciones" },
          notes: { type: Type.STRING, description: "Acompañamientos o especificaciones especiales del platillo (ej. Sin cebolla, sin rábanos, sin aguacate, orégano aparte)" }
        },
        required: ["name", "variation"]
      }
    },
    required: ["action", "item"]
  }
};

const completeOrderTool = {
  name: "completeOrder",
  description: "Finaliza, registra y genera el pedido del cliente en el sistema cuando ya se tienen los platillos, el método de entrega (mostrador o domicilio) y la forma de pago.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderType: { type: Type.STRING, enum: ["pickup", "delivery"], description: "Entrega: mostrador (pickup) o domicilio (delivery)" },
      deliveryAddress: { type: Type.STRING, description: "Dirección de entrega a domicilio (si aplica)" },
      paymentMethod: { type: Type.STRING, enum: ["efectivo", "tarjeta", "transferencia", "credito"], description: "Forma de pago elegida por el cliente" },
      cashAmount: { type: Type.NUMBER, description: "Monto en efectivo con el que paga el cliente (opcional)" },
      customerName: { type: Type.STRING, description: "Nombre del cliente (opcional)" },
      customerPhone: { type: Type.STRING, description: "Teléfono del cliente (opcional)" },
      summary: { type: Type.STRING, description: "Resumen breve del pedido" },
      items: {
        type: Type.ARRAY,
        description: "Lista de todos los platillos ordenados por el cliente para respaldar el ticket final.",
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Nombre del platillo" },
            variation: { type: Type.STRING, description: "Variación o tamaño" },
            price: { type: Type.NUMBER, description: "Precio unitario" },
            quantity: { type: Type.NUMBER, description: "Cantidad" },
            notes: { type: Type.STRING, description: "Acompañamientos o especificaciones especiales del platillo (ej. Sin cebolla, sin rábanos, sin aguacate)" }
          },
          required: ["name"]
        }
      }
    },
    required: ["orderType"]
  }
};

function buildMenuContext(menuItems: MenuItem[], categories: Category[]): string {
  const lines: string[] = [
    "RESTAURANTE: El Buen Servir - Desayunos tradicionales, caldos y guisados caseros en Teziutlán, Puebla.",
    "TELÉFONO: 2311024672.",
    "CATÁLOGO DE PLATILLOS Y PRECIOS:"
  ];

  categories.forEach(cat => {
    const items = menuItems.filter(i => i.isActive && i.categoryId === cat.id);
    if (items.length === 0) return;
    lines.push(`\n[${cat.name.toUpperCase()}]:`);
    items.forEach(item => {
      const vars = item.variations.map(v => `${v.label}: $${v.price}`).join(' | ');
      const flags: string[] = [];
      if (item.allowAccompaniments === false) flags.push('sin notas/acompañamientos');
      if (item.allowSides === false) flags.push('sin guarnición');
      const flagText = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
      lines.push(`• ${item.name} (${vars})${flagText}`);
    });
  });

  lines.push("\nESPECIALIDADES DESTACADAS:");
  lines.push("1. Chilaquiles verdes o rojos (chico $60, grande $90, con asada de pollo $120, con asada de puerco $130).");
  lines.push("2. Enchiladas Suizas gratinadas ($90).");
  lines.push("3. Chilpozo de Res tradicional ($95).");
  lines.push("4. Pancita de Res (medio $80, litro $100).");
  lines.push("5. Tampiqueñas (pollo $130, puerco $140, res $160).");
  lines.push("6. Fresas con crema especiales (chico $40, grande $80).");
  lines.push("7. Jugo de naranja natural recién exprimido (medio $30, litro $60).");

  return lines.join("\n");
}

export default function LiveOrderModal({
  isOpen,
  onClose,
  menuItems,
  categories,
  onAddOrder,
  loggedCustomer,
  onOpenAuth,
  onTransferToCart,
  onUpdateCustomer
}: LiveOrderModalProps) {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [cart, setCart] = useState<SofiaCartItem[]>([]);
  const [currentSofiaSpeech, setCurrentSofiaSpeech] = useState<string>('');
  const [lastUserSpeech, setLastUserSpeech] = useState<string>('');
  const [transcriptHistory, setTranscriptHistory] = useState<{ role: 'ai' | 'user'; text: string; time: string }[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isOrderTrayExpanded, setIsOrderTrayExpanded] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery' | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [newAddressInput, setNewAddressInput] = useState('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [cashAmountPaid, setCashAmountPaid] = useState<string>('');
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');

  // Live session & audio references
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isMutedRef = useRef(isMuted);
  const isSpeakerMutedRef = useRef(isSpeakerMuted);
  const isConnectingRef = useRef(false);

  // Live state refs to avoid stale closures inside WebSocket callbacks
  const cartRef = useRef<SofiaCartItem[]>([]);
  const deliveryMethodRef = useRef<'pickup' | 'delivery' | null>(null);
  const selectedAddressRef = useRef<string>('');
  const newAddressInputRef = useRef<string>('');
  const selectedPaymentMethodRef = useRef<PaymentMethod>('efectivo');
  const cashAmountPaidRef = useRef<string>('');
  const loggedCustomerRef = useRef<Customer | null>(loggedCustomer);
  const onAddOrderRef = useRef(onAddOrder);
  const onUpdateCustomerRef = useRef(onUpdateCustomer);
  const createdOrderRef = useRef<Order | null>(null);
  const pendingAutoWhatsAppUrlRef = useRef<string | null>(null);
  const autoSendTimerRef = useRef<any>(null);
  const handleToolCallsRef = useRef<(calls: any[]) => void>(() => {});

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isSpeakerMutedRef.current = isSpeakerMuted;
  }, [isSpeakerMuted]);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    deliveryMethodRef.current = deliveryMethod;
  }, [deliveryMethod]);

  useEffect(() => {
    selectedAddressRef.current = selectedAddress;
  }, [selectedAddress]);

  useEffect(() => {
    newAddressInputRef.current = newAddressInput;
  }, [newAddressInput]);

  useEffect(() => {
    selectedPaymentMethodRef.current = selectedPaymentMethod;
  }, [selectedPaymentMethod]);

  useEffect(() => {
    cashAmountPaidRef.current = cashAmountPaid;
  }, [cashAmountPaid]);

  useEffect(() => {
    loggedCustomerRef.current = loggedCustomer;
    if (loggedCustomer && loggedCustomer.addresses && loggedCustomer.addresses.length > 0 && !selectedAddressRef.current) {
      setSelectedAddress(loggedCustomer.addresses[0]);
      selectedAddressRef.current = loggedCustomer.addresses[0];
    }
  }, [loggedCustomer]);

  useEffect(() => {
    onAddOrderRef.current = onAddOrder;
  }, [onAddOrder]);

  useEffect(() => {
    onUpdateCustomerRef.current = onUpdateCustomer;
  }, [onUpdateCustomer]);

  // Resolved Gemini API key
  const resolvedApiKey = useMemo(() => {
    return (
      customApiKey.trim() ||
      import.meta.env.VITE_GEMINI_API_KEY ||
      (process.env as any).GEMINI_API_KEY ||
      (process.env as any).API_KEY ||
      ''
    );
  }, [customApiKey]);

  const hasApiKey = Boolean(resolvedApiKey);

  // Cart totals
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const cartItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Match dish against catalog for accurate dishId, variation label, and price
  const resolveDishFromCatalog = useCallback((rawItem: { name: string; variation?: string; price?: number; quantity?: number; dishId?: string; notes?: string }) => {
    const itemName = (rawItem.name || '').trim();
    const itemVar = (rawItem.variation || 'Platillo').trim();
    const quantity = rawItem.quantity && rawItem.quantity > 0 ? rawItem.quantity : 1;
    let finalPrice = rawItem.price || 0;
    let dishId = rawItem.dishId;
    let resolvedName = itemName;
    let resolvedVar = itemVar;

    const catalogMatch = menuItems.find(mi =>
      mi.name.toLowerCase().includes(itemName.toLowerCase()) ||
      itemName.toLowerCase().includes(mi.name.toLowerCase())
    );

    if (catalogMatch) {
      dishId = catalogMatch.id;
      resolvedName = catalogMatch.name;
      const varMatch = catalogMatch.variations.find(v =>
        v.label.toLowerCase().includes(itemVar.toLowerCase()) ||
        itemVar.toLowerCase().includes(v.label.toLowerCase())
      ) || catalogMatch.variations[0];

      if (varMatch) {
        resolvedVar = varMatch.label;
        if (!finalPrice || finalPrice <= 0) {
          finalPrice = varMatch.price;
        }
      }
    }

    return {
      name: resolvedName,
      variation: resolvedVar,
      price: finalPrice,
      quantity,
      dishId,
      notes: rawItem.notes ? rawItem.notes.trim() : undefined
    };
  }, [menuItems]);

  // Cart item modifier (synchronously updates cartRef.current + React state)
  const updateCartItem = useCallback((action: 'add' | 'remove' | 'update', item: { name: string; variation: string; price: number; quantity?: number; dishId?: string; notes?: string }) => {
    const resolved = resolveDishFromCatalog(item);
    const itemName = resolved.name;
    const itemVar = resolved.variation;
    const qty = resolved.quantity;
    const notes = resolved.notes;
    const dishImg = getDishImage(itemName);

    const prev = cartRef.current;
    const matchIndex = prev.findIndex(i =>
      i.name.toLowerCase() === itemName.toLowerCase() &&
      i.variation.toLowerCase() === itemVar.toLowerCase() &&
      (i.notes || '') === (notes || '')
    );

    let nextCart = prev;

    if (action === 'add') {
      if (matchIndex > -1) {
        const target = prev[matchIndex];
        const updatedItem: SofiaCartItem = {
          ...target,
          quantity: target.quantity + qty,
          price: resolved.price || target.price,
          dishId: resolved.dishId || target.dishId,
          notes: notes || target.notes
        };
        nextCart = prev.map((it, idx) => idx === matchIndex ? updatedItem : it);
        setLastAddedId(target.id);
      } else {
        const newId = `sofia-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setLastAddedId(newId);
        nextCart = [...prev, {
          id: newId,
          dishId: resolved.dishId,
          name: itemName,
          variation: itemVar,
          price: resolved.price,
          quantity: qty,
          image: dishImg || undefined,
          notes: notes
        }];
      }
    } else if (action === 'update') {
      if (matchIndex > -1) {
        const target = prev[matchIndex];
        nextCart = prev.map((it, idx) => idx === matchIndex ? {
          ...target,
          quantity: qty,
          price: resolved.price || target.price,
          notes: notes !== undefined ? notes : target.notes
        } : it);
        setLastAddedId(target.id);
      }
    } else if (action === 'remove') {
      setLastAddedId(null);
      if (matchIndex > -1) {
        nextCart = prev.filter((_, idx) => idx !== matchIndex);
      }
    }

    cartRef.current = nextCart;
    setCart(nextCart);

    try { soundManager.play('confirm_generic'); } catch (e) { }
    setTimeout(() => setLastAddedId(null), 2000);
  }, [resolveDishFromCatalog]);

  // Build WhatsApp URL and register order in the database (idempotent per order session)
  const generateAndSaveOrder = useCallback((overrides?: {
    deliveryMethod?: 'pickup' | 'delivery';
    address?: string;
    paymentMethod?: PaymentMethod;
    cashAmount?: string;
    customerName?: string;
    customerPhone?: string;
    items?: SofiaCartItem[];
  }): { order: Order; waUrl: string } | null => {
    const itemsToUse = overrides?.items && overrides.items.length > 0 ? overrides.items : cartRef.current;
    if (itemsToUse.length === 0) return null;

    const total = itemsToUse.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const activeCustomer = loggedCustomerRef.current;
    const customerName = overrides?.customerName || activeCustomer?.name || 'Cliente de Sofía IA';
    const customerPhone = overrides?.customerPhone || activeCustomer?.phone || 'Sin registrar';
    const method = overrides?.deliveryMethod || deliveryMethodRef.current || 'pickup';
    const rawAddr = overrides?.address || selectedAddressRef.current || newAddressInputRef.current.trim() || activeCustomer?.addresses?.[0] || '';
    const finalAddress = method === 'pickup' ? 'Recoger en mostrador' : (rawAddr || 'Domicilio acordado');
    const payMethod: PaymentMethod = overrides?.paymentMethod || selectedPaymentMethodRef.current || 'efectivo';
    const cashStr = overrides?.cashAmount !== undefined ? overrides.cashAmount : cashAmountPaidRef.current;
    const parsedCash = parseFloat(cashStr);

    const existingOrder = createdOrderRef.current;
    const orderId = existingOrder?.id || `SOFIA-${Math.random().toString(36).substr(2, 6).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

    let deliveryText = '';
    if (method === 'pickup') {
      deliveryText = '🏪 *Entrega:* Recoger en Mostrador';
    } else {
      deliveryText = `🏠 *Entrega a Domicilio:* ${finalAddress}`;
    }

    let paymentText = '';
    if (payMethod === 'efectivo') {
      const change = !isNaN(parsedCash) && parsedCash >= total ? (parsedCash - total) : 0;
      paymentText = `💵 *Pago:* Efectivo` + (!isNaN(parsedCash) && parsedCash >= total ? ` (Paga con: $${parsedCash.toFixed(2)}, Cambio: $${change.toFixed(2)})` : ` (Pago exacto)`);
    } else if (payMethod === 'tarjeta') {
      paymentText = `💳 *Pago:* Tarjeta (Llevar terminal bancaria al entregar)`;
    } else if (payMethod === 'transferencia') {
      paymentText = `🏦 *Pago:* Transferencia Bancaria`;
    } else if (payMethod === 'credito') {
      paymentText = `🏷️ *Pago:* Crédito de Tienda (Cuenta de Cliente)`;
    }

    const itemsText = itemsToUse.map(i => {
      const notesText = i.notes ? `\n   ↳ 📝 Prep / Acompañamiento: ${i.notes}` : '';
      return `• ${i.quantity}x ${i.name} (${i.variation}) - $${(i.price * i.quantity).toFixed(2)}${notesText}`;
    }).join('\n');

    const msg =
      `*🎙️ PEDIDO ASISTIDO POR SOFÍA IA - EL BUEN SERVIR*\n\n` +
      `🆔 *Orden:* #${orderId}\n` +
      `👤 *Cliente:* ${customerName}\n` +
      `📱 *Teléfono:* ${customerPhone}\n` +
      `${deliveryText}\n` +
      `${paymentText}\n\n` +
      `*DETALLE DEL PEDIDO:*\n` +
      `${itemsText}\n\n` +
      `💰 *TOTAL A PAGAR: $${total.toFixed(2)}*\n\n` +
      `✨ _Pedido generado por la Asistente Virtual Sofía_`;

    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

    const newOrder: Order = {
      id: orderId,
      customerName,
      customerPhone,
      address: finalAddress,
      items: itemsToUse.map(i => ({
        id: i.dishId || i.id,
        name: i.name,
        variationLabel: i.variation + (i.notes ? ` [${i.notes}]` : ''),
        price: i.price,
        quantity: i.quantity,
        notes: i.notes || undefined
      })),
      total,
      status: 'pending',
      paymentMethod: payMethod,
      paymentStatus: 'pending',
      cashReceived: payMethod === 'efectivo' && !isNaN(parsedCash) && parsedCash >= total ? parsedCash : undefined,
      change: payMethod === 'efectivo' && !isNaN(parsedCash) && parsedCash >= total ? (parsedCash - total) : undefined,
      createdAt: existingOrder?.createdAt || new Date().toISOString(),
      source: 'online',
      notes: 'Pedido asistido por Sofía IA'
    };

    // Only insert into DB/state and charge credit once per order
    if (!existingOrder) {
      if (payMethod === 'credito' && activeCustomer && onUpdateCustomerRef.current) {
        const currentBal = Number(activeCustomer.creditBalance || 0);
        const newBal = currentBal + total;
        const creditMovement: CustomerCreditMovement = {
          id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          orderId,
          type: 'cargo',
          amount: total,
          balanceAfter: newBal,
          date: new Date().toISOString(),
          notes: `Cargo por pedido asistido con Sofía IA #${orderId}`,
          registeredBy: 'Sofía IA'
        };

        onUpdateCustomerRef.current({
          ...activeCustomer,
          creditBalance: newBal,
          creditHistory: [creditMovement, ...(activeCustomer.creditHistory || [])]
        });
      }

      if (onAddOrderRef.current) {
        onAddOrderRef.current(newOrder);
      }

      try { soundManager.play('confirm_tpv'); } catch (e) { }
    } else if (onAddOrderRef.current && JSON.stringify(existingOrder) !== JSON.stringify(newOrder)) {
      // Update order if user tweaked delivery/payment after auto-creation
      onAddOrderRef.current(newOrder);
    }

    createdOrderRef.current = newOrder;
    setCreatedOrder(newOrder);
    return { order: newOrder, waUrl };
  }, []);

  // Audio Playback Engine
  const playAudioChunk = useCallback((base64Data: string) => {
    if (!audioContextRef.current || isSpeakerMutedRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const pcm16 = new Int16Array(len / 2);
      for (let i = 0; i < pcm16.length; i++) {
        pcm16[i] = binaryString.charCodeAt(i * 2) | (binaryString.charCodeAt(i * 2 + 1) << 8);
      }

      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      // 24kHz buffer is played and smoothly resampled by browser's audio context
      const buffer = ctx.createBuffer(1, float32.length, SAMPLE_RATE);
      buffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += buffer.duration;
      activeSourcesRef.current.push(source);
      setStatus('speaking');

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
        if (activeSourcesRef.current.length === 0) {
          setStatus('listening');
          // If an order was finalized and is waiting for farewell audio to finish, open WhatsApp now
          if (pendingAutoWhatsAppUrlRef.current) {
            const url = pendingAutoWhatsAppUrlRef.current;
            pendingAutoWhatsAppUrlRef.current = null;
            if (autoSendTimerRef.current) {
              clearTimeout(autoSendTimerRef.current);
              autoSendTimerRef.current = null;
            }
            setTimeout(() => {
              try { window.open(url, '_blank'); } catch (e) { }
            }, 400);
          }
        }
      };
    } catch (e) {
      console.warn("Error decoding audio chunk", e);
    }
  }, []);

  // Stop queued and playing audio
  const stopAllAudio = useCallback(() => {
    activeSourcesRef.current.forEach(s => {
      try { s.stop(); } catch (e) { }
    });
    activeSourcesRef.current = [];
    if (audioContextRef.current) {
      nextStartTimeRef.current = audioContextRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
    if (status === 'speaking') {
      setStatus('listening');
    }
  }, [status]);

  // Helper to check if current cart has drinks or desserts
  const checkCartExtras = useCallback((itemsToCheck: SofiaCartItem[]) => {
    let hasDrink = false;
    let hasDessert = false;

    for (const ci of itemsToCheck) {
      const n = ci.name.toLowerCase();
      const matchedMenu = menuItems.find(m => m.id === ci.dishId || m.name.toLowerCase() === n);
      const catId = (matchedMenu?.categoryId || '').toLowerCase();

      if (
        catId === 'cat-2' ||
        catId.includes('bebida') ||
        ['jugo', 'ponche', 'coca', 'refresco', 'agua', 'cafe', 'café'].some(k => n.includes(k))
      ) {
        hasDrink = true;
      }

      if (
        catId === 'cat-1' ||
        catId.includes('postre') ||
        ['fresas', 'postre', 'crema'].some(k => n.includes(k))
      ) {
        hasDessert = true;
      }
    }

    return { hasDrink, hasDessert };
  }, [menuItems]);

  const hasOfferedExtrasRef = useRef<boolean>(false);

  // Function Calling Tool Handler
  const handleToolCalls = useCallback((functionCalls: any[]) => {
    const responses: any[] = [];

    for (const call of functionCalls) {
      if (call.name === "updateOrder") {
        const { action, item } = call.args || {};
        if (item && item.name) {
          const resolved = resolveDishFromCatalog({
            name: item.name,
            variation: item.variation,
            price: item.price,
            quantity: item.quantity,
            dishId: item.dishId,
            notes: item.notes
          });

          updateCartItem(action || 'add', resolved);

          if ((action || 'add') === 'add') {
            const notesMsg = resolved.notes ? ` (${resolved.notes})` : '';
            setCurrentSofiaSpeech(`¡Anotado! Agregué ${resolved.quantity}x ${resolved.name} (${resolved.variation})${notesMsg} a tu orden.`);
          } else if (action === 'remove') {
            setCurrentSofiaSpeech(`¡Listo! Quité ${resolved.name} de tu orden.`);
          }
        }

        const { hasDrink, hasDessert } = checkCartExtras(cartRef.current);
        let nextStepGuidance = "Pregúntale si desea algo más o si procedemos con el método de entrega.";
        if (!hasDrink && !hasDessert) {
          nextStepGuidance = "El cliente aún NO lleva bebida ni postre. Sugiérele amablemente acompañar su platillo con una bebida (Jugo de naranja recién exprimido, Ponche de fruta calientito o Coca Cola) o un postre (Fresas con crema especiales de la casa) antes de finalizar la orden.";
        } else if (hasDrink && !hasDessert) {
          nextStepGuidance = "El cliente ya lleva bebida pero aún NO lleva postre. Ofrécele amablemente unas deliciosas Fresas con crema de postre (vaso chico $40 o grande $80) antes de pasar a la entrega.";
        } else if (!hasDrink && hasDessert) {
          nextStepGuidance = "El cliente ya lleva postre pero aún NO lleva bebida. Ofrécele amablemente una bebida para acompañar (Jugo de naranja natural, Ponche de fruta o Coca Cola) antes de pasar a la entrega.";
        }

        responses.push({
          id: call.id,
          name: "updateOrder",
          response: {
            output: {
              success: true,
              hasDrink,
              hasDessert,
              message: `Ticket actualizado correctamente con ${item?.name || 'platillo'}.`,
              sugerenciaParaSofia: nextStepGuidance
            }
          }
        });
      } else if (call.name === "completeOrder") {
        const { orderType, deliveryAddress, paymentMethod, cashAmount, customerName, customerPhone, items } = call.args || {};

        // If Gemini passed items in completeOrder that weren't in the cart yet, add them so cart is never empty
        if (Array.isArray(items) && items.length > 0) {
          for (const rawIt of items) {
            if (!rawIt?.name) continue;
            const resolved = resolveDishFromCatalog({
              name: rawIt.name,
              variation: rawIt.variation,
              price: rawIt.price,
              quantity: rawIt.quantity,
              notes: rawIt.notes
            });
            const alreadyInCart = cartRef.current.some(
              c => c.name.toLowerCase() === resolved.name.toLowerCase() &&
                   c.variation.toLowerCase() === resolved.variation.toLowerCase() &&
                   (c.notes || '') === (resolved.notes || '')
            );
            if (!alreadyInCart) {
              updateCartItem('add', resolved);
            }
          }
        }

        const resolvedDelivery: 'pickup' | 'delivery' = orderType === 'delivery' ? 'delivery' : (orderType === 'pickup' ? 'pickup' : (deliveryMethodRef.current || 'pickup'));
        setDeliveryMethod(resolvedDelivery);
        deliveryMethodRef.current = resolvedDelivery;

        const resolvedAddr = deliveryAddress
          ? String(deliveryAddress).trim()
          : (selectedAddressRef.current || loggedCustomerRef.current?.addresses?.[0] || '');
        if (resolvedAddr) {
          setSelectedAddress(resolvedAddr);
          selectedAddressRef.current = resolvedAddr;
        }

        const validMethods: PaymentMethod[] = ['efectivo', 'tarjeta', 'transferencia', 'credito'];
        const resolvedPayment: PaymentMethod = validMethods.includes(paymentMethod as PaymentMethod)
          ? (paymentMethod as PaymentMethod)
          : (selectedPaymentMethodRef.current || 'efectivo');
        setSelectedPaymentMethod(resolvedPayment);
        selectedPaymentMethodRef.current = resolvedPayment;

        if (cashAmount && Number(cashAmount) > 0) {
          const cashStr = String(cashAmount);
          setCashAmountPaid(cashStr);
          cashAmountPaidRef.current = cashStr;
        }

        setIsOrderTrayExpanded(true);

        // Immediately generate & save the order in the restaurant system!
        const result = generateAndSaveOrder({
          deliveryMethod: resolvedDelivery,
          address: resolvedAddr,
          paymentMethod: resolvedPayment,
          cashAmount: cashAmount ? String(cashAmount) : cashAmountPaidRef.current,
          customerName,
          customerPhone
        });

        if (result) {
          setCurrentSofiaSpeech(`¡Pedido #${result.order.id} generado con éxito! Muchas gracias por tu preferencia en El Buen Servir.`);
          pendingAutoWhatsAppUrlRef.current = result.waUrl;
          if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);
          autoSendTimerRef.current = setTimeout(() => {
            if (pendingAutoWhatsAppUrlRef.current) {
              const url = pendingAutoWhatsAppUrlRef.current;
              pendingAutoWhatsAppUrlRef.current = null;
              try { window.open(url, '_blank'); } catch (e) { }
            }
          }, 5000);
        } else {
          setCurrentSofiaSpeech("¡Excelente! Revisa y confirma los detalles de tu pedido en pantalla.");
        }

        responses.push({
          id: call.id,
          name: "completeOrder",
          response: {
            output: {
              success: true,
              orderId: result?.order.id || null,
              message: "Pedido generado y registrado exitosamente en el sistema de El Buen Servir."
            }
          }
        });
      }
    }

    if (sessionRef.current && responses.length > 0) {
      try {
        sessionRef.current.sendToolResponse({ functionResponses: responses });
      } catch (e) {
        console.warn("Failed to send tool response:", e);
      }
    }
  }, [resolveDishFromCatalog, updateCartItem, generateAndSaveOrder, checkCartExtras]);

  useEffect(() => {
    handleToolCallsRef.current = handleToolCalls;
  }, [handleToolCalls]);

  // Clean disconnect
  const disconnect = useCallback(() => {
    isConnectingRef.current = false;
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
    pendingAutoWhatsAppUrlRef.current = null;
    stopAllAudio();

    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch (e) { }
      processorRef.current = null;
    }
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch (e) { }
      sourceRef.current = null;
    }
    if (mediaStreamRef.current) {
      try { mediaStreamRef.current.getTracks().forEach(t => t.stop()); } catch (e) { }
      mediaStreamRef.current = null;
    }
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) { }
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) { }
      audioContextRef.current = null;
    }

    setStatus('idle');
  }, [stopAllAudio]);

  // Connect to Gemini Multimodal Live API
  const connect = useCallback(async () => {
    if (isConnectingRef.current || sessionRef.current) return;
    isConnectingRef.current = true;
    setConnectionError(null);
    setStatus('connecting');

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        throw new Error("Web Audio API no soportado en este navegador.");
      }

      const audioCtx = new AudioCtx({ sampleRate: SAMPLE_RATE });
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;

      // Microphone stream
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: SAMPLE_RATE,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        mediaStreamRef.current = stream;
        sourceRef.current = audioCtx.createMediaStreamSource(stream);
      } catch (micErr: any) {
        console.warn("Mic access denied or unavailable:", micErr);
        setConnectionError("Micrófono no disponible. Puedes escribir con el teclado.");
      }

      if (!resolvedApiKey) {
        setShowApiKeyModal(true);
        throw new Error("Se requiere una API Key de Gemini.");
      }

      const ai = new GoogleGenAI({ apiKey: resolvedApiKey });
      const menuContext = buildMenuContext(menuItems, categories);
      const customerInfo = loggedCustomer
        ? `Nombre del cliente: ${loggedCustomer.name}, Teléfono: ${loggedCustomer.phone}, Domicilio guardado: ${loggedCustomer.addresses?.[0] || 'Sin domicilio registrado'}.`
        : 'Cliente invitado.';

      const systemInstruction = `Eres "Sofía", la anfitriona y mesera virtual inteligente de "El Buen Servir", restaurante de cocina casera y desayunos en Teziutlán, Puebla.
Hablas con voz cálida, alegre, educada, amena y con la hospitalidad mexicana más distinguida.

CLIENTE:
${customerInfo}

MENÚ DEL RESTAURANTE:
${menuContext}

INSTRUCCIONES CLAVE Y USO OBLIGATORIO DE HERRAMIENTAS:
1. Saluda al cliente cordialmente con entusiasmo (menciona su nombre si está disponible) y pregúntale qué se le antoja degustar hoy de El Buen Servir.
2. REGLA ESTRICTA: Cada vez que el cliente mencione o pida un platillo, bebida o postre, EJECUTA INMEDIATAMENTE la herramienta 'updateOrder' con action='add', el nombre del platillo, su variación y precio del menú. No esperes al final para agregar platillos.
3. Si el cliente pide modificar la cantidad o quitar algo, ejecuta 'updateOrder' con action='update' o 'remove'.
4. PERSONALIZACIÓN Y ACOMPAÑAMIENTOS: Para platillos como el Pozole, la Pancita, Caldos u otros guisados, si el cliente pide que no le pongan ciertos acompañamientos o complementos tradicionales (por ejemplo: "sin cebolla", "sin rábanos", "sin aguacate", "sin orégano", "limón aparte", etc.), guarda SIEMPRE esa especificación en el parámetro 'notes' al llamar a 'updateOrder' y al listar 'items' en 'completeOrder'.
5. Si el cliente pide recomendaciones, sugiere los platillos estrella: Chilaquiles con asada de pollo ($120), Enchiladas Suizas gratinadas ($90), Pozole tradicional o Pancita de res en caldo rojo, o Chilpozo de Res ($95).
6. PASO OBLIGATORIO ANTES DE CERRAR LA ORDEN (OFRECER BEBIDAS Y POSTRES):
   - Después de anotar los platillos fuertes, o cuando el cliente diga "es todo" / "sería todo" y aún NO haya pedido bebidas o postres, SIEMPRE ofrécele amablemente acompañar su orden con una bebida o un postre antes de pasar a la entrega:
   - Bebidas para sugerir: Jugo de naranja 100% natural recién exprimido (medio litro $30 o litro $60), Ponche de fruta calientito (chico $25, medio $30, litro $70) o Coca Cola bien fría ($15 a $30).
   - Postre estrella para sugerir: Fresas con crema especiales de la casa (vaso chico $40 o vaso grande $80).
   - Si el cliente acepta alguna bebida o postre, agrégalo de inmediato con 'updateOrder'. Si dice "no gracias, así está bien", continúa de inmediato al siguiente paso.
7. Una vez ofrecidos las bebidas y postres, pregúntale amablemente si prefiere recoger en mostrador (pickup) o entrega a domicilio (delivery).
8. Si elige entrega a domicilio, sugiere su dirección registrada o pregúntale a qué dirección enviarlo.
9. Pregúntale su método de pago (efectivo, tarjeta, transferencia o credito).
10. REGLA CRÍTICA DE CIERRE: En cuanto tengas el método de entrega (y dirección si es domicilio) y la forma de pago, DEBES EJECUTAR OBLIGATORIAMENTE la herramienta 'completeOrder' incluyendo orderType, deliveryAddress, paymentMethod y la lista completa de 'items' del pedido (con sus 'notes' de preparación si aplican), y despídete amablemente agradeciendo su preferencia en El Buen Servir.
11. Mantén tus intervenciones habladas breves, fluidas y directas (1 a 2 oraciones), para que la conversación sea rápida y amena como una llamada telefónica real.`;

      let sessionInstance: any = null;

      sessionInstance = await ai.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [updateOrderTool, completeOrderTool] }],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: LIVE_VOICE
              }
            }
          },
          systemInstruction
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live session connected!");
            sessionRef.current = sessionInstance;
            isConnectingRef.current = false;
            setStatus('listening');

            const welcomePrompt = loggedCustomer
              ? `¡Hola! Ya entré a la llamada. Salúdame amablemente por mi nombre ${loggedCustomer.name.split(' ')[0]} y pregúntame qué se me antoja ordenar hoy.`
              : '¡Hola! Ya entré a la llamada. Salúdame amablemente y pregúntame qué se me antoja ordenar hoy en El Buen Servir.';

            // Greet customer via Gemini's live neural audio
            setTimeout(() => {
              if (sessionRef.current) {
                try {
                  sessionRef.current.sendClientContent({
                    turns: [{ role: 'user', parts: [{ text: welcomePrompt }] }],
                    turnComplete: true
                  });
                } catch (e) { }
              }
            }, 100);

            // Connect mic streaming
            if (audioContextRef.current && sourceRef.current) {
              const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
              processorRef.current = processor;
              sourceRef.current.connect(processor);
              processor.connect(audioContextRef.current.destination);

              processor.onaudioprocess = (e) => {
                if (isMutedRef.current || !sessionRef.current) return;
                const input = e.inputBuffer.getChannelData(0);
                const downsampled = downsampleTo24kHz(input, audioContextRef.current?.sampleRate || SAMPLE_RATE);
                const pcm16 = floatTo16BitPCM(downsampled);
                const base64 = base64FromPCM16(pcm16);

                try {
                  sessionRef.current.sendRealtimeInput({
                    media: { data: base64, mimeType: "audio/pcm;rate=24000" }
                  });
                } catch (err) {
                  console.warn("sendRealtimeInput error", err);
                }
              };
            }
          },
          onmessage: (msg: LiveServerMessage) => {
            // Audio & text streams from Gemini
            const inlineFunctionCalls: any[] = [];
            if (msg.serverContent?.modelTurn?.parts) {
              msg.serverContent.modelTurn.parts.forEach((part: any) => {
                if (part.inlineData?.data) {
                  playAudioChunk(part.inlineData.data);
                }
                if (part.functionCall) {
                  inlineFunctionCalls.push(part.functionCall);
                }
                if (part.text && !part.text.includes('**Initiating') && !part.text.includes("I've decided to")) {
                  const clean = part.text.trim();
                  if (clean) {
                    setCurrentSofiaSpeech(clean);
                    const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                    setTranscriptHistory(prev => [...prev, { role: 'ai', text: clean, time: now }]);
                  }
                }
              });
            }

            if (msg.serverContent?.interrupted) {
              stopAllAudio();
            }

            if (msg.serverContent?.turnComplete) {
              if (activeSourcesRef.current.length === 0) {
                setStatus('listening');
              }
            }

            // Function calling execution (both top-level toolCall and inline parts)
            const topLevelCalls = msg.toolCall?.functionCalls || [];
            const allCalls = [...topLevelCalls, ...inlineFunctionCalls];
            if (allCalls.length > 0) {
              handleToolCallsRef.current(allCalls);
            }
          },
          onerror: (err: any) => {
            console.error("Gemini Live session error:", err);
            isConnectingRef.current = false;
            setStatus('error');
            setConnectionError("Error en la conexión de audio con Sofía.");
          },
          onclose: (e: any) => {
            console.log("Gemini Live session closed:", e?.reason || '');
            isConnectingRef.current = false;
            setStatus('idle');
          }
        }
      });

      sessionRef.current = sessionInstance;
    } catch (err: any) {
      console.error("Live connection initialization failed:", err);
      isConnectingRef.current = false;
      setStatus('error');
      setConnectionError(err.message || "No se pudo iniciar la sesión de voz con Sofía.");
    }
  }, [hasApiKey, resolvedApiKey, menuItems, categories, loggedCustomer, playAudioChunk, stopAllAudio]);

  // Connect automatically when modal opens, and reset completed state on fresh open
  useEffect(() => {
    if (isOpen) {
      hasOfferedExtrasRef.current = false;
      if (createdOrderRef.current) {
        createdOrderRef.current = null;
        setCreatedOrder(null);
        cartRef.current = [];
        setCart([]);
        setIsOrderTrayExpanded(false);
      }
      const timer = setTimeout(() => {
        connect();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      disconnect();
    }
  }, [isOpen]);

  // Local fallback hospitality engine if live session is unavailable
  const runLocalHospitalityEngine = (userInput: string): string => {
    const input = userInput.toLowerCase().trim();

    if (['no gracias', 'así está bien', 'asi esta bien', 'sin bebida', 'sin postre', 'nada mas', 'nada más'].some(t => input.includes(t))) {
      if (cartRef.current.length > 0) {
        hasOfferedExtrasRef.current = true;
        setIsOrderTrayExpanded(true);
        const count = cartRef.current.reduce((s, i) => s + i.quantity, 0);
        const total = cartRef.current.reduce((s, i) => s + i.price * i.quantity, 0);
        return `¡Excelente! Llevas ${count} ${count === 1 ? 'platillo' : 'platillos'} con un total de $${total.toFixed(2)}. ¿Prefieres pasar a recogerlo en mostrador o te lo enviamos a domicilio?`;
      }
    }

    if (['es todo', 'seria todo', 'sería todo', 'la cuenta', 'ya es todo', 'finalizar', 'pagar', 'confirmar'].some(t => input.includes(t))) {
      if (cartRef.current.length === 0) {
        return "¡Con gusto! Pero aún no tienes platillos en tu orden. ¿Qué te gustaría pedir? Tenemos chilaquiles deliciosos, caldos y guisados caseros.";
      }

      const { hasDrink, hasDessert } = checkCartExtras(cartRef.current);
      if ((!hasDrink || !hasDessert) && !hasOfferedExtrasRef.current) {
        hasOfferedExtrasRef.current = true;
        if (!hasDrink && !hasDessert) {
          return "¡Con mucho gusto! Antes de cerrar tu orden, ¿te gustaría acompañarla con una bebida como Jugo de naranja recién exprimido ($30), Ponche de fruta calientito ($25) o una Coca Cola, o bien unas deliciosas Fresas con crema de postre ($40)?";
        } else if (!hasDrink) {
          return "¡Excelente! Antes de cerrar tu orden, ¿se te antoja agregar una bebida como nuestro Jugo de naranja natural ($30), Ponche de fruta ($25) o una Coca Cola bien fría?";
        } else {
          return "¡Muy bien! Antes de cerrar tu orden, ¿se te antojan unas deliciosas Fresas con crema especiales de la casa ($40 chico / $80 grande) como postre?";
        }
      }

      setIsOrderTrayExpanded(true);
      const count = cartRef.current.reduce((s, i) => s + i.quantity, 0);
      const total = cartRef.current.reduce((s, i) => s + i.price * i.quantity, 0);
      return `¡Perfecto! Llevas ${count} ${count === 1 ? 'platillo' : 'platillos'} con un total de $${total.toFixed(2)}. ¿Prefieres pasar a recogerlo en mostrador o te lo enviamos a domicilio?`;
    }

    if (input.includes('mostrador') || input.includes('recoger') || input.includes('paso por')) {
      setDeliveryMethod('pickup');
      deliveryMethodRef.current = 'pickup';
      if (cartRef.current.length > 0) {
        const res = generateAndSaveOrder({ deliveryMethod: 'pickup' });
        setIsOrderTrayExpanded(true);
        if (res) {
          return `¡Listo! Tu pedido #${res.order.id} para recoger en mostrador ha sido generado por $${res.order.total.toFixed(2)}.`;
        }
      }
      return "Perfecto, anotado para recoger en mostrador. ¿Qué platillos deseas ordenar?";
    }

    if (input.includes('domicilio') || input.includes('enviar') || input.includes('casa')) {
      setDeliveryMethod('delivery');
      deliveryMethodRef.current = 'delivery';
      if (cartRef.current.length > 0 && (selectedAddressRef.current || loggedCustomerRef.current?.addresses?.[0])) {
        const res = generateAndSaveOrder({ deliveryMethod: 'delivery' });
        setIsOrderTrayExpanded(true);
        if (res) {
          return `¡Listo! Tu pedido #${res.order.id} a domicilio ha sido generado por $${res.order.total.toFixed(2)}.`;
        }
      }
      setIsOrderTrayExpanded(true);
      return "Perfecto, envío a domicilio. Por favor confirma tu dirección y forma de pago en pantalla.";
    }

    if (input.includes('recomiend') || input.includes('especialidad') || input.includes('favorito') || input.includes('sugier') || input.includes('mas vendido')) {
      return "Te súper recomiendo nuestros Chilaquiles Especiales con asada de pollo ($120) o las Enchiladas Suizas gratinadas ($90). Y para acompañar, un Jugo de naranja recién exprimido ($30) y unas Fresas con crema ($40).";
    }

    // Dish matching
    for (const item of menuItems.filter(i => i.isActive)) {
      if (input.includes(item.name.toLowerCase())) {
        const v = item.variations[0];
        updateCartItem('add', {
          name: item.name,
          variation: v.label,
          price: v.price,
          quantity: 1,
          dishId: item.id
        });
        const { hasDrink, hasDessert } = checkCartExtras(cartRef.current);
        if (!hasDrink && !hasDessert) {
          return `¡Anotado! Agregué ${item.name} (${v.label}) por $${v.price}. ¿Te gustaría acompañarlo con un Jugo de naranja natural, un Ponche calientito o unas Fresas con crema de postre?`;
        } else if (!hasDessert) {
          return `¡Anotado! Agregué ${item.name} (${v.label}) por $${v.price}. ¿Se te antojan unas Fresas con crema de postre o algo más?`;
        } else if (!hasDrink) {
          return `¡Anotado! Agregué ${item.name} (${v.label}) por $${v.price}. ¿Gustas alguna bebida como Jugo de naranja o Coca Cola para acompañar?`;
        }
        return `¡Anotado! Agregué ${item.name} (${v.label}) por $${v.price}. ¿Deseas agregar algo más o cerramos tu orden?`;
      }
    }

    return "Te escucho con atención. Dime qué se te antoja ordenar de nuestro menú tradicional de El Buen Servir.";
  };

  // Send text to live session (from keyboard or quick prompt pills)
  const handleSendText = (text: string) => {
    if (!text.trim()) return;
    const cleanText = text.trim();
    stopAllAudio();

    const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    setLastUserSpeech(cleanText);
    setTranscriptHistory(prev => [...prev, { role: 'user', text: cleanText, time: now }]);
    setInputText('');
    setStatus('thinking');

    if (sessionRef.current) {
      try {
        sessionRef.current.sendClientContent({
          turns: [{ role: 'user', parts: [{ text: cleanText }] }],
          turnComplete: true
        });
        return;
      } catch (e) {
        console.warn("sendClientContent error:", e);
      }
    }

    // Fallback if session is offline
    const reply = runLocalHospitalityEngine(cleanText);
    setCurrentSofiaSpeech(reply);
    setTranscriptHistory(prev => [...prev, { role: 'ai', text: reply, time: now }]);
    setStatus('idle');
  };

  // Quick add dish from carousel
  const handleQuickAddDish = (dish: MenuItem) => {
    const defaultVar = dish.variations[0];
    updateCartItem('add', {
      name: dish.name,
      variation: defaultVar.label,
      price: defaultVar.price,
      quantity: 1,
      dishId: dish.id
    });

    const userText = `Quiero agregar ${dish.name} ${defaultVar.label}`;
    const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    setLastUserSpeech(userText);
    setTranscriptHistory(prev => [...prev, { role: 'user', text: userText, time: now }]);

    if (sessionRef.current) {
      try {
        sessionRef.current.sendClientContent({
          turns: [{
            role: 'user',
            parts: [{ text: `Agregué a mi orden ${dish.name} (${defaultVar.label}) por $${defaultVar.price}. Confírmamelo con entusiasmo y recomiéndame una bebida o postre para acompañarlo.` }]
          }],
          turnComplete: true
        });
        setStatus('thinking');
        return;
      } catch (e) { }
    }

    setCurrentSofiaSpeech(`¡Anotado! Te agregué ${dish.name} (${defaultVar.label}). ¿Gustas alguna bebida o postre para acompañar?`);
  };

  // WhatsApp order submission & manual confirmation
  const handleSendToWhatsApp = () => {
    if (cartRef.current.length === 0 || isSending) return;
    setIsSending(true);

    // If user typed a new address without pressing 'Guardar', apply it automatically
    let effectiveAddress = selectedAddress;
    if (deliveryMethod === 'delivery' && !effectiveAddress && newAddressInput.trim()) {
      effectiveAddress = newAddressInput.trim();
      setSelectedAddress(effectiveAddress);
      selectedAddressRef.current = effectiveAddress;
    }

    const result = generateAndSaveOrder({
      deliveryMethod: deliveryMethod || 'pickup',
      address: effectiveAddress,
      paymentMethod: selectedPaymentMethod,
      cashAmount: cashAmountPaid
    });

    if (result) {
      window.open(result.waUrl, '_blank');
    }

    setIsSending(false);
    disconnect();
    onClose();
  };

  // Transfer to App Cart
  const handleTransferToCart = () => {
    if (cart.length === 0) return;
    if (onTransferToCart) {
      onTransferToCart(cart.map(i => ({
        dishId: i.dishId || i.id,
        name: i.name,
        variationLabel: i.variation,
        price: i.price,
        quantity: i.quantity,
        comments: i.notes
      })));
    }
    soundManager.play('confirm_generic');
    disconnect();
    onClose();
  };

  // Save new address
  const handleAddNewAddress = () => {
    if (!newAddressInput.trim()) return;
    const addr = newAddressInput.trim();
    setSelectedAddress(addr);
    selectedAddressRef.current = addr;
    setIsAddingNewAddress(false);
    setNewAddressInput('');
    newAddressInputRef.current = '';

    if (loggedCustomer && onUpdateCustomer) {
      const existing = loggedCustomer.addresses || [];
      if (!existing.includes(addr)) {
        onUpdateCustomer({
          ...loggedCustomer,
          addresses: [...existing, addr]
        });
      }
    }
  };

  // Featured recommendation dishes
  const featuredDishes = useMemo(() => {
    return menuItems.filter(i => i.isActive && ['m23', 'm24', 'm3', 'm4', 'm19', 'm1', 'm2'].includes(i.id)).slice(0, 6);
  }, [menuItems]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center animate-in fade-in duration-300 overflow-hidden font-sans">
      {/* Immersive Dark Background with Ambient Glow */}
      <div className="absolute inset-0 bg-[#060913]/95 backdrop-blur-2xl" onClick={onClose} />

      {/* Ambient Lighting Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-4xl h-[100dvh] sm:h-[92vh] sm:max-h-[850px] flex flex-col justify-between sm:rounded-[40px] overflow-hidden border border-white/10 shadow-2xl text-white bg-gradient-to-b from-gray-950 via-[#0a0f1d] to-[#040711]">

        {/* 1. Header Bar */}
        <div className="px-5 sm:px-8 py-4 flex items-center justify-between border-b border-white/10 shrink-0 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <span className={`w-2 h-2 rounded-full ${status === 'speaking' ? 'bg-emerald-400 animate-ping' : status === 'listening' ? 'bg-teal-400 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                {status === 'connecting' ? 'Conectando...' : status === 'speaking' ? 'Sofía hablando' : status === 'listening' ? 'Sofía escuchando' : 'Sofía en vivo'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:inline">
              Voz Gemini Aoede Live 24kHz
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Output Mute Toggle */}
            <button
              type="button"
              onClick={() => {
                if (!isSpeakerMuted) stopAllAudio();
                setIsSpeakerMuted(!isSpeakerMuted);
              }}
              title={isSpeakerMuted ? "Activar audio de Sofía" : "Silenciar voz de Sofía"}
              className={`p-2.5 rounded-2xl border transition-all ${
                isSpeakerMuted
                  ? 'bg-red-500/15 border-red-500/30 text-red-400'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {isSpeakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Conversation History Toggle */}
            <button
              type="button"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              title="Historial de conversación"
              className={`p-2.5 rounded-2xl border transition-all ${
                isHistoryOpen
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <History className="w-4 h-4" />
            </button>

            {/* Reconnect Call Button */}
            <button
              type="button"
              onClick={() => {
                disconnect();
                setTimeout(() => connect(), 200);
              }}
              title="Reiniciar llamada de voz"
              className="p-2.5 rounded-2xl border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* API Key Modal Button */}
            <button
              type="button"
              onClick={() => setShowApiKeyModal(!showApiKeyModal)}
              title="Configurar clave Gemini"
              className="p-2.5 rounded-2xl border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            >
              <Key className="w-4 h-4" />
            </button>

            {/* Close Modal */}
            <button
              type="button"
              onClick={() => {
                disconnect();
                onClose();
              }}
              className="p-2.5 rounded-2xl border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-all ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* API Key Modal Panel */}
        {showApiKeyModal && (
          <div className="p-4 sm:p-6 bg-gray-900 border-b border-white/10 space-y-3 animate-in slide-in-from-top-4 duration-300 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">Clave de API Gemini Live</h4>
              </div>
              <button onClick={() => setShowApiKeyModal(false)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-gray-400">
              Usa tu clave de Google AI Studio para disfrutar la voz neuronal Gemini Aoede con streaming en tiempo real.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="AQ.Ab8RN6KRe5VAsxON..."
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('gemini_api_key', customApiKey.trim());
                  setShowApiKeyModal(false);
                  soundManager.play('confirm_generic');
                  disconnect();
                  setTimeout(() => connect(), 200);
                }}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Guardar y Conectar
              </button>
            </div>
          </div>
        )}

        {/* Error Notification Banner if Any */}
        {connectionError && (
          <div className="px-5 py-2.5 bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{connectionError}</span>
            </div>
            <button
              onClick={() => {
                disconnect();
                setTimeout(() => connect(), 200);
              }}
              className="text-[10px] font-black uppercase tracking-wider underline hover:text-white"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* 2. Central Living Voice Stage */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-4 sm:py-6 overflow-y-auto custom-scrollbar relative">

          {/* Living Interactive Orb */}
          <div
            className="relative flex items-center justify-center my-3 sm:my-5 cursor-pointer"
            onClick={() => {
              if (status === 'idle') {
                connect();
              } else {
                setIsMuted(!isMuted);
                soundManager.play('click');
              }
            }}
          >
            {/* Concentric Ambient Waves */}
            <div className={`absolute rounded-full transition-all duration-700 pointer-events-none ${
              status === 'speaking'
                ? 'w-52 h-52 bg-emerald-500/30 blur-2xl animate-ping'
                : status === 'listening'
                  ? 'w-56 h-56 bg-teal-400/20 blur-2xl animate-pulse'
                  : status === 'connecting' || status === 'thinking'
                    ? 'w-44 h-44 bg-amber-400/20 blur-xl animate-pulse'
                    : 'w-36 h-36 bg-emerald-500/10 blur-xl'
            }`} />

            <div className={`absolute rounded-full border border-emerald-500/30 transition-all duration-500 pointer-events-none ${
              status === 'speaking' ? 'w-44 h-44 scale-110' : status === 'listening' ? 'w-40 h-40 animate-spin' : 'w-32 h-32'
            }`} />

            {/* Core Orb */}
            <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1.5 transition-all duration-500 shadow-2xl flex items-center justify-center relative ${
              status === 'speaking'
                ? 'bg-gradient-to-tr from-emerald-400 via-teal-300 to-cyan-400 shadow-emerald-500/60 scale-105 ring-4 ring-emerald-400/40'
                : status === 'listening'
                  ? isMuted
                    ? 'bg-gradient-to-tr from-red-500 to-rose-600 shadow-red-500/40 scale-100'
                    : 'bg-gradient-to-tr from-teal-400 via-emerald-400 to-amber-300 shadow-teal-400/50 scale-110 ring-4 ring-emerald-400/30'
                  : status === 'connecting' || status === 'thinking'
                    ? 'bg-gradient-to-tr from-amber-400 to-orange-500 shadow-amber-400/30 animate-pulse'
                    : 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-700 hover:scale-105 shadow-emerald-500/30'
            }`}>
              <div className="w-full h-full rounded-full bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden">
                <span className="text-3xl sm:text-4xl filter drop-shadow">👩‍🍳</span>

                {/* Real-time reactive audio wave bars under avatar */}
                <div className="flex items-center gap-1 mt-1.5">
                  {[4, 10, 16, 10, 4].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        height: `${
                          status === 'speaking'
                            ? Math.max(5, h * 1.4)
                            : status === 'listening' && !isMuted
                              ? Math.max(4, h * 1.1)
                              : 3
                        }px`
                      }}
                      className={`w-1 rounded-full transition-all duration-200 ${
                        status === 'speaking'
                          ? 'bg-emerald-400 animate-bounce'
                          : status === 'listening' && !isMuted
                            ? 'bg-teal-400 animate-pulse'
                            : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* User's Last Expression Pill */}
          {lastUserSpeech && (
            <div className="mb-2 max-w-lg px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 flex items-center gap-2 animate-in fade-in duration-300">
              <span className="text-emerald-400 font-black text-[10px] uppercase tracking-wider shrink-0">Tú:</span>
              <p className="truncate italic">"{lastUserSpeech}"</p>
            </div>
          )}

          {/* Sofia's Real-time Dynamic Hero Caption */}
          <div className="max-w-2xl text-center px-4 py-3 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-md shadow-lg min-h-[72px] flex items-center justify-center transition-all">
            {status === 'connecting' ? (
              <div className="flex items-center gap-2.5 text-emerald-300 font-medium text-sm animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Conectando con la voz de Sofía...</span>
              </div>
            ) : status === 'thinking' ? (
              <div className="flex items-center gap-2.5 text-amber-300 font-medium text-sm animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Sofía está preparando tu respuesta...</span>
              </div>
            ) : (
              <p className="text-base sm:text-lg font-medium leading-snug text-white/95 transition-all duration-300">
                "{currentSofiaSpeech || '¡Hola! Soy Sofía. ¿Qué se te antoja ordenar el día de hoy?'}"
              </p>
            )}
          </div>

          {/* Visual Dish Carousel (Interactive Touch Ordering) */}
          <div className="w-full max-w-3xl mt-4 sm:mt-6">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Platillos Populares · Toca para pedir
              </span>
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Recomendados
              </span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar snap-x">
              {featuredDishes.map((dish) => {
                const img = getDishImage(dish.name);
                const minPrice = Math.min(...dish.variations.map(v => v.price));
                return (
                  <div
                    key={dish.id}
                    onClick={() => handleQuickAddDish(dish)}
                    className="snap-start shrink-0 w-44 sm:w-52 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer group flex flex-col justify-between active:scale-95 shadow-md"
                  >
                    <div className="relative w-full h-24 rounded-xl overflow-hidden mb-2 bg-black/40">
                      {img ? (
                        <img src={img} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">🍲</div>
                      )}
                      <span className="absolute bottom-1 right-1 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-black text-emerald-400">
                        ${minPrice}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-black uppercase text-white truncate">{dish.name}</h4>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{dish.variations[0]?.label}</p>
                    </div>

                    <button
                      type="button"
                      className="mt-2 w-full py-1.5 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Pedir Platillo</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Bottom Command Island */}
        <div className="p-4 sm:p-6 border-t border-white/10 bg-black/40 backdrop-blur-xl shrink-0 flex flex-col gap-3">

          {/* Quick Prompts Carousel */}
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {[
              "🌟 ¿Qué me recomiendas hoy?",
              "🥣 Quiero unos Chilaquiles con pollo",
              "🍲 ¿Qué caldos tienen preparados?",
              "🥤 ¿Tienen jugo de naranja natural?",
              "✅ Ya es todo, la cuenta por favor"
            ].map((promptText, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendText(promptText)}
                className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-gray-300 hover:text-emerald-300 text-xs font-semibold whitespace-nowrap transition-all shrink-0 active:scale-95"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Text Input Row */}
          {isKeyboardOpen && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputText.trim()) handleSendText(inputText);
              }}
              className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe lo que quieres pedir a Sofía..."
                className="flex-1 bg-white/5 border border-white/15 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-5 py-3 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Main Action Bar */}
          <div className="flex items-center justify-between gap-3">
            {/* Keyboard input toggle */}
            <button
              type="button"
              onClick={() => setIsKeyboardOpen(!isKeyboardOpen)}
              title={isKeyboardOpen ? "Ocultar teclado" : "Escribir con teclado"}
              className={`p-3.5 rounded-2xl border transition-all ${
                isKeyboardOpen
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <Keyboard className="w-5 h-5" />
            </button>

            {/* Central Mic / Call Toggle */}
            <button
              type="button"
              onClick={() => {
                if (status === 'idle') {
                  connect();
                } else {
                  setIsMuted(!isMuted);
                  soundManager.play('click');
                }
              }}
              className={`flex-1 py-4 px-6 rounded-2xl font-black uppercase text-xs sm:text-sm tracking-wider flex items-center justify-center gap-3 transition-all shadow-xl cursor-pointer ${
                status === 'idle'
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/30'
                  : isMuted
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/40'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-emerald-500/30 active:scale-95'
              }`}
            >
              {status === 'idle' ? (
                <>
                  <PhoneCall className="w-5 h-5" />
                  <span>Conectar con Sofía</span>
                </>
              ) : isMuted ? (
                <>
                  <MicOff className="w-5 h-5" />
                  <span>Micrófono Silenciado (Toca para activar)</span>
                </>
              ) : status === 'speaking' ? (
                <>
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  <span>Sofía hablando... (Toca para silenciar mic)</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 animate-pulse" />
                  <span>Escuchando en vivo... (Toca para silenciar)</span>
                </>
              )}
            </button>

            {/* Floating Live Cart Pill */}
            <button
              type="button"
              onClick={() => setIsOrderTrayExpanded(true)}
              className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-all active:scale-95 shadow-lg shrink-0"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                    {cartItemsCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-black hidden sm:inline">${cartTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>

        {/* 4. Slide-up Interactive Order Drawer & Checkout */}
        {isOrderTrayExpanded && (
          <div className="absolute inset-0 z-30 flex flex-col bg-[#070b14]/98 backdrop-blur-2xl animate-in slide-in-from-bottom duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black uppercase tracking-wider text-white">Tu Pedido con Sofía</h3>
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  {cartItemsCount} {cartItemsCount === 1 ? 'platillo' : 'platillos'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderTrayExpanded(false)}
                className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
              {createdOrder && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-start gap-3 animate-in fade-in duration-300">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-300">
                      ¡Pedido #{createdOrder.id} Registrado!
                    </p>
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      Sofía ya generó tu orden en el sistema del restaurante. Puedes enviar el comprobante por WhatsApp aquí abajo.
                    </p>
                  </div>
                </div>
              )}

              {cart.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    lastAddedId === item.id
                      ? 'border-emerald-500 bg-emerald-500/15 scale-[1.01]'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-black text-white uppercase truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase">{item.variation}</p>
                    {item.notes && (
                      <p className="text-[10px] font-bold text-amber-400 bg-amber-500/20 border border-amber-500/30 rounded-md px-1.5 py-0.5 mt-1 inline-block">
                        📝 {item.notes}
                      </p>
                    )}
                    <p className="text-xs font-black text-emerald-400 mt-1">
                      ${(item.price * item.quantity).toFixed(2)}
                      {item.quantity > 1 && <span className="text-[10px] text-gray-500 ml-1 font-normal">(${item.price} c/u)</span>}
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.quantity > 1) {
                          updateCartItem('update', { name: item.name, variation: item.variation, price: item.price, quantity: item.quantity - 1 });
                        } else {
                          updateCartItem('remove', { name: item.name, variation: item.variation, price: item.price });
                        }
                      }}
                      className="p-1 rounded-lg text-gray-400 hover:text-white"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-black text-white px-1">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => {
                        updateCartItem('update', { name: item.name, variation: item.variation, price: item.price, quantity: item.quantity + 1 });
                      }}
                      className="p-1 rounded-lg text-gray-400 hover:text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCartItem('remove', { name: item.name, variation: item.variation, price: item.price })}
                      className="p-1 rounded-lg text-gray-500 hover:text-red-400 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="py-16 text-center text-gray-500 space-y-2">
                  <Utensils className="w-10 h-10 mx-auto text-gray-600" />
                  <p className="text-xs font-black uppercase tracking-wider">Aún no tienes platillos agregados</p>
                  <p className="text-[11px] text-gray-500">Pídele a Sofía lo que se te antoje o toca los platillos recomendados.</p>
                </div>
              )}

              {/* Delivery & Payment Section */}
              {cart.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  {/* Delivery Mode */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                      1. ¿Cómo recibes tu orden?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('pickup')}
                        className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all ${
                          deliveryMethod === 'pickup'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <Store className="w-4 h-4 text-emerald-400" />
                        <span>Mostrador</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('delivery')}
                        className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all ${
                          deliveryMethod === 'delivery'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <Truck className="w-4 h-4 text-emerald-400" />
                        <span>Domicilio</span>
                      </button>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  {deliveryMethod === 'delivery' && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                        Dirección de entrega
                      </label>
                      {loggedCustomer?.addresses && loggedCustomer.addresses.length > 0 && (
                        <div className="space-y-1.5">
                          {loggedCustomer.addresses.map((addr, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedAddress(addr)}
                              className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                                selectedAddress === addr
                                  ? 'bg-emerald-500/20 border-emerald-500 text-white'
                                  : 'bg-white/5 border-white/10 text-gray-400'
                              }`}
                            >
                              <span className="truncate pr-2">{addr}</span>
                              {selectedAddress === addr && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )}

                      {!isAddingNewAddress ? (
                        <button
                          type="button"
                          onClick={() => setIsAddingNewAddress(true)}
                          className="w-full py-2.5 border border-dashed border-white/20 rounded-xl text-xs font-bold text-gray-400 hover:text-emerald-300 transition-colors"
                        >
                          + Ingresar otra dirección
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Calle, número, colonia..."
                            value={newAddressInput}
                            onChange={(e) => setNewAddressInput(e.target.value)}
                            className="flex-1 bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddNewAddress}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold"
                          >
                            Guardar
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment Method */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                      2. Forma de pago
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethod('efectivo')}
                        className={`p-2.5 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                          selectedPaymentMethod === 'efectivo'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        <Banknote className="w-4 h-4 text-emerald-400" />
                        <span>Efectivo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethod('tarjeta')}
                        className={`p-2.5 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                          selectedPaymentMethod === 'tarjeta'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-blue-400" />
                        <span>Tarjeta</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethod('transferencia')}
                        className={`p-2.5 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                          selectedPaymentMethod === 'transferencia'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>Transfer</span>
                      </button>
                      {loggedCustomer?.creditEnabled && (
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentMethod('credito')}
                          className={`p-2.5 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                            selectedPaymentMethod === 'credito'
                              ? 'bg-emerald-500/20 border-emerald-500 text-white'
                              : 'bg-white/5 border-white/10 text-gray-400'
                          }`}
                        >
                          <Award className="w-4 h-4 text-purple-400" />
                          <span>Crédito</span>
                        </button>
                      )}
                    </div>

                    {selectedPaymentMethod === 'efectivo' && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-bold">¿Pagas con billete de?</span>
                        <input
                          type="number"
                          placeholder={`$${cartTotal.toFixed(0)}`}
                          value={cashAmountPaid}
                          onChange={(e) => setCashAmountPaid(e.target.value)}
                          className="w-24 bg-black/60 border border-white/20 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                        {parseFloat(cashAmountPaid) >= cartTotal && (
                          <span className="text-xs text-emerald-400 font-bold">
                            Cambio: ${(parseFloat(cashAmountPaid) - cartTotal).toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Bottom Actions */}
            {cart.length > 0 && (
              <div className="p-4 sm:p-6 border-t border-white/10 bg-black/60 space-y-3 shrink-0">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-400">Total a pagar</span>
                  <span className="text-2xl font-black text-white">${cartTotal.toFixed(2)}</span>
                </div>

                <button
                  type="button"
                  disabled={!deliveryMethod || (deliveryMethod === 'delivery' && !selectedAddress && !newAddressInput.trim()) || isSending}
                  onClick={handleSendToWhatsApp}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-sm tracking-wider flex items-center justify-center gap-3 transition-all shadow-xl ${
                    !deliveryMethod || (deliveryMethod === 'delivery' && !selectedAddress && !newAddressInput.trim()) || isSending
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30 active:scale-95'
                  }`}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Enviando a WhatsApp...</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-5 h-5" />
                      <span>{createdOrder ? 'Enviar Resumen por WhatsApp' : 'Confirmar Pedido WhatsApp'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleTransferToCart}
                  className="w-full py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                  <span>Pasar al Carrito de la Tienda</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 5. Transcript History Drawer */}
        {isHistoryOpen && (
          <div className="absolute inset-0 z-20 flex flex-col bg-gray-950/98 backdrop-blur-2xl animate-in slide-in-from-right duration-300">
            <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Historial de Conversación</h3>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="p-2 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {transcriptHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/10'
                  }`}>
                    <p>{msg.text}</p>
                    <span className="block text-[9px] text-white/50 text-right mt-1">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
