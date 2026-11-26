export type TlayoyoSalsa = 'Verde' | 'Roja' | 'Chipotle';
export type TlayoyoSalsaMode = 'con' | 'aparte' | 'sin';
export type TlayoyoCheeseMode = 'Con queso' | 'Queso aparte' | 'Sin queso';

export interface TlayoyoSelection {
  salsas: TlayoyoSalsa[];
  salsaMode: TlayoyoSalsaMode;
  cheese: TlayoyoCheeseMode;
}

export const TLAYOYO_SALSAS: TlayoyoSalsa[] = ['Verde', 'Roja', 'Chipotle'];
export const TLAYOYO_CHEESE_OPTIONS: TlayoyoCheeseMode[] = ['Con queso', 'Queso aparte', 'Sin queso'];

export const DEFAULT_TLAYOYO_SELECTION: TlayoyoSelection = {
  salsas: ['Verde'],
  salsaMode: 'con',
  cheese: 'Con queso',
};

export const isTlayoyoDish = (item: { id: string; name: string }): boolean =>
  item.id === 'm-tlayoyos-salsa' || item.name.toLowerCase().includes('tlayoyo');

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

export const formatTlayoyoVariationLabel = (sel?: Partial<TlayoyoSelection>): string => {
  const s: TlayoyoSelection = { ...DEFAULT_TLAYOYO_SELECTION, ...sel };
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
