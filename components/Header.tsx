
import React from 'react';
import { Menu, Eye, Save } from 'lucide-react';

interface HeaderProps {
  onOpenSidebar: () => void;
  onSave: () => void;
  onPreview?: () => void;
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ onOpenSidebar, onSave, onPreview, title = "Menu Editor" }) => {
  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 transition-colors">
      <div className="flex items-center">
        <button 
          onClick={onOpenSidebar}
          className="lg:hidden p-2.5 mr-3 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 dark:text-white tracking-tight">{title}</h2>
      </div>
      
      <div className="flex items-center space-x-3 md:space-x-4">
        {title === "Menu" && (
          <button 
            onClick={onPreview}
            className="hidden md:flex items-center px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95"
          >
            <Eye className="w-4 h-4 mr-2 text-gray-400" />
            Previsualizar
          </button>
        )}
        <button 
          onClick={onSave}
          className="flex items-center px-6 py-2.5 text-sm font-bold text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-200 dark:shadow-none active:scale-95"
        >
          <Save className="w-4 h-4 mr-2" />
          Guardar Cambios
        </button>
      </div>
    </header>
  );
};

export default Header;
