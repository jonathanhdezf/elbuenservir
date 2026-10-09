
import React, { useState, useEffect } from 'react';
import { Utensils, Clock, MapPin, Instagram, Facebook, Phone, ChevronDown, Lock, Star, ChevronRight, Award, Heart, ShoppingBag, Check, ArrowRight, MessageCircle, Menu, Plus, Minus, Trash2, ShoppingCart, X, ChefHat, Truck, Monitor, LayoutDashboard, Search, Store, Zap, Mic, Download, Smartphone, Sparkles, User } from 'lucide-react';
import { Category, MenuItem, Customer, Order } from '../types';
import { soundManager } from '../utils/soundManager';
import LiveOrderModal from '../components/LiveOrderModal';
import { useMobileBack } from '../hooks/useMobileBack';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { InstallPwaModal } from '../components/InstallPwaModal';
import LegalModal, { LegalDocType } from '../components/LegalModal';
import { CustomerAuthModal } from '../components/CustomerAuthModal';
import { CustomerProfileModal } from '../components/CustomerProfileModal';
import { CustomerAvatar } from '../components/CustomerAvatar';
import { CustomerOnboardingTooltip } from '../components/CustomerOnboardingTooltip';

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

export interface PublicCartItem {
  id: string;
  dishId: string;
  name: string;
  variationLabel: string;
  price: number;
  quantity: number;
  sides?: string[];
  comments?: string;
  categoryId?: string;
  isExtra?: boolean;
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

  // Order Flow States (Multi-dish Cart)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderStep, setOrderStep] = useState(1);
  const [cartItems, setCartItems] = useState<PublicCartItem[]>([]);
  const [modalCategoryFilter, setModalCategoryFilter] = useState<string>('all');
  const [pendingDishSides, setPendingDishSides] = useState<Record<string, string[]>>({});
  const [pendingDishVariation, setPendingDishVariation] = useState<Record<string, any>>({});
  const [selectedVariationsByDish, setSelectedVariationsByDish] = useState<Record<string, any>>({});
  const [pendingDishQty, setPendingDishQty] = useState<Record<string, number>>({});
  const [customerComments, setCustomerComments] = useState('');
  const [quickSearch, setQuickSearch] = useState('');
  const [extraModalType, setExtraModalType] = useState<string | null>(null);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const isSideCategory = (catId: string) => catId === 'cat-5' || catId === 'cat-acompanar' || catId.toLowerCase().includes('acompañ');
  const isDrinkCategory = (catId: string) => catId === 'cat-2' || catId === 'cat-bebidas' || catId.toLowerCase().includes('bebida');
  const isDessertCategory = (catId: string) => catId === 'cat-1' || catId === 'cat-postres' || catId.toLowerCase().includes('postre');
  const isMainDishCategory = (catId: string) => !isSideCategory(catId) && !isDrinkCategory(catId) && !isDessertCategory(catId);

  const availableSides = menuItems.filter(item => isSideCategory(item.categoryId) && item.isActive);
  const mainDishCategories = categories.filter(c => isMainDishCategory(c.id));

  const handleAddDishToCart = (item: MenuItem, variationOverride?: any, sidesOverride?: string[], qtyOverride?: number) => {
    const chosenVar = variationOverride || pendingDishVariation[item.id] || item.variations[0];
    const qty = qtyOverride || pendingDishQty[item.id] || 1;
    const sides = sidesOverride !== undefined ? sidesOverride : (pendingDishSides[item.id] || []);

    setCartItems(prev => {
      const existingIdx = prev.findIndex(ci =>
        ci.dishId === item.id &&
        ci.variationLabel === chosenVar.label &&
        JSON.stringify([...(ci.sides || [])].sort()) === JSON.stringify([...sides].sort())
      );

      if (existingIdx > -1) {
        return prev.map((ci, idx) =>
          idx === existingIdx ? { ...ci, quantity: ci.quantity + qty } : ci
        );
      }

      const newItem: PublicCartItem = {
        id: `${item.id}-${chosenVar.id || 'v0'}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        dishId: item.id,
        name: item.name,
        variationLabel: chosenVar.label,
        price: chosenVar.price,
        quantity: qty,
        sides: [...sides],
        categoryId: item.categoryId,
        isExtra: isDrinkCategory(item.categoryId) || isDessertCategory(item.categoryId)
      };

      return [...prev, newItem];
    });

    setPendingDishQty(prev => ({ ...prev, [item.id]: 1 }));
    soundManager.play('click');
  };

  const handleUpdateCartQuantity = (cartItemId: string, delta: number) => {
    soundManager.play('click');
    setCartItems(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as PublicCartItem[]);
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    soundManager.play('click');
    setCartItems(prev => prev.filter(item => item.id !== cartItemId));
  };

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
  const [profileModalInitialTab, setProfileModalInitialTab] = useState<'profile' | 'orders'>('profile');
  const [showProfileTooltip, setShowProfileTooltip] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authIntent, setAuthIntent] = useState<'order' | 'live' | 'profile'>('profile');
  const [isLiveOrderOpen, setIsLiveOrderOpen] = useState(false);

  // Early sessions onboarding helpers (Show guide during first 3 sessions)
  const MAX_ONBOARDING_SESSIONS = 3;

  const getCustomerSessionCount = (phone?: string): number => {
    if (!phone) return 0;
    try {
      const clean = phone.replace(/\D/g, '');
      return parseInt(localStorage.getItem(`ebs_customer_sessions_${clean}`) || '0', 10);
    } catch {
      return 0;
    }
  };

  const isCustomerGuideDismissed = (phone?: string): boolean => {
    if (!phone) return false;
    try {
      const clean = phone.replace(/\D/g, '');
      return localStorage.getItem(`ebs_guide_dismissed_${clean}`) === 'true';
    } catch {
      return false;
    }
  };

  const incrementCustomerSession = (phone?: string): number => {
    if (!phone) return 1;
    try {
      const clean = phone.replace(/\D/g, '');
      const current = parseInt(localStorage.getItem(`ebs_customer_sessions_${clean}`) || '0', 10) || 0;
      const next = current + 1;
      localStorage.setItem(`ebs_customer_sessions_${clean}`, next.toString());
      return next;
    } catch {
      return 1;
    }
  };

  const [customerSessionCount, setCustomerSessionCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('el_buen_servir_customer');
      if (saved) {
        const c = JSON.parse(saved);
        if (c?.phone) return getCustomerSessionCount(c.phone);
      }
    } catch {}
    return 0;
  });

  const triggerOnboardingGuide = (customer: Customer) => {
    const clean = customer.phone.replace(/\D/g, '');
    sessionStorage.setItem(`ebs_session_counted_${clean}`, 'true');
    const count = incrementCustomerSession(customer.phone);
    setCustomerSessionCount(count);
    if (!isCustomerGuideDismissed(customer.phone) && count <= MAX_ONBOARDING_SESSIONS) {
      setTimeout(() => {
        setShowProfileTooltip(true);
      }, 400);
    }
  };

  const handleDismissGuidePermanently = () => {
    if (loggedCustomer?.phone) {
      const clean = loggedCustomer.phone.replace(/\D/g, '');
      try {
        localStorage.setItem(`ebs_guide_dismissed_${clean}`, 'true');
      } catch {}
    }
    setShowProfileTooltip(false);
  };

  // Track session on initial load if already authenticated and trigger guide if within early sessions
  useEffect(() => {
    if (loggedCustomer?.phone) {
      const clean = loggedCustomer.phone.replace(/\D/g, '');
      const sessionMarker = `ebs_session_counted_${clean}`;
      if (!sessionStorage.getItem(sessionMarker)) {
        sessionStorage.setItem(sessionMarker, 'true');
        const count = incrementCustomerSession(loggedCustomer.phone);
        setCustomerSessionCount(count);
        if (!isCustomerGuideDismissed(loggedCustomer.phone) && count <= MAX_ONBOARDING_SESSIONS) {
          const timer = setTimeout(() => {
            setShowProfileTooltip(true);
          }, 850);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [loggedCustomer?.phone]);

  useEffect(() => {
    if (showProfileTooltip) {
      soundManager.play('notification');
    }
  }, [showProfileTooltip]);

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
      triggerOnboardingGuide(customer);
    }
  };

  const handleRegisterCustomer = (newCustomer: Customer) => {
    onAddCustomer(newCustomer);
    handleSetLoggedCustomer(newCustomer);
    triggerOnboardingGuide(newCustomer);
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
    const total = cartTotal.toFixed(2);

    let deliveryInfo = '';
    if (deliveryMethod === 'pickup') {
      deliveryInfo = `🏪 *Entrega:* Recoger en mostrador\n`;
    } else if (deliveryMethod === 'table') {
      deliveryInfo = `🪑 *Entrega:* En mesa #${tableNumber}\n`;
    } else if (deliveryMethod === 'delivery') {
      deliveryInfo = `🏠 *Entrega:* Domicilio - ${selectedAddress}\n`;
    }

    const itemsSummary = cartItems.map(item => {
      const sidesText = item.sides && item.sides.length > 0 ? `\n   ↳ Guarnición: ${item.sides.join(', ')}` : '';
      const notesText = item.comments ? `\n   ↳ Nota: ${item.comments}` : '';
      return `• ${item.quantity}x ${item.name} (${item.variationLabel}) - $${(item.price * item.quantity).toFixed(2)}${sidesText}${notesText}`;
    }).join('\n');

    const orderText = `*NUEVO PEDIDO EN LÍNEA - EL BUEN SERVIR*\n\n` +
      `🆔 *Orden:* #${orderId}\n` +
      `👤 *Cliente:* ${customer.name}\n` +
      `📱 *Teléfono:* ${customer.phone}\n` +
      deliveryInfo +
      `\n*PLATILLOS Y PRODUCTOS:*\n` +
      itemsSummary +
      `\n\n` +
      (customerComments ? `📝 *Instrucciones generales:* ${customerComments}\n` : '') +
      `💰 *TOTAL:* $${total}\n\n` +
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
        items: cartItems.map(item => ({
          id: item.dishId,
          name: item.name,
          variationLabel: item.variationLabel + (item.sides && item.sides.length > 0 ? ` [${item.sides.join(', ')}]` : ''),
          price: item.price,
          quantity: item.quantity
        })),
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

    setCartItems([]);
    setIsOrderModalOpen(false);
    setOrderStep(1);
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
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.play('click');
                    setShowProfileTooltip(false);
                    setIsProfileModalOpen(true);
                  }}
                  title={`Mi Perfil (${loggedCustomer.name})`}
                  className={`flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${
                    isScrolled || isPreview
                      ? 'bg-white dark:bg-gray-900 border-primary-500/40 text-gray-900 dark:text-white hover:border-primary-500 shadow-primary-500/5'
                      : 'bg-white/15 backdrop-blur-md border-white/30 text-white hover:bg-white/25'
                  }`}
                >
                  <CustomerAvatar
                    avatarUrl={loggedCustomer.avatarUrl}
                    name={loggedCustomer.name}
                    className="w-8 h-8"
                    showOnlineBadge={true}
                    badgeClassName="w-2.5 h-2.5"
                    alternateWithInitial={true}
                    alternateIntervalMs={3200}
                  />
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-black truncate max-w-[100px] leading-tight">
                      {loggedCustomer.name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] font-bold text-primary-500 dark:text-primary-400 uppercase tracking-wider leading-none">
                      Mi Cuenta
                    </span>
                  </div>
                </button>

                {/* Interactive Tooltip Guiding the User in early sessions */}
                {loggedCustomer && (
                  <CustomerOnboardingTooltip
                    isOpen={showProfileTooltip}
                    onClose={() => setShowProfileTooltip(false)}
                    onDismissPermanently={handleDismissGuidePermanently}
                    customerName={loggedCustomer.name}
                    customerPhone={loggedCustomer.phone}
                    sessionNumber={customerSessionCount}
                    maxSessionsForGuide={MAX_ONBOARDING_SESSIONS}
                    onOpenProfile={(tab) => {
                      setProfileModalInitialTab(tab);
                      setShowProfileTooltip(false);
                      setIsProfileModalOpen(true);
                    }}
                    onNavigateToMenu={() => {
                      setShowProfileTooltip(false);
                      const el = document.getElementById('menu');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  />
                )}
              </div>
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
                setOrderStep(cartItems.length > 0 ? 3 : 1);
                setIsOrderModalOpen(true);
              }}
              className={`hidden sm:flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl ${isScrolled || isPreview ? 'bg-primary-500 text-white shadow-primary-500/30 hover:scale-105' : 'bg-white text-gray-900 hover:scale-105 active:scale-95 shadow-white/10'}`}
            >
              <ShoppingBag className="w-4 h-4" />
              {cartItems.length > 0 ? `Mi Pedido (${cartItemsCount})` : 'Ordenar en Línea'}
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
                      <CustomerAvatar
                        avatarUrl={loggedCustomer.avatarUrl}
                        name={loggedCustomer.name}
                        className="w-12 h-12"
                        showOnlineBadge={true}
                        badgeClassName="w-3 h-3"
                        alternateWithInitial={true}
                        alternateIntervalMs={3200}
                      />
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
                    setOrderStep(cartItems.length > 0 ? 3 : 1);
                    setIsOrderModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-primary-500 text-white py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>{cartItems.length > 0 ? `Ver Mi Pedido (${cartItemsCount})` : 'Ordenar ahora'}</span>
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
                      setOrderStep(cartItems.length > 0 ? 3 : 1);
                      setIsOrderModalOpen(true);
                    }}
                    className="w-full sm:w-auto group flex items-center justify-center gap-3 bg-white text-gray-900 px-10 py-6 rounded-3xl text-lg font-black uppercase tracking-widest shadow-2xl shadow-white/30 transition-all hover:-translate-y-1 hover:bg-primary-500 hover:text-white active:scale-95 cursor-pointer"
                  >
                    <ShoppingBag className="w-6 h-6" />
                    <span>{cartItems.length > 0 ? `Mi Pedido (${cartItemsCount})` : 'Ordenar en Línea'}</span>
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
                          const chosenVar = activeVariation || item.variations[0];
                          handleAddDishToCart(item, chosenVar);
                          setOrderStep(1);
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
      {/* Order Modal (Multi-Dish Ordering) */}
      {
        isOrderModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsOrderModalOpen(false)}></div>
            <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-[36px] sm:rounded-[44px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-800">

              {/* Modal Header */}
              <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/70 dark:bg-gray-800/50 shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-primary-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                      Paso {orderStep} de 3
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                      Compra en Línea
                    </h3>
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {orderStep === 1 && "1. Elige uno o más platillos"}
                    {orderStep === 2 && "2. Bebidas y postres"}
                    {orderStep === 3 && "3. Resumen y envío"}
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
              <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 custom-scrollbar">

                {/* Step 1: Main Dishes (Multi-Selection) */}
                {orderStep === 1 && (
                  <div className="space-y-6">
                    {/* Cart Summary Bar inside Step 1 (if items added) */}
                    {cartItems.length > 0 && (
                      <div className="p-4 sm:p-5 bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 rounded-3xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                            <span className="text-xs font-black uppercase tracking-wider text-primary-700 dark:text-primary-300">
                              Tu Pedido ({cartItemsCount} {cartItemsCount === 1 ? 'producto' : 'productos'})
                            </span>
                          </div>
                          <span className="font-mono font-black text-primary-600 dark:text-primary-400 text-sm">
                            ${cartTotal.toFixed(2)}
                          </span>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                          {cartItems.map((cartItem) => (
                            <div key={cartItem.id} className="p-3 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-between gap-3 shadow-sm border border-gray-100 dark:border-gray-700 text-xs">
                              <div className="min-w-0 flex-1">
                                <p className="font-black text-gray-900 dark:text-white uppercase truncate">{cartItem.name}</p>
                                <p className="text-[10px] font-bold text-primary-500 uppercase">{cartItem.variationLabel} • ${(cartItem.price * cartItem.quantity).toFixed(2)}</p>
                                {cartItem.sides && cartItem.sides.length > 0 && (
                                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold truncate">Guarnición: {cartItem.sides.join(', ')}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCartQuantity(cartItem.id, -1)}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300 cursor-pointer"
                                    title="Disminuir"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-6 text-center font-black text-xs text-gray-900 dark:text-white">{cartItem.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCartQuantity(cartItem.id, 1)}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300 cursor-pointer"
                                    title="Aumentar"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFromCart(cartItem.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search and Category Filter */}
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar platillo..."
                          value={quickSearch}
                          onChange={(e) => setQuickSearch(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary-500 rounded-2xl pl-11 pr-4 py-3 font-bold text-sm text-gray-700 dark:text-white outline-none transition-all placeholder:text-gray-400"
                        />
                      </div>

                      {/* Category Pills */}
                      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                        <button
                          type="button"
                          onClick={() => setModalCategoryFilter('all')}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                            modalCategoryFilter === 'all'
                              ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          Todos
                        </button>
                        {mainDishCategories.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setModalCategoryFilter(cat.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                              modalCategoryFilter === cat.id
                                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dishes Grid */}
                    <div className="grid grid-cols-1 gap-4">
                      {menuItems
                        .filter(item => {
                          if (!item.isActive) return false;
                          if (!isMainDishCategory(item.categoryId)) return false;
                          if (modalCategoryFilter !== 'all' && item.categoryId !== modalCategoryFilter) return false;
                          if (quickSearch.trim()) {
                            const q = quickSearch.toLowerCase();
                            return item.name.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q));
                          }
                          return true;
                        })
                        .map(item => {
                          const currentVar = pendingDishVariation[item.id] || item.variations[0];
                          const currentQty = pendingDishQty[item.id] || 1;
                          const currentSides = pendingDishSides[item.id] || [];

                          return (
                            <div
                              key={item.id}
                              className="p-5 bg-gray-50 dark:bg-gray-800/80 rounded-3xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all space-y-4"
                            >
                              <div>
                                <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-base sm:text-lg">
                                  {item.name}
                                </h4>
                                {item.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-300 italic mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                              </div>

                              {/* Variations */}
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-400 block">
                                  Variante:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {item.variations.map(v => {
                                    const isSelected = currentVar?.id === v.id;
                                    return (
                                      <button
                                        key={v.id}
                                        type="button"
                                        onClick={() => setPendingDishVariation(prev => ({ ...prev, [item.id]: v }))}
                                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide border transition-all cursor-pointer ${
                                          isSelected
                                            ? 'bg-primary-500 text-white border-primary-500 shadow-sm ring-2 ring-primary-500/30'
                                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-primary-400'
                                        }`}
                                      >
                                        <span>{v.label}</span>
                                        <span className={isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}>${v.price}</span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Free Sides */}
                              {availableSides.length > 0 && (
                                <div className="space-y-1.5 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <span>Guarniciones incluidas (sin costo extra):</span>
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {availableSides.map(side => {
                                      const isChecked = currentSides.includes(side.name);
                                      return (
                                        <button
                                          key={side.id}
                                          type="button"
                                          onClick={() => {
                                            setPendingDishSides(prev => {
                                              const old = prev[item.id] || [];
                                              return {
                                                ...prev,
                                                [item.id]: isChecked ? old.filter(s => s !== side.name) : [...old, side.name]
                                              };
                                            });
                                          }}
                                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                                            isChecked
                                              ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                                              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400'
                                          }`}
                                        >
                                          <span>{side.name}</span>
                                          {isChecked ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3 opacity-50" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Quantity & Add button */}
                              <div className="flex items-center justify-between gap-3 pt-2">
                                <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-1.5 shadow-sm">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (currentQty > 1) setPendingDishQty(prev => ({ ...prev, [item.id]: currentQty - 1 }));
                                    }}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                    title="Menos"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-8 text-center font-black text-sm text-gray-900 dark:text-white">
                                    {currentQty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPendingDishQty(prev => ({ ...prev, [item.id]: currentQty + 1 }));
                                    }}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                    title="Más"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAddDishToCart(item)}
                                  className="flex-1 py-3 px-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-primary-500 dark:hover:bg-primary-500 dark:hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Agregar al Pedido</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}

                      {menuItems.filter(item => {
                        if (!item.isActive || !isMainDishCategory(item.categoryId)) return false;
                        if (modalCategoryFilter !== 'all' && item.categoryId !== modalCategoryFilter) return false;
                        if (quickSearch.trim()) {
                          const q = quickSearch.toLowerCase();
                          return item.name.toLowerCase().includes(q);
                        }
                        return true;
                      }).length === 0 && (
                        <p className="text-center text-gray-400 italic py-8">No se encontraron platillos con ese filtro o búsqueda.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Drinks & Desserts */}
                {orderStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center py-2">
                      <h4 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">¿Deseas acompañar con bebidas o postres?</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mt-1">Elige tus complementos favoritos</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {menuItems
                        .filter(item => (isDrinkCategory(item.categoryId) || isDessertCategory(item.categoryId)) && item.isActive)
                        .map(extra => {
                          const isDrink = isDrinkCategory(extra.categoryId);
                          const currentVar = pendingDishVariation[extra.id] || extra.variations[0];
                          return (
                            <div key={extra.id} className="p-4 bg-gray-50 dark:bg-gray-800/80 rounded-3xl border border-gray-100 dark:border-gray-700 flex flex-col justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${isDrink ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' : 'bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-400'}`}>
                                    {isDrink ? 'Bebida' : 'Postre'}
                                  </span>
                                  <span className="font-black text-gray-900 dark:text-white text-sm uppercase truncate">{extra.name}</span>
                                </div>
                                {extra.variations.length > 1 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {extra.variations.map(v => (
                                      <button
                                        key={v.id}
                                        type="button"
                                        onClick={() => setPendingDishVariation(prev => ({ ...prev, [extra.id]: v }))}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                                          currentVar?.id === v.id
                                            ? 'bg-primary-500 text-white border-primary-500'
                                            : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                                        }`}
                                      >
                                        {v.label} ${v.price}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
                                <span className="font-black text-sm text-primary-500 dark:text-primary-400">
                                  ${currentVar?.price.toFixed(2)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAddDishToCart(extra, currentVar, [], 1)}
                                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Agregar</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {cartItems.filter(i => i.isExtra).length > 0 && (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-3xl space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                          Complementos agregados ({cartItems.filter(i => i.isExtra).reduce((s, i) => s + i.quantity, 0)}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {cartItems.filter(i => i.isExtra).map(extra => (
                            <span key={extra.id} className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-black shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                              <span>{extra.quantity}x {extra.name} ({extra.variationLabel})</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(extra.id)}
                                className="text-gray-400 hover:text-red-500 cursor-pointer"
                                title="Eliminar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Summary and Submission */}
                {orderStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center py-2">
                      <h4 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Resumen de tu Pedido</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mt-1">Revisa tus productos antes de enviar</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/80 rounded-[32px] overflow-hidden border border-gray-100 dark:border-gray-700">
                      <div className="p-5 sm:p-6 space-y-3">
                        {cartItems.map(item => (
                          <div key={item.id} className="p-4 bg-white dark:bg-gray-900 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-primary-500 font-black text-sm">{item.quantity}x</span>
                                <span className="font-black text-gray-900 dark:text-white text-sm uppercase truncate">{item.name}</span>
                                <span className="text-xs font-bold text-gray-400 uppercase">({item.variationLabel})</span>
                              </div>
                              {item.sides && item.sides.length > 0 && (
                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                  Guarnición: {item.sides.join(', ')}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQuantity(item.id, -1)}
                                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 cursor-pointer"
                                  title="Disminuir"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center font-black text-xs text-gray-900 dark:text-white">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQuantity(item.id, 1)}
                                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 cursor-pointer"
                                  title="Aumentar"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <span className="font-mono font-black text-sm text-gray-900 dark:text-white min-w-[70px] text-right">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        <div className="pt-2 text-center">
                          <button
                            type="button"
                            onClick={() => setOrderStep(1)}
                            className="text-xs font-black uppercase tracking-wider text-primary-500 hover:underline cursor-pointer"
                          >
                            + Agregar más platillos a este pedido
                          </button>
                        </div>
                      </div>

                      <div className="p-6 bg-gray-900 text-white flex justify-between items-baseline">
                        <span className="text-xs font-black uppercase tracking-[0.3em] opacity-60">Total Estimado</span>
                        <span className="text-3xl sm:text-4xl font-black tracking-tighter">
                          ${cartTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* General Notes */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 dark:text-gray-300 uppercase tracking-widest ml-1">
                        Instrucciones Especiales para el Pedido (Opcional)
                      </label>
                      <textarea
                        value={customerComments}
                        onChange={e => setCustomerComments(e.target.value)}
                        placeholder="Ej. Salsa aparte, servilletas extra, cubiertos..."
                        className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-primary-500 rounded-2xl p-4 outline-none transition-all font-bold text-sm min-h-[90px] text-gray-900 dark:text-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer Controls */}
              <div className="p-6 sm:p-8 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                <div className="flex gap-4">
                  {orderStep > 1 && (
                    <button
                      onClick={() => setOrderStep(prev => prev - 1)}
                      className="px-6 sm:px-8 py-4 sm:py-5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer"
                    >
                      Regresar
                    </button>
                  )}

                  {orderStep === 1 && (
                    <button
                      onClick={() => setOrderStep(2)}
                      disabled={cartItems.length === 0}
                      className={`flex-1 flex items-center justify-center gap-3 py-4 sm:py-5 rounded-3xl font-black uppercase text-xs tracking-widest transition-all shadow-xl cursor-pointer ${
                        cartItems.length === 0
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          : 'bg-gray-900 dark:bg-primary-500 text-white hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                    >
                      <span>{cartItems.length === 0 ? 'Selecciona al menos 1 platillo' : 'Continuar (Bebidas y Postres)'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {orderStep === 2 && (
                    <button
                      onClick={() => setOrderStep(3)}
                      className="flex-1 flex items-center justify-center gap-3 py-4 sm:py-5 bg-gray-900 dark:bg-primary-500 text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl cursor-pointer"
                    >
                      <span>Continuar al Resumen</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {orderStep === 3 && (
                    <button
                      onClick={() => {
                        if (!loggedCustomer) {
                          setAuthIntent('order');
                          setIsAuthModalOpen(true);
                          return;
                        }
                        setIsDeliverySelectionOpen(true);
                      }}
                      disabled={cartItems.length === 0}
                      className={`flex-1 flex items-center justify-center gap-3 py-5 sm:py-6 rounded-[28px] font-black uppercase text-sm tracking-[0.2em] transition-all shadow-2xl ${
                        cartItems.length === 0
                          ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed shadow-none'
                          : 'bg-emerald-500 text-white hover:scale-[1.02] active:scale-[0.98] shadow-emerald-500/20 cursor-pointer'
                      }`}
                    >
                      <MessageCircle className="w-6 h-6" />
                      <span>Confirmar y Enviar Pedido</span>
                    </button>
                  )}
                </div>
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
          initialTab={profileModalInitialTab}
          showOnboardingHelper={customerSessionCount <= MAX_ONBOARDING_SESSIONS && !isCustomerGuideDismissed(loggedCustomer.phone)}
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

      {/* Floating Cart Button when items exist and modal is closed */}
      {cartItems.length > 0 && !isOrderModalOpen && !isDeliverySelectionOpen && (
        <aside
          aria-label="Ver carrito de pedido"
          className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-8 z-40 animate-in slide-in-from-bottom-5 duration-300"
        >
          <button
            onClick={() => {
              soundManager.play('click');
              setOrderStep(3);
              setIsOrderModalOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4 px-6 py-4 bg-gray-900/95 dark:bg-white/95 text-white dark:text-gray-950 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95 transition-all border border-white/20 dark:border-gray-800 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center font-black">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                  {cartItemsCount}
                </span>
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-wider">Mi Pedido ({cartItemsCount} {cartItemsCount === 1 ? 'platillo' : 'platillos'})</p>
                <p className="text-[11px] font-bold text-gray-300 dark:text-gray-600">Revisar y Enviar Pedido</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-4 border-l border-white/20 dark:border-gray-200">
              <span className="text-base font-black text-primary-400 dark:text-primary-600">${cartTotal.toFixed(2)}</span>
              <ArrowRight className="w-4 h-4 text-primary-400 dark:text-primary-600" />
            </div>
          </button>
        </aside>
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




