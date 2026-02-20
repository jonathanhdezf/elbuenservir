
export interface PricingVariation {
  id: string;
  label: string;
  price: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  isActive: boolean;
  variations: PricingVariation[];
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export type TabId = string;

export type OrderStatus = 'pending' | 'kitchen' | 'ready' | 'delivery' | 'delivered' | 'cancelled';
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';
export type PaymentStatus = 'pending' | 'paid';
export type TransferStatus = 'recibido' | 'pendiente' | 'no_recibido';

export interface OrderItem {
  id: string;
  name: string;
  variationLabel: string;
  price: number;
  quantity: number;
  isOld?: boolean;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  address?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  paidAt?: string;
  assignedDriverId?: string;
  ticketNumber?: string;
  operationNumber?: string;
  transferStatus?: TransferStatus;
  dispatchedAt?: string;
  source?: 'online' | 'tpv';
  waiterId?: string;
  cashReceived?: number;
  change?: number;
  notes?: string;
  deliveryFee?: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
  addresses: string[];
  password?: string;
}

export type VehicleType = 'moto' | 'bici' | 'auto' | 'walking';

export interface DeliveryDriver {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'busy' | 'offline';
  vehicleType: VehicleType;
  deliveriesCompleted: number;
  rating: number;
}

export type StaffRole = 'waiter' | 'cook' | 'admin' | 'cashier' | 'driver';

export interface Staff {
  id: string;
  name: string;
  phone: string;
  role: StaffRole;
  status: 'active' | 'offline';
  password?: string;
}

export interface SiteLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'critical';
}

export type AdminSection = 'dashboard' | 'kitchen' | 'kds' | 'dds' | 'menu' | 'orders' | 'customers' | 'reports' | 'driver_dashboard' | 'tpv' | 'local_dispatch' | 'staff_management' | 'logs';
