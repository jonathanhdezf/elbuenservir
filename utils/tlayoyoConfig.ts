export type TlayoyoSalsa = 'Verde' | 'Roja' | 'Chipotle';
export type TlayoyoSalsaMode = 'con' | 'aparte' | 'sin';
export type TlayoyoCheeseMode = 'Con queso' | 'Queso aparte' | 'Sin queso';

export interface TlayoyoSelection {
  salsas: TlayoyoSalsa[];
  salsaMode: TlayoyoSalsaMode;
  cheese: TlayoyoCheeseMode;
}

export interface TlayoyoDraft {
  variationId?: string;
  ingredients?: string[];
  salsas: TlayoyoSalsa[];
  salsaMode: TlayoyoSalsaMode | null;
  cheese: TlayoyoCheeseMode | null;
}

export const TLAYOYO_SALSAS: TlayoyoSalsa[] = ['Verde', 'Roja', 'Chipotle'];
export const TLAYOYO_CHEESE_OPTIONS: TlayoyoCheeseMode[] = ['Con queso', 'Queso aparte', 'Sin queso'];

export const DEFAULT_TLAYOYO_SELECTION: TlayoyoSelection = {
  salsas: ['Verde'],
  salsaMode: 'con',
  cheese: 'Con queso',
};

export const EMPTY_TLAYOYO_DRAFT: TlayoyoDraft = {
  ingredients: [],
  salsas: [],
  salsaMode: null,
  cheese: null,
};

export const isTlayoyoDish = (item: { id: string; name: string }): boolean =>
  item.id === 'm-tlayoyos-salsa' || item.name.toLowerCase().includes('tlayoyo');

export const toggleTlayoyoDraftSalsa = (
  current: TlayoyoDraft | undefined,
  salsa: TlayoyoSalsa
): TlayoyoDraft => {
  const base = current || EMPTY_TLAYOYO_DRAFT;
  if (base.salsaMode === 'sin' || base.salsaMode === null) {
    return { ...base, salsaMode: 'con', salsas: [salsa] };
  }
  const exists = base.salsas.includes(salsa);
  const nextSalsas = exists
    ? base.salsas.filter((s) => s !== salsa)
    : [...base.salsas, salsa];

  if (nextSalsas.length === 0 && base.salsaMode === 'con') {
    return { ...base, salsaMode: null, salsas: [] };
  }
  return { ...base, salsas: nextSalsas };
};

export const toggleTlayoyoDraftSalsaAparte = (
  current: TlayoyoDraft | undefined
): TlayoyoDraft => {
  const base = current || EMPTY_TLAYOYO_DRAFT;
  if (base.salsaMode === 'aparte') {
    return {
      ...base,
      salsaMode: base.salsas.length > 0 ? 'con' : null,
    };
  }
  return {
    ...base,
    salsaMode: 'aparte',
  };
};

export const toggleTlayoyoDraftSinSalsa = (
  current: TlayoyoDraft | undefined
): TlayoyoDraft => {
  const base = current || EMPTY_TLAYOYO_DRAFT;
  if (base.salsaMode === 'sin') {
    return {
      ...base,
      salsaMode: null,
      salsas: [],
    };
  }
  return {
    ...base,
    salsaMode: 'sin',
    salsas: [],
  };
};

export const toggleTlayoyoDraftCheese = (
  current: TlayoyoDraft | undefined,
  cheese: TlayoyoCheeseMode
): TlayoyoDraft => {
  const base = current || EMPTY_TLAYOYO_DRAFT;
  return {
    ...base,
    cheese: base.cheese === cheese ? null : cheese,
  };
};

export const toggleTlayoyoSalsa = (
  current: TlayoyoSelection | undefined,
  salsa: TlayoyoSalsa
): TlayoyoSelection => {
  const base = current || DEFAULT_TLAYOYO_SELECTION;
  if (base.salsaMode === 'sin') {
    return { ...base, salsaMode: 'con', salsas: [salsa] };
  }
  const exists = base.salsas.includes(salsa);
  const nextSalsas = exists
    ? base.salsas.filter((s) => s !== salsa)
    : [...base.salsas, salsa];

  if (nextSalsas.length === 0 && base.salsaMode === 'con') {
    return { ...base, salsaMode: 'sin', salsas: [] };
  }
  return { ...base, salsas: nextSalsas };
};

export const toggleTlayoyoSalsaAparte = (
  current: TlayoyoSelection | undefined
): TlayoyoSelection => {
  const base = current || DEFAULT_TLAYOYO_SELECTION;
  if (base.salsaMode === 'aparte') {
    return {
      ...base,
      salsaMode: base.salsas.length > 0 ? 'con' : 'sin',
    };
  }
  return {
    ...base,
    salsaMode: 'aparte',
  };
};

export const setTlayoyoSinSalsa = (
  current: TlayoyoSelection | undefined
): TlayoyoSelection => {
  const base = current || DEFAULT_TLAYOYO_SELECTION;
  return {
    ...base,
    salsaMode: 'sin',
    salsas: [],
  };
};

export const formatTlayoyoVariationLabel = (sel?: {
  salsas?: TlayoyoSalsa[];
  salsaMode?: TlayoyoSalsaMode | null;
  cheese?: TlayoyoCheeseMode | null;
}): string => {
  const s: TlayoyoSelection = {
    salsas: sel?.salsas ?? DEFAULT_TLAYOYO_SELECTION.salsas,
    salsaMode: sel?.salsaMode ?? DEFAULT_TLAYOYO_SELECTION.salsaMode,
    cheese: sel?.cheese ?? DEFAULT_TLAYOYO_SELECTION.cheese,
  };
  let salsaPart = 'Sin salsa';

  if (s.salsaMode !== 'sin') {
    const picked = s.salsas && s.salsas.length > 0 ? s.salsas : [];
    if (picked.length > 0) {
      const list =
        picked.length === 1
          ? picked[0]
          : picked.length === 2
          ? `${picked[0]} y ${picked[1]}`
          : `${picked[0]}, ${picked[1]} y ${picked[2]}`;
      salsaPart = s.salsaMode === 'aparte' ? `Salsa ${list} (aparte)` : `Salsa ${list}`;
    } else if (s.salsaMode === 'aparte') {
      salsaPart = 'Salsa aparte';
    }
  }

  return `${salsaPart} · ${s.cheese}`;
};

export const TLAYOYO_RELLENO_INGREDIENTS: string[] = [
  'Pollo',
  'Chicharrón',
  'Longaniza',
  'Champiñón',
  'Queso de hebra',
  'Bistec',
  'Salchicha',
];

export const TLAYOYO_RELLENO_PRICE_1 = 20;
export const TLAYOYO_RELLENO_PRICE_2 = 25;

export const isTlayoyoRellenoDish = (item: { id?: string; name?: string }): boolean => {
  const n = (item.name || '').toLowerCase();
  return item.id === 'item-1795824048202' || (n.includes('tlayoyo') && n.includes('relleno'));
};

export const getTlayoyoRellenoIngredients = (item: {
  variations?: { id: string; label: string; price: number }[];
}): string[] => {
  const ignored = new Set(['sencillo', 'por pieza', '1 ingrediente', '2 ingredientes', 'platillo']);
  const fromVars = (item.variations || [])
    .map((v) => v.label.trim())
    .filter((label) => label && !ignored.has(label.toLowerCase()));
  return fromVars.length > 0 ? fromVars : TLAYOYO_RELLENO_INGREDIENTS;
};

export const toggleTlayoyoRellenoIngredient = (
  current: string[] | undefined,
  ingredient: string,
  maxIngredients: number = 2
): string[] => {
  const list = Array.isArray(current) ? current : [];
  if (list.includes(ingredient)) {
    return list.filter((i) => i !== ingredient);
  }
  if (list.length >= maxIngredients) {
    return [...list.slice(1), ingredient];
  }
  return [...list, ingredient];
};

export const getTlayoyoRellenoPrice = (
  item: { variations?: { id: string; label: string; price: number }[] },
  selectedIngredients: string[]
): number => {
  const count = selectedIngredients.length;
  const matchedPrices = selectedIngredients
    .map((ing) => item.variations?.find((v) => v.label.toLowerCase() === ing.toLowerCase())?.price || 0)
    .filter((p) => p > 0);
  const baseSingle =
    matchedPrices.length > 0
      ? Math.max(...matchedPrices)
      : (() => {
          const validVarPrice = item.variations?.find((v) => v.price > 0)?.price;
          return validVarPrice && validVarPrice > 0 ? validVarPrice : TLAYOYO_RELLENO_PRICE_1;
        })();

  if (count >= 2) {
    return baseSingle === TLAYOYO_RELLENO_PRICE_1 ? TLAYOYO_RELLENO_PRICE_2 : baseSingle + 5;
  }
  return baseSingle;
};

export const formatTlayoyoRellenoLabel = (selectedIngredients: string[]): string => {
  if (selectedIngredients.length === 0) return 'Sin relleno';
  if (selectedIngredients.length === 1) return `${selectedIngredients[0]} (1 ing.)`;
  return `${selectedIngredients.slice(0, 2).join(' + ')} (2 ing.)`;
};

