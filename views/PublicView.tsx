
import React, { useState, useEffect } from 'react';
import { Utensils, Clock, MapPin, Instagram, Facebook, Phone, ChevronDown, Lock, Star, ChevronRight, Award, Heart } from 'lucide-react';
import { Category, MenuItem } from '../types';

interface PublicViewProps {
  categories: Category[];
  menuItems: MenuItem[];
  onEnterAdmin?: () => void;
  isPreview?: boolean;
}

export default function PublicView({ categories, menuItems, onEnterAdmin, isPreview }: PublicViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || '');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredItems = menuItems.filter(item => item.categoryId === activeCategory && item.isActive);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-primary-200">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled || isPreview ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg py-4 border-b border-gray-100 dark:border-gray-800' : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-500/20 group-hover:rotate-12 transition-transform">
              <Utensils className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className={`text-2xl font-black tracking-tighter leading-none ${isScrolled || isPreview ? 'text-gray-900 dark:text-white' : 'text-white'}`}>EL BUEN SERVIR</span>
              <span className={`text-[10px] font-bold tracking-[0.3em] uppercase ${isScrolled || isPreview ? 'text-primary-600' : 'text-primary-400'}`}>Est. 1994</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-10 text-sm font-bold uppercase tracking-widest">
            {['Inicio', 'Menú', 'Nosotros', 'Contacto'].map(link => (
              <a key={link} href={`#${link.toLowerCase()}`} className={`transition-all hover:text-primary-500 ${isScrolled || isPreview ? 'text-gray-600 dark:text-gray-300' : 'text-white/80'}`}>
                {link}
              </a>
            ))}
          </div>

          <div className="flex items-center space-x-6">
            {!isPreview && (
              <button 
                onClick={onEnterAdmin}
                className={`p-2.5 rounded-xl transition-all hover:scale-110 ${isScrolled ? 'text-gray-400 hover:text-primary-500 bg-gray-50' : 'text-white/60 hover:text-white bg-white/10'}`}
              >
                <Lock className="w-5 h-5" />
              </button>
            )}
            <button className={`hidden sm:block px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl ${isScrolled || isPreview ? 'bg-primary-500 text-white shadow-primary-500/30' : 'bg-white text-gray-900 hover:scale-105 active:scale-95 shadow-white/10'}`}>
              Reservar Mesa
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {!isPreview && (
        <section id="inicio" className="relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=2000" 
              className="w-full h-full object-cover"
              alt="Platillo gourmet background"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-[#0f172a]"></div>
          </div>
          
          <div className="relative z-10 w-full max-w-7xl px-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center space-x-3 mb-8 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2 rounded-full text-white">
                <Star className="w-4 h-4 text-primary-400 fill-current" />
                <span className="text-xs font-bold uppercase tracking-widest">El sabor que nos distingue</span>
              </div>
              <h1 className="text-7xl md:text-[120px] font-black text-white mb-8 tracking-tighter leading-[0.85] drop-shadow-2xl">
                Auténtica <br />
                <span className="text-primary-500 font-serif italic font-normal">Cocina</span> con <br />
                Herencia.
              </h1>
              <p className="text-xl text-white/70 mb-12 max-w-xl leading-relaxed font-medium">
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
      )}

      {/* Featured Section */}
      <section className="py-24 px-6 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-50"></div>
            <div className="relative grid grid-cols-2 gap-4">
              <div className="space-y-4 pt-12">
                <img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800" className="rounded-3xl shadow-2xl" alt="Cocina" />
                <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800" className="rounded-3xl shadow-2xl" alt="Platillo" />
              </div>
              <div className="space-y-4">
                <img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800" className="rounded-3xl shadow-2xl" alt="Ambiente" />
                <img src="https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&q=80&w=800" className="rounded-3xl shadow-2xl" alt="Ingredientes" />
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
        <div className="max-w-6xl mx-auto relative z-10">
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
                className={`px-10 py-4 rounded-3xl font-black text-sm uppercase tracking-widest transition-all duration-300 border-2 ${
                  activeCategory === cat.id 
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
            {filteredItems.length > 0 ? filteredItems.map(item => (
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
                <div className="flex flex-wrap gap-3">
                  {item.variations.map(v => (
                    <div key={v.id} className="flex items-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-1.5 rounded-full shadow-sm group-hover:border-primary-200 transition-all">
                       <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mr-2">{v.label}</span>
                       <span className="text-xs font-bold dark:text-white">${v.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-32 bg-gray-50 dark:bg-gray-800/50 rounded-[40px] border-2 border-dashed border-gray-100 dark:border-gray-800">
                <Utensils className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-6" />
                <p className="text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">Aún no hay especialidades en esta categoría</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isPreview && (
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto bg-gray-900 rounded-[50px] p-12 md:p-24 relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-none">
                ¿Listo para una <span className="text-primary-500 font-serif italic font-normal">experiencia</span> inolvidable?
              </h2>
              <p className="text-xl text-white/60 mb-12 leading-relaxed">
                Reserva hoy mismo tu mesa y déjanos consentirte con los mejores sabores de la región.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                 <button className="w-full sm:w-auto bg-white text-gray-900 px-12 py-6 rounded-3xl text-lg font-black uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-2xl">
                   Hacer Reservación
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
      )}

      {/* Footer */}
      {!isPreview && (
        <footer id="contacto" className="bg-white dark:bg-gray-950 pt-24 pb-12 px-6 border-t border-gray-50 dark:border-gray-900">
          <div className="max-w-7xl mx-auto">
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
                  {[Instagram, Facebook, Phone].map((Icon, i) => (
                    <a key={i} href="#" className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary-500 transition-all hover:-translate-y-1">
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
      )}
    </div>
  );
}
