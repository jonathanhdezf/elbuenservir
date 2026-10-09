import React, { useState } from 'react';
import {
  User,
  Receipt,
  LayoutDashboard,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ChefHat
} from 'lucide-react';
import { soundManager } from '../utils/soundManager';

export interface CustomerOnboardingTooltipProps {
  isOpen: boolean;
  onClose: () => void;
  onDismissPermanently: () => void;
  customerName: string;
  customerPhone: string;
  sessionNumber: number;
  maxSessionsForGuide?: number;
  onOpenProfile: (tab: 'profile' | 'orders') => void;
  onNavigateToMenu: () => void;
}

export const CustomerOnboardingTooltip: React.FC<CustomerOnboardingTooltipProps> = ({
  isOpen,
  onClose,
  onDismissPermanently,
  customerName,
  customerPhone,
  sessionNumber,
  maxSessionsForGuide = 3,
  onOpenProfile,
  onNavigateToMenu
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  if (!isOpen) return null;

  const steps = [
    {
      id: 'profile',
      tabLabel: '1. Tu Perfil',
      badge: 'Tu Cuenta',
      title: 'Tu Perfil & Datos Personales',
      description: 'Toca tu avatar en la barra superior para acceder a tu perfil. Desde ahí puedes actualizar tu nombre, cambiar tu foto, editar tu contraseña y guardar tus direcciones de entrega favoritas para ordenar mucho más rápido.',
      actionLabel: 'Abrir Mi Perfil',
      icon: User,
      colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      action: () => {
        soundManager.play('click');
        onOpenProfile('profile');
      }
    },
    {
      id: 'orders',
      tabLabel: '2. Historial',
      badge: 'Tus Pedidos',
      title: 'Pestaña: Historial de Pedidos',
      description: 'Dentro de tu perfil encontrarás la pestaña "Historial de Pedidos". Te permite consultar el estado en vivo de tu comida (en cocina, listo o en reparto), ver tus tickets digitales y repetir cualquier pedido anterior con un solo toque.',
      actionLabel: 'Ver Historial de Pedidos',
      icon: Receipt,
      colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      action: () => {
        soundManager.play('click');
        onOpenProfile('orders');
      }
    },
    {
      id: 'menu_tabs',
      tabLabel: '3. Pestañas Menú',
      badge: 'Navegación',
      title: 'Pestañas de Categorías del Menú',
      description: 'En la pantalla principal puedes usar las pestañas (Menú del Día, Caldos, Cerdo, Pollo, Bebidas y Postres) para explorar nuestras especialidades, seleccionar guarniciones y armar tu carrito interactivo a tu gusto.',
      actionLabel: 'Explorar Menú',
      icon: LayoutDashboard,
      colorClass: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      action: () => {
        soundManager.play('click');
        onNavigateToMenu();
      }
    }
  ];

  const activeStep = steps[currentStep];
  const StepIcon = activeStep.icon;

  const handleNext = () => {
    soundManager.play('click');
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    soundManager.play('click');
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const firstName = customerName ? customerName.split(' ')[0] : 'Cliente';

  return (
    <>
      {/* Mobile Backdrop to prevent accidental background taps during tour */}
      <div 
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] sm:hidden animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Floating Guided Tooltip Container */}
      <div
        className="fixed top-20 left-3 right-3 sm:left-auto sm:right-6 sm:top-20 z-50 sm:w-[400px] bg-white dark:bg-gray-900 border-2 border-primary-500 rounded-[28px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_60px_-15px_rgba(245,158,11,0.2)] ring-4 ring-primary-500/15 overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-guide-title"
      >
        {/* Tooltip Arrow pointing up to Navbar Avatar on desktop */}
        <div className="hidden sm:block absolute -top-2 right-12 w-4 h-4 bg-white dark:bg-gray-900 border-t-2 border-l-2 border-primary-500 transform rotate-45 z-10" />

        {/* Top Header Badge & Close */}
        <div className="p-4 pb-2 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-primary-500/10 via-amber-500/5 to-transparent flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse shrink-0" />
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] font-black uppercase tracking-wider text-primary-600 dark:text-primary-400 truncate">
                ¡Hola {firstName}! 👋
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary-500/15 text-primary-700 dark:text-primary-300 shrink-0">
                Sesión {Math.min(sessionNumber, maxSessionsForGuide)} de {maxSessionsForGuide}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundManager.play('click');
              onClose();
            }}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
            title="Cerrar guía por ahora"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clickable Step Tabs (Perfil, Historial, Pestañas) */}
        <div className="grid grid-cols-3 gap-1 px-3 pt-3 bg-gray-50/70 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
          {steps.map((s, idx) => {
            const isActive = currentStep === idx;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  soundManager.play('click');
                  setCurrentStep(idx);
                }}
                className={`py-2 px-1 text-center text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center justify-center gap-1 ${
                  isActive
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-white dark:bg-gray-800 rounded-t-xl shadow-xs'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <span>{s.tabLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Step Body Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${activeStep.colorClass}`}>
              <StepIcon className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {activeStep.badge}
                </span>
                <span className="text-[10px] font-bold text-gray-400">
                  Paso {currentStep + 1} de {steps.length}
                </span>
              </div>
              <h4 id="onboarding-guide-title" className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                {activeStep.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">
                {activeStep.description}
              </p>
            </div>
          </div>

          {/* Direct Action Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={activeStep.action}
              className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 active:scale-[0.98] text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-primary-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{activeStep.actionLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer Navigation Buttons & Permanent Dismiss */}
        <div className="px-5 py-3.5 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Atrás</span>
              </button>
            ) : (
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Primeros Pasos
              </span>
            )}

            {currentStep < steps.length - 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              soundManager.play('click');
              onDismissPermanently();
            }}
            className="text-[10px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline uppercase tracking-wider cursor-pointer"
          >
            No volver a mostrar
          </button>
        </div>
      </div>
    </>
  );
};
