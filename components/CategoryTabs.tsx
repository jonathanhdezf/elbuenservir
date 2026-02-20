
import React from 'react';
import { Plus, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Category, TabId } from '../types';

interface CategoryTabsProps {
  activeTab: TabId;
  setActiveTab: (id: TabId) => void;
  categories: Category[];
  onAddCategory: () => void;
  isReordering?: boolean;
  onMoveCategory?: (index: number, direction: 'left' | 'right') => void;
  onDeleteCategory?: (id: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeTab,
  setActiveTab,
  categories,
  onAddCategory,
  isReordering = false,
  onMoveCategory,
  onDeleteCategory
}) => {
  return (
    <div className="flex items-center space-x-3 mb-10 overflow-x-auto pb-4 scrollbar-hide no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
      {categories.map((cat, index) => (
        <div key={cat.id} className="relative group">
          <div
            onClick={() => !isReordering && setActiveTab(cat.id)}
            className={`
              px-6 py-3 rounded-2xl whitespace-nowrap font-semibold transition-all duration-200 border relative overflow-hidden select-none
              ${activeTab === cat.id
                ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-200 dark:shadow-primary-900/50'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }
              ${isReordering ? 'cursor-default pr-16 min-w-[140px]' : 'cursor-pointer'}
            `}
          >
            {cat.name}

            {isReordering && (
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-1 backdrop-blur-sm shadow-sm border border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onMoveCategory?.(index, 'left'); }}
                  disabled={index === 0}
                  title="Mover a la izquierda"
                  aria-label="Mover categoría a la izquierda"
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer text-gray-500 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <div className="w-px h-3 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onMoveCategory?.(index, 'right'); }}
                  disabled={index === categories.length - 1}
                  title="Mover a la derecha"
                  aria-label="Mover categoría a la derecha"
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer text-gray-500 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {isReordering && onDeleteCategory && categories.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteCategory(cat.id); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 z-10 transition-transform hover:scale-110 active:scale-95"
              title="Eliminar categoría"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}

      {!isReordering && (
        <button
          title="Agregar categoría"
          onClick={onAddCategory}
          className="flex items-center justify-center min-w-[50px] h-[50px] bg-white dark:bg-gray-800 text-primary-500 hover:bg-primary-50 dark:hover:bg-gray-700 border border-dashed border-primary-300 dark:border-primary-900/50 rounded-2xl transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default CategoryTabs;
