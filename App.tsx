
import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, Category, TabId, Order, Customer, DeliveryDriver, Staff, SiteLog, AdminSection, EnabledModules, DEFAULT_ENABLED_MODULES } from './types';
import AdminView from './views/AdminView';
import PublicView from './views/PublicView';
import MonitorCocina from './views/MonitorCocina';
import LogisticaDespachos from './views/LogisticaDespachos';
import TPVView from './views/TPVView';
import LocalDispatchView from './views/LocalDispatchView.tsx';
import ControlPanelView from './views/ControlPanelView';
import RepartidorView from './views/RepartidorView';
import { ControlPanelAuthModal } from './components/ControlPanelAuthModal';
import { DigitalTicketModal } from './components/DigitalTicketModal';
import { databaseService, NormalizedRealtimeChange } from './services/databaseService';
import { notificationService } from './services/notificationService';
import { mergeSavedMenuItemOptions, saveMenuItemOptions } from './utils/menuOptions';
import { mergeOrderDeliveryAudit, mergeSingleOrderDeliveryAudit, saveOrderDeliveryAudit } from './utils/orderVerification';

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-3', name: 'Menú del Día' },
  { id: 'cat-5', name: 'Para Acompañar' },
  { id: 'cat-2', name: 'Bebidas' },
  { id: 'cat-1', name: 'Postres' },
  { id: 'cat-caldos', name: 'Caldos' },
  { id: 'cat-cerdo', name: 'Cerdo' },
  { id: 'cat-pollo', name: 'Pollo' },
  { id: 'cat-carnes', name: 'Carnes' },
  { id: 'cat-mariscos', name: 'Mariscos' },
  { id: 'cat-desayunos', name: 'Desayunos' },
];

const RAW_INITIAL_ITEMS: MenuItem[] = [
  // MENÚ DEL DÍA
  {
    id: 'm-tlayoyos-salsa',
    categoryId: 'cat-desayunos',
    name: 'Tlayoyo Tradicional',
    description: 'Tradicional tlayoyo de Teziutlán por pieza. Elige salsa(s) (Verde, Roja, Chipotle, aparte o sin salsa) y queso (con queso, aparte o sin queso). (Sin guarnición)',
    isActive: true,
    allowAccompaniments: true,
    allowSides: false,
    variations: [
      { id: 'm-tlayoyos-v1', label: 'Por pieza', price: 10 }
    ]
  },
  {
    id: 'item-1795824048202',
    categoryId: 'cat-desayunos',
    name: 'Tlayoyos Rellenos',
    description: 'Tlayoyos rellenos preparados al gusto (1 ingrediente $20 · 2 ingredientes $25): Pollo, Chicharrón, Longaniza, Champiñón, Queso de hebra, Bistec y Salchicha. Elige tu salsa y queso.',
    isActive: true,
    allowAccompaniments: true,
    allowSides: false,
    variations: [
      { id: 'v-relleno-pollo', label: 'Pollo', price: 20 },
      { id: 'v-relleno-chicharron', label: 'Chicharrón', price: 20 },
      { id: 'v-relleno-longaniza', label: 'Longaniza', price: 20 },
      { id: 'v-relleno-champinon', label: 'Champiñón', price: 20 },
      { id: 'v-relleno-queso-hebra', label: 'Queso de hebra', price: 20 },
      { id: 'v-relleno-bistec', label: 'Bistec', price: 20 },
      { id: 'v-relleno-salchicha', label: 'Salchicha', price: 20 }
    ]
  },
  {
    id: 'm1', categoryId: 'cat-1', name: 'Fresas con crema',
    description: 'Fresas frescas con crema especial de la casa.',
    isActive: true,
    variations: [
      { id: 'm1v1', label: 'Vaso chico', price: 40 },
      { id: 'm1v2', label: 'Vaso grande', price: 80 }
    ]
  },
  {
    id: 'm2', categoryId: 'cat-2', name: 'Jugo de naranja 🍊',
    description: 'Jugo 100% natural recién exprimido.',
    isActive: true,
    variations: [
      { id: 'm2v1', label: 'Medio litro', price: 30 },
      { id: 'm2v2', label: 'Litro', price: 60 }
    ]
  },
  {
    id: 'm3', categoryId: 'cat-caldos', name: 'Chilpozo de res',
    description: 'Caldo de res tradicional con verduras y un toque de picante.',
    isActive: true,
    variations: [{ id: 'm3v1', label: 'Platillo', price: 95 }]
  },
  {
    id: 'm4', categoryId: 'cat-caldos', name: 'Pancita',
    description: 'Tradicional pancita de res bien sazonada.',
    isActive: true,
    variations: [
      { id: 'm4v1', label: 'Medio', price: 80 },
      { id: 'm4v2', label: 'Litro', price: 100 }
    ]
  },
  {
    id: 'm5', categoryId: 'cat-cerdo', name: 'Chicharrón maciza en salsa verde',
    description: 'Chicharrón de cerdo en salsa verde casera.',
    isActive: true,
    variations: [{ id: 'm5v1', label: 'Platillo', price: 90 }]
  },
  {
    id: 'm6', categoryId: 'cat-pollo', name: 'Pipian rojo de pollo',
    description: 'Pollo en salsa de pipián rojo tradicional (Pierna o muslo).',
    isActive: true,
    variations: [{ id: 'm6v1', label: 'Platillo', price: 90 }]
  },
  {
    id: 'm7', categoryId: 'cat-cerdo', name: 'Costilla enchipotlada',
    description: 'Costillas de cerdo bañadas en salsa de chipotle.',
    isActive: true,
    variations: [{ id: 'm7v1', label: 'Platillo', price: 90 }]
  },
  {
    id: 'm8', categoryId: 'cat-pollo', name: 'Pechuga a la diabla',
    description: 'Pechuga de pollo rellena de queso panela en salsa diabla.',
    isActive: true,
    variations: [{ id: 'm8v1', label: 'Platillo', price: 90 }]
  },
  {
    id: 'm9', categoryId: 'cat-caldos', name: 'Pozole (pollo)',
    description: 'Pozole blanco de pollo con sus complementos tradicionales.',
    isActive: true,
    variations: [
      { id: 'm9v1', label: 'Medio', price: 70 },
      { id: 'm9v2', label: 'Litro', price: 90 }
    ]
  },
  {
    id: 'm-pozole-puerco', categoryId: 'cat-caldos', name: 'Pozole (puerco)',
    description: 'Pozole rojo de puerco con sus complementos tradicionales.',
    isActive: true,
    variations: [
      { id: 'm-pozole-puerco-v1', label: 'Medio', price: 70 },
      { id: 'm-pozole-puerco-v2', label: 'Litro', price: 90 }
    ]
  },
  {
    id: 'm10', categoryId: 'cat-pollo', name: 'Pechuga en chiltepin',
    description: 'Pechuga rellena de queso panela en salsa de chiltepin.',
    isActive: true,
    variations: [{ id: 'm10v1', label: 'Platillo', price: 90 }]
  },
  {
    id: 'm11', categoryId: 'cat-mariscos', name: 'Filete de pescado',
    description: 'Filete de pescado fresco preparado al gusto.',
    isActive: true,
    variations: [
      { id: 'm11v1', label: 'A la plancha', price: 110 },
      { id: 'm11v2', label: 'Empanizado', price: 120 }
    ]
  },
  {
    id: 'm12', categoryId: 'cat-mariscos', name: 'Camarones al gusto',
    description: 'Orden con 6 piezas. Preparados al gusto.',
    isActive: true,
    variations: [
      { id: 'm12v1', label: 'Empanizados', price: 150 },
      { id: 'm12v2', label: 'A la diabla', price: 150 },
      { id: 'm12v3', label: 'Al mojo de ajo', price: 150 },
      { id: 'm12v4', label: 'Enchipotlados', price: 150 }
    ]
  },
  {
    id: 'm13', categoryId: 'cat-cerdo', name: 'Longaniza frita con papas',
    description: 'Longaniza frita acompañada de papas cambray.',
    isActive: true,
    variations: [{ id: 'm13v1', label: 'Platillo', price: 90 }]
  },
  {
    id: 'm14', categoryId: 'cat-cerdo', name: 'Chuleta ahumada frita',
    description: 'Deliciosa chuleta ahumada frita.',
    isActive: true,
    variations: [
      { id: 'm14v1', label: 'Platillo', price: 90 },
      { id: 'm14v2', label: 'Orden en tacos (2pz)', price: 50 }
    ]
  },
  {
    id: 'm15', categoryId: 'cat-pollo', name: 'Pechugas rellenas de jamón y queso',
    description: 'Pechugas de pollo rellenas de jamón y queso amarillo.',
    isActive: true,
    variations: [
      { id: 'm15v1', label: 'Sencillo', price: 90 },
      { id: 'm15v2', label: 'Con papas a la francesa', price: 120 }
    ]
  },
  {
    id: 'm16', categoryId: 'cat-desayunos', name: 'Queso asado',
    description: 'Queso asado de alta calidad.',
    isActive: true,
    variations: [
      { id: 'm16v1', label: 'Platillo', price: 90 },
      { id: 'm16v2', label: 'Taco', price: 50 }
    ]
  },
  {
    id: 'm17', categoryId: 'cat-cerdo', name: 'Chuleta ahumada',
    description: 'Chuleta ahumada al natural.',
    isActive: true,
    variations: [{ id: 'm17v1', label: 'Platillo', price: 85 }]
  },
  {
    id: 'm18', categoryId: 'cat-desayunos', name: 'Omelette',
    description: 'Omelette de huevo al gusto (Jamón, Pollo o Salchicha).',
    isActive: true,
    variations: [{ id: 'm18v1', label: 'Platillo', price: 90 }]
  },
  {
    id: 'm19', categoryId: 'cat-carnes', name: 'Tampiqueñas',
    description: 'Servido con arroz, frijoles, 3 enchiladas rojas y papas francesas. (Sin tortillas)',
    isActive: true,
    variations: [
      { id: 'm19v1', label: 'Pollo', price: 130 },
      { id: 'm19v2', label: 'Puerco', price: 140 },
      { id: 'm19v3', label: 'Res', price: 160 }
    ]
  },
  {
    id: 'm20', categoryId: 'cat-desayunos', name: 'Dedos de queso',
    description: '4 piezas rellenas de queso panela.',
    isActive: true,
    variations: [{ id: 'm20v1', label: 'Orden', price: 100 }]
  },
  {
    id: 'm21', categoryId: 'cat-pollo', name: 'Mole con pollo',
    description: 'Tradicional mole poblano con pollo (Pierna o muslo).',
    isActive: true,
    variations: [{ id: 'm21v1', label: 'Platillo', price: 90 }]
  },
  {
    id: 'm22', categoryId: 'cat-pollo', name: 'Milanesa de pollo',
    description: 'Milanesa de pollo dorada.',
    isActive: true,
    variations: [
      { id: 'm22v1', label: 'Sencilla', price: 90 },
      { id: 'm22v2', label: 'Con papas a la francesa', price: 120 }
    ]
  },
  {
    id: 'm23', categoryId: 'cat-desayunos', name: 'Chilaquiles',
    description: 'Con pollo deshebrado, queso, crema, aguacate y cebolla. (Sin guarnición)',
    isActive: true,
    variations: [
      { id: 'm23v1', label: 'Chicos', price: 60 },
      { id: 'm23v2', label: 'Grandes', price: 90 },
      { id: 'm23v3', label: 'Con asada de pollo', price: 120 },
      { id: 'm23v4', label: 'Con asada de puerco', price: 130 }
    ]
  },
  {
    id: 'm24', categoryId: 'cat-desayunos', name: 'Enchiladas suizas',
    description: '5 piezas en salsa verde cremosa. (Sin guarnición)',
    isActive: true,
    variations: [{ id: 'm24v1', label: 'Orden', price: 90 }]
  },
  // PARA ACOMPAÑAR
  {
    id: 'a1', categoryId: 'cat-5', name: 'Ensalada de lechuga',
    description: 'Ensalada fresca de temporada.',
    isActive: true,
    variations: [{ id: 'a1v1', label: 'Orden', price: 0 }]
  },
  {
    id: 'a2', categoryId: 'cat-5', name: 'Frijoles',
    description: 'Frijoles refritos caseros.',
    isActive: true,
    variations: [{ id: 'a2v1', label: 'Orden', price: 0 }]
  },
  {
    id: 'a3', categoryId: 'cat-5', name: 'Sopa fria',
    description: 'Sopa de pasta fría con crema.',
    isActive: true,
    variations: [{ id: 'a3v1', label: 'Orden', price: 0 }]
  },
  {
    id: 'a4', categoryId: 'cat-5', name: 'Verduras al vapor',
    description: 'Mix de verduras frescas al vapor.',
    isActive: true,
    variations: [{ id: 'a4v1', label: 'Orden', price: 0 }]
  },
  {
    id: 'a5', categoryId: 'cat-5', name: 'Arroz rojo',
    description: 'Arroz rojo tradicional mexicano.',
    isActive: true,
    variations: [{ id: 'a5v1', label: 'Orden', price: 0 }]
  },
  // BEBIDAS
  {
    id: 'b1', categoryId: 'cat-2', name: 'Ponche de fruta',
    description: 'Tradicional ponche de frutas calientito.',
    isActive: true,
    variations: [
      { id: 'b1v1', label: 'Chico', price: 25 },
      { id: 'b1v2', label: 'Medio', price: 30 },
      { id: 'b1v3', label: 'Litro', price: 70 }
    ]
  },
  {
    id: 'b2', categoryId: 'cat-2', name: 'Coca Cola',
    description: 'Refresco bien frío.',
    isActive: true,
    variations: [
      { id: 'b2v1', label: '200 ml', price: 15 },
      { id: 'b2v2', label: '350 ml', price: 20 },
      { id: 'b2v3', label: '400 ml', price: 25 },
      { id: 'b2v4', label: '600 ml', price: 30 }
    ]
  }
];

const INITIAL_ITEMS: MenuItem[] = RAW_INITIAL_ITEMS.map(item => {
  const isCaldos = item.categoryId === 'cat-caldos' || item.name.toLowerCase().includes('pozole') || item.name.toLowerCase().includes('pancita') || item.name.toLowerCase().includes('chilpozo');
  const isWithoutSides = item.description?.toLowerCase().includes('sin guarnición');
  const isSideOrDrinkOrDessert = item.categoryId === 'cat-5' || item.categoryId === 'cat-2' || item.categoryId === 'cat-1';

  return {
    ...item,
    allowAccompaniments: item.allowAccompaniments !== undefined ? item.allowAccompaniments : (isCaldos || item.id === 'm23' || item.id === 'm24'),
    allowSides: item.allowSides !== undefined ? item.allowSides : (!isSideOrDrinkOrDessert && !isWithoutSides && !isCaldos)
  };
});

const INITIAL_ORDERS: Order[] = [
  { id: 'ORD-101', customerName: 'Juan Pérez', customerPhone: '555-0101', address: 'Mostrador: General', items: [{ id: 'i1', name: 'Platanos Fritos', variationLabel: 'Sencillo', price: 35, quantity: 2 }], total: 70, status: 'kitchen', paymentMethod: 'efectivo', paymentStatus: 'pending', createdAt: new Date(Date.now() - 1200000).toISOString(), source: 'tpv' },
  { id: 'ORD-102', customerName: 'María García', customerPhone: '555-0102', address: 'Av. Reforma 200', items: [{ id: 'i2', name: 'Fresas con Crema', variationLabel: 'Vaso Grande', price: 65, quantity: 1 }], total: 65, status: 'delivery', assignedDriverId: 'D-002', paymentMethod: 'tarjeta', paymentStatus: 'paid', paidAt: new Date(Date.now() - 3000000).toISOString(), operationNumber: 'TX-9922', ticketNumber: 'TK-001', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'ORD-103', customerName: 'Carlos López', customerPhone: '555-0103', address: 'Fracc. Los Pinos 5', items: [{ id: 'i3', name: 'Enchiladas Suizas', variationLabel: 'Orden', price: 120, quantity: 1 }], total: 120, status: 'delivered', paymentMethod: 'transferencia', paymentStatus: 'paid', paidAt: new Date(Date.now() - 6500000).toISOString(), operationNumber: 'BANK-7721', transferStatus: 'recibido', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'ORD-104', customerName: 'Ana Martínez', customerPhone: '555-0104', address: 'Mesa: 5', items: [{ id: 'i1', name: 'Platanos Fritos', variationLabel: 'Con Leche', price: 45, quantity: 1 }], total: 45, status: 'kitchen', paymentMethod: 'efectivo', paymentStatus: 'pending', createdAt: new Date(Date.now() - 300000).toISOString(), source: 'tpv' },
  { id: 'ORD-105', customerName: 'Pedro Sola', customerPhone: '555-0105', address: 'Calle Mayor 22', items: [{ id: 'i2', name: 'Fresas con Crema', variationLabel: 'Vaso Chico', price: 40, quantity: 3 }], total: 120, status: 'ready', paymentMethod: 'tarjeta', paymentStatus: 'pending', createdAt: new Date(Date.now() - 400000).toISOString() },
  { id: 'ORD-107', customerName: 'Héctor Ruiz', customerPhone: '555-0107', address: 'Privada Los Álamos #14', items: [{ id: 'i1', name: 'Platanos Fritos', variationLabel: 'Sencillo', price: 35, quantity: 4 }], total: 140, status: 'ready', paymentMethod: 'efectivo', paymentStatus: 'paid', paidAt: new Date(Date.now() - 50000).toISOString(), createdAt: new Date(Date.now() - 100000).toISOString() },
];

const INITIAL_DRIVERS: DeliveryDriver[] = [
  { id: 'D-001', name: 'Roberto Sánchez', phone: '555-0201', status: 'active', vehicleType: 'moto', deliveriesCompleted: 154, rating: 4.8, pin: '1111' },
  { id: 'D-002', name: 'Elena Torres', phone: '555-0202', status: 'busy', vehicleType: 'bici', deliveriesCompleted: 89, rating: 4.9, pin: '2222' },
  { id: 'D-003', name: 'Marco Ruíz', phone: '555-0203', status: 'offline', vehicleType: 'auto', deliveriesCompleted: 210, rating: 4.7, pin: '3333' },
  { id: 'D-004', name: 'Lucía Méndez', phone: '555-0204', status: 'active', vehicleType: 'walking', deliveriesCompleted: 45, rating: 4.9, pin: '4444' },
];
const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cust-1', name: 'Juan Pérez', phone: '555-0101', email: 'juan@example.com', totalOrders: 0, totalSpent: 0, addresses: ['Calle 10, Col. Centro', 'Av. Juárez 45'], password: '123456' },
  { id: 'cust-2', name: 'María García', phone: '555-0102', email: 'maria@example.com', totalOrders: 0, totalSpent: 0, addresses: ['Av. Reforma 200'] },
];

const INITIAL_STAFF: Staff[] = [
  { id: 'S-000', name: 'Miguel', phone: '555-0300', role: 'admin', status: 'active', password: '123' },
  { id: 'S-001', name: 'Chef Mario', phone: '555-0301', role: 'cook', status: 'active', password: '456' },
  { id: 'S-002', name: 'Ana Mesera', phone: '555-0302', role: 'waiter', status: 'active', password: '789' },
  { id: 'S-003', name: 'Carlos Mesero', phone: '555-0303', role: 'waiter', status: 'active', password: '321' },
];

const INITIAL_LOGS: SiteLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    user: 'Miguel (Admin)',
    action: 'Inicio de Sesion',
    details: 'El administrador Miguel ha iniciado sesión desde el puerto de control.',
    type: 'success'
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    user: 'Chef Mario',
    action: 'Actualización Menú',
    details: 'Se ha modificado el precio del producto "Chilpozo de res" de $90 a $95',
    type: 'info'
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    user: 'Sistema',
    action: 'Error de Ticket',
    details: 'Falla en la comunicación con la impresora térmica del área de barra.',
    type: 'error'
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    user: 'Ana Mesera',
    action: 'Venta Local',
    details: 'Se completó el cobro de la Mesa 4 por un total de $350.00 en efectivo.',
    type: 'success'
  }
];
type AppView = 'admin' | 'public' | 'kitchen' | 'logistics' | 'tpv' | 'local_dispatch' | 'control_panel' | 'driver_portal';
type PanelView = Exclude<AppView, 'public'>;

const PANEL_VIEW_STORAGE_KEY = 'tlayoyos_3_marias_active_panel_view';
const ADMIN_SECTION_STORAGE_KEY = 'tlayoyos_3_marias_admin_section';
const VALID_PANEL_VIEWS: readonly PanelView[] = [
  'control_panel',
  'admin',
  'kitchen',
  'logistics',
  'tpv',
  'local_dispatch',
  'driver_portal',
];
const VALID_ADMIN_SECTIONS: readonly AdminSection[] = [
  'dashboard',
  'kitchen',
  'kds',
  'dds',
  'menu',
  'orders',
  'customers',
  'reports',
  'driver_dashboard',
  'tpv',
  'local_dispatch',
  'staff_management',
  'logs',
  'payroll',
];

const isValidPanelView = (val: string | null): val is PanelView =>
  Boolean(val && (VALID_PANEL_VIEWS as readonly string[]).includes(val));

const isValidAdminSection = (val: string | null): val is AdminSection =>
  Boolean(val && (VALID_ADMIN_SECTIONS as readonly string[]).includes(val));

const isAdminRoutePath = (pathname: string) => {
  const normalized = pathname.replace(/\/+$/, '').toLowerCase();
  return normalized === '/administracion' || normalized === '/admin';
};

const getInitialPanelView = (): AppView => {
  if (typeof window === 'undefined') return 'public';
  if (!isAdminRoutePath(window.location.pathname)) return 'public';
  try {
    const params = new URLSearchParams(window.location.search);
    const moduloParam = params.get('modulo');
    if (isValidPanelView(moduloParam)) {
      return moduloParam;
    }
    const storedView = sessionStorage.getItem(PANEL_VIEW_STORAGE_KEY);
    if (isValidPanelView(storedView)) {
      return storedView;
    }
  } catch {
    // ignore storage/url errors
  }
  return 'control_panel';
};

const getInitialAdminSection = (): AdminSection => {
  if (typeof window === 'undefined') return 'dashboard';
  try {
    const params = new URLSearchParams(window.location.search);
    const sectionParam = params.get('section');
    if (isValidAdminSection(sectionParam)) return sectionParam;
    const storedSection = sessionStorage.getItem(ADMIN_SECTION_STORAGE_KEY);
    if (isValidAdminSection(storedSection)) return storedSection;
  } catch {
    // ignore
  }
  return 'dashboard';
};

export default function App() {
  const [view, setView] = useState<AppView>(getInitialPanelView);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => mergeSavedMenuItemOptions(INITIAL_ITEMS));
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>(INITIAL_DRIVERS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [staff, setStaff] = useState<Staff[]>(INITIAL_STAFF);
  const [logs, setLogs] = useState<SiteLog[]>(INITIAL_LOGS);

  const categoriesRef = React.useRef<Category[]>(categories);
  const menuItemsRef = React.useRef<MenuItem[]>(menuItems);
  const ordersRef = React.useRef<Order[]>(orders);
  const driversRef = React.useRef<DeliveryDriver[]>(drivers);
  const customersRef = React.useRef<Customer[]>(customers);
  const staffRef = React.useRef<Staff[]>(staff);
  const logsRef = React.useRef<SiteLog[]>(logs);

  useEffect(() => { categoriesRef.current = categories; }, [categories]);
  useEffect(() => { menuItemsRef.current = menuItems; }, [menuItems]);
  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => { driversRef.current = drivers; }, [drivers]);
  useEffect(() => { customersRef.current = customers; }, [customers]);
  useEffect(() => { staffRef.current = staff; }, [staff]);
  useEffect(() => { logsRef.current = logs; }, [logs]);
  const [tpvEditOrder, setTpvEditOrder] = useState<Order | null>(null);
  const [tpvInitialTable, setTpvInitialTable] = useState<string | null>(null);
  const [tpvReturnView, setTpvReturnView] = useState<'control_panel' | 'local_dispatch'>('control_panel');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [systemBgColor, setSystemBgColor] = useState('#0f172a');
  const [systemBgEffect, setSystemBgEffect] = useState<'none' | 'gradient' | 'animated-blobs' | 'stars'>('gradient');
  const [adminInitialSection, setAdminInitialSection] = useState<AdminSection>(getInitialAdminSection);
  const [panelMode, setPanelMode] = useState<'basic' | 'advanced'>('basic');
  const [pendingRedirectSection, setPendingRedirectSection] = useState<AdminSection | null>(null);
  const viewRef = React.useRef<AppView>(view);
  useEffect(() => { viewRef.current = view; }, [view]);

  const [enabledModules, setEnabledModules] = useState<EnabledModules>(() => {
    try {
      const saved = localStorage.getItem('tlayoyos3marias_enabled_modules');
      if (saved) {
        return { ...DEFAULT_ENABLED_MODULES, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error loading enabled modules from localStorage', e);
    }
    return DEFAULT_ENABLED_MODULES;
  });

  const handleSetEnabledModules: React.Dispatch<React.SetStateAction<EnabledModules>> = (valOrUpdater) => {
    setEnabledModules(prev => {
      const next = typeof valOrUpdater === 'function' ? valOrUpdater(prev) : valOrUpdater;
      try {
        localStorage.setItem('tlayoyos3marias_enabled_modules', JSON.stringify(next));
      } catch (e) {
        console.error('Error saving enabled modules to localStorage', e);
      }
      return next;
    });
  };

  const [isPanelAuthenticated, setIsPanelAuthenticated] = useState<boolean>(() => {
    try {
      return (
        sessionStorage.getItem('tlayoyos_3_marias_cp_auth') === 'true' ||
        localStorage.getItem('tlayoyos_3_marias_cp_auth') === 'true'
      );
    } catch {
      return false;
    }
  });
  const isPanelAuthenticatedRef = React.useRef<boolean>(isPanelAuthenticated);
  useEffect(() => { isPanelAuthenticatedRef.current = isPanelAuthenticated; }, [isPanelAuthenticated]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const navigateToView = React.useCallback((nextView: AppView, section?: AdminSection) => {
    viewRef.current = nextView;
    setView(nextView);

    if (section) {
      setAdminInitialSection(section);
      try {
        sessionStorage.setItem(ADMIN_SECTION_STORAGE_KEY, section);
      } catch {
        // ignore
      }
    }

    try {
      if (nextView === 'public') {
        sessionStorage.removeItem(PANEL_VIEW_STORAGE_KEY);
        if (isAdminRoutePath(window.location.pathname) || window.location.search.includes('modulo=')) {
          window.history.replaceState({}, '', '/');
        }
      } else {
        sessionStorage.setItem(PANEL_VIEW_STORAGE_KEY, nextView);
        const url = new URL(window.location.href);
        url.pathname = '/administracion';
        if (nextView === 'control_panel') {
          url.searchParams.delete('modulo');
          url.searchParams.delete('section');
        } else {
          url.searchParams.set('modulo', nextView);
          if (nextView === 'admin' && section) {
            url.searchParams.set('section', section);
          } else if (nextView !== 'admin') {
            url.searchParams.delete('section');
          }
        }
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }
    } catch {
      // ignore history/storage errors
    }
  }, []);

  const handleEnterControlPanel = () => {
    if (isPanelAuthenticatedRef.current) {
      try {
        if (!isAdminRoutePath(window.location.pathname)) {
          window.history.pushState({}, '', '/administracion');
        }
      } catch {
        // ignore
      }
      navigateToView('control_panel');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleOpenAdminOrders = React.useCallback((orderId?: string | null) => {
    const hasAdminSession = isPanelAuthenticatedRef.current || notificationService.isAdmin();

    if (hasAdminSession) {
      isPanelAuthenticatedRef.current = true;
      setIsPanelAuthenticated(true);
      notificationService.setAdminAuthenticated(true);
      navigateToView('admin', 'orders');

      // Dispatch to AdminView (in case it is already mounted)
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigate_to_admin_section', {
          detail: { section: 'orders', orderId: orderId || null }
        }));
      }, 50);

      // Clean up temporary deep-link URL parameters cleanly without page refresh
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('action') || url.searchParams.has('orderId') || url.searchParams.has('view')) {
          url.searchParams.delete('action');
          url.searchParams.delete('orderId');
          url.searchParams.delete('view');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
        }
      } catch {
        // ignore
      }
    } else {
      // User is not authenticated. Save pending destination and ask for admin password
      setPendingRedirectSection('orders');
      setIsAuthModalOpen(true);
    }
  }, [navigateToView]);

  const handleAuthSuccess = () => {
    isPanelAuthenticatedRef.current = true;
    setIsPanelAuthenticated(true);
    notificationService.setAdminAuthenticated(true);

    // Auto-prompt admin to enable push notifications if default and supported
    if (notificationService.isSupported() && notificationService.getPermission() === 'default') {
      notificationService.requestPermission();
    }

    setIsAuthModalOpen(false);

    if (pendingRedirectSection) {
      const targetSec = pendingRedirectSection;
      setPendingRedirectSection(null);
      navigateToView('admin', targetSec);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigate_to_admin_section', {
          detail: { section: targetSec, orderId: null }
        }));
      }, 50);
    } else if (viewRef.current !== 'public' && viewRef.current !== 'control_panel') {
      // Preserve intended module when authenticating directly on e.g. /administracion?modulo=kitchen
      navigateToView(viewRef.current);
    } else {
      try {
        if (!isAdminRoutePath(window.location.pathname)) {
          window.history.pushState({}, '', '/administracion');
        }
      } catch {
        // ignore
      }
      navigateToView('control_panel');
    }
  };

  const [digitalTicketOrderId, setDigitalTicketOrderId] = useState<string | null>(null);
  const digitalTicketOrderIdRef = useRef<string | null>(null);
  const [isDigitalTicketOpen, setIsDigitalTicketOpen] = useState(false);

  useEffect(() => {
    digitalTicketOrderIdRef.current = digitalTicketOrderId;
  }, [digitalTicketOrderId]);

  useEffect(() => {
    const handleUrlTicket = () => {
      try {
        const search = window.location.search;
        const params = new URLSearchParams(search);
        const ticketId = params.get('ticket') || params.get('pedido') || params.get('orden');
        if (ticketId) {
          setDigitalTicketOrderId(ticketId);
          setIsDigitalTicketOpen(true);
          return;
        }

        const hash = window.location.hash;
        if (hash && (hash.startsWith('#ticket-') || hash.startsWith('#ticket='))) {
          const id = hash.replace(/^#ticket[-=]/, '');
          if (id) {
            setDigitalTicketOrderId(id);
            setIsDigitalTicketOpen(true);
          }
        }
      } catch (e) {
        console.warn('Error reading URL ticket param:', e);
      }
    };

    handleUrlTicket();
    window.addEventListener('popstate', handleUrlTicket);
    return () => window.removeEventListener('popstate', handleUrlTicket);
  }, []);

  const handleCloseDigitalTicket = () => {
    setIsDigitalTicketOpen(false);
    setDigitalTicketOrderId(null);
    try {
      if (window.location.search.includes('ticket') || window.location.hash.includes('ticket')) {
        const url = new URL(window.location.href);
        url.searchParams.delete('ticket');
        url.searchParams.delete('pedido');
        url.searchParams.delete('orden');
        url.hash = '';
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }
    } catch {
      // ignore
    }
  };

  const handleOpenDigitalTicket = (order: Order) => {
    setDigitalTicketOrderId(order.id);
    setIsDigitalTicketOpen(true);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handle notification clicks, URL deep links, and service worker messages to open orders
  useEffect(() => {
    const handleUrlNavigation = (event?: PopStateEvent) => {
      try {
        const isPop = Boolean(event);
        const search = window.location.search;
        const params = new URLSearchParams(search);
        const viewParam = params.get('view');
        const sectionParam = params.get('section');
        const actionParam = params.get('action');

        if ((viewParam === 'admin' && sectionParam === 'orders') || actionParam === 'open_orders' || (!isAdminRoutePath(window.location.pathname) && sectionParam === 'orders')) {
          handleOpenAdminOrders(params.get('orderId'));
          return;
        }

        if (isAdminRoutePath(window.location.pathname)) {
          // Never hijack active sub-views (KDS, Barra, TPV, Admin, Logística) back to control_panel on popstate/trap events
          if (isPop && viewRef.current !== 'public') {
            return;
          }
          if (!isPop && viewRef.current === 'public') {
            navigateToView(getInitialPanelView());
          }
          return;
        }

        if (window.location.pathname === '/' || window.location.pathname === '') {
          if (viewRef.current === 'control_panel') {
            navigateToView('public');
          }
        }
      } catch (e) {
        console.warn('Error reading URL navigation params:', e);
      }
    };

    handleUrlNavigation();
    window.addEventListener('popstate', handleUrlNavigation);

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE_TO_ADMIN_ORDERS') {
        handleOpenAdminOrders(event.data.orderId);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('tlayoyos_3_marias_sw_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'NAVIGATE_TO_ADMIN_ORDERS') {
          handleOpenAdminOrders(event.data.orderId);
        }
      };
    } catch {
      // BroadcastChannel unsupported in current environment
    }

    return () => {
      window.removeEventListener('popstate', handleUrlNavigation);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
      if (channel) {
        channel.close();
      }
    };
  }, [handleOpenAdminOrders, navigateToView]);

  // Load and sync from Supabase PostgreSQL Database with quota-safe Broadcast + Realtime
  useEffect(() => {
    let isMounted = true;

    databaseService.loadAll(
      INITIAL_CATEGORIES,
      INITIAL_ITEMS,
      INITIAL_DRIVERS,
      INITIAL_CUSTOMERS,
      INITIAL_STAFF
    ).then((result) => {
      if (!isMounted || !result) return;
      if (result.categories?.length) {
        categoriesRef.current = result.categories;
        setCategories(result.categories);
      }
      if (result.menuItems?.length) {
        const mergedItems = mergeSavedMenuItemOptions(result.menuItems);
        menuItemsRef.current = mergedItems;
        setMenuItems(mergedItems);
      }
      if (result.orders) {
        const mergedOrders = mergeOrderDeliveryAudit(result.orders);
        ordersRef.current = mergedOrders;
        setOrders(mergedOrders);
      }
      if (result.customers?.length) {
        customersRef.current = result.customers;
        setCustomers(result.customers);
      }
      if (result.drivers?.length) {
        driversRef.current = result.drivers;
        setDrivers(result.drivers);
      }
      if (result.staff?.length) {
        staffRef.current = result.staff;
        setStaff(result.staff);
      }
    });

    const applyRemoteOrderUpsert = (rawOrder: Order) => {
      const incoming = mergeSingleOrderDeliveryAudit(rawOrder);
      if (incoming.deliveredBy && incoming.deliveredAt) {
        saveOrderDeliveryAudit(incoming.id, {
          deliveredBy: incoming.deliveredBy,
          deliveredById: incoming.deliveredById || incoming.waiterId || '',
          deliveredAt: incoming.deliveredAt
        });
      }

      const prev = ordersRef.current;
      const existing = prev.find(o => o.id === incoming.id);
      if (!existing) {
        const next = [incoming, ...prev];
        ordersRef.current = next;
        setOrders(next);
        if (notificationService.isAdmin() && (incoming.status === 'pending' || incoming.status === 'kitchen')) {
          notificationService.notifyNewOrder(incoming);
        }
      } else if (JSON.stringify(existing) !== JSON.stringify(incoming)) {
        const next = prev.map(o => (o.id === incoming.id ? incoming : o));
        ordersRef.current = next;
        setOrders(next);
      }
    };

    // Filter Realtime order updates by relevant order IDs for the active view to minimize Supabase quota and network traffic
    const getRelevantOrderIdsForView = (
      currentView: AppView,
      allOrders: Order[],
      activeTicketId?: string | null
    ): Set<string> | null => {
      // In admin and control panel, all orders are needed for full oversight
      if (currentView === 'admin' || currentView === 'control_panel') {
        return null;
      }

      // KDS: only active orders sent to kitchen
      if (currentView === 'kitchen') {
        return new Set(
          allOrders
            .filter(o => o.status === 'pending' || o.status === 'kitchen' || o.status === 'ready')
            .map(o => o.id)
        );
      }

      // Logistics / Delivery: only active delivery & ready orders
      if (currentView === 'logistics' || currentView === 'driver_portal') {
        return new Set(
          allOrders
            .filter(o => o.status === 'kitchen' || o.status === 'ready' || o.status === 'delivery')
            .map(o => o.id)
        );
      }

      // Local Dispatch & TPV: table and counter service active orders
      if (currentView === 'local_dispatch' || currentView === 'tpv') {
        return new Set(
          allOrders
            .filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
            .map(o => o.id)
        );
      }

      // Public menu view: only client's own digital ticket or recent online session orders
      if (currentView === 'public') {
        const relevant = new Set<string>();
        if (activeTicketId) relevant.add(activeTicketId);
        allOrders
          .filter(o => o.source === 'online' && o.status !== 'delivered' && o.status !== 'cancelled')
          .slice(0, 5)
          .forEach(o => relevant.add(o.id));
        return relevant;
      }

      return null;
    };

    const isOrderRelevantForView = (
      orderId: string,
      order: Order | undefined,
      eventType: 'INSERT' | 'UPDATE' | 'DELETE' = 'UPDATE',
      currentView: AppView,
      allOrders: Order[],
      activeTicketId?: string | null
    ): boolean => {
      const relevantIds = getRelevantOrderIdsForView(currentView, allOrders, activeTicketId);
      if (relevantIds === null) return true;

      if (orderId && relevantIds.has(orderId)) return true;

      if (eventType === 'INSERT') {
        if (!order) return true;
        if (currentView === 'kitchen') {
          return order.status === 'pending' || order.status === 'kitchen';
        }
        if (currentView === 'logistics' || currentView === 'driver_portal') {
          return Boolean(order.address?.toLowerCase().includes('domicilio')) || order.status === 'ready' || order.status === 'delivery';
        }
        if (currentView === 'local_dispatch' || currentView === 'tpv') {
          return Boolean(order.address?.toLowerCase().includes('mesa') || order.address?.toLowerCase().includes('mostrador'));
        }
        if (currentView === 'public') {
          return Boolean(activeTicketId && order.id === activeTicketId);
        }
        return true;
      }

      if (eventType === 'DELETE') {
        return Boolean(orderId && relevantIds.has(orderId));
      }

      if (order) {
        if (currentView === 'kitchen' && (order.status === 'kitchen' || order.status === 'pending' || order.status === 'ready')) {
          return true;
        }
        if (currentView === 'logistics' && (order.status === 'ready' || order.status === 'delivery')) {
          return true;
        }
        if ((currentView === 'local_dispatch' || currentView === 'tpv') && order.status !== 'delivered' && order.status !== 'cancelled') {
          return true;
        }
      }

      return false;
    };

    const unsubscribe = databaseService.subscribeToChanges({
      getRelevantOrderIds: () => {
        return getRelevantOrderIdsForView(viewRef.current, ordersRef.current, digitalTicketOrderIdRef.current);
      },
      isOrderRelevant: (orderId: string, order?: Order, eventType?: 'INSERT' | 'UPDATE' | 'DELETE') => {
        return isOrderRelevantForView(
          orderId,
          order,
          eventType,
          viewRef.current,
          ordersRef.current,
          digitalTicketOrderIdRef.current
        );
      },
      onOrderChange: (change: NormalizedRealtimeChange<Order>) => {
        if (!isMounted) return;
        const currentView = viewRef.current;
        const targetId = change.id || change.record?.id;
        const isRelevant = isOrderRelevantForView(
          targetId || '',
          change.record,
          change.eventType,
          currentView,
          ordersRef.current,
          digitalTicketOrderIdRef.current
        );
        if (!isRelevant) return;

        if (change.eventType === 'DELETE') {
          if (!change.id) return;
          const next = ordersRef.current.filter(o => o.id !== change.id);
          if (next.length !== ordersRef.current.length) {
            ordersRef.current = next;
            setOrders(next);
          }
          return;
        }
        if (change.record) {
          applyRemoteOrderUpsert(change.record);
        }
      },
      onOrderSyncBatch: (recentOrders: Order[]) => {
        if (!isMounted || !recentOrders) return;
        const mergedRecent = mergeOrderDeliveryAudit(recentOrders);
        const recentMap = new Map<string, Order>(mergedRecent.map(o => [o.id, o]));
        const prev = ordersRef.current;
        const prevMap = new Map<string, Order>(prev.map(o => [o.id, o]));

        let hasChanges = false;
        const newlyAdded: Order[] = [];

        for (const rec of mergedRecent) {
          const existing = prevMap.get(rec.id);
          if (!existing) {
            hasChanges = true;
            newlyAdded.push(rec);
          } else if (JSON.stringify(existing) !== JSON.stringify(rec)) {
            hasChanges = true;
          }
        }

        // Preserve historical orders older than the catch-up window
        const oldestRecentTs = mergedRecent.length >= 80
          ? Math.min(...mergedRecent.map(o => new Date(o.createdAt).getTime() || Date.now()))
          : -Infinity;

        const preservedOlder = prev.filter(o => {
          if (recentMap.has(o.id)) return false;
          const ts = new Date(o.createdAt).getTime() || 0;
          if (ts < oldestRecentTs) return true;
          hasChanges = true; // pruned order deleted within recent window
          return false;
        });

        if (!hasChanges) return;

        const next = [...mergedRecent, ...preservedOlder];
        ordersRef.current = next;
        setOrders(next);

        if (notificationService.isAdmin() && newlyAdded.length > 0) {
          newlyAdded.forEach(order => {
            if (order.status === 'pending' || order.status === 'kitchen') {
              notificationService.notifyNewOrder(order);
            }
          });
        }
      },
      onMenuItemChange: (change: NormalizedRealtimeChange<MenuItem>) => {
        if (!isMounted) return;
        if (change.eventType === 'DELETE') {
          if (!change.id) return;
          const next = menuItemsRef.current.filter(i => i.id !== change.id);
          menuItemsRef.current = next;
          setMenuItems(next);
          return;
        }
        if (change.record) {
          const incoming = mergeSavedMenuItemOptions([change.record])[0];
          const prev = menuItemsRef.current;
          const exists = prev.some(i => i.id === incoming.id);
          const next = exists ? prev.map(i => (i.id === incoming.id ? incoming : i)) : [...prev, incoming];
          menuItemsRef.current = next;
          setMenuItems(next);
          saveMenuItemOptions(next);
        }
      },
      onCategoryChange: (change: NormalizedRealtimeChange<Category>) => {
        if (!isMounted) return;
        if (change.eventType === 'DELETE') {
          if (!change.id) return;
          const next = categoriesRef.current.filter(c => c.id !== change.id);
          categoriesRef.current = next;
          setCategories(next);
          return;
        }
        if (change.record) {
          const incoming = change.record;
          const prev = categoriesRef.current;
          const exists = prev.some(c => c.id === incoming.id);
          const next = exists ? prev.map(c => (c.id === incoming.id ? incoming : c)) : [...prev, incoming];
          categoriesRef.current = next;
          setCategories(next);
        }
      },
      onCustomerChange: (change: NormalizedRealtimeChange<Customer>) => {
        if (!isMounted) return;
        if (change.eventType === 'DELETE') {
          if (!change.id) return;
          const next = customersRef.current.filter(c => c.id !== change.id);
          customersRef.current = next;
          setCustomers(next);
          return;
        }
        if (change.record) {
          const incoming = change.record;
          const prev = customersRef.current;
          const exists = prev.some(c => c.id === incoming.id);
          const next = exists ? prev.map(c => (c.id === incoming.id ? incoming : c)) : [...prev, incoming];
          customersRef.current = next;
          setCustomers(next);
        }
      },
      onDriverChange: (change: NormalizedRealtimeChange<DeliveryDriver>) => {
        if (!isMounted || !change.record) return;
        const incoming = change.record;
        const prev = driversRef.current;
        const exists = prev.some(d => d.id === incoming.id);
        const next = exists ? prev.map(d => (d.id === incoming.id ? incoming : d)) : [...prev, incoming];
        driversRef.current = next;
        setDrivers(next);
      },
      onStaffChange: (change: NormalizedRealtimeChange<Staff>) => {
        if (!isMounted || !change.record) return;
        const incoming = change.record;
        const prev = staffRef.current;
        const exists = prev.some(s => s.id === incoming.id);
        const next = exists ? prev.map(s => (s.id === incoming.id ? incoming : s)) : [...prev, incoming];
        staffRef.current = next;
        setStaff(next);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Sync state mutation handlers with Supabase outside React state updaters (StrictMode safe)
  const handleSetOrders: React.Dispatch<React.SetStateAction<Order[]>> = React.useCallback((action) => {
    const prev = ordersRef.current;
    const next = typeof action === 'function' ? action(prev) : action;
    ordersRef.current = next;
    setOrders(next);

    const changed = next.filter(nextOrder => {
      const oldOrder = prev.find(p => p.id === nextOrder.id);
      return !oldOrder || JSON.stringify(oldOrder) !== JSON.stringify(nextOrder);
    });
    changed.forEach(order => databaseService.upsertOrder(order));

    const deleted = prev.filter(p => !next.some(n => n.id === p.id));
    deleted.forEach(order => databaseService.deleteOrder(order.id));
  }, []);

  const handleSetMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>> = React.useCallback((action) => {
    const prev = menuItemsRef.current;
    const next = typeof action === 'function' ? action(prev) : action;
    menuItemsRef.current = next;
    setMenuItems(next);
    saveMenuItemOptions(next);

    const changed = next.filter(nextItem => {
      const oldItem = prev.find(p => p.id === nextItem.id);
      return !oldItem || JSON.stringify(oldItem) !== JSON.stringify(nextItem);
    });
    changed.forEach(item => databaseService.upsertMenuItem(item));

    const deleted = prev.filter(p => !next.some(n => n.id === p.id));
    deleted.forEach(item => databaseService.deleteMenuItem(item.id));
  }, []);

  const handleSetCategories: React.Dispatch<React.SetStateAction<Category[]>> = React.useCallback((action) => {
    const prev = categoriesRef.current;
    const next = typeof action === 'function' ? action(prev) : action;
    categoriesRef.current = next;
    setCategories(next);

    const changed = next.filter(nextCat => {
      const oldCat = prev.find(p => p.id === nextCat.id);
      return !oldCat || JSON.stringify(oldCat) !== JSON.stringify(nextCat);
    });
    changed.forEach(cat => databaseService.upsertCategory(cat));

    const deleted = prev.filter(p => !next.some(n => n.id === p.id));
    deleted.forEach(cat => databaseService.deleteCategory(cat.id));
  }, []);

  const handleSetCustomers: React.Dispatch<React.SetStateAction<Customer[]>> = React.useCallback((action) => {
    const prev = customersRef.current;
    const next = typeof action === 'function' ? action(prev) : action;
    customersRef.current = next;
    setCustomers(next);

    const changed = next.filter(nextCust => {
      const oldCust = prev.find(p => p.id === nextCust.id);
      return !oldCust || JSON.stringify(oldCust) !== JSON.stringify(nextCust);
    });
    changed.forEach(cust => databaseService.upsertCustomer(cust));

    const deleted = prev.filter(p => !next.some(n => n.id === p.id));
    deleted.forEach(cust => databaseService.deleteCustomer(cust.id));
  }, []);

  const handleSetDrivers: React.Dispatch<React.SetStateAction<DeliveryDriver[]>> = React.useCallback((action) => {
    const prev = driversRef.current;
    const next = typeof action === 'function' ? action(prev) : action;
    driversRef.current = next;
    setDrivers(next);

    const changed = next.filter(nextD => {
      const oldD = prev.find(p => p.id === nextD.id);
      return !oldD || JSON.stringify(oldD) !== JSON.stringify(nextD);
    });
    changed.forEach(driver => databaseService.upsertDriver(driver));
  }, []);

  const handleSetStaff: React.Dispatch<React.SetStateAction<Staff[]>> = React.useCallback((action) => {
    const prev = staffRef.current;
    const next = typeof action === 'function' ? action(prev) : action;
    staffRef.current = next;
    setStaff(next);

    const changed = next.filter(nextS => {
      const oldS = prev.find(p => p.id === nextS.id);
      return !oldS || JSON.stringify(oldS) !== JSON.stringify(nextS);
    });
    changed.forEach(s => databaseService.upsertStaff(s));
  }, []);

  const handleSetLogs: React.Dispatch<React.SetStateAction<SiteLog[]>> = React.useCallback((action) => {
    const prev = logsRef.current;
    const next = typeof action === 'function' ? action(prev) : action;
    logsRef.current = next;
    setLogs(next);

    const prevIds = new Set(prev.map(p => p.id));
    const newLogs = next.filter(n => !prevIds.has(n.id));
    newLogs.forEach(l => databaseService.insertLog(l));
  }, []);

  const updateCustomerStats = React.useCallback((customerName: string, customerPhone: string, amount: number, isAdding: boolean = true) => {
    if (!customerPhone || customerPhone === 'N/A' || customerPhone === '0000000000') return;

    handleSetCustomers(prev => {
      const customerIndex = prev.findIndex(c => {
        const cPhone = (c.phone || '').replace(/\D/g, '').slice(-10);
        const oPhone = (customerPhone || '').replace(/\D/g, '').slice(-10);
        return cPhone && oPhone && cPhone === oPhone;
      });
      
      if (customerIndex === -1) {
        if (!isAdding) return prev;
        const newCustomer: Customer = {
          id: `cust-${Date.now()}`,
          name: customerName || 'Cliente Nuevo',
          phone: customerPhone,
          totalOrders: 1,
          totalSpent: amount,
          lastOrderDate: new Date().toISOString(),
          addresses: []
        };
        return [...prev, newCustomer];
      }

      const newCustomers = [...prev];
      const customer = newCustomers[customerIndex];
      
      newCustomers[customerIndex] = {
        ...customer,
        totalOrders: Math.max(0, (customer.totalOrders || 0) + (isAdding ? 1 : -1)),
        totalSpent: Math.max(0, (customer.totalSpent || 0) + (isAdding ? amount : -amount)),
        lastOrderDate: isAdding ? new Date().toISOString() : customer.lastOrderDate
      };
      
      return newCustomers;
    });
  }, []);

  const updateDriverStats = React.useCallback((driverId: string, rating: number, isAdding: boolean = true) => {
    handleSetDrivers(prev => prev.map(d => {
      if (d.id === driverId) {
        const newCount = Math.max(0, d.deliveriesCompleted + (isAdding ? 1 : -1));
        return {
          ...d,
          deliveriesCompleted: newCount,
          rating: rating || d.rating
        };
      }
      return d;
    }));
  }, []);

  useEffect(() => {
    if (
      (view === 'driver_portal' && !enabledModules.driver_portal) ||
      (view === 'kitchen' && !enabledModules.kitchen) ||
      (view === 'logistics' && !enabledModules.logistics) ||
      (view === 'tpv' && !enabledModules.tpv)
    ) {
      navigateToView('control_panel');
    }
  }, [view, enabledModules, navigateToView]);

  const renderCurrentView = () => {
    if (view !== 'public' && !isPanelAuthenticated) {
      return (
        <>
          <PublicView
            categories={categories}
            menuItems={menuItems}
            customers={customers}
            orders={orders}
            onAddCustomer={(customer) => handleSetCustomers(prev => [...prev, customer])}
            onUpdateCustomer={(updated) => handleSetCustomers(prev => prev.map(c => c.id === updated.id ? updated : c))}
            onAddOrder={(order) => {
              handleSetOrders(prev => [order, ...prev]);
              updateCustomerStats(order.customerName, order.customerPhone, order.total, true);
              if (notificationService.isAdmin()) {
                notificationService.notifyNewOrder(order);
              }
            }}
            onEnterControlPanel={handleEnterControlPanel}
            onViewDigitalTicket={handleOpenDigitalTicket}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          />
          <ControlPanelAuthModal
            isOpen={true}
            onClose={() => {
              navigateToView('public');
            }}
            onSuccess={handleAuthSuccess}
          />
        </>
      );
    }

    if (view === 'control_panel') {
      return (
        <ControlPanelView
          onNavigate={(newView, section) => {
            navigateToView(newView as AppView, section || 'dashboard');
          }}
          onExit={() => {
            isPanelAuthenticatedRef.current = false;
            setIsPanelAuthenticated(false);
            notificationService.setAdminAuthenticated(false);
            navigateToView('public');
          }}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onGoToPublicSite={() => {
            navigateToView('public');
          }}
          activeOrdersCount={orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}
          menuItemsCount={menuItems.length}
          activeDriversCount={drivers.filter(d => d.status !== 'offline').length}
          systemBgColor={systemBgColor}
          setSystemBgColor={setSystemBgColor}
          systemBgEffect={systemBgEffect}
          setSystemBgEffect={setSystemBgEffect}
          panelMode={panelMode}
          setPanelMode={setPanelMode}
          enabledModules={enabledModules}
          setEnabledModules={handleSetEnabledModules}
        />
      );
    }

    if (view === 'driver_portal') {
      if (!enabledModules.driver_portal) return null;
      return (
        <RepartidorView
          drivers={drivers}
          setDrivers={handleSetDrivers}
          orders={orders}
          setOrders={handleSetOrders}
          updateCustomerStats={updateCustomerStats}
          updateDriverStats={updateDriverStats}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onExit={() => navigateToView('control_panel')}
        />
      );
    }

    if (view === 'kitchen') {
      if (!enabledModules.kitchen) return null;
      return (
        <MonitorCocina
          orders={orders}
          setOrders={handleSetOrders}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onExit={() => navigateToView('control_panel')}
        />
      );
    }
    if (view === 'logistics') {
      if (!enabledModules.logistics) return null;
      return (
        <LogisticaDespachos
          orders={orders}
          setOrders={handleSetOrders}
          drivers={drivers}
          setDrivers={handleSetDrivers}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onExit={() => navigateToView('control_panel')}
        />
      );
    }

    if (view === 'admin') {
      return (
        <AdminView
          initialSection={adminInitialSection}
          categories={categories}
          setCategories={handleSetCategories}
          menuItems={menuItems}
          setMenuItems={handleSetMenuItems}
          orders={orders}
          setOrders={handleSetOrders}
          drivers={drivers}
          setDrivers={handleSetDrivers}
          staff={staff}
          setStaff={handleSetStaff}
          logs={logs}
          setLogs={handleSetLogs}
          customers={customers}
          setCustomers={handleSetCustomers}
          updateCustomerStats={updateCustomerStats}
          updateDriverStats={updateDriverStats}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onExit={() => {
            setPanelMode('basic');
            navigateToView('control_panel');
          }}
          onViewDigitalTicket={handleOpenDigitalTicket}
          onGoToPublicSite={() => {
            navigateToView('public');
          }}
          enabledModules={enabledModules}
        />
      );
    }

    if (view === 'tpv') {
      if (!enabledModules.tpv) return null;
      return (
        <TPVView
          categories={categories}
          menuItems={menuItems}
          staff={staff}
          customers={customers}
          orders={orders}
          onAddCustomer={(customer) => handleSetCustomers(prev => [...prev, customer])}
          updateCustomerStats={updateCustomerStats}
          onAddOrder={(order) => {
            const fullOrder: Order = {
              ...order,
              id: order.id || `ORD-${Date.now().toString().slice(-4)}`,
              createdAt: order.createdAt || new Date().toISOString(),
              status: order.status || 'kitchen',
              paymentStatus: order.paymentStatus || 'pending',
              paymentMethod: order.paymentMethod || 'efectivo',
              source: 'tpv'
            } as Order;
            handleSetOrders(prev => [fullOrder, ...prev]);
            notificationService.notifyNewOrder(fullOrder);
            setTpvEditOrder(null);
            setTpvInitialTable(null);
            if (tpvReturnView === 'local_dispatch') {
              setTpvReturnView('control_panel');
              navigateToView('local_dispatch');
            }
          }}
          onUpdateOrder={(order) => {
            handleSetOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...order } : o));
            setTpvEditOrder(null);
            setTpvInitialTable(null);
            setTpvReturnView('control_panel');
            navigateToView('local_dispatch');
          }}
          initialOrder={tpvEditOrder}
          initialTable={tpvInitialTable}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onExit={() => {
            const target = tpvReturnView;
            setTpvEditOrder(null);
            setTpvInitialTable(null);
            setTpvReturnView('control_panel');
            navigateToView(target);
          }}
        />
      );
    }

    if (view === 'local_dispatch') {
      return (
        <LocalDispatchView
          orders={orders}
          staff={staff}
          updateCustomerStats={updateCustomerStats}
          onUpdateOrder={(updated) => handleSetOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))}
          onRecordLog={(entry) => {
            const uniqueSuffix = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
              ? crypto.randomUUID().slice(0, 8)
              : Math.random().toString(36).slice(2, 8);
            const newLog: SiteLog = {
              id: `log-${Date.now()}-${uniqueSuffix}`,
              timestamp: new Date().toISOString(),
              user: entry.user,
              action: entry.action,
              details: entry.details,
              type: entry.type
            };
            handleSetLogs(prev => [newLog, ...prev]);
          }}
          onEditOrder={(order) => {
            setTpvEditOrder(order);
            setTpvInitialTable(null);
            setTpvReturnView('local_dispatch');
            navigateToView('tpv');
          }}
          onOpenTableOrder={(tableNum) => {
            setTpvEditOrder(null);
            setTpvInitialTable(tableNum);
            setTpvReturnView('local_dispatch');
            navigateToView('tpv');
          }}
          setView={(nextView) => {
            if (nextView === 'tpv') {
              setTpvReturnView('local_dispatch');
            }
            navigateToView(nextView as AppView);
          }}
        />
      );
    }

    return (
      <>
        <PublicView
          categories={categories}
          menuItems={menuItems}
          customers={customers}
          orders={orders}
          onAddCustomer={(customer) => handleSetCustomers(prev => [...prev, customer])}
          onUpdateCustomer={(updated) => handleSetCustomers(prev => prev.map(c => c.id === updated.id ? updated : c))}
          onAddOrder={(order) => {
            handleSetOrders(prev => [order, ...prev]);
            updateCustomerStats(order.customerName, order.customerPhone, order.total, true);
            if (notificationService.isAdmin()) {
              notificationService.notifyNewOrder(order);
            }
          }}
          onEnterControlPanel={handleEnterControlPanel}
          onViewDigitalTicket={handleOpenDigitalTicket}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />
        <ControlPanelAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  };

  return (
    <>
      {renderCurrentView()}
      <DigitalTicketModal
        isOpen={isDigitalTicketOpen}
        orderId={digitalTicketOrderId}
        order={orders.find(o => o.id === digitalTicketOrderId) || null}
        onClose={handleCloseDigitalTicket}
        isDarkMode={isDarkMode}
      />
    </>
  );
}

