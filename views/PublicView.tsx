
import React, { useState, useEffect } from 'react';
import { Utensils, Clock, MapPin, Instagram, Facebook, Phone, ChevronDown, Lock, Star, ChevronRight, Award, Heart, ShoppingBag, Check, ArrowRight, MessageCircle, Plus, ShoppingCart, X, ChefHat, Truck, Monitor, LayoutDashboard } from 'lucide-react';
import { Category, MenuItem } from '../types';
import { soundManager } from '../utils/soundManager';

interface PublicViewProps {
  categories: Category[];
  menuItems: MenuItem[];
  onEnterControlPanel?: () => void;
  isPreview?: boolean;
}

export default function PublicView({ categories, menuItems, onEnterControlPanel, isPreview }: PublicViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || '');
  const [isScrolled, setIsScrolled] = useState(false);
  const [visibleItemsCount, setVisibleItemsCount] = useState(6);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Order Flow States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderStep, setOrderStep] = useState(1);
  const [selectedBaseDish, setSelectedBaseDish] = useState<MenuItem | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [selectedSides, setSelectedSides] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<MenuItem[]>([]);
  const [customerComments, setCustomerComments] = useState('');

  useEffect(() => {
    setVisibleItemsCount(6);
  }, [activeCategory]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredItems = menuItems.filter(item => {
    if (!item.isActive) return false;
    if (activeCategory === 'cat-3') {
      return item.categoryId !== 'cat-1' && item.categoryId !== 'cat-2';
    }
    return item.categoryId === activeCategory;
  });

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-primary-200">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled || isPreview ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg py-4 border-b border-gray-100 dark:border-gray-800' : 'bg-transparent py-8'}`}>
        <div className="w-full mx-auto px-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <img
              src={`${(import.meta as any).env.BASE_URL}logo.png`}
              alt="El Buen Servir"
              className="w-12 h-12 rounded-2xl shadow-xl shadow-primary-500/20 object-cover group-hover:rotate-12 transition-transform"
            />
            <div className="flex flex-col">
              <span className={`text-2xl font-black tracking-tighter leading-none ${isScrolled || isPreview ? 'text-gray-900 dark:text-white' : 'text-white'}`}>EL BUEN SERVIR</span>
              <span className={`text-[10px] font-bold tracking-[0.3em] uppercase ${isScrolled || isPreview ? 'text-primary-600' : 'text-primary-400'}`}>Desde 1994</span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-10 text-sm font-bold uppercase tracking-widest">
            {['Inicio', 'Menú', 'Nosotros', 'Contacto'].map(link => (
              <a key={link} href={`#${link.toLowerCase()}`} className={`transition-all hover:text-primary-500 ${isScrolled || isPreview ? 'text-gray-600 dark:text-gray-300' : 'text-white/80'}`}>
                {link}
              </a>
            ))}
          </div>
          <div className="flex items-center space-x-4 md:space-x-6">
            {!isPreview && (
              <div className="flex items-center gap-2">
                <button
                  title="Panel de Control"
                  onClick={() => {
                    soundManager.play('click');
                    if (onEnterControlPanel) onEnterControlPanel();
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 transition-all hover:scale-105 active:scale-95 shadow-sm ${isScrolled ? 'text-gray-900 bg-white dark:bg-gray-900 dark:text-white' : 'text-white bg-white/10 backdrop-blur-md'}`}
                >
                  <LayoutDashboard className="w-5 h-5 text-primary-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Panel de Control</span>
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setOrderStep(1);
                setIsOrderModalOpen(true);
              }}
              className={`hidden sm:flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl ${isScrolled || isPreview ? 'bg-primary-500 text-white shadow-primary-500/30 hover:scale-105' : 'bg-white text-gray-900 hover:scale-105 active:scale-95 shadow-white/10'}`}
            >
              <ShoppingBag className="w-4 h-4" />
              Ordenar en Línea
            </button>

            {/* Mobile Menu Button (Hamburger) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-3 rounded-xl lg:hidden transition-all ${isScrolled || isPreview ? 'text-gray-900 dark:text-white bg-gray-50/50' : 'text-white bg-white/10'}`}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6 rotate-45" />}
            </button>
          </div>
        </div >

        {/* Mobile menu panel */}
        {
          isMobileMenuOpen && (
            <div className="lg:hidden absolute top-full left-0 w-full bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 p-8 shadow-2xl animate-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col space-y-6">
                {['Inicio', 'Menú', 'Nosotros', 'Contacto'].map(link => (
                  <a
                    key={link}
                    href={`#${link.toLowerCase()}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-2xl font-black uppercase tracking-tighter text-gray-900 dark:text-white hover:text-primary-500 transition-colors"
                  >
                    {link}
                  </a>
                ))}
                <hr className="border-gray-50 dark:border-gray-800" />
                <button
                  onClick={() => {
                    setOrderStep(1);
                    setIsOrderModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-primary-500 text-white py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/30"
                >
                  Ordenar ahora
                </button>
              </div>
            </div>
          )
        }
      </nav >

      {/* Hero Section */}
      {
        !isPreview && (
          <section id="inicio" className="relative h-screen flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
              <img
                src={`${(import.meta as any).env.BASE_URL}buenservirintro-webp.webp`}
                className="w-full h-full object-cover"
                alt="El Buen Servir Fondo"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-[#0f172a]"></div>
            </div>

            <div className="relative z-10 w-full px-6 md:px-12">
              <div className="w-full">
                <div className="inline-flex items-center space-x-3 mb-2 mt-32 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2 rounded-full text-white">
                  <Star className="w-4 h-4 text-primary-400 fill-current" />
                  <span className="text-xs font-bold uppercase tracking-widest">El sabor que nos distingue</span>
                </div>
                <h1 className="text-7xl md:text-[120px] font-black text-white mb-8 tracking-tighter leading-[0.85] drop-shadow-2xl">
                  Auténtica <br />
                  <span className="text-primary-500 font-serif italic font-normal">Cocina</span> con <br />
                  Herencia.
                </h1>
                <p className="text-xl text-white/70 mb-6 max-w-xl leading-relaxed font-medium">
                  Cada plato cuenta una historia. Descubre la fusión perfecta entre técnicas tradicionales y una visión culinaria moderna.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <a href="#menu" className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white px-12 py-6 rounded-3xl text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary-500/40 transition-all hover:-translate-y-1 active:scale-95 text-center">
                    Descubrir Menú
                  </a>
                  <button className="w-full sm:w-auto group flex items-center justify-center space-x-4 bg-white/5 backdrop-blur-md border border-white/20 text-white px-10 py-6 rounded-3xl text-lg font-bold hover:bg-white/10 transition-all">
                    <span>Nuestra Historia</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce flex flex-col items-center">
              <span className="text-white/50 text-[10px] font-bold uppercase tracking-[0.4em] mb-4">Deslizar</span>
              <ChevronDown className="w-6 h-6 text-white/50" />
            </div>
          </section>
        )
      }

      {/* Featured Section */}
      <section className="py-24 px-6 md:px-12 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="w-full grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-50"></div>
            <div className="relative grid grid-cols-2 gap-4">
              <div className="space-y-4 pt-12">
                <img src={`${(import.meta as any).env.BASE_URL}chilaquiles_especiales.png`} className="rounded-3xl shadow-2xl" alt="Chilaquiles Especiales" />
                <img src={`${(import.meta as any).env.BASE_URL}chilaquiles_verdes.png`} className="rounded-3xl shadow-2xl" alt="Chilaquiles Verdes" />
              </div>
              <div className="space-y-4">
                <img src={`${(import.meta as any).env.BASE_URL}dish_tampiquena.png`} className="rounded-3xl shadow-2xl" alt="Tampiqueña" />
                <img src={`${(import.meta as any).env.BASE_URL}pozole_tradicional.png`} className="rounded-3xl shadow-2xl" alt="Pozole Tradicional" />
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white dark:bg-gray-800 p-8 rounded-4xl shadow-2xl border border-gray-50 dark:border-gray-700 animate-float">
              <Award className="w-12 h-12 text-primary-500 mb-4" />
              <p className="text-2xl font-black dark:text-white leading-tight">30 Años de <br />Excelencia</p>
            </div>
          </div>
          <div className="space-y-8">
            <h5 className="text-primary-500 font-black uppercase tracking-[0.3em] text-sm italic">Pasión por lo que hacemos</h5>
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-none dark:text-white">
              Cocinamos con <br />
              <span className="text-primary-500 italic font-serif">el corazón</span> para tu paladar.
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
              En El Buen Servir, cada ingrediente es seleccionado cuidadosamente de productores locales para garantizar la frescura y el sabor auténtico que nos ha caracterizado por tres décadas.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary-50 dark:bg-primary-950 rounded-2xl">
                  <Heart className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h6 className="font-black uppercase tracking-widest text-xs mb-1 dark:text-white">Tradición</h6>
                  <p className="text-sm text-gray-400">Recetas que han pasado de generación en generación.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary-50 dark:bg-primary-950 rounded-2xl">
                  <Star className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h6 className="font-black uppercase tracking-widest text-xs mb-1 dark:text-white">Calidad</h6>
                  <p className="text-sm text-gray-400">Solo los mejores ingredientes llegan a tu mesa.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className={`py-24 px-6 relative ${isPreview ? 'bg-white' : 'bg-[#FDFDFD] dark:bg-gray-900/50'}`}>
        <div className="w-full relative z-10 px-6 md:px-12">
          <div className="text-center mb-20">
            <span className="text-primary-500 font-black uppercase tracking-[0.3em] text-xs mb-4 block">Carta Gastronómica</span>
            <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter dark:text-white">Nuestro <span className="font-serif italic font-normal">Menú</span></h2>
            <div className="flex justify-center items-center space-x-4">
              <div className="w-12 h-0.5 bg-primary-500/20"></div>
              <Utensils className="w-6 h-6 text-primary-500" />
              <div className="w-12 h-0.5 bg-primary-500/20"></div>
            </div>
          </div>

          {/* Categories Selector */}
          <div className="flex justify-center flex-wrap gap-3 mb-20">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-10 py-4 rounded-3xl font-black text-sm uppercase tracking-widest transition-all duration-300 border-2 ${activeCategory === cat.id
                  ? 'bg-gray-900 text-white border-gray-900 shadow-2xl shadow-black/20 scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-transparent hover:border-primary-200 dark:hover:border-primary-900 hover:text-primary-600'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            {filteredItems.length > 0 ? (
              <>
                {filteredItems.slice(0, visibleItemsCount).map(item => (
                  <div key={item.id} className="group relative">
                    <div className="flex justify-between items-baseline mb-3">
                      <h4 className="text-2xl font-black group-hover:text-primary-600 transition-colors uppercase tracking-tighter dark:text-white">
                        {item.name}
                      </h4>
                      <div className="flex-1 mx-4 border-b-2 border-dotted border-gray-200 dark:border-gray-800"></div>
                      <span className="text-2xl font-black text-primary-500">
                        ${Math.min(...item.variations.map(v => v.price)).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6 italic">
                      {item.description}
                    </p>
                    <div className="flex flex-wrap gap-3 mb-6">
                      {item.variations.map(v => (
                        <div key={v.id} className="flex items-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-1.5 rounded-full shadow-sm group-hover:border-primary-200 transition-all">
                          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mr-2">{v.label}</span>
                          <span className="text-xs font-bold dark:text-white">${v.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBaseDish(item);
                        setSelectedVariation(item.variations[0]);
                        setOrderStep(2);
                        setIsOrderModalOpen(true);
                      }}
                      className="w-full py-4 bg-gray-50 dark:bg-gray-800 hover:bg-primary-500 hover:text-white text-gray-500 dark:text-gray-400 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-transparent hover:border-primary-500"
                    >
                      <Plus className="w-4 h-4" />
                      Ordenar Ahora
                    </button>
                  </div>
                ))}

                {filteredItems.length > visibleItemsCount && (
                  <div className="col-span-full flex justify-center mt-12">
                    <button
                      onClick={() => setVisibleItemsCount(prev => prev + 6)}
                      className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-full font-black text-xs uppercase tracking-widest hover:border-primary-500 hover:text-primary-500 transition-all shadow-xl hover:shadow-primary-500/10 active:scale-95"
                    >
                      Mostrar más platillos ({filteredItems.length - visibleItemsCount} restantes)
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="col-span-full text-center py-32 bg-gray-50 dark:bg-gray-800/50 rounded-[40px] border-2 border-dashed border-gray-100 dark:border-gray-800">
                <Utensils className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-6" />
                <p className="text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">Aún no hay especialidades en esta categoría</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {
        !isPreview && (
          <section className="py-24 px-6 md:px-12">
            <div className="w-full bg-gray-900 rounded-[50px] p-12 md:p-24 relative overflow-hidden flex flex-col items-center text-center">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10 max-w-2xl">
                <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-none">
                  ¿Listo para una <span className="text-primary-500 font-serif italic font-normal">experiencia</span> inolvidable?
                </h2>
                <p className="text-xl text-white/60 mb-12 leading-relaxed">
                  Reserva hoy mismo tu mesa y déjanos consentirte con los mejores sabores de la región.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <button
                    onClick={() => {
                      setOrderStep(1);
                      setIsOrderModalOpen(true);
                    }}
                    className="w-full sm:w-auto bg-white text-gray-900 px-12 py-6 rounded-3xl text-lg font-black uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center gap-3"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    Ordenar Ahora
                  </button>
                  <a href="tel:5550100" className="flex items-center space-x-3 text-white hover:text-primary-400 transition-colors">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                      <Phone className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-bold">555-0100</span>
                  </a>
                </div>
              </div>
            </div>
          </section>
        )
      }

      {/* Footer */}
      {
        !isPreview && (
          <footer id="contacto" className="bg-white dark:bg-gray-950 pt-24 pb-12 px-6 md:px-12 border-t border-gray-50 dark:border-gray-900">
            <div className="w-full">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
                <div className="lg:col-span-1">
                  <div className="flex items-center space-x-2 mb-10">
                    <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white">
                      <Utensils className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter dark:text-white uppercase">El Buen Servir</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-10 italic">
                    "Donde cada bocado cuenta una historia de tradición y excelencia culinaria."
                  </p>
                  <div className="flex space-x-3">
                    {[{ Icon: Instagram, label: 'Instagram' }, { Icon: Facebook, label: 'Facebook' }, { Icon: Phone, label: 'Teléfono' }].map(({ Icon, label }, i) => (
                      <a key={i} href="#" title={label} className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary-500 transition-all hover:-translate-y-1">
                        <Icon className="w-5 h-5" />
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-black mb-8 text-xs uppercase tracking-[0.3em] text-gray-900 dark:text-white">Menú Rápido</h5>
                  <ul className="space-y-4 text-sm font-bold text-gray-500 dark:text-gray-400">
                    {['Postres', 'Bebidas', 'Platos Fuertes', 'Entradas'].map(item => (
                      <li key={item}><a href="#" className="hover:text-primary-500 transition-colors">{item}</a></li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-black mb-8 text-xs uppercase tracking-[0.3em] text-gray-900 dark:text-white">Ubicación</h5>
                  <div className="space-y-6 text-sm">
                    <p className="text-gray-500 dark:text-gray-400 flex items-start">
                      <MapPin className="w-5 h-5 mr-4 text-primary-500 flex-shrink-0" />
                      <span>Av. Gourmet 789<br />Distrito Gastronómico, CDMX</span>
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 flex items-start">
                      <Phone className="w-5 h-5 mr-4 text-primary-500 flex-shrink-0" />
                      <span>Resv: (55) 555-0100</span>
                    </p>
                  </div>
                </div>

                <div>
                  <h5 className="font-black mb-8 text-xs uppercase tracking-[0.3em] text-gray-900 dark:text-white">Horarios</h5>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 border-b border-gray-50 dark:border-gray-900 pb-2">
                      <span>Lun - Jue</span>
                      <span className="font-black text-gray-900 dark:text-white">13:00 - 22:00</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 border-b border-gray-50 dark:border-gray-900 pb-2">
                      <span>Vie - Sáb</span>
                      <span className="font-black text-gray-900 dark:text-white">13:00 - 00:00</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                      <span>Domingo</span>
                      <span className="font-black text-primary-500">12:00 - 20:00</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-900 pt-12 flex flex-col md:flex-row justify-between items-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                <p>&copy; {new Date().getFullYear()} El Buen Servir. Todos los derechos reservados.</p>
                <div className="flex space-x-8 mt-6 md:mt-0">
                  <a href="#" className="hover:text-primary-500">Privacidad</a>
                  <a href="#" className="hover:text-primary-500">Términos</a>
                  <a href="#" className="hover:text-primary-500">Cookies</a>
                </div>
              </div>
            </div>
          </footer>
        )
      }
      {/* Order Modal */}
      {
        isOrderModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsOrderModalOpen(false)}></div>
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">

              {/* Modal Header */}
              <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-primary-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tighter">Paso {orderStep} de 4</span>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Compra en Línea</h3>
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {orderStep === 1 && "Selecciona tu platillo"}
                    {orderStep === 2 && "¿Con qué se acompañará?"}
                    {orderStep === 3 && "Sugerencias para acompañar"}
                    {orderStep === 4 && "Resumen y Envío"}
                  </p>
                </div>
                <button
                  title="Cerrar"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="p-3 bg-white dark:bg-gray-800 text-gray-400 hover:text-red-500 rounded-2xl shadow-sm transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                {/* Step 1: Menu Selection */}
                {orderStep === 1 && (
                  <div className="space-y-6">
                    {categories.filter(cat => cat.id === 'cat-3').map(cat => (
                      <div key={cat.id} className="space-y-4">
                        <h5 className="text-xs font-black text-primary-500 uppercase tracking-[0.2em]">{cat.name}</h5>
                        <div className="grid grid-cols-1 gap-3">
                          {menuItems.filter(item => item.categoryId !== 'cat-1' && item.categoryId !== 'cat-2' && item.isActive).map(item => (
                            <div
                              key={item.id}
                              className="p-5 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all"
                            >
                              <div className="mb-4">
                                <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-lg">{item.name}</p>
                                <p className="text-xs text-gray-400 italic mt-1">{item.description}</p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {item.variations.map(v => (
                                  <button
                                    key={v.id}
                                    onClick={() => {
                                      setSelectedBaseDish(item);
                                      setSelectedVariation(v);
                                      setOrderStep(2);
                                    }}
                                    className="flex-grow sm:flex-grow-0 flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 hover:text-primary-500 transition-all group/var"
                                  >
                                    <span className="text-xs font-black uppercase tracking-wide text-gray-600 dark:text-gray-300 group-hover/var:text-primary-500">{v.label}</span>
                                    <span className="text-sm font-black text-gray-900 dark:text-white group-hover/var:text-primary-500">${v.price}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Step 2: Accompaniment Selection */}
                {orderStep === 2 && selectedBaseDish && (
                  <div className="space-y-8">
                    <div className="bg-primary-50 dark:bg-primary-950/30 p-6 rounded-3xl border border-primary-100 dark:border-primary-900/50">
                      <p className="text-xs font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-2">Platillo seleccionado</p>
                      <h4 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{selectedBaseDish.name}</h4>
                      <p className="text-sm font-bold text-emerald-500 mt-2">✨ Las guarniciones no tienen costo extra.</p>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">¿Con qué se va a acompañar?</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {menuItems.filter(item => item.categoryId === 'cat-5' && item.isActive).map(item => item.name).map(side => (
                          <button
                            key={side}
                            onClick={() => {
                              if (selectedSides.includes(side)) {
                                setSelectedSides(prev => prev.filter(s => s !== side));
                              } else {
                                setSelectedSides(prev => [...prev, side]);
                              }
                            }}
                            className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all font-bold text-sm ${selectedSides.includes(side)
                              ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-transparent hover:border-primary-200'
                              }`}
                          >
                            <span>{side}</span>
                            {selectedSides.includes(side) ? <Check className="w-5 h-5" /> : <Plus className="w-4 h-4 opacity-30" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Instrucciones Especiales</label>
                      <textarea
                        value={customerComments}
                        onChange={e => setCustomerComments(e.target.value)}
                        placeholder="Ej. Sin cebolla, término medio, etc..."
                        className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary-500 rounded-3xl p-6 outline-none transition-all font-bold text-sm min-h-[120px]"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Drinks & Desserts */}
                {orderStep === 3 && (
                  <div className="space-y-8 text-center py-6">
                    <div className="inline-flex p-4 bg-amber-50 dark:bg-amber-950/30 rounded-3xl mb-4">
                      <Award className="w-12 h-12 text-amber-500" />
                    </div>
                    <h4 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">¿Deseas algo más?</h4>
                    <p className="text-gray-500 dark:text-gray-400 font-bold max-w-sm mx-auto">Te sugerimos acompañar tu plato con una de nuestras bebidas o postres artesanales.</p>

                    <div className="grid grid-cols-1 gap-4 text-left mt-8">
                      {menuItems.filter(item => ['cat-1', 'cat-2', 'cat-bebidas', 'cat-postres', 'cat-4', 'cat-5'].includes(item.categoryId) && item.isActive).slice(0, 6).map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (selectedExtras.some(e => e.id === item.id)) {
                              setSelectedExtras(prev => prev.filter(e => e.id !== item.id));
                            } else {
                              setSelectedExtras(prev => [...prev, item]);
                            }
                          }}
                          className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${selectedExtras.some(e => e.id === item.id)
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xl shadow-amber-500/20'
                            : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:border-amber-200'
                            }`}
                        >
                          <div className="flex-1">
                            <p className="font-black text-sm uppercase tracking-tight">{item.name}</p>
                            <p className="text-[10px] font-bold opacity-60 uppercase mt-1">${Math.min(...item.variations.map(v => v.price)).toFixed(2)}</p>
                          </div>
                          {selectedExtras.some(e => e.id === item.id) ? <Check className="w-6 h-6" /> : <Plus className="w-5 h-5 opacity-30" />}
                        </button>
                      ))}
                      {/* Fallback items if categories are not found */}
                      {menuItems.filter(item => ['cat-bebidas', 'cat-postres', 'cat-4', 'cat-5'].includes(item.categoryId)).length === 0 && (
                        ['Agua de Horchata', 'Flan Napolitano', 'Refresco de Vidrio', 'Cerveza Nacional'].map(extra => (
                          <div key={extra} className="p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl text-gray-400 text-center font-bold text-xs uppercase tracking-widest border-2 border-dashed border-gray-200 dark:border-gray-700">
                            {extra} (Disponible)
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Step 4: Summary */}
                {orderStep === 4 && selectedBaseDish && (
                  <div className="space-y-8">
                    <div className="text-center py-6">
                      <div className="inline-flex p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-3xl mb-4">
                        <MessageCircle className="w-12 h-12 text-emerald-500" />
                      </div>
                      <h4 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Resumen de tu Pedido</h4>
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2 italic">Confirmación Final</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-[32px] overflow-hidden border border-gray-100 dark:border-gray-700">
                      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <span className="font-black text-gray-900 dark:text-white uppercase text-base">{selectedBaseDish.name}</span>
                        <span className="font-black text-primary-500">${selectedVariation?.price.toFixed(2)}</span>
                      </div>

                      {selectedSides.length > 0 && (
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Guarniciones (Sin Costo):</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedSides.map(side => (
                              <span key={side} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-lg uppercase">{side}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedExtras.length > 0 && (
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Adicionales:</p>
                          <div className="space-y-2">
                            {selectedExtras.map(extra => (
                              <div key={extra.id} className="flex justify-between text-sm font-bold dark:text-white">
                                <span>{extra.name}</span>
                                <span>${Math.min(...extra.variations.map(v => v.price)).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="p-8 bg-gray-900 text-white flex justify-between items-baseline">
                        <span className="text-xs font-black uppercase tracking-[0.3em] opacity-60">Total Estimado</span>
                        <span className="text-4xl font-black tracking-tighter">
                          ${(
                            (selectedVariation?.price || 0) +
                            selectedExtras.reduce((acc, e) => acc + Math.min(...e.variations.map(v => v.price)), 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer Controls */}
              <div className="p-8 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="flex gap-4">
                  {orderStep > 1 && (
                    <button
                      onClick={() => setOrderStep(prev => prev - 1)}
                      className="px-8 py-5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
                    >
                      Regresar
                    </button>
                  )}

                  {orderStep < 4 ? (
                    <button
                      onClick={() => {
                        if (orderStep === 1 && !selectedBaseDish) return;
                        setOrderStep(prev => prev + 1);
                      }}
                      disabled={orderStep === 1 && !selectedBaseDish}
                      className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-3xl font-black uppercase text-xs tracking-widest transition-all shadow-xl ${orderStep === 1 && !selectedBaseDish
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-gray-900 dark:bg-primary-500 text-white hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                    >
                      <span>{orderStep === 1 ? 'Continuar' : 'Siguiente Paso'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const number = "2311024672";
                        const total = (
                          (selectedVariation?.price || 0) +
                          selectedExtras.reduce((acc, e) => acc + Math.min(...e.variations.map(v => v.price)), 0)
                        ).toFixed(2);

                        const message = `*NUEVO PEDIDO EN LÍNEA - EL BUEN SERVIR*%0A%0A` +
                          `🥘 *Platillo:* ${selectedBaseDish?.name}%0A` +
                          (selectedSides.length > 0 ? `🥗 *Guarniciones:* ${selectedSides.join(', ')} (Sin costo)%0A` : '') +
                          (selectedExtras.length > 0 ? `🥤 *Adicionales:* ${selectedExtras.map(e => e.name).join(', ')}%0A` : '') +
                          (customerComments ? `📝 *Notas:* ${customerComments}%0A` : '') +
                          `%0A💰 *TOTAL:* $${total}%0A%0A` +
                          `🚀 _Enviado desde el sitio web_`;

                        window.open(`https://wa.me/52${number}?text=${message}`, '_blank');
                        setIsOrderModalOpen(false);
                        // Reset state
                        setOrderStep(1);
                        setSelectedBaseDish(null);
                        setSelectedSides([]);
                        setSelectedExtras([]);
                        setCustomerComments('');
                      }}
                      className="flex-1 flex items-center justify-center gap-3 py-6 bg-emerald-500 text-white rounded-[28px] font-black uppercase text-sm tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-emerald-500/20"
                    >
                      <MessageCircle className="w-6 h-6" />
                      <span>Enviar Pedido por WhatsApp</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
