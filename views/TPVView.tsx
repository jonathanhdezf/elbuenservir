import React, { useEffect, useState } from 'react';
import {
    Monitor, LogIn, X, ShoppingBag,
    User, Key, AlertCircle, ChevronDown,
    Plus, Minus, Trash2, CheckCircle, Search,
    Sun, Moon, Phone, Clipboard, Map, Utensils, MapPin,
    ChevronLeft, ChevronRight, ArrowLeft, MessageSquare, Check
} from 'lucide-react';
import { MenuItem, Category, Order, OrderItem, Staff, Customer, PaymentMethod } from '../types';
import { soundManager } from '../utils/soundManager';
import { generateTicket } from '../utils/printTicket';
import { useMobileBack } from '../hooks/useMobileBack';
import {
    TLAYOYO_SALSAS,
    TLAYOYO_CHEESE_OPTIONS,
    DEFAULT_TLAYOYO_SELECTION,
    TlayoyoSelection,
    isTlayoyoDish,
    toggleTlayoyoSalsa,
    toggleTlayoyoSalsaAparte,
    setTlayoyoSinSalsa,
    formatTlayoyoVariationLabel
} from '../utils/tlayoyoConfig';

interface TPVViewProps {
    categories: Category[];
    menuItems: MenuItem[];
    staff: Staff[];
    customers: Customer[];
    orders: Order[];
    onAddOrder: (order: Partial<Order>) => void;
    onUpdateOrder?: (order: Partial<Order>) => void;
    onAddCustomer: (customer: Customer) => void;
    updateCustomerStats: (name: string, phone: string, amount: number, adding?: boolean) => void;
    initialOrder?: Order | null;
    initialTable?: string | null;
    isDarkMode: boolean;
    setIsDarkMode: (val: boolean) => void;
    onExit: () => void;
}

export default function TPVView({
    categories,
    menuItems,
    staff,
    customers,
    orders,
    onAddOrder,
    onUpdateOrder,
    onAddCustomer,
    updateCustomerStats,
    initialOrder,
    initialTable,
    isDarkMode,
    setIsDarkMode,
    onExit
}: TPVViewProps) {
    const [loggedInStaff, setLoggedInStaff] = useState<Staff | null>(null);
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState<string | null>(null);

    // TPV States
    const [activeTab, setActiveTab] = useState(categories[0]?.id || '');
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [orderNotes, setOrderNotes] = useState('');
    const [editingItemNoteKey, setEditingItemNoteKey] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTable, setSelectedTable] = useState<string>(initialTable || 'Mostrador');
    const [selectedAddress, setSelectedAddress] = useState<string>('');
    const [activePosView, setActivePosView] = useState<'menu' | 'cart'>('menu');
    const [tlayoyoSelections, setTlayoyoSelections] = useState<Record<string, TlayoyoSelection>>({});
    const [lastAddedToast, setLastAddedToast] = useState<string | null>(null);

    // Modal States
    const [modalType, setModalType] = useState<'none' | 'location' | 'onboarding' | 'registration' | 'payment'>('none');
    const [tempCustomer, setTempCustomer] = useState<Customer | null>(null);
    const [regName, setRegName] = useState('');
    const [regAddress, setRegAddress] = useState('');

    // Payment States
    const [tpvPaymentMethod, setTpvPaymentMethod] = useState<PaymentMethod>('efectivo');
    const [cashReceived, setCashReceived] = useState<string>('');
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const categoriesScrollRef = React.useRef<HTMLDivElement>(null);

    const scrollCategories = (direction: 'left' | 'right') => {
        if (categoriesScrollRef.current) {
            const scrollAmount = 220;
            categoriesScrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Mobile Back Button Navigation Logic
    const hasOpenTpvModal = modalType !== 'none';
    const handleCloseTpvModal = () => setModalType('none');

    useMobileBack({
        hasOpenModal: hasOpenTpvModal,
        onCloseModal: handleCloseTpvModal,
        hasSubSection: activePosView === 'cart',
        onBackSubSection: () => setActivePosView('menu'),
        onExit: () => {
            if (loggedInStaff) {
                setLoggedInStaff(null);
            } else {
                onExit();
            }
        }
    });

    // Sync preselected table when opened from Despacho Local
    useEffect(() => {
        if (initialTable && !initialOrder) {
            setSelectedTable(initialTable);
            setSelectedAddress('');
        }
    }, [initialTable, initialOrder]);

    // Initial Order Logic (editing existing table order from Despacho Local)
    useEffect(() => {
        if (initialOrder) {
            const itemsWithOldStatus = initialOrder.items.map(item => ({ ...item, isOld: true }));
            setCart(itemsWithOldStatus);
            setCustomerName(initialOrder.customerName);
            setCustomerPhone(initialOrder.customerPhone);
            setOrderNotes(initialOrder.notes || '');

            if (initialOrder.address?.includes('Mesa:')) {
                const tableName = initialOrder.address.split('Mesa:')[1]?.trim();
                setSelectedTable(tableName || 'Mostrador');
                setSelectedAddress('');
            } else if (initialOrder.address?.startsWith('Domicilio:')) {
                setSelectedTable('Mostrador');
                setSelectedAddress(initialOrder.address.replace('Domicilio:', '').trim());
            } else {
                setSelectedTable('Mostrador');
                setSelectedAddress('');
            }

            if (initialOrder.waiterId) {
                const waiter = staff.find(s => s.id === initialOrder.waiterId);
                if (waiter) setLoggedInStaff(waiter);
            }

            soundManager.play('confirm');
        }
    }, [initialOrder, staff]);

    useEffect(() => {
        if (!lastAddedToast) return;
        const timer = setTimeout(() => setLastAddedToast(null), 1800);
        return () => clearTimeout(timer);
    }, [lastAddedToast]);

    const isTableOccupied = (tableName: string) => {
        return orders.some(o =>
            o.address?.toLowerCase().includes(`mesa: ${tableName.toLowerCase()}`) &&
            !['delivered', 'cancelled'].includes(o.status)
        );
    };

    const handlePhoneSearch = (phone: string) => {
        setCustomerPhone(phone);
        const cleanedInput = phone.replace(/\D/g, '');

        if (cleanedInput.length >= 10) {
            const found = customers.find(c => c.phone.replace(/\D/g, '').includes(cleanedInput));

            if (found) {
                if (tempCustomer?.id !== found.id) {
                    setTempCustomer(found);
                    setCustomerName(found.name);
                    // Only ask for location if not already bound to a specific table from entry
                    if (!initialTable && !initialOrder && selectedTable === 'Mostrador') {
                        setModalType('location');
                    }
                    soundManager.play('notification');
                }
            } else {
                if (cleanedInput.length === 10 && modalType === 'none') {
                    setModalType('onboarding');
                    soundManager.play('alert');
                }
            }
        } else {
            if (cleanedInput.length < 10 && tempCustomer) {
                setTempCustomer(null);
                setCustomerName('');
            }
        }
    };

    const handleQuickSale = () => {
        setCustomerName(selectedTable === 'Mostrador' ? 'Público General' : `Mesa ${selectedTable}`);
        setCustomerPhone('0000000000');
        setModalType('none');
        soundManager.play('click');
    };

    const handleSelectLocation = (type: 'mostrador' | 'mesa' | 'address', value?: string) => {
        if (type === 'mostrador') {
            setSelectedTable('Mostrador');
            setSelectedAddress('');
        } else if (type === 'mesa') {
            setSelectedTable(value || '1');
            setSelectedAddress('');
        } else if (type === 'address') {
            setSelectedTable('Mostrador');
            setSelectedAddress(value || '');
        }
        setModalType('none');
        soundManager.play('confirm');
    };

    const handleRegisterCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!regName.trim()) return;

        const newCustomer: Customer = {
            id: `C-${Date.now().toString().slice(-4)}`,
            name: regName,
            phone: customerPhone,
            addresses: regAddress ? [regAddress] : [],
        };

        onAddCustomer(newCustomer);
        setCustomerName(newCustomer.name);
        setTempCustomer(newCustomer);
        if (!initialTable && !initialOrder && selectedTable === 'Mostrador') {
            setModalType('location');
        } else {
            setModalType('none');
        }
        setRegName('');
        setRegAddress('');
        soundManager.play('confirm');
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const user = staff.find(s => s.id === selectedStaffId);
        if (user && user.password === password) {
            setLoggedInStaff(user);
            setLoginError(null);
            soundManager.play('confirm');
        } else {
            setLoginError('Contraseña incorrecta');
            soundManager.play('error');
        }
    };

    const handleLogout = () => {
        setLoggedInStaff(null);
        setSelectedStaffId('');
        setPassword('');
        soundManager.play('navigation');
    };

    const getCartVariationQty = (itemId: string, variationLabel: string) => {
        return cart
            .filter(i => i.id === itemId && i.variationLabel === variationLabel)
            .reduce((sum, i) => sum + i.quantity, 0);
    };

    const addToCart = (item: MenuItem, variation: any, delta: number = 1) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id && i.variationLabel === variation.label && !i.notes);
            if (existing) {
                return prev.map(i => i === existing
                    ? { ...i, quantity: i.quantity + delta, isOld: false }
                    : i
                );
            }
            return [...prev, {
                id: item.id,
                name: item.name,
                variationLabel: variation.label,
                price: variation.price,
                quantity: delta,
                isOld: false
            }];
        });
        setLastAddedToast(`${delta > 1 ? `${delta}× ` : ''}${item.name} agregado`);
        soundManager.play('click');
    };

    const decrementCartVariation = (itemId: string, variationLabel: string) => {
        setCart(prev => {
            const matchIdx = [...prev]
                .reverse()
                .findIndex(i => i.id === itemId && i.variationLabel === variationLabel);
            if (matchIdx === -1) return prev;
            const targetIndex = prev.length - 1 - matchIdx;
            const target = prev[targetIndex];
            if (target.quantity <= 1) {
                return prev.filter((_, idx) => idx !== targetIndex);
            }
            return prev.map((item, idx) =>
                idx === targetIndex ? { ...item, quantity: item.quantity - 1 } : item
            );
        });
        soundManager.play('click');
    };

    const updateQuantity = (index: number, delta: number) => {
        setCart(prev => {
            const target = prev[index];
            if (!target) return prev;
            const nextQty = target.quantity + delta;
            if (nextQty <= 0) {
                return prev.filter((_, idx) => idx !== index);
            }
            return prev.map((item, idx) =>
                idx === index ? { ...item, quantity: nextQty } : item
            );
        });
        soundManager.play('click');
    };

    const updateItemNote = (index: number, note: string) => {
        setCart(prev => prev.map((item, idx) =>
            idx === index
                ? { ...item, notes: note }
                : item
        ));
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, idx) => idx !== index));
        setEditingItemNoteKey(null);
        soundManager.play('click');
    };

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalPieces = cart.reduce((acc, item) => acc + item.quantity, 0);

    const resolvedCustomerName = customerName.trim() || (selectedTable === 'Mostrador' ? 'Público General' : `Mesa ${selectedTable}`);
    const locationSummaryLabel = selectedAddress
        ? `Domicilio`
        : selectedTable === 'Mostrador'
            ? 'Mostrador'
            : `Mesa ${selectedTable}`;

    const handleFinalizeOrder = () => {
        if (cart.length === 0) {
            setPaymentError('Agrega al menos un platillo a la comanda');
            return;
        }

        // Pedidos en Mostrador o Domicilio piden cobro; pedidos en Mesa van directo a cocina con cuenta abierta
        if (selectedTable === 'Mostrador') {
            if (!customerName.trim()) {
                setCustomerName('Público General');
            }
            setModalType('payment');
            setPaymentError(null);
            setCashReceived('');
            soundManager.play('notification');
        } else {
            handleConfirmPayment('pending');
        }
    };

    const handleConfirmPayment = (status: 'paid' | 'pending') => {
        const cashValue = parseFloat(cashReceived) || 0;
        if (status === 'paid' && tpvPaymentMethod === 'efectivo' && cashValue < cartTotal) {
            setPaymentError('El monto recibido es menor al total');
            soundManager.play('error');
            return;
        }

        const sanitizedItems = cart.map(item => ({
            ...item,
            notes: item.notes?.trim() || undefined
        }));

        const newOrder: Partial<Order> = {
            id: initialOrder ? initialOrder.id : `TPV-${Date.now().toString().slice(-4)}`,
            customerName: resolvedCustomerName,
            customerPhone: customerPhone || 'N/A',
            items: sanitizedItems,
            total: cartTotal,
            status: 'kitchen',
            paymentMethod: tpvPaymentMethod,
            paymentStatus: status,
            cashReceived: status === 'paid' && tpvPaymentMethod === 'efectivo' ? cashValue : undefined,
            change: status === 'paid' && tpvPaymentMethod === 'efectivo' ? (cashValue - cartTotal) : undefined,
            createdAt: initialOrder ? initialOrder.createdAt : new Date().toISOString(),
            source: 'tpv',
            address: selectedAddress
                ? `Domicilio: ${selectedAddress}`
                : (selectedTable === 'Mostrador' ? 'Mostrador: General' : `Mesa: ${selectedTable}`),
            waiterId: loggedInStaff?.id,
            notes: orderNotes.trim() || undefined
        };

        if (initialOrder && onUpdateOrder) {
            onUpdateOrder(newOrder);
        } else {
            onAddOrder(newOrder);
        }

        if (status === 'paid') {
            generateTicket(newOrder as Order);
            updateCustomerStats(newOrder.customerName!, newOrder.customerPhone!, newOrder.total!, true);
        }

        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setOrderNotes('');
        setEditingItemNoteKey(null);
        setSelectedTable(initialTable || 'Mostrador');
        setSelectedAddress('');
        setModalType('none');
        soundManager.play('confirm');
    };

    const visibleItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (searchQuery.trim()) return matchesSearch && item.isActive;
        if (activeTab === 'cat-3') {
            return matchesSearch && item.isActive && item.categoryId !== 'cat-1' && item.categoryId !== 'cat-2';
        }
        return matchesSearch && item.isActive && item.categoryId === activeTab;
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // TPV ACCESS (LOGIN + ENTRY LOCATION SELECTION)
    // ─────────────────────────────────────────────────────────────────────────────
    if (!loggedInStaff) {
        return (
            <div className="min-h-[100dvh] bg-[#FDFBFC] dark:bg-[#110a10] flex items-center justify-center p-4 sm:p-6 overflow-y-auto transition-colors">
                <div className="w-full max-w-lg bg-white dark:bg-[#1a1118] rounded-3xl shadow-xl border border-gray-200/80 dark:border-white/10 overflow-hidden">
                    {/* Top Bar */}
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={onExit}
                            className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4 text-primary-500" />
                            <span>Volver</span>
                        </button>
                        <button
                            type="button"
                            title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="min-w-[44px] min-h-[44px] rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                        >
                            {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/25 shrink-0">
                                <Monitor className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                    TPV Terminal
                                </h2>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                                    {initialTable
                                        ? `Mesa ${initialTable} seleccionada · Ingresa con tu usuario`
                                        : 'Selecciona tu usuario y ubicación del servicio'}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* Location selection happens HERE upon entering */}
                            {initialTable ? (
                                <div className="p-3.5 rounded-2xl bg-primary-500/10 border border-primary-500/25 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <Utensils className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
                                        <span className="text-xs font-bold text-primary-700 dark:text-primary-300">
                                            Ubicación asignada: Mesa {initialTable}
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-semibold text-primary-600 dark:text-primary-400">
                                        Lista para ordenar
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block">
                                        Ubicación del Servicio
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Mostrador', '1', '2', '3', '4', '5'].map(table => {
                                            const occupied = table !== 'Mostrador' && isTableOccupied(table);
                                            const isSelected = selectedTable === table;
                                            return (
                                                <button
                                                    key={table}
                                                    type="button"
                                                    disabled={occupied}
                                                    onClick={() => {
                                                        setSelectedTable(table);
                                                        setSelectedAddress('');
                                                        soundManager.play('click');
                                                    }}
                                                    className={`min-h-[44px] px-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                                                        isSelected
                                                            ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                                                            : occupied
                                                                ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-500'
                                                                : 'bg-gray-50 dark:bg-white/5 border-gray-200/80 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:border-primary-300'
                                                    }`}
                                                >
                                                    {table === 'Mostrador' ? 'Mostrador' : occupied ? `Mesa ${table} (Ocup.)` : `Mesa ${table}`}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block">
                                    Personal
                                </label>
                                <div className="relative">
                                    <User className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <select
                                        title="Seleccionar empleado"
                                        value={selectedStaffId}
                                        onChange={(e) => setSelectedStaffId(e.target.value)}
                                        required
                                        className="w-full min-h-[48px] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-primary-500 rounded-2xl pl-11 pr-10 text-sm font-bold text-gray-800 dark:text-white appearance-none outline-none transition-all cursor-pointer"
                                    >
                                        <option value="" disabled>Elegir usuario...</option>
                                        {staff.filter(s => s.role !== 'driver').map(s => (
                                            <option key={s.id} value={s.id} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                                                {s.name} ({s.role.toUpperCase()})
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block">
                                    Contraseña Digital
                                </label>
                                <div className="relative">
                                    <Key className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (loginError) setLoginError(null);
                                        }}
                                        placeholder="••••"
                                        required
                                        className="w-full min-h-[48px] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-primary-500 rounded-2xl pl-11 pr-4 text-base font-black text-gray-800 dark:text-white outline-none transition-all tracking-[0.4em] placeholder:tracking-normal"
                                    />
                                </div>
                            </div>

                            {loginError && (
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3.5 rounded-2xl animate-shake">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{loginError}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full min-h-[52px] bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all shadow-lg shadow-primary-500/25 cursor-pointer"
                            >
                                <LogIn className="w-5 h-5" />
                                <span>Ingresar a Terminal</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // ACTIVE TPV TERMINAL (DUAL-SCROLLABLE SPLIT LAYOUT)
    // ─────────────────────────────────────────────────────────────────────────────
    return (
        <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-[#FDFBFC] dark:bg-[#110a10] text-gray-900 dark:text-gray-100 font-sans transition-colors">
            {/* Main Responsive Split Workspace */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
                {/* LEFT COLUMN: MENU */}
                <div
                    className={`flex-1 min-h-0 h-full flex-col min-w-0 overflow-hidden ${
                        activePosView === 'menu' ? 'flex' : 'hidden lg:flex'
                    }`}
                >
                    {/* Header */}
                    <header className="shrink-0 bg-[#FDFBFC]/95 dark:bg-[#110a10]/95 backdrop-blur-xl border-b border-gray-200/80 dark:border-white/10 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <button
                                type="button"
                                onClick={onExit}
                                title="Volver"
                                className="min-w-[44px] min-h-[44px] px-3 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-white flex items-center justify-center gap-1.5 font-bold text-xs transition-all active:scale-95 cursor-pointer shrink-0"
                            >
                                <ArrowLeft className="w-4 h-4 text-primary-500" />
                                <span className="hidden sm:inline">Salir</span>
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-gray-900 dark:text-white truncate leading-tight">
                                    TPV Terminal
                                </h1>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5">
                                    <span>{loggedInStaff.name}</span>
                                    <span aria-hidden="true">·</span>
                                    <span className="text-primary-600 dark:text-primary-400 font-bold">{locationSummaryLabel}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {/* Desktop Search */}
                            <div className="relative hidden md:block">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Buscar platillo..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="min-h-[44px] bg-white dark:bg-[#1a1118] border border-gray-200/80 dark:border-white/10 rounded-2xl pl-10 pr-8 text-xs font-semibold focus:border-primary-500 outline-none w-56 lg:w-64 transition-all text-gray-900 dark:text-white"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        aria-label="Limpiar búsqueda"
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className="min-w-[44px] min-h-[44px] rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
                            </button>

                            <button
                                type="button"
                                title="Cambiar usuario"
                                onClick={handleLogout}
                                className="min-w-[44px] min-h-[44px] rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <LogIn className="w-5 h-5 rotate-180" />
                            </button>
                        </div>
                    </header>

                    {/* Mobile Search + Categories Bar (shrink-0 so menu list scrolls cleanly below) */}
                    <div className="shrink-0 px-4 sm:px-6 lg:px-8 pt-3 pb-2 space-y-2.5 border-b border-gray-200/70 dark:border-white/10 bg-[#FDFBFC] dark:bg-[#110a10]">
                        <div className="relative md:hidden">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Buscar platillo en el menú..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full min-h-[42px] bg-white dark:bg-[#1a1118] border border-gray-200/80 dark:border-white/10 rounded-2xl pl-10 pr-9 text-xs font-semibold focus:border-primary-500 outline-none transition-all text-gray-900 dark:text-white"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    aria-label="Limpiar búsqueda"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="relative md:px-9">
                            <button
                                type="button"
                                onClick={() => scrollCategories('left')}
                                aria-label="Desplazar categorías a la izquierda"
                                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-[#1a1118] border border-gray-200/80 dark:border-white/10 rounded-xl items-center justify-center text-gray-500 hover:text-primary-500 transition-colors cursor-pointer z-10"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div
                                ref={categoriesScrollRef}
                                className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth"
                            >
                                {categories.map(cat => {
                                    const isSelected = activeTab === cat.id && !searchQuery.trim();
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setActiveTab(cat.id);
                                                soundManager.play('click');
                                            }}
                                            className={`min-h-[42px] px-4 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border cursor-pointer ${
                                                isSelected
                                                    ? 'bg-primary-500 border-primary-500 text-white shadow-sm shadow-primary-500/20'
                                                    : 'bg-white dark:bg-[#1a1118] border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-primary-300'
                                            }`}
                                        >
                                            {cat.name}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                onClick={() => scrollCategories('right')}
                                aria-label="Desplazar categorías a la derecha"
                                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-[#1a1118] border border-gray-200/80 dark:border-white/10 rounded-xl items-center justify-center text-gray-500 hover:text-primary-500 transition-colors cursor-pointer z-10"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Menu Grid */}
                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 lg:px-8 py-4 sm:py-6 custom-scrollbar">
                        {lastAddedToast && (
                            <div className="lg:hidden mb-3 px-3.5 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-between gap-2 shadow-sm animate-in fade-in duration-150">
                                <span className="flex items-center gap-2 truncate">
                                    <Check className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{lastAddedToast}</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setActivePosView('cart')}
                                    className="underline font-extrabold shrink-0 cursor-pointer"
                                >
                                    Ver comanda
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4 pb-6">
                            {visibleItems.map(item => {
                                if (isTlayoyoDish(item)) {
                                    const sel = tlayoyoSelections[item.id] || DEFAULT_TLAYOYO_SELECTION;
                                    const baseVar = item.variations[0] || { id: 'm-tlayoyos-v1', label: 'Por pieza', price: 10 };
                                    const currentLabel = formatTlayoyoVariationLabel(sel);
                                    const activeQty = getCartVariationQty(item.id, currentLabel);
                                    const totalDishQty = cart
                                        .filter(i => i.id === item.id)
                                        .reduce((sum, i) => sum + i.quantity, 0);

                                    return (
                                        <div
                                            key={item.id}
                                            className={`bg-white dark:bg-[#1a1118] rounded-2xl p-4 sm:p-5 border transition-colors space-y-3 ${
                                                totalDishQty > 0
                                                    ? 'border-primary-500/50 shadow-sm'
                                                    : 'border-gray-200/80 dark:border-white/10 hover:border-primary-300 dark:hover:border-primary-500/40'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white leading-snug">
                                                        {item.name}
                                                    </h3>
                                                    {totalDishQty > 0 && (
                                                        <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 tabular-nums">
                                                            {totalDishQty} {totalDishQty === 1 ? 'pieza en comanda' : 'piezas en comanda'}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-sm font-black text-primary-500 tabular-nums shrink-0">
                                                    ${baseVar.price.toFixed(2)}
                                                </span>
                                            </div>

                                            <div>
                                                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1.5">
                                                    Salsa(s)
                                                </span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {TLAYOYO_SALSAS.map(salsa => {
                                                        const isSelected = sel.salsaMode !== 'sin' && sel.salsas.includes(salsa);
                                                        return (
                                                            <button
                                                                key={salsa}
                                                                type="button"
                                                                onClick={() => setTlayoyoSelections(prev => ({
                                                                    ...prev,
                                                                    [item.id]: toggleTlayoyoSalsa(prev[item.id], salsa)
                                                                }))}
                                                                className={`min-h-[36px] px-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                                                    isSelected
                                                                        ? 'bg-primary-500 text-white shadow-sm'
                                                                        : 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-white/10'
                                                                }`}
                                                            >
                                                                {salsa}
                                                            </button>
                                                        );
                                                    })}
                                                    <button
                                                        type="button"
                                                        onClick={() => setTlayoyoSelections(prev => ({
                                                            ...prev,
                                                            [item.id]: toggleTlayoyoSalsaAparte(prev[item.id])
                                                        }))}
                                                        className={`min-h-[36px] px-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                                            sel.salsaMode === 'aparte'
                                                                ? 'bg-amber-500 text-white shadow-sm'
                                                                : 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-white/10'
                                                        }`}
                                                    >
                                                        Aparte
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setTlayoyoSelections(prev => ({
                                                            ...prev,
                                                            [item.id]: setTlayoyoSinSalsa(prev[item.id])
                                                        }))}
                                                        className={`min-h-[36px] px-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                                            sel.salsaMode === 'sin'
                                                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                                                                : 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-white/10'
                                                        }`}
                                                    >
                                                        Sin salsa
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1.5">
                                                    Queso
                                                </span>
                                                <div className="grid grid-cols-3 gap-1.5">
                                                    {TLAYOYO_CHEESE_OPTIONS.map(opt => (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => setTlayoyoSelections(prev => ({
                                                                ...prev,
                                                                [item.id]: { ...(prev[item.id] || DEFAULT_TLAYOYO_SELECTION), cheese: opt }
                                                            }))}
                                                            className={`min-h-[36px] px-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer truncate ${
                                                                sel.cheese === opt
                                                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                                                                    : 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-white/10'
                                                            }`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {activeQty > 0 ? (
                                                <div className="flex items-center justify-between gap-2 p-1 rounded-2xl bg-primary-500/10 border border-primary-500/35">
                                                    <button
                                                        type="button"
                                                        onClick={() => decrementCartVariation(item.id, currentLabel)}
                                                        aria-label="Quitar una pieza"
                                                        className="min-w-[44px] min-h-[44px] rounded-xl bg-white dark:bg-[#1a1118] text-gray-700 dark:text-white hover:text-red-500 flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer"
                                                    >
                                                        {activeQty === 1 ? <Trash2 className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4" />}
                                                    </button>
                                                    <div className="text-center px-2">
                                                        <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums block leading-tight">
                                                            {activeQty} {activeQty === 1 ? 'pieza' : 'piezas'}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 tabular-nums">
                                                            ${(activeQty * baseVar.price).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => addToCart(item, { ...baseVar, label: currentLabel }, 1)}
                                                        aria-label="Agregar una pieza"
                                                        className="min-w-[44px] min-h-[44px] rounded-xl bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => addToCart(item, { ...baseVar, label: currentLabel }, 1)}
                                                        className="flex-1 min-h-[46px] flex items-center justify-between px-4 bg-primary-500/10 hover:bg-primary-500 text-primary-700 dark:text-primary-300 hover:text-white rounded-xl transition-colors font-bold text-xs cursor-pointer active:scale-[0.98]"
                                                    >
                                                        <span>+ Agregar</span>
                                                        <span className="font-black tabular-nums">${baseVar.price.toFixed(2)}</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => addToCart(item, { ...baseVar, label: currentLabel }, 3)}
                                                        title="Agregar 3 piezas"
                                                        className="min-w-[48px] min-h-[46px] px-3 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-primary-500 hover:text-white text-gray-800 dark:text-white font-black text-xs tabular-nums transition-colors cursor-pointer active:scale-95"
                                                    >
                                                        +3
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={item.id}
                                        className="bg-white dark:bg-[#1a1118] rounded-2xl p-4 sm:p-5 border border-gray-200/80 dark:border-white/10 hover:border-primary-300 dark:hover:border-primary-500/40 transition-colors flex flex-col justify-between gap-3"
                                    >
                                        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white leading-snug">
                                            {item.name}
                                        </h3>
                                        <div className="space-y-2">
                                            {item.variations.map(vari => {
                                                const variQty = getCartVariationQty(item.id, vari.label);
                                                if (variQty > 0) {
                                                    return (
                                                        <div
                                                            key={vari.id}
                                                            className="w-full min-h-[46px] flex items-center justify-between gap-2 pl-3 pr-1.5 py-1.5 bg-primary-500/10 border border-primary-500/35 rounded-xl"
                                                        >
                                                            <div className="min-w-0">
                                                                <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">
                                                                    {vari.label}
                                                                </span>
                                                                <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 tabular-nums">
                                                                    ${vari.price.toFixed(2)} c/u
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => decrementCartVariation(item.id, vari.label)}
                                                                    aria-label={`Quitar ${item.name} ${vari.label}`}
                                                                    className="min-w-[38px] min-h-[38px] rounded-lg bg-white dark:bg-[#1a1118] text-gray-700 dark:text-white hover:text-red-500 flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer"
                                                                >
                                                                    {variQty === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5" />}
                                                                </button>
                                                                <span className="w-7 text-center text-xs font-black tabular-nums text-gray-900 dark:text-white">
                                                                    {variQty}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => addToCart(item, vari, 1)}
                                                                    aria-label={`Agregar ${item.name} ${vari.label}`}
                                                                    className="min-w-[38px] min-h-[38px] rounded-lg bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <button
                                                        key={vari.id}
                                                        type="button"
                                                        onClick={() => addToCart(item, vari, 1)}
                                                        className="w-full min-h-[46px] flex items-center justify-between px-3.5 py-2.5 bg-gray-50 dark:bg-white/5 hover:bg-primary-500 hover:text-white rounded-xl transition-colors cursor-pointer active:scale-[0.98]"
                                                    >
                                                        <span className="text-xs font-semibold truncate pr-2">{vari.label}</span>
                                                        <span className="font-black text-xs tabular-nums shrink-0">${vari.price.toFixed(2)}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            {visibleItems.length === 0 && (
                                <div className="col-span-full py-16 text-center bg-white dark:bg-[#1a1118] rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                        No se encontraron platillos
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Prueba otra búsqueda o categoría
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: COMANDA (NO LOCATION PICKER INSIDE + ORDER & ITEM COMMENTS) */}
                <div
                    className={`w-full lg:w-[400px] xl:w-[440px] flex-1 lg:flex-none min-h-0 h-full flex-col overflow-hidden bg-white dark:bg-[#160e15] lg:border-l border-gray-200/80 dark:border-white/10 ${
                        activePosView === 'cart' ? 'flex' : 'hidden lg:flex'
                    }`}
                >
                    {/* Comanda Header */}
                    <div className="shrink-0 px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                Comanda
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                {locationSummaryLabel}
                                {selectedAddress ? `: ${selectedAddress}` : ''}
                                <span aria-hidden="true"> · </span>
                                <span className="tabular-nums font-semibold">{totalPieces} {totalPieces === 1 ? 'pieza' : 'piezas'}</span>
                            </p>
                        </div>

                        {activePosView === 'cart' && (
                            <button
                                type="button"
                                onClick={() => setActivePosView('menu')}
                                className="lg:hidden min-h-[40px] px-3 rounded-xl bg-gray-100 dark:bg-white/10 text-xs font-bold text-gray-700 dark:text-gray-200 cursor-pointer"
                            >
                                + Platillos
                            </button>
                        )}
                    </div>

                    {/* Scrollable Comanda Content */}
                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 space-y-4 custom-scrollbar">
                        {/* Customer Phone Search / Quick Client Strip */}
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="tel"
                                        placeholder="Tel. cliente (opcional)..."
                                        value={customerPhone}
                                        onChange={(e) => handlePhoneSearch(e.target.value)}
                                        className="w-full min-h-[44px] bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 focus:border-primary-500 rounded-2xl pl-10 pr-3.5 text-xs font-semibold outline-none transition-all text-gray-900 dark:text-white"
                                    />
                                </div>
                                {!customerName && (
                                    <button
                                        type="button"
                                        onClick={handleQuickSale}
                                        className="min-h-[44px] px-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                                    >
                                        {selectedTable === 'Mostrador' ? 'Público Gral.' : `Mesa ${selectedTable}`}
                                    </button>
                                )}
                            </div>

                            {customerName && (
                                <div className="px-3.5 py-2.5 bg-primary-500/10 border border-primary-500/20 rounded-2xl flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <span className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 block">
                                            Cliente asignado
                                        </span>
                                        <span className="text-xs font-extrabold text-gray-900 dark:text-white truncate block">
                                            {customerName}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        title="Quitar cliente"
                                        onClick={() => {
                                            setCustomerName('');
                                            setCustomerPhone('');
                                            setTempCustomer(null);
                                        }}
                                        className="min-w-[36px] min-h-[36px] rounded-xl text-primary-500 hover:bg-primary-500/10 flex items-center justify-center cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Cart Items */}
                        <div className="space-y-3">
                            {cart.map((item, idx) => {
                                const noteKey = `${idx}-${item.id}`;
                                const isEditingNote = editingItemNoteKey === noteKey;
                                return (
                                    <div
                                        key={`${item.id}-${item.variationLabel}-${idx}`}
                                        className="bg-gray-50/80 dark:bg-white/[0.04] rounded-2xl p-3.5 border border-gray-200/70 dark:border-white/10 space-y-2.5"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white leading-snug">
                                                    {item.name}
                                                </h4>
                                                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5 tabular-nums">
                                                    {item.variationLabel} · ${(item.price * item.quantity).toFixed(2)}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <div className="flex items-center bg-white dark:bg-[#1a1118] border border-gray-200/80 dark:border-white/10 rounded-xl p-0.5 gap-0.5">
                                                    <button
                                                        type="button"
                                                        title={item.quantity === 1 ? 'Quitar de comanda' : 'Reducir pieza'}
                                                        onClick={() => updateQuantity(idx, -1)}
                                                        className="min-w-[40px] min-h-[40px] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-red-500 rounded-lg cursor-pointer active:scale-95 transition-all"
                                                    >
                                                        {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4" />}
                                                    </button>
                                                    <span className="w-7 text-center text-sm font-black tabular-nums text-gray-900 dark:text-white">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        title="Aumentar pieza"
                                                        onClick={() => updateQuantity(idx, 1)}
                                                        className="min-w-[40px] min-h-[40px] flex items-center justify-center bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-500 hover:text-white rounded-lg cursor-pointer active:scale-95 transition-all"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <button
                                                    type="button"
                                                    title="Eliminar línea"
                                                    onClick={() => removeFromCart(idx)}
                                                    className="min-w-[40px] min-h-[40px] flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Per-item Comment / Note */}
                                        {isEditingNote ? (
                                            <div className="flex items-center gap-1.5">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={item.notes || ''}
                                                    onChange={(e) => updateItemNote(idx, e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') setEditingItemNoteKey(null);
                                                    }}
                                                    placeholder="Ej. Sin cebolla, salsa aparte..."
                                                    className="flex-1 min-h-[36px] bg-white dark:bg-[#1a1118] border border-primary-400 rounded-xl px-3 text-xs text-gray-800 dark:text-white outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingItemNoteKey(null)}
                                                    className="min-h-[36px] px-3 rounded-xl bg-primary-500 text-white text-xs font-bold cursor-pointer"
                                                >
                                                    Listo
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setEditingItemNoteKey(noteKey)}
                                                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate">
                                                    {item.notes ? `Nota: ${item.notes}` : 'Agregar comentario al platillo'}
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}

                            {cart.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-gray-200 dark:border-white/10 rounded-3xl">
                                    <ShoppingBag className="w-10 h-10 mb-2.5 text-gray-300 dark:text-gray-600" />
                                    <p className="font-bold text-xs text-gray-500 dark:text-gray-400">
                                        Sin platillos seleccionados
                                    </p>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                        Elige platillos del menú para armar la comanda
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* General Order Comment Field */}
                        <div className="space-y-1.5 pt-1">
                            <label
                                htmlFor="tpv-order-notes"
                                className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300"
                            >
                                <MessageSquare className="w-3.5 h-3.5 text-primary-500" />
                                <span>Comentario del pedido (opcional)</span>
                            </label>
                            <textarea
                                id="tpv-order-notes"
                                rows={2}
                                value={orderNotes}
                                onChange={(e) => setOrderNotes(e.target.value)}
                                placeholder="Indicaciones para cocina o servicio (ej. todo junto, servilletas extra)..."
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 focus:border-primary-500 rounded-2xl px-3.5 py-2.5 text-xs text-gray-800 dark:text-white outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Comanda Sticky Summary & CTA */}
                    <div className="shrink-0 px-4 sm:px-6 py-4 border-t border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#160e15] space-y-3">
                        <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                                <span>Subtotal</span>
                                <span className="font-semibold tabular-nums">${(cartTotal * 0.84).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                                <span>IVA (16%)</span>
                                <span className="font-semibold tabular-nums">${(cartTotal * 0.16).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-white/10">
                                <span className="text-sm font-extrabold text-gray-900 dark:text-white">Total a Pagar</span>
                                <span className="text-2xl font-black text-primary-500 tabular-nums">${cartTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleFinalizeOrder}
                            disabled={cart.length === 0}
                            className={`w-full min-h-[52px] rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                cart.length > 0
                                    ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/25 active:scale-[0.98] cursor-pointer'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <CheckCircle className="w-5 h-5" />
                            <span>
                                {selectedTable === 'Mostrador' && !selectedAddress
                                    ? 'Cobrar y Finalizar'
                                    : `Enviar a Cocina · ${locationSummaryLabel}`}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Navigation Bar (shrink-0 inside 100dvh, zero overlap with scroll or CTA) */}
            <nav
                aria-label="Navegación TPV"
                className="lg:hidden shrink-0 h-16 grid grid-cols-2 border-t border-gray-200/80 dark:border-white/10 bg-[#FDFBFC]/95 dark:bg-[#110a10]/95 backdrop-blur-xl"
            >
                <button
                    type="button"
                    onClick={() => setActivePosView('menu')}
                    className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                        activePosView === 'menu' ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'
                    }`}
                >
                    <Utensils className="w-5 h-5" />
                    <span className="text-[11px] font-bold">Menú</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActivePosView('cart')}
                    className={`flex flex-col items-center justify-center gap-1 relative cursor-pointer transition-colors ${
                        activePosView === 'cart' ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'
                    }`}
                >
                    <div className="relative">
                        <ShoppingBag className="w-5 h-5" />
                        {totalPieces > 0 && (
                            <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-primary-500 text-white text-[10px] font-black rounded-full flex items-center justify-center tabular-nums">
                                {totalPieces}
                            </span>
                        )}
                    </div>
                    <span className="text-[11px] font-bold">
                        Comanda {cartTotal > 0 ? `($${cartTotal.toFixed(0)})` : ''}
                    </span>
                </button>
            </nav>

            {/* Modals Container */}
            {modalType !== 'none' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white dark:bg-[#1a1118] rounded-3xl shadow-2xl overflow-hidden border border-gray-200/80 dark:border-white/10 animate-in zoom-in-95 duration-200">
                        {modalType === 'location' && tempCustomer && (
                            <div className="p-6 sm:p-8 space-y-5">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-500 mx-auto mb-3">
                                        <Map className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                        ¿Dónde será el servicio?
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Cliente: {tempCustomer.name}
                                    </p>
                                </div>
                                <div className="space-y-2.5">
                                    <button
                                        type="button"
                                        onClick={() => handleSelectLocation('mostrador')}
                                        className="w-full min-h-[52px] px-4 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center gap-3 hover:bg-primary-500 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <ShoppingBag className="w-5 h-5 shrink-0" />
                                        <span className="font-bold text-xs uppercase tracking-wider">Para Mostrador</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectLocation('mesa', '1')}
                                        className="w-full min-h-[52px] px-4 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center gap-3 hover:bg-primary-500 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <Utensils className="w-5 h-5 shrink-0" />
                                        <span className="font-bold text-xs uppercase tracking-wider">Para Mesa (Comedor)</span>
                                    </button>
                                    {tempCustomer.addresses && tempCustomer.addresses.length > 0 && (
                                        <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-white/10">
                                            <p className="text-xs font-bold text-gray-400">Direcciones Registradas</p>
                                            {tempCustomer.addresses.map((addr, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => handleSelectLocation('address', addr)}
                                                    className="w-full min-h-[44px] px-4 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center gap-3 hover:bg-primary-500 hover:text-white transition-colors cursor-pointer overflow-hidden"
                                                >
                                                    <MapPin className="w-4 h-4 shrink-0" />
                                                    <span className="font-bold text-xs truncate">{addr}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {modalType === 'onboarding' && (
                            <div className="p-6 sm:p-8 text-center space-y-5">
                                <div>
                                    <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-3">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                        Cliente no encontrado
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        El teléfono {customerPhone} no está registrado
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => { setModalType('registration'); setRegName(''); setRegAddress(''); }}
                                        className="w-full min-h-[48px] bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md shadow-primary-500/20 transition-all cursor-pointer"
                                    >
                                        Registrar Nuevo Cliente
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleQuickSale}
                                        className="w-full min-h-[48px] bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                        Venta Rápida ({selectedTable === 'Mostrador' ? 'Público General' : `Mesa ${selectedTable}`})
                                    </button>
                                </div>
                            </div>
                        )}

                        {modalType === 'registration' && (
                            <div className="p-6 sm:p-8 space-y-5">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-3">
                                        <Clipboard className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                        Alta de Cliente
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Tel: {customerPhone}
                                    </p>
                                </div>

                                <form onSubmit={handleRegisterCustomer} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block">
                                            Nombre Completo
                                        </label>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={regName}
                                            onChange={(e) => setRegName(e.target.value)}
                                            placeholder="Ej. Juan Pérez"
                                            required
                                            className="w-full min-h-[48px] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-primary-500 rounded-2xl px-4 font-semibold text-sm outline-none transition-all text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block">
                                            Dirección (Opcional)
                                        </label>
                                        <input
                                            type="text"
                                            value={regAddress}
                                            onChange={(e) => setRegAddress(e.target.value)}
                                            placeholder="Calle, Número, Colonia"
                                            className="w-full min-h-[48px] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-primary-500 rounded-2xl px-4 font-semibold text-sm outline-none transition-all text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!regName.trim()}
                                        className="w-full min-h-[48px] bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md shadow-primary-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        Guardar y Continuar
                                    </button>
                                </form>
                            </div>
                        )}

                        {modalType === 'payment' && (
                            <div className="p-6 sm:p-8 space-y-5">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-3">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                        Confirmar Cobro
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {resolvedCustomerName}
                                    </p>
                                </div>

                                <div className="bg-gray-50 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/10 rounded-2xl p-5">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total a Pagar</span>
                                        <span className="text-2xl font-black text-primary-500 tabular-nums">${cartTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['efectivo', 'tarjeta', 'transferencia'] as PaymentMethod[]).map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setTpvPaymentMethod(m)}
                                                className={`min-h-[44px] rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer ${
                                                    tpvPaymentMethod === m
                                                        ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                                                        : 'bg-white dark:bg-[#1a1118] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'
                                                }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {tpvPaymentMethod === 'efectivo' && (
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

                                        {(parseFloat(cashReceived) >= cartTotal) && (
                                            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl flex justify-between items-center text-emerald-700 dark:text-emerald-300">
                                                <span className="text-xs font-bold uppercase tracking-wider">Su Cambio:</span>
                                                <span className="text-lg font-black tabular-nums">
                                                    ${(parseFloat(cashReceived) - cartTotal).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {paymentError && (
                                    <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{paymentError}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => handleConfirmPayment('paid')}
                                        className="w-full min-h-[48px] bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md shadow-primary-500/20 transition-all cursor-pointer"
                                    >
                                        Confirmar y Generar Ticket
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleConfirmPayment('pending')}
                                        className="w-full min-h-[44px] text-gray-500 dark:text-gray-400 font-semibold text-xs hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer"
                                    >
                                        Dejar Pago Pendiente
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="p-3.5 bg-gray-50 dark:bg-white/[0.03] flex justify-center border-t border-gray-100 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => setModalType('none')}
                                className="min-h-[36px] px-4 text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer"
                            >
                                Volver / Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
            `}</style>
        </div>
    );
}
