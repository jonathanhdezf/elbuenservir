
import React, { useState, useEffect } from 'react';
import { Utensils, Clock, MapPin, Instagram, Facebook, Phone, ChevronDown, Lock, Star, ChevronRight, Award, Heart, ShoppingBag, Check, ArrowRight, MessageCircle, Menu, Plus, ShoppingCart, X, ChefHat, Truck, Monitor, LayoutDashboard, Search, Store, Zap, Mic, Download, Smartphone, Sparkles, User } from 'lucide-react';
import { Category, MenuItem, Customer, Order } from '../types';
import { soundManager } from '../utils/soundManager';
import LiveOrderModal from '../components/LiveOrderModal';
import { useMobileBack } from '../hooks/useMobileBack';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { InstallPwaModal } from '../components/InstallPwaModal';
import LegalModal, { LegalDocType } from '../components/LegalModal';
import { CustomerAuthModal } from '../components/CustomerAuthModal';
import { CustomerProfileModal } from '../components/CustomerProfileModal';

interface PublicViewProps {
  categories: Category[];
  menuItems: MenuItem[];
  customers: Customer[];
  orders?: Order[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer?: (customer: Customer) => void;
  onAddOrder?: (order: Order) => void;
  onEnterControlPanel?: () => void;
  onViewDigitalTicket?: (order: Order) => void;
  isPreview?: boolean;
  isDarkMode?: boolean;
  setIsDarkMode?: (isDark: boolean) => void;
}

export default function PublicView({ categories, menuItems, customers, orders = [], onAddCustomer, onUpdateCustomer, onAddOrder, onEnterControlPanel, onViewDigitalTicket, isPreview, isDarkMode, setIsDarkMode }: PublicViewProps) {
  const { isInstalled, isIos, showInstructions, setShowInstructions, installApp } = usePwaInstall();
  const [showFloatingBanner, setShowFloatingBanner] = useState(false);
  const [hasTriggeredInstallBanner, setHasTriggeredInstallBanner] = useState(false);
  const [isBannerClosing, setIsBannerClosing] = useState(false);

  // Legal Modal State (Privacidad, Términos, Cookies)
  const [legalModalState, setLegalModalState] = useState<{ isOpen: boolean; doc: LegalDocType }>({
    isOpen: false,
    doc: 'privacy'
  });

  const handleDismissBanner = () => {
    soundManager.play('click');
    setIsBannerClosing(true);
    setTimeout(() => {
      setShowFloatingBanner(false);
      setIsBannerClosing(false);
    }, 350);
  };

  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || '');
  const [isScrolled, setIsScrolled] = useState(false);
  const [visibleItemsCount, setVisibleItemsCount] = useState(6);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Order Flow States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderStep, setOrderStep] = useState(1);
  const [selectedBaseDish, setSelectedBaseDish] = useState<MenuItem | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [selectedVariationsByDish, setSelectedVariationsByDish] = useState<Record<string, any>>({});
  const [selectedSides, setSelectedSides] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<MenuItem[]>([]);
  const [customerComments, setCustomerComments] = useState('');

  const [extraModalType, setExtraModalType] = useState<string | null>(null);
  const [viewingExtraItem, setViewingExtraItem] = useState<MenuItem | null>(null);
  const [viewingExtraVariation, setViewingExtraVariation] = useState<any>(null);

  const [quickSearch, setQuickSearch] = useState('');

  // Auth & Profile States
  const [loggedCustomer, setLoggedCustomer] = useState<Customer | null>(() => {
    try {
      const saved = localStorage.getItem('el_buen_servir_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authIntent, setAuthIntent] = useState<'order' | 'live' | 'profile'>('profile');
  const [isLiveOrderOpen, setIsLiveOrderOpen] = useState(false);

  // Delivery Choice States
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'table' | 'delivery' | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [isDeliverySelectionOpen, setIsDeliverySelectionOpen] = useState(false);

  const handleSetLoggedCustomer = (customer: Customer | null) => {
    setLoggedCustomer(customer);
    try {
      if (customer) {
        localStorage.setItem('el_buen_servir_customer', JSON.stringify(customer));
      } else {
        localStorage.removeItem('el_buen_servir_customer');
      }
    } catch {
      // ignore
    }
  };

  const handleUpdateCustomer = (updated: Customer) => {
    handleSetLoggedCustomer(updated);
    if (onUpdateCustomer) {
      onUpdateCustomer(updated);
    }
  };

  const handleLogout = () => {
    soundManager.play('click');
    handleSetLoggedCustomer(null);
    setIsProfileModalOpen(false);
  };

  const handleLoginSuccess = (customer: Customer) => {
    handleSetLoggedCustomer(customer);
    setIsAuthModalOpen(false);
    if (authIntent === 'order') {
      setIsDeliverySelectionOpen(true);
    } else if (authIntent === 'live') {
      setIsLiveOrderOpen(true);
    } else {
      setIsProfileModalOpen(true);
    }
  };

  const handleRegisterCustomer = (newCustomer: Customer) => {
    onAddCustomer(newCustomer);
    handleSetLoggedCustomer(newCustomer);
  };

  // Mobile Back Button Navigation Logic
  const hasOpenPublicModal = !!(extraModalType || isOrderModalOpen || isAuthModalOpen || isProfileModalOpen || isLiveOrderOpen || isDeliverySelectionOpen || isMobileMenuOpen);
  const handleClosePublicModal = () => {
    if (extraModalType) {
      setExtraModalType(null);
    } else if (isOrderModalOpen) {
      if (orderStep > 1) {
        setOrderStep(orderStep - 1);
      } else {
        setIsOrderModalOpen(false);
      }
    } else if (isProfileModalOpen) {
      setIsProfileModalOpen(false);
    } else if (isAuthModalOpen) {
      setIsAuthModalOpen(false);
    } else if (isLiveOrderOpen) {
      setIsLiveOrderOpen(false);
    } else if (isDeliverySelectionOpen) {
      setIsDeliverySelectionOpen(false);
    } else if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  useMobileBack({
    hasOpenModal: hasOpenPublicModal,
    onCloseModal: handleClosePublicModal,
    isRoot: true,
    confirmExitMessage: '¿Deseas salir de la aplicación?'
  });

  const sendWhatsAppOrder = (customer: Customer) => {
    const number = "2311024672";
    const orderId = `BS-${Math.random().toString(36).substr(2, 6).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    const total = (
      (selectedVariation?.price || 0) +
      selectedExtras.reduce((acc, e) => acc + Math.min(...e.variations.map(v => v.price)), 0)
    ).toFixed(2);

    let deliveryInfo = '';
    if (deliveryMethod === 'pickup') {
      deliveryInfo = `🏪 *Entrega:* Recoger en mostrador%0A`;
    } else if (deliveryMethod === 'table') {
      deliveryInfo = `🪑 *Entrega:* En mesa #${tableNumber}%0A`;
    } else if (deliveryMethod === 'delivery') {
      deliveryInfo = `🏠 *Entrega:* Domicilio - ${selectedAddress}%0A`;
    }

    const orderText = `*NUEVO PEDIDO EN LÍNEA - EL BUEN SERVIR*\n\n` +
      `🆔 *Orden:* #${orderId}\n` +
      `👤 *Cliente:* ${customer.name}\n` +
      `📱 *Teléfono:* ${customer.phone}\n` +
      deliveryInfo.replace(/%0A/g, '\n') +
      `🥘 *Platillo:* ${selectedBaseDish?.name}${selectedVariation ? ` (${selectedVariation.label} - $${selectedVariation.price})` : ''}\n` +
      (selectedSides.length > 0 ? `🥗 *Guarniciones:* ${selectedSides.join(', ')} (Sin costo)\n` : '') +
      (selectedExtras.length > 0 ? `🥤 *Adicionales:* ${selectedExtras.map(e => `${e.name}${e.variations?.[0] ? ` (${e.variations[0].label})` : ''}`).join(', ')}\n` : '') +
      (customerComments ? `📝 *Notas:* ${customerComments}\n` : '') +
      `\n💰 *TOTAL:* $${total}\n\n` +
      `🚀 _Enviado desde el sitio web_`;

    window.open(`https://wa.me/52${number}?text=${encodeURIComponent(orderText)}`, '_blank');

    if (onAddOrder) {
      const newOrder: Order = {
        id: orderId,
        customerName: customer.name,
        customerPhone: customer.phone,
        address: deliveryMethod === 'pickup' ? 'Recoger en mostrador' :
          deliveryMethod === 'table' ? `Mesa: ${tableNumber}` :
            selectedAddress,
        items: [
          {
            id: selectedBaseDish?.id || '',
            name: selectedBaseDish?.name || '',
            variationLabel: selectedVariation?.label || '',
            price: selectedVariation?.price || 0,
            quantity: 1
          },
          ...selectedExtras.map(extra => ({
            id: extra.id,
            name: extra.name,
            variationLabel: extra.variations[0].label,
            price: extra.variations[0].price,
            quantity: 1
          }))
        ],
        total: parseFloat(total),
        status: 'pending',
        paymentMethod: 'efectivo',
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
        source: 'online',
        notes: customerComments
      };
      onAddOrder(newOrder);
    }

    setIsOrderModalOpen(false);
    setOrderStep(1);
    setSelectedBaseDish(null);
    setSelectedSides([]);
    setSelectedExtras([]);
    setCustomerComments('');
    setDeliveryMethod(null);
    setTableNumber('');
    setSelectedAddress('');
  };

  useEffect(() => {
    setVisibleItemsCount(6);
  }, [activeCategory]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);

      // Trigger install banner notification when user has viewed 90% of the page
      if (!isInstalled && !hasTriggeredInstallBanner && !isPreview) {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        const totalScrollable = docHeight - windowHeight;

        if (totalScrollable > 80) {
          const scrollPercent = (scrollTop / totalScrollable) * 100;
          if (scrollPercent >= 90) {
            setHasTriggeredInstallBanner(true);
            setShowFloatingBanner(true);
            soundManager.play('notification');
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isInstalled, hasTriggeredInstallBanner, isPreview]);

  useEffect(() => {
    if (isInstalled) {
      setShowFloatingBanner(false);
    }
  }, [isInstalled]);

  const filteredItems = menuItems.filter(item => {
    if (!item.isActive) return false;
    if (activeCategory === 'cat-3') {
      return item.categoryId !== 'cat-1' && item.categoryId !== 'cat-2';
    }
    return item.categoryId === activeCategory;
  });

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white font-sans selection:bg-primary-200 transition-colors duration-300">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled || isPreview ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg py-4 border-b border-gray-100 dark:border-gray-800' : 'bg-transparent py-8'}`}>
        <div className="w-full mx-auto px-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => scrollToSection('inicio')}>
            <img
              src={`${(import.meta as any).env.BASE_URL}assets/logo_nuevo.png`}
              alt="El Buen Servir"
              className="w-12 h-12 rounded-2xl object-cover"
            />
            <div className="flex flex-col">
              <span className={`text-2xl font-black tracking-tighter leading-none ${isScrolled || isPreview ? 'text-gray-900 dark:text-white' : 'text-white'}`}>EL BUEN SERVIR</span>
              <span className={`text-[10px] font-bold tracking-[0.3em] uppercase ${isScrolled || isPreview ? 'text-primary-600' : 'text-primary-400'}`}>Desde 1994</span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-10 text-sm font-bold uppercase tracking-widest">
            {[
              { label: 'INICIO', id: 'inicio' },
              { label: 'NUESTRA HISTORIA', id: 'pasion-por-lo-que-hacemos' },
              { label: 'NUESTRO MENU', id: 'menu' },
              { label: 'CONTACTANOS', id: 'cta' }
            ].map(item => (
              <button
                key={item.label}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={`transition-all hover:text-primary-500 cursor-pointer ${isScrolled || isPreview ? 'text-gray-600 dark:text-gray-300' : 'text-white/80'}`}
              >
                {item.label}
              </button>
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

            {!isInstalled && (
              <button
                type="button"
                onClick={() => {
                  soundManager.play('click');
                  installApp();
                }}
                title="Instalar aplicación en tu dispositivo"
                className={`hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl border border-primary-500/40 transition-all hover:scale-105 active:scale-95 shadow-sm font-black text-xs uppercase tracking-wider cursor-pointer ${
                  isScrolled || isPreview
                    ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-500 dark:hover:text-white'
                    : 'bg-white/10 text-white hover:bg-primary-500 backdrop-blur-md'
                }`}
              >
                <Download className="w-4 h-4 text-primary-500" />
                <span>Instalar App</span>
              </button>
            )}

            {/* Customer Profile / Login Button */}
            {loggedCustomer ? (
              <button
                type="button"
                onClick={() => {
                  soundManager.play('click');
                  setIsProfileModalOpen(true);
                }}
                title={`Mi Perfil (${loggedCustomer.name})`}
                className={`flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${
                  isScrolled || isPreview
                    ? 'bg-white dark:bg-gray-900 border-primary-500/40 text-gray-900 dark:text-white hover:border-primary-500 shadow-primary-500/5'
                    : 'bg-white/15 backdrop-blur-md border-white/30 text-white hover:bg-white/25'
                }`}
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-primary-500 bg-primary-100 dark:bg-primary-950 flex items-center justify-center shrink-0">
                  {loggedCustomer.avatarUrl ? (
                    <img
                      src={loggedCustomer.avatarUrl}
                      alt={loggedCustomer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-black text-primary-600 dark:text-primary-400">
                      {loggedCustomer.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-black truncate max-w-[100px] leading-tight">
                    {loggedCustomer.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] font-bold text-primary-500 dark:text-primary-400 uppercase tracking-wider leading-none">
                    Mi Cuenta
                  </span>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundManager.play('click');
                  setAuthIntent('profile');
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                }}
                title="Iniciar sesión de cliente"
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl border transition-all hover:scale-105 active:scale-95 shadow-sm font-black text-xs uppercase tracking-wider cursor-pointer ${
                  isScrolled || isPreview
                    ? 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 hover:border-primary-500 hover:text-primary-500'
                    : 'border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md'
                }`}
              >
                <User className="w-4 h-4 text-primary-500" />
                <span className="hidden sm:inline">Entrar</span>
              </button>
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
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" /> }
            </button>
          </div>
        </div >

        {/* Mobile menu panel */}
        {
          isMobileMenuOpen && (
            <div className="lg:hidden absolute top-full left-0 w-full bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 p-8 shadow-2xl animate-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col space-y-6">
                {/* Mobile Customer Profile Card */}
                {loggedCustomer ? (
                  <div className="p-4 bg-gradient-to-r from-primary-500/10 via-amber-500/5 to-transparent border border-primary-500/20 rounded-[24px] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.play('click');
                        setIsMobileMenuOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="flex items-center gap-3 text-left cursor-pointer flex-1"
                    >
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary-500 bg-primary-100 dark:bg-primary-950 flex items-center justify-center shrink-0">
                        {loggedCustomer.avatarUrl ? (
                          <img
                            src={loggedCustomer.avatarUrl}
                            alt={loggedCustomer.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-base font-black text-primary-600 dark:text-primary-400">
                            {loggedCustomer.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{loggedCustomer.name}</p>
                        <p className="text-[10px] font-bold text-primary-500 uppercase tracking-wider">Mi Perfil & Historial</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      title="Cerrar sesión"
                      className="p-2 text-gray-400 hover:text-red-500 rounded-xl"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.play('click');
                      setIsMobileMenuOpen(false);
                      setAuthIntent('profile');
                      setAuthMode('login');
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-950/40 border border-primary-500/30 rounded-[24px] text-left cursor-pointer hover:border-primary-500 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center shadow-md shadow-primary-500/30">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">Iniciar Sesión de Cliente</p>
                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Accede a tus pedidos y direcciones</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 bg-primary-500 text-white rounded-xl shadow-sm">
                      Entrar
                    </span>
                  </button>
                )}

                <hr className="border-gray-100 dark:border-gray-800" />
                {[
                  { label: 'INICIO', id: 'inicio' },
                  { label: 'NUESTRA HISTORIA', id: 'pasion-por-lo-que-hacemos' },
                  { label: 'NUESTRO MENU', id: 'menu' },
                  { label: 'CONTACTANOS', id: 'cta' }
                ].map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      scrollToSection(item.id);
                    }}
                    className="text-left text-2xl font-black uppercase tracking-tighter text-gray-900 dark:text-white hover:text-primary-500 transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
                <hr className="border-gray-50 dark:border-gray-800" />
                
                {!isInstalled && (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.play('click');
                      setIsMobileMenuOpen(false);
                      installApp();
                    }}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-primary-500/15 via-amber-500/10 to-primary-500/5 dark:from-primary-500/20 dark:via-amber-500/15 dark:to-primary-500/10 border border-primary-500/30 rounded-[24px] text-left hover:scale-[1.01] active:scale-98 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center shadow-md shadow-primary-500/30">
                        <Download className="w-5 h-5 animate-bounce" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">Instalar Aplicación</p>
                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Acceso directo desde tu pantalla de inicio</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 bg-primary-500 text-white rounded-xl shadow-sm">
                      Instalar
                    </span>
                  </button>
                )}

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-[24px]">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isDarkMode ? 'bg-primary-500/20 text-primary-400' : 'bg-amber-100 text-amber-600'}`}>
                      {isDarkMode ? <Zap className="w-5 h-5 animate-pulse" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">Modo {isDarkMode ? 'Oscuro' : 'Claro'}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Personaliza tu vista</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      soundManager.play('click');
                      if (setIsDarkMode) setIsDarkMode(!isDarkMode);
                    }}
                    className={`relative w-14 h-8 rounded-full transition-all duration-500 p-1 flex items-center ${isDarkMode ? 'bg-primary-500' : 'bg-gray-200'}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-500 flex items-center justify-center ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}>
                      {isDarkMode ? <Monitor className="w-3.5 h-3.5 text-primary-600" /> : <Zap className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setOrderStep(1);
                    setIsOrderModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-primary-500 text-white py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/30 active:scale-95 transition-all"
                >
                  Ordenar ahora
                </button>

                <button
                  disabled
                  className="w-full bg-gray-100 dark:bg-gray-800 text-gray-400 py-5 rounded-[24px] font-black uppercase tracking-widest flex items-center justify-center gap-3 cursor-not-allowed opacity-60"
                >
                  <Mic className="w-5 h-5" />
                  Sofía AI (Próximamente)
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
                <p className="text-xl text-black/70 dark:text-white/70 mb-6 max-w-xl leading-relaxed font-medium">
                  Cada plato cuenta una historia. Descubre la fusión perfecta entre técnicas tradicionales y una visión culinaria moderna.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button
                    type="button"
                    onClick={() => scrollToSection('menu')}
                    className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white px-12 py-6 rounded-3xl text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary-500/40 transition-all hover:-translate-y-1 active:scale-95 text-center cursor-pointer"
                  >
                    Descubrir Menú
                  </button>
                  <button
                    onClick={() => {
                      setOrderStep(1);
                      setIsOrderModalOpen(true);
                    }}
                    className="w-full sm:w-auto group flex items-center justify-center gap-3 bg-white text-gray-900 px-10 py-6 rounded-3xl text-lg font-black uppercase tracking-widest shadow-2xl shadow-white/30 transition-all hover:-translate-y-1 hover:bg-primary-500 hover:text-white active:scale-95 cursor-pointer"
                  >
                    <ShoppingBag className="w-6 h-6" />
                    <span>Ordenar en Línea</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('pasion-por-lo-que-hacemos')}
                    className="w-full sm:w-auto group flex items-center justify-center space-x-4 bg-white/5 backdrop-blur-md border border-white/20 text-primary-500 px-8 py-6 rounded-3xl text-base font-bold hover:bg-white/10 transition-all cursor-pointer"
                    aria-label="Ir a Nuestra Historia"
                  >
                    <span>Nuestra Historia</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            <div
              onClick={() => scrollToSection('pasion-por-lo-que-hacemos')}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce flex flex-col items-center cursor-pointer"
            >
              <span className="text-white/50 text-[10px] font-bold uppercase tracking-[0.4em] mb-4">Deslizar</span>
              <ChevronDown className="w-6 h-6 text-white/50" />
            </div>
          </section>
        )
      }

      {/* Featured Section */}
      <section id="pasion-por-lo-que-hacemos" className="py-24 px-6 md:px-12 bg-white dark:bg-gray-900 overflow-hidden">
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
      <section id="menu" className={`py-24 px-6 relative transition-colors duration-300 ${isPreview ? 'bg-white dark:bg-gray-950' : 'bg-[#FDFDFD] dark:bg-gray-950'}`}>
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
          <div className="flex justify-center flex-wrap gap-2.5 sm:gap-3 mb-16 md:mb-20">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-7 sm:px-9 py-3 sm:py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 border-2 cursor-pointer ${activeCategory === cat.id
                  ? 'bg-gray-900 text-white border-gray-900 dark:bg-primary-500 dark:text-white dark:border-primary-500 shadow-xl shadow-black/10 dark:shadow-primary-500/25 scale-105'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-800 hover:border-primary-400 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {filteredItems.length > 0 ? (
              <>
                {filteredItems.slice(0, visibleItemsCount).map(item => {
                  const activeVariation = selectedVariationsByDish[item.id] || item.variations[0];
                  const currentPrice = activeVariation?.price ?? item.variations[0]?.price ?? 0;

                  return (
                    <div key={item.id} className="group relative p-6 sm:p-7 rounded-[32px] bg-white dark:bg-gray-900/70 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl dark:hover:border-gray-700 transition-all duration-300 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-baseline mb-2">
                          <h4 className="text-xl sm:text-2xl font-black group-hover:text-primary-500 transition-colors uppercase tracking-tight text-gray-900 dark:text-white">
                            {item.name}
                          </h4>
                          <div className="flex-1 mx-3 border-b-2 border-dotted border-gray-200 dark:border-gray-700"></div>
                          <span className="text-2xl font-black text-primary-500 dark:text-primary-400">
                            ${currentPrice.toFixed(2)}
                          </span>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-5 italic">
                          {item.description}
                        </p>

                        {/* Interactive Variation Selector */}
                        <div className="space-y-2 mb-6">
                          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-400">
                            <span>Variantes:</span>
                            {activeVariation && (
                              <span className="text-primary-600 dark:text-primary-400 font-bold">
                                Seleccionada: {activeVariation.label}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.variations.map(v => {
                              const isSelected = activeVariation?.id === v.id;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedVariationsByDish(prev => ({ ...prev, [item.id]: v }));
                                    soundManager.play('click');
                                  }}
                                  title={`Seleccionar variante ${v.label} ($${v.price})`}
                                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer border ${isSelected
                                    ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/25 ring-2 ring-primary-500/30 dark:ring-primary-400/40 scale-105'
                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-300'
                                    }`}
                                >
                                  <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {v.label}
                                  </span>
                                  <span className={`font-black ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    ${v.price.toFixed(2)}
                                  </span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedBaseDish(item);
                          setSelectedVariation(activeVariation);
                          setOrderStep(2);
                          setIsOrderModalOpen(true);
                        }}
                        className="w-full py-3.5 sm:py-4 bg-gray-50 dark:bg-gray-800 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-500 text-gray-700 dark:text-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 cursor-pointer shadow-sm active:scale-98 group/btn"
                      >
                        <Plus className="w-4 h-4 text-primary-500 dark:text-primary-400 group-hover/btn:text-white transition-colors" />
                        <span>Ordenar {activeVariation ? `(${activeVariation.label})` : 'Ahora'}</span>
                      </button>
                    </div>
                  );
                })}

                {filteredItems.length > visibleItemsCount && (
                  <div className="col-span-full flex justify-center mt-12">
                    <button
                      onClick={() => setVisibleItemsCount(prev => prev + 6)}
                      className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full font-black text-xs uppercase tracking-widest text-gray-900 dark:text-white hover:border-primary-500 dark:hover:border-primary-400 hover:text-primary-500 dark:hover:text-primary-400 transition-all shadow-xl hover:shadow-primary-500/10 active:scale-95 cursor-pointer"
                    >
                      Mostrar más platillos ({filteredItems.length - visibleItemsCount} restantes)
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="col-span-full text-center py-24 sm:py-32 bg-gray-50 dark:bg-gray-900/60 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-gray-800">
                <Utensils className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
                <p className="text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest">Aún no hay especialidades en esta categoría</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {
        !isPreview && (
          <section id="cta" className="py-20 md:py-28 px-4 sm:px-6 md:px-12 relative bg-white dark:bg-gray-950 transition-colors duration-300">
            <div className="w-full max-w-6xl mx-auto bg-gradient-to-br from-amber-50/90 via-white to-primary-50/70 dark:from-gray-900/95 dark:via-gray-950 dark:to-gray-900/90 rounded-[40px] md:rounded-[56px] p-8 sm:p-12 md:p-20 relative overflow-hidden flex flex-col items-center text-center border-2 border-primary-200/70 dark:border-white/10 shadow-2xl shadow-primary-900/5 dark:shadow-[0_0_80px_rgba(16,185,129,0.15)] backdrop-blur-2xl transition-all duration-300">
              
              {/* Dynamic Ambient Glows */}
              <div className="absolute -top-32 -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-primary-500/10 dark:bg-primary-500/15 rounded-full blur-[100px] md:blur-[120px] pointer-events-none"></div>
              <div className="absolute -bottom-32 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-emerald-500/10 dark:bg-emerald-500/25 rounded-full blur-[100px] md:blur-[120px] pointer-events-none"></div>
              
              {/* Subtle Tech / Pattern Texture */}
              <div className="absolute inset-0 bg-[radial-gradient(#f59e0b25_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-60 dark:opacity-80"></div>

              <div className="relative z-10 max-w-3xl flex flex-col items-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200/80 dark:border-emerald-400/30 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-widest mb-6 shadow-sm dark:shadow-[0_0_20px_rgba(16,185,129,0.2)] backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
                  <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                  <span>Menú Digital • Pedidos a WhatsApp</span>
                </div>

                {/* Title */}
                <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white mb-6 md:mb-8 tracking-tighter leading-tight">
                  ¿Listo para una <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-primary-600 to-emerald-600 dark:from-emerald-300 dark:via-teal-200 dark:to-primary-400 font-serif italic font-normal">experiencia digital</span> con nuestro menú?
                </h2>

                {/* Subtitle */}
                <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 md:mb-10 leading-relaxed max-w-2xl font-medium">
                  Explora nuestros platillos, arma tu pedido en segundos desde el menú digital y envíalo directamente a nuestro WhatsApp sin filas ni demoras.
                </p>

                {/* Micro-feature pills */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-10 md:mb-12">
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/90 dark:bg-white/5 border border-amber-200/80 dark:border-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold shadow-sm shadow-amber-900/5 backdrop-blur-sm">
                    <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />
                    <span>Sin registros ni apps</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/90 dark:bg-white/5 border border-amber-200/80 dark:border-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold shadow-sm shadow-amber-900/5 backdrop-blur-sm">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
                    <span>Precios y menú en vivo</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/90 dark:bg-white/5 border border-amber-200/80 dark:border-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold shadow-sm shadow-amber-900/5 backdrop-blur-sm">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
                    <span>Atención inmediata</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setOrderStep(1);
                      setIsOrderModalOpen(true);
                    }}
                    className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-gradient-to-r dark:from-emerald-500 dark:to-emerald-600 dark:text-white dark:hover:from-emerald-400 dark:hover:to-emerald-500 px-8 sm:px-12 py-5 sm:py-6 rounded-3xl text-sm sm:text-base md:text-lg font-black uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/25 dark:shadow-[0_0_35px_rgba(16,185,129,0.35)] dark:hover:shadow-[0_0_50px_rgba(16,185,129,0.55)] dark:border dark:border-emerald-400/30 flex items-center justify-center gap-3 cursor-pointer group"
                  >
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:scale-110 transition-transform" />
                    <span>Ordenar por WhatsApp</span>
                  </button>

                  <a 
                    href="tel:+522311808272" 
                    className="w-full sm:w-auto flex items-center justify-center space-x-3 px-6 py-4 sm:py-5 rounded-3xl bg-white hover:bg-amber-50/70 dark:bg-white/5 dark:hover:bg-white/10 border-2 border-amber-200/80 hover:border-emerald-400 dark:border-white/10 text-gray-800 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-300 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md shadow-amber-900/5 group"
                  >
                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-emerald-100 dark:bg-white/10 rounded-full flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-300" />
                    </div>
                    <span className="text-sm sm:text-base font-bold">+522311808272</span>
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
                    <img src={`${(import.meta as any).env.BASE_URL}assets/logo_pie.png`} alt="Logo pie" className="w-10 h-10 rounded-xl object-cover mr-3" />
                    <span className="text-2xl font-black tracking-tighter dark:text-white uppercase">El Buen Servir</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-10 italic">
                    "Donde cada bocado cuenta una historia de tradición y excelencia culinaria."
                  </p>
                  <div className="flex space-x-3">
                    {[{ Icon: Instagram, label: 'Instagram' }, { Icon: Facebook, label: 'Facebook' }, { Icon: Phone, label: 'Teléfono' }].map(({ Icon, label }, i) => (
                      <a key={i} href="#" onClick={(e) => e.preventDefault()} title={label} className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary-500 transition-all hover:-translate-y-1">
                        <Icon className="w-5 h-5" />
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-black mb-8 text-xs uppercase tracking-[0.3em] text-gray-900 dark:text-white">Menú Rápido</h5>
                  <ul className="space-y-4 text-sm font-bold text-gray-500 dark:text-gray-400">
                    {[
                      { label: 'INICIO', id: 'inicio' },
                      { label: 'NUESTRA HISTORIA', id: 'pasion-por-lo-que-hacemos' },
                      { label: 'NUESTRO MENU', id: 'menu' },
                      { label: 'CONTACTANOS', id: 'cta' }
                    ].map(item => (
                      <li key={item.label}>
                        <button
                          type="button"
                          onClick={() => scrollToSection(item.id)}
                          className="hover:text-primary-500 transition-colors cursor-pointer text-left"
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-black mb-8 text-xs uppercase tracking-[0.3em] text-gray-900 dark:text-white">Ubicación</h5>
                  <div className="space-y-6 text-sm">
                    <p className="text-gray-500 dark:text-gray-400 flex items-start">
                      <MapPin className="w-5 h-5 mr-4 text-primary-500 flex-shrink-0" />
                      <span>Mercado Filomeno Mata Local #67<br />16 de Septiembre<br />73800 Teziutlán Puebla</span>
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 flex items-start">
                      <Phone className="w-5 h-5 mr-4 text-primary-500 flex-shrink-0" />
                      <span>Resv: +522311808272</span>
                    </p>
                  </div>
                </div>

                <div>
                  <h5 className="font-black mb-8 text-xs uppercase tracking-[0.3em] text-gray-900 dark:text-white">Horarios</h5>
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-primary-500" />
                          <span>Lunes a Domingo</span>
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Todos los días
                        </span>
                      </div>
                      <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        9:00 a.m. – 5:30 p.m.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0"></span>
                      <span>Servicio continuo en comedor y pedidos por WhatsApp.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-900 pt-12 flex flex-col md:flex-row justify-between items-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                <p>&copy; {new Date().getFullYear()} El Buen Servir. Todos los derechos reservados.</p>
                <div className="flex space-x-8 mt-6 md:mt-0">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.play('click');
                      setLegalModalState({ isOpen: true, doc: 'privacy' });
                    }}
                    className="hover:text-primary-500 transition-colors uppercase cursor-pointer"
                  >
                    Privacidad
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.play('click');
                      setLegalModalState({ isOpen: true, doc: 'terms' });
                    }}
                    className="hover:text-primary-500 transition-colors uppercase cursor-pointer"
                  >
                    Términos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.play('click');
                      setLegalModalState({ isOpen: true, doc: 'cookies' });
                    }}
                    className="hover:text-primary-500 transition-colors uppercase cursor-pointer"
                  >
                    Cookies
                  </button>
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
                    {/* Busqueda Rapida */}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar platillo..."
                        value={quickSearch}
                        onChange={(e) => setQuickSearch(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary-500 rounded-2xl pl-12 pr-4 py-3 font-bold text-gray-700 dark:text-white outline-none transition-all"
                      />
                    </div>

                    {categories.filter(cat => cat.id === 'cat-3').map(cat => (
                      <div key={cat.id} className="space-y-4">
                        <h5 className="text-xs font-black text-primary-500 uppercase tracking-[0.2em]">{cat.name}</h5>
                        <div className="grid grid-cols-1 gap-3">
                          {menuItems
                            .filter(item =>
                              item.categoryId !== 'cat-1' &&
                              item.categoryId !== 'cat-2' &&
                              item.isActive &&
                              item.name.toLowerCase().includes(quickSearch.toLowerCase())
                            )
                            .map(item => (
                              <div
                                key={item.id}
                                className="p-5 bg-gray-50 dark:bg-gray-800/80 rounded-3xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all"
                              >
                                <div className="mb-4">
                                  <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-lg">{item.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-300 italic mt-1">{item.description}</p>
                                </div>

                                <div className="space-y-1.5">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-400 block">
                                    Selecciona tu variante:
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {item.variations.map(v => {
                                      const isChosen = selectedBaseDish?.id === item.id && selectedVariation?.id === v.id;
                                      return (
                                        <button
                                          key={v.id}
                                          onClick={() => {
                                            setSelectedBaseDish(item);
                                            setSelectedVariation(v);
                                            setOrderStep(2);
                                          }}
                                          className={`flex-grow sm:flex-grow-0 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border transition-all cursor-pointer group/var ${isChosen
                                            ? 'bg-primary-500 text-white border-primary-500 shadow-md ring-2 ring-primary-500/30'
                                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 text-gray-700 dark:text-gray-200'
                                            }`}
                                        >
                                          <span className={`text-xs font-black uppercase tracking-wide ${isChosen ? 'text-white' : 'text-gray-700 dark:text-gray-200 group-hover/var:text-primary-500'}`}>{v.label}</span>
                                          <span className={`text-sm font-black ${isChosen ? 'text-white' : 'text-gray-900 dark:text-white group-hover/var:text-primary-500'}`}>${v.price}</span>
                                          {isChosen && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            ))}
                          {menuItems.filter(item => item.categoryId !== 'cat-1' && item.categoryId !== 'cat-2' && item.isActive && item.name.toLowerCase().includes(quickSearch.toLowerCase())).length === 0 && (
                            <p className="text-center text-gray-400 italic py-4">No se encontraron platillos con ese nombre.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Step 2: Accompaniment Selection */}
                {orderStep === 2 && selectedBaseDish && (
                  <div className="space-y-8">
                    <div className="bg-primary-50 dark:bg-primary-950/40 p-6 rounded-3xl border border-primary-100 dark:border-primary-900/60">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <p className="text-xs font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">Platillo seleccionado</p>
                        {selectedVariation && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500 text-white text-xs font-black uppercase shadow-sm">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            Variante: {selectedVariation.label} • ${selectedVariation.price}
                          </span>
                        )}
                      </div>
                      <h4 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{selectedBaseDish.name}</h4>

                      {/* Switch variation in Step 2 if multiple available */}
                      {selectedBaseDish.variations.length > 1 && (
                        <div className="mt-4 pt-4 border-t border-primary-100/60 dark:border-primary-900/40">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-300 mb-2 block">
                            Cambiar variante seleccionada:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {selectedBaseDish.variations.map((v: any) => {
                              const isSelected = selectedVariation?.id === v.id;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => setSelectedVariation(v)}
                                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
                                    isSelected
                                      ? 'bg-primary-500 text-white border-primary-500 shadow-md ring-2 ring-primary-500/30'
                                      : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-primary-400'
                                  }`}
                                >
                                  <span>{v.label}</span>
                                  <span className="opacity-90">${v.price}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-3">✨ Las guarniciones no tienen costo extra.</p>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs font-black text-gray-500 dark:text-gray-300 uppercase tracking-widest ml-1">¿Con qué se va a acompañar?</p>
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
                            className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all font-bold text-sm cursor-pointer ${selectedSides.includes(side)
                              ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-100 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-500'
                              }`}
                          >
                            <span>{side}</span>
                            {selectedSides.includes(side) ? <Check className="w-5 h-5" /> : <Plus className="w-4 h-4 opacity-50 dark:opacity-70 text-gray-400 dark:text-gray-300" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-500 dark:text-gray-300 uppercase tracking-widest ml-1">Instrucciones Especiales</label>
                      <textarea
                        value={customerComments}
                        onChange={e => setCustomerComments(e.target.value)}
                        placeholder="Ej. Sin cebolla, término medio, etc..."
                        className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-primary-500 rounded-3xl p-6 outline-none transition-all font-bold text-sm min-h-[120px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Drinks & Desserts */}
                {orderStep === 3 && (
                  <div className="space-y-6 text-center py-6">
                    <div className="inline-flex p-4 bg-amber-50 dark:bg-amber-950/30 rounded-3xl mb-4">
                      <Award className="w-12 h-12 text-amber-500" />
                    </div>
                    <h4 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">¿Deseas algo más?</h4>
                    <p className="text-gray-500 dark:text-gray-400 font-bold max-w-sm mx-auto mb-8">Te sugerimos acompañar tu plato con una de nuestras bebidas o postres artesanales.</p>

                    <div className="space-y-4">
                      {categories
                        .filter(cat => !['cat-3', 'cat-5', 'cat-caldos', 'cat-cerdo', 'cat-pollo', 'cat-carnes', 'cat-mariscos', 'cat-desayunos'].includes(cat.id))
                        .map(cat => (
                          <div key={cat.id} className="space-y-2">
                            <button
                              onClick={() => setExtraModalType(cat.id === 'cat-2' ? 'drinks' : cat.id === 'cat-1' ? 'desserts' : null)} // Currently mapping manually, eventually should be dynamic based on category type
                              className={`w-full flex items-center justify-between p-6 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-3xl hover:border-primary-500 transition-all shadow-sm hover:shadow-xl group
                                ${cat.id === 'cat-2' ? 'hover:border-amber-500' : ''}
                                ${cat.id === 'cat-1' ? 'hover:border-pink-500' : ''}
                              `}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform
                                   ${cat.id === 'cat-2' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                                    cat.id === 'cat-1' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' :
                                      'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'}
                                `}>
                                  {cat.id === 'cat-2' ? <ShoppingBag className="w-6 h-6" /> :
                                    cat.id === 'cat-1' ? <Heart className="w-6 h-6" /> :
                                      <Utensils className="w-6 h-6" />}
                                </div>
                                <div className="text-left">
                                  <h5 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-sm">{cat.name}</h5>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Toca para elegir</p>
                                </div>
                              </div>
                              <ChevronRight className={`w-5 h-5 text-gray-300 transition-colors
                                  ${cat.id === 'cat-2' ? 'group-hover:text-amber-500' :
                                  cat.id === 'cat-1' ? 'group-hover:text-pink-500' :
                                    'group-hover:text-primary-500'}
                              `} />
                            </button>

                            {selectedExtras.filter(e => e.categoryId === cat.id).length > 0 && (
                              <div className="flex flex-wrap gap-2 px-2">
                                {selectedExtras.filter(e => e.categoryId === cat.id).map(item => (
                                  <span key={item.id} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-2
                                       ${cat.id === 'cat-2' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                      cat.id === 'cat-1' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400' :
                                        'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'}
                                    `}>
                                    {item.name}
                                    <button onClick={() => setSelectedExtras(prev => prev.filter(p => p.id !== item.id))} className="hover:opacity-70" aria-label={`Eliminar ${item.name}`}><X className="w-3 h-3" /></button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}


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
                      <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2 italic">Confirmación Final</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-[32px] overflow-hidden border border-gray-100 dark:border-gray-700">
                      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <div>
                          <span className="font-black text-gray-900 dark:text-white uppercase text-base block">{selectedBaseDish.name}</span>
                          {selectedVariation && (
                            <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-primary-600 dark:text-primary-400 uppercase">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              Variante: {selectedVariation.label}
                            </span>
                          )}
                        </div>
                        <span className="font-black text-primary-500 dark:text-primary-400 text-xl">${selectedVariation?.price.toFixed(2)}</span>
                      </div>

                      {selectedSides.length > 0 && (
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50">
                          <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Guarniciones (Sin Costo):</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedSides.map(side => (
                              <span key={side} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black rounded-lg uppercase">{side}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedExtras.length > 0 && (
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                          <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Adicionales:</p>
                          <div className="space-y-2">
                            {selectedExtras.map(extra => (
                              <div key={extra.id} className="flex justify-between items-center text-sm font-bold text-gray-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                  <span>{extra.name}</span>
                                  {extra.variations && extra.variations[0] && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                                      ({extra.variations[0].label})
                                    </span>
                                  )}
                                </div>
                                <span className="font-extrabold text-primary-500 dark:text-primary-400">${Math.min(...extra.variations.map(v => v.price)).toFixed(2)}</span>
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
                      className="px-8 py-5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer"
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
                      className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-3xl font-black uppercase text-xs tracking-widest transition-all shadow-xl cursor-pointer ${orderStep === 1 && !selectedBaseDish
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'bg-gray-900 dark:bg-primary-500 text-white hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                    >
                      <span>{orderStep === 1 ? 'Continuar' : 'Siguiente Paso'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (!loggedCustomer) {
                          setAuthIntent('order');
                          setIsAuthModalOpen(true);
                          return;
                        }
                        setIsDeliverySelectionOpen(true);
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

      {/* Selection Modal (Drinks/Desserts) */}
      {
        extraModalType && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setExtraModalType(null)}></div>
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                <div>
                  <h4 className="font-black text-xl text-gray-900 dark:text-white uppercase tracking-tighter">
                    {extraModalType === 'drinks' ? 'Seleccionar Bebidas' : 'Seleccionar Postres'}
                  </h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Elige tus favoritos</p>
                </div>
                <button onClick={() => setExtraModalType(null)} className="p-2 bg-white dark:bg-gray-800 text-gray-400 rounded-xl hover:text-red-500 transition-colors" aria-label="Cerrar modal">
                  <X className="w-5 h-5" />
                </button>

              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="grid grid-cols-1 gap-3">
                  {menuItems
                    .filter(item => {
                      if (extraModalType === 'drinks' || extraModalType === 'cat-2') return ['cat-2', 'cat-bebidas'].includes(item.categoryId) && item.isActive;
                      if (extraModalType === 'desserts' || extraModalType === 'cat-1') return ['cat-1', 'cat-postres'].includes(item.categoryId) && item.isActive;
                      // Allow other categories if dynamic
                      return item.categoryId === extraModalType && item.isActive;
                    })
                    .map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setViewingExtraItem(item);
                          setViewingExtraVariation(item.variations[0]);
                        }}

                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-700 hover:border-gray-300`}
                      >
                        <div className="text-left">
                          <p className="font-black text-xs uppercase tracking-tight">{item.name}</p>
                          <p className="text-[10px] font-bold opacity-70 uppercase mt-0.5 text-primary-500">Toca para elegir</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    ))
                  }
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <button
                  onClick={() => setExtraModalType(null)}
                  className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Item Details Modal (Level 2) */}
      {
        viewingExtraItem && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setViewingExtraItem(null)}></div>
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h4 className="font-black text-xl text-gray-900 dark:text-white uppercase tracking-tighter">{viewingExtraItem.name}</h4>
                <button onClick={() => setViewingExtraItem(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" aria-label="Cerrar detalle">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <p className="text-gray-600 dark:text-gray-300 text-sm italic">{viewingExtraItem.description || "Deliciosa opción para acompañar tus alimentos."}</p>

                {/* Variation Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-300 ml-1">
                    <span>Elige una opción:</span>
                    {viewingExtraVariation && (
                      <span className="text-primary-600 dark:text-primary-400 font-bold">
                        Seleccionada: {viewingExtraVariation.label}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {viewingExtraItem.variations.map(variation => {
                      const isSelected = viewingExtraVariation?.id === variation.id;
                      return (
                        <button
                          key={variation.id}
                          onClick={() => setViewingExtraVariation(variation)}
                          className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer
                              ${isSelected
                              ? 'bg-primary-500 text-white border-primary-500 shadow-lg ring-2 ring-primary-500/30'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-500'}
                            `}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-xs uppercase tracking-wide">{variation.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                          </div>
                          <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            ${variation.price.toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <span className="font-black text-gray-900 dark:text-white uppercase text-sm">Precio Final</span>
                  <span className="font-black text-primary-500 dark:text-primary-400 text-xl">${viewingExtraVariation?.price.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                <button
                  onClick={() => {
                    if (viewingExtraVariation) {
                      // Store item with ONLY the selected variation to simplify price calculation later
                      const itemWithSelectedVariation = {
                        ...viewingExtraItem,
                        variations: [viewingExtraVariation]
                      };
                      setSelectedExtras(prev => [...prev, itemWithSelectedVariation]);
                      setViewingExtraItem(null);
                      setViewingExtraVariation(null);
                      setExtraModalType(null); // Return to main flow
                    }
                  }}
                  disabled={!viewingExtraVariation}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer
                       ${viewingExtraVariation
                      ? 'bg-emerald-500 text-white hover:scale-[1.02] active:scale-[0.98] shadow-emerald-500/20'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed shadow-none'}
                     `}
                >
                  <Check className="w-5 h-5" />
                  Agregar y Continuar
                </button>
              </div>

            </div>
          </div>
        )
      }

      {/* Live Order Modal (Sofia AI) */}
      <LiveOrderModal
        isOpen={isLiveOrderOpen}
        onClose={() => setIsLiveOrderOpen(false)}
        menuItems={menuItems}
        categories={categories}
        onAddOrder={onAddOrder}
        loggedCustomer={loggedCustomer}
        onOpenAuth={() => {
          setAuthIntent('live');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Customer Authentication Modal */}
      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        customers={customers}
        onLoginSuccess={handleLoginSuccess}
        onRegisterCustomer={handleRegisterCustomer}
        initialMode={authMode}
      />

      {/* Customer Profile & Order History Modal */}
      {loggedCustomer && (
        <CustomerProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          customer={loggedCustomer}
          orders={orders || []}
          onUpdateCustomer={handleUpdateCustomer}
          onLogout={handleLogout}
          onViewDigitalTicket={onViewDigitalTicket}
          onRepeatOrder={() => {
            setIsProfileModalOpen(false);
            setOrderStep(1);
            setIsOrderModalOpen(true);
          }}
        />
      )}

      {/* Delivery Selection Modal */}
      {isDeliverySelectionOpen && loggedCustomer && (
        <div className="fixed inset-0 z-[610] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsDeliverySelectionOpen(false)}></div>
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
              <div>
                <h4 className="font-black text-2xl text-gray-900 dark:text-white uppercase tracking-tighter">¿Cómo recibes tu pedido?</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Selecciona una opción de entrega</p>
              </div>
              <button
                title="Cerrar selección de entrega"
                onClick={() => setIsDeliverySelectionOpen(false)}
                className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-xl hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${deliveryMethod === 'pickup' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200'}`}
                >
                  <div className={`p-3 rounded-xl transition-colors ${deliveryMethod === 'pickup' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                    <Store className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-sm uppercase dark:text-white tracking-tight">Recoger en Mostrador</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sin costo adicional</p>
                  </div>
                </button>

                <button
                  onClick={() => setDeliveryMethod('table')}
                  className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${deliveryMethod === 'table' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200'}`}
                >
                  <div className={`p-3 rounded-xl transition-colors ${deliveryMethod === 'table' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                    <Utensils className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-sm uppercase dark:text-white tracking-tight">Consumo en Mesa</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Para comer aquí</p>
                  </div>
                </button>

                <button
                  onClick={() => setDeliveryMethod('delivery')}
                  className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${deliveryMethod === 'delivery' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200'}`}
                >
                  <div className={`p-3 rounded-xl transition-colors ${deliveryMethod === 'delivery' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                    <Truck className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-sm uppercase dark:text-white tracking-tight">Envío a Domicilio</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Llegamos hasta tu puerta</p>
                  </div>
                </button>
              </div>

              {deliveryMethod === 'table' && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-gray-500 dark:text-gray-300 uppercase tracking-widest ml-1">¿Qué mesa ocupas?</label>
                  <input
                    type="number"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none transition-all dark:text-white font-black text-xl text-center"
                    placeholder="Escribe el número"
                  />
                </div>
              )}

              {deliveryMethod === 'delivery' && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-gray-500 dark:text-gray-300 uppercase tracking-widest ml-1">Dirección de entrega</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                    {loggedCustomer.addresses?.map((addr, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedAddress(addr)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedAddress === addr ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm' : 'border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700'}`}
                      >
                        <p className="text-xs font-bold truncate tracking-tight">{addr}</p>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newAddr = prompt("Nueva dirección:");
                        if (newAddr) setSelectedAddress(newAddr);
                      }}
                      className="w-full p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400 hover:border-primary-300 dark:hover:border-primary-500 hover:text-primary-500 dark:hover:text-primary-400 transition-all font-bold text-[10px] uppercase tracking-widest cursor-pointer"
                    >
                      + Agregar Nueva Dirección
                    </button>
                  </div>
                </div>
              )}
            </div>



            <div className="p-8 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
              <button
                disabled={!deliveryMethod || (deliveryMethod === 'table' && !tableNumber) || (deliveryMethod === 'delivery' && !selectedAddress)}
                onClick={() => {
                  sendWhatsAppOrder(loggedCustomer);
                  setIsDeliverySelectionOpen(false);
                }}
                className={`w-full py-5 rounded-[28px] font-black uppercase text-sm tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3
                  ${(!deliveryMethod || (deliveryMethod === 'table' && !tableNumber) || (deliveryMethod === 'delivery' && !selectedAddress))
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed shadow-none'
                    : 'bg-emerald-500 text-white hover:scale-[1.02] active:scale-[0.98] shadow-emerald-500/20 cursor-pointer'
                  }`}
              >
                <MessageCircle className="w-6 h-6" />
                <span>Confirmar Pedido WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating PWA Install Notification (Appears at 90% scroll with sound, disappears if already installed) */}
      {!isInstalled && showFloatingBanner && !isPreview && (
        <aside
          aria-label="Notificación para instalar la aplicación"
          className={`fixed bottom-6 right-4 left-4 sm:left-auto sm:right-8 sm:w-[440px] z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-2 border-primary-500/40 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] rounded-[32px] p-6 sm:p-7 ring-1 ring-black/5 dark:ring-white/10 ${
            isBannerClosing ? 'animate-notification-exit' : 'animate-notification-pop'
          }`}
        >
          {/* Subtle glowing halo behind banner */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/20 via-amber-500/20 to-emerald-500/20 rounded-[34px] blur-xl -z-10 animate-ambient-glow pointer-events-none" />

          {/* Top row with category badge and spacious close button */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary-500/15 text-primary-600 dark:text-primary-400 border border-primary-500/25 shadow-sm">
              <Sparkles className="w-3 h-3 text-primary-500 animate-pulse" />
              Notificación • Menú Digital
            </span>
            <button
              type="button"
              onClick={handleDismissBanner}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              title="Cerrar notificación"
              aria-label="Cerrar notificación de instalación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Main content with generous breathing room */}
          <div className="flex items-start gap-4 sm:gap-5 mb-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary-400 via-primary-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30 shrink-0 ring-4 ring-primary-500/15">
              <Smartphone className="w-7 h-7 sm:w-8 sm:h-8 animate-phone-wiggle" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="font-black text-base sm:text-lg uppercase tracking-tight text-gray-900 dark:text-white leading-tight">
                Instala El Buen Servir
              </h5>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-relaxed mt-1.5">
                Ten el menú digital siempre a mano en tu celular. Haz pedidos directo a WhatsApp en un solo toque sin descargas pesadas.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={async () => {
                soundManager.play('click');
                const installed = await installApp();
                if (installed) {
                  setShowFloatingBanner(false);
                }
              }}
              className="flex-1 py-3.5 px-5 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer animate-shimmer-sweep"
            >
              <Download className="w-4 h-4" />
              <span>Instalar Ahora</span>
            </button>
            <button
              type="button"
              onClick={handleDismissBanner}
              className="py-3.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer"
            >
              Más tarde
            </button>
          </div>
        </aside>
      )}

      {/* PWA Instructions Modal */}
      <InstallPwaModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        isIos={isIos}
      />

      {/* Legal Documents Modal */}
      <LegalModal
        isOpen={legalModalState.isOpen}
        onClose={() => setLegalModalState(prev => ({ ...prev, isOpen: false }))}
        initialDoc={legalModalState.doc}
      />
    </div>
  );
}




