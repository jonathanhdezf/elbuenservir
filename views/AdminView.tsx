
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Info, X, CheckCircle2, AlertCircle,
  Trash2, Clock, MapPin, Phone, User,
  ChefHat, Bike, PackageCheck, TrendingUp,
  Users, ShoppingBag, DollarSign, Search,
  ChevronRight, Filter, MoreHorizontal, Star,
  Edit2, Smartphone, Map, UserPlus, Send,
  ChevronDown, Settings2, Timer, Check, CreditCard,
  Banknote, Receipt, ArrowRight, Printer, CheckCircle,
  Monitor, Maximize2, Bell, Truck, UserMinus, Navigation, ShieldCheck,
  History, Wallet, ArrowUpRight, Store, Utensils, Zap, Save, UserCheck, Scan, Shield
} from 'lucide-react';
import { MenuItem, Category, TabId, Order, OrderItem, OrderStatus, Customer, AdminSection, DeliveryDriver, VehicleType, PaymentMethod, PaymentStatus, TransferStatus, Staff, StaffRole } from '../types';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CategoryTabs from '../components/CategoryTabs';
import MenuItemCard from '../components/MenuItemCard';
import PublicView from './PublicView';
import { generateTicket } from '../utils/printTicket';
import { LocalDispatchSection } from '../components/LocalDispatch';
import ReportsSection from '../components/ReportsSection';

interface AdminViewProps {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onExit: () => void;
}

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'kitchen';
  timestamp: string;
}

const INITIAL_ORDERS: Order[] = [
  { id: 'ORD-101', customerName: 'Juan Pérez', customerPhone: '555-0101', address: 'Mostrador: General', items: [{ id: 'i1', name: 'Platanos Fritos', variationLabel: 'Sencillo', price: 35, quantity: 2 }], total: 70, status: 'kitchen', paymentMethod: 'efectivo', paymentStatus: 'pending', createdAt: new Date(Date.now() - 1200000).toISOString(), source: 'tpv' },
  { id: 'ORD-102', customerName: 'María García', customerPhone: '555-0102', address: 'Av. Reforma 200', items: [{ id: 'i2', name: 'Fresas con Crema', variationLabel: 'Vaso Grande', price: 65, quantity: 1 }], total: 65, status: 'delivery', assignedDriverId: 'D-002', paymentMethod: 'tarjeta', paymentStatus: 'paid', paidAt: new Date(Date.now() - 3000000).toISOString(), operationNumber: 'TX-9922', ticketNumber: 'TK-001', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'ORD-103', customerName: 'Carlos López', customerPhone: '555-0103', address: 'Fracc. Los Pinos 5', items: [{ id: 'i3', name: 'Enchiladas Suizas', variationLabel: 'Orden', price: 120, quantity: 1 }], total: 120, status: 'delivered', paymentMethod: 'transferencia', paymentStatus: 'paid', paidAt: new Date(Date.now() - 6500000).toISOString(), operationNumber: 'BANK-7721', transferStatus: 'recibido', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'ORD-104', customerName: 'Ana Martínez', customerPhone: '555-0104', address: 'Mesa: 5', items: [{ id: 'i1', name: 'Platanos Fritos', variationLabel: 'Con Leche', price: 45, quantity: 1 }], total: 45, status: 'kitchen', paymentMethod: 'efectivo', paymentStatus: 'pending', createdAt: new Date(Date.now() - 300000).toISOString(), source: 'tpv' },
  { id: 'ORD-105', customerName: 'Pedro Sola', customerPhone: '555-0105', address: 'Calle Mayor 22', items: [{ id: 'i2', name: 'Fresas con Crema', variationLabel: 'Vaso Chico', price: 40, quantity: 3 }], total: 120, status: 'ready', paymentMethod: 'tarjeta', paymentStatus: 'pending', createdAt: new Date(Date.now() - 400000).toISOString() },
  { id: 'ORD-107', customerName: 'Héctor Ruiz', customerPhone: '555-0107', address: 'Privada Los Álamos #14', items: [{ id: 'i1', name: 'Platanos Fritos', variationLabel: 'Sencillo', price: 35, quantity: 4 }], total: 140, status: 'ready', paymentMethod: 'efectivo', paymentStatus: 'paid', paidAt: new Date(Date.now() - 50000).toISOString(), createdAt: new Date(Date.now() - 100000).toISOString() },
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cust-1', name: 'Juan Pérez', phone: '555-0101', email: 'juan@example.com', totalOrders: 15, totalSpent: 1250.50, lastOrderDate: new Date(Date.now() - 86400000).toISOString(), addresses: ['Calle 10, Col. Centro', 'Av. Juárez 45'] },
  { id: 'cust-2', name: 'María García', phone: '555-0102', email: 'maria@example.com', totalOrders: 8, totalSpent: 740.00, lastOrderDate: new Date(Date.now() - 172800000).toISOString(), addresses: ['Av. Reforma 200'] },
];

const INITIAL_DRIVERS: DeliveryDriver[] = [
  { id: 'D-001', name: 'Roberto Sánchez', phone: '555-0201', status: 'active', vehicleType: 'moto', deliveriesCompleted: 154, rating: 4.8 },
  { id: 'D-002', name: 'Elena Torres', phone: '555-0202', status: 'busy', vehicleType: 'bici', deliveriesCompleted: 89, rating: 4.9 },
  { id: 'D-003', name: 'Marco Ruíz', phone: '555-0203', status: 'offline', vehicleType: 'auto', deliveriesCompleted: 210, rating: 4.7 },
  { id: 'D-004', name: 'Lucía Méndez', phone: '555-0204', status: 'active', vehicleType: 'walking', deliveriesCompleted: 45, rating: 4.9 },
];

const INITIAL_STAFF: Staff[] = [
  { id: 'S-000', name: 'Miguel', phone: '555-0300', role: 'admin', status: 'active' },
  { id: 'S-001', name: 'Chef Mario', phone: '555-0301', role: 'cook', status: 'active' },
  { id: 'S-002', name: 'Ana Mesera', phone: '555-0302', role: 'waiter', status: 'active' },
];

const STATUS_CONFIG: Record<OrderStatus, { label: string, color: string, icon: any }> = {
  pending: { label: 'Pendiente', color: 'bg-gray-100 text-gray-700', icon: Clock },
  kitchen: { label: 'En Cocina', color: 'bg-amber-100 text-amber-700', icon: ChefHat },
  ready: { label: 'Listo para envío', color: 'bg-primary-100 text-primary-700', icon: PackageCheck },
  delivery: { label: 'En Reparto', color: 'bg-blue-100 text-blue-700', icon: Bike },
  delivered: { label: 'Entregado', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: Trash2 },
};

const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string, icon: any, color: string }> = {
  efectivo: { label: 'Efectivo', icon: Banknote, color: 'text-emerald-500' },
  tarjeta: { label: 'Tarjeta', icon: CreditCard, color: 'text-blue-500' },
  transferencia: { label: 'Transferencia', icon: Receipt, color: 'text-purple-500' },
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string, color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-red-50 text-red-600 border-red-100' },
  paid: { label: 'Pagado', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
};

const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  recibido: 'Recibido',
  pendiente: 'Pendiente',
  no_recibido: 'No se recibió'
};

const VEHICLE_CONFIG: Record<VehicleType, { label: string, icon: any }> = {
  moto: { label: 'Motocicleta', icon: Bike },
  bici: { label: 'Bicicleta', icon: Bike },
  auto: { label: 'Automóvil', icon: Truck },
  walking: { label: 'A pie', icon: Navigation }
};

export default function AdminView({
  categories,
  setCategories,
  menuItems,
  setMenuItems,
  isDarkMode,
  setIsDarkMode,
  onExit
}: AdminViewProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [activeTab, setActiveTab] = useState<TabId>(categories[0]?.id || '');
  const isFullScreen = ['kds', 'dds', 'local_dispatch', 'driver_dashboard'].includes(activeSection);

  // Logistics password protection
  const LOGISTICS_PASSWORD = '1234';
  const LOGISTICS_SECTIONS: AdminSection[] = ['kds', 'dds', 'local_dispatch', 'driver_dashboard'];
  const [unlockedSections, setUnlockedSections] = useState<Set<AdminSection>>(new Set());
  const [logisticsPasswordInput, setLogisticsPasswordInput] = useState('');
  const [logisticsPasswordError, setLogisticsPasswordError] = useState(false);
  const [pendingLogisticsSection, setPendingLogisticsSection] = useState<AdminSection | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>(INITIAL_DRIVERS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [staff, setStaff] = useState<Staff[]>(INITIAL_STAFF);
  const [notificationHistory, setNotificationHistory] = useState<Notification[]>([]);
  const [activeTableOrders, setActiveTableOrders] = useState<Record<number, string>>({});
  const [currentTime, setCurrentTime] = useState(new Date());

  // Modal states
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);

  // Payment confirmation flow states
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [tempPaymentMethod, setTempPaymentMethod] = useState<PaymentMethod | null>(null);
  const [tempTicketNumber, setTempTicketNumber] = useState('');
  const [tempOpNumber, setTempOpNumber] = useState('');
  const [tempCashReceived, setTempCashReceived] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [tempTransferStatus, setTempTransferStatus] = useState<TransferStatus>('pendiente');
  const [driverInputs, setDriverInputs] = useState<Record<string, { received: string; ticket: string; operation: string }>>({});
  const [selectedDriverIdForPanel, setSelectedDriverIdForPanel] = useState<string | null>(null);
  const [selectedWaiterIdForPanel, setSelectedWaiterIdForPanel] = useState<string | null>(null);
  const [editingDriver, setEditingDriver] = useState<Partial<DeliveryDriver> | null>(null);


  // TPV States
  const [tpvCart, setTpvCart] = useState<OrderItem[]>([]);
  const [tpvSearch, setTpvSearch] = useState('');
  const [tpvCustomerName, setTpvCustomerName] = useState('');
  const [tpvCustomerPhone, setTpvCustomerPhone] = useState('');
  const [tpvAddress, setTpvAddress] = useState('');
  const [tpvDeliveryType, setTpvDeliveryType] = useState<'store' | 'table' | 'delivery'>('store');
  const [tpvWaiterId, setTpvWaiterId] = useState<string | null>(null);
  const [visibleItemsCount, setVisibleItemsCount] = useState(6);

  useEffect(() => {
    setVisibleItemsCount(6);
  }, [activeTab, tpvSearch]);

  // Delivery Dispatch States (DDS)
  const [verifyingDispatchOrderId, setVerifyingDispatchOrderId] = useState<string | null>(null);
  const [dispatchTicketInput, setDispatchTicketInput] = useState('');
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const SOUND_MAP = useMemo(() => ({
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    success: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
    error: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3',
    kitchen: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    delivery: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
    local: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
    notification: 'https://assets.mixkit.co/active_storage/sfx/2575/2575-preview.mp3',
    addToCart: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' // Switched to blip for clarity
  }), []);

  const lastSoundPlayedAt = React.useRef<number>(0);
  const audioInstance = React.useRef<HTMLAudioElement | null>(null);

  const playUISound = useCallback((type: keyof typeof SOUND_MAP) => {
    const now = Date.now();
    // Cooldown of 150ms to prevent "monster" / granular distortion
    if (now - lastSoundPlayedAt.current < 150) return;

    try {
      if (!audioInstance.current) {
        audioInstance.current = new Audio();
        audioInstance.current.volume = 0.08; // Even lower to be super safe
      }

      const audio = audioInstance.current;
      audio.src = SOUND_MAP[type];

      // Force immediate reset
      audio.pause();
      audio.currentTime = 0;

      lastSoundPlayedAt.current = now;
      audio.play().catch(() => { });
    } catch (e) {
      console.warn('Sound manager error', e);
    }
  }, [SOUND_MAP]);

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' | 'kitchen' = 'success') => {
    // Prevent duplicate messages in the current view to avoid stacking
    setNotifications(prev => {
      if (prev.some(n => n.message === message)) return prev;

      const id = Date.now() + Math.random();
      const timestamp = new Date().toISOString();
      const newNotif = { id, message, type, timestamp } as any;

      setNotificationHistory(h => [newNotif, ...h]);

      setTimeout(() => {
        setNotifications(current => current.filter(n => n.id !== id));
      }, 4000);

      return [...prev, newNotif];
    });

    // Ring bell for kitchen or errors, otherwise check if in TPV
    if (type === 'kitchen' || type === 'error' || activeSection !== 'tpv') {
      playUISound(type === 'kitchen' ? 'notification' : type === 'error' ? 'error' : 'notification');
    }
  }, [playUISound, activeSection]);

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [isRegisteringCustomer, setIsRegisteringCustomer] = useState(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regAddresses, setRegAddresses] = useState<string[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  // Sounds & Real-time Badges logic
  const prevCounts = React.useRef({ kds: 0, dds: 0, local: 0 });

  const badges = useMemo(() => ({
    orders: orders.filter(o => o.status === 'pending').length,
    kds: orders.filter(o => o.status === 'kitchen').length,
    dds: orders.filter(o => o.status === 'ready' && !o.address.toLowerCase().includes('mesa') && !o.address.toLowerCase().includes('mostrador')).length,
    local_dispatch: orders.filter(o => o.status === 'ready' && (o.address.toLowerCase().includes('mesa') || o.address.toLowerCase().includes('mostrador'))).length,
  }), [orders]);

  useEffect(() => {
    if (badges.kds > prevCounts.current.kds) {
      playUISound('kitchen');
    }
    if (badges.dds > prevCounts.current.dds) {
      playUISound('delivery');
    }
    if (badges.local_dispatch > prevCounts.current.local) {
      playUISound('local');
    }

    prevCounts.current = {
      kds: badges.kds,
      dds: badges.dds,
      local: badges.local_dispatch
    };
  }, [badges, playUISound]);

  // Mobile Back Button Navigation Logic
  useEffect(() => {
    // Add a dummy state to history
    window.history.pushState({ modal: 'root' }, '');

    const handlePopState = (event: PopStateEvent) => {
      // Check for any open modal or temporary state
      if (viewingOrderId || editingDriver || assigningOrderId || isConfirmingPayment) {
        setViewingOrderId(null);
        setEditingDriver(null);
        setAssigningOrderId(null);
        setIsConfirmingPayment(false);
        // Push state back so we can intercept AGAIN
        window.history.pushState({ modal: 'root' }, '');
        return;
      }

      // If in a sub-section (not dashboard), go back to dashboard
      if (activeSection !== 'dashboard') {
        setActiveSection('dashboard');
        window.history.pushState({ modal: 'root' }, '');
        return;
      }

      // Final exit confirmation if at root
      if (confirm('¿Deseas salir de la aplicación?')) {
        // Here we let it go back (exit)
      } else {
        // Push state back to stay here
        window.history.pushState({ modal: 'root' }, '');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [viewingOrderId, editingDriver, assigningOrderId, isConfirmingPayment, activeSection]);



  const viewingOrder = useMemo(() => orders.find(o => o.id === viewingOrderId), [orders, viewingOrderId]);

  const activeCategoryName = useMemo(() =>
    categories.find(c => c.id === activeTab)?.name || 'Categoría',
    [categories, activeTab]
  );

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const oldOrder = orders.find(o => o.id === orderId);
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updates: Partial<Order> = { status: newStatus };
        if (newStatus === 'delivery' && !o.dispatchedAt) {
          updates.dispatchedAt = new Date().toISOString();
        }
        return { ...o, ...updates };
      }
      return o;
    }));

    if (oldOrder?.status === 'delivery' && newStatus !== 'delivery' && oldOrder.assignedDriverId) {
      setDrivers(prev => prev.map(d => d.id === oldOrder.assignedDriverId ? { ...d, status: 'active' } : d));
    }

    // Auto-assign back to active if coming from busy
    if (newStatus === 'delivery') {
      // Logic for changing status is handled, just notify
    }

    addNotification(`Pedido ${orderId} actualizado`, 'info');
  };

  const confirmPaymentAction = (orderId: string) => {
    if (!tempPaymentMethod) return;

    // Validate Waiter if in Store mode (TPV)
    // Note: selectedWaiterIdForPanel should be set in the modal

    // Validate Cash
    const received = parseFloat(tempCashReceived);
    if (tempPaymentMethod === 'efectivo' && (isNaN(received) || received < (orders.find(o => o.id === orderId)?.total || 0))) {
      setPaymentError('Monto recibido insuficiente');
      return;
    }

    const currentOrder = orders.find(o => o.id === orderId);
    if (!currentOrder) return;

    const change = tempPaymentMethod === 'efectivo' ? (received - currentOrder.total) : 0;
    const finalWaiterId = selectedWaiterIdForPanel || currentOrder.waiterId;

    const updatedOrder = {
      ...currentOrder,
      paymentMethod: tempPaymentMethod,
      paymentStatus: 'paid' as PaymentStatus,
      paidAt: new Date().toISOString(),
      ticketNumber: tempTicketNumber || undefined,
      operationNumber: tempOpNumber || undefined,
      transferStatus: tempPaymentMethod === 'transferencia' ? tempTransferStatus : undefined,
      cashReceived: tempPaymentMethod === 'efectivo' ? received : undefined,
      change: tempPaymentMethod === 'efectivo' ? change : undefined,
      waiterId: finalWaiterId
    };

    setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    addNotification(`Pago de ${orderId} confirmado`, 'success');

    // Side effect called OUTSIDE of setOrders
    generateTicket(updatedOrder);

    // Reset temporary states
    setIsConfirmingPayment(false);
    setTempPaymentMethod(null);
    setTempTicketNumber('');
    setTempOpNumber('');
    setTempTransferStatus('pendiente');
    setTempCashReceived('');
    setSelectedWaiterIdForPanel(null);
    setPaymentError(null);

    // Close modal smoothly after 2 seconds
    setTimeout(() => {
      setViewingOrderId(null);
    }, 2000);
  };

  const togglePaymentStatus = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    if (order.paymentStatus === 'paid') {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: 'pending', paidAt: undefined } : o));
      addNotification(`Pago de ${orderId} revertido a Pendiente`, 'info');
    } else {
      setIsConfirmingPayment(true);
      setTempPaymentMethod(order.paymentMethod);
    }
  };

  const assignDriverToOrder = (orderId: string, driverId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order?.assignedDriverId) {
      setDrivers(prev => prev.map(d => d.id === order.assignedDriverId ? { ...d, status: 'active' } : d));
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, assignedDriverId: driverId } : o));
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: 'busy' } : d));
    setAssigningOrderId(null);
    addNotification(`Repartidor asignado`);
  };

  const unassignDriverFromOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order?.assignedDriverId) {
      setDrivers(prev => prev.map(d => d.id === order.assignedDriverId ? { ...d, status: 'active' } : d));
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, assignedDriverId: undefined } : o));
    addNotification(`Repartidor desvinculado`, 'info');
  };

  const addItem = () => {
    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      categoryId: activeTab,
      name: 'Nuevo Platillo',
      description: '',
      isActive: true,
      variations: [{ id: `v-${Date.now()}`, label: 'Sencillo', price: 0 }]
    };
    setMenuItems(prev => [...prev, newItem]);
    addNotification('Nuevo platillo añadido');
  };

  const deleteDriver = (driverId: string) => {
    if (window.confirm('¿Eliminar repartidor?')) {
      setDrivers(prev => prev.filter(d => d.id !== driverId));
      addNotification('Repartidor eliminado', 'info');
    }
  };

  const saveDriver = (driverData: Partial<DeliveryDriver>) => {
    if (!driverData.name || !driverData.phone) {
      addNotification('Nombre y teléfono son obligatorios', 'error');
      return;
    }

    if (driverData.id) {
      setDrivers(prev => prev.map(d => d.id === driverData.id ? { ...d, ...driverData } as DeliveryDriver : d));
      addNotification('Repartidor actualizado');
    } else {
      const newDriver: DeliveryDriver = {
        id: `D-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        name: driverData.name,
        phone: driverData.phone,
        vehicleType: driverData.vehicleType || 'moto',
        status: 'active',
        deliveriesCompleted: 0,
        rating: 5.0,
      };
      setDrivers(prev => [...prev, newDriver]);
      addNotification('Nuevo repartidor añadido');
    }
    setEditingDriver(null);
  };


  // Dedicated Dashboard calculations
  const dashboardStats = useMemo(() => {
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
    const totalIncome = paidOrders.reduce((acc, curr) => acc + curr.total, 0);

    const efectivo = paidOrders.filter(o => o.paymentMethod === 'efectivo').reduce((acc, curr) => acc + curr.total, 0);
    const tarjeta = paidOrders.filter(o => o.paymentMethod === 'tarjeta').reduce((acc, curr) => acc + curr.total, 0);
    const transferencia = paidOrders.filter(o => o.paymentMethod === 'transferencia').reduce((acc, curr) => acc + curr.total, 0);

    const pendingPayments = orders.filter(o => o.paymentStatus === 'pending').reduce((acc, curr) => acc + curr.total, 0);
    const movementHistory = [...paidOrders].sort((a, b) => new Date(b.paidAt!).getTime() - new Date(a.paidAt!).getTime());

    return { totalIncome, efectivo, tarjeta, transferencia, pendingPayments, movementHistory };
  }, [orders]);

  const renderDashboard = () => {
    const { totalIncome, efectivo, tarjeta, transferencia, pendingPayments, movementHistory } = dashboardStats;

    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Visión General</h3>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">Control total de ingresos y movimientos</p>
          </div>
          <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center text-emerald-500">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ingreso Total Hoy</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">${totalIncome.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Income Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Efectivo', value: efectivo, method: 'efectivo' },
            { label: 'Tarjeta', value: tarjeta, method: 'tarjeta' },
            { label: 'Transferencia', value: transferencia, method: 'transferencia' },
            { label: 'Por Cobrar', value: pendingPayments, method: 'pending' },
          ].map((stat, i) => {
            const isPending = stat.method === 'pending';
            const cfg = !isPending ? PAYMENT_METHOD_CONFIG[stat.method as PaymentMethod] : { icon: Receipt, color: 'text-red-500' };
            return (
              <div key={i} className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col group hover:shadow-xl transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 rounded-3xl bg-gray-50 dark:bg-gray-900/50 ${cfg.color} group-hover:scale-110 transition-transform`}>
                    <cfg.icon className="w-8 h-8" />
                  </div>
                  <div className={`flex items-center text-[10px] font-black uppercase px-2 py-1 rounded-lg ${isPending ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    <TrendingUp className="w-3 h-3 mr-1" /> 12%
                  </div>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{stat.label}</p>
                <p className={`text-3xl font-black mt-1 tracking-tighter ${isPending ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>${stat.value.toFixed(2)}</p>
              </div>
            );
          })}
        </div>

        {/* Movement History Table */}
        <div className="bg-white dark:bg-gray-800 rounded-[48px] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-10 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center">
                <History className="w-7 h-7 mr-3 text-primary-500" /> Historial de Movimientos
              </h4>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Registro cronológico de pagos realizados</p>
            </div>
            <button title="Imprimir historial" className="p-4 bg-gray-50 dark:bg-gray-900 text-gray-400 rounded-2xl hover:text-primary-500 transition-colors">
              <Printer className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/50">
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Fecha y Hora</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Referencia</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Método</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Repartidor</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Estado Pago</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">T. Entrega</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {movementHistory.map((mov, idx) => {
                  const date = new Date(mov.paidAt!);
                  const method = PAYMENT_METHOD_CONFIG[mov.paymentMethod];
                  const duration = mov.dispatchedAt && mov.paidAt ? Math.floor((new Date(mov.paidAt).getTime() - new Date(mov.dispatchedAt).getTime()) / 60000) : null;
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                      <td className="px-10 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 dark:text-white">{date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span>
                          <span className="text-[10px] font-bold text-gray-400">{date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className="text-xs font-black text-primary-500 uppercase tracking-widest">{mov.id}</span>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center space-x-2">
                          <method.icon className={`w-4 h-4 ${method.color}`} />
                          <span className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 tracking-widest">{method.label}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center space-x-2">
                          <Bike className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 tracking-widest">
                            {drivers.find(d => d.id === mov.assignedDriverId)?.name || 'Venta Local'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">Confirmado</span>
                          </div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">
                            {mov.operationNumber ? `OP: ${mov.operationNumber}` : ''}
                            {mov.ticketNumber ? ` | TK: ${mov.ticketNumber}` : ''}
                            {mov.transferStatus ? ` | ${TRANSFER_STATUS_LABELS[mov.transferStatus]}` : ''}
                            {!mov.operationNumber && !mov.ticketNumber && !mov.transferStatus && 'Venta Directa'}
                          </p>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center space-x-2">
                          <Clock className={`w-3.5 h-3.5 ${duration && duration > 30 ? 'text-red-500' : 'text-gray-400'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${duration && duration > 30 ? 'text-red-600' : 'text-gray-600 dark:text-gray-300'}`}>
                            {duration ? `${duration} min` : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <span className="text-lg font-black text-gray-900 dark:text-white">${mov.total.toFixed(2)}</span>
                      </td>
                    </tr>
                  );
                })}
                {movementHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-10 py-20 text-center">
                      <History className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-400 font-black uppercase tracking-widest">No hay movimientos registrados hoy</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderOrderDetailModal = () => {
    if (!viewingOrder) return null;
    const statusCfg = STATUS_CONFIG[viewingOrder.status];
    const paymentCfg = PAYMENT_STATUS_CONFIG[viewingOrder.paymentStatus];
    const methodCfg = PAYMENT_METHOD_CONFIG[viewingOrder.paymentMethod];
    const driver = drivers.find(d => d.id === viewingOrder.assignedDriverId);

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => { setViewingOrderId(null); setIsConfirmingPayment(false); }}></div>
        <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">

          {/* Premium Header */}
          <div className="relative p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-primary-500/10 blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusCfg.color}`}>
                    {statusCfg.label}
                  </div>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{viewingOrder.id}</span>
                </div>
                <button title="Cerrar" onClick={() => { setViewingOrderId(null); setIsConfirmingPayment(false); }} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">Importe Total</p>
                <p className="text-5xl font-black tracking-tight">${viewingOrder.total.toFixed(2)}</p>
                <p className="text-xs font-bold text-white/40 mt-2 uppercase">{viewingOrder.customerName}</p>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">

            {!isConfirmingPayment ? (
              /* Payment Status View */
              <div className="space-y-6">
                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-[28px] border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${viewingOrder.paymentStatus === 'paid' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/20'}`}>
                        <methodCfg.icon className={`w-6 h-6 ${viewingOrder.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-red-400'}`} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Método</p>
                        <p className="font-black text-sm dark:text-white uppercase">{methodCfg.label}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => togglePaymentStatus(viewingOrder.id)}
                      className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-95 ${viewingOrder.paymentStatus === 'paid' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-white dark:bg-gray-800 text-red-500 border-red-100 dark:border-red-900/30 hover:border-red-300'}`}
                    >
                      {viewingOrder.paymentStatus === 'paid' ? '✓ PAGADO' : 'Cobrar'}
                    </button>
                  </div>
                  {viewingOrder.paymentStatus === 'paid' && (viewingOrder.operationNumber || viewingOrder.ticketNumber) && (
                    <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4">
                      {viewingOrder.operationNumber && (
                        <div>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Operación</p>
                          <p className="text-xs font-black dark:text-white uppercase truncate">{viewingOrder.operationNumber}</p>
                        </div>
                      )}
                      {viewingOrder.ticketNumber && (
                        <div>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Ticket</p>
                          <p className="text-xs font-black dark:text-white uppercase truncate">{viewingOrder.ticketNumber}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => generateTicket(viewingOrder)}
                    className="flex-1 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
                  >
                    <Printer className="w-4 h-4" /> Ticket
                  </button>
                  <button
                    onClick={() => updateOrderStatus(viewingOrder.id, 'delivered')}
                    disabled={viewingOrder.status === 'delivered'}
                    className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Entregado
                  </button>
                </div>
              </div>
            ) : (
              /* Payment Form - Premium */
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">

                {/* Collected By */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Cobrado Por</label>
                  <div className="relative">
                    <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={selectedWaiterIdForPanel || ''}
                      onChange={(e) => setSelectedWaiterIdForPanel(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl pl-12 pr-10 py-3.5 font-bold text-sm outline-none focus:border-primary-500 uppercase appearance-none transition-all"
                      title="Seleccionar personal que cobra"
                      aria-label="Seleccionar personal que cobra"
                    >
                      <option value="" disabled>Seleccionar...</option>
                      {staff.filter(s => (s.role === 'admin' || s.role === 'cashier' || s.role === 'waiter') && s.status === 'active').map(s => (
                        <option key={s.id} value={s.id}>{s.name} • {s.role === 'admin' ? 'Admin' : s.role === 'cashier' ? 'Cajero' : 'Mesero'}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Método de Pago</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['efectivo', 'tarjeta', 'transferencia'] as const).map(method => (
                      <button
                        key={method}
                        onClick={() => {
                          setTempPaymentMethod(method);
                          setTempTicketNumber('');
                          setTempOpNumber('');
                          setPaymentError(null);
                        }}
                        className={`py-4 rounded-2xl border-2 font-black text-[9px] uppercase tracking-widest transition-all flex flex-col items-center gap-2 ${tempPaymentMethod === method ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 shadow-lg shadow-emerald-500/10' : 'border-gray-100 dark:border-gray-700 text-gray-400 hover:border-gray-200'}`}
                      >
                        {method === 'efectivo' ? <Banknote className="w-5 h-5" /> : method === 'tarjeta' ? <CreditCard className="w-5 h-5" /> : <Scan className="w-5 h-5" />}
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cash Input */}
                {tempPaymentMethod === 'efectivo' && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Monto Recibido</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-emerald-400">$</span>
                      <input
                        type="number"
                        value={tempCashReceived}
                        onChange={e => {
                          setTempCashReceived(e.target.value);
                          setPaymentError(null);
                        }}
                        className="w-full pl-14 pr-6 py-5 bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl font-black text-3xl outline-none focus:border-emerald-500 transition-all text-gray-900 dark:text-white"
                        placeholder="0.00"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            confirmPaymentAction(viewingOrder.id);
                          }
                        }}
                      />
                    </div>

                    {parseFloat(tempCashReceived) >= viewingOrder.total && (
                      <div className="p-5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex justify-between items-center animate-in zoom-in duration-200 shadow-lg shadow-emerald-500/20">
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Cambio</span>
                        <span className="text-2xl font-black text-white">${(parseFloat(tempCashReceived) - viewingOrder.total).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Reference Inputs */}
                {tempPaymentMethod && tempPaymentMethod !== 'efectivo' && (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. Ticket</label>
                        <input type="text" value={tempTicketNumber} onChange={e => setTempTicketNumber(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 focus:border-primary-500 rounded-xl px-4 py-3 font-bold text-sm outline-none transition-all uppercase"
                          placeholder="TK-001"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              confirmPaymentAction(viewingOrder.id);
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. Operación</label>
                        <input type="text" value={tempOpNumber} onChange={e => setTempOpNumber(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 focus:border-primary-500 rounded-xl px-4 py-3 font-bold text-sm outline-none transition-all uppercase"
                          placeholder="OP-441"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              confirmPaymentAction(viewingOrder.id);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentError && <p className="text-xs font-bold text-red-500 text-center animate-bounce bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl">{paymentError}</p>}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setIsConfirmingPayment(false); setPaymentError(null); }}
                    className="flex-[0.4] py-4 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => confirmPaymentAction(viewingOrder.id)}
                    className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Confirmar Cobro
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  };

  const renderKDSSection = () => {
    const activeOrders = orders.filter(o => o.status === 'kitchen');
    return (
      <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase flex items-center"><Monitor className="w-10 h-10 mr-4 text-primary-500" />PANTALLA DE COMANDAS (KDS)</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Monitoreo de cocina</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="px-6 py-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-3">
              <Bell className="w-5 h-5 text-amber-500 animate-swing" />
              <span className="font-black dark:text-white uppercase text-xs">{activeOrders.length} Pendientes</span>
            </div>
            <button title="Pantalla completa" className="p-4 bg-gray-900 text-white rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"><Maximize2 className="w-5 h-5" /></button>
          </div>
        </div>

        {activeOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 pb-20">
            {activeOrders.map(order => {
              const waitTime = Math.floor((currentTime.getTime() - new Date(order.createdAt).getTime()) / 60000);
              const isUrgent = waitTime > 12;

              return (
                <div key={order.id} className={`bg-white dark:bg-gray-800 rounded-[48px] shadow-2xl overflow-hidden flex flex-col border-4 transition-all ${isUrgent ? 'border-amber-400' : 'border-gray-100 dark:border-gray-700'}`}>
                  <div className={`p-8 ${isUrgent ? 'bg-amber-400 text-gray-900' : 'bg-gray-900 text-white'} flex flex-col items-start space-y-4`}>
                    <div className="w-full flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-4">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-70 block">{order.id}</span>
                        <h4 className="text-2xl font-black tracking-tight mt-1 uppercase leading-none break-words">{order.customerName}</h4>
                        {order.source === 'tpv' && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full inline-block">
                              TPV
                            </span>
                            {order.paymentStatus === 'paid' && (
                              <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full inline-block">
                                PAGADO
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <div className="bg-black/10 rounded-2xl px-4 py-2 font-black text-lg flex items-center space-x-2">
                          <Clock className={`w-5 h-5 ${isUrgent ? 'animate-pulse text-red-600' : ''}`} />
                          <span>{waitTime}m</span>
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest mt-1.5 opacity-60">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 flex-1 space-y-6">
                    {order.items.map((it, i) => (
                      <div key={i} className={`flex justify-between items-start group ${it.isOld ? 'opacity-40' : ''}`}>
                        <div className="flex-1 pr-4">
                          <h5 className={`text-xl font-black leading-tight uppercase ${it.isOld ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{it.name}</h5>
                          <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${it.isOld ? 'text-gray-300' : 'text-gray-400'}`}>{it.variationLabel} {it.isOld && '(YA PREPARADO)'}</p>
                        </div>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black ${it.isOld ? 'bg-gray-100 text-gray-300' : 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white'}`}>{it.quantity}</div>
                      </div>
                    ))}
                  </div>
                  <div className="p-8 pt-0">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className={`w-full py-8 rounded-[32px] font-black text-xl uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center space-x-3 bg-emerald-500 text-white shadow-emerald-500/30 hover:bg-emerald-600`}
                    >
                      <CheckCircle className="w-8 h-8" />
                      <span>Terminar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-40 opacity-30 dark:text-white"><Monitor className="w-32 h-32 mb-8" /><h3 className="text-3xl font-black uppercase tracking-widest">Cocina Vacía</h3></div>
        )}
      </div>
    );
  };


  const renderDriverDashboard = () => {
    const activeDrivers = drivers.filter(d => d.status !== 'offline');

    if (!selectedDriverIdForPanel) {
      return (
        <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500 pb-32">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase flex items-center">
                <Bike className="w-10 h-10 mr-4 text-primary-500" /> ACCESO REPARTIDORES
              </h2>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Seleccione su perfil para gestionar entregas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {activeDrivers.map(driver => (
              <button
                key={driver.id}
                onClick={() => setSelectedDriverIdForPanel(driver.id)}
                className="bg-white dark:bg-gray-800 p-8 rounded-[48px] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:border-primary-500 transition-all text-left flex items-center space-x-6 group"
              >
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-[32px] flex items-center justify-center text-gray-400 group-hover:bg-primary-500 group-hover:text-white transition-all">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase leading-none mb-2">{driver.name}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${driver.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {driver.status === 'active' ? 'Libre' : 'En Ruta'}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{driver.vehicleType}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    const driver = drivers.find(d => d.id === selectedDriverIdForPanel);
    if (!driver) {
      setSelectedDriverIdForPanel(null);
      return null;
    }

    const currentOrder = orders.find(o => o.assignedDriverId === driver.id && o.status === 'delivery');
    const input = driverInputs[driver.id] || { received: '', ticket: '', operation: '' };
    const amountReceived = parseFloat(input.received) || 0;
    const changeNeeded = currentOrder ? Math.max(0, amountReceived - currentOrder.total) : 0;

    const isInputValid = () => {
      if (!currentOrder) return false;
      if (currentOrder.paymentMethod === 'efectivo') {
        return amountReceived >= currentOrder.total;
      }
      if (currentOrder.paymentMethod === 'tarjeta') {
        return input.ticket.trim() !== '' && input.operation.trim() !== '';
      }
      if (currentOrder.paymentMethod === 'transferencia') {
        return input.operation.trim() !== '';
      }
      return true;
    };

    const getElapsedTime = (startDateStr?: string) => {
      if (!startDateStr) return '00:00';
      const start = new Date(startDateStr).getTime();
      const now = currentTime.getTime();
      const diff = Math.max(0, Math.floor((now - start) / 1000));
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
      <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500 pb-32">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <button title="Volver"
              onClick={() => setSelectedDriverIdForPanel(null)}
              className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-primary-500 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Mi Sesión: {driver.name}</h2>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Panel Individual de Gestión</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto w-full">
          <div className="bg-white dark:bg-gray-800 rounded-[48px] shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700">
            {/* Header Driver */}
            <div className="p-8 bg-gray-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center text-white">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black tracking-tight uppercase truncate">{driver.name}</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{driver.vehicleType} • {driver.phone}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${driver.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {driver.status === 'active' ? 'Disponible' : 'En Ruta'}
              </div>
            </div>

            <div className="p-8 flex-1 space-y-6">
              {currentOrder ? (
                (() => {
                  const start = currentOrder.dispatchedAt ? new Date(currentOrder.dispatchedAt).getTime() : 0;
                  const diff = Math.max(0, Math.floor((currentTime.getTime() - start) / 1000));
                  const isLate = diff > 1800; // 30 minutes

                  return (
                    <>
                      <div className="flex justify-center mb-6">
                        <div className={`${isLate ? 'bg-red-500 animate-pulse' : 'bg-gray-900'} text-white px-6 py-3 rounded-full flex items-center space-x-3 shadow-lg transition-colors duration-500`}>
                          <Clock className={`w-5 h-5 ${isLate ? 'text-white' : 'text-primary-500'}`} />
                          <span className="text-2xl font-black tracking-widest font-mono">{getElapsedTime(currentOrder.dispatchedAt)}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${isLate ? 'text-white/80' : 'text-gray-400'}`}>
                            {isLate ? 'Tiempo Excedido' : 'Tiempo en ruta'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pedido en curso</span>
                          <span className="text-xs font-black text-primary-500 uppercase tracking-widest">{currentOrder.id}</span>
                        </div>
                        <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-700">
                          <p className="font-black text-sm dark:text-white uppercase mb-1">{currentOrder.customerName}</p>
                          <p className="text-xs font-bold text-gray-500 leading-relaxed"><MapPin className="w-3 h-3 inline mr-1" /> {currentOrder.address || 'Recojo en local'}</p>
                          {currentOrder.source === 'tpv' && (
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                              <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg border border-amber-100 font-black text-[9px] uppercase">
                                Venta Directa TPV
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-6 bg-primary-50 dark:bg-primary-900/10 rounded-[32px] border border-primary-100 dark:border-primary-900/20 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Pago: {currentOrder.paymentMethod.toUpperCase()}</span>
                          <span className="text-xl font-black dark:text-white">${currentOrder.total.toFixed(2)}</span>
                        </div>

                        {currentOrder.paymentMethod === 'efectivo' && (
                          <div className="space-y-4 pt-2">
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Monto Recibido</label>
                              <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                <input
                                  type="number"
                                  value={input.received}
                                  onChange={(e) => setDriverInputs(prev => ({ ...prev, [driver.id]: { ...input, received: e.target.value } }))}
                                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-emerald-100 dark:border-emerald-900/20 rounded-2xl text-sm font-black focus:ring-4 focus:ring-emerald-500/10 outline-none"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>

                            {amountReceived > 0 && (
                              <div className="flex justify-between items-center px-2 py-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 animate-in zoom-in-95">
                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Cambio a entregar</span>
                                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">${changeNeeded.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {currentOrder.paymentMethod === 'tarjeta' && (
                          <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-blue-600 uppercase tracking-widest ml-1"># Ticket</label>
                                <input
                                  type="text"
                                  value={input.ticket}
                                  onChange={(e) => setDriverInputs(prev => ({ ...prev, [driver.id]: { ...input, ticket: e.target.value } }))}
                                  className="w-full bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-900/20 rounded-xl text-xs font-black uppercase px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="TK-000"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-blue-600 uppercase tracking-widest ml-1"># Operación</label>
                                <input
                                  type="text"
                                  value={input.operation}
                                  onChange={(e) => setDriverInputs(prev => ({ ...prev, [driver.id]: { ...input, operation: e.target.value } }))}
                                  className="w-full bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-900/20 rounded-xl text-xs font-black uppercase px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="OP-000"
                                />
                              </div>
                            </div>
                            <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center space-x-3 text-blue-600 dark:text-blue-400">
                              <Info className="w-5 h-5" />
                              <p className="text-[10px] font-bold uppercase tracking-wider leading-tight">Ambos campos son obligatorios para tarjeta</p>
                            </div>
                          </div>
                        )}

                        {currentOrder.paymentMethod === 'transferencia' && (
                          <div className="space-y-4 pt-2">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-purple-600 uppercase tracking-widest ml-1"># Referencia Bancaria</label>
                              <input
                                type="text"
                                value={input.operation}
                                onChange={(e) => setDriverInputs(prev => ({ ...prev, [driver.id]: { ...input, operation: e.target.value } }))}
                                className="w-full bg-white dark:bg-gray-800 border-2 border-purple-100 dark:border-purple-900/20 rounded-xl text-xs font-black uppercase px-3 py-2.5 outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Ref: 00000"
                              />
                            </div>
                            <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 flex items-center space-x-3 text-purple-600 dark:text-purple-400">
                              <Info className="w-5 h-5" />
                              <p className="text-[10px] font-bold uppercase tracking-wider leading-tight">Proporcione el número de referencia</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          if (!isInputValid()) {
                            if (currentOrder.paymentMethod === 'efectivo') addNotification('Monto insuficiente', 'error');
                            else if (currentOrder.paymentMethod === 'tarjeta') addNotification('Faltan datos del ticket/operación', 'error');
                            else addNotification('Falta número de referencia', 'error');
                            return;
                          }
                          // Mark as delivered and paid
                          setOrders(prev => prev.map(o => o.id === currentOrder.id ? {
                            ...o,
                            status: 'delivered',
                            paymentStatus: 'paid',
                            paidAt: new Date().toISOString(),
                            ticketNumber: input.ticket || undefined,
                            operationNumber: input.operation || undefined
                          } : o));
                          setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, status: 'active' } : d));
                          setDriverInputs(prev => {
                            const newInputs = { ...prev };
                            delete newInputs[driver.id];
                            return newInputs;
                          });
                          addNotification(`Pedido ${currentOrder.id} entregado y pagado`, 'success');
                        }}
                        disabled={!isInputValid()}
                        className={`w-full py-6 rounded-[32px] font-black text-lg uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center space-x-3 ${isInputValid() ? 'bg-emerald-500 text-white shadow-emerald-500/30 hover:bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed shadow-none'}`}
                      >
                        <CheckCircle className="w-6 h-6" />
                        <span>Entregado y Pagado</span>
                      </button>
                    </>
                  );
                })()
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-gray-300 dark:text-gray-700 space-y-4">
                  <div className="w-20 h-20 rounded-[32px] bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                    <PackageCheck className="w-10 h-10" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.2em]">Sin entregas activas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div >
    );
  };

  const renderDDSSection = () => {
    const readyOrders = orders.filter(o =>
      o.status === 'ready' &&
      !o.address.toLowerCase().includes('mesa') &&
      !o.address.toLowerCase().includes('mostrador')
    );

    const handleDispatchVerify = (orderId: string) => {
      if (dispatchTicketInput.trim().toUpperCase() === orderId.toUpperCase()) {
        updateOrderStatus(orderId, 'delivery');
        setVerifyingDispatchOrderId(null);
        setDispatchTicketInput('');
        setDispatchError(null);
        addNotification(`Orden ${orderId} despachada correctamente`);
        playUISound('success');
      } else {
        setDispatchError('Número de orden incorrecto');
        playUISound('error');
      }
    };

    return (
      <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase flex items-center"><Truck className="w-10 h-10 mr-4 text-blue-500" />PANTALLA DE REPARTO (DDS)</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Logística y Despachos</p>
          </div>
        </div>

        {readyOrders.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pb-20">
            {readyOrders.map(order => {
              const driver = drivers.find(d => d.id === order.assignedDriverId);
              const waitTime = Math.floor((currentTime.getTime() - new Date(order.createdAt).getTime()) / 60000);

              return (
                <div key={order.id} className="bg-white dark:bg-gray-800 rounded-[48px] shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700 relative">
                  {verifyingDispatchOrderId === order.id && (
                    <div className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 z-20 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
                      <button onClick={() => { setVerifyingDispatchOrderId(null); setDispatchError(null); setDispatchTicketInput(''); }} title="Cerrar" className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                      <ShieldCheck className="w-16 h-16 text-blue-500 mb-6" />
                      <h4 className="text-2xl font-black uppercase text-gray-900 dark:text-white mb-2">Despacho</h4>
                      <p className="text-sm text-gray-500 mb-6 text-center font-medium max-w-[200px]">Ingrese No. Orden para autorizar salida</p>

                      <input
                        type="text"
                        value={dispatchTicketInput}
                        onChange={(e) => { setDispatchTicketInput(e.target.value); setDispatchError(null); }}
                        placeholder={`Ej. ${order.id}`}
                        className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-4 font-black text-center text-lg uppercase mb-2 focus:border-blue-500 outline-none tracking-widest"
                        autoFocus
                      />

                      {dispatchError && <p className="text-xs font-bold text-red-500 mb-4 flex items-center bg-red-50 px-3 py-1 rounded-lg"><AlertCircle className="w-3 h-3 mr-1" /> {dispatchError}</p>}

                      <button
                        onClick={() => handleDispatchVerify(order.id)}
                        className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-blue-500/30"
                      >
                        Confirmar Salida
                      </button>
                    </div>
                  )}
                  <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
                    <div className="flex-1 min-w-0 pr-4">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-70">LISTO • {order.id}</span>
                      <h4 className="text-2xl font-black tracking-tight mt-1 uppercase truncate">{order.customerName}</h4>
                      {order.source === 'tpv' && (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                          TPV
                        </span>
                      )}
                    </div>
                    <div className="shrink-0 bg-black/20 rounded-2xl px-4 py-3 font-black text-2xl flex items-center space-x-2 backdrop-blur-sm border border-white/20">
                      <Timer className="w-6 h-6" />
                      <span>{waitTime} min</span>
                    </div>
                  </div>
                  <div className="p-8 flex-1 space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600"><MapPin className="w-6 h-6" /></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Destino</p>
                        <p className="font-bold text-gray-800 dark:text-white leading-relaxed">{order.address || 'Recojo en local'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${driver ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-300 border border-dashed border-gray-200 dark:border-gray-700'}`}>
                          <Bike className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Repartidor</p>
                          <p className="font-black text-sm dark:text-white uppercase">{driver?.name || 'Pendiente'}</p>
                        </div>
                      </div>
                      {!driver && (
                        <button title="Asignar repartidor" onClick={() => setAssigningOrderId(order.id)} className="p-2.5 bg-primary-500 text-white rounded-xl shadow-lg active:scale-95 transition-all"><Plus className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>
                  <div className="p-8 pt-0">
                    <button
                      onClick={() => driver ? setVerifyingDispatchOrderId(order.id) : setAssigningOrderId(order.id)}
                      className={`w-full py-8 rounded-[32px] font-black text-xl uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center space-x-3 ${driver ? 'bg-blue-500 text-white shadow-blue-500/30 hover:bg-blue-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}
                    >
                      {driver ? <Send className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
                      <span>{driver ? 'Despachar' : 'Asignar'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-40 opacity-30 dark:text-white"><Truck className="w-32 h-32 mb-8" /><h3 className="text-3xl font-black uppercase tracking-widest">Sin Despachos</h3></div>
        )}
      </div>
    );
  };

  const renderOrdersTable = () => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-8 border-b border-gray-50 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="ID de pedido o cliente..." className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-gray-900 border-none rounded-3xl text-sm focus:ring-4 focus:ring-primary-500/10 font-medium uppercase outline-none" />
          </div>
          <button className="px-6 py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center"><Filter className="w-4 h-4 mr-3" /> Filtros</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 dark:border-gray-700">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Pedido</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Cliente</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Estado</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Pago</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Repartidor</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {orders.map(o => {
                const statusCfg = STATUS_CONFIG[o.status];
                const paymentCfg = PAYMENT_STATUS_CONFIG[o.paymentStatus];
                const methodCfg = PAYMENT_METHOD_CONFIG[o.paymentMethod];
                return (
                  <tr key={o.id} onClick={() => setViewingOrderId(o.id)} className="hover:bg-gray-50/80 dark:hover:bg-gray-900/50 transition-colors group cursor-pointer">
                    <td className="px-8 py-6 font-black text-sm text-primary-500">
                      <div className="flex items-center space-x-2">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${o.source === 'tpv' ? 'bg-amber-100 text-amber-600' : 'bg-primary-50 text-primary-500'}`}>
                          {o.source === 'tpv' ? <Monitor className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 dark:text-white uppercase leading-none">{o.id}</span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">
                            {o.source === 'tpv' ? 'Venta Directa TPV' : 'Pedido Online'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-900 dark:text-white tracking-tight uppercase leading-none">{o.customerName}</span>
                        <span className="text-[10px] font-bold text-gray-400 mt-1">{o.customerPhone}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full ${statusCfg.color}`}>
                        <statusCfg.icon className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase tracking-widest">{statusCfg.label}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col space-y-1">
                        <div className={`inline-flex items-center justify-center border px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${paymentCfg.color}`}>
                          {paymentCfg.label}
                        </div>
                        <div className="flex items-center space-x-1.5 text-[9px] font-bold text-gray-400 uppercase">
                          <methodCfg.icon className="w-3 h-3" />
                          <span>{methodCfg.label}</span>
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-700/50 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {o.address}</span>
                          {o.source === 'tpv' && (
                            <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg border border-amber-100 font-black">EN DIRECTO</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {o.assignedDriverId ? (
                        <div className="flex items-center space-x-2">
                          <Bike className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-xs font-bold dark:text-white uppercase truncate max-w-[120px]">{drivers.find(d => d.id === o.assignedDriverId)?.name}</span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right font-black text-gray-900 dark:text-white">${o.total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDriverModal = () => {
    if (!editingDriver) return null;

    const isEditing = !!editingDriver.id;

    return (
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setEditingDriver(null)}></div>
        <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
              {isEditing ? 'Editar Repartidor' : 'Nuevo Repartidor'}
            </h4>
            <button title="Cerrar" onClick={() => setEditingDriver(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500" />
                <input
                  type="text"
                  value={editingDriver.name || ''}
                  onChange={e => setEditingDriver({ ...editingDriver, name: e.target.value })}
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-3xl outline-none transition-all font-bold dark:text-white"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Teléfono de Contacto</label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500" />
                <input
                  type="text"
                  value={editingDriver.phone || ''}
                  onChange={e => setEditingDriver({ ...editingDriver, phone: e.target.value })}
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-3xl outline-none transition-all font-bold dark:text-white"
                  placeholder="Ej. 555-0100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Forma de Entrega</label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(VEHICLE_CONFIG) as [VehicleType, typeof VEHICLE_CONFIG['moto']][]).map(([id, cfg]) => (
                  <button
                    key={id}
                    onClick={() => setEditingDriver({ ...editingDriver, vehicleType: id })}
                    className={`flex items-center space-x-3 p-4 rounded-2xl border-2 transition-all ${editingDriver.vehicleType === id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 text-gray-400'}`}
                  >
                    <cfg.icon className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-tight">{cfg.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => saveDriver(editingDriver)}
              className="w-full py-5 bg-gray-900 dark:bg-primary-500 text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl flex items-center justify-center space-x-3"
            >
              <Check className="w-5 h-5" />
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Repartidor'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── STAFF MANAGEMENT ──────────────────────────────────
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('waiter');
  const [staffRoleFilter, setStaffRoleFilter] = useState<StaffRole | 'all'>('all');

  const ROLE_CONFIG: Record<StaffRole, { label: string; color: string; bg: string; icon: any }> = {
    admin: { label: 'Administrador', color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/30', icon: Shield },
    cashier: { label: 'Cajero(a)', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: Wallet },
    waiter: { label: 'Mesero(a)', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: Users },
    cook: { label: 'Cocinero(a)', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: ChefHat },
    driver: { label: 'Repartidor', color: 'text-teal-600', bg: 'bg-teal-100 dark:bg-teal-900/30', icon: Bike },
  };

  const addStaffMember = () => {
    if (!newStaffName.trim()) return;
    const newMember: Staff = {
      id: `S-${Date.now()}`,
      name: newStaffName.trim(),
      phone: newStaffPhone.trim() || 'N/A',
      role: newStaffRole,
      status: 'active',
    };
    setStaff(prev => [...prev, newMember]);
    addNotification(`${ROLE_CONFIG[newStaffRole].label} "${newStaffName}" registrado`, 'success');
    setNewStaffName('');
    setNewStaffPhone('');
    setNewStaffRole('waiter');
  };

  const deleteStaffMember = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
    addNotification('Personal eliminado', 'info');
  };

  const toggleStaffStatus = (id: string) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'offline' : 'active' } : s));
  };

  const renderStaffManagement = () => {
    const filteredStaff = staffRoleFilter === 'all' ? staff : staff.filter(s => s.role === staffRoleFilter);
    const showDriverSection = staffRoleFilter === 'all' || staffRoleFilter === 'driver';

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none flex items-center gap-4">
              <Shield className="w-10 h-10 text-violet-500" />
              Gestión de Personal
            </h3>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2 ml-14">Administra tu equipo completo y roles</p>
          </div>
          <div className="flex items-center gap-3">
            {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
              const count = role === 'driver' ? (staff.filter(s => s.role === 'driver').length + drivers.length) : staff.filter(s => s.role === role).length;
              return (
                <div key={role} className={`px-3 py-1.5 rounded-xl ${cfg.bg} flex items-center gap-1.5`}>
                  <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  <span className={`text-[9px] font-black uppercase tracking-widest ${cfg.color}`}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            onClick={() => setStaffRoleFilter('all')}
            className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border-2 transition-all whitespace-nowrap active:scale-95 ${staffRoleFilter === 'all' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700 hover:border-gray-200'}`}
          >
            Todos ({staff.length + drivers.length})
          </button>
          {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
            const count = role === 'driver' ? (staff.filter(s => s.role === 'driver').length + drivers.length) : staff.filter(s => s.role === role).length;
            return (
              <button
                key={role}
                onClick={() => setStaffRoleFilter(role as StaffRole)}
                className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border-2 transition-all whitespace-nowrap active:scale-95 flex items-center gap-2 ${staffRoleFilter === role ? `${cfg.bg} ${cfg.color} border-current shadow-lg` : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700 hover:border-gray-200'}`}
              >
                <cfg.icon className="w-3.5 h-3.5" />
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Add Staff Form */}
        <div className="relative bg-white dark:bg-gray-800 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="absolute top-0 right-0 w-60 h-60 rounded-full bg-violet-500/5 blur-3xl"></div>
          <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-violet-500" />
            Registrar Personal
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre</label>
              <input
                type="text"
                value={newStaffName}
                onChange={e => setNewStaffName(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-3 font-bold text-sm outline-none focus:border-violet-500 transition-all uppercase"
                placeholder="Ej. Juan Pérez"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono</label>
              <input
                type="tel"
                value={newStaffPhone}
                onChange={e => setNewStaffPhone(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-3 font-bold text-sm outline-none focus:border-violet-500 transition-all"
                placeholder="555-0000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rol</label>
              <div className="relative">
                <select
                  value={newStaffRole}
                  onChange={e => setNewStaffRole(e.target.value as StaffRole)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-3 font-bold text-sm outline-none focus:border-violet-500 transition-all uppercase appearance-none"
                  title="Seleccionar rol del personal"
                  aria-label="Seleccionar rol del personal"
                >
                  {Object.entries(ROLE_CONFIG).filter(([role]) => role !== 'driver').map(([role, cfg]) => (
                    <option key={role} value={role}>{cfg.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={addStaffMember}
                disabled={!newStaffName.trim()}
                className="w-full py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
          </div>
        </div>

        {/* Staff Grid (non-driver roles) */}
        {filteredStaff.filter(s => s.role !== 'driver').length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaff.filter(s => s.role !== 'driver').map(member => {
              const rCfg = ROLE_CONFIG[member.role];
              return (
                <div
                  key={member.id}
                  className={`relative bg-white dark:bg-gray-800 rounded-[28px] p-6 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 group ${member.status === 'offline' ? 'opacity-60' : ''}`}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${rCfg.bg}`}></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center space-x-4">
                        <div className={`w-14 h-14 rounded-2xl ${rCfg.bg} flex items-center justify-center`}>
                          <rCfg.icon className={`w-7 h-7 ${rCfg.color}`} />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-black text-lg text-gray-900 dark:text-white tracking-tight truncate uppercase">{member.name}</h5>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${rCfg.color}`}>{rCfg.label}</span>
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full mt-1 ${member.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div>
                    </div>
                    <div className="flex items-center text-xs font-bold text-gray-400 mb-5 gap-2">
                      <Smartphone className="w-3.5 h-3.5" />
                      {member.phone}
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-50 dark:border-gray-700 pt-4">
                      <button
                        onClick={() => toggleStaffStatus(member.id)}
                        className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${member.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-gray-50 text-gray-400 border-gray-100 dark:bg-gray-900 dark:border-gray-700'}`}
                      >
                        {member.status === 'active' ? 'Activo' : 'Inactivo'}
                      </button>
                      <button
                        title="Eliminar personal"
                        onClick={() => deleteStaffMember(member.id)}
                        className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delivery Drivers Section */}
        {showDriverSection && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center">
                  <Bike className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Equipo de Reparto</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{drivers.length} repartidores • {drivers.filter(d => d.status === 'active').length} disponibles</p>
                </div>
              </div>
              <button
                onClick={() => setEditingDriver({ name: '', phone: '', vehicleType: 'moto' })}
                className="flex items-center bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-teal-500/20 gap-2"
              >
                <UserPlus className="w-4 h-4" /> Nuevo Repartidor
              </button>
            </div>

            {drivers.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-[32px] p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Bike className="w-10 h-10 text-teal-400" />
                </div>
                <p className="font-black text-gray-900 dark:text-white uppercase text-sm">No hay repartidores</p>
                <p className="text-xs text-gray-400 mt-1">Agrega tu primer repartidor para comenzar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drivers.map(driver => {
                  const vCfg = VEHICLE_CONFIG[driver.vehicleType] || VEHICLE_CONFIG.moto;
                  return (
                    <div key={driver.id} className="bg-white dark:bg-gray-800 p-7 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700 group hover:shadow-xl transition-all relative overflow-hidden hover:-translate-y-0.5">
                      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-teal-500/5 blur-3xl"></div>
                      <div className="relative z-10">
                        {/* Driver Header */}
                        <div className="flex items-center space-x-4 mb-6">
                          <div className="relative">
                            <div className="w-14 h-14 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center group-hover:rotate-3 transition-transform">
                              <vCfg.icon className="w-7 h-7 text-teal-500" />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-3 border-white dark:border-gray-800 ${driver.status === 'active' ? 'bg-emerald-500' : driver.status === 'busy' ? 'bg-amber-500 animate-pulse' : 'bg-gray-400'}`}></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-black text-lg text-gray-900 dark:text-white tracking-tight truncate uppercase">{driver.name}</h5>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${driver.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : driver.status === 'busy' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'}`}>
                                {driver.status === 'active' ? 'Libre' : driver.status === 'busy' ? 'En Ruta' : 'Fuera'}
                              </span>
                              <span className="text-[8px] font-black text-teal-500 uppercase tracking-widest">{vCfg.label}</span>
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="bg-gray-50 dark:bg-gray-900/50 p-3.5 rounded-2xl text-center">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Entregas</p>
                            <p className="text-xl font-black text-gray-900 dark:text-white">{driver.deliveriesCompleted}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900/50 p-3.5 rounded-2xl text-center">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Puntaje</p>
                            <div className="flex items-center justify-center space-x-1">
                              <Star className="w-4 h-4 text-amber-400 fill-current" />
                              <span className="text-xl font-black text-gray-900 dark:text-white">{driver.rating}</span>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between border-t border-gray-50 dark:border-gray-700 pt-4 text-gray-400">
                          <span className="flex items-center text-xs font-bold gap-1.5">
                            <Smartphone className="w-3.5 h-3.5" /> {driver.phone}
                          </span>
                          <div className="flex gap-1">
                            <button title="Editar repartidor" onClick={() => setEditingDriver(driver)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors opacity-0 group-hover:opacity-100">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button title="Eliminar repartidor" onClick={() => deleteDriver(driver.id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCustomerList = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Clientes</h3>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">{customers.length} Registrados</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
              placeholder="BUSCAR CLIENTE..."
              className="pl-10 pr-4 py-4 bg-white dark:bg-gray-800 rounded-3xl border-2 border-transparent focus:border-primary-500 outline-none w-full md:w-64 shadow-sm transition-all text-sm font-bold placeholder:text-gray-300 uppercase tracking-wide"
            />
          </div>

          <button
            onClick={() => {
              setRegName('');
              setRegPhone('');
              setRegAddress('');
              setRegAddresses([]);
              setIsRegisteringCustomer(true);
            }}
            className="flex items-center bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl gap-3 whitespace-nowrap"
          >
            <UserPlus className="w-5 h-5" />
            <span className="hidden sm:inline">Nuevo Cliente</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {customers.filter(c =>
          c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
          c.phone.includes(customerSearchTerm)
        ).map(customer => (
          <div key={customer.id} className="bg-white dark:bg-gray-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-black text-lg text-gray-900 dark:text-white uppercase">{customer.name}</h5>
                <p className="text-xs text-gray-500">{customer.phone}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-2xl">
                <p className="text-[10px] uppercase tracking-widest text-gray-400">Pedidos</p>
                <p className="font-black text-lg">{customer.totalOrders}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-2xl">
                <p className="text-[10px] uppercase tracking-widest text-gray-400">Total</p>
                <p className="font-black text-lg">${customer.totalSpent.toFixed(2)}</p>
              </div>
            </div>
            <button
              onClick={() => setEditingCustomer(customer)}
              className="mt-6 w-full py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl flex items-center justify-center text-xs font-black uppercase tracking-widest text-gray-500 hover:text-primary-500 transition-all"
            >
              <Info className="w-4 h-4 mr-2" /> Detalles
            </button>
          </div>
        ))}
      </div>
    </div >
  );

  const renderCustomerModal = () => {
    if (!editingCustomer) return null;

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setEditingCustomer(null)}></div>
        <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
          <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <div>
              <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Editar Cliente</h4>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">ID: {editingCustomer.id}</p>
            </div>
            <button title="Cerrar" onClick={() => setEditingCustomer(null)} className="p-2 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"><X className="w-6 h-6" /></button>
          </div>

          <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nombre</label>
                <input
                  type="text"
                  placeholder="Nombre del cliente"
                  value={editingCustomer.name}
                  onChange={e => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-2xl px-4 py-3 font-bold outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono</label>
                <input
                  type="text"
                  placeholder="Teléfono del cliente"
                  value={editingCustomer.phone}
                  onChange={e => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-2xl px-4 py-3 font-bold outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Direcciones Guardadas</label>
                <button
                  onClick={() => {
                    const newAddr = prompt("Nueva dirección:");
                    if (newAddr) setEditingCustomer({ ...editingCustomer, addresses: [...(editingCustomer.addresses || []), newAddr] });
                  }}
                  className="text-[10px] font-black uppercase text-primary-500 hover:text-primary-600 bg-primary-50 px-3 py-1 rounded-lg transition-colors"
                >
                  + Agregar
                </button>
              </div>

              {(!editingCustomer.addresses || editingCustomer.addresses.length === 0) ? (
                <p className="text-sm text-gray-400 italic text-center py-4">Sin direcciones guardadas</p>
              ) : (
                <div className="space-y-2">
                  {editingCustomer.addresses.map((addr, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-xl group">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{addr}</span>
                      <button title="Eliminar dirección"
                        onClick={() => setEditingCustomer({ ...editingCustomer, addresses: editingCustomer.addresses.filter((_, i) => i !== idx) })}
                        className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl text-center">
                <p className="text-[10px] uppercase tracking-widest text-blue-400 font-black">Total Gastado</p>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">${editingCustomer.totalSpent.toFixed(2)}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl text-center">
                <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-black">Última Compra</p>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {new Date(editingCustomer.lastOrderDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button
              onClick={() => {
                setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? editingCustomer : c));
                setEditingCustomer(null);
                addNotification('Cliente actualizado', 'success');
              }}
              className="w-full py-4 bg-gray-900 dark:bg-primary-500 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderRegisterCustomerModal = () => {
    if (!isRegisteringCustomer) return null;

    return (
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsRegisteringCustomer(false)}></div>
        <div className="bg-white dark:bg-gray-800 w-full max-w-xl rounded-[48px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

          {/* Header Premium */}
          <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex justify-between items-center relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div>
              <h4 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Alta de Cliente</h4>
              <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em] mt-3">Registro de base de datos VIP</p>
            </div>
            <button
              onClick={() => setIsRegisteringCustomer(false)}
              title="Cerrar registro"
              className="relative z-10 p-4 bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all group"
            >
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    autoFocus
                    className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-2xl pl-12 pr-4 py-4 font-bold outline-none transition-all uppercase"
                    placeholder="Escriba el nombre..."
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono Móvil</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-2xl pl-12 pr-4 py-4 font-bold outline-none transition-all"
                    placeholder="10 dígitos..."
                  />
                </div>
              </div>
            </div>

            {/* Dirección Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Gestionar Direcciones</label>
                <span className="text-[10px] font-bold text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-full uppercase">{regAddresses.length} Guardadas</span>
              </div>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={regAddress}
                    onChange={e => setRegAddress(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && regAddress.trim()) {
                        setRegAddresses([...regAddresses, regAddress.trim()]);
                        setRegAddress('');
                      }
                    }}
                    className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-2xl pl-12 pr-4 py-4 font-bold outline-none transition-all"
                    placeholder="Calle, Número, Colonia..."
                  />
                </div>
                <button
                  onClick={() => {
                    if (regAddress.trim()) {
                      setRegAddresses([...regAddresses, regAddress.trim()]);
                      setRegAddress('');
                    }
                  }}
                  title="Agregar dirección"
                  className="px-6 bg-primary-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary-500/20"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {regAddresses.map((addr, idx) => (
                  <div key={idx} className="flex justify-between items-center p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2 duration-300 group">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-primary-500 shadow-sm font-black text-xs">{idx + 1}</div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase italic">{addr}</span>
                    </div>
                    <button
                      onClick={() => setRegAddresses(regAddresses.filter((_, i) => i !== idx))}
                      title="Eliminar dirección"
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button
              onClick={() => {
                if (!regName || !regPhone) {
                  addNotification('Mínimo nombre y teléfono requeridos', 'error');
                  return;
                }

                const existingCustomer = customers.find(c => c.phone === regPhone);
                if (existingCustomer) {
                  setCustomers(prev => prev.map(c => {
                    if (c.id === existingCustomer.id) {
                      const updatedAddresses = [...new Set([...c.addresses, ...regAddresses])];
                      return { ...c, name: regName, addresses: updatedAddresses };
                    }
                    return c;
                  }));
                  addNotification('Cliente actualizado', 'success');
                } else {
                  const newCustomer: Customer = {
                    id: `cust-${Date.now()}`,
                    name: regName,
                    phone: regPhone,
                    email: '',
                    totalOrders: 0,
                    totalSpent: 0,
                    lastOrderDate: new Date().toISOString(),
                    addresses: regAddresses
                  };
                  setCustomers(prev => [...prev, newCustomer]);
                  addNotification('Cliente registrado en base de datos', 'success');
                }

                // Update TPV states with primary data
                setTpvCustomerName(regName);
                setTpvCustomerPhone(regPhone);
                if (regAddresses.length > 0) {
                  setTpvAddress(regAddresses[0]);
                  setTpvDeliveryType('delivery');
                }

                setIsRegisteringCustomer(false);
              }}
              className="w-full py-6 bg-gray-900 dark:bg-primary-500 text-white rounded-[28px] font-black uppercase tracking-[0.2em] hover:scale-[1.01] active:scale-[0.99] transition-all shadow-2xl flex items-center justify-center space-x-4"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span>Confirmar y Guardar Registro</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSearchCustomerModal = () => {
    if (!isSearchingCustomer) return null;

    return (
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsSearchingCustomer(false)}></div>
        <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-gray-900 text-white relative">
            <h4 className="text-2xl font-black tracking-tighter uppercase">Buscar Cliente</h4>
            <p className="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em] mt-1">Ingrese el número de teléfono</p>
            <button title="Cerrar búsqueda" onClick={() => setIsSearchingCustomer(false)} className="absolute top-8 right-8 text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono del Cliente</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500" />
                <input
                  type="text"
                  value={searchPhone}
                  onChange={e => setSearchPhone(e.target.value)}
                  autoFocus
                  className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-2xl pl-12 pr-4 py-4 font-black text-lg outline-none transition-all"
                  placeholder="Ej. 555-0100"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!searchPhone.trim()) {
                  addNotification('Ingrese un número para buscar', 'error');
                  return;
                }

                const customer = customers.find(c => c.phone === searchPhone.trim());

                if (customer) {
                  setTpvCustomerPhone(searchPhone.trim());
                  setTpvCustomerName(customer.name);
                  setFoundCustomer(customer);
                  playUISound('success');
                } else {
                  setRegPhone(searchPhone.trim());
                  setRegName('');
                  setRegAddress('');
                  setIsRegisteringCustomer(true);
                  addNotification('Cliente no registrado. Iniciando registro...', 'info');
                }

                setIsSearchingCustomer(false);
                setSearchPhone('');
              }}
              className="w-full py-5 bg-primary-500 text-white rounded-3xl font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary-500/25 flex items-center justify-center space-x-3"
            >
              <Search className="w-5 h-5" />
              <span>Realizar Búsqueda</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFoundCustomerModal = () => {
    if (!foundCustomer) return null;

    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setFoundCustomer(null)}></div>
        <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-emerald-500 text-white flex justify-between items-center">
            <div>
              <h4 className="text-2xl font-black tracking-tighter uppercase">Cliente Encontrado</h4>
              <p className="text-xs font-bold opacity-80 uppercase tracking-widest mt-1">{foundCustomer.name}</p>
            </div>
            <CheckCircle2 className="w-10 h-10 opacity-50" />
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Seleccione una dirección:</label>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setTpvAddress('Mostrador');
                    setTpvDeliveryType('store');
                    setFoundCustomer(null);
                    addNotification('Pedido en mostrador', 'info');
                  }}
                  className="w-full p-6 bg-gray-50 dark:bg-gray-900 border-2 border-transparent hover:border-primary-500 rounded-[32px] text-left transition-all active:scale-[0.98] group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary-100 text-primary-600 rounded-2xl group-hover:rotate-12 transition-transform">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 dark:text-white uppercase text-sm">Mostrador / Local</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Sin envío a domicilio</p>
                    </div>
                  </div>
                </button>

                {foundCustomer.addresses.map((addr, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTpvAddress(addr);
                      setTpvDeliveryType('delivery');
                      setFoundCustomer(null);
                      addNotification('Dirección cargada', 'success');
                    }}
                    className="w-full p-6 bg-gray-50 dark:bg-gray-900 border-2 border-transparent hover:border-emerald-500 rounded-[32px] text-left transition-all active:scale-[0.98] group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl group-hover:rotate-12 transition-transform">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 dark:text-white uppercase text-sm truncate">{addr}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Dirección guardada #{idx + 1}</p>
                      </div>
                    </div>
                  </button>
                ))}

                <button
                  onClick={() => {
                    setTpvAddress('');
                    setTpvDeliveryType('delivery');
                    setFoundCustomer(null);
                    addNotification('Ingrese la nueva dirección', 'info');
                  }}
                  className="w-full p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-500 rounded-[32px] text-center transition-all bg-transparent group"
                >
                  <p className="font-black text-gray-400 group-hover:text-blue-500 uppercase text-xs tracking-widest">+ Otra dirección nueva</p>
                </button>
              </div>
            </div>

            <button
              onClick={() => setFoundCustomer(null)}
              className="w-full py-4 text-gray-500 font-black uppercase text-[10px] tracking-[0.3em] hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cerrar sin cambios
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTPVSection = () => {
    const filteredItems = menuItems.filter(item =>
      item.isActive && (
        item.name.toLowerCase().includes(tpvSearch.toLowerCase()) ||
        item.description.toLowerCase().includes(tpvSearch.toLowerCase())
      )
    );

    const cartTotal = tpvCart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

    const addToCart = (item: MenuItem, variationIdx: number) => {
      const variation = item.variations[variationIdx];
      const cartItemId = `${item.id}-${variation.id}`;

      setTpvCart(prev => {
        const existing = prev.find(i => i.id === cartItemId);
        if (existing) {
          return prev.map(i => i.id === cartItemId ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return [...prev, {
          id: cartItemId,
          name: item.name,
          variationLabel: variation.label,
          price: variation.price,
          quantity: 1
        }];
      });
      playUISound('addToCart');
      addNotification(`${item.name} (${variation.label}) añadido`, 'success');
    };

    const createTPVOrder = () => {
      if (tpvCart.length === 0) {
        addNotification('El carrito está vacío', 'error');
        return;
      }

      if (tpvDeliveryType === 'delivery' && !tpvAddress) {
        addNotification('La dirección de entrega es obligatoria para envíos', 'error');
        playUISound('error');
        return;
      }

      const isTable = tpvDeliveryType === 'table';
      const tableNumber = parseInt(tpvAddress);

      // Check if there's an active order for this table
      const existingOrderId = isTable ? activeTableOrders[tableNumber] : null;

      if (isTable && existingOrderId) {
        // MERGE logic: Update existing order
        setOrders(prev => prev.map(o => {
          if (o.id === existingOrderId) {
            // Mark all CURRENT items as "Old" (already sent to kitchen)
            const markedPreviousItems = o.items.map(item => ({ ...item, isOld: true }));
            // Add new items from current cart
            const newItems = tpvCart.map(item => ({ ...item, isOld: false }));

            return {
              ...o,
              items: [...markedPreviousItems, ...newItems],
              total: o.total + cartTotal,
              status: 'kitchen',
              waiterId: tpvWaiterId || o.waiterId
            };
          }
          return o;
        }));

        addNotification(`Pedido agregado a Mesa ${tableNumber}`, 'kitchen');
      } else {
        // CREATE logic: New order
        const finalAddress = tpvDeliveryType === 'store' ? `Mostrador: ${tpvAddress || 'Sin notas'}` :
          isTable ? `Mesa: ${tpvAddress || 'Sin número'}` :
            tpvAddress || 'Dirección no especificada';

        const orderId = isTable
          ? `MESA-${tableNumber}-${Math.floor(Math.random() * 1000)}`
          : `TPV-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

        const newOrder: Order = {
          id: orderId,
          customerName: tpvCustomerName || (isTable ? `Mesa ${tableNumber}` : 'Cliente TPV'),
          customerPhone: tpvCustomerPhone || 'N/A',
          address: finalAddress,
          items: [...tpvCart],
          total: cartTotal,
          status: 'kitchen',
          paymentMethod: 'efectivo',
          paymentStatus: 'pending',
          createdAt: new Date().toISOString(),
          source: 'tpv',
          waiterId: tpvWaiterId || undefined
        };

        if (isTable && tableNumber) {
          setActiveTableOrders(prev => ({ ...prev, [tableNumber]: orderId }));
        }

        setOrders(prev => [newOrder, ...prev]);

        if (tpvDeliveryType === 'store') {
          // Auto-trigger payment for store orders
          setViewingOrderId(newOrder.id);
          setIsConfirmingPayment(true);
          setTempPaymentMethod('efectivo');
        } else {
          addNotification(`Pedido ${newOrder.id} enviado a Cocina`, 'kitchen');
        }
      }

      setTpvCart([]);
      setTpvCustomerName('');
      setTpvCustomerPhone('');
      setTpvAddress('');
      setTpvDeliveryType('store');
      setTpvWaiterId(null);
    };

    return (
      <div className="flex flex-col lg:flex-row gap-8 h-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm h-[70vh] lg:h-auto">
          <div className="p-8 border-b border-gray-50 dark:border-gray-700 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">En Directo TPV</h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">Punto de venta integrado</p>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar platillo..."
                  value={tpvSearch}
                  onChange={(e) => setTpvSearch(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none transition-all font-bold text-sm"
                />
              </div>
            </div>

            <CategoryTabs activeTab={activeTab} setActiveTab={setActiveTab} categories={categories} />
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.filter(i => {
                if (activeTab === 'cat-3') {
                  return i.categoryId !== 'cat-1' && i.categoryId !== 'cat-2' && i.categoryId !== 'cat-desayunos';
                }
                return i.categoryId === activeTab;
              }).slice(0, visibleItemsCount).map(item => (
                <div key={item.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-[32px] p-6 border border-transparent hover:border-primary-500 transition-all group">
                  <h5 className="font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2 truncate">{item.name}</h5>
                  <p className="text-[10px] text-gray-400 font-bold uppercase line-clamp-2 mb-4 h-8">{item.description}</p>

                  <div className="space-y-2">
                    {item.variations.map((v, idx) => (
                      <button
                        key={v.id}
                        onClick={() => addToCart(item, idx)}
                        className="w-full flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-primary-500 hover:text-white transition-all group"
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest">{v.label}</span>
                        <span className="text-xs font-black">${v.price.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {filteredItems.filter(i => {
              if (activeTab === 'cat-3') {
                return i.categoryId !== 'cat-1' && i.categoryId !== 'cat-2' && i.categoryId !== 'cat-desayunos';
              }
              return i.categoryId === activeTab;
            }).length > visibleItemsCount && (
                <button
                  onClick={() => setVisibleItemsCount(prev => prev + 6)}
                  className="w-full py-4 mt-8 bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  Mostrar más resultados ({filteredItems.filter(i => {
                    if (activeTab === 'cat-3') {
                      return i.categoryId !== 'cat-1' && i.categoryId !== 'cat-2' && i.categoryId !== 'cat-desayunos';
                    }
                    return i.categoryId === activeTab;
                  }).length - visibleItemsCount} restantes)
                </button>
              )}
          </div>
        </div>

        <div className="w-full lg:w-[420px] flex flex-col bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-2xl overflow-hidden h-auto">
          <div className="p-8 border-b border-gray-50 dark:border-gray-700 bg-gray-900 text-white">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xl font-black tracking-tighter uppercase">Nueva Orden</h4>
              <button onClick={() => setTpvCart([])} title="Vaciar carrito" className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"><Trash2 className="w-5 h-5" /></button>
            </div>
            <p className="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em]">Resumen de Comanda</p>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
            {tpvCart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-700 space-y-4 py-20">
                <ShoppingBag className="w-16 h-16 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest">Carrito Vacío</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tpvCart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-gray-700 italic">
                    <div className="flex-1">
                      <p className="text-sm font-black text-gray-900 dark:text-white uppercase leading-tight">{item.name}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.variationLabel} x{item.quantity}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-black text-gray-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</p>
                      <div className="flex items-center justify-end space-x-2 mt-1">
                        <button onClick={() => setTpvCart(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it))} title="Reducir cantidad" className="p-1 hover:text-primary-500"><ChevronDown className="w-3 h-3" /></button>
                        <button onClick={() => setTpvCart(prev => prev.filter((_, i) => i !== idx))} title="Eliminar del carrito" className="p-1 text-red-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-8 bg-gray-50 dark:bg-gray-900/50 space-y-6">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTpvCustomerName('Público en general');
                  setTpvCustomerPhone('-');
                  setTpvDeliveryType('store');
                  setTpvAddress('Mostrador');
                }}
                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-700 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all"
              >
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Venta Rápida</span>
              </button>

              <button
                onClick={() => {
                  setSearchPhone('');
                  setIsSearchingCustomer(true);
                }}
                className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all"
              >
                <UserCheck className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Buscar Cliente</span>
              </button>

              <button
                onClick={() => {
                  setRegName(tpvCustomerName);
                  setRegPhone(tpvCustomerPhone);
                  setRegAddress(tpvAddress === 'Mostrador' ? '' : tpvAddress);
                  setIsRegisteringCustomer(true);
                }}
                className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Guardar Cliente</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Cliente</label>
                  <input
                    type="text" value={tpvCustomerName} onChange={e => setTpvCustomerName(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border-none rounded-xl text-xs font-black px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Nombre"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Teléfono</label>
                  <input
                    type="text" value={tpvCustomerPhone} onChange={e => setTpvCustomerPhone(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border-none rounded-xl text-xs font-black px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Tel"
                  />
                </div>
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Tipo de Entrega</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => { setTpvDeliveryType('store'); setTpvAddress('Mostrador'); }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${tpvDeliveryType === 'store' ? 'bg-primary-50 border-primary-500 text-primary-600' : 'bg-white border-gray-100 text-gray-400 hover:border-primary-200'}`}
                  >
                    <Store className="w-5 h-5 mb-1" />
                    <span className="text-[9px] font-black uppercase">Mostrador</span>
                  </button>
                  <button
                    onClick={() => { setTpvDeliveryType('table'); setTpvAddress(''); }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${tpvDeliveryType === 'table' ? 'bg-primary-50 border-primary-500 text-primary-600' : 'bg-white border-gray-100 text-gray-400 hover:border-primary-200'}`}
                  >
                    <Utensils className="w-5 h-5 mb-1" />
                    <span className="text-[9px] font-black uppercase">Mesa</span>
                  </button>
                  <button
                    onClick={() => { setTpvDeliveryType('delivery'); setTpvAddress(''); }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${tpvDeliveryType === 'delivery' ? 'bg-primary-50 border-primary-500 text-primary-600' : 'bg-white border-gray-100 text-gray-400 hover:border-primary-200'}`}
                  >
                    <Bike className="w-5 h-5 mb-1" />
                    <span className="text-[9px] font-black uppercase">Reparto</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">
                  {tpvDeliveryType === 'store' ? 'Notas / Referencia' : tpvDeliveryType === 'table' ? 'Seleccione Número de Mesa' : 'Dirección de Entrega'}
                </label>

                {tpvDeliveryType === 'table' ? (
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => {
                          setTpvAddress(n.toString());
                          playUISound('click');
                        }}
                        className={`py-3 rounded-xl font-black text-xs transition-all border ${tpvAddress === n.toString() ? 'bg-primary-500 border-primary-500 text-white shadow-lg scale-105' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-primary-200'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={tpvAddress}
                    onChange={e => setTpvAddress(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border-none rounded-xl text-xs font-black px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={tpvDeliveryType === 'store' ? 'Opcional (Ej. Silla azul)' : 'Calle, Número, Colonia'}
                  />
                )}
              </div>
            </div>

            <div className="flex justify-between items-center py-4 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total comanda</span>
              <span className="text-3xl font-black text-gray-900 dark:text-white">${cartTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={createTPVOrder}
              disabled={tpvCart.length === 0}
              className={`w-full py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center space-x-3 transition-all ${tpvCart.length > 0 ? 'bg-emerald-500 text-white hover:scale-[1.02] active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              <Send className="w-5 h-5" />
              <span>Enviar a Cocina</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-300 font-sans">
      <div className="fixed top-8 right-8 z-[500] flex flex-col gap-4 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="pointer-events-auto flex items-center gap-4 px-6 py-5 rounded-3xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 animate-in slide-in-from-right fade-in duration-500 min-w-[320px]">
            <div className={`p-3 rounded-2xl ${n.type === 'kitchen' ? 'bg-amber-50 text-amber-500' : n.type === 'success' ? 'bg-emerald-50 text-emerald-500' : n.type === 'info' ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}`}>
              {n.type === 'kitchen' ? <Bell className="w-6 h-6 animate-bounce" /> : n.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : n.type === 'info' ? <Info className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">{n.type === 'kitchen' ? 'COCINA' : n.type.toUpperCase()}</p>
              <p className="text-sm font-bold text-gray-800 dark:text-white">{n.message}</p>
            </div>
            <button onClick={() => setNotifications(prev => prev.filter(notif => notif.id !== n.id))} title="Cerrar notificación" className="text-gray-300 hover:text-gray-500 transition-colors"><X className="w-5 h-5" /></button>
          </div>
        ))}
      </div>

      <Sidebar
        isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}
        isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onExitToSite={onExit} activeSection={activeSection}
        onSectionChange={(s) => {
          if (LOGISTICS_SECTIONS.includes(s) && !unlockedSections.has(s)) {
            setPendingLogisticsSection(s);
            setLogisticsPasswordInput('');
            setLogisticsPasswordError(false);
            setIsSidebarOpen(false);
            return;
          }
          setActiveSection(s);
          setIsSidebarOpen(false);
          playUISound('click');
        }}
        badges={badges}
        isFullScreen={isFullScreen}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          onOpenSidebar={() => setIsSidebarOpen(true)}
          isFullScreen={isFullScreen}
          onPreview={() => setShowPreview(true)}
          currentTime={currentTime}
          notifications={notificationHistory}
          onClearNotifications={() => setNotificationHistory([])}
          onRemoveNotification={(id) => setNotificationHistory(prev => prev.filter(n => n.id !== id))}
          title={
            activeSection === 'menu' ? 'Editor de Menú' :
              activeSection === 'kds' ? 'Comandas' :
                activeSection === 'dds' ? 'Reparto' :
                  activeSection === 'driver_dashboard' ? 'Panel Repartidores' :
                    activeSection === 'local_dispatch' ? 'Despacho Local' :
                      activeSection === 'kitchen' ? 'Logística' :
                        activeSection === 'orders' ? 'Pedidos' :
                          activeSection === 'customers' ? 'Clientes' :
                            activeSection === 'staff_management' ? 'Gestión Personal' :
                              'Dashboard'
          }
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-[#F8FAFC] dark:bg-gray-950/20 relative">
          <div className="mx-auto h-full">
            {activeSection === 'dashboard' && renderDashboard()}
            {activeSection === 'tpv' && renderTPVSection()}
            {activeSection === 'local_dispatch' && (
              <LocalDispatchSection
                orders={orders}
                setOrders={setOrders}
                activeTableOrders={activeTableOrders}
                setActiveTableOrders={setActiveTableOrders}
                onPrintTicket={generateTicket}
                onAddOrder={(tableNum, waiterId) => {
                  setTpvDeliveryType('table');
                  setTpvAddress(tableNum.toString());
                  setTpvWaiterId(waiterId);
                  setActiveSection('tpv');
                  playUISound('click');
                }}
                staff={staff}
                lockedWaiterId={undefined}
              />
            )}


            {activeSection === 'orders' && renderOrdersTable()}
            {activeSection === 'kds' && renderKDSSection()}
            {activeSection === 'dds' && renderDDSSection()}
            {activeSection === 'driver_dashboard' && renderDriverDashboard()}
            {activeSection === 'customers' && renderCustomerList()}
            {activeSection === 'reports' && <ReportsSection orders={orders} drivers={drivers} customers={customers} menuItems={menuItems} />}
            {activeSection === 'staff_management' && renderStaffManagement()}
            {renderCustomerModal()}
            {renderRegisterCustomerModal()}
            {renderSearchCustomerModal()}
            {renderFoundCustomerModal()}
            {activeSection === 'menu' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CategoryTabs activeTab={activeTab} setActiveTab={setActiveTab} categories={categories} onAddCategory={() => {
                  const name = prompt('Nueva categoría:');
                  if (name) { setCategories([...categories, { id: `cat-${Date.now()}`, name }]); addNotification(`Categoría creada`); }
                }} />
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                  <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">{activeCategoryName}</h3>
                  <button onClick={addItem} className="flex items-center justify-center bg-gray-900 dark:bg-primary-500 text-white px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl">
                    <Plus className="w-5 h-5 mr-3" /> Nuevo Platillo
                  </button>
                </div>
                <div className="space-y-8 pb-32">
                  {menuItems.filter(item => {
                    if (activeTab === 'cat-3') {
                      return item.categoryId !== 'cat-1' && item.categoryId !== 'cat-2';
                    }
                    return item.categoryId === activeTab;
                  }).map(item => (
                    <MenuItemCard key={item.id} item={item} onUpdate={it => setMenuItems(prev => prev.map(m => m.id === it.id ? it : m))} onDelete={() => { if (confirm('¿Eliminar?')) { setMenuItems(prev => prev.filter(m => m.id !== item.id)); addNotification('Eliminado'); } }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {renderOrderDetailModal()}
      {renderDriverModal()}


      {assigningOrderId && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setAssigningOrderId(null)}></div>
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h4 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Asignar Repartidor</h4>
              <button title="Cerrar" onClick={() => setAssigningOrderId(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-2">
              {drivers.filter(d => d.status === 'active').length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <Bike className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-black text-gray-900 dark:text-white uppercase">No hay repartidores disponibles</p>
                  <p className="text-xs text-gray-500 mt-1">Todos los repartidores están ocupados o fuera de servicio.</p>
                </div>
              ) : (
                drivers.filter(d => d.status === 'active').map(driver => {
                  const vCfg = VEHICLE_CONFIG[driver.vehicleType] || VEHICLE_CONFIG.moto;
                  return (
                    <button key={driver.id} onClick={() => assignDriverToOrder(assigningOrderId, driver.id)} className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-2xl transition-all border-2 border-transparent hover:border-primary-500 group">
                      <div className="flex items-center space-x-3 text-left">
                        <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-primary-500 shadow-sm"><vCfg.icon className="w-5 h-5" /></div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black dark:text-white uppercase leading-tight">{driver.name}</span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{vCfg.label}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-primary-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 z-[300] bg-black overflow-y-auto animate-in fade-in duration-500">
          <div className="sticky top-0 right-0 p-6 flex justify-end z-[310]">
            <button title="Cerrar vista previa" onClick={() => setShowPreview(false)} className="bg-white/10 backdrop-blur-md text-white p-4 rounded-full hover:bg-white/20 transition-all border border-white/20 shadow-2xl"><X className="w-8 h-8" /></button>
          </div>
          <PublicView categories={categories} menuItems={menuItems} isPreview />
        </div>
      )}
      {/* Logistics Password Gate Modal */}
      {pendingLogisticsSection && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setPendingLogisticsSection(null)}></div>
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="relative p-10 flex flex-col items-center text-center">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
              <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/30">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-1">Acceso Restringido</h4>
              <p className="text-sm text-gray-500 font-medium mb-2">
                {pendingLogisticsSection === 'kds' ? 'Monitor KDS' :
                  pendingLogisticsSection === 'dds' ? 'Repartos' :
                    pendingLogisticsSection === 'local_dispatch' ? 'Despacho Local' :
                      'Panel Repartidores'}
              </p>
              <p className="text-xs text-gray-400 mb-8">Ingresa la contraseña de logística para continuar</p>

              <input
                type="password"
                value={logisticsPasswordInput}
                onChange={(e) => { setLogisticsPasswordInput(e.target.value); setLogisticsPasswordError(false); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (logisticsPasswordInput === LOGISTICS_PASSWORD) {
                      setUnlockedSections(prev => new Set([...prev, pendingLogisticsSection!]));
                      setActiveSection(pendingLogisticsSection!);
                      setPendingLogisticsSection(null);
                      playUISound('success');
                    } else {
                      setLogisticsPasswordError(true);
                      playUISound('error');
                    }
                  }
                }}
                placeholder="Contraseña"
                className={`w-full bg-gray-50 dark:bg-gray-800 border-2 rounded-2xl px-6 py-5 font-black text-center text-lg uppercase tracking-[0.3em] mb-4 focus:border-blue-500 outline-none transition-all ${logisticsPasswordError ? 'border-red-400 animate-shake' : 'border-gray-100 dark:border-gray-700'}`}
                autoFocus
              />

              {logisticsPasswordError && (
                <p className="text-xs font-bold text-red-500 mb-4 flex items-center bg-red-50 dark:bg-red-950/30 px-4 py-2 rounded-xl">
                  <AlertCircle className="w-3.5 h-3.5 mr-2" /> Contraseña incorrecta
                </p>
              )}

              <div className="flex space-x-3 w-full">
                <button
                  onClick={() => setPendingLogisticsSection(null)}
                  className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (logisticsPasswordInput === LOGISTICS_PASSWORD) {
                      setUnlockedSections(prev => new Set([...prev, pendingLogisticsSection!]));
                      setActiveSection(pendingLogisticsSection!);
                      setPendingLogisticsSection(null);
                      playUISound('success');
                    } else {
                      setLogisticsPasswordError(true);
                      playUISound('error');
                    }
                  }}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95"
                >
                  Ingresar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
