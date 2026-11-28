export const extractOrderCodeFromScan = (rawValue: string): string => {
  let value = (rawValue || '').trim();
  if (!value) return '';

  // Remove Code 39 start/stop asterisks if present
  value = value.replace(/^\*+|\*+$/g, '').trim();

  // Extract from digital ticket URL or hash (e.g. https://.../?ticket=ORD-101 or #ticket-ORD-101)
  if (value.includes('?') || value.includes('#') || /^https?:\/\//i.test(value)) {
    try {
      const normalizedUrl = /^https?:\/\//i.test(value)
        ? value
        : `https://placeholder.local/${value.replace(/^\/+/, '')}`;
      const url = new URL(normalizedUrl);
      const paramTicket =
        url.searchParams.get('ticket') ||
        url.searchParams.get('pedido') ||
        url.searchParams.get('orden');
      if (paramTicket) {
        value = paramTicket.trim();
      } else if (url.hash && /^#ticket[-=]/i.test(url.hash)) {
        value = url.hash.replace(/^#ticket[-=]/i, '').trim();
      }
    } catch {
      const match = value.match(/(?:ticket|pedido|orden)[=-]([A-Za-z0-9_-]+)/i);
      if (match?.[1]) {
        value = match[1].trim();
      }
    }
  }

  return value.replace(/^#+/, '').replace(/^\*+|\*+$/g, '').trim().toUpperCase();
};

export const doesOrderCodeMatch = (input: string, expectedOrderId: string): boolean => {
  const normalizedInput = extractOrderCodeFromScan(input);
  const normalizedExpected = (expectedOrderId || '').trim().toUpperCase();
  if (!normalizedInput || !normalizedExpected) return false;

  if (normalizedInput === normalizedExpected) {
    return true;
  }

  // Allow matching by the numeric/code suffix after '-' (e.g. typing "101" for "ORD-101")
  const dashIndex = normalizedExpected.indexOf('-');
  if (dashIndex > -1) {
    const suffix = normalizedExpected.slice(dashIndex + 1).trim();
    if (suffix && normalizedInput === suffix) {
      return true;
    }
  }

  return false;
};

const DELIVERY_AUDIT_STORAGE_KEY = 'tlayoyos3marias_delivery_audit_v1';

export interface DeliveryAuditEntry {
  deliveredBy: string;
  deliveredById: string;
  deliveredAt: string;
}

export const loadDeliveryAuditMap = (): Record<string, DeliveryAuditEntry> => {
  try {
    const raw = localStorage.getItem(DELIVERY_AUDIT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export const saveOrderDeliveryAudit = (orderId: string, entry: DeliveryAuditEntry): void => {
  try {
    const map = loadDeliveryAuditMap();
    map[orderId] = entry;
    localStorage.setItem(DELIVERY_AUDIT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
};

export const mergeSingleOrderDeliveryAudit = <
  T extends { id: string; deliveredBy?: string; deliveredById?: string; deliveredAt?: string }
>(
  order: T
): T => {
  const map = loadDeliveryAuditMap();
  const audit = map[order.id];
  if (!audit) return order;
  return {
    ...order,
    deliveredBy: order.deliveredBy || audit.deliveredBy,
    deliveredById: order.deliveredById || audit.deliveredById,
    deliveredAt: order.deliveredAt || audit.deliveredAt,
  };
};

export const mergeOrderDeliveryAudit = <
  T extends { id: string; deliveredBy?: string; deliveredById?: string; deliveredAt?: string }
>(
  orders: T[]
): T[] => {
  const map = loadDeliveryAuditMap();
  return orders.map((order) => {
    const audit = map[order.id];
    if (!audit) return order;
    return {
      ...order,
      deliveredBy: order.deliveredBy || audit.deliveredBy,
      deliveredById: order.deliveredById || audit.deliveredById,
      deliveredAt: order.deliveredAt || audit.deliveredAt,
    };
  });
};
