
import React, { useState, useEffect } from 'react';
import { MenuItem, Category, TabId, Order, Customer, DeliveryDriver, Staff, SiteLog } from './types';
import AdminView from './views/AdminView';
import PublicView from './views/PublicView';
import MonitorCocina from './views/MonitorCocina';
import LogisticaDespachos from './views/LogisticaDespachos';
import TPVView from './views/TPVView';
import LocalDispatchView from './views/LocalDispatchView.tsx';
import ControlPanelView from './views/ControlPanelView';
import RepartidorView from './views/RepartidorView';

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

const INITIAL_ITEMS: MenuItem[] = [
  // MENÚ DEL DÍA
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
  { id: 'cust-1', name: 'Juan Pérez', phone: '1234567890', email: 'juan@example.com', totalOrders: 15, totalSpent: 1250.50, lastOrderDate: new Date(Date.now() - 86400000).toISOString(), addresses: ['Calle 10, Col. Centro', 'Av. Juárez 45'], password: '123456' },
  { id: 'cust-2', name: 'María García', phone: '555-0102', email: 'maria@example.com', totalOrders: 8, totalSpent: 740.00, lastOrderDate: new Date(Date.now() - 172800000).toISOString(), addresses: ['Av. Reforma 200'] },
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
export default function App() {
  const [view, setView] = useState<'admin' | 'public' | 'kitchen' | 'logistics' | 'tpv' | 'local_dispatch' | 'control_panel' | 'driver_portal'>('public');
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_ITEMS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>(INITIAL_DRIVERS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [staff, setStaff] = useState<Staff[]>(INITIAL_STAFF);
  const [logs, setLogs] = useState<SiteLog[]>(INITIAL_LOGS);
  const [tpvEditOrder, setTpvEditOrder] = useState<Order | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const updateCustomerStats = React.useCallback((customerName: string, customerPhone: string, amount: number, isAdding: boolean = true) => {
    if (!customerPhone || customerPhone === 'N/A' || customerPhone === '0000000000') return;

    setCustomers(prev => {
      const customerIndex = prev.findIndex(c => {
        const cPhone = c.phone.replace(/\D/g, '').slice(-10);
        const oPhone = customerPhone.replace(/\D/g, '').slice(-10);
        return cPhone === oPhone;
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
    setDrivers(prev => prev.map(d => {
      if (d.id === driverId) {
        const newCount = Math.max(0, d.deliveriesCompleted + (isAdding ? 1 : -1));
        // Simple moving average for rating if needed, but for now we just update it
        return {
          ...d,
          deliveriesCompleted: newCount,
          rating: rating || d.rating
        };
      }
      return d;
    }));
  }, []);

  if (view === 'control_panel') {
    return (
      <ControlPanelView
        onNavigate={(newView) => setView(newView as any)}
        onExit={() => setView('public')}
        isDarkMode={isDarkMode}
      />
    );
  }

  if (view === 'driver_portal') {
    return (
      <RepartidorView
        drivers={drivers}
        setDrivers={setDrivers}
        orders={orders}
        setOrders={setOrders}
        updateCustomerStats={updateCustomerStats}
        updateDriverStats={updateDriverStats}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onExit={() => setView('control_panel')}
      />
    );
  }

  if (view === 'kitchen') {
    return (
      <MonitorCocina
        orders={orders}
        setOrders={setOrders}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onExit={() => setView('control_panel')}
      />
    );
  }
  if (view === 'logistics') {
    return (
      <LogisticaDespachos
        orders={orders}
        setOrders={setOrders}
        drivers={drivers}
        setDrivers={setDrivers}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onExit={() => setView('control_panel')}
      />
    );
  }

  if (view === 'admin') {
    return (
      <AdminView
        categories={categories}
        setCategories={setCategories}
        menuItems={menuItems}
        setMenuItems={setMenuItems}
        orders={orders}
        setOrders={setOrders}
        drivers={drivers}
        setDrivers={setDrivers}
        logs={logs}
        setLogs={setLogs}
        customers={customers}
        setCustomers={setCustomers}
        updateCustomerStats={updateCustomerStats}
        updateDriverStats={updateDriverStats}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onExit={() => setView('control_panel')}
      />
    );
  }

  if (view === 'tpv') {
    return (
      <TPVView
        categories={categories}
        menuItems={menuItems}
        staff={INITIAL_STAFF}
        customers={customers}
        orders={orders}
        onAddCustomer={(customer) => setCustomers(prev => [...prev, customer])}
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
          setOrders(prev => [fullOrder, ...prev]);
          setTpvEditOrder(null);
        }}
        onUpdateOrder={(order) => {
          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...order } : o));
          setTpvEditOrder(null);
          setView('local_dispatch');
        }}
        initialOrder={tpvEditOrder}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onExit={() => {
          setTpvEditOrder(null);
          setView('control_panel');
        }}
      />
    )
  }

  if (view === 'local_dispatch') {
    return (
      <LocalDispatchView
        orders={orders}
        staff={staff}
        updateCustomerStats={updateCustomerStats}
        onUpdateOrder={(updated) => setOrders(orders.map(o => o.id === updated.id ? { ...o, ...updated } : o))}
        onEditOrder={(order) => {
          setTpvEditOrder(order);
          setView('tpv');
        }}
        setView={setView}
      />
    );
  }

  return (
    <PublicView
      categories={categories}
      menuItems={menuItems}
      customers={customers}
      onAddCustomer={(customer) => setCustomers(prev => [...prev, customer])}
      onAddOrder={(order) => setOrders(prev => [order, ...prev])}
      onEnterControlPanel={() => setView('control_panel')}
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
    />
  );
}

