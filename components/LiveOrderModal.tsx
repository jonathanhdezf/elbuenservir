import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X, Mic, MicOff, ShoppingCart, Send, Trash2, Loader2, Zap,
  Volume2, VolumeX, ChevronRight, MessageCircle, Phone, Lock,
  Check, Store, Truck, Sparkles, Key, Plus, Minus, CreditCard,
  Banknote, RefreshCw, HelpCircle, Utensils, Award, Clock
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
  sides?: string[];
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
  onTransferToCart?: (items: { dishId: string; name: string; variationLabel: string; price: number; quantity: number }[]) => void;
  onUpdateCustomer?: (customer: Customer) => void;
}

type SessionStatus = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

const RESTAURANT_PHONE = '2311024672';
const WHATSAPP_NUMBER = '522311024672';
const GEMINI_MODEL = 'gemini-flash-latest';

// Tool Declarations for Gemini
const updateOrderDeclaration = {
  name: "updateOrder",
  description: "Agrega, modifica la cantidad o elimina platillos del ticket del pedido.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: ["add", "remove", "update"],
        description: "Acción a realizar en el pedido: add para agregar, remove para quitar, update para cambiar cantidad o datos."
      },
      item: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Nombre exacto del platillo según el menú (ej. Chilaquiles, Chilpozo de res, Fresas con crema)" },
          variation: { type: Type.STRING, description: "Variación o tamaño (ej. Chicos, Grandes, Platillo, Vaso chico, Con asada de pollo)" },
          price: { type: Type.NUMBER, description: "Precio unitario según el menú" },
          quantity: { type: Type.NUMBER, description: "Cantidad de unidades (ej. 1, 2, 3)" }
        },
        required: ["name", "variation"]
      }
    },
    required: ["action", "item"]
  }
};

const completeOrderDeclaration = {
  name: "completeOrder",
  description: "Finaliza la toma de la orden cuando el cliente ya eligió sus platillos y desea pagar o cerrar.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderType: { type: Type.STRING, enum: ["pickup", "delivery"], description: "Forma de entrega: pickup (mostrador) o delivery (domicilio)" },
      deliveryAddress: { type: Type.STRING, description: "Dirección de entrega si es a domicilio." },
      paymentMethod: { type: Type.STRING, enum: ["efectivo", "tarjeta", "transferencia", "credito"], description: "Método de pago." },
      summary: { type: Type.STRING, description: "Resumen amable de lo ordenado y total." }
    }
  }
};

// Generador del contexto completo del restaurante y menú
function buildFullMenuContext(menuItems: MenuItem[], categories: Category[]): string {
  const lines: string[] = [
    "RESTAURANTE: El Buen Servir - Cocina tradicional mexicana, desayunos y guisados caseros.",
    "UBICACIÓN: Teziutlán, Puebla.",
    "TELÉFONO / WHATSAPP: 2311024672.",
    "HORARIO: Servicio abierto todos los días desde temprano para desayunos y comidas.",
    "FORMAS DE ENTREGA: 1) Recoger en Mostrador (sin costo), 2) Envío a Domicilio en Teziutlán.",
    "MÉTODOS DE PAGO: Efectivo (indicando con cuánto paga), Tarjeta bancaria (terminal al entregar), Transferencia bancaria, y Crédito de tienda (cuenta abierta para clientes con saldo autorizado).",
    "",
    "=== CATÁLOGO COMPLETO DE PLATILLOS Y PRECIOS VIGENTES ==="
  ];

  categories.forEach(cat => {
    const items = menuItems.filter(i => i.isActive && i.categoryId === cat.id);
    if (items.length === 0) return;
    lines.push(`\n[SECCIÓN: ${cat.name.toUpperCase()}]`);
    items.forEach(item => {
      const vars = item.variations.map(v => `${v.label}: $${v.price}`).join(' | ');
      lines.push(`• ${item.name} (${vars})${item.description ? ` - ${item.description}` : ''}`);
    });
  });

  lines.push("\n=== GUARNICIONES (Para acompañar platillos que la incluyan) ===");
  lines.push("Ensalada fresca de lechuga, Frijoles refritos caseros, Sopa fría de pasta, Verduras al vapor.");

  lines.push("\n=== ESPECIALIDADES MÁS VENDIDAS Y RECOMENDACIONES ===");
  lines.push("- Chilaquiles (salsa verde o roja, con pollo, queso, crema y aguacate; chico $60, grande $90, con asada de pollo $120, con asada de puerco $130).");
  lines.push("- Chilpozo de Res ($95): Caldo de res tradicional con verduras y toque de picante.");
  lines.push("- Pancita de Res (Medio $80, Litro $100): Delicioso y calientito fin de semana.");
  lines.push("- Enchiladas Suizas ($90): 5 piezas bañadas en salsa verde cremosa gratinadas.");
  lines.push("- Pechuga a la Diabla ($95): Rellena de queso panela en salsa diabla.");
  lines.push("- Tampiqueñas: Con arroz, frijoles, 3 enchiladas rojas y papas (Pollo $130, Puerco $140, Res $160).");
  lines.push("- Jugo de Naranja 100% natural (Medio litro $30, Litro $60).");
  lines.push("- Fresas con crema especiales (Vaso chico $40, Vaso grande $80).");

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
  const [transcript, setTranscript] = useState<{ role: 'ai' | 'user'; text: string; time: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery' | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [newAddressInput, setNewAddressInput] = useState('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [cashAmountPaid, setCashAmountPaid] = useState<string>('');
  const [lastModifiedId, setLastModifiedId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'ticket'>('chat');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
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

  // Scroll to bottom of chat
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Initial welcome message from Sofia
  useEffect(() => {
    if (isOpen && transcript.length === 0) {
      const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      let greeting = '';
      if (loggedCustomer) {
        const firstName = loggedCustomer.name.split(' ')[0];
        greeting = `¡Hola, ${firstName}! Qué alegría verte de nuevo en El Buen Servir. Soy Sofía, tu anfitriona virtual. ¿Qué se te antoja ordenar el día de hoy? Puedo prepararte unos ricos chilaquiles, caldos calientitos o lo que más te guste.`;
      } else {
        greeting = `¡Hola! Bienvenido a El Buen Servir, soy Sofía. Con mucho gusto te atiendo y tomo tu pedido. ¿Tienes algún platillo en mente o te gustaría que te recomiende nuestras especialidades de hoy?`;
      }

      setTranscript([{ role: 'ai', text: greeting, time: now }]);
      speakText(greeting);
    }
  }, [isOpen, loggedCustomer]);

  // Text to Speech
  const speakText = useCallback((text: string) => {
    if (isSpeakerMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

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
      utterance.onend = () => setStatus('idle');
      utterance.onerror = () => setStatus('idle');

      speechSynthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      setStatus('idle');
    }
  }, [isSpeakerMuted]);

  // Stop Speech
  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (status === 'speaking') {
      setStatus('idle');
    }
  }, [status]);

  // Speech Recognition (Microphone)
  const toggleSpeechRecognition = () => {
    if (isListeningSpeech) {
      stopSpeechRecognition();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta dictado por voz nativo. Puedes escribir tu mensaje en el campo de texto.");
      return;
    }

    stopSpeech();
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-MX';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListeningSpeech(true);
        setStatus('listening');
        soundManager.play('pop');
      };

      recognition.onresult = (event: any) => {
        const spokenText = event.results[0][0].transcript;
        if (spokenText) {
          handleUserMessage(spokenText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error", event.error);
        setIsListeningSpeech(false);
        setStatus('idle');
      };

      recognition.onend = () => {
        setIsListeningSpeech(false);
        if (status === 'listening') setStatus('idle');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition start failed", err);
      setIsListeningSpeech(false);
      setStatus('idle');
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) { }
    }
    setIsListeningSpeech(false);
    setStatus('idle');
  };

  // Add / Update item in Sofia's live ticket
  const updateCartItem = (action: 'add' | 'remove' | 'update', item: { name: string; variation: string; price: number; quantity?: number; dishId?: string }) => {
    const itemName = item.name.trim();
    const itemVar = item.variation.trim();
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;

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
          setLastModifiedId(target.id);
          return updated;
        } else {
          const newId = `sofia-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          setLastModifiedId(newId);
          return [...prev, {
            id: newId,
            dishId: item.dishId,
            name: itemName,
            variation: itemVar,
            price: item.price,
            quantity: qty
          }];
        }
      } else if (action === 'update') {
        if (matchIndex > -1) {
          const updated = [...prev];
          updated[matchIndex].quantity = qty;
          if (item.price) updated[matchIndex].price = item.price;
          setLastModifiedId(updated[matchIndex].id);
          return updated;
        }
      } else if (action === 'remove') {
        setLastModifiedId(null);
        return prev.filter((_, idx) => idx !== matchIndex);
      }
      return prev;
    });

    soundManager.play('add');
    setTimeout(() => setLastModifiedId(null), 1800);
  };

  // Local Intelligent Menu Matching & Hospitality Assistant Engine
  const runLocalAssistant = (userInput: string): { reply: string; orderAction?: any } => {
    const input = userInput.toLowerCase().trim();

    // 1. Check if user wants to finalize order
    const finalizeTriggers = ['es todo', 'seria todo', 'sería todo', 'la cuenta', 'ya es todo', 'finalizar', 'confirmar pedido', 'cerrar pedido', 'tomar orden'];
    if (finalizeTriggers.some(t => input.includes(t))) {
      if (cart.length === 0) {
        return {
          reply: "¡Con gusto! Pero aún no tienes platillos en tu orden. ¿Qué te gustaría ordenar primero? Tenemos chilaquiles, caldos, desayunos y ricos guisados del día."
        };
      }
      setIsFinalized(true);
      return {
        reply: `¡Excelente elección! Tu pedido tiene un total de $${cartTotal.toFixed(2)}. Para completar tu orden, ¿prefieres pasar a recogerlo en mostrador o te lo mandamos a domicilio?`,
        orderAction: { type: 'finalize' }
      };
    }

    // 2. Recommendations
    if (input.includes('recomiend') || input.includes('especialidad') || input.includes('favorito') || input.includes('sugier') || input.includes('mas vendido') || input.includes('más vendido')) {
      return {
        reply: "¡Con gusto! Te súper recomiendo nuestros Chilaquiles Especiales con asada de pollo ($120) o las Enchiladas Suizas gratinadas ($90). Si tienes antojo de algo bien calientito y tradicional, el Chilpozo de Res ($95) y la Pancita son una delicia. ¿Te gustaría ordenar alguno de ellos?"
      };
    }

    // 3. Questions about delivery or hours
    if (input.includes('domicilio') || input.includes('entrega') || input.includes('envio') || input.includes('envío')) {
      return {
        reply: "¡Por supuesto! Hacemos entregas a domicilio en Teziutlán y alrededores, o si prefieres, podemos tener tu orden lista en mostrador para cuando pases. ¿Deseas que te enviemos algo hoy?"
      };
    }

    // 4. Questions about payments
    if (input.includes('pago') || input.includes('tarjeta') || input.includes('transferencia') || input.includes('efectivo') || input.includes('credito') || input.includes('crédito')) {
      return {
        reply: "Aceptamos pago en efectivo al recibir (puedes indicarnos tu billete para llevarte cambio exacto), transferencia bancaria, tarjeta con terminal móvil al entregar y crédito de tienda para clientes registrados."
      };
    }

    // 5. Questions about beverages or desserts
    if (input.includes('bebida') || input.includes('jugo') || input.includes('refresco') || input.includes('cafe') || input.includes('café')) {
      return {
        reply: "De bebidas tenemos Jugo de Naranja 100% natural recién exprimido (medio litro en $30 o el litro en $60), café calientito y refrescos. ¿Te agrego un juguito de naranja bien fresco a tu orden?"
      };
    }

    if (input.includes('postre') || input.includes('fresa') || input.includes('dulce')) {
      return {
        reply: "Nuestras Fresas con Crema especiales de la casa son famosísimas. Tenemos vaso chico por $40 y vaso grande por $80. ¿Te gustaría consentirte con un vaso?"
      };
    }

    // 6. Removals
    if (input.startsWith('quita') || input.startsWith('elimina') || input.startsWith('borra') || input.includes('no quiero') || input.includes('cancela')) {
      for (const cartItem of cart) {
        if (input.includes(cartItem.name.toLowerCase())) {
          updateCartItem('remove', { name: cartItem.name, variation: cartItem.variation, price: cartItem.price });
          return {
            reply: `¡Listo! Ya retiré ${cartItem.name} (${cartItem.variation}) de tu ticket. ¿Gustas cambiarlo por otro platillo o bebida?`
          };
        }
      }
    }

    // 7. Quantity and Dish detection
    // Try to extract quantity
    let parsedQty = 1;
    if (input.includes('un ') || input.includes('una ')) parsedQty = 1;
    if (input.includes('dos ') || input.includes('2 ')) parsedQty = 2;
    if (input.includes('tres ') || input.includes('3 ')) parsedQty = 3;
    if (input.includes('cuatro ') || input.includes('4 ')) parsedQty = 4;
    if (input.includes('cinco ') || input.includes('5 ')) parsedQty = 5;

    // Search active menu items
    for (const item of menuItems.filter(i => i.isActive)) {
      const itemNameLower = item.name.toLowerCase();
      // Match keywords
      const match = itemNameLower.split(' ').some(word => word.length > 3 && input.includes(word)) || input.includes(itemNameLower);

      if (match) {
        // Choose variation
        let chosenVar = item.variations[0];
        if (item.variations.length > 1) {
          for (const v of item.variations) {
            const vLabel = v.label.toLowerCase();
            if (input.includes(vLabel) || (vLabel.includes('grande') && input.includes('grande')) || (vLabel.includes('chico') && input.includes('chico')) || (vLabel.includes('litro') && input.includes('litro')) || (vLabel.includes('asada') && input.includes('asada')) || (vLabel.includes('papas') && input.includes('papas'))) {
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

        const totalWithNew = cartTotal + (chosenVar.price * parsedQty);
        return {
          reply: `¡Con mucho gusto! Te he agregado ${parsedQty}x ${item.name} (${chosenVar.label}) por $${(chosenVar.price * parsedQty).toFixed(2)}. Tu orden lleva un subtotal de $${totalWithNew.toFixed(2)}. ¿Deseas agregar alguna bebida, postre o algo más?`
        };
      }
    }

    // Default polite response
    return {
      reply: `Te escucho con atención. Puedo tomar tu orden de cualquier platillo de nuestro menú, decirte precios, recomendarte las especialidades del día o preparar tu cuenta. ¿Qué se te antoja probar hoy?`
    };
  };

  // Process user message (via Gemini AI or Local Engine)
  const handleUserMessage = async (text: string) => {
    if (!text.trim()) return;
    stopSpeech();

    const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { role: 'user' as const, text: text.trim(), time: now };
    setTranscript(prev => [...prev, userMsg]);
    setInputText('');
    setStatus('thinking');

    // If Gemini API Key is available, invoke Gemini SDK
    if (hasApiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: resolvedApiKey });
        const menuContext = buildFullMenuContext(menuItems, categories);

        const customerInfo = loggedCustomer
          ? `Nombre del cliente: ${loggedCustomer.name}, Teléfono: ${loggedCustomer.phone}, Direcciones registradas: ${loggedCustomer.addresses?.join(' | ') || 'Ninguna'}, Crédito habilitado: ${loggedCustomer.creditEnabled ? 'Sí' : 'No'}.`
          : 'Cliente invitado no autenticado.';

        const currentCartText = cart.length > 0
          ? `TICKET ACTUAL:\n${cart.map(c => `- ${c.quantity}x ${c.name} (${c.variation}) a $${c.price} = $${c.price * c.quantity}`).join('\n')}\nTOTAL: $${cartTotal.toFixed(2)}`
          : 'El ticket actual está vacío.';

        const systemInstruction = `Eres "Sofía", la anfitriona y mesera virtual de atención al cliente de "El Buen Servir" en Teziutlán.
Tu personalidad es extraordinariamente cálida, sonriente, servicial, atenta y amena, con la hospitalidad mexicana más distinguida.
INFORMACIÓN DEL CLIENTE:
${customerInfo}

CONTEXTO DEL RESTAURANTE Y MENÚ:
${menuContext}

ESTADO DE LA ORDEN:
${currentCartText}

INSTRUCCIONES CLAVE:
1. Habla de forma muy amigable, fluida y con encanto. Si el cliente pregunta qué recomiendas, describe platillos con apetito y entusiasmo.
2. Si el cliente pide platillos, usa SIEMPRE la herramienta 'updateOrder' con action='add', especificando el nombre exacto, variación y precio según el catálogo.
3. Si el cliente pide quitar o cambiar un platillo, usa 'updateOrder' con action='remove' o 'update'.
4. Cuando el cliente diga "es todo", "la cuenta" o indique que terminó su pedido:
   - Haz un resumen breve y cordial.
   - Pregunta si desea recoger en mostrador o entrega a domicilio.
   - Si es a domicilio, sugiere su dirección registrada si existe, o pídele su dirección.
   - Pregunta la forma de pago (efectivo, tarjeta, transferencia o crédito).
   - Usa la herramienta 'completeOrder'.
5. Sé concisa en tus respuestas (máximo 2 a 3 oraciones para mantener la plática dinámica y no abrumar).
6. NUNCA inventes platillos que no estén en el menú.`;

        // Map recent history
        const recentHistory = transcript.slice(-6).map(t => ({
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

        // Check for function calls in candidates parts
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
              setIsFinalized(true);
              executedAction = true;
            }
          }
        }

        const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join(' ').trim();
        const replyText = textParts || response.text || (executedAction ? "¡Listo! Ya registré tu pedido. ¿Deseas agregar alguna bebida o algo más?" : "Con gusto te atiendo. ¿Qué más se te antoja?");
        const aiMsg = { role: 'ai' as const, text: replyText, time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) };
        setTranscript(prev => [...prev, aiMsg]);
        speakText(replyText);
        return;
      } catch (geminiError: any) {
        console.warn("Gemini call failed, falling back to local hospitality engine:", geminiError);
      }
    }

    // Fallback: Local Hospitality & Matching Engine
    setTimeout(() => {
      const { reply } = runLocalAssistant(text);
      const aiMsg = { role: 'ai' as const, text: reply, time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) };
      setTranscript(prev => [...prev, aiMsg]);
      speakText(reply);
    }, 400);
  };

  // Submit via Enter key
  const handleSubmitInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      handleUserMessage(inputText);
    }
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

  // Send Order to WhatsApp & register in database
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

    // If customer paid with credit, record cargo
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
        registeredBy: 'Sofía IA (Pedido Online)'
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
        notes: 'Pedido tomado por Sofía IA'
      };
      onAddOrder(newOrder);
    }

    window.open(waUrl, '_blank');
    setIsSending(false);
    onClose();
  };

  // Transfer Sofia's items to the main App Cart
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
    soundManager.play('success');
    onClose();
  };

  // Quick suggestion chips
  const quickSuggestions = [
    { label: "🌟 ¿Qué me recomiendas?", prompt: "¿Qué me recomiendas hoy?" },
    { label: "🥣 Chilaquiles y desayunos", prompt: "¿Qué opciones de chilaquiles y desayunos tienen?" },
    { label: "🍲 Caldos del día", prompt: "¿Cuáles son los caldos y guisados que tienen hoy?" },
    { label: "🥤 Jugos y postres", prompt: "¿Qué bebidas y postres tienen disponibles?" },
    { label: "🛵 ¿Tienen envío a domicilio?", prompt: "¿Cómo funciona el envío a domicilio y qué costo tiene?" },
    { label: "✅ Ya es todo mi pedido", prompt: "Eso sería todo, quiero finalizar mi orden." }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" onClick={onClose} />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col bg-gray-950 rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden border border-white/10 text-white">

        {/* Top Header */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-gray-900/70 backdrop-blur-md">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/30">
                <div className="w-full h-full bg-gray-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                  <span className="text-xl sm:text-2xl animate-pulse">👩‍🍳</span>
                  {status === 'speaking' && (
                    <div className="absolute inset-0 bg-emerald-500/20 animate-ping rounded-full" />
                  )}
                </div>
              </div>
              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-gray-950 ${
                status === 'listening' ? 'bg-emerald-500 animate-pulse' :
                status === 'thinking' ? 'bg-amber-400 animate-bounce' :
                status === 'speaking' ? 'bg-blue-400 animate-ping' :
                'bg-emerald-400'
              }`} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">Sofía IA</h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  En Vivo
                </span>
                {hasApiKey ? (
                  <span className="hidden sm:inline-flex text-[9px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                    Gemini 2.5
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex text-[9px] font-bold text-amber-400/90 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                    Modo Nativo
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-medium">
                {status === 'listening' ? 'Escuchando tu voz...' :
                 status === 'thinking' ? 'Sofía está pensando...' :
                 status === 'speaking' ? 'Sofía está hablando...' :
                 'Tu anfitriona y mesera virtual en El Buen Servir'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Speaker Sound Toggle */}
            <button
              type="button"
              onClick={() => {
                if (!isSpeakerMuted) stopSpeech();
                setIsSpeakerMuted(!isSpeakerMuted);
              }}
              title={isSpeakerMuted ? "Activar voz de Sofía" : "Silenciar voz de Sofía"}
              className={`p-2.5 rounded-xl border transition-all ${
                isSpeakerMuted
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {isSpeakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* API Key Modal Button */}
            <button
              type="button"
              onClick={() => setShowApiKeyModal(!showApiKeyModal)}
              title="Configurar Gemini API Key"
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
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
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="sm:hidden flex border-b border-white/10 bg-gray-900/40">
          <button
            type="button"
            onClick={() => setMobileTab('chat')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-2 transition-all ${
              mobileTab === 'chat'
                ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Plática con Sofía</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('ticket')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-2 transition-all ${
              mobileTab === 'ticket'
                ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Mi Ticket ({cartItemsCount}) · ${cartTotal.toFixed(2)}</span>
          </button>
        </div>

        {/* API Key Drawer Modal */}
        {showApiKeyModal && (
          <div className="p-4 sm:p-6 bg-gray-900 border-b border-white/10 space-y-4 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Configuración de Inteligencia Artificial (Gemini)</h3>
              </div>
              <button onClick={() => setShowApiKeyModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Sofía funciona con el modelo <strong>Gemini 2.5 Flash</strong>. Si deseas ingresar una clave personalizada de Google AI Studio, puedes pegarla aquí. Si no tienes una, Sofía continuará atendiendo con el <em>Motor Inteligente Nativo</em> con pleno conocimiento del menú.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('gemini_api_key', customApiKey.trim());
                  setShowApiKeyModal(false);
                  soundManager.play('success');
                }}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Guardar Clave
              </button>
            </div>
          </div>
        )}

        {/* Main Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left Column: Conversational Experience */}
          <div className={`flex-1 flex flex-col min-w-0 ${mobileTab === 'ticket' ? 'hidden sm:flex' : 'flex'}`}>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-gradient-to-b from-gray-950 via-gray-900/40 to-gray-950">
              {transcript.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}
                >
                  <div className={`flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    {msg.role === 'ai' ? (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shrink-0 shadow-md">
                        <div className="w-full h-full bg-gray-950 rounded-[10px] flex items-center justify-center text-xs">
                          👩‍🍳
                        </div>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-primary-500/20 border border-primary-500/30 shrink-0 flex items-center justify-center text-primary-400 font-bold text-xs">
                        {loggedCustomer ? loggedCustomer.name.charAt(0).toUpperCase() : 'Tú'}
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none'
                        : 'bg-white/10 border border-white/10 text-gray-100 rounded-tl-none backdrop-blur-md'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <div className={`mt-1.5 text-[10px] font-bold ${msg.role === 'user' ? 'text-emerald-200' : 'text-gray-400'} text-right`}>
                        {msg.time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Status Indicator inside Chat */}
              {status === 'thinking' && (
                <div className="flex items-center gap-2 text-xs text-gray-400 italic py-2 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Sofía está preparando tu respuesta...</span>
                </div>
              )}

              {status === 'speaking' && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 py-1">
                  <Volume2 className="w-4 h-4 animate-bounce" />
                  <span className="font-semibold">Sofía está respondiendo...</span>
                </div>
              )}

              <div ref={transcriptEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-4 py-2 bg-gray-900/60 border-t border-white/5 overflow-x-auto custom-scrollbar flex gap-2 shrink-0">
              {quickSuggestions.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleUserMessage(item.prompt)}
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-gray-300 hover:text-emerald-300 text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 active:scale-95"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSubmitInput} className="p-3 sm:p-4 bg-gray-900/90 border-t border-white/10 flex items-center gap-2 sm:gap-3">
              {/* Mic Button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                title={isListeningSpeech ? "Detener micrófono" : "Hablar con Sofía por voz"}
                className={`p-3.5 sm:p-4 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center shrink-0 ${
                  isListeningSpeech
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-500/40'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30'
                }`}
              >
                {isListeningSpeech ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe o habla: 'Quiero 2 chilaquiles con pollo y un jugo'..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/60 focus:bg-white/10 transition-all"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim()}
                title="Enviar mensaje"
                className={`p-3.5 sm:p-4 rounded-2xl transition-all shrink-0 ${
                  inputText.trim()
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20 active:scale-95'
                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Right Column: Ticket Vivo & Order Finalization */}
          <div className={`w-full sm:w-80 md:w-96 border-l border-white/10 flex flex-col bg-gray-900/40 backdrop-blur-md ${mobileTab === 'chat' ? 'hidden sm:flex' : 'flex'}`}>

            {/* Ticket Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-gray-900/60">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">Ticket Vivo</span>
              </div>
              <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                {cartItemsCount} {cartItemsCount === 1 ? 'platillo' : 'platillos'}
              </span>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 relative group ${
                    lastModifiedId === item.id
                      ? 'border-emerald-500 bg-emerald-500/15 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-white uppercase truncate">{item.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{item.variation}</p>
                      <p className="text-xs font-black text-emerald-400 mt-1">
                        ${(item.price * item.quantity).toFixed(2)}
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-gray-500 font-normal ml-1">
                            (${item.price} c/u)
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-black/40 rounded-xl p-1 border border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.quantity > 1) {
                            updateCartItem('update', { name: item.name, variation: item.variation, price: item.price, quantity: item.quantity - 1 });
                          } else {
                            updateCartItem('remove', { name: item.name, variation: item.variation, price: item.price });
                          }
                        }}
                        className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black px-1.5 text-white min-w-[18px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          updateCartItem('update', { name: item.name, variation: item.variation, price: item.price, quantity: item.quantity + 1 });
                        }}
                        className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateCartItem('remove', { name: item.name, variation: item.variation, price: item.price });
                        }}
                        className="p-1 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors ml-1"
                        title="Eliminar del ticket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Utensils className="w-7 h-7 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-gray-400">Tu orden está vacía</p>
                    <p className="text-[11px] text-gray-500 mt-1 max-w-[200px]">
                      Pídele a Sofía por voz o escribe lo que se te antoje ordenar.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery & Checkout Section */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-gray-950/80 space-y-4 shrink-0">
              {/* Total Row */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</span>
                <span className="text-2xl font-black text-white">${cartTotal.toFixed(2)}</span>
              </div>

              {/* Delivery & Payment Selection when cart has items */}
              {cart.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-white/10">

                  {/* Delivery Mode Buttons */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1.5">
                      ¿Cómo recibes tu pedido?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('pickup')}
                        className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all ${
                          deliveryMethod === 'pickup'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <Store className="w-4 h-4 text-emerald-400" />
                        <span>Mostrador</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('delivery')}
                        className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all ${
                          deliveryMethod === 'delivery'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <Truck className="w-4 h-4 text-emerald-400" />
                        <span>Domicilio</span>
                      </button>
                    </div>
                  </div>

                  {/* Address Selection if Delivery */}
                  {deliveryMethod === 'delivery' && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                        Dirección de Entrega
                      </label>
                      {loggedCustomer && loggedCustomer.addresses && loggedCustomer.addresses.length > 0 && (
                        <div className="space-y-1.5">
                          {loggedCustomer.addresses.map((addr, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedAddress(addr)}
                              className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                                selectedAddress === addr
                                  ? 'bg-emerald-500/20 border-emerald-500 text-white'
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                              }`}
                            >
                              <span className="truncate pr-2">{addr}</span>
                              {selectedAddress === addr && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Add new address option */}
                      {!isAddingNewAddress ? (
                        <button
                          type="button"
                          onClick={() => setIsAddingNewAddress(true)}
                          className="w-full py-2 border border-dashed border-white/20 rounded-xl text-[11px] font-bold text-gray-400 hover:text-emerald-300 hover:border-emerald-500/40 transition-colors"
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
                            className="flex-1 bg-black/50 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddNewAddress}
                            className="px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold"
                          >
                            Guardar
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment Method Selector */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1.5">
                      Forma de Pago
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethod('efectivo')}
                        className={`p-2 rounded-xl border text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                          selectedPaymentMethod === 'efectivo'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Efectivo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethod('tarjeta')}
                        className={`p-2 rounded-xl border text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                          selectedPaymentMethod === 'tarjeta'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                        <span>Tarjeta</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethod('transferencia')}
                        className={`p-2 rounded-xl border text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                          selectedPaymentMethod === 'transferencia'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Transferencia</span>
                      </button>

                      {loggedCustomer?.creditEnabled && (
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentMethod('credito')}
                          className={`p-2 rounded-xl border text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                            selectedPaymentMethod === 'credito'
                              ? 'bg-emerald-500/20 border-emerald-500 text-white'
                              : 'bg-white/5 border-white/10 text-gray-400'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5 text-purple-400" />
                          <span>Crédito</span>
                        </button>
                      )}
                    </div>

                    {/* Cash Change Input */}
                    {selectedPaymentMethod === 'efectivo' && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">¿Pagas con?</span>
                        <input
                          type="number"
                          placeholder={`$${cartTotal.toFixed(0)}`}
                          value={cashAmountPaid}
                          onChange={(e) => setCashAmountPaid(e.target.value)}
                          className="w-24 bg-black/50 border border-white/20 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                        {parseFloat(cashAmountPaid) >= cartTotal && (
                          <span className="text-[10px] text-emerald-400 font-bold">
                            Cambio: ${(parseFloat(cashAmountPaid) - cartTotal).toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Primary Action: Send to WhatsApp */}
                  <button
                    type="button"
                    disabled={
                      !deliveryMethod ||
                      (deliveryMethod === 'delivery' && !selectedAddress) ||
                      isSending
                    }
                    onClick={handleSendToWhatsApp}
                    className={`w-full py-3.5 rounded-2xl font-black uppercase text-xs sm:text-sm tracking-wider shadow-xl transition-all flex items-center justify-center gap-2.5 ${
                      !deliveryMethod || (deliveryMethod === 'delivery' && !selectedAddress) || isSending
                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30 active:scale-95'
                    }`}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enviando Pedido...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        <span>Confirmar en WhatsApp</span>
                      </>
                    )}
                  </button>

                  {/* Secondary Action: Transfer to App Cart */}
                  <button
                    type="button"
                    onClick={handleTransferToCart}
                    className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Pasar al Carrito de la Tienda</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
