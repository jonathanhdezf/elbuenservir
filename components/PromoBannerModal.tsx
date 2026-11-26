import React, { useState, useEffect, useRef } from 'react';
import {
  X, MessageCircle, Sparkles, Clock, ArrowRight, Utensils,
  Mic, Pause, ChevronLeft, ChevronRight
} from 'lucide-react';
import { soundManager } from '../utils/soundManager';

const WHATSAPP_NUMBER = '522311024672';
const DEFAULT_PRESET_MSG = '¡Hola Tlayoyos 3 Marías! Vi la promoción "La vida es corta... ¡Whatsappea a Tlayoyos 3 Marías!" y me gustaría hacer un pedido.';

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
  autoCloseSeconds = 12
}: PromoBannerModalProps) {
  const [timeLeft, setTimeLeft] = useState(autoCloseSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const timerRef = useRef<any>(null);

  const baseUrl = (import.meta as any).env.BASE_URL || '/';
  const promoSlides = [
    {
      src: `${baseUrl}assets/aistudio/591729797_1423529089780246_9166269732555178978_n_6cf3e08f.jpg`,
      alt: 'Este clima se acompaña con Tlayoyos 3 Marías',
      objectPos: 'object-[center_20%]',
      aspectClass: 'aspect-square max-w-[330px]'
    },
    {
      src: `${baseUrl}assets/aistudio/642411781_1502498118550009_1593438138219254161_n_d5eacb2d.jpg`,
      alt: '¡Buen provecho! Hambre no esperes más - Tlayoyos 3 Marías',
      objectPos: 'object-center',
      aspectClass: 'aspect-square max-w-[330px]'
    },
    {
      src: `${baseUrl}assets/aistudio/708911120_1584545090345311_309224322891505235_n_95094b68.jpg`,
      alt: 'Así se ve un tlayoyo hecho con cariño - Tlayoyos 3 Marías',
      objectPos: 'object-center',
      aspectClass: 'aspect-[6/5] max-w-[360px]'
    },
    {
      src: `${baseUrl}assets/aistudio/494373878_1231809338952223_3147762754903625367_n_0b7eeb8e.jpg`,
      alt: '¿De qué le vamos a dar? - Tlayoyos 3 Marías',
      objectPos: 'object-center',
      aspectClass: 'aspect-square max-w-[330px]'
    }
  ];

  // Reset countdown whenever opened and trigger instant pop-up sound
  useEffect(() => {
    let cleanupGestureListener: (() => void) | undefined;

    if (isOpen) {
      setTimeLeft(autoCloseSeconds);
      setIsPaused(false);
      try {
        soundManager.playPopup(() => {
          const playOnFirstGesture = (ev: Event) => {
            const target = ev.target as HTMLElement | null;
            if (target?.closest('[aria-label="Cerrar modal"]')) return;
            soundManager.playPopup();
            window.removeEventListener('pointerdown', playOnFirstGesture);
            window.removeEventListener('touchstart', playOnFirstGesture);
          };
          window.addEventListener('pointerdown', playOnFirstGesture, { once: true, passive: true });
          window.addEventListener('touchstart', playOnFirstGesture, { once: true, passive: true });
          cleanupGestureListener = () => {
            window.removeEventListener('pointerdown', playOnFirstGesture);
            window.removeEventListener('touchstart', playOnFirstGesture);
          };
        });
      } catch (e) { }
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }

    return () => {
      if (cleanupGestureListener) cleanupGestureListener();
    };
  }, [isOpen, autoCloseSeconds]);

  // Auto-rotate promo images when modal is open and not paused
  useEffect(() => {
    if (!isOpen || isPaused || promoSlides.length <= 1) return;
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % promoSlides.length);
    }, 3200);
    return () => clearInterval(slideTimer);
  }, [isOpen, isPaused, promoSlides.length]);

  // Tick countdown timer
  useEffect(() => {
    if (!isOpen || isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    timerRef.current = setTimeout(() => {
      if (timeLeft <= 1) {
        setTimeLeft(0);
        onClose();
      } else {
        setTimeLeft((prev) => prev - 1);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, isPaused, timeLeft, onClose]);

  if (!isOpen) return null;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_PRESET_MSG)}`;
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / autoCloseSeconds) * 100));

  const handleOpenWhatsApp = () => {
    try { soundManager.play('click'); } catch (e) { }
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

  const currentSlide = promoSlides[activeSlide] || promoSlides[0];
  const handlePrevSlide = () => {
    setIsPaused(true);
    setActiveSlide((prev) => (prev - 1 + promoSlides.length) % promoSlides.length);
  };
  const handleNextSlide = () => {
    setIsPaused(true);
    setActiveSlide((prev) => (prev + 1) % promoSlides.length);
  };

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
        className="relative z-10 w-full max-w-md sm:max-w-lg bg-gradient-to-b from-[#240819] via-[#15060f] to-[#0b0307] rounded-3xl sm:rounded-[36px] border-2 border-primary-500/45 shadow-[0_0_50px_rgba(228,0,124,0.3)] overflow-hidden text-white my-auto transform transition-all animate-in zoom-in-95 duration-300"
      >
        {/* Top Floating Progress Bar */}
        <div className="relative w-full h-1.5 bg-white/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isPaused ? 'bg-amber-400' : 'bg-gradient-to-r from-primary-400 via-rose-400 to-emerald-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-primary-500/25 blur-3xl pointer-events-none" />

        {/* Header Ribbon & Close */}
        <div className="px-4 sm:px-6 pt-3.5 pb-2 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 border border-primary-400/40 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-primary-300 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-primary-200">
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
          {/* Main Visual Promo Carousel */}
          <div className="space-y-2.5">
            <div className={`relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-primary-400/35 shadow-2xl bg-black/40 group ${currentSlide.aspectClass} w-full mx-auto flex items-center justify-center transition-all duration-300`}>
              <img
                key={currentSlide.src}
                src={currentSlide.src}
                alt={currentSlide.alt}
                className={`w-full h-full object-cover ${currentSlide.objectPos} transition-transform duration-700 group-hover:scale-105 animate-in fade-in`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5 pointer-events-none" />

              {/* Prev / Next Navigation Buttons */}
              <button
                type="button"
                onClick={handlePrevSlide}
                aria-label="Imagen anterior"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNextSlide}
                aria-label="Imagen siguiente"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Top Right Counter & Location */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white tabular-nums">
                  {activeSlide + 1}/{promoSlides.length}
                </span>
                <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[11px] font-black text-white shadow-lg">
                  Teziutlán
                </span>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex items-center justify-center gap-2">
              {promoSlides.map((slide, idx) => (
                <button
                  key={slide.src}
                  type="button"
                  onClick={() => {
                    setIsPaused(true);
                    setActiveSlide(idx);
                  }}
                  aria-label={`Ver promoción ${idx + 1}`}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    idx === activeSlide
                      ? 'border-primary-400 scale-105 shadow-md shadow-primary-500/30'
                      : 'border-white/15 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className={`w-full h-full object-cover ${slide.objectPos}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Copy description */}
          <div className="text-center space-y-1.5 px-2">
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white leading-tight">
              ¡La vida es corta... <span className="text-primary-300">Whatsappea</span> a Tlayoyos 3 Marías!
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
              <span>¡Whatsappear a Tlayoyos 3 Marías!</span>
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
      className="w-full bg-gradient-to-r from-primary-700 via-primary-600 to-rose-600 text-white text-xs font-bold py-2.5 px-4 sm:px-8 flex items-center justify-between border-b border-primary-400/30 shadow-md relative z-[45] animate-in slide-in-from-top duration-300"
    >
      <div
        onClick={onOpenModal}
        className="flex-1 flex items-center justify-center gap-2 sm:gap-3 cursor-pointer group truncate"
      >
        <span className="px-2 py-0.5 rounded-full bg-black/25 text-[10px] font-black uppercase tracking-wider text-emerald-200 border border-white/20 shrink-0">
          🎉 Promo
        </span>
        <p className="truncate text-xs sm:text-sm font-black tracking-wide text-white group-hover:underline">
          La vida es corta... ¡Whatsappea a Tlayoyos 3 Marías!
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
        onOpenModal();
      }}
      title="Ver Promoción: ¡Whatsappea a Tlayoyos 3 Marías!"
      className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 z-40 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-primary-600 to-rose-600 hover:from-primary-500 hover:to-rose-500 text-white border-2 border-primary-300/50 shadow-xl shadow-primary-600/30 flex items-center gap-2 text-xs font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all cursor-pointer group"
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
