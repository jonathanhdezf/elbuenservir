
import React from 'react';
import { Plus } from 'lucide-react';
import { Category, TabId } from '../types';

interface CategoryTabsProps {
  activeTab: TabId;
  setActiveTab: (id: TabId) => void;
  categories: Category[];
  onAddCategory: () => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ activeTab, setActiveTab, categories, onAddCategory }) => {
  return (
    <div className="flex items-center space-x-3 mb-10 overflow-x-auto pb-4 scrollbar-hide no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setActiveTab(cat.id)}
          className={`
            px-6 py-3 rounded-2xl whitespace-nowrap font-semibold transition-all duration-200 border
            ${activeTab === cat.id
              ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-200 dark:shadow-primary-900/50'
              : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }
          `}
        >
          {cat.name}
        </button>
      ))}
      <button
        title="Agregar categoría"
        onClick={onAddCategory}
        className="flex items-center justify-center min-w-[50px] h-[50px] bg-white dark:bg-gray-800 text-primary-500 hover:bg-primary-50 dark:hover:bg-gray-700 border border-dashed border-primary-300 dark:border-primary-900/50 rounded-2xl transition-all"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default CategoryTabs;
