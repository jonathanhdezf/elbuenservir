import { MenuItem } from '../types';

export interface AccompanimentOption {
  id: string;
  label: string;
  icon: string;
}

const ITEM_OPTIONS_STORAGE_KEY = 'tlayoyos3marias_item_options_v1';

export interface StoredDishOptions {
  customAccompaniments?: string[];
  customSides?: string[];
}

export const getAccompanimentIcon = (label: string): string => {
  const l = label.toLowerCase();
  if (l.includes('verde')) return '🟢';
  if (l.includes('roja')) return '🔴';
  if (l.includes('chipotle')) return '🌶️';
  if (l.includes('queso')) return '🧀';
  if (l.includes('cebolla')) return '🧅';
  if (l.includes('rábano') || l.includes('rabano')) return '🔴';
  if (l.includes('aguacate')) return '🥑';
  if (l.includes('orégano') || l.includes('oregano')) return '🌿';
  if (l.includes('limón') || l.includes('limon')) return '🍋';
  if (l.includes('chile') || l.includes('picante')) return '🌶️';
  if (l.includes('aparte')) return '🥣';
  if (l.startsWith('sin ')) return '🚫';
  return '✨';
};

export const SALSAS_Y_QUESO_ACCOMPANIMENTS: string[] = [
  'Salsa Verde',
  'Salsa Roja',
  'Salsa Chipotle',
  'Salsa aparte',
  'Sin salsa',
  'Con queso',
  'Queso aparte',
  'Sin queso',
];

export const getDefaultAccompanimentLabels = (item: { name: string; categoryId?: string }): string[] => {
  const n = (item.name || '').toLowerCase();
  const c = (item.categoryId || '').toLowerCase();
  const isPozole = n.includes('pozole');
  const isPancita = n.includes('pancita') || n.includes('menudo');
  const isCaldo = isPozole || isPancita || n.includes('chilpozo') || n.includes('caldo') || c.includes('caldo');

  if (isPozole) {
    return [
      'Sin cebolla',
      'Sin rábanos',
      'Sin aguacate',
      'Sin orégano',
      'Sin picante',
      'Limón aparte',
    ];
  }

  if (isPancita) {
    return [
      'Sin cebolla',
      'Sin rábanos',
      'Sin aguacate',
      'Sin orégano',
      'Sin chile picado',
      'Limón aparte',
    ];
  }

  if (isCaldo) {
    return [
      'Sin cebolla',
      'Sin aguacate',
      'Sin rábanos',
      'Sin picante',
      'Limón aparte',
    ];
  }

  // Platillos con salsas y queso por defecto (tlayoyos, antojitos, nuevos platillos, etc.)
  return [...SALSAS_Y_QUESO_ACCOMPANIMENTS];
};

export const getAccompanimentOptions = (item: {
  name: string;
  categoryId?: string;
  customAccompaniments?: string[];
}): AccompanimentOption[] => {
  const labels =
    Array.isArray(item.customAccompaniments)
      ? item.customAccompaniments
      : getDefaultAccompanimentLabels(item);

  return labels.map((label, idx) => ({
    id: `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${idx}`,
    label,
    icon: getAccompanimentIcon(label),
  }));
};

export interface AccompanimentGroup {
  id: string;
  title: string;
  options: AccompanimentOption[];
}

export const getGroupedAccompanimentOptions = (item: {
  name: string;
  categoryId?: string;
  customAccompaniments?: string[];
}): AccompanimentGroup[] => {
  const options = getAccompanimentOptions(item);
  if (options.length === 0) return [];

  const n = (item.name || '').toLowerCase();
  const hasQueso = options.some((o) => o.label.toLowerCase().includes('queso'));
  const hasSalsa = options.some((o) => o.label.toLowerCase().includes('salsa'));

  if (n.includes('tlayoyo') || (hasSalsa && hasQueso)) {
    const salsas = options.filter((o) => o.label.toLowerCase().includes('salsa'));
    const queso = options.filter(
      (o) => o.label.toLowerCase().includes('queso') && !o.label.toLowerCase().includes('salsa')
    );
    const otros = options.filter(
      (o) => !salsas.includes(o) && !queso.includes(o)
    );

    return [
      ...(salsas.length > 0 ? [{ id: 'salsas', title: 'Salsas', options: salsas }] : []),
      ...(queso.length > 0 ? [{ id: 'queso', title: 'Queso', options: queso }] : []),
      ...(otros.length > 0 ? [{ id: 'otros', title: 'Otros', options: otros }] : []),
    ];
  }

  const sinIngrediente = options.filter((o) => o.label.trim().toLowerCase().startsWith('sin '));
  const aparteYExtras = options.filter((o) => !sinIngrediente.includes(o));

  return [
    ...(sinIngrediente.length > 0
      ? [{ id: 'sin-ingrediente', title: 'Sin ingrediente', options: sinIngrediente }]
      : []),
    ...(aparteYExtras.length > 0
      ? [{ id: 'aparte-extras', title: 'Aparte y extras', options: aparteYExtras }]
      : []),
  ];
};

export const getDishSidesList = (
  item: { customSides?: string[] },
  defaultSideNames: string[]
): string[] => {
  if (Array.isArray(item.customSides)) {
    return item.customSides;
  }
  return defaultSideNames;
};

export const loadSavedMenuItemOptions = (): Record<string, StoredDishOptions> => {
  try {
    const raw = localStorage.getItem(ITEM_OPTIONS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export const saveMenuItemOptions = (items: MenuItem[]) => {
  try {
    const map: Record<string, StoredDishOptions> = {};
    items.forEach((item) => {
      if (item.customAccompaniments !== undefined || item.customSides !== undefined) {
        map[item.id] = {
          ...(item.customAccompaniments !== undefined ? { customAccompaniments: item.customAccompaniments } : {}),
          ...(item.customSides !== undefined ? { customSides: item.customSides } : {}),
        };
      }
    });
    localStorage.setItem(ITEM_OPTIONS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
};

export const mergeSavedMenuItemOptions = (items: MenuItem[]): MenuItem[] => {
  const saved = loadSavedMenuItemOptions();
  return items.map((item) => {
    const custom = saved[item.id];
    if (!custom) return item;
    return {
      ...item,
      ...(custom.customAccompaniments !== undefined ? { customAccompaniments: custom.customAccompaniments } : {}),
      ...(custom.customSides !== undefined ? { customSides: custom.customSides } : {}),
    };
  });
};
