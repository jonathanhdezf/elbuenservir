import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, X, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { soundManager } from '../utils/soundManager';

interface ControlPanelAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PANEL_PASSWORD = '1010001!';

export const ControlPanelAuthModal: React.FC<ControlPanelAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
      setShowPassword(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === PANEL_PASSWORD) {
      soundManager.play('confirm');
      setError(false);
      onSuccess();
    } else {
      soundManager.play('error');
      setError(true);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPassword('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div 
        className={`bg-white dark:bg-gray-900 w-full max-w-md rounded-[32px] shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300 ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/70 dark:bg-gray-800/50">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-xl text-gray-900 dark:text-white uppercase tracking-tight">
                Panel de Control
              </h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Acceso restringido
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
              Ingresa la contraseña de administrador para gestionar el menú, pedidos y las áreas operativas del restaurante.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center justify-between">
              <span>Contraseña del Sistema</span>
              {error && (
                <span className="text-red-500 font-bold flex items-center gap-1 normal-case tracking-normal text-xs animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5" /> Contraseña incorrecta
                </span>
              )}
            </label>

            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="Escribe la contraseña..."
                className={`w-full px-5 py-4 pr-12 bg-gray-50 dark:bg-gray-800 border-2 rounded-2xl outline-none font-bold text-base text-gray-900 dark:text-white transition-all ${
                  error
                    ? 'border-red-500 focus:border-red-500 ring-2 ring-red-500/20'
                    : 'border-transparent focus:border-primary-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Área exclusiva para personal autorizado de El Buen Servir.</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-4 px-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-black uppercase text-xs tracking-wider transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-4 px-6 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider transition-all shadow-lg shadow-primary-500/25 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Acceder al Panel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
