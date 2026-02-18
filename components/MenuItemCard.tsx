
import React from 'react';
import { GripVertical, Trash2, Plus, Minus, Info } from 'lucide-react';
import { MenuItem, PricingVariation } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  onUpdate: (item: MenuItem) => void;
  onDelete: () => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onUpdate, onDelete }) => {
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...item, name: e.target.value });
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

  const updateVariation = (index: number, field: keyof PricingVariation, value: any) => {
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

  return (
    <div className={`
      bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 
      overflow-hidden hover:shadow-xl transition-all duration-300 group
      ${!item.isActive ? 'opacity-60 grayscale-[0.5]' : ''}
    `}>
      <div className="p-6 md:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Drag Handle & Status (Left column on large) */}
          <div className="hidden lg:flex flex-col items-center justify-start pt-2 flex-shrink-0">
            <GripVertical className="text-gray-300 dark:text-gray-600 cursor-move group-hover:text-primary-300 transition-colors" />
          </div>

          {/* Core Info */}
          <div className="flex-1 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Item Name</label>
                <input 
                  className="w-full bg-gray-50/50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 px-5 py-3 dark:text-white transition-all outline-none text-lg font-medium" 
                  type="text" 
                  value={item.name}
                  onChange={handleNameChange}
                  placeholder="E.g. Plátanos Fritos"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Description</label>
                <textarea 
                  className="w-full bg-gray-50/50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 px-5 py-3 dark:text-white transition-all outline-none resize-none leading-relaxed" 
                  rows={2}
                  value={item.description}
                  onChange={handleDescChange}
                  placeholder="Describe the item ingredients, preparation, etc..."
                />
              </div>
            </div>
          </div>

          {/* Pricing Variations */}
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 ml-1">Pricing Variations</label>
            <div className="space-y-3">
              {item.variations.map((v, idx) => (
                <div key={v.id} className="flex items-center space-x-3 group/var">
                  <div className="flex-1 relative">
                    <input 
                      className="w-full bg-gray-50/50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl text-sm px-4 py-3 dark:text-white focus:border-primary-500 focus:ring-0 outline-none transition-all" 
                      placeholder="Label (e.g. Medium)" 
                      type="text" 
                      value={v.label}
                      onChange={(e) => updateVariation(idx, 'label', e.target.value)}
                    />
                  </div>
                  <div className="relative w-32">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
                    <input 
                      className="w-full bg-gray-50/50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl text-sm pl-8 pr-4 py-3 dark:text-white font-bold text-right focus:border-primary-500 focus:ring-0 outline-none transition-all" 
                      type="number" 
                      step="0.01"
                      value={v.price}
                      onChange={(e) => updateVariation(idx, 'price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <button 
                    onClick={() => removeVariation(idx)}
                    disabled={item.variations.length <= 1}
                    className="p-2 text-gray-300 hover:text-red-500 disabled:opacity-0 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button 
                onClick={addVariation}
                className="text-xs font-bold text-primary-500 flex items-center hover:bg-primary-50 dark:hover:bg-primary-900/20 px-4 py-2 rounded-xl transition-all group/add"
              >
                <Plus className="w-4 h-4 mr-2 group-hover/add:scale-125 transition-transform" /> 
                Add Variation
              </button>
            </div>
          </div>

          {/* Actions & Status Toggle */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-between border-t lg:border-t-0 pt-6 lg:pt-0 border-gray-50 dark:border-gray-700">
            <div className="flex flex-col items-end space-y-2">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 lg:hidden">Active</label>
              <div 
                onClick={toggleActive}
                className={`
                  relative inline-flex h-7 w-12 items-center rounded-full cursor-pointer transition-colors duration-200 ease-in-out outline-none
                  ${item.isActive ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}
                `}
              >
                <span className={`
                  inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out shadow-sm
                  ${item.isActive ? 'translate-x-6' : 'translate-x-1'}
                `} />
              </div>
              <span className="text-[10px] font-bold text-gray-400 mt-1 hidden lg:block">{item.isActive ? 'VISIBLE' : 'HIDDEN'}</span>
            </div>

            <button 
              onClick={onDelete}
              className="p-3 text-gray-300 hover:text-red-500 transition-all rounded-2xl hover:bg-red-50 dark:hover:bg-red-950/20 lg:mb-1"
              title="Delete item"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
