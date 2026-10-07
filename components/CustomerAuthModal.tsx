import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Phone,
  Lock,
  User,
  MapPin,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Customer } from '../types';
import { soundManager } from '../utils/soundManager';
import { CustomerAvatar } from './CustomerAvatar';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onLoginSuccess: (customer: Customer) => void;
  onRegisterCustomer: (newCustomer: Customer) => void;
  initialMode?: 'login' | 'register';
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

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  customers,
  onLoginSuccess,
  onRegisterCustomer,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setPassword('');
      setIsSubmitting(false);
      setTimeout(() => {
        phoneInputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handlePhoneChange = (val: string) => {
    // Keep only numbers and max 10 digits
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setPhone(cleaned);
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('La imagen debe pesar menos de 2 MB');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanedPhone = phone.trim();
    if (!cleanedPhone || cleanedPhone.length < 7) {
      setError('Ingresa un número de teléfono válido (mínimo 7-10 dígitos)');
      soundManager.play('error');
      return;
    }

    if (!password.trim() || password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      soundManager.play('error');
      return;
    }

    setIsSubmitting(true);

    if (mode === 'login') {
      // Find matching customer by phone
      const customer = customers.find(c => c.phone.replace(/\D/g, '') === cleanedPhone);

      if (!customer) {
        setError('No encontramos ninguna cuenta con este número. Por favor regístrate.');
        soundManager.play('error');
        setIsSubmitting(false);
        return;
      }

      // Check password (if customer has no password yet, allow setting it now)
      if (customer.password && customer.password !== password) {
        setError('Contraseña incorrecta. Por favor verifica tus datos.');
        soundManager.play('error');
        setIsSubmitting(false);
        return;
      }

      // If customer had no password, save this password for future logins
      if (!customer.password) {
        customer.password = password;
        onRegisterCustomer(customer);
      }

      soundManager.play('confirm');
      onLoginSuccess(customer);
      onClose();
    } else {
      // Registration mode
      if (!name.trim()) {
        setError('Por favor escribe tu nombre completo');
        soundManager.play('error');
        setIsSubmitting(false);
        return;
      }

      // Check if phone already registered
      const existing = customers.find(c => c.phone.replace(/\D/g, '') === cleanedPhone);
      if (existing && existing.password) {
        setError('Este número ya tiene una cuenta registrada. Inicia sesión con tu contraseña.');
        soundManager.play('error');
        setMode('login');
        setIsSubmitting(false);
        return;
      }

      const newCustomer: Customer = {
        id: existing?.id || `cust-${Date.now()}`,
        name: name.trim(),
        phone: cleanedPhone,
        password: password.trim(),
        addresses: address.trim() ? [address.trim()] : (existing?.addresses || []),
        avatarUrl: avatarUrl || undefined,
        totalOrders: existing?.totalOrders || 0,
        totalSpent: existing?.totalSpent || 0
      };

      soundManager.play('confirm');
      onRegisterCustomer(newCustomer);
      onLoginSuccess(newCustomer);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
        onClick={onClose}
      />

      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[36px] shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300">
        
        {/* Top Header */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/20 gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/20 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">
                {mode === 'login' ? 'Acceso de Cliente' : 'Crear Cuenta'}
              </h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                El Buen Servir • Restaurante
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-4 pb-0">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); soundManager.play('click'); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); soundManager.play('click'); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Registrarme
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-red-600 dark:text-red-400 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'register' && (
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
                  placeholder="Ej. María González"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
              Número de Teléfono (10 dígitos) *
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={phoneInputRef}
                type="tel"
                required
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="Ej. 2311024672"
                maxLength={10}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
              Contraseña *
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                className="w-full pl-11 pr-11 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
                  Dirección de Entrega (Opcional)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle, número, colonia..."
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
                  Foto o Avatar de Perfil
                </label>
                <div className="flex items-center gap-3">
                  <CustomerAvatar
                    avatarUrl={avatarUrl}
                    name={name || 'Nuevo'}
                    className="w-12 h-12 shadow-md"
                  />

                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {/* Default Animated Lottie Avatar Option */}
                    <button
                      type="button"
                      onClick={() => { setAvatarUrl(''); soundManager.play('click'); }}
                      title="Avatar animado oficial por defecto"
                      className={`relative w-8 h-8 rounded-full transition-all shrink-0 cursor-pointer ${
                        !avatarUrl || avatarUrl === 'default_lottie'
                          ? 'scale-110 shadow-md ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <CustomerAvatar avatarUrl="" name="Default" className="w-8 h-8" />
                    </button>

                    {PRESET_AVATARS.slice(0, 4).map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setAvatarUrl(url); soundManager.play('click'); }}
                        className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                          avatarUrl === url ? 'border-primary-500 scale-110 shadow-md ring-2 ring-primary-500/30' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:text-primary-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Subir</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-amber-500 hover:from-primary-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-widest transition-all duration-200 shadow-xl shadow-primary-500/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{mode === 'login' ? 'Iniciar Sesión' : 'Completar Registro'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Switcher text */}
          <div className="text-center pt-2">
            {mode === 'login' ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ¿Aún no tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); soundManager.play('click'); }}
                  className="font-black text-primary-500 hover:underline cursor-pointer"
                >
                  Regístrate aquí
                </button>
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); soundManager.play('click'); }}
                  className="font-black text-primary-500 hover:underline cursor-pointer"
                >
                  Inicia sesión aquí
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
