import React, { useState, useRef } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Lock,
  Plus,
  Trash2,
  Receipt,
  Clock,
  CheckCircle2,
  ChefHat,
  Bike,
  PackageCheck,
  AlertCircle,
  Copy,
  Check,
  Camera,
  LogOut,
  ShoppingBag,
  ExternalLink,
  RotateCw,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { Customer, Order, OrderStatus } from '../types';
import { soundManager } from '../utils/soundManager';
import { CustomerAvatar } from './CustomerAvatar';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  orders: Order[];
  onUpdateCustomer: (updated: Customer) => void;
  onLogout: () => void;
  onViewDigitalTicket?: (order: Order) => void;
  onRepeatOrder?: (order: Order) => void;
  initialTab?: 'profile' | 'orders';
  showOnboardingHelper?: boolean;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80'
];

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', icon: Clock },
  kitchen: { label: 'En Cocina', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', icon: ChefHat },
  ready: { label: 'Listo', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: PackageCheck },
  delivery: { label: 'En Reparto', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300', icon: Bike },
  delivered: { label: 'Entregado', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: AlertCircle }
};

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  customer,
  orders,
  onUpdateCustomer,
  onLogout,
  onViewDigitalTicket,
  onRepeatOrder,
  initialTab = 'profile',
  showOnboardingHelper = false
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>(initialTab);
  const [showTabHelp, setShowTabHelp] = useState(true);

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Edit fields
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [email, setEmail] = useState(customer.email || '');
  const [avatarUrl, setAvatarUrl] = useState(customer.avatarUrl || '');
  const [addresses, setAddresses] = useState<string[]>(customer.addresses || []);
  const [newAddressInput, setNewAddressInput] = useState('');
  const [password, setPassword] = useState(customer.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Filter orders for this customer by phone number (normalized) or name
  const cleanCustomerPhone = customer.phone.replace(/\D/g, '');
  const customerOrders = orders.filter(o => {
    if (!o) return false;
    const orderPhone = (o.customerPhone || '').replace(/\D/g, '');
    if (cleanCustomerPhone && orderPhone && orderPhone === cleanCustomerPhone) return true;
    if (o.customerName && customer.name && o.customerName.toLowerCase().trim() === customer.name.toLowerCase().trim()) return true;
    return false;
  });

  const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen debe pesar menos de 2 MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
          soundManager.play('click');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddAddress = () => {
    const trimmed = newAddressInput.trim();
    if (trimmed && !addresses.includes(trimmed)) {
      setAddresses(prev => [...prev, trimmed]);
      setNewAddressInput('');
      soundManager.play('click');
    }
  };

  const handleRemoveAddress = (index: number) => {
    setAddresses(prev => prev.filter((_, i) => i !== index));
    soundManager.play('click');
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated: Customer = {
      ...customer,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      avatarUrl: avatarUrl || undefined,
      addresses: addresses,
      password: password.trim() || customer.password
    };

    onUpdateCustomer(updated);
    soundManager.play('confirm');
    setIsSavedSuccessfully(true);
    setTimeout(() => {
      setIsSavedSuccessfully(false);
    }, 2500);
  };

  const handleCopyOrderId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedOrderId(id);
    soundManager.play('click');
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Fecha no disponible';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
        onClick={onClose}
      />

      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[36px] sm:rounded-[44px] shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300">
        
        {/* Top Header */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/20 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <CustomerAvatar
              avatarUrl={avatarUrl}
              name={name || customer.name}
              className="w-10 h-10 sm:w-12 sm:h-12 shrink-0"
              showOnlineBadge={true}
              badgeClassName="w-2.5 h-2.5 sm:w-3 sm:h-3"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">
                  {name || customer.name}
                </h3>
                <span className="hidden xs:inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  Cliente
                </span>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono truncate">
                {phone || customer.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                onLogout();
                onClose();
              }}
              title="Cerrar Sesión"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 text-[11px] sm:text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="px-6 pt-4 border-b border-gray-100 dark:border-gray-800 flex gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab('profile'); soundManager.play('click'); }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Mi Perfil & Datos</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('orders'); soundManager.play('click'); }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Historial de Pedidos</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {customerOrders.length}
            </span>
          </button>
        </div>

        {/* Onboarding Guidance for Tabs during first sessions */}
        {showOnboardingHelper && showTabHelp && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 sm:p-3.5 bg-gradient-to-r from-primary-500/10 via-amber-500/5 to-transparent border border-primary-500/30 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-primary-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <p className="text-[11px] sm:text-xs text-gray-700 dark:text-gray-200 leading-snug">
                {activeTab === 'profile' ? (
                  <>
                    <strong className="text-primary-600 dark:text-primary-400 font-black uppercase tracking-wider">Pestaña Mi Perfil:</strong> Aquí personalizas tus datos y direcciones guardadas. Cambia a <strong className="text-primary-600 dark:text-primary-400 font-bold">Historial de Pedidos</strong> para ver compras anteriores.
                  </>
                ) : (
                  <>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-wider">Pestaña Historial:</strong> Revisa el avance en tiempo real de tus pedidos, tickets digitales y repite órdenes anteriores.
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setShowTabHelp(false);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg shrink-0 cursor-pointer"
              title="Entendido"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Body with Scroll */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          {/* TAB 1: PROFILE CONFIGURATION */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveChanges} className="space-y-6">
              
              {/* Avatar section */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-gray-50 dark:bg-gray-800/40 rounded-3xl border border-gray-100 dark:border-gray-800">
                <div className="relative group shrink-0">
                  <CustomerAvatar
                    avatarUrl={avatarUrl}
                    name={name}
                    className="w-20 h-20 sm:w-24 sm:h-24 shadow-xl"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Subir foto de perfil"
                    className="absolute bottom-0 right-0 p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer z-10"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <p className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
                      Foto o Avatar de Perfil
                    </p>
                    {(!avatarUrl || avatarUrl === 'default_lottie') && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                        Animado (Por Defecto)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Elige el avatar animado oficial, una foto sugerida o sube tu propia imagen.
                  </p>
                  
                  {/* Preset Avatar Pills */}
                  <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-3 flex-wrap">
                    {/* Default Animated Lottie Avatar Option */}
                    <button
                      type="button"
                      onClick={() => { setAvatarUrl(''); soundManager.play('click'); }}
                      title="Avatar animado oficial por defecto"
                      className={`relative w-8 h-8 rounded-full transition-all cursor-pointer ${
                        !avatarUrl || avatarUrl === 'default_lottie'
                          ? 'scale-115 shadow-md ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <CustomerAvatar avatarUrl="" name="Default" className="w-8 h-8" />
                    </button>

                    {PRESET_AVATARS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setAvatarUrl(url); soundManager.play('click'); }}
                        className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                          avatarUrl === url
                            ? 'border-primary-500 scale-110 shadow-md ring-2 ring-primary-500/30'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => { setAvatarUrl(''); soundManager.play('click'); }}
                        className="px-2.5 py-1 text-[9px] font-black uppercase text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Restablecer al avatar animado oficial"
                      >
                        Restablecer
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Data Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
                    Nombre Completo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre completo"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
                    Teléfono (Para pedidos y acceso) *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10 dígitos"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
                    Correo Electrónico (Opcional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
                    Contraseña de Acceso
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nueva contraseña"
                      className="w-full pl-11 pr-11 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                      title={showPassword ? 'Ocultar' : 'Ver'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Saved Delivery Addresses */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary-500" />
                    <span>Direcciones de Entrega Guardadas</span>
                  </label>
                  <span className="text-[10px] font-bold text-gray-400">
                    {addresses.length} {addresses.length === 1 ? 'dirección' : 'direcciones'}
                  </span>
                </div>

                {/* Add new address input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAddressInput}
                    onChange={(e) => setNewAddressInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAddress(); } }}
                    placeholder="Agregar nueva dirección (calle, número, colonia)..."
                    className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddAddress}
                    className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </button>
                </div>

                {/* Address list */}
                {addresses.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">
                    No tienes direcciones guardadas aún. Agrega una para autocompletar tus pedidos rápidamente.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {addresses.map((addr, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs font-medium"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <MapPin className="w-4 h-4 text-primary-500 shrink-0" />
                          <span className="text-gray-800 dark:text-gray-200 truncate">{addr}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAddress(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0 cursor-pointer"
                          title="Eliminar dirección"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Save changes action */}
              <div className="pt-2 flex items-center justify-between gap-4">
                {isSavedSuccessfully && (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Cambios guardados con éxito!</span>
                  </div>
                )}
                <div className="ml-auto">
                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-primary-500 to-amber-500 hover:from-primary-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-widest transition-all duration-200 shadow-xl shadow-primary-500/25 active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: ORDER HISTORY */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              
              {/* Order Stats Header */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total de Pedidos</span>
                  <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                    {customerOrders.length}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Consumo Acumulado</span>
                  <p className="text-2xl font-black text-primary-500 mt-1">
                    ${totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Orders List */}
              {customerOrders.length === 0 ? (
                <div className="p-10 text-center bg-gray-50 dark:bg-gray-800/20 rounded-3xl border border-gray-100 dark:border-gray-800">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <h4 className="font-black text-base text-gray-900 dark:text-white uppercase tracking-tight">
                    Aún no tienes pedidos registrados
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                    Cuando ordenes platillos en línea o en nuestro restaurante, tus recibos y tickets aparecerán aquí automáticamente.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {customerOrders.map((order) => {
                    const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                    const StatusIcon = statusInfo.icon;
                    const isCopied = copiedOrderId === order.id;

                    return (
                      <div
                        key={order.id}
                        className="p-4 sm:p-5 bg-white dark:bg-gray-800/60 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-sm hover:border-primary-500/40 transition-all space-y-3"
                      >
                        {/* Top: ID, Date & Status */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs sm:text-sm font-black text-gray-900 dark:text-white">
                              #{order.id}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyOrderId(order.id, e)}
                              className="p-1 text-gray-400 hover:text-primary-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              title="Copiar ID de pedido"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <span className="text-[10px] text-gray-400 font-medium">
                              • {formatDate(order.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusInfo.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>

                        {/* Items preview */}
                        <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                          {order.items && order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="font-medium">
                                <strong className="text-gray-900 dark:text-white">{item.quantity}x</strong> {item.name}
                                {item.variationLabel && <span className="text-[10px] text-gray-400 ml-1">({item.variationLabel})</span>}
                              </span>
                              <span className="font-bold font-mono text-gray-500">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Delivery address or destination */}
                        {order.address && (
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40 p-2 rounded-xl">
                            <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                            <span className="truncate">{order.address}</span>
                          </div>
                        )}

                        {/* Footer: Total, Digital Ticket and Repeat button */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/60">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total: </span>
                            <span className="text-base sm:text-lg font-black text-gray-900 dark:text-white font-mono">
                              ${(order.total || 0).toFixed(2)}
                            </span>
                            <span className="ml-2 text-[10px] uppercase font-bold text-gray-400">
                              ({order.paymentMethod || 'Efectivo'})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {onViewDigitalTicket && (
                              <button
                                type="button"
                                onClick={() => {
                                  soundManager.play('click');
                                  onViewDigitalTicket(order);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 dark:hover:bg-primary-900/60 text-primary-600 dark:text-primary-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Ver ticket digital"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Ver Ticket</span>
                              </button>
                            )}

                            {onRepeatOrder && (
                              <button
                                type="button"
                                onClick={() => {
                                  soundManager.play('click');
                                  onRepeatOrder(order);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Repetir pedido"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Repetir</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
