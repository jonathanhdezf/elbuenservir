import { supabase } from '../utils/supabaseClient';
import { 
  Category, 
  MenuItem, 
  Order, 
  Customer, 
  DeliveryDriver, 
  Staff, 
  SiteLog 
} from '../types';

// Convert DB row to Category
export const mapCategoryFromDb = (row: any): Category => ({
  id: row.id,
  name: row.name,
  icon: row.icon || undefined
});

// Convert Category to DB row
export const mapCategoryToDb = (cat: Category) => ({
  id: cat.id,
  name: cat.name,
  icon: cat.icon || null
});

// Convert DB row to MenuItem
export const mapMenuItemFromDb = (row: any): MenuItem => ({
  id: row.id,
  categoryId: row.category_id,
  name: row.name,
  description: row.description || '',
  isActive: row.is_active ?? true,
  variations: Array.isArray(row.variations) ? row.variations : []
});

// Convert MenuItem to DB row
export const mapMenuItemToDb = (item: MenuItem) => ({
  id: item.id,
  category_id: item.categoryId,
  name: item.name,
  description: item.description,
  is_active: item.isActive,
  variations: item.variations
});

// Convert DB row to Order
export const mapOrderFromDb = (row: any): Order => ({
  id: row.id,
  customerName: row.customer_name,
  customerPhone: row.customer_phone,
  address: row.address || undefined,
  items: Array.isArray(row.items) ? row.items : [],
  total: parseFloat(row.total) || 0,
  status: row.status,
  paymentMethod: row.payment_method,
  paymentStatus: row.payment_status,
  createdAt: row.created_at,
  paidAt: row.paid_at || undefined,
  assignedDriverId: row.assigned_driver_id || undefined,
  ticketNumber: row.ticket_number || undefined,
  operationNumber: row.operation_number || undefined,
  transferStatus: row.transfer_status || undefined,
  dispatchedAt: row.dispatched_at || undefined,
  source: row.source || 'online',
  waiterId: row.waiter_id || undefined,
  cashReceived: row.cash_received != null ? parseFloat(row.cash_received) : undefined,
  change: row.change != null ? parseFloat(row.change) : undefined,
  notes: row.notes || undefined,
  deliveryFee: row.delivery_fee != null ? parseFloat(row.delivery_fee) : 0,
  notifiedStatuses: row.notified_statuses || {},
  whatsappNotified: row.whatsapp_notified ?? false
});

// Convert Order to DB row
export const mapOrderToDb = (order: Order) => ({
  id: order.id,
  customer_name: order.customerName,
  customer_phone: order.customerPhone,
  address: order.address || null,
  items: order.items,
  total: order.total,
  status: order.status,
  payment_method: order.paymentMethod,
  payment_status: order.paymentStatus,
  created_at: order.createdAt,
  paid_at: order.paidAt || null,
  assigned_driver_id: order.assignedDriverId || null,
  ticket_number: order.ticketNumber || null,
  operation_number: order.operationNumber || null,
  transfer_status: order.transferStatus || null,
  dispatched_at: order.dispatchedAt || null,
  source: order.source || 'online',
  waiter_id: order.waiterId || null,
  cash_received: order.cashReceived ?? null,
  change: order.change ?? null,
  notes: order.notes || null,
  delivery_fee: order.deliveryFee ?? 0,
  notified_statuses: order.notifiedStatuses || {},
  whatsapp_notified: order.whatsappNotified ?? false
});

// Convert DB row to Customer
export const mapCustomerFromDb = (row: any): Customer => ({
  id: row.id,
  name: row.name,
  email: row.email || undefined,
  phone: row.phone,
  totalOrders: row.total_orders || 0,
  totalSpent: parseFloat(row.total_spent) || 0,
  lastOrderDate: row.last_order_date || undefined,
  addresses: Array.isArray(row.addresses) ? row.addresses : [],
  password: row.password || undefined,
  avatarUrl: row.avatar_url || undefined,
  creditEnabled: Boolean(row.credit_enabled),
  creditLimit: parseFloat(row.credit_limit) || 0,
  creditBalance: parseFloat(row.credit_balance) || 0,
  creditNotes: row.credit_notes || undefined,
  creditHistory: Array.isArray(row.credit_history) ? row.credit_history : []
});

// Convert Customer to DB row
export const mapCustomerToDb = (cust: Customer) => ({
  id: cust.id,
  name: cust.name,
  email: cust.email || null,
  phone: cust.phone,
  total_orders: cust.totalOrders || 0,
  total_spent: cust.totalSpent || 0,
  last_order_date: cust.lastOrderDate || null,
  addresses: cust.addresses || [],
  password: cust.password || null,
  avatar_url: cust.avatarUrl || null,
  credit_enabled: cust.creditEnabled ?? false,
  credit_limit: cust.creditLimit ?? 0,
  credit_balance: cust.creditBalance ?? 0,
  credit_notes: cust.creditNotes || null,
  credit_history: cust.creditHistory || []
});

// Convert DB row to DeliveryDriver
export const mapDriverFromDb = (row: any): DeliveryDriver => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  status: row.status,
  vehicleType: row.vehicle_type,
  deliveriesCompleted: row.deliveries_completed || 0,
  rating: parseFloat(row.rating) || 5.0,
  isDisabled: row.is_disabled ?? false,
  pin: row.pin || undefined
});

// Convert DeliveryDriver to DB row
export const mapDriverToDb = (d: DeliveryDriver) => ({
  id: d.id,
  name: d.name,
  phone: d.phone,
  status: d.status,
  vehicle_type: d.vehicleType,
  deliveries_completed: d.deliveriesCompleted,
  rating: d.rating,
  is_disabled: d.isDisabled ?? false,
  pin: d.pin || null
});

// Convert DB row to Staff
export const mapStaffFromDb = (row: any): Staff => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  role: row.role,
  status: row.status,
  password: row.password || undefined
});

// Convert Staff to DB row
export const mapStaffToDb = (s: Staff) => ({
  id: s.id,
  name: s.name,
  phone: s.phone,
  role: s.role,
  status: s.status,
  password: s.password || null
});

// Convert DB row to SiteLog
export const mapLogFromDb = (row: any): SiteLog => ({
  id: row.id,
  timestamp: row.timestamp,
  user: row.user_name,
  action: row.action,
  details: row.details,
  type: row.type
});

// Convert SiteLog to DB row
export const mapLogToDb = (log: SiteLog) => ({
  id: log.id,
  timestamp: log.timestamp,
  user_name: log.user,
  action: log.action,
  details: log.details,
  type: log.type
});

export const databaseService = {
  // 1. Initial Load & Seed
  async loadAll(
    initialCategories: Category[],
    initialItems: MenuItem[],
    initialDrivers: DeliveryDriver[],
    initialCustomers: Customer[],
    initialStaff: Staff[]
  ) {
    try {
      // Categories
      const { data: dbCategories, error: catErr } = await supabase.from('categories').select('*');
      let finalCategories = initialCategories;
      if (!catErr && dbCategories && dbCategories.length > 0) {
        finalCategories = dbCategories.map(mapCategoryFromDb);
      } else if (dbCategories && dbCategories.length === 0) {
        // Seed initial categories
        const toInsert = initialCategories.map(mapCategoryToDb);
        await supabase.from('categories').insert(toInsert);
      }

      // Menu Items
      const { data: dbItems, error: itemsErr } = await supabase.from('menu_items').select('*');
      let finalItems = initialItems;
      if (!itemsErr && dbItems && dbItems.length > 0) {
        finalItems = dbItems.map(mapMenuItemFromDb);
      } else if (dbItems && dbItems.length === 0) {
        // Seed initial items
        const toInsert = initialItems.map(mapMenuItemToDb);
        await supabase.from('menu_items').insert(toInsert);
      }

      // Orders
      const { data: dbOrders, error: ordErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      let finalOrders: Order[] = [];
      if (!ordErr && dbOrders) {
        finalOrders = dbOrders.map(mapOrderFromDb);
      }

      // Customers
      const { data: dbCustomers, error: custErr } = await supabase.from('customers').select('*');
      let finalCustomers = initialCustomers;
      if (!custErr && dbCustomers && dbCustomers.length > 0) {
        finalCustomers = dbCustomers.map(mapCustomerFromDb);
      } else if (dbCustomers && dbCustomers.length === 0) {
        await supabase.from('customers').insert(initialCustomers.map(mapCustomerToDb));
      }

      // Drivers
      const { data: dbDrivers, error: drivErr } = await supabase.from('delivery_drivers').select('*');
      let finalDrivers = initialDrivers;
      if (!drivErr && dbDrivers && dbDrivers.length > 0) {
        finalDrivers = dbDrivers.map(mapDriverFromDb);
      } else if (dbDrivers && dbDrivers.length === 0) {
        await supabase.from('delivery_drivers').insert(initialDrivers.map(mapDriverToDb));
      }

      // Staff
      const { data: dbStaff, error: stErr } = await supabase.from('staff').select('*');
      let finalStaff = initialStaff;
      if (!stErr && dbStaff && dbStaff.length > 0) {
        finalStaff = dbStaff.map(mapStaffFromDb);
      } else if (dbStaff && dbStaff.length === 0) {
        await supabase.from('staff').insert(initialStaff.map(mapStaffToDb));
      }

      return {
        categories: finalCategories,
        menuItems: finalItems,
        orders: finalOrders,
        customers: finalCustomers,
        drivers: finalDrivers,
        staff: finalStaff
      };
    } catch (err) {
      console.warn('[Database] Falling back to local data due to load error:', err);
      return null;
    }
  },

  // 2. Realtime Subscriptions
  subscribeToChanges(callbacks: {
    onOrderChange?: (payload: any) => void;
    onMenuItemChange?: (payload: any) => void;
    onCategoryChange?: (payload: any) => void;
    onCustomerChange?: (payload: any) => void;
  }) {
    const channel = supabase.channel('el-buen-servir-realtime');

    if (callbacks.onOrderChange) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => callbacks.onOrderChange?.(payload)
      );
    }

    if (callbacks.onMenuItemChange) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        (payload) => callbacks.onMenuItemChange?.(payload)
      );
    }

    if (callbacks.onCategoryChange) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => callbacks.onCategoryChange?.(payload)
      );
    }

    if (callbacks.onCustomerChange) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        (payload) => callbacks.onCustomerChange?.(payload)
      );
    }

    channel.subscribe((status) => {
      console.log('[Supabase Realtime] Status:', status);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // 3. Orders Mutations
  async upsertOrder(order: Order) {
    const row = mapOrderToDb(order);
    const { error } = await supabase.from('orders').upsert(row);
    if (error) console.error('[Database] Error upserting order:', error);
  },

  async deleteOrder(orderId: string) {
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (error) console.error('[Database] Error deleting order:', error);
  },

  // 4. Menu Items Mutations
  async upsertMenuItem(item: MenuItem) {
    const row = mapMenuItemToDb(item);
    const { error } = await supabase.from('menu_items').upsert(row);
    if (error) console.error('[Database] Error upserting menu item:', error);
  },

  async deleteMenuItem(itemId: string) {
    const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
    if (error) console.error('[Database] Error deleting menu item:', error);
  },

  // 5. Categories Mutations
  async upsertCategory(cat: Category) {
    const row = mapCategoryToDb(cat);
    const { error } = await supabase.from('categories').upsert(row);
    if (error) console.error('[Database] Error upserting category:', error);
  },

  async deleteCategory(catId: string) {
    const { error } = await supabase.from('categories').delete().eq('id', catId);
    if (error) console.error('[Database] Error deleting category:', error);
  },

  // 6. Customers Mutations
  async upsertCustomer(cust: Customer) {
    const row = mapCustomerToDb(cust);
    const { error } = await supabase.from('customers').upsert(row);
    if (error) console.error('[Database] Error upserting customer:', error);
  },

  async deleteCustomer(custId: string) {
    const { error } = await supabase.from('customers').delete().eq('id', custId);
    if (error) console.error('[Database] Error deleting customer:', error);
  },

  // 7. Drivers Mutations
  async upsertDriver(driver: DeliveryDriver) {
    const row = mapDriverToDb(driver);
    const { error } = await supabase.from('delivery_drivers').upsert(row);
    if (error) console.error('[Database] Error upserting driver:', error);
  },

  // 8. Staff Mutations
  async upsertStaff(staffMember: Staff) {
    const row = mapStaffToDb(staffMember);
    const { error } = await supabase.from('staff').upsert(row);
    if (error) console.error('[Database] Error upserting staff:', error);
  },

  // 9. Site Logs
  async insertLog(log: SiteLog) {
    const row = mapLogToDb(log);
    const { error } = await supabase.from('site_logs').insert(row);
    if (error) console.error('[Database] Error inserting log:', error);
  }
};
