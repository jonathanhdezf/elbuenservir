import React from 'react';
import { Plus, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Category, TabId } from '../types';

interface CategoryTabsProps {
  activeTab: TabId;
  setActiveTab: (id: TabId) => void;
  categories: Category[];
  categoryCounts?: Record<string, number>;
  onAddCategory?: () => void;
  isReordering?: boolean;
  onMoveCategory?: (index: number, direction: 'left' | 'right') => void;
  onDeleteCategory?: (id: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeTab,
  setActiveTab,
  categories,
  categoryCounts,
  onAddCategory,
  isReordering = false,
  onMoveCategory,
  onDeleteCategory
}) => {
  return (
    <div
      className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-hide no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0"
      role="tablist"
      aria-label="Categorías del menú"
    >
      {categories.map((cat, index) => {
        const isActive = activeTab === cat.id;
        const count = categoryCounts?.[cat.id];

        return (
          <div
            key={cat.id}
            className={`
              shrink-0 flex items-center gap-1.5 rounded-2xl border transition-all duration-200 select-none min-h-[44px]
              ${isActive
                ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20'
                : 'bg-white dark:bg-[#1a1118] text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-white/10 hover:border-primary-300 dark:hover:border-primary-500/40'
              }
              ${isReordering ? 'pl-3.5 pr-1.5 py-1' : 'px-4 py-2'}
            `}
          >
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => !isReordering && setActiveTab(cat.id)}
              className={`flex items-center gap-2 whitespace-nowrap text-sm font-semibold tracking-tight outline-none min-h-[36px] ${
                isReordering ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <span>{cat.name}</span>
              {typeof count === 'number' && !isReordering && (
                <span
                  className={`text-xs font-bold tabular-nums ${
                    isActive ? 'text-white/85' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>

            {isReordering && (
              <div
                className={`flex items-center gap-0.5 rounded-xl p-0.5 ml-1 ${
                  isActive
                    ? 'bg-black/15 text-white'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveCategory?.(index, 'left');
                  }}
                  disabled={index === 0}
                  title="Mover a la izquierda"
                  aria-label={`Mover ${cat.name} a la izquierda`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveCategory?.(index, 'right');
                  }}
                  disabled={index === categories.length - 1}
                  title="Mover a la derecha"
                  aria-label={`Mover ${cat.name} a la derecha`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {onDeleteCategory && categories.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCategory(cat.id);
                    }}
                    title={`Eliminar categoría ${cat.name}`}
                    aria-label={`Eliminar categoría ${cat.name}`}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors ${
                      isActive
                        ? 'text-white/90 hover:bg-red-600'
                        : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!isReordering && onAddCategory && (
        <button
          type="button"
          title="Agregar nueva categoría"
          onClick={onAddCategory}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 min-h-[44px] bg-white dark:bg-[#1a1118] text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 border border-dashed border-primary-300 dark:border-primary-800/70 rounded-2xl text-xs font-bold tracking-wide transition-all cursor-pointer active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Categoría</span>
        </button>
      )}
    </div>
  );
};

export default CategoryTabs;
