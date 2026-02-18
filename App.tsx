
import React, { useState, useEffect } from 'react';
import { MenuItem, Category, TabId } from './types';
import AdminView from './views/AdminView';
import PublicView from './views/PublicView';

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-3', name: 'Menú del Día' },
  { id: 'cat-5', name: 'Para Acompañar' },
  { id: 'cat-1', name: 'Postres' },
  { id: 'cat-2', name: 'Bebidas' },
];

const INITIAL_ITEMS: MenuItem[] = [
  // MENÚ DEL DÍA
  {
    id: 'm1', categoryId: 'cat-3', name: 'Fresas con crema',
    description: 'Fresas frescas con crema especial de la casa.',
    isActive: true,
    variations: [
      { id: 'm1v1', label: 'Vaso chico', price: 40 },
      { id: 'm1v2', label: 'Vaso grande', price: 80 }
    ]
  },
  {
    id: 'm2', categoryId: 'cat-3', name: 'Jugo de naranja 🍊',
    description: 'Jugo 100% natural recién exprimido.',
    isActive: true,
    variations: [
      { id: 'm2v1', label: 'Medio litro', price: 30 },
      { id: 'm2v2', label: 'Litro', price: 60 }
    ]
  },
  {
    id: 'm3', categoryId: 'cat-3', name: 'Chilpozo de res',
    description: 'Caldo de res tradicional con verduras y un toque de picante.',
    isActive: true,
    variations: [{ id: 'm3v1', label: 'Platillo', price: 95 }]
  },
  {
    id: 'm4', categoryId: 'cat-3', name: 'Pancita',
    description: 'Tradicional pancita de res bien sazonada.',
    isActive: true,
    variations: [
      { id: 'm4v1', label: 'Medio', price: 80 },
      { id: 'm4v2', label: 'Litro', price: 100 }
    ]
  },
  {
    id: 'm5', categoryId: 'cat-3', name: 'Chicharrón maciza en salsa verde',
    description: 'Chicharrón de cerdo en salsa verde casera.',
    isActive: true,
    variations: [{ id: 'm5v1', label: 'Platillo', price: 90 }]
  },
  {
    id: 'm6', categoryId: 'cat-3', name: 'Pipian rojo de pollo',
    description: 'Pollo en salsa de pipián rojo tradicional (Pierna o muslo).',
    isActive: true,
    variations: [{ id: 'm6v1', label: 'Platillo', price: 90 }]
  },
  {
    id: 'm7', categoryId: 'cat-3', name: 'Costilla enchipotlada',
    description: 'Costillas de cerdo bañadas en salsa de chipotle.',
    isActive: true,
    variations: [{ id: 'm7v1', label: 'Platillo', price: 90 }]
  },
  {
    id: 'm8', categoryId: 'cat-3', name: 'Pechuga a la diabla',
    description: 'Pechuga de pollo rellena de queso panela en salsa diabla.',
    isActive: true,
    variations: [{ id: 'm8v1', label: 'Platillo', price: 90 }]
  },
  {
    id: 'm9', categoryId: 'cat-3', name: 'Pozole (pollo)',
    description: 'Pozole blanco de pollo con sus complementos tradicionales.',
    isActive: true,
    variations: [
      { id: 'm9v1', label: 'Medio', price: 70 },
      { id: 'm9v2', label: 'Litro', price: 90 }
    ]
  },
  {
    id: 'm10', categoryId: 'cat-3', name: 'Pechuga en chiltepin',
    description: 'Pechuga rellena de queso panela en salsa de chiltepin.',
    isActive: true,
    variations: [{ id: 'm10v1', label: 'Platillo', price: 90 }]
  },
  {
    id: 'm11', categoryId: 'cat-3', name: 'Filete de pescado',
    description: 'Filete de pescado fresco preparado al gusto.',
    isActive: true,
    variations: [
      { id: 'm11v1', label: 'A la plancha', price: 110 },
      { id: 'm11v2', label: 'Empanizado', price: 120 }
    ]
  },
  {
    id: 'm12', categoryId: 'cat-3', name: 'Camarones al gusto',
    description: 'Orden con 6 piezas. Preparados al gusto.',
    isActive: true,
    variations: [
      { id: 'm12v1', label: 'Empanizados', price: 150 },
      { id: 'm12v2', label: 'A la diabla', price: 150 },
      { id: 'm12v3', label: 'Al mojo de ajo', price: 150 },
      { id: 'm12v4', label: 'Enchipotlados', price: 150 }
    ]
  },
  {
    id: 'm13', categoryId: 'cat-3', name: 'Longaniza frita con papas',
    description: 'Longaniza frita acompañada de papas cambray.',
    isActive: true,
    variations: [{ id: 'm13v1', label: 'Platillo', price: 90 }]
  },
  {
    id: 'm14', categoryId: 'cat-3', name: 'Chuleta ahumada frita',
    description: 'Deliciosa chuleta ahumada frita.',
    isActive: true,
    variations: [
      { id: 'm14v1', label: 'Platillo', price: 90 },
      { id: 'm14v2', label: 'Orden en tacos (2pz)', price: 50 }
    ]
  },
  {
    id: 'm15', categoryId: 'cat-3', name: 'Pechugas rellenas de jamón y queso',
    description: 'Pechugas de pollo rellenas de jamón y queso amarillo.',
    isActive: true,
    variations: [
      { id: 'm15v1', label: 'Sencillo', price: 90 },
      { id: 'm15v2', label: 'Con papas a la francesa', price: 120 }
    ]
  },
  {
    id: 'm16', categoryId: 'cat-3', name: 'Queso asado',
    description: 'Queso asado de alta calidad.',
    isActive: true,
    variations: [
      { id: 'm16v1', label: 'Platillo', price: 90 },
      { id: 'm16v2', label: 'Taco', price: 50 }
    ]
  },
  {
    id: 'm17', categoryId: 'cat-3', name: 'Chuleta ahumada',
    description: 'Chuleta ahumada al natural.',
    isActive: true,
    variations: [{ id: 'm17v1', label: 'Platillo', price: 85 }]
  },
  {
    id: 'm18', categoryId: 'cat-3', name: 'Omelette',
    description: 'Omelette de huevo al gusto (Jamón, Pollo o Salchicha).',
    isActive: true,
    variations: [{ id: 'm18v1', label: 'Platillo', price: 90 }]
  },
  {
    id: 'm19', categoryId: 'cat-3', name: 'Tampiqueñas',
    description: 'Servido con arroz, frijoles, 3 enchiladas rojas y papas francesas. (Sin tortillas)',
    isActive: true,
    variations: [
      { id: 'm19v1', label: 'Pollo', price: 130 },
      { id: 'm19v2', label: 'Puerco', price: 140 },
      { id: 'm19v3', label: 'Res', price: 160 }
    ]
  },
  {
    id: 'm20', categoryId: 'cat-3', name: 'Dedos de queso',
    description: '4 piezas rellenas de queso panela.',
    isActive: true,
    variations: [{ id: 'm20v1', label: 'Orden', price: 100 }]
  },
  {
    id: 'm21', categoryId: 'cat-3', name: 'Mole con pollo',
    description: 'Tradicional mole poblano con pollo (Pierna o muslo).',
    isActive: true,
    variations: [{ id: 'm21v1', label: 'Platillo', price: 90 }]
  },
  {
    id: 'm22', categoryId: 'cat-3', name: 'Milanesa de pollo',
    description: 'Milanesa de pollo dorada.',
    isActive: true,
    variations: [
      { id: 'm22v1', label: 'Sencilla', price: 90 },
      { id: 'm22v2', label: 'Con papas a la francesa', price: 120 }
    ]
  },
  {
    id: 'm23', categoryId: 'cat-3', name: 'Chilaquiles',
    description: 'Con pollo deshebrado, queso, crema, aguacate y cebolla. (Sin guarnición)',
    isActive: true,
    variations: [
      { id: 'm23v1', label: 'Chicos', price: 60 },
      { id: 'm23v2', label: 'Grandes', price: 90 },
      { id: 'm23v3', label: 'Con asada de pollo', price: 120 },
      { id: 'm23v4', label: 'Con asada de puerco', price: 130 }
    ]
  },
  {
    id: 'm24', categoryId: 'cat-3', name: 'Enchiladas suizas',
    description: '5 piezas en salsa verde cremosa. (Sin guarnición)',
    isActive: true,
    variations: [{ id: 'm24v1', label: 'Orden', price: 90 }]
  },
  // PARA ACOMPAÑAR
  {
    id: 'a1', categoryId: 'cat-5', name: 'Ensalada de lechuga',
    description: 'Ensalada fresca de temporada.',
    isActive: true,
    variations: [{ id: 'a1v1', label: 'Orden', price: 0 }]
  },
  {
    id: 'a2', categoryId: 'cat-5', name: 'Frijoles',
    description: 'Frijoles refritos caseros.',
    isActive: true,
    variations: [{ id: 'a2v1', label: 'Orden', price: 0 }]
  },
  {
    id: 'a3', categoryId: 'cat-5', name: 'Sopa fria',
    description: 'Sopa de pasta fría con crema.',
    isActive: true,
    variations: [{ id: 'a3v1', label: 'Orden', price: 0 }]
  },
  {
    id: 'a4', categoryId: 'cat-5', name: 'Verduras al vapor',
    description: 'Mix de verduras frescas al vapor.',
    isActive: true,
    variations: [{ id: 'a4v1', label: 'Orden', price: 0 }]
  },
  {
    id: 'a5', categoryId: 'cat-5', name: 'Arroz rojo',
    description: 'Arroz rojo tradicional mexicano.',
    isActive: true,
    variations: [{ id: 'a5v1', label: 'Orden', price: 0 }]
  }
];

export default function App() {
  const [view, setView] = useState<'admin' | 'public'>('public');
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_ITEMS);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (view === 'admin') {
    return (
      <AdminView
        categories={categories}
        setCategories={setCategories}
        menuItems={menuItems}
        setMenuItems={setMenuItems}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onExit={() => setView('public')}
      />
    );
  }

  return (
    <PublicView
      categories={categories}
      menuItems={menuItems}
      onEnterAdmin={() => setView('admin')}
    />
  );
}
