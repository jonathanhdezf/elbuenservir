import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X, Mic, MicOff, ShoppingCart, Send, Trash2, Loader2, Zap,
  Volume2, VolumeX, ChevronRight, MessageCircle, Phone, Lock,
  Check, Store, Truck, Sparkles, Key, Plus, Minus, CreditCard,
  Banknote, RefreshCw, ChevronUp, ChevronDown, Utensils, Award,
  Clock, ArrowRight, Keyboard, History
} from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
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
}

interface LiveOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  categories: Category[];
  onAddOrder?: (order: Order) => void;
  loggedCustomer: Customer | null;
  onOpenAuth: () => void;
  onTransferToCart?: (items: { dishId: string; name: string; variationLabel: string; price: number; quantity: number }[]) => void;
  onUpdateCustomer?: (customer: Customer) => void;
}

type SessionStatus = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

const RESTAURANT_PHONE = '2311024672';
const WHATSAPP_NUMBER = '522311024672';
const GEMINI_MODEL = 'gemini-flash-latest';

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

// Tool Declarations for Gemini Function Calling
const updateOrderDeclaration = {
  name: "updateOrder",
  description: "Agrega, modifica la cantidad o elimina platillos del ticket del pedido.",
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
          quantity: { type: Type.NUMBER, description: "Cantidad de porciones" }
        },
        required: ["name", "variation"]
      }
    },
    required: ["action", "item"]
  }
};

const completeOrderDeclaration = {
  name: "completeOrder",
  description: "Finaliza la toma de la orden cuando el cliente indica que es todo o desea pagar.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderType: { type: Type.STRING, enum: ["pickup", "delivery"], description: "Entrega: mostrador o domicilio" },
      deliveryAddress: { type: Type.STRING, description: "Dirección de entrega" },
      paymentMethod: { type: Type.STRING, enum: ["efectivo", "tarjeta", "transferencia", "credito"], description: "Forma de pago" }
    }
  }
};

function buildMenuSummaryContext(menuItems: MenuItem[], categories: Category[]): string {
  const lines: string[] = [
    "RESTAURANTE: El Buen Servir - Desayunos, caldos y guisados caseros tradicionales en Teziutlán.",
    "WHATSAPP: 2311024672.",
    "CATÁLOGO COMPLETO:"
  ];

  categories.forEach(cat => {
    const items = menuItems.filter(i => i.isActive && i.categoryId === cat.id);
    if (items.length === 0) return;
    lines.push(`\n[${cat.name.toUpperCase()}]:`);
    items.forEach(item => {
      const vars = item.variations.map(v => `${v.label}: $${v.price}`).join(' | ');
      lines.push(`• ${item.name} (${vars})`);
    });
  });

  lines.push("\nESPECIALIDADES MÁS VENDIDAS:");
  lines.push("1. Chilaquiles (chico $60, grande $90, con asada de pollo $120, con asada de puerco $130).");
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
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isListeningContinuous, setIsListeningContinuous] = useState(false);
  const [isOrderTrayExpanded, setIsOrderTrayExpanded] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery' | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [newAddressInput, setNewAddressInput] = useState('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [cashAmountPaid, setCashAmountPaid] = useState<string>('');
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');

  const recognitionRef = useRef<any>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Sync address with logged customer
  useEffect(() => {
    if (loggedCustomer && loggedCustomer.addresses && loggedCustomer.addresses.length > 0 && !selectedAddress) {
      setSelectedAddress(loggedCustomer.addresses[0]);
    }
  }, [loggedCustomer]);

  // Current API key detection
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

  // Calculate cart total
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const cartItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Text to Speech
  const speakText = useCallback((text: string) => {
    if (isSpeakerMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setStatus('idle');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#•]/g, '').replace(/https?:\/\/\S+/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'es-MX';
      utterance.rate = 1.05;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(v => v.lang.includes('es-MX') || v.lang.includes('es-US') || v.lang.startsWith('es'));
      if (spanishVoice) utterance.voice = spanishVoice;

      utterance.onstart = () => setStatus('speaking');
      utterance.onend = () => {
        setStatus('idle');
        // If continuous listening is active, resume listening after speaking
        if (isListeningContinuous) {
          startSpeechRecognition();
        }
      };
      utterance.onerror = () => setStatus('idle');

      speechSynthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      setStatus('idle');
    }
  }, [isSpeakerMuted, isListeningContinuous]);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (status === 'speaking') {
      setStatus('idle');
    }
  }, [status]);

  // Speech Recognition (Microphone)
  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) { }
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'es-MX';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setStatus('listening');
      };

      recognition.onresult = (event: any) => {
        const spokenText = event.results[0][0].transcript;
        if (spokenText) {
          handleUserInteraction(spokenText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error", event.error);
        if (status === 'listening') setStatus('idle');
      };

      recognition.onend = () => {
        if (status === 'listening') setStatus('idle');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition start failed", err);
      if (status === 'listening') setStatus('idle');
    }
  }, [status]);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) { }
    }
    if (status === 'listening') setStatus('idle');
  }, [status]);

  // Toggle voice listening
  const toggleListening = () => {
    stopSpeech();
    if (status === 'listening') {
      setIsListeningContinuous(false);
      stopSpeechRecognition();
      soundManager.play('click');
    } else {
      setIsListeningContinuous(true);
      startSpeechRecognition();
      soundManager.play('confirm_generic');
    }
  };

  // Initial welcome on open
  useEffect(() => {
    if (isOpen && transcriptHistory.length === 0) {
      const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      let greeting = '';
      if (loggedCustomer) {
        const firstName = loggedCustomer.name.split(' ')[0];
        greeting = `¡Hola, ${firstName}! Qué gusto tenerte en El Buen Servir. Mi nombre es Sofía, tu anfitriona. ¿Qué se te antoja ordenar el día de hoy?`;
      } else {
        greeting = `¡Hola! Bienvenido a El Buen Servir, soy Sofía. Con mucho gusto te atiendo y tomo tu pedido. ¿Qué te gustaría probar hoy?`;
      }

      setCurrentSofiaSpeech(greeting);
      setTranscriptHistory([{ role: 'ai', text: greeting, time: now }]);
      speakText(greeting);
    }
  }, [isOpen, loggedCustomer]);

  // Add / Update item in Sofia's live ticket
  const updateCartItem = (action: 'add' | 'remove' | 'update', item: { name: string; variation: string; price: number; quantity?: number; dishId?: string }) => {
    const itemName = item.name.trim();
    const itemVar = item.variation.trim();
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const dishImg = getDishImage(itemName);

    setCart(prev => {
      const matchIndex = prev.findIndex(i =>
        i.name.toLowerCase() === itemName.toLowerCase() &&
        i.variation.toLowerCase() === itemVar.toLowerCase()
      );

      if (action === 'add') {
        if (matchIndex > -1) {
          const updated = [...prev];
          const target = updated[matchIndex];
          target.quantity += qty;
          setLastAddedId(target.id);
          return updated;
        } else {
          const newId = `sofia-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          setLastAddedId(newId);
          return [...prev, {
            id: newId,
            dishId: item.dishId,
            name: itemName,
            variation: itemVar,
            price: item.price,
            quantity: qty,
            image: dishImg || undefined
          }];
        }
      } else if (action === 'update') {
        if (matchIndex > -1) {
          const updated = [...prev];
          updated[matchIndex].quantity = qty;
          if (item.price) updated[matchIndex].price = item.price;
          setLastAddedId(updated[matchIndex].id);
          return updated;
        }
      } else if (action === 'remove') {
        setLastAddedId(null);
        return prev.filter((_, idx) => idx !== matchIndex);
      }
      return prev;
    });

    try { soundManager.play('confirm_generic'); } catch (e) { }
    setTimeout(() => setLastAddedId(null), 2000);
  };

  // Add dish directly from card
  const handleQuickAddDish = (dish: MenuItem) => {
    const defaultVar = dish.variations[0];
    updateCartItem('add', {
      name: dish.name,
      variation: defaultVar.label,
      price: defaultVar.price,
      quantity: 1,
      dishId: dish.id
    });

    const reply = `¡Anotado! Te agregué ${dish.name} (${defaultVar.label}) por $${defaultVar.price}. ¿Gustas alguna bebida o postre para acompañar?`;
    setCurrentSofiaSpeech(reply);
    setTranscriptHistory(prev => [...prev, {
      role: 'ai',
      text: reply,
      time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    }]);
    speakText(reply);
  };

  // Local Intelligent Hospitality Engine
  const runLocalHospitalityEngine = (userInput: string): string => {
    const input = userInput.toLowerCase().trim();

    // Finalize
    if (['es todo', 'seria todo', 'sería todo', 'la cuenta', 'ya es todo', 'finalizar', 'pagar'].some(t => input.includes(t))) {
      if (cart.length === 0) {
        return "¡Con gusto! Pero aún no tienes platillos en tu orden. ¿Qué te gustaría pedir primero? Tenemos chilaquiles deliciosos, caldos y guisados.";
      }
      setIsOrderTrayExpanded(true);
      return `¡Perfecto! Llevas ${cartItemsCount} ${cartItemsCount === 1 ? 'platillo' : 'platillos'} con un total de $${cartTotal.toFixed(2)}. ¿Prefieres pasar a recogerlo en mostrador o te lo enviamos a domicilio?`;
    }

    // Recommendations
    if (input.includes('recomiend') || input.includes('especialidad') || input.includes('favorito') || input.includes('sugier') || input.includes('mas vendido')) {
      return "Te súper recomiendo nuestros Chilaquiles Especiales con asada de pollo ($120) o las Enchiladas Suizas gratinadas ($90). Si tienes antojo de algo calientito, el Chilpozo de Res ($95) es una maravilla. ¿Te preparo alguno?";
    }

    // Delivery or Hours
    if (input.includes('domicilio') || input.includes('entrega') || input.includes('envio') || input.includes('envío')) {
      return "¡Sí! Contamos con servicio a domicilio rápido en Teziutlán y alrededores, o puedes pasar a recogerlo calientito al mostrador.";
    }

    // Drinks or Desserts
    if (input.includes('bebida') || input.includes('jugo') || input.includes('cafe') || input.includes('café')) {
      return "De bebidas tenemos Jugo de Naranja natural recién exprimido (medio litro $30, litro $60), café de olla calientito y refrescos.";
    }

    if (input.includes('postre') || input.includes('fresa')) {
      return "Nuestras Fresas con Crema especiales de la casa son riquísimas: vaso chico $40 y vaso grande $80. ¿Te gustaría ordenar un vaso?";
    }

    // Removals
    if (input.startsWith('quita') || input.startsWith('elimina') || input.startsWith('borra') || input.includes('no quiero')) {
      for (const cartItem of cart) {
        if (input.includes(cartItem.name.toLowerCase())) {
          updateCartItem('remove', { name: cartItem.name, variation: cartItem.variation, price: cartItem.price });
          return `¡Listo! Ya quité ${cartItem.name} de tu orden. ¿Deseas ordenar algo más?`;
        }
      }
    }

    // Dish Matching
    let parsedQty = 1;
    if (input.includes('dos ') || input.includes('2 ')) parsedQty = 2;
    if (input.includes('tres ') || input.includes('3 ')) parsedQty = 3;
    if (input.includes('cuatro ') || input.includes('4 ')) parsedQty = 4;

    for (const item of menuItems.filter(i => i.isActive)) {
      const itemNameLower = item.name.toLowerCase();
      const match = itemNameLower.split(' ').some(w => w.length > 3 && input.includes(w)) || input.includes(itemNameLower);

      if (match) {
        let chosenVar = item.variations[0];
        if (item.variations.length > 1) {
          for (const v of item.variations) {
            const vL = v.label.toLowerCase();
            if (input.includes(vL) || (vL.includes('grande') && input.includes('grande')) || (vL.includes('asada') && input.includes('asada')) || (vL.includes('litro') && input.includes('litro'))) {
              chosenVar = v;
              break;
            }
          }
        }

        updateCartItem('add', {
          name: item.name,
          variation: chosenVar.label,
          price: chosenVar.price,
          quantity: parsedQty,
          dishId: item.id
        });

        const newTotal = cartTotal + (chosenVar.price * parsedQty);
        return `¡Anotado! Agregué ${parsedQty}x ${item.name} (${chosenVar.label}) por $${(chosenVar.price * parsedQty).toFixed(2)}. Tu orden lleva $${newTotal.toFixed(2)}. ¿Deseas agregar alguna bebida o guarnición?`;
      }
    }

    return "Te escucho con atención. Puedes decirme qué se te antoja ordenar de nuestro menú, pedirme recomendaciones o decirme 'es todo' para preparar tu cuenta.";
  };

  // Main interaction handler
  const handleUserInteraction = async (text: string) => {
    if (!text.trim()) return;
    stopSpeech();

    const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    setLastUserSpeech(text.trim());
    setTranscriptHistory(prev => [...prev, { role: 'user', text: text.trim(), time: now }]);
    setInputText('');
    setStatus('thinking');

    // If Gemini API Key is available, use Gemini Flash
    if (hasApiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: resolvedApiKey });
        const menuContext = buildMenuSummaryContext(menuItems, categories);

        const customerInfo = loggedCustomer
          ? `Nombre: ${loggedCustomer.name}, Teléfono: ${loggedCustomer.phone}, Direcciones: ${loggedCustomer.addresses?.join(' | ') || 'Ninguna'}.`
          : 'Cliente invitado.';

        const currentCartText = cart.length > 0
          ? `TICKET ACTUAL:\n${cart.map(c => `- ${c.quantity}x ${c.name} (${c.variation}) a $${c.price}`).join('\n')}\nTOTAL: $${cartTotal.toFixed(2)}`
          : 'El ticket actual está vacío.';

        const systemInstruction = `Eres "Sofía", la anfitriona y mesera virtual de atención al cliente de "El Buen Servir" en Teziutlán.
Tu personalidad es extraordinariamente cálida, sonriente, servicial, amena y con la hospitalidad mexicana más distinguida.
CLIENTE: ${customerInfo}
MENÚ: ${menuContext}
TICKET ACTUAL: ${currentCartText}

REGLAS DE ATENCIÓN:
1. Responde de forma muy amable y concisa (1 o 2 oraciones breves para mantener la plática rápida).
2. Si el cliente pide platillos, USA SIEMPRE la herramienta 'updateOrder' con action='add', nombre exacto del platillo, variación y precio del catálogo.
3. Si el cliente dice 'es todo', 'la cuenta' o termina, usa 'completeOrder' y confirma el total amablemente.`;

        const recentHistory = transcriptHistory.slice(-4).map(t => ({
          role: t.role === 'user' ? 'user' : 'model',
          parts: [{ text: t.text }]
        }));

        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: [
            ...recentHistory,
            { role: 'user', parts: [{ text: text.trim() }] }
          ],
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: [updateOrderDeclaration, completeOrderDeclaration] }],
            temperature: 0.7
          }
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        const functionCalls = parts
          .filter((p: any) => p.functionCall)
          .map((p: any) => p.functionCall);
        let executedAction = false;

        if (functionCalls && functionCalls.length > 0) {
          for (const call of functionCalls) {
            if (call.name === "updateOrder") {
              const args: any = call.args;
              if (args && args.action && args.item) {
                let finalPrice = args.item.price;
                let dishId = args.item.dishId;
                if (!finalPrice || finalPrice <= 0) {
                  const foundItem = menuItems.find(mi => mi.name.toLowerCase().includes(args.item.name.toLowerCase()) || args.item.name.toLowerCase().includes(mi.name.toLowerCase()));
                  if (foundItem) {
                    dishId = foundItem.id;
                    const foundVar = foundItem.variations.find(v => v.label.toLowerCase().includes((args.item.variation || '').toLowerCase())) || foundItem.variations[0];
                    finalPrice = foundVar.price;
                  }
                }

                updateCartItem(args.action, {
                  name: args.item.name,
                  variation: args.item.variation || 'Platillo',
                  price: finalPrice || 0,
                  quantity: args.item.quantity || 1,
                  dishId: dishId
                });
                executedAction = true;
              }
            } else if (call.name === "completeOrder") {
              const args: any = call.args;
              if (args?.orderType) setDeliveryMethod(args.orderType);
              if (args?.deliveryAddress) setSelectedAddress(args.deliveryAddress);
              if (args?.paymentMethod) setSelectedPaymentMethod(args.paymentMethod);
              setIsOrderTrayExpanded(true);
              executedAction = true;
            }
          }
        }

        const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join(' ').trim();
        const replyText = textParts || response.text || (executedAction ? "¡Listo! Ya registré tu pedido en el ticket. ¿Deseas agregar alguna bebida o algo más?" : "Con gusto te atiendo. ¿Qué más se te antoja?");
        setCurrentSofiaSpeech(replyText);
        setTranscriptHistory(prev => [...prev, { role: 'ai', text: replyText, time: now }]);
        speakText(replyText);
        return;
      } catch (geminiError: any) {
        console.warn("Gemini call error, using local engine:", geminiError);
      }
    }

    // Local fallback
    setTimeout(() => {
      const reply = runLocalHospitalityEngine(text);
      setCurrentSofiaSpeech(reply);
      setTranscriptHistory(prev => [...prev, { role: 'ai', text: reply, time: now }]);
      speakText(reply);
    }, 300);
  };

  // WhatsApp order submission
  const handleSendToWhatsApp = () => {
    if (cart.length === 0 || isSending) return;
    setIsSending(true);

    const orderId = `SOFIA-${Math.random().toString(36).substr(2, 6).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    const customerName = loggedCustomer?.name || 'Cliente de Sofía IA';
    const customerPhone = loggedCustomer?.phone || 'Sin registrar';

    let deliveryText = '';
    if (deliveryMethod === 'pickup') {
      deliveryText = '🏪 *Entrega:* Recoger en Mostrador';
    } else {
      deliveryText = `🏠 *Entrega a Domicilio:* ${selectedAddress || 'Dirección acordada'}`;
    }

    let paymentText = '';
    const parsedCash = parseFloat(cashAmountPaid);
    if (selectedPaymentMethod === 'efectivo') {
      const change = !isNaN(parsedCash) && parsedCash >= cartTotal ? (parsedCash - cartTotal) : 0;
      paymentText = `💵 *Pago:* Efectivo` + (!isNaN(parsedCash) && parsedCash >= cartTotal ? ` (Paga con: $${parsedCash.toFixed(2)}, Cambio: $${change.toFixed(2)})` : ` (Pago exacto)`);
    } else if (selectedPaymentMethod === 'tarjeta') {
      paymentText = `💳 *Pago:* Tarjeta (Llevar terminal bancaria al entregar)`;
    } else if (selectedPaymentMethod === 'transferencia') {
      paymentText = `🏦 *Pago:* Transferencia Bancaria`;
    } else if (selectedPaymentMethod === 'credito') {
      paymentText = `🏷️ *Pago:* Crédito de Tienda (Cuenta de Cliente)`;
    }

    const itemsText = cart.map(i => `• ${i.quantity}x ${i.name} (${i.variation}) - $${(i.price * i.quantity).toFixed(2)}`).join('\n');

    const msg =
      `*🎙️ PEDIDO ASISTIDO POR SOFÍA IA - EL BUEN SERVIR*\n\n` +
      `🆔 *Orden:* #${orderId}\n` +
      `👤 *Cliente:* ${customerName}\n` +
      `📱 *Teléfono:* ${customerPhone}\n` +
      `${deliveryText}\n` +
      `${paymentText}\n\n` +
      `*DETALLE DEL PEDIDO:*\n` +
      `${itemsText}\n\n` +
      `💰 *TOTAL A PAGAR: $${cartTotal.toFixed(2)}*\n\n` +
      `✨ _Pedido generado por la Asistente Virtual Sofía_`;

    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

    // Credit movement
    if (selectedPaymentMethod === 'credito' && loggedCustomer && onUpdateCustomer) {
      const currentBal = Number(loggedCustomer.creditBalance || 0);
      const newBal = currentBal + cartTotal;
      const creditMovement: CustomerCreditMovement = {
        id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        orderId: orderId,
        type: 'cargo',
        amount: cartTotal,
        balanceAfter: newBal,
        date: new Date().toISOString(),
        notes: `Cargo por pedido asistido con Sofía IA #${orderId}`,
        registeredBy: 'Sofía IA'
      };

      onUpdateCustomer({
        ...loggedCustomer,
        creditBalance: newBal,
        creditHistory: [creditMovement, ...(loggedCustomer.creditHistory || [])]
      });
    }

    // Add order to DB
    if (onAddOrder) {
      const newOrder: Order = {
        id: orderId,
        customerName: customerName,
        customerPhone: customerPhone,
        address: deliveryMethod === 'pickup' ? 'Recoger en mostrador' : selectedAddress,
        items: cart.map(i => ({
          id: i.dishId || i.id,
          name: i.name,
          variationLabel: i.variation,
          price: i.price,
          quantity: i.quantity
        })),
        total: cartTotal,
        status: 'pending',
        paymentMethod: selectedPaymentMethod,
        paymentStatus: 'pending',
        cashReceived: !isNaN(parsedCash) && parsedCash >= cartTotal ? parsedCash : undefined,
        change: !isNaN(parsedCash) && parsedCash >= cartTotal ? (parsedCash - cartTotal) : undefined,
        createdAt: new Date().toISOString(),
        source: 'online',
        notes: 'Pedido asistido por Sofía IA'
      };
      onAddOrder(newOrder);
    }

    window.open(waUrl, '_blank');
    setIsSending(false);
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
        quantity: i.quantity
      })));
    }
    soundManager.play('confirm_generic');
    onClose();
  };

  // Save new address
  const handleAddNewAddress = () => {
    if (!newAddressInput.trim()) return;
    const addr = newAddressInput.trim();
    setSelectedAddress(addr);
    setIsAddingNewAddress(false);
    setNewAddressInput('');

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
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300">Sofía en vivo</span>
            </div>
            {hasApiKey ? (
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:inline">
                Gemini Flash AI
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest hidden sm:inline">
                Modo Nativo
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => {
                if (!isSpeakerMuted) stopSpeech();
                setIsSpeakerMuted(!isSpeakerMuted);
              }}
              title={isSpeakerMuted ? "Activar audio" : "Silenciar audio"}
              className={`p-2.5 rounded-2xl border transition-all ${
                isSpeakerMuted
                  ? 'bg-red-500/15 border-red-500/30 text-red-400'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {isSpeakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* History Drawer Toggle */}
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

            {/* API Key Modal Button */}
            <button
              type="button"
              onClick={() => setShowApiKeyModal(!showApiKeyModal)}
              title="Configurar clave Gemini"
              className="p-2.5 rounded-2xl border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            >
              <Key className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={() => {
                stopSpeech();
                stopSpeechRecognition();
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
                <h4 className="text-xs font-black uppercase tracking-wider text-white">Clave de API Gemini</h4>
              </div>
              <button onClick={() => setShowApiKeyModal(false)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
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
                }}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Guardar
              </button>
            </div>
          </div>
        )}

        {/* 2. Central Interactive Living Voice Stage */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-4 sm:py-6 overflow-y-auto custom-scrollbar relative">

          {/* Living Orb Component */}
          <div className="relative flex items-center justify-center my-3 sm:my-5 cursor-pointer" onClick={toggleListening}>
            {/* Concentric ambient ripples */}
            <div className={`absolute rounded-full transition-all duration-700 pointer-events-none ${
              status === 'speaking'
                ? 'w-48 h-48 bg-emerald-500/25 blur-2xl animate-ping'
                : status === 'listening'
                  ? 'w-52 h-52 bg-teal-400/20 blur-2xl animate-pulse'
                  : 'w-36 h-36 bg-emerald-500/10 blur-xl'
            }`} />

            <div className={`absolute rounded-full border border-emerald-500/30 transition-all duration-500 pointer-events-none ${
              status === 'speaking' ? 'w-40 h-40 scale-110' : status === 'listening' ? 'w-36 h-36 animate-spin' : 'w-32 h-32'
            }`} />

            {/* Core Glowing Orb */}
            <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 transition-all duration-500 shadow-2xl flex items-center justify-center relative ${
              status === 'speaking'
                ? 'bg-gradient-to-tr from-emerald-400 via-teal-300 to-cyan-400 shadow-emerald-500/50 scale-105'
                : status === 'listening'
                  ? 'bg-gradient-to-tr from-teal-400 via-emerald-400 to-amber-300 shadow-teal-400/50 scale-110 ring-4 ring-emerald-400/30'
                  : status === 'thinking'
                    ? 'bg-gradient-to-tr from-amber-400 to-orange-500 shadow-amber-400/30 animate-pulse'
                    : 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-700 hover:scale-105 shadow-emerald-500/30'
            }`}>
              <div className="w-full h-full rounded-full bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden">
                <span className="text-3xl sm:text-4xl filter drop-shadow">👩‍🍳</span>

                {/* Audio wave bars under avatar */}
                <div className="flex items-center gap-1 mt-1">
                  {[4, 8, 12, 8, 4].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${status === 'speaking' || status === 'listening' ? Math.max(4, (h * (status === 'speaking' ? 1.5 : 1.2))) : 3}px` }}
                      className={`w-1 rounded-full transition-all duration-200 ${
                        status === 'listening' ? 'bg-teal-400 animate-pulse' :
                        status === 'speaking' ? 'bg-emerald-400 animate-bounce' :
                        'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* User's Last Spoken Expression Badge */}
          {lastUserSpeech && (
            <div className="mb-2 max-w-lg px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 flex items-center gap-2 animate-in fade-in duration-300">
              <span className="text-emerald-400 font-black text-[10px] uppercase tracking-wider shrink-0">Tú:</span>
              <p className="truncate italic">"{lastUserSpeech}"</p>
            </div>
          )}

          {/* Sofia's Real-time Dynamic Hero Caption */}
          <div className="max-w-2xl text-center px-4 py-3 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-md shadow-lg min-h-[72px] flex items-center justify-center transition-all">
            {status === 'thinking' ? (
              <div className="flex items-center gap-2.5 text-amber-300 font-medium text-sm animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Sofía está preparando tu respuesta...</span>
              </div>
            ) : (
              <p className="text-base sm:text-lg font-medium leading-snug text-white/95 transition-all duration-300">
                "{currentSofiaSpeech || '¿Qué se te antoja ordenar el día de hoy?'}"
              </p>
            )}
          </div>

          {/* Visual Dish Carousel (Interactive Touch Ordering) */}
          <div className="w-full max-w-3xl mt-4 sm:mt-6">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Platillos Populares · Toca para ordenar
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
                      <span>Agregar</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Bottom Command Island (Voice Trigger & Dynamic Cart Pill) */}
        <div className="p-4 sm:p-6 border-t border-white/10 bg-black/40 backdrop-blur-xl shrink-0 flex flex-col gap-3">

          {/* Quick Prompts Carousel */}
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {[
              "🌟 ¿Qué me recomiendas?",
              "🥣 Chilaquiles con asada de pollo",
              "🍲 Caldos del día",
              "🥤 Bebidas y jugos",
              "✅ Ya es todo, la cuenta"
            ].map((promptText, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleUserInteraction(promptText)}
                className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-gray-300 hover:text-emerald-300 text-xs font-semibold whitespace-nowrap transition-all shrink-0 active:scale-95"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Text Input Row (Expandable via keyboard toggle) */}
          {isKeyboardOpen && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputText.trim()) handleUserInteraction(inputText);
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

            {/* Central Mic Pulse Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`flex-1 py-4 px-6 rounded-2xl font-black uppercase text-xs sm:text-sm tracking-wider flex items-center justify-center gap-3 transition-all shadow-xl cursor-pointer ${
                status === 'listening'
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/40 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/30 active:scale-95'
              }`}
            >
              {status === 'listening' ? (
                <>
                  <MicOff className="w-5 h-5" />
                  <span>Escuchando... Toca para pausar</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 animate-pulse" />
                  <span>Hablar con Sofía</span>
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
                  disabled={!deliveryMethod || (deliveryMethod === 'delivery' && !selectedAddress) || isSending}
                  onClick={handleSendToWhatsApp}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-sm tracking-wider flex items-center justify-center gap-3 transition-all shadow-xl ${
                    !deliveryMethod || (deliveryMethod === 'delivery' && !selectedAddress) || isSending
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
                      <span>Confirmar Pedido WhatsApp</span>
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
