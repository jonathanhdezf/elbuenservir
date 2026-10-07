import { Order } from '../types';
import { soundManager } from '../utils/soundManager';

class NotificationService {
  private static instance: NotificationService;
  private hasPrompted: boolean = false;
  private lastNotifiedOrderId: string | null = null;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Check if current user/device is authenticated as administrator
   */
  public isAdmin(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return (
        sessionStorage.getItem('el_buen_servir_cp_auth') === 'true' ||
        localStorage.getItem('el_buen_servir_cp_auth') === 'true'
      );
    } catch {
      return false;
    }
  }

  /**
   * Set administrator authentication state in storage
   */
  public setAdminAuthenticated(authenticated: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      if (authenticated) {
        sessionStorage.setItem('el_buen_servir_cp_auth', 'true');
        localStorage.setItem('el_buen_servir_cp_auth', 'true');
      } else {
        sessionStorage.removeItem('el_buen_servir_cp_auth');
        localStorage.removeItem('el_buen_servir_cp_auth');
      }
    } catch (e) {
      console.warn('Storage error in notificationService:', e);
    }
  }

  /**
   * Check if Notifications are supported in the current browser/device
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Get current permission status
   */
  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Request permission from the user (administrators only)
   */
  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted' && this.isAdmin()) {
        await this.sendSystemNotification('✅ Notificaciones de Pedidos Activas', {
          body: 'Como administrador, recibirás alertas automáticas cuando entre un nuevo pedido.',
          tag: 'admin-notifications-enabled',
          data: {
            action: 'open_orders',
            view: 'admin',
            section: 'orders',
            url: '/?view=admin&section=orders'
          }
        });
        return true;
      }
      return permission === 'granted';
    } catch (err) {
      console.warn('Error solicitando permisos de notificación:', err);
      return false;
    }
  }

  /**
   * Send a general system notification
   */
  public async sendSystemNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    const defaultOptions: NotificationOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [200, 100, 200],
      ...options
    };

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, defaultOptions);
          return;
        }
      }
      new Notification(title, defaultOptions);
    } catch (err) {
      try {
        new Notification(title, defaultOptions);
      } catch (e) {
        console.warn('Notification fallback failed:', e);
      }
    }
  }

  /**
   * Notify about a newly generated order with push notification and sound
   * EXCLUSIVELY for authenticated administrators
   */
  public async notifyNewOrder(order: Order): Promise<void> {
    if (!order || !order.id) return;

    // Push notifications and sound for new orders are strictly for administrators
    if (!this.isAdmin()) {
      return;
    }

    // Prevent duplicate alert for the same order within a short window
    if (this.lastNotifiedOrderId === order.id) return;
    this.lastNotifiedOrderId = order.id;

    // Play audible alert for kitchen/staff
    soundManager.play('alert', 'kds');

    if (!this.isSupported()) return;

    // Auto-request permission on user interaction if default, only for admins
    if (Notification.permission === 'default' && !this.hasPrompted && this.isAdmin()) {
      this.hasPrompted = true;
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    if (Notification.permission !== 'granted') return;

    const sourceLabel = order.source === 'online' ? '🌐 Pedido Web Online' : '🖥️ Venta TPV';
    const itemCount = order.items?.length || 0;
    const itemsPreview = order.items?.slice(0, 2).map(i => `${i.quantity}x ${i.name}`).join(', ') || '';
    const moreItems = itemCount > 2 ? ` (+${itemCount - 2} más)` : '';

    const title = `🔔 ¡Nuevo Pedido #${order.id}!`;
    const body = `${sourceLabel}\n👤 ${order.customerName || 'Cliente'}\n🥘 ${itemsPreview}${moreItems}\n💰 Total: $${order.total.toFixed(2)}${order.address ? `\n📍 ${order.address}` : ''}`;

    const options: NotificationOptions = {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: `order-${order.id}`,
      renotify: true,
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300],
      data: {
        action: 'open_orders',
        view: 'admin',
        section: 'orders',
        orderId: order.id,
        url: `/?view=admin&section=orders&orderId=${order.id}`,
        timestamp: Date.now()
      }
    };

    await this.sendSystemNotification(title, options);
  }
}

export const notificationService = NotificationService.getInstance();
