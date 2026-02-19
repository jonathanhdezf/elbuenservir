
import React, { useState } from 'react';
import {
    Monitor, Lock, LogIn, X, ShoppingBag,
    ArrowRight, User, Key, AlertCircle, ChevronDown,
    Plus, Minus, Trash2, Printer, CheckCircle, Search,
    Sun, Moon, Phone, Clipboard, Map, Utensils, MapPin
} from 'lucide-react';
import { MenuItem, Category, Order, OrderItem, Staff, Customer, PaymentMethod } from '../types';
import { soundManager } from '../utils/soundManager';
import { generateTicket } from '../utils/printTicket';

interface TPVViewProps {
    categories: Category[];
    menuItems: MenuItem[];
    staff: Staff[];
    customers: Customer[];
    orders: Order[];
    onAddOrder: (order: Partial<Order>) => void;
    onUpdateOrder?: (order: Partial<Order>) => void;
    onAddCustomer: (customer: Customer) => void;
    initialOrder?: Order | null;
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
    initialOrder,
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
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTable, setSelectedTable] = useState<string>('Mostrador');
    const [selectedAddress, setSelectedAddress] = useState<string>('');
    const [activePosView, setActivePosView] = useState<'menu' | 'cart'>('menu');
    const [showCartMobile, setShowCartMobile] = useState(false);

    // Modal States
    const [modalType, setModalType] = useState<'none' | 'location' | 'onboarding' | 'registration' | 'payment'>('none');
    const [tempCustomer, setTempCustomer] = useState<Customer | null>(null);
    const [regName, setRegName] = useState('');
    const [regAddress, setRegAddress] = useState('');

    // Payment States
    const [tpvPaymentMethod, setTpvPaymentMethod] = useState<PaymentMethod>('efectivo');
    const [cashReceived, setCashReceived] = useState<string>('');
    const [paymentError, setPaymentError] = useState<string | null>(null);

    // Initial Order Logic
    React.useEffect(() => {
        if (initialOrder) {
            // Mark items as old so kitchen knows they are already prepared
            const itemsWithOldStatus = initialOrder.items.map(item => ({ ...item, isOld: true }));
            setCart(itemsWithOldStatus);
            setCustomerName(initialOrder.customerName);
            setCustomerPhone(initialOrder.customerPhone);

            // Extract table name from address (e.g., "Mesa: 5")
            if (initialOrder.address?.includes('Mesa:')) {
                const tableName = initialOrder.address.split('Mesa:')[1]?.trim();
                setSelectedTable(tableName || 'Mostrador');
            } else {
                setSelectedTable('Mostrador');
            }

            // Auto login waiter
            if (initialOrder.waiterId) {
                const waiter = staff.find(s => s.id === initialOrder.waiterId);
                if (waiter) setLoggedInStaff(waiter);
            }

            soundManager.play('confirm');
        }
    }, [initialOrder, staff]);

    const isTableOccupied = (tableName: string) => {
        return orders.some(o =>
            o.address?.includes(`Mesa: ${tableName}`) &&
            !['delivered', 'cancelled'].includes(o.status)
        );
    };

    const handlePhoneSearch = (phone: string) => {
        setCustomerPhone(phone);

        // Normalize input and DB phones for comparison
        const cleanedInput = phone.replace(/\D/g, '');

        if (cleanedInput.length >= 10) {
            // Find customer with matching phone (checking normalized version)
            const found = customers.find(c => c.phone.replace(/\D/g, '').includes(cleanedInput));

            if (found) {
                // Only update if it's a new match to avoid re-rendering/playing sound unnecessarily
                if (tempCustomer?.id !== found.id) {
                    setTempCustomer(found);
                    setCustomerName(found.name);
                    setModalType('location');
                    soundManager.play('notification');
                }
            } else {
                // Only show onboarding modal if exactly 10 digits (standard length) 
                // to allow user to correct without constant interruptions if they type more/less
                if (cleanedInput.length === 10 && modalType === 'none') {
                    setModalType('onboarding');
                    soundManager.play('alert');
                }
            }
        } else {
            // Clear temp state if input is too short
            if (cleanedInput.length < 10 && tempCustomer) {
                setTempCustomer(null);
                setCustomerName('');
            }
        }
    };

    const handleQuickSale = () => {
        setCustomerName('Publico General');
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
        setModalType('location');
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

    const addToCart = (item: MenuItem, variation: any) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id && i.variationLabel === variation.label);
            if (existing) {
                return prev.map(i => i.id === item.id && i.variationLabel === variation.label
                    ? { ...i, quantity: i.quantity + 1 }
                    : i
                );
            }
            return [...prev, {
                id: item.id,
                name: item.name,
                variationLabel: variation.label,
                price: variation.price,
                quantity: 1
            }];
        });
        soundManager.play('click');
    };

    const updateQuantity = (id: string, label: string, delta: number) => {
        setCart(prev => prev.map(item =>
            item.id === id && item.variationLabel === label
                ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                : item
        ));
        soundManager.play('click');
    };

    const removeFromCart = (id: string, label: string) => {
        setCart(prev => prev.filter(i => !(i.id === id && i.variationLabel === label)));
        soundManager.play('click');
    };

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleFinalizeOrder = () => {
        if (!customerName.trim() || cart.length === 0) {
            setPaymentError('Faltan datos del cliente o productos en el carrito');
            return;
        }

        // Si es pedido en MOSTRADOR (sea Publico General o Cliente Registrado), pedimos pago inmediato
        if (selectedTable === 'Mostrador') {
            setModalType('payment');
            setPaymentError(null);
            setCashReceived('');
            soundManager.play('notification');
        } else {
            // Pedidos a MESA se mandan a cocina sin pago inmediato (cuenta abierta)
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

        const newOrder: Partial<Order> = {
            id: initialOrder ? initialOrder.id : `TPV-${Date.now().toString().slice(-4)}`,
            customerName,
            customerPhone: customerPhone || 'N/A',
            items: cart,
            total: cartTotal,
            status: 'kitchen',
            paymentMethod: tpvPaymentMethod,
            paymentStatus: status,
            cashReceived: status === 'paid' && tpvPaymentMethod === 'efectivo' ? cashValue : undefined,
            change: status === 'paid' && tpvPaymentMethod === 'efectivo' ? (cashValue - cartTotal) : undefined,
            createdAt: initialOrder ? initialOrder.createdAt : new Date().toISOString(),
            source: 'tpv',
            address: selectedAddress ? `Domicilio: ${selectedAddress}` : (selectedTable === 'Mostrador' ? 'Mostrador: General' : `Mesa: ${selectedTable}`),
            waiterId: loggedInStaff?.id
        };

        // Generar Ticket (simulado o Real)
        if (initialOrder && onUpdateOrder) {
            onUpdateOrder(newOrder);
        } else {
            onAddOrder(newOrder);
        }

        // Print ticket immediately if paid or regular flow
        if (status === 'paid') {
            generateTicket(newOrder as Order);
        }

        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setSelectedTable('Mostrador');
        setSelectedAddress('');
        setModalType('none');
        soundManager.play('confirm');
    };

    if (!loggedInStaff) {
        return (
            <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 flex items-center justify-center p-6 transition-colors duration-500">
                <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-[48px] shadow-2xl overflow-hidden border-4 border-white dark:border-gray-800 relative">
                    <div className="absolute top-0 right-0 p-8">
                        <button title="Cerrar terminal" onClick={onExit} className="p-3 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-12">
                        <div className="flex flex-col items-center text-center mb-10">
                            <div className="w-24 h-24 bg-primary-500 rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-primary-500/30 mb-6 group hover:rotate-12 transition-transform duration-500">
                                <Monitor className="w-12 h-12" />
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">TPV Access</h2>
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">Sistema de Toma de Pedidos</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Seleccionar Personal</label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <select
                                        title="Seleccionar empleado"
                                        value={selectedStaffId}
                                        onChange={(e) => setSelectedStaffId(e.target.value)}
                                        required
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary-500 rounded-3xl pl-16 pr-12 py-5 font-black text-gray-700 dark:text-white appearance-none outline-none transition-all shadow-inner uppercase tracking-wider"
                                    >
                                        <option value="" disabled>Elegir Usuario...</option>
                                        {staff.filter(s => s.role !== 'driver').map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.role.toUpperCase()})</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <ChevronDown className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2">Contraseña Digital</label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                        <Key className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary-500 rounded-3xl pl-16 pr-6 py-5 font-black text-gray-700 dark:text-white outline-none transition-all shadow-inner tracking-[0.5em]"
                                    />
                                </div>
                            </div>

                            {loginError && (
                                <div className="flex items-center gap-2 text-red-500 font-black uppercase text-[10px] tracking-widest bg-red-50 dark:bg-red-500/10 p-4 rounded-2xl animate-shake">
                                    <AlertCircle className="w-4 h-4" />
                                    {loginError}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-6 rounded-[32px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl hover:shadow-primary-500/20"
                            >
                                <LogIn className="w-6 h-6" />
                                Acceder al Sistema
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-screen w-full bg-[#f8fafc] dark:bg-gray-950 overflow-hidden font-sans transition-colors duration-500">
            {/* Main POS Layout */}
            <div className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 shadow-xl z-10 transition-all duration-300 ${activePosView === 'menu' ? 'flex' : 'hidden lg:flex'}`}>
                <header className="p-4 md:p-6 lg:p-8 flex items-center justify-between shrink-0 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <Monitor className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">TPV Terminal</h1>
                            <p className="text-[10px] font-black text-primary-500 dark:text-primary-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></span>
                                Sesión: {loggedInStaff.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group hidden sm:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar platillo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-gray-100 dark:bg-gray-800 border-none rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold uppercase tracking-wider focus:ring-2 ring-primary-500 outline-none w-64 transition-all"
                            />
                        </div>
                        <button
                            title={isDarkMode ? "Modo Claro" : "Modo Oscuro"}
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="p-3 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        >
                            {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                        </button>
                        <button
                            title="Cerrar sesión"
                            onClick={handleLogout}
                            className="p-3 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        >
                            <LogIn className="w-6 h-6 rotate-180" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 custom-scrollbar pb-32">
                    {/* Categories Tabs */}
                    <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveTab(cat.id)}
                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === cat.id
                                    ? 'bg-gray-900 dark:bg-primary-500 text-white shadow-xl translate-y-[-2px]'
                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-gray-100'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Menu Items Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {menuItems.filter(item => {
                            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
                            if (activeTab === 'cat-3') {
                                return matchesSearch && item.categoryId !== 'cat-1' && item.categoryId !== 'cat-2';
                            }
                            return matchesSearch && item.categoryId === activeTab;
                        }).map(item => (
                            <div key={item.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-[32px] p-5 border border-transparent hover:border-primary-500/30 transition-all group">
                                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-3 line-clamp-1">{item.name}</h3>
                                <div className="space-y-2">
                                    {item.variations.map(vari => (
                                        <button
                                            key={vari.id}
                                            onClick={() => addToCart(item, vari)}
                                            className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-2xl hover:bg-primary-500 hover:text-white transition-all shadow-sm group-hover:shadow-md"
                                        >
                                            <span className="text-[10px] font-bold uppercase tracking-wide">{vari.label}</span>
                                            <span className="font-black text-xs">${vari.price}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile/Small Laptop Navigation */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-around z-50">
                    <button
                        onClick={() => setActivePosView('menu')}
                        className={`flex flex-col items-center gap-1 ${activePosView === 'menu' ? 'text-primary-500' : 'text-gray-400'}`}
                    >
                        <Utensils className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase">Menú</span>
                    </button>
                    <button
                        onClick={() => setActivePosView('cart')}
                        className={`flex flex-col items-center gap-1 relative ${activePosView === 'cart' ? 'text-primary-500' : 'text-gray-400'}`}
                    >
                        <ShoppingBag className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase">Comanda</span>
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Right Sidebar: Order Summary */}
            <div className={`
                ${activePosView === 'cart' ? 'flex' : 'hidden lg:flex'} 
                w-full lg:w-[400px] xl:w-[450px] flex-col bg-gray-50 dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 pt-6 lg:pt-8 transition-all duration-300
            `}>
                <div className="px-6 lg:px-10 shrink-0 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Comanda</h2>
                        </div>
                        <div className="px-4 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {cart.length} Items
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                            <Phone className="w-5 h-5" />
                        </div>
                        <input
                            type="tel"
                            placeholder="Buscar por teléfono..."
                            value={customerPhone}
                            onChange={(e) => handlePhoneSearch(e.target.value)}
                            className="w-full bg-white dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-3xl pl-14 pr-6 py-4 font-black text-sm uppercase tracking-wider outline-none transition-all shadow-sm"
                        />
                    </div>

                    {customerName && (
                        <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                            <div className="flex-1 min-w-0 mr-4">
                                <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Cliente Seleccionado</p>
                                <p className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">{customerName}</p>
                            </div>
                            <button
                                title="Borrar selección"
                                onClick={() => { setCustomerName(''); setCustomerPhone(''); setTempCustomer(null); }}
                                className="p-2 text-primary-400 hover:text-primary-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    <div className="mt-6">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-2 block mb-3">Ubicación Actual: <span className="text-primary-500">{selectedAddress ? 'Domicilio' : (selectedTable === 'Mostrador' ? 'Mostrador' : `Mesa ${selectedTable}`)}</span></label>
                        <div className="grid grid-cols-3 gap-2">
                            {['Mostrador', '1', '2', '3', '4', '5'].map(table => {
                                const occupied = table !== 'Mostrador' && isTableOccupied(table);
                                return (
                                    <button
                                        key={table}
                                        disabled={occupied && selectedTable !== table}
                                        title={occupied ? `Mesa ocupada` : (table === 'Mostrador' ? 'Asignar a Mostrador' : `Asignar a Mesa ${table}`)}
                                        onClick={() => {
                                            setSelectedTable(table);
                                            setSelectedAddress('');
                                            soundManager.play('click');
                                        }}
                                        className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all relative ${selectedTable === table && !selectedAddress
                                            ? 'bg-primary-500 border-primary-500 text-white shadow-lg'
                                            : occupied
                                                ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50 text-red-500 opacity-80'
                                                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-200'
                                            }`}
                                    >
                                        {table === 'Mostrador' ? 'Mostrador' : `Mesa ${table}`}
                                        {occupied && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedAddress && (
                            <div className="mt-2 p-3 bg-white dark:bg-gray-900 border-2 border-primary-500 rounded-2xl text-[10px] font-black uppercase text-primary-500 truncate shadow-md">
                                Domicilio: {selectedAddress}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 relative">
                    <div className="px-6 lg:px-10 space-y-4 py-4">
                        {cart.map((item, idx) => (
                            <div key={`${item.id}-${item.variationLabel}-${idx}`}
                                className="bg-white dark:bg-gray-900 rounded-[28px] p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between group">
                                <div className="flex-1 min-w-0 mr-4">
                                    <h4 className="text-[11px] font-black text-gray-900 dark:text-white uppercase truncate">{item.name}</h4>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.variationLabel} • ${item.price}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-2xl p-1">
                                        <button
                                            title="Reducir"
                                            onClick={() => updateQuantity(item.id, item.variationLabel, -1)}
                                            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-primary-500 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="w-6 text-center text-xs font-black dark:text-white">{item.quantity}</span>
                                        <button
                                            title="Aumentar"
                                            onClick={() => updateQuantity(item.id, item.variationLabel, 1)}
                                            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-primary-500 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <button
                                        title="Eliminar"
                                        onClick={() => removeFromCart(item.id, item.variationLabel)}
                                        className="p-2.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {cart.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 opacity-30 dark:text-white text-center">
                                <ShoppingBag className="w-16 h-16 mb-4 text-gray-200 dark:text-gray-800" />
                                <p className="font-black uppercase tracking-[0.2em] text-[10px] text-gray-400">Sin platillos elegidos</p>
                            </div>
                        )}
                    </div>

                    <div className="px-6 lg:px-10 pb-24 lg:pb-10 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                        <div className="space-y-3 mb-8 pt-6">
                            <div className="flex justify-between items-center text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                                <span>Subtotal</span>
                                <span>${(cartTotal * 0.84).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                                <span>IVA (16%)</span>
                                <span>${(cartTotal * 0.16).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800">
                                <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Total a Pagar</span>
                                <span className="text-3xl font-black text-primary-500 tracking-tighter">${cartTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleFinalizeOrder}
                            disabled={cart.length === 0 || !customerName.trim()}
                            className={`w-full py-6 rounded-[32px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-2xl ${cart.length > 0 && customerName.trim()
                                ? 'bg-gray-900 dark:bg-primary-500 text-white shadow-primary-500/20 hover:scale-[1.02] active:scale-95'
                                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-50'
                                }`}
                        >
                            <CheckCircle className="w-6 h-6" />
                            Finalizar Pedido
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals Container */}
            {modalType !== 'none' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[40px] shadow-2xl overflow-hidden border-4 border-white dark:border-gray-800 animate-in zoom-in-95 duration-300">
                        {modalType === 'location' && tempCustomer && (
                            <div className="p-10">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-500 mx-auto mb-4">
                                        <Map className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">¿Donde será el servicio?</h3>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Cliente: {tempCustomer.name}</p>
                                </div>
                                <div className="space-y-3">
                                    <button onClick={() => handleSelectLocation('mostrador')} className="w-full p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center gap-4 hover:bg-primary-500 hover:text-white transition-all group">
                                        <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center group-hover:bg-primary-400 shadow-sm transition-colors">
                                            <ShoppingBag className="w-5 h-5" />
                                        </div>
                                        <span className="font-black uppercase tracking-widest text-xs">Para Mostrador</span>
                                    </button>
                                    <button onClick={() => handleSelectLocation('mesa', '1')} className="w-full p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center gap-4 hover:bg-primary-500 hover:text-white transition-all group">
                                        <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center group-hover:bg-primary-400 shadow-sm transition-colors">
                                            <Utensils className="w-5 h-5" />
                                        </div>
                                        <span className="font-black uppercase tracking-widest text-xs">Para Mesa (Comedor)</span>
                                    </button>
                                    {tempCustomer.addresses && tempCustomer.addresses.length > 0 && (
                                        <div className="space-y-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Direcciones Registradas</p>
                                            {tempCustomer.addresses.map((addr, i) => (
                                                <button key={i} onClick={() => handleSelectLocation('address', addr)} className="w-full p-4 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center gap-3 hover:bg-primary-500 hover:text-white transition-all group overflow-hidden">
                                                    <MapPin className="w-4 h-4 shrink-0" />
                                                    <span className="font-bold text-[10px] uppercase truncate">{addr}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {modalType === 'onboarding' && (
                            <div className="p-10 text-center">
                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4">
                                    <User className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Cliente no encontrado</h3>
                                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2 mb-8">El teléfono {customerPhone} no está en la base de datos</p>

                                <div className="grid grid-cols-1 gap-3">
                                    <button onClick={() => { setModalType('registration'); setRegName(''); setRegAddress(''); }} className="w-full py-5 bg-primary-500 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                                        Registrar Nuevo Cliente
                                    </button>
                                    <div className="relative py-4 flex items-center gap-4">
                                        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800"></div>
                                        <span className="text-[9px] font-black text-gray-400 uppercase">o también</span>
                                        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800"></div>
                                    </div>
                                    <button onClick={handleQuickSale} className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-3xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all">
                                        Venta Rápida (Público General)
                                    </button>
                                </div>
                            </div>
                        )}

                        {modalType === 'registration' && (
                            <div className="p-10">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                                        <Clipboard className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Alta de Cliente</h3>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Tel: {customerPhone}</p>
                                </div>

                                <form onSubmit={handleRegisterCustomer} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-2">Nombre Completo</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={regName}
                                            onChange={(e) => setRegName(e.target.value)}
                                            placeholder="Ej. Juan Pérez"
                                            required
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary-500 rounded-2xl px-6 py-4 font-bold text-sm outline-none transition-all uppercase"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-2">Dirección (Opcional)</label>
                                        <input
                                            type="text"
                                            value={regAddress}
                                            onChange={(e) => setRegAddress(e.target.value)}
                                            placeholder="Calle, Número, Colonia"
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary-500 rounded-2xl px-6 py-4 font-bold text-sm outline-none transition-all uppercase"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!regName.trim()}
                                        className="w-full mt-4 py-5 bg-primary-500 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Guardar y Continuar
                                    </button>
                                </form>
                            </div>
                        )}
                        {modalType === 'payment' && (
                            <div className="p-10">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Confirmar Cobro</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{customerName}</p>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-6 mb-8">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Total a Pagar</span>
                                        <span className="text-2xl font-black text-primary-500">${cartTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-4">
                                        {(['efectivo', 'tarjeta', 'transferencia'] as PaymentMethod[]).map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setTpvPaymentMethod(m)}
                                                className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-tighter border-2 transition-all ${tpvPaymentMethod === m
                                                    ? 'bg-primary-500 border-primary-500 text-white shadow-md'
                                                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-400'
                                                    }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {tpvPaymentMethod === 'efectivo' && (
                                    <div className="space-y-4 mb-8 animate-in slide-in-from-top-4 duration-300">
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

                                        {(parseFloat(cashReceived) >= cartTotal) && (
                                            <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl flex justify-between items-center border-2 border-emerald-100 dark:border-emerald-900/50 animate-in zoom-in-95">
                                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Su Cambio:</span>
                                                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">${(parseFloat(cashReceived) - cartTotal).toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {paymentError && (
                                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-3">
                                        <AlertCircle className="w-4 h-4" />
                                        {paymentError}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => handleConfirmPayment('paid')}
                                        className="w-full py-5 bg-primary-500 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        Confirmar y Generar Ticket
                                    </button>
                                    <button
                                        onClick={() => handleConfirmPayment('pending')}
                                        className="w-full py-4 text-gray-400 font-black uppercase tracking-widest text-[9px] hover:text-gray-600 transition-all"
                                    >
                                        Dejar Pago Pendiente
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-center border-t border-gray-100 dark:border-gray-800">
                            <button onClick={() => setModalType('none')} className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-gray-600 transition-colors">Volver / Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
                [style*="--delay"] { animation-delay: var(--delay); }
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

