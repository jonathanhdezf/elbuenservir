import React, { useState, useEffect, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote, MapPin, Facebook, CheckCircle2 } from 'lucide-react';

interface Testimonial {
  id: string;
  author: string;
  initials: string;
  source: 'Google Maps' | 'Facebook';
  rating: number;
  date: string;
  dishHighlight: string;
  comment: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 'rev-1',
    author: 'María Elena Vázquez',
    initials: 'ME',
    source: 'Google Maps',
    rating: 5,
    date: 'Hace 3 días',
    dishHighlight: 'Tlayoyos y Gorditas',
    comment:
      'El mejor sabor tradicional de Teziutlán. Las gorditas y los tlayoyos siempre llegan calientitos, bien servidos y con salsas caseras deliciosas. Atención muy amable.'
  },
  {
    id: 'rev-2',
    author: 'Carlos Hernández',
    initials: 'CH',
    source: 'Facebook',
    rating: 5,
    date: 'Hace 1 semana',
    dishHighlight: 'Chilaquiles Especiales',
    comment:
      'Pedí por el menú digital hacia WhatsApp y fue súper rápido. Los chilaquiles crujientes con pechuga y su café de olla son una maravilla para desayunar en familia.'
  },
  {
    id: 'rev-3',
    author: 'Laura Patricia Mora',
    initials: 'LP',
    source: 'Google Maps',
    rating: 5,
    date: 'Hace 2 semanas',
    dishHighlight: 'Pozole Tradicional',
    comment:
      'Más de 30 años manteniendo la misma sazón casera. El pozole de puerco y la pancita del fin de semana son imperdibles, con porciones generosas y excelente higiene.'
  },
  {
    id: 'rev-4',
    author: 'Javier Domínguez',
    initials: 'JD',
    source: 'Google Maps',
    rating: 5,
    date: 'Hace 3 semanas',
    dishHighlight: 'Milanesa y Guarniciones',
    comment:
      'Me encantó poder elegir mis guarniciones directo desde el celular sin esperar en fila. Todo llegó puntual, en excelente empaque y con un sazón auténtico de hogar.'
  },
  {
    id: 'rev-5',
    author: 'Sofía Ramírez Cruz',
    initials: 'SR',
    source: 'Facebook',
    rating: 5,
    date: 'Hace 1 mes',
    dishHighlight: 'Fresas con Crema y Jugo',
    comment:
      'El jugo de naranja recién exprimido y las fresas con crema son nuestros favoritos. Un lugar emblemático en el Centro de Teziutlán que nunca falla.'
  },
  {
    id: 'rev-6',
    author: 'Roberto Sánchez',
    initials: 'RS',
    source: 'Google Maps',
    rating: 5,
    date: 'Hace 1 mes',
    dishHighlight: 'Chilpozo de Res',
    comment:
      'Caldos reconfortantes con sabor de cocina tradicional poblana. El servicio a domicilio es muy rápido y siempre atienden con una sonrisa.'
  }
];

export const TestimonialsCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const total = TESTIMONIALS.length;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, total]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 45) {
        if (diff > 0) handleNext();
        else handlePrev();
      }
      touchStartX.current = null;
    }
    setIsPaused(false);
  };

  // Show 3 circular items (1 visible on mobile, 2 on tablet md, 3 on desktop lg)
  const visibleTestimonials = [
    TESTIMONIALS[activeIndex],
    TESTIMONIALS[(activeIndex + 1) % total],
    TESTIMONIALS[(activeIndex + 2) % total]
  ];

  return (
    <section
      id="testimonios"
      className="py-20 md:py-28 px-6 md:px-12 relative overflow-hidden bg-gradient-to-b from-[#FDFBFC] via-primary-50/40 to-white dark:from-[#110a10] dark:via-[#1a0915] dark:to-gray-950 transition-colors duration-300"
    >
      {/* Subtle Ambient Glows */}
      <div className="absolute -top-24 left-1/4 w-72 h-72 bg-primary-500/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-[110px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 md:mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-black uppercase tracking-[0.28em] text-xs mb-3">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>Reseñas en Google Maps y Redes Sociales</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-none text-gray-900 dark:text-white">
              Testimonios de{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-rose-500 to-amber-500 dark:from-primary-400 dark:via-rose-300 dark:to-amber-300 font-serif italic font-normal">
                Clientes
              </span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mt-4 leading-relaxed font-medium">
              La opinión de quienes nos visitan cada día en Teziutlán y disfrutan nuestros platillos desde casa.
            </p>
          </div>

          {/* Summary Rating + Controls */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-gray-900/90 border border-primary-100 dark:border-primary-500/20 shadow-md shadow-primary-900/5">
              <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">4.9</div>
              <div className="h-7 w-px bg-gray-200 dark:bg-gray-700" />
              <div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">
                  Calificación promedio
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Testimonio anterior"
                className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-900 border border-primary-200/80 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-primary-500 hover:text-white hover:border-primary-500 dark:hover:bg-primary-500 dark:hover:border-primary-500 flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Siguiente testimonio"
                className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-900 border border-primary-200/80 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-primary-500 hover:text-white hover:border-primary-500 dark:hover:bg-primary-500 dark:hover:border-primary-500 flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Track */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {visibleTestimonials.map((item, idx) => (
            <article
              key={`${item.id}-${activeIndex}`}
              className={`
                ${idx === 1 ? 'hidden md:flex' : ''}
                ${idx === 2 ? 'hidden lg:flex' : ''}
                ${idx === 0 ? 'flex' : ''}
                flex-col justify-between bg-white dark:bg-gray-900/90 border border-primary-100/90 dark:border-primary-500/20 rounded-[28px] p-6 sm:p-8 shadow-xl shadow-primary-900/5 hover:shadow-primary-500/10 hover:border-primary-400/60 transition-all duration-300 animate-in fade-in slide-in-from-right-4
              `}
            >
              <div>
                {/* Top Row: Stars & Source */}
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-1" aria-label={`${item.rating} de 5 estrellas`}>
                    {[...Array(item.rating)].map((_, starIdx) => (
                      <Star key={starIdx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                      item.source === 'Google Maps'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/40'
                        : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700/40'
                    }`}
                  >
                    {item.source === 'Google Maps' ? (
                      <MapPin className="w-3 h-3" />
                    ) : (
                      <Facebook className="w-3 h-3" />
                    )}
                    <span>{item.source}</span>
                  </span>
                </div>

                {/* Quote & Review Text */}
                <div className="relative">
                  <Quote className="w-7 h-7 text-primary-500/20 mb-2" />
                  <p className="text-gray-700 dark:text-gray-200 text-base leading-relaxed font-medium">
                    "{item.comment}"
                  </p>
                </div>

                {/* Dish Highlight */}
                <p className="mt-4 text-xs font-extrabold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  Platillo favorito: {item.dishHighlight}
                </p>
              </div>

              {/* Author Footer */}
              <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 via-rose-500 to-amber-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-primary-500/25">
                    {item.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-black text-sm text-gray-900 dark:text-white truncate">
                        {item.author}
                      </p>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    </div>
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                      Cliente verificado • {item.date}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Carousel Dot Indicators */}
        <div className="mt-10 flex items-center justify-center gap-2.5" role="tablist" aria-label="Navegación de testimonios">
          {TESTIMONIALS.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={activeIndex === idx}
              aria-label={`Ver reseña de ${item.author}`}
              onClick={() => setActiveIndex(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeIndex === idx
                  ? 'w-8 bg-gradient-to-r from-primary-500 to-rose-500 shadow-sm shadow-primary-500/40'
                  : 'w-2.5 bg-primary-200 dark:bg-gray-700 hover:bg-primary-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
