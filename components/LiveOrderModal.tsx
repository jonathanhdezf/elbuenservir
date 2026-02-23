
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, MicOff, ShoppingCart, Send, Trash2, Loader2, Zap, Volume2, VolumeX, ChevronRight, MessageCircle, Phone, Lock, Check, Store, Truck } from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage, Type } from '@google/genai';
import { MenuItem, Category, Order, Customer } from '../types';

interface CartItem {
    id: string; // for unique identification
    name: string;
    variation: string;
    price: number;
    quantity: number;
}

interface LiveOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    menuItems: MenuItem[];
    categories: Category[];
    onAddOrder?: (order: Order) => void;
    loggedCustomer: Customer | null;
    onOpenAuth: () => void;
}

type SessionStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

const WHATSAPP_NUMBER = '522311024672';
const MODEL = "gemini-2.5-flash-native-audio-preview-09-2025";
const SAMPLE_RATE = 24000;

// ─── Tools Definition ────────────────────────────────────────────────────────

const updateOrderTool = {
    name: "updateOrder",
    description: "Agrega, actualiza o elimina platillos del ticket del pedido.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            action: { type: Type.STRING, enum: ["add", "remove", "update"], description: "La acción a realizar." },
            item: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Nombre del platillo (ej. Pozole, Taco)" },
                    variation: { type: Type.STRING, description: "Tamaño o variante (ej. Chico, Grande, Sencillo)" },
                    price: { type: Type.NUMBER, description: "Precio unitario" },
                    quantity: { type: Type.NUMBER, description: "Cantidad (ej. 1, 2, 3)" }
                },
                required: ["name", "variation"]
            }
        },
        required: ["action", "item"]
    }
};

const completeOrderTool = {
    name: "completeOrder",
    description: "Finaliza la toma del pedido. Solo úsala cuando tengas el nombre, teléfono y el método de entrega (mostrador o domicilio).",
    parameters: {
        type: Type.OBJECT,
        properties: {
            customerName: { type: Type.STRING, description: "Nombre completo del cliente." },
            customerPhone: { type: Type.STRING, description: "Número de teléfono de contacto." },
            orderType: { type: Type.STRING, enum: ["pickup", "delivery"], description: "¿Desea recoger en mostrador (pickup) o envío a domicilio (delivery)?" },
            deliveryAddress: { type: Type.STRING, description: "Dirección completa si es a domicilio. Si es pickup, puede ser vacío." },
            summary: { type: Type.STRING, description: "Resumen final del pedido." }
        },
        required: ["customerName", "customerPhone", "orderType"]
    }
};

// ─── Help Functions ─────────────────────────────────────────────────────────

function buildMenuSummary(menuItems: MenuItem[], categories: Category[]): string {
    const lines: string[] = ['=== MENÚ DE EL BUEN SERVIR ===\n'];
    categories.forEach(cat => {
        const items = menuItems.filter(i => i.isActive && i.categoryId !== 'cat-5'); // exclude plain sides from main list
        const catItems = items.filter(i => i.categoryId === cat.id);
        if (catItems.length === 0) return;
        lines.push(`\n--- ${cat.name.toUpperCase()} ---`);
        catItems.forEach(item => {
            const prices = item.variations.map(v => `${v.label}: $${v.price.toFixed(2)}`).join(' | ');
            lines.push(`• ${item.name} — ${prices}`);
        });
    });
    return lines.join('\n');
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LiveOrderModal({ isOpen, onClose, menuItems, categories, onAddOrder, loggedCustomer, onOpenAuth }: LiveOrderModalProps) {
    const [status, setStatus] = useState<SessionStatus>('idle');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [transcript, setTranscript] = useState<{ role: 'ai' | 'user'; text: string }[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
    const [isFinalized, setIsFinalized] = useState(false);
    const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery' | null>(null);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [lastModifiedId, setLastModifiedId] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);

    // Sync with logged customer
    useEffect(() => {
        if (loggedCustomer && loggedCustomer.addresses?.length > 0 && !selectedAddress) {
            setSelectedAddress(loggedCustomer.addresses[0]);
        }
    }, [loggedCustomer]);

    const sessionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
    const nextStartTimeRef = useRef<number>(0);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    // Sofia welcomes and guides the order
    useEffect(() => {
        if (!isFinalized && loggedCustomer && sessionRef.current && status !== 'connecting') {
            const timer = setTimeout(() => {
                try {
                    sessionRef.current?.send([{
                        text: `¡Hola, ${loggedCustomer.name}! Soy Sofía. Ya te tengo identificado. ¿Qué se te antoja de nuestro menú hoy? Díme tu pedido y con gusto te ayudo.`
                    }]);
                } catch (e) {
                    console.error('Sofia greeting failed', e);
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, status === 'listening']);

    // Sofia guides delivery choice after finalizing items
    useEffect(() => {
        if (isFinalized && loggedCustomer && sessionRef.current && status !== 'connecting') {
            try {
                const addressesCount = loggedCustomer.addresses?.length || 0;
                const hasAddress = deliveryMethod === 'delivery' && selectedAddress;

                let text = `¡Excelente elección! Tu pedido ya está listo. `;

                if (!deliveryMethod) {
                    text += "¿Prefieres pasar a recogerlo a mostrador o que te lo enviemos a domicilio?";
                } else if (deliveryMethod === 'delivery' && !selectedAddress) {
                    text += addressesCount > 0
                        ? `Veo que tienes registrada la dirección ${loggedCustomer.addresses[0]}. ¿Te lo enviamos ahí o prefieres dictarme una nueva?`
                        : "Por favor, díme a qué dirección te lo enviamos.";
                } else {
                    text += `Perfecto, lo pondré como ${deliveryMethod === 'pickup' ? 'recoger en mostrador' : 'envío a domicilio'}. Muchas gracias por tu preferencia en El Buen Servir, ${loggedCustomer.name}. ¡Fue un placer ayudarte! En unos segundos verás el resumen en tu WhatsApp. ¡Hasta pronto!`;
                    // Final automatic close timer - increased to 8s to allow full greeting
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('sofia-auto-send'));
                    }, 8000);
                }

                sessionRef.current?.send([{ text }]);
            } catch (e) {
                console.error('Sofia delivery guidance failed', e);
            }
        }
    }, [isFinalized, deliveryMethod, status === 'listening']); // Added deliveryMethod to deps for progressive guidance


    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    // ── Audio Engine ───────────────────────────────────────────────────────────

    const playAudio = useCallback((base64Data: string) => {
        if (!audioContextRef.current || isSpeakerMuted) return;

        const binaryString = atob(base64Data);
        const pcm16 = new Int16Array(binaryString.length / 2);
        for (let i = 0; i < pcm16.length; i++) {
            pcm16[i] = binaryString.charCodeAt(i * 2) | (binaryString.charCodeAt(i * 2 + 1) << 8);
        }

        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768.0;

        const buffer = audioContextRef.current.createBuffer(1, float32.length, SAMPLE_RATE);
        buffer.getChannelData(0).set(float32);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);

        const currentTime = audioContextRef.current.currentTime;
        if (nextStartTimeRef.current < currentTime) {
            nextStartTimeRef.current = currentTime;
        }

        source.start(nextStartTimeRef.current);
        activeSourcesRef.current.push(source);
        source.onended = () => {
            activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
        };

        nextStartTimeRef.current += buffer.duration;
    }, [isSpeakerMuted]);

    const stopAllAudio = () => {
        activeSourcesRef.current.forEach(s => { try { s.stop(); } catch (e) { } });
        activeSourcesRef.current = [];
        nextStartTimeRef.current = 0;
    };

    const floatTo16BitPCM = (input: Float32Array) => {
        const output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return output;
    };

    // ── Logic Dispatch ────────────────────────────────────────────────────────

    const handleToolCalls = useCallback(async (functionCalls: any[]) => {
        const responses = [];

        for (const call of functionCalls) {
            if (call.name === "updateOrder") {
                const { action, item } = call.args;
                const itemName = item.name.trim();
                const itemVar = item.variation.trim();

                setCart(prev => {
                    const itemKey = (name: string, variation: string) => `${name.toLowerCase().trim()}-${variation.toLowerCase().trim()}`;
                    const targetKey = itemKey(itemName, itemVar);

                    const existing = prev.find(i => itemKey(i.name, i.variation) === targetKey);

                    if (action === "add" || action === "update") {
                        if (existing) {
                            setLastModifiedId(existing.id);
                            return prev.map(i => itemKey(i.name, i.variation) === targetKey
                                ? { ...i, quantity: action === "add" ? i.quantity + (item.quantity || 1) : item.quantity || 1, price: item.price || i.price }
                                : i
                            );
                        }
                        const newId = `item-${Date.now()}-${Math.random()}`;
                        setLastModifiedId(newId);
                        return [...prev, { id: newId, name: itemName, variation: itemVar, price: item.price || 0, quantity: item.quantity || 1 }];
                    } else if (action === "remove") {
                        setLastModifiedId(null);
                        return prev.filter(i => itemKey(i.name, i.variation) !== targetKey);
                    }
                    return prev;
                });

                // Reset highlight after a delay
                setTimeout(() => setLastModifiedId(null), 2000);

                responses.push({ name: "updateOrder", response: { success: true }, id: call.id });
            } else if (call.name === "completeOrder") {
                const { deliveryAddress: address, orderType } = call.args;
                if (address) setSelectedAddress(address);
                if (orderType) setDeliveryMethod(orderType === 'delivery' ? 'delivery' : 'pickup');
                setIsFinalized(true);
                responses.push({ name: "completeOrder", response: { success: true }, id: call.id });
            }
        }

        if (sessionRef.current && responses.length > 0) {
            sessionRef.current.sendToolResponse({ functionResponses: responses });
        }
    }, []);

    // ── Session ───────────────────────────────────────────────────────────────

    const disconnect = useCallback(() => {
        stopAllAudio();
        if (sessionRef.current) { sessionRef.current.close(); sessionRef.current = null; }
        if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
        if (sourceRef.current) { sourceRef.current.disconnect(); sourceRef.current = null; }
        if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
        setStatus('idle');
    }, [stopAllAudio]); // Added stopAllAudio to dependencies

    const connect = async () => {
        setStatus('connecting');
        setTranscript([]);
        setCart([]);
        setIsFinalized(false);

        try {
            audioContextRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);

            const apiKey = (process.env as any).GEMINI_API_KEY || (process.env as any).API_KEY || '';
            const ai = new GoogleGenAI({ apiKey });

            const menuText = buildMenuSummary(menuItems, categories);
            const systemInstruction = `Eres "Sofía", asistente de voz para El Buen Servir. El usuario es ${loggedCustomer?.name}.
      
      FLUJO CRÍTICO:
      1. Saluda y toma el pedido del MENÚ: ${menuText}. Usa 'updateOrder' siempre.
      2. Cuando digan "es todo" o similar, pregunta: "¿Pasas a recogerlo o es a domicilio?".
      3. Si es a domicilio, sugiere su dirección registrada: ${loggedCustomer?.addresses?.[0] || 'no tiene'}.
      4. Si eligen una dirección (la registrada o una nueva) O eligen recoger, confirma los datos finales.
      5. Únicamente cuando tengas: Items + Método (Pickup/Delivery) + Dirección (si aplica), usa 'completeOrder'.
      
      REGLAS:
      - Sé muy profesional y breve.
      - Al usar 'completeOrder', despídete amablemente agradeciendo la preferencia.`;

            sessionRef.current = await ai.live.connect({
                model: MODEL,
                config: {
                    responseModalities: [Modality.AUDIO],
                    systemInstruction,
                    tools: [{ functionDeclarations: [updateOrderTool, completeOrderTool] }],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } } }
                },
                callbacks: {
                    onopen: () => {
                        console.log("Live session opened");
                        setStatus('listening');
                        setTranscript([{ role: 'ai', text: '¡Bienvenido a El Buen Servir! Soy Sofía. ¿Qué desea ordenar?' }]);

                        // Start streaming mic
                        if (!audioContextRef.current || !sourceRef.current) return;
                        processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                        sourceRef.current.connect(processorRef.current);
                        processorRef.current.connect(audioContextRef.current.destination);

                        processorRef.current.onaudioprocess = (e) => {
                            if (isMuted || !sessionRef.current) return;
                            const input = e.inputBuffer.getChannelData(0);
                            const pcm = floatTo16BitPCM(input);
                            const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm.buffer)));
                            sessionRef.current.sendRealtimeInput({
                                media: { data: base64, mimeType: "audio/pcm;rate=24000" }
                            });
                        };
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        // Audio responses
                        if (msg.serverContent?.modelTurn?.parts) {
                            setStatus('speaking');
                            msg.serverContent.modelTurn.parts.forEach(part => {
                                if (part.inlineData) playAudio(part.inlineData.data);
                                if (part.text) {
                                    setTranscript(prev => {
                                        const last = prev[prev.length - 1];
                                        if (last?.role === 'ai') return [...prev.slice(0, -1), { role: 'ai', text: last.text + " " + part.text }];
                                        return [...prev, { role: 'ai', text: part.text! }];
                                    });
                                }
                            });
                        }

                        if (msg.serverContent?.interrupted) stopAllAudio();
                        if (msg.serverContent?.turnComplete) setStatus('listening');

                        // Tool Execution
                        if (msg.toolCall?.functionCalls) {
                            handleToolCalls(msg.toolCall.functionCalls);
                        }
                    },
                    onerror: (err) => { console.error("Live error:", err); setStatus('error'); },
                    onclose: () => { console.log("Live session closed"); setStatus('idle'); }
                }
            });

        } catch (err) {
            console.error("Connection failed:", err);
            setStatus('error');
        }
    };

    useEffect(() => {
        const handleAutoSend = () => {
            if (isFinalized && deliveryMethod && (deliveryMethod === 'pickup' || selectedAddress)) {
                sendToWhatsApp(true); // pass true for automatic flow
            }
        };
        window.addEventListener('sofia-auto-send', handleAutoSend);
        return () => window.removeEventListener('sofia-auto-send', handleAutoSend);
    }, [isFinalized, deliveryMethod, selectedAddress, cart]);

    useEffect(() => { if (!isOpen) disconnect(); }, [isOpen, disconnect]);

    // ── Render Helpers ────────────────────────────────────────────────────────

    const sendToWhatsApp = (isAuto: boolean = false) => {
        if (!loggedCustomer || isSending) return;
        setIsSending(true);

        const orderId = `LIVE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        // Prepare the order object
        if (onAddOrder) {
            const newOrder: Order = {
                id: orderId,
                customerName: loggedCustomer.name,
                customerPhone: loggedCustomer.phone,
                address: deliveryMethod === 'delivery' ? selectedAddress : 'Mostrador',
                items: cart.map(i => ({
                    id: i.id,
                    name: i.name,
                    variationLabel: i.variation,
                    price: i.price,
                    quantity: i.quantity
                })),
                total: cartTotal,
                status: 'pending',
                paymentMethod: 'efectivo',
                paymentStatus: 'pending',
                createdAt: new Date().toISOString(),
                source: 'online'
            };
            onAddOrder(newOrder);
        }

        const itemsText = cart.map(i => `• ${i.name} (${i.variation}) x${i.quantity} - $${(i.price * i.quantity).toFixed(2)}`).join('\n');
        const delivery = deliveryMethod === 'pickup' ? '🏪 Recoger' : `🏠 Domicilio: ${selectedAddress}`;
        const msg = `*🎙️ PEDIDO EN VIVO (SOFÍA AI)*\n🆔 #${orderId}\n👤 ${loggedCustomer.name}\n📱 ${loggedCustomer.phone}\n${delivery}\n\n*PEDIDO:*\n${itemsText}\n\n*TOTAL: $${cartTotal.toFixed(2)}*`;

        const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

        if (isAuto) {
            // Use location.href for auto flow to avoid popup blockers and ensure it works on mobile
            window.location.href = waUrl;
        } else {
            window.open(waUrl, '_blank');
            handleClose();
        }
    };

    const handleClose = () => { disconnect(); onClose(); };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={handleClose} />
            <div className="relative z-10 w-full max-w-4xl h-[90vh] flex flex-col bg-gray-950 rounded-[40px] shadow-2xl overflow-hidden border border-white/10">

                {/* Header */}
                <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-gray-900/50">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                                <Zap className="w-7 h-7 text-white" />
                            </div>
                            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${status === 'listening' ? 'bg-emerald-500' : status === 'speaking' ? 'bg-blue-500' : 'bg-gray-500'}`} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tighter">Pedido en Vivo</h2>
                            <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">{status}</p>
                        </div>
                    </div>
                    <button title="Cerrar modal" onClick={handleClose} className="p-3 bg-white/10 text-white rounded-xl hover:bg-red-500/20"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Conversation */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {status === 'idle' ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
                                <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-2xl animate-pulse">
                                    <Mic className="w-10 h-10" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-2xl font-black text-white mb-2">Habla con Sofía</h3>
                                    <p className="text-gray-400 text-sm max-w-xs">Ella tomará tu pedido usando inteligencia artificial de voz en tiempo real.</p>
                                </div>
                                <button
                                    onClick={connect}
                                    className="px-10 py-5 bg-primary-500 hover:bg-primary-400 text-white rounded-[24px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary-500/20"
                                >
                                    Iniciar Sesión de Voz
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col min-w-0 bg-gray-900/50">
                                <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                                    {transcript.map((t, i) => (
                                        <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-${t.role === 'user' ? 'right' : 'left'}-4 duration-500`}>
                                            <div className={`max-w-[80%] p-5 rounded-[24px] ${t.role === 'user' ? 'bg-primary-500 text-white' : 'bg-white/5 border border-white/10 text-gray-200'}`}>
                                                <p className="text-sm font-medium leading-relaxed">{t.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={transcriptEndRef} />
                                </div>

                                {isFinalized && loggedCustomer && (
                                    <div className="p-8 bg-gray-900/95 border-t border-white/10 space-y-6 animate-in slide-in-from-bottom-6 duration-500 backdrop-blur-md relative z-20">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                                    <Check className="w-6 h-6 text-emerald-500" /> Confirmar Entrega
                                                </h4>
                                                <div className="px-3 py-1 bg-primary-500/20 rounded-full border border-primary-500/30">
                                                    <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest">{loggedCustomer.name}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => setDeliveryMethod('pickup')}
                                                    className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all duration-300 ${deliveryMethod === 'pickup' ? 'border-primary-500 bg-primary-500/10 text-white shadow-lg shadow-primary-500/10' : 'border-white/5 bg-white/5 text-gray-500 hover:bg-white/10'}`}
                                                >
                                                    <div className={`p-3 rounded-2xl ${deliveryMethod === 'pickup' ? 'bg-primary-500 text-white' : 'bg-white/5'}`}>
                                                        <Store className="w-6 h-6" />
                                                    </div>
                                                    <span className="text-xs font-black uppercase tracking-widest">Mostrador</span>
                                                </button>
                                                <button
                                                    onClick={() => setDeliveryMethod('delivery')}
                                                    className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all duration-300 ${deliveryMethod === 'delivery' ? 'border-primary-500 bg-primary-500/10 text-white shadow-lg shadow-primary-500/10' : 'border-white/5 bg-white/5 text-gray-500 hover:bg-white/10'}`}
                                                >
                                                    <div className={`p-3 rounded-2xl ${deliveryMethod === 'delivery' ? 'bg-primary-500 text-white' : 'bg-white/5'}`}>
                                                        <Truck className="w-6 h-6" />
                                                    </div>
                                                    <span className="text-xs font-black uppercase tracking-widest">Domicilio</span>
                                                </button>
                                            </div>

                                            {deliveryMethod === 'delivery' && (
                                                <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                                    <div className="flex items-center justify-between px-1">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">¿A qué dirección enviamos?</label>
                                                        <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Registrada o Nueva</span>
                                                    </div>
                                                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                                                        {loggedCustomer.addresses?.map((addr, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => setSelectedAddress(addr)}
                                                                className={`p-4 rounded-2xl border-2 text-left text-xs transition-all duration-300 group flex items-center justify-between ${selectedAddress === addr ? 'border-primary-500 bg-primary-500/20 text-white' : 'border-white/5 bg-white/5 text-gray-500 hover:border-white/10'}`}
                                                            >
                                                                <span className="font-bold truncate pr-4">{addr}</span>
                                                                {selectedAddress === addr && <Check className="w-4 h-4 text-primary-500 shrink-0" />}
                                                            </button>
                                                        ))}
                                                        <button
                                                            onClick={() => { const a = prompt("Nueva dirección:"); if (a) setSelectedAddress(a); }}
                                                            className="p-4 rounded-2xl border-2 border-dashed border-white/10 text-gray-500 text-xs text-center font-black uppercase tracking-widest hover:border-primary-500/50 hover:text-primary-400 transition-all"
                                                        >
                                                            + Agregar Nueva Dirección
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pt-2">
                                                <button
                                                    disabled={!deliveryMethod || (deliveryMethod === 'delivery' && !selectedAddress) || isSending}
                                                    onClick={() => sendToWhatsApp(false)}
                                                    className={`w-full py-6 rounded-3xl font-black uppercase text-base tracking-[0.2em] shadow-2xl transition-all duration-500 flex items-center justify-center gap-4
                                   ${(!deliveryMethod || (deliveryMethod === 'delivery' && !selectedAddress) || isSending)
                                                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                                                            : 'bg-emerald-500 text-white hover:scale-[1.02] hover:bg-emerald-400 shadow-emerald-500/30'
                                                        }`}
                                                >
                                                    {isSending ? (
                                                        <>
                                                            <Loader2 className="w-7 h-7 animate-spin" />
                                                            <span>Enviando...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <MessageCircle className="w-7 h-7" />
                                                            <span>Enviar a WhatsApp</span>
                                                        </>
                                                    )}
                                                </button>
                                                <p className="text-center text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-4">
                                                    {isSending ? 'Abriendo WhatsApp...' : 'Al confirmar, se enviará el resumen del pedido a WhatsApp'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="p-4 flex items-center justify-center gap-4 bg-black/40">
                                    <button
                                        title={isMuted ? "Activar micrófono" : "Silenciar micrófono"}
                                        onClick={() => setIsMuted(!isMuted)}
                                        className={`p-4 rounded-full ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white'}`}
                                    >
                                        {isMuted ? <MicOff /> : <Mic />}
                                    </button>
                                    <div className="flex h-1 gap-1 w-24">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div
                                                key={i}
                                                className={`flex-1 bg-primary-500/30 rounded-full transition-all duration-300 ${status === 'listening' ? 'animate-bounce' : ''} delay-${i * 100}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Ticket */}
                    <div className="w-80 border-l border-white/10 flex flex-col bg-gray-900/30">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <span className="text-xs font-black text-white uppercase tracking-widest">Ticket Vivo</span>
                            <ShoppingCart className="w-4 h-4 text-primary-400" />
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {cart.map((item) => (
                                <div
                                    key={item.id}
                                    className={`bg-white/5 border rounded-2xl p-4 transition-all duration-500 transform ${lastModifiedId === item.id
                                        ? 'border-primary-500 scale-105 bg-primary-500/10 shadow-lg shadow-primary-500/20'
                                        : 'border-white/10'
                                        }`}
                                >
                                    <p className="text-white font-black text-xs uppercase truncate">{item.name}</p>
                                    <p className="text-gray-500 text-[9px] font-bold uppercase">{item.variation}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-primary-500 font-black text-xs">x{item.quantity}</span>
                                        <span className="text-white font-black text-xs">${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                            {cart.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-3 py-12">
                                    <ShoppingCart className="w-10 h-10 opacity-30" />
                                    <p className="text-xs font-black uppercase tracking-widest text-center">Tu pedido aparecerá aquí</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-white/10">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Total</span>
                                <span className="text-2xl font-black text-white">${cartTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
