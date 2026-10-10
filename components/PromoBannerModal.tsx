import React, { useState, useEffect, useRef } from 'react';
import {
  X, MessageCircle, Sparkles, Clock, ArrowRight, Utensils,
  Mic, Play, Pause, ExternalLink, Flame
} from 'lucide-react';
import { soundManager } from '../utils/soundManager';

const WHATSAPP_NUMBER = '522311024672';
const DEFAULT_PRESET_MSG = '¡Hola El Buen Servir! Vi la promoción "La vida es corta... ¡Whatsappea al Buen Servir!" y me gustaría hacer un pedido.';

interface PromoBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSofia?: () => void;
  onScrollToMenu?: () => void;
  autoCloseSeconds?: number;
}

export function PromoBannerModal({
  isOpen,
  onClose,
  onOpenSofia,
  onScrollToMenu,
  autoCloseSeconds = 7
}: PromoBannerModalProps) {
  const [timeLeft, setTimeLeft] = useState(autoCloseSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<any>(null);

  // Reset countdown whenever opened
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(autoCloseSeconds);
      setIsPaused(false);
      try {
        soundManager.play('notification');
      } catch (e) { }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen, autoCloseSeconds]);

  // Tick countdown timer
  useEffect(() => {
    if (!isOpen) return;

    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPaused, onClose]);

  if (!isOpen) return null;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_PRESET_MSG)}`;
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / autoCloseSeconds) * 100));

  const handleOpenWhatsApp = () => {
    try { soundManager.play('confirm_generic'); } catch (e) { }
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  const handleOpenSofia = () => {
    onClose();
    if (onOpenSofia) {
      setTimeout(() => onOpenSofia(), 250);
    }
  };

  const handleGoToMenu = () => {
    onClose();
    if (onScrollToMenu) {
      setTimeout(() => onScrollToMenu(), 250);
    }
  };

  const baseUrl = (import.meta as any).env.BASE_URL || '/';
  const bannerImgSrc = `${baseUrl}banner_promo_whatsapp.png`;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={() => {
          try { soundManager.play('click'); } catch (e) { }
          onClose();
        }}
      />

      {/* Main Promo Dialog Card */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        className="relative z-10 w-full max-w-md sm:max-w-lg bg-gradient-to-b from-[#0a2315] via-[#07190f] to-[#040e08] rounded-3xl sm:rounded-[36px] border-2 border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.35)] overflow-hidden text-white my-auto transform transition-all animate-in zoom-in-95 duration-300"
      >
        {/* Top Floating Progress Bar */}
        <div className="relative w-full h-1.5 bg-white/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isPaused ? 'bg-amber-400' : 'bg-gradient-to-r from-emerald-400 to-teal-300'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-emerald-500/25 blur-3xl pointer-events-none" />

        {/* Header Ribbon & Close */}
        <div className="px-4 sm:px-6 pt-3.5 pb-2 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
              Promoción Exclusiva
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-close indicator pill */}
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? "Reanudar temporizador" : "Pausar temporizador"}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 text-[10px] font-bold text-gray-300 border border-white/10 transition-colors"
            >
              {isPaused ? (
                <>
                  <Pause className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-300">Pausado</span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>{timeLeft}s</span>
                </>
              )}
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                try { soundManager.play('click'); } catch (e) { }
                onClose();
              }}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all active:scale-95"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-4 sm:px-6 pt-1 pb-5 space-y-4 relative z-10">
          {/* Main Visual Image Banner */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-emerald-400/30 shadow-2xl bg-black/40 group aspect-square max-h-[310px] mx-auto flex items-center justify-center">
            <img
              src={bannerImgSrc}
              alt="La vida es corta... ¡Whatsappea al Buen Servir!"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Glossy gradient reflection */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />

            {/* Quick action overlay pill */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-center">
              <span className="px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-xs font-black text-white flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Atención Rápida en Teziutlán</span>
              </span>
            </div>
          </div>

          {/* Copy description */}
          <div className="text-center space-y-1.5 px-2">
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white leading-tight">
              ¡La vida es corta... <span className="text-emerald-400">Whatsappea</span> al Buen Servir!
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 font-medium leading-snug">
              Desayunos caseros, caldos reconfortantes y chilaquiles calientitos listos para llevar o recibir en tu domicilio.
            </p>
          </div>

          {/* Call To Actions */}
          <div className="space-y-2.5 pt-1">
            {/* Primary WhatsApp Action */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <MessageCircle className="w-6 h-6 fill-current" />
              <span>¡Whatsappear al Buen Servir!</span>
            </button>

            {/* Secondary Actions Row */}
            <div className="grid grid-cols-2 gap-2">
              {onOpenSofia && (
                <button
                  type="button"
                  onClick={handleOpenSofia}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <span>Pedir con Sofía IA</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleGoToMenu}
                className={`py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                  !onOpenSofia ? 'col-span-2' : ''
                }`}
              >
                <Utensils className="w-4 h-4 text-primary-400" />
                <span>Ver Menú Digital</span>
              </button>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-[10px] text-gray-400 font-semibold tracking-wide">
            {isPaused ? 'Temporizador en pausa (pasa el cursor fuera para continuar)' : `Este mensaje se cerrará automáticamente en ${timeLeft} segundos`}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Companion: Top Index Announcement Banner ("Banner de unos segundos en el index")
// ─────────────────────────────────────────────────────────────────────────────

interface PromoTopBannerProps {
  onOpenModal: () => void;
  onDismiss?: () => void;
  isVisible: boolean;
}

export function PromoTopBanner({ onOpenModal, onDismiss, isVisible }: PromoTopBannerProps) {
  if (!isVisible) return null;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_PRESET_MSG)}`;

  return (
    <aside
      aria-label="Aviso de promoción"
      className="w-full bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white text-xs font-bold py-2.5 px-4 sm:px-8 flex items-center justify-between border-b border-emerald-400/30 shadow-md relative z-[45] animate-in slide-in-from-top duration-300"
    >
      <div
        onClick={onOpenModal}
        className="flex-1 flex items-center justify-center gap-2 sm:gap-3 cursor-pointer group truncate"
      >
        <span className="px-2 py-0.5 rounded-full bg-black/25 text-[10px] font-black uppercase tracking-wider text-emerald-200 border border-white/20 shrink-0">
          🎉 Promo
        </span>
        <p className="truncate text-xs sm:text-sm font-black tracking-wide text-white group-hover:underline">
          La vida es corta... ¡Whatsappea al Buen Servir!
        </p>
        <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-200 group-hover:translate-x-1 transition-transform">
          Ver detalle <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            try { soundManager.play('click'); } catch (e) { }
          }}
          className="px-3 py-1 bg-white text-emerald-800 hover:bg-emerald-50 rounded-full font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-black/20 transition-colors"
            title="Ocultar aviso"
            aria-label="Ocultar aviso de promoción"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Companion: Floating Floating Promo Button (to reopen modal anytime)
// ─────────────────────────────────────────────────────────────────────────────

interface PromoFloatingButtonProps {
  onOpenModal: () => void;
}

export function PromoFloatingButton({ onOpenModal }: PromoFloatingButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        try { soundManager.play('click'); } catch (e) { }
        onOpenModal();
      }}
      title="Ver Promoción: ¡Whatsappea al Buen Servir!"
      className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 z-40 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-2 border-emerald-400/50 shadow-xl shadow-emerald-600/30 flex items-center gap-2 text-xs font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all cursor-pointer group"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-300" />
      </span>
      <MessageCircle className="w-4 h-4 fill-current text-white" />
      <span className="hidden sm:inline">Promo WhatsApp</span>
    </button>
  );
}
