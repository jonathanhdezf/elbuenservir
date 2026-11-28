import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Plus,
  ChevronDown,
  UtensilsCrossed,
  SlidersHorizontal,
  Utensils,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  X,
  RotateCcw
} from 'lucide-react';
import { Category, MenuItem, PricingVariation } from '../types';
import {
  getDefaultAccompanimentLabels,
  getAccompanimentIcon,
  getDishSidesList,
  SALSAS_Y_QUESO_ACCOMPANIMENTS
} from '../utils/menuOptions';

interface MenuItemCardProps {
  item: MenuItem;
  categories?: Category[];
  defaultSideOptions?: string[];
  onUpdate: (item: MenuItem) => void;
  onDelete: () => void;
  isReordering?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  defaultExpanded?: boolean;
  expandSignal?: { expanded: boolean; nonce: number } | null;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  categories = [],
  defaultSideOptions = [],
  onUpdate,
  onDelete,
  isReordering = false,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  defaultExpanded = false,
  expandSignal = null
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (defaultExpanded) return true;
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [newAccompanimentInput, setNewAccompanimentInput] = useState('');
  const [newSideInput, setNewSideInput] = useState('');

  useEffect(() => {
    if (defaultExpanded) {
      setIsExpanded(true);
    }
  }, [defaultExpanded]);

  useEffect(() => {
    if (expandSignal) {
      setIsExpanded(expandSignal.expanded);
    }
  }, [expandSignal]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...item, name: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ ...item, categoryId: e.target.value });
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ ...item, description: e.target.value });
  };

  const toggleActive = () => {
    onUpdate({ ...item, isActive: !item.isActive });
  };

  const addVariation = () => {
    const newVariation: PricingVariation = {
      id: `v-${Date.now()}`,
      label: '',
      price: 0
    };
    onUpdate({ ...item, variations: [...item.variations, newVariation] });
  };

  const updateVariation = (index: number, field: keyof PricingVariation, value: string | number) => {
    const newVariations = [...item.variations];
    newVariations[index] = { ...newVariations[index], [field]: value };
    onUpdate({ ...item, variations: newVariations });
  };

  const removeVariation = (index: number) => {
    if (item.variations.length > 1) {
      const newVariations = item.variations.filter((_, i) => i !== index);
      onUpdate({ ...item, variations: newVariations });
    }
  };

  const isAccompanimentsEnabled =
    item.allowAccompaniments !== undefined
      ? item.allowAccompaniments
      : item.categoryId === 'cat-caldos' ||
        item.name.toLowerCase().includes('pozole') ||
        item.name.toLowerCase().includes('pancita') ||
        item.name.toLowerCase().includes('caldo') ||
        item.name.toLowerCase().includes('chilpozo');

  const isSidesEnabled =
    item.allowSides !== undefined
      ? item.allowSides
      : !item.description?.toLowerCase().includes('sin guarnición') &&
        item.categoryId !== 'cat-1' &&
        item.categoryId !== 'cat-2' &&
        item.categoryId !== 'cat-5' &&
        item.categoryId !== 'cat-caldos' &&
        !item.name.toLowerCase().includes('pozole') &&
        !item.name.toLowerCase().includes('pancita');

  const toggleAccompaniments = () => {
    onUpdate({ ...item, allowAccompaniments: !isAccompanimentsEnabled });
  };

  const toggleSides = () => {
    onUpdate({ ...item, allowSides: !isSidesEnabled });
  };

  const defaultAccompaniments = getDefaultAccompanimentLabels(item);
  const currentAccompaniments =
    item.customAccompaniments !== undefined ? item.customAccompaniments : defaultAccompaniments;
  const currentSides = getDishSidesList(item, defaultSideOptions);

  const handleAddAccompaniment = (labelOverride?: string) => {
    const trimmed = (labelOverride ?? newAccompanimentInput).trim();
    if (!trimmed) return;
    if (currentAccompaniments.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      if (!labelOverride) setNewAccompanimentInput('');
      return;
    }
    onUpdate({ ...item, customAccompaniments: [...currentAccompaniments, trimmed] });
    if (!labelOverride) setNewAccompanimentInput('');
  };

  const handleRemoveAccompaniment = (index: number) => {
    const next = currentAccompaniments.filter((_, i) => i !== index);
    onUpdate({ ...item, customAccompaniments: next });
  };

  const handleResetAccompaniments = () => {
    onUpdate({ ...item, customAccompaniments: undefined });
  };

  const handleAddSide = (labelOverride?: string) => {
    const trimmed = (labelOverride ?? newSideInput).trim();
    if (!trimmed) return;
    if (currentSides.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      if (!labelOverride) setNewSideInput('');
      return;
    }
    onUpdate({ ...item, customSides: [...currentSides, trimmed] });
    if (!labelOverride) setNewSideInput('');
  };

  const handleRemoveSide = (index: number) => {
    const next = currentSides.filter((_, i) => i !== index);
    onUpdate({ ...item, customSides: next });
  };

  const handleResetSides = () => {
    onUpdate({ ...item, customSides: undefined });
  };

  const prices = item.variations.map((v) => Number(v.price) || 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const priceSummary =
    prices.length <= 1 || minPrice === maxPrice
      ? `$${minPrice.toFixed(0)}`
      : `$${minPrice.toFixed(0)} – $${maxPrice.toFixed(0)}`;

  const variationSummary =
    item.variations.length === 1
      ? item.variations[0].label || '1 presentación'
      : `${item.variations.length} presentaciones`;

  const categoryName = categories.find((c) => c.id === item.categoryId)?.name;

  const showEditorBody = !isReordering && isExpanded;

  return (
    <article
      className={`
        bg-white dark:bg-[#1a1118] rounded-[24px] sm:rounded-[28px] border transition-all duration-200 overflow-hidden
        ${isReordering
          ? 'border-primary-300/80 dark:border-primary-700/50 shadow-sm'
          : 'border-gray-200/80 dark:border-white/10 shadow-[0_2px_12px_rgba(17,10,16,0.04)] hover:border-gray-300 dark:hover:border-white/20'
        }
        ${!item.isActive ? 'opacity-75' : ''}
      `}
    >
      {/* Android-native Material-3 Card Header Row */}
      <div className="px-4 py-3.5 sm:px-6 sm:py-4 flex items-center gap-3 sm:gap-4 min-h-[72px]">
        {/* Reorder Arrows (only when organizing, safely inside card bounds) */}
        {isReordering ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              title="Mover arriba"
              aria-label={`Mover ${item.name} arriba`}
              className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-primary-50 dark:hover:bg-primary-950/40 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              title="Mover abajo"
              aria-label={`Mover ${item.name} abajo`}
              className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-primary-50 dark:hover:bg-primary-950/40 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label={isExpanded ? `Contraer ${item.name}` : `Editar ${item.name}`}
            className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
              item.isActive
                ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400'
                : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500'
            }`}
          >
            <UtensilsCrossed className="w-5 h-5" />
          </button>
        )}

        {/* Dish Title & Unboxed Price Summary */}
        <button
          type="button"
          onClick={() => !isReordering && setIsExpanded((prev) => !prev)}
          className={`flex-1 min-w-0 text-left outline-none py-1 ${
            isReordering ? 'cursor-default' : 'cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight truncate">
              {item.name.trim() || 'Platillo sin nombre'}
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium tabular-nums truncate mt-0.5">
            <span className="font-bold text-gray-900 dark:text-gray-200">{priceSummary}</span>
            <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
            <span>{variationSummary}</span>
            {categoryName && (
              <>
                <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
                <span className="text-primary-600 dark:text-primary-400 font-semibold">{categoryName}</span>
              </>
            )}
            {!item.isActive && (
              <>
                <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">Oculto</span>
              </>
            )}
          </p>
        </button>

        {/* Material-3 Visibility Switch + Expand Chevron */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-semibold text-gray-500 dark:text-gray-400">
              {item.isActive ? 'Visible' : 'Oculto'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={item.isActive}
              aria-label={item.isActive ? `Ocultar ${item.name} del menú` : `Mostrar ${item.name} en el menú`}
              onClick={toggleActive}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <span
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${
                  item.isActive ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    item.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </span>
            </button>
          </div>

          {!isReordering && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Contraer detalles del platillo' : 'Expandir detalles del platillo'}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Editor Body */}
      {showEditorBody && (
        <div className="px-4 pb-5 pt-4 sm:px-6 sm:pb-6 border-t border-gray-100 dark:border-white/5 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Core Dish Details & Order Options */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                  Nombre del platillo
                </label>
                <input
                  className="w-full min-h-[48px] bg-[#FDFBFC] dark:bg-[#110a10] border border-gray-200/90 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 px-4 py-2.5 text-base font-semibold text-gray-900 dark:text-white transition-all outline-none"
                  type="text"
                  value={item.name}
                  onChange={handleNameChange}
                  placeholder="Ej. Tlayoyo de Frijol Negro"
                />
              </div>

              {categories.length > 0 && (
                <div>
                  <label
                    htmlFor={`category-select-${item.id}`}
                    className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1"
                  >
                    Categoría
                  </label>
                  <select
                    id={`category-select-${item.id}`}
                    value={item.categoryId}
                    onChange={handleCategoryChange}
                    className="w-full min-h-[48px] bg-[#FDFBFC] dark:bg-[#110a10] border border-gray-200/90 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white transition-all outline-none cursor-pointer"
                  >
                    {!categories.some((c) => c.id === item.categoryId) && (
                      <option value={item.categoryId}>Sin categoría</option>
                    )}
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                  Descripción e ingredientes
                </label>
                <textarea
                  className="w-full bg-[#FDFBFC] dark:bg-[#110a10] border border-gray-200/90 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 transition-all outline-none resize-none leading-relaxed"
                  rows={2}
                  value={item.description}
                  onChange={handleDescChange}
                  placeholder="Describe el platillo, ingredientes o modo de preparación..."
                />
              </div>

              {/* Order Customization Switches */}
              <div className="pt-1 space-y-2">
                <span className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                  Opciones al ordenar
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isAccompanimentsEnabled}
                    onClick={toggleAccompaniments}
                    className={`min-h-[56px] px-3.5 py-2.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer select-none active:scale-[0.98] ${
                      isAccompanimentsEnabled
                        ? 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-300/70 dark:border-amber-700/40 text-amber-950 dark:text-amber-100'
                        : 'bg-[#FDFBFC] dark:bg-[#110a10] border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${
                          isAccompanimentsEnabled
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                        }`}
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">Acompañamientos</p>
                        <p className="text-[11px] opacity-75 truncate">
                          {isAccompanimentsEnabled
                            ? `${currentAccompaniments.length} ${currentAccompaniments.length === 1 ? 'opción' : 'opciones'}${item.customAccompaniments !== undefined ? ' · Editado' : ''}`
                            : 'Desactivado'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
                        isAccompanimentsEnabled ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          isAccompanimentsEnabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </span>
                  </button>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={isSidesEnabled}
                    onClick={toggleSides}
                    className={`min-h-[56px] px-3.5 py-2.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer select-none active:scale-[0.98] ${
                      isSidesEnabled
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-300/70 dark:border-emerald-700/40 text-emerald-950 dark:text-emerald-100'
                        : 'bg-[#FDFBFC] dark:bg-[#110a10] border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${
                          isSidesEnabled
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                        }`}
                      >
                        <Utensils className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">Guarniciones</p>
                        <p className="text-[11px] opacity-75 truncate">
                          {isSidesEnabled
                            ? `${currentSides.length} ${currentSides.length === 1 ? 'opción' : 'opciones'}${item.customSides !== undefined ? ' · Editado' : ''}`
                            : 'Sin guarnición'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
                        isSidesEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          isSidesEnabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </span>
                  </button>
                </div>

                {/* Editor de Acompañamientos */}
                {isAccompanimentsEnabled && (
                  <div className="rounded-2xl border border-amber-200/80 dark:border-amber-800/40 bg-amber-50/40 dark:bg-amber-950/15 p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                        Editar acompañamientos ({currentAccompaniments.length})
                      </span>
                      {item.customAccompaniments !== undefined && (
                        <button
                          type="button"
                          onClick={handleResetAccompaniments}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
                          title="Volver a los acompañamientos sugeridos"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restablecer</span>
                        </button>
                      )}
                    </div>

                    {/* Plantillas Rápidas (Salsas y Queso como los platillos tradicionales) */}
                    <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
                      <span className="text-[10px] font-bold text-amber-900/70 dark:text-amber-400 mr-1">
                        Cargar plantilla:
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdate({ ...item, customAccompaniments: [...SALSAS_Y_QUESO_ACCOMPANIMENTS] })}
                        className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white dark:bg-[#110a10] hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                      >
                        <span>🟢🧀</span>
                        <span>Salsas y queso</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdate({ ...item, customAccompaniments: ['Sin cebolla', 'Sin rábanos', 'Sin aguacate', 'Sin orégano', 'Sin picante', 'Limón aparte'] })}
                        className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white dark:bg-[#110a10] hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                      >
                        <span>🍲</span>
                        <span>Caldos / Pozole</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdate({ ...item, customAccompaniments: ['Sin cebolla', 'Sin aguacate', 'Sin picante', 'Salsa aparte'] })}
                        className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white dark:bg-[#110a10] hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                      >
                        <span>🥑</span>
                        <span>Básico</span>
                      </button>
                    </div>

                    {currentAccompaniments.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {currentAccompaniments.map((acc, idx) => (
                          <span
                            key={`${acc}-${idx}`}
                            className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-[#110a10] border border-amber-200 dark:border-amber-800/50 text-gray-800 dark:text-gray-200 shadow-xs"
                          >
                            <span>{getAccompanimentIcon(acc)}</span>
                            <span>{acc}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAccompaniment(idx)}
                              aria-label={`Quitar ${acc}`}
                              title={`Quitar ${acc}`}
                              className="w-5 h-5 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 italic">
                        Sin opciones rápidas configuradas. Agrega al menos una abajo o deja que el cliente escriba notas.
                      </p>
                    )}

                    {item.customAccompaniments !== undefined &&
                      defaultAccompaniments.some(
                        (def) => !currentAccompaniments.some((c) => c.toLowerCase() === def.toLowerCase())
                      ) && (
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mr-1">
                            Sugeridos:
                          </span>
                          {defaultAccompaniments
                            .filter(
                              (def) => !currentAccompaniments.some((c) => c.toLowerCase() === def.toLowerCase())
                            )
                            .map((def) => (
                              <button
                                key={def}
                                type="button"
                                onClick={() => handleAddAccompaniment(def)}
                                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/70 dark:bg-white/5 border border-dashed border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100/70 dark:hover:bg-amber-900/30 transition-colors cursor-pointer"
                              >
                                + {def}
                              </button>
                            ))}
                        </div>
                      )}

                    <div className="flex items-center gap-2 pt-0.5">
                      <input
                        type="text"
                        value={newAccompanimentInput}
                        onChange={(e) => setNewAccompanimentInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddAccompaniment();
                          }
                        }}
                        placeholder="Nuevo acompañamiento (ej. Crema aparte, Salsa habanero...)"
                        className="flex-1 min-w-0 min-h-[38px] px-3 py-1.5 rounded-xl bg-white dark:bg-[#110a10] border border-amber-200/90 dark:border-amber-800/50 text-xs font-medium text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddAccompaniment()}
                        disabled={!newAccompanimentInput.trim()}
                        className="min-h-[38px] px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold inline-flex items-center gap-1 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Editor de Guarniciones */}
                {isSidesEnabled && (
                  <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/15 p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        Editar guarniciones ({currentSides.length})
                      </span>
                      {item.customSides !== undefined && (
                        <button
                          type="button"
                          onClick={handleResetSides}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                          title="Volver a las guarniciones del catálogo"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restablecer</span>
                        </button>
                      )}
                    </div>

                    {currentSides.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {currentSides.map((side, idx) => (
                          <span
                            key={`${side}-${idx}`}
                            className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-[#110a10] border border-emerald-200 dark:border-emerald-800/50 text-gray-800 dark:text-gray-200 shadow-xs"
                          >
                            <span>{side}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSide(idx)}
                              aria-label={`Quitar ${side}`}
                              title={`Quitar ${side}`}
                              className="w-5 h-5 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 italic">
                        Sin guarniciones seleccionables. Agrega guarniciones abajo o restablece las del catálogo.
                      </p>
                    )}

                    {defaultSideOptions.some(
                      (def) => !currentSides.some((s) => s.toLowerCase() === def.toLowerCase())
                    ) && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mr-1">
                          Del catálogo:
                        </span>
                        {defaultSideOptions
                          .filter(
                            (def) => !currentSides.some((s) => s.toLowerCase() === def.toLowerCase())
                          )
                          .map((def) => (
                            <button
                              key={def}
                              type="button"
                              onClick={() => handleAddSide(def)}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/70 dark:bg-white/5 border border-dashed border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"
                            >
                              + {def}
                            </button>
                          ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-0.5">
                      <input
                        type="text"
                        value={newSideInput}
                        onChange={(e) => setNewSideInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSide();
                          }
                        }}
                        placeholder="Nueva guarnición (ej. Puré de papa, Ensalada...)"
                        className="flex-1 min-w-0 min-h-[38px] px-3 py-1.5 rounded-xl bg-white dark:bg-[#110a10] border border-emerald-200/90 dark:border-emerald-800/50 text-xs font-medium text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSide()}
                        disabled={!newSideInput.trim()}
                        className="min-h-[38px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Pricing Variations */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Precios y presentaciones
                </label>
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tabular-nums">
                  {item.variations.length} {item.variations.length === 1 ? 'opción' : 'opciones'}
                </span>
              </div>

              <div className="space-y-2.5 flex-1">
                {item.variations.map((v, idx) => (
                  <div key={v.id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <input
                        className="w-full min-h-[46px] bg-[#FDFBFC] dark:bg-[#110a10] border border-gray-200/90 dark:border-white/10 rounded-xl text-sm font-medium px-3.5 py-2 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                        placeholder="Ej. Sencillo, Orden de 3..."
                        type="text"
                        value={v.label}
                        onChange={(e) => updateVariation(idx, 'label', e.target.value)}
                      />
                    </div>
                    <div className="relative w-28 sm:w-32 shrink-0">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold pointer-events-none">
                        $
                      </span>
                      <input
                        className="w-full min-h-[46px] bg-[#FDFBFC] dark:bg-[#110a10] border border-gray-200/90 dark:border-white/10 rounded-xl text-sm pl-7 pr-3 py-2 text-gray-900 dark:text-white font-bold text-right tabular-nums focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                        type="number"
                        step="0.50"
                        min="0"
                        aria-label={`Precio de ${v.label || 'presentación'}`}
                        value={v.price}
                        onChange={(e) => updateVariation(idx, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariation(idx)}
                      disabled={item.variations.length <= 1}
                      title="Eliminar presentación"
                      aria-label="Eliminar presentación"
                      className="w-11 h-11 shrink-0 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addVariation}
                  className="w-full min-h-[44px] border border-dashed border-primary-300 dark:border-primary-800/60 hover:border-primary-500 bg-primary-50/40 dark:bg-primary-950/20 hover:bg-primary-50 dark:hover:bg-primary-950/40 text-primary-600 dark:text-primary-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-[0.99]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar presentación</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card Footer: Safe Inline Delete Confirmation */}
          <div className="pt-3.5 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {item.isActive ? 'Visible en el menú digital y TPV' : 'Oculto temporalmente del menú'}
            </span>

            {confirmingDelete ? (
              <div className="flex items-center gap-2 ml-auto">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 mr-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  ¿Eliminar platillo?
                </span>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="px-3.5 min-h-[40px] rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingDelete(false);
                    onDelete();
                  }}
                  className="px-4 min-h-[40px] rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="inline-flex items-center gap-1.5 px-3.5 min-h-[44px] rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer ml-auto"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar platillo</span>
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
};

export default MenuItemCard;
