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
  variations: Array.isArray(row.variations) ? row.variations : [],
  allowAccompaniments: row.allow_accompaniments !== null && row.allow_accompaniments !== undefined ? Boolean(row.allow_accompaniments) : undefined,
  allowSides: row.allow_sides !== null && row.allow_sides !== undefined ? Boolean(row.allow_sides) : undefined
});

// Convert MenuItem to DB row
export const mapMenuItemToDb = (item: MenuItem) => ({
  id: item.id,
  category_id: item.categoryId,
  name: item.name,
  description: item.description,
  is_active: item.isActive,
  variations: item.variations,
  allow_accompaniments: item.allowAccompaniments !== undefined ? item.allowAccompaniments : null,
  allow_sides: item.allowSides !== undefined ? item.allowSides : null
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

const SYNC_BROADCAST_CHANNEL_NAME = 'tlayoyos_3_marias_sync_v1';
const REALTIME_CHANNEL_NAME = 'tlayoyos-3-marias-realtime';
const CLIENT_INSTANCE_ID =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `client-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

type SyncEntity = 'orders' | 'menu_items' | 'categories' | 'customers' | 'drivers' | 'staff';

interface SyncEventPayload {
  entity: SyncEntity;
  action: 'upsert' | 'delete';
  record?: any;
  id?: string;
  senderId: string;
  ts: number;
}

export interface NormalizedRealtimeChange<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  record?: T;
  id?: string;
  source: 'postgres' | 'broadcast' | 'local';
}

export interface SubscribeCallbacks {
  onOrderChange?: (change: NormalizedRealtimeChange<Order>) => void;
  onOrderSyncBatch?: (orders: Order[]) => void;
  onMenuItemChange?: (change: NormalizedRealtimeChange<MenuItem>) => void;
  onCategoryChange?: (change: NormalizedRealtimeChange<Category>) => void;
  onCustomerChange?: (change: NormalizedRealtimeChange<Customer>) => void;
  onDriverChange?: (change: NormalizedRealtimeChange<DeliveryDriver>) => void;
  onStaffChange?: (change: NormalizedRealtimeChange<Staff>) => void;
  onRealtimeStatusChange?: (status: 'SUBSCRIBED' | 'RECONNECTING' | 'DISCONNECTED') => void;
  getRelevantOrderIds?: () => Set<string> | string[] | null | undefined;
  isOrderRelevant?: (orderId: string, order?: Order, eventType?: 'INSERT' | 'UPDATE' | 'DELETE') => boolean;
}

let activeRealtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let isRealtimeSubscribed = false;
let pendingBroadcastQueue: SyncEventPayload[] = [];
let localSyncChannel: BroadcastChannel | null = null;

const getLocalSyncChannel = (): BroadcastChannel | null => {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!localSyncChannel) {
    try {
      localSyncChannel = new BroadcastChannel(SYNC_BROADCAST_CHANNEL_NAME);
    } catch {
      return null;
    }
  }
  return localSyncChannel;
};

const emitSyncEvent = (event: Omit<SyncEventPayload, 'senderId' | 'ts'>) => {
  const payload: SyncEventPayload = {
    ...event,
    senderId: CLIENT_INSTANCE_ID,
    ts: Date.now(),
  };

  // 1. Instant zero-quota sync across tabs in the same browser/device
  try {
    getLocalSyncChannel()?.postMessage(payload);
  } catch {
    // ignore BroadcastChannel errors
  }

  // 2. Event-driven Supabase Realtime Broadcast across devices (0 DB queries)
  if (activeRealtimeChannel && isRealtimeSubscribed) {
    activeRealtimeChannel
      .send({
        type: 'broadcast',
        event: 'sync_event',
        payload,
      })
      .catch((err) => {
        console.warn('[Supabase Broadcast] Error sending sync event:', err);
      });
  } else {
    pendingBroadcastQueue.push(payload);
    if (pendingBroadcastQueue.length > 25) {
      pendingBroadcastQueue = pendingBroadcastQueue.slice(-25);
    }
  }
};

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
        const tlayoyoItem = initialItems.find(i => i.id === 'm-tlayoyos-salsa');
        let alreadySeeded = false;
        try {
          alreadySeeded = localStorage.getItem('tlayoyos_seeded_tlayoyos_salsa_v4') === 'true';
        } catch {
          alreadySeeded = false;
        }
        if (tlayoyoItem && !alreadySeeded) {
          const existingIdx = finalItems.findIndex(i => i.id === 'm-tlayoyos-salsa');
          if (existingIdx === -1) {
            finalItems = [tlayoyoItem, ...finalItems];
          } else {
            finalItems = finalItems.map(i => (i.id === 'm-tlayoyos-salsa' ? tlayoyoItem : i));
          }
          await supabase.from('menu_items').upsert(mapMenuItemToDb(tlayoyoItem));
          try {
            localStorage.setItem('tlayoyos_seeded_tlayoyos_salsa_v4', 'true');
          } catch {
            // ignore storage errors
          }
        }
      } else if (dbItems && dbItems.length === 0) {
        // Seed initial items
        const toInsert = initialItems.map(mapMenuItemToDb);
        await supabase.from('menu_items').insert(toInsert);
        try {
          localStorage.setItem('tlayoyos_seeded_tlayoyos_salsa_v4', 'true');
        } catch {
          // ignore storage errors
        }
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

  // Lightweight catch-up query (only called on reconnect/tab wake after cooldown, never polled)
  async fetchRecentOrders(limit: number = 80): Promise<Order[] | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error || !data) return null;
      return data.map(mapOrderFromDb);
    } catch {
      return null;
    }
  },

  // 2. Quota-Safe Realtime Subscriptions (Single Channel: Broadcast + Postgres Changes + Local Tab Sync)
  subscribeToChanges(callbacks: SubscribeCallbacks) {
    let isCleanedUp = false;
    let currentChannel: ReturnType<typeof supabase.channel> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempt = 0;
    let wasDisconnected = false;
    let lastCatchupAt = Date.now();
    let catchupInFlight = false;

    const triggerCooldownCatchup = async (minCooldownMs: number) => {
      if (isCleanedUp || catchupInFlight || !callbacks.onOrderSyncBatch) return;
      const now = Date.now();
      if (now - lastCatchupAt < minCooldownMs) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

      catchupInFlight = true;
      lastCatchupAt = now;
      try {
        const recentOrders = await databaseService.fetchRecentOrders(80);
        if (!isCleanedUp && recentOrders) {
          callbacks.onOrderSyncBatch(recentOrders);
        }
      } finally {
        catchupInFlight = false;
      }
    };

    const shouldProcessOrderChange = (
      orderId: string | undefined,
      order: Order | undefined,
      eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    ): boolean => {
      if (!callbacks.isOrderRelevant && !callbacks.getRelevantOrderIds) {
        return true;
      }
      if (callbacks.isOrderRelevant) {
        return callbacks.isOrderRelevant(orderId || '', order, eventType);
      }
      if (callbacks.getRelevantOrderIds) {
        const relevantIds = callbacks.getRelevantOrderIds();
        if (!relevantIds) return true;
        const set = relevantIds instanceof Set ? relevantIds : new Set(relevantIds);
        if (eventType === 'DELETE') {
          return Boolean(orderId && set.has(orderId));
        }
        if (orderId && set.has(orderId)) return true;
        if (eventType === 'INSERT') return true;
        return false;
      }
      return true;
    };

    const dispatchSyncEvent = (payload: SyncEventPayload, source: 'broadcast' | 'local') => {
      if (!payload || payload.senderId === CLIENT_INSTANCE_ID) return;

      if (payload.entity === 'orders' && callbacks.onOrderChange) {
        const orderRecord = payload.record as Order | undefined;
        const orderId = payload.id || orderRecord?.id;
        const eventType: 'INSERT' | 'UPDATE' | 'DELETE' =
          payload.action === 'delete' ? 'DELETE' : 'UPDATE';

        if (!shouldProcessOrderChange(orderId, orderRecord, eventType)) {
          return;
        }

        if (payload.action === 'delete') {
          callbacks.onOrderChange({ eventType: 'DELETE', id: payload.id, source });
        } else if (payload.record) {
          callbacks.onOrderChange({ eventType: 'UPDATE', record: payload.record as Order, source });
        }
        return;
      }

      if (payload.entity === 'menu_items' && callbacks.onMenuItemChange) {
        if (payload.action === 'delete') {
          callbacks.onMenuItemChange({ eventType: 'DELETE', id: payload.id, source });
        } else if (payload.record) {
          callbacks.onMenuItemChange({ eventType: 'UPDATE', record: payload.record as MenuItem, source });
        }
        return;
      }

      if (payload.entity === 'categories' && callbacks.onCategoryChange) {
        if (payload.action === 'delete') {
          callbacks.onCategoryChange({ eventType: 'DELETE', id: payload.id, source });
        } else if (payload.record) {
          callbacks.onCategoryChange({ eventType: 'UPDATE', record: payload.record as Category, source });
        }
        return;
      }

      if (payload.entity === 'customers' && callbacks.onCustomerChange) {
        if (payload.action === 'delete') {
          callbacks.onCustomerChange({ eventType: 'DELETE', id: payload.id, source });
        } else if (payload.record) {
          callbacks.onCustomerChange({ eventType: 'UPDATE', record: payload.record as Customer, source });
        }
        return;
      }

      if (payload.entity === 'drivers' && callbacks.onDriverChange) {
        if (payload.action === 'delete') {
          callbacks.onDriverChange({ eventType: 'DELETE', id: payload.id, source });
        } else if (payload.record) {
          callbacks.onDriverChange({ eventType: 'UPDATE', record: payload.record as DeliveryDriver, source });
        }
        return;
      }

      if (payload.entity === 'staff' && callbacks.onStaffChange) {
        if (payload.action === 'delete') {
          callbacks.onStaffChange({ eventType: 'DELETE', id: payload.id, source });
        } else if (payload.record) {
          callbacks.onStaffChange({ eventType: 'UPDATE', record: payload.record as Staff, source });
        }
      }
    };

    const flushPendingBroadcasts = (channel: ReturnType<typeof supabase.channel>) => {
      if (pendingBroadcastQueue.length === 0) return;
      const queued = [...pendingBroadcastQueue];
      pendingBroadcastQueue = [];
      queued.forEach((evt) => {
        channel
          .send({ type: 'broadcast', event: 'sync_event', payload: evt })
          .catch(() => {});
      });
    };

    const clearReconnectTimer = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const scheduleReconnect = () => {
      if (isCleanedUp || reconnectTimer) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

      const delays = [2000, 4000, 8000, 15000, 30000];
      const delay = delays[Math.min(reconnectAttempt, delays.length - 1)];
      reconnectAttempt += 1;

      callbacks.onRealtimeStatusChange?.('RECONNECTING');
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        if (!isCleanedUp) {
          connectChannel();
        }
      }, delay);
    };

    const connectChannel = () => {
      if (isCleanedUp) return;

      if (currentChannel) {
        const old = currentChannel;
        currentChannel = null;
        if (activeRealtimeChannel === old) {
          activeRealtimeChannel = null;
          isRealtimeSubscribed = false;
        }
        supabase.removeChannel(old);
      }

      const channel = supabase.channel(REALTIME_CHANNEL_NAME, {
        config: {
          broadcast: { self: false, ack: false }
        }
      });

      currentChannel = channel;
      activeRealtimeChannel = channel;
      isRealtimeSubscribed = false;

      // A) Direct low-latency Broadcast (bypasses WAL REPLICA IDENTITY limits, 0 DB quota)
      channel.on('broadcast', { event: 'sync_event' }, (msg: any) => {
        if (msg?.payload) {
          dispatchSyncEvent(msg.payload as SyncEventPayload, 'broadcast');
        }
      });

      // B) PostgreSQL WAL changes on the exact same single WebSocket channel
      if (callbacks.onOrderChange) {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload: any) => {
            const eventType: 'INSERT' | 'UPDATE' | 'DELETE' =
              payload.eventType === 'DELETE' ? 'DELETE' : payload.eventType === 'INSERT' ? 'INSERT' : 'UPDATE';
            const orderId = payload.eventType === 'DELETE' ? payload.old?.id : payload.new?.id;
            const mappedOrder = payload.new ? mapOrderFromDb(payload.new) : undefined;

            if (!shouldProcessOrderChange(orderId, mappedOrder, eventType)) {
              return;
            }

            if (payload.eventType === 'DELETE') {
              callbacks.onOrderChange?.({
                eventType: 'DELETE',
                id: payload.old?.id,
                source: 'postgres'
              });
            } else if (payload.new) {
              callbacks.onOrderChange?.({
                eventType,
                record: mappedOrder,
                source: 'postgres'
              });
            }
          }
        );
      }

      if (callbacks.onMenuItemChange) {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'menu_items' },
          (payload: any) => {
            if (payload.eventType === 'DELETE') {
              callbacks.onMenuItemChange?.({
                eventType: 'DELETE',
                id: payload.old?.id,
                source: 'postgres'
              });
            } else if (payload.new) {
              callbacks.onMenuItemChange?.({
                eventType: payload.eventType === 'INSERT' ? 'INSERT' : 'UPDATE',
                record: mapMenuItemFromDb(payload.new),
                source: 'postgres'
              });
            }
          }
        );
      }

      if (callbacks.onCategoryChange) {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'categories' },
          (payload: any) => {
            if (payload.eventType === 'DELETE') {
              callbacks.onCategoryChange?.({
                eventType: 'DELETE',
                id: payload.old?.id,
                source: 'postgres'
              });
            } else if (payload.new) {
              callbacks.onCategoryChange?.({
                eventType: payload.eventType === 'INSERT' ? 'INSERT' : 'UPDATE',
                record: mapCategoryFromDb(payload.new),
                source: 'postgres'
              });
            }
          }
        );
      }

      if (callbacks.onCustomerChange) {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'customers' },
          (payload: any) => {
            if (payload.eventType === 'DELETE') {
              callbacks.onCustomerChange?.({
                eventType: 'DELETE',
                id: payload.old?.id,
                source: 'postgres'
              });
            } else if (payload.new) {
              callbacks.onCustomerChange?.({
                eventType: payload.eventType === 'INSERT' ? 'INSERT' : 'UPDATE',
                record: mapCustomerFromDb(payload.new),
                source: 'postgres'
              });
            }
          }
        );
      }

      if (callbacks.onDriverChange) {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'delivery_drivers' },
          (payload: any) => {
            if (payload.eventType === 'DELETE') {
              callbacks.onDriverChange?.({
                eventType: 'DELETE',
                id: payload.old?.id,
                source: 'postgres'
              });
            } else if (payload.new) {
              callbacks.onDriverChange?.({
                eventType: payload.eventType === 'INSERT' ? 'INSERT' : 'UPDATE',
                record: mapDriverFromDb(payload.new),
                source: 'postgres'
              });
            }
          }
        );
      }

      if (callbacks.onStaffChange) {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'staff' },
          (payload: any) => {
            if (payload.eventType === 'DELETE') {
              callbacks.onStaffChange?.({
                eventType: 'DELETE',
                id: payload.old?.id,
                source: 'postgres'
              });
            } else if (payload.new) {
              callbacks.onStaffChange?.({
                eventType: payload.eventType === 'INSERT' ? 'INSERT' : 'UPDATE',
                record: mapStaffFromDb(payload.new),
                source: 'postgres'
              });
            }
          }
        );
      }

      channel.subscribe((status) => {
        if (isCleanedUp || currentChannel !== channel) return;
        console.log('[Supabase Realtime] Status:', status);

        if (status === 'SUBSCRIBED') {
          isRealtimeSubscribed = true;
          reconnectAttempt = 0;
          clearReconnectTimer();
          callbacks.onRealtimeStatusChange?.('SUBSCRIBED');
          flushPendingBroadcasts(channel);

          if (wasDisconnected) {
            wasDisconnected = false;
            void triggerCooldownCatchup(5000);
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          isRealtimeSubscribed = false;
          wasDisconnected = true;
          callbacks.onRealtimeStatusChange?.('DISCONNECTED');
          scheduleReconnect();
        }
      });
    };

    // C) Local browser multi-tab BroadcastChannel listener (0 Supabase quota)
    let tabListenerChannel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        tabListenerChannel = new BroadcastChannel(SYNC_BROADCAST_CHANNEL_NAME);
        tabListenerChannel.onmessage = (event) => {
          if (event?.data) {
            dispatchSyncEvent(event.data as SyncEventPayload, 'local');
          }
        };
      }
    } catch {
      tabListenerChannel = null;
    }

    // D) Reconnect & throttled catch-up ONLY when tab wakes up or network returns
    const handleVisibilityOrOnline = () => {
      if (isCleanedUp) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

      if (!isRealtimeSubscribed) {
        clearReconnectTimer();
        reconnectAttempt = 0;
        connectChannel();
      }
      void triggerCooldownCatchup(25000);
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityOrOnline);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleVisibilityOrOnline);
    }

    connectChannel();

    return () => {
      isCleanedUp = true;
      clearReconnectTimer();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityOrOnline);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleVisibilityOrOnline);
      }
      if (tabListenerChannel) {
        try {
          tabListenerChannel.close();
        } catch {
          // ignore
        }
      }
      if (currentChannel) {
        if (activeRealtimeChannel === currentChannel) {
          activeRealtimeChannel = null;
          isRealtimeSubscribed = false;
        }
        supabase.removeChannel(currentChannel);
        currentChannel = null;
      }
    };
  },

  // 3. Orders Mutations
  async upsertOrder(order: Order) {
    const row = mapOrderToDb(order);
    const { error } = await supabase.from('orders').upsert(row);
    if (error) {
      console.error('[Database] Error upserting order:', error);
      return;
    }
    emitSyncEvent({ entity: 'orders', action: 'upsert', record: order });
  },

  async deleteOrder(orderId: string) {
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (error) {
      console.error('[Database] Error deleting order:', error);
      return;
    }
    emitSyncEvent({ entity: 'orders', action: 'delete', id: orderId });
  },

  // 4. Menu Items Mutations
  async upsertMenuItem(item: MenuItem) {
    const row = mapMenuItemToDb(item);
    const { error } = await supabase.from('menu_items').upsert(row);
    if (error) {
      console.error('[Database] Error upserting menu item:', error);
      return;
    }
    emitSyncEvent({ entity: 'menu_items', action: 'upsert', record: item });
  },

  async deleteMenuItem(itemId: string) {
    const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
    if (error) {
      console.error('[Database] Error deleting menu item:', error);
      return;
    }
    emitSyncEvent({ entity: 'menu_items', action: 'delete', id: itemId });
  },

  // 5. Categories Mutations
  async upsertCategory(cat: Category) {
    const row = mapCategoryToDb(cat);
    const { error } = await supabase.from('categories').upsert(row);
    if (error) {
      console.error('[Database] Error upserting category:', error);
      return;
    }
    emitSyncEvent({ entity: 'categories', action: 'upsert', record: cat });
  },

  async deleteCategory(catId: string) {
    const { error } = await supabase.from('categories').delete().eq('id', catId);
    if (error) {
      console.error('[Database] Error deleting category:', error);
      return;
    }
    emitSyncEvent({ entity: 'categories', action: 'delete', id: catId });
  },

  // 6. Customers Mutations
  async upsertCustomer(cust: Customer) {
    const row = mapCustomerToDb(cust);
    const { error } = await supabase.from('customers').upsert(row);
    if (error) {
      console.error('[Database] Error upserting customer:', error);
      return;
    }
    emitSyncEvent({ entity: 'customers', action: 'upsert', record: cust });
  },

  async deleteCustomer(custId: string) {
    const { error } = await supabase.from('customers').delete().eq('id', custId);
    if (error) {
      console.error('[Database] Error deleting customer:', error);
      return;
    }
    emitSyncEvent({ entity: 'customers', action: 'delete', id: custId });
  },

  // 7. Drivers Mutations
  async upsertDriver(driver: DeliveryDriver) {
    const row = mapDriverToDb(driver);
    const { error } = await supabase.from('delivery_drivers').upsert(row);
    if (error) {
      console.error('[Database] Error upserting driver:', error);
      return;
    }
    emitSyncEvent({ entity: 'drivers', action: 'upsert', record: driver });
  },

  // 8. Staff Mutations
  async upsertStaff(staffMember: Staff) {
    const row = mapStaffToDb(staffMember);
    const { error } = await supabase.from('staff').upsert(row);
    if (error) {
      console.error('[Database] Error upserting staff:', error);
      return;
    }
    emitSyncEvent({ entity: 'staff', action: 'upsert', record: staffMember });
  },

  // 9. Site Logs
  async insertLog(log: SiteLog) {
    const row = mapLogToDb(log);
    const { error } = await supabase
      .from('site_logs')
      .upsert(row, { onConflict: 'id', ignoreDuplicates: true });
    if (error) console.error('[Database] Error inserting log:', error);
  }
};
