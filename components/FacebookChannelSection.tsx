import React, { useState } from 'react';
import { Facebook, ExternalLink, Share2, Check, MapPin, Clock, Utensils } from 'lucide-react';

const FACEBOOK_PAGE_URL = 'https://www.facebook.com/tlayoyos3marias/';
const FACEBOOK_POST_URL =
  'https://www.facebook.com/tlayoyos3marias/posts/pfbid0dnroPtqnExEBtkMrRdXkMPbQyh3KXXgjRoZBXU3qcxdaiRRJYR1nLKdvyRjN2weol';
const FACEBOOK_EMBED_SRC =
  'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Ftlayoyos3marias%2Fposts%2Fpfbid0dnroPtqnExEBtkMrRdXkMPbQyh3KXXgjRoZBXU3qcxdaiRRJYR1nLKdvyRjN2weol&show_text=true&width=500';

interface FacebookChannelSectionProps {
  onScrollToMenu?: () => void;
}

export const FacebookChannelSection: React.FC<FacebookChannelSectionProps> = ({ onScrollToMenu }) => {
  const [avatarError, setAvatarError] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseUrl = (import.meta as any).env.BASE_URL || '/';
  const avatarSrc = `${baseUrl}assets/aistudio/Designer__5__241aba85.png`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(FACEBOOK_POST_URL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <section
      id="facebook-canal"
      className="py-20 md:py-28 px-6 md:px-12 bg-[#FDFBFC] dark:bg-[#110a10] border-t border-gray-100 dark:border-gray-900 transition-colors duration-300"
    >
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
          {/* Left Column: Editorial Channel Info & Actions */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.26em] text-[#1877F2] dark:text-blue-400">
                <Facebook className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Canal Oficial en Facebook</span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-black tracking-tighter leading-tight text-gray-900 dark:text-white text-balance">
                Sabor recién hecho y novedades en nuestro{' '}
                <span className="text-primary-500 font-serif italic font-normal">
                  Facebook
                </span>
              </h2>

              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl">
                Acompaña nuestra historia desde Teziutlán en nuestra página oficial de Facebook. Compartimos especialidades del comal, antojitos de temporada, promociones y el día a día de Tlayoyos 3 Marías.
              </p>
            </div>

            {/* Clean Unboxed Metadata Strip */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-500 dark:text-gray-400 border-y border-gray-200/80 dark:border-gray-800 py-4">
              <span className="font-semibold text-gray-900 dark:text-gray-100">Tlayoyos 3 Marías</span>
              <span aria-hidden="true">·</span>
              <span>Av. Cuauhtémoc #311 - 313, Teziutlán</span>
              <span aria-hidden="true">·</span>
              <span>+50 años de tradición</span>
            </div>

            {/* Channel Highlights */}
            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <Utensils className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Antojitos y caldos del día
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Descubre tlayoyos, chilaquiles, pozole, pancita y bebidas recién preparadas en nuestras publicaciones.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <MapPin className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Tradición desde el Mercado Victoria
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Pioneros con más de cinco décadas sirviendo desayunos y guisados caseros en el Centro de Teziutlán.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <Clock className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Horarios y avisos directos
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Lunes a Sábado de 8:15 a.m. a 7:00 p.m. · Domingos de 8:00 a.m. a 7:00 p.m.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={FACEBOOK_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#1877F2] hover:bg-[#1464cf] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#110a10]"
              >
                <Facebook className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Visitar Canal de Facebook</span>
                <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
              </a>

              {onScrollToMenu && (
                <button
                  type="button"
                  onClick={onScrollToMenu}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 text-gray-800 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 text-xs sm:text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Explorar Menú</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Official Embedded Facebook Post */}
          <div className="lg:col-span-6 flex">
            <article className="w-full flex flex-col justify-between bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 rounded-3xl shadow-xl shadow-gray-900/5 dark:shadow-black/30 overflow-hidden">
              {/* Header */}
              <div className="p-5 sm:px-6 flex items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl overflow-hidden bg-primary-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0 flex items-center justify-center">
                    {!avatarError ? (
                      <img
                        src={avatarSrc}
                        alt="Tlayoyos 3 Marías"
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Facebook className="w-5 h-5 text-[#1877F2]" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-black text-gray-900 dark:text-white truncate">
                        Tlayoyos 3 Marías
                      </h3>
                      <span
                        title="Página oficial"
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#1877F2] text-white shrink-0"
                      >
                        <Check className="w-2.5 h-2.5" aria-hidden="true" />
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Publicación en vivo · @tlayoyos3marias
                    </p>
                  </div>
                </div>

                <a
                  href={FACEBOOK_PAGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir página oficial en Facebook"
                  className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-[#1877F2] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors shrink-0"
                >
                  <Facebook className="w-5 h-5" aria-hidden="true" />
                </a>
              </div>

              {/* Embedded Official Facebook Post Iframe */}
              <div className="w-full p-4 sm:p-6 bg-gray-50/70 dark:bg-gray-950/40 flex items-center justify-center overflow-x-auto">
                <div className="w-full max-w-[500px] mx-auto bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200/80">
                  <iframe
                    src={FACEBOOK_EMBED_SRC}
                    title="Publicación oficial de Tlayoyos 3 Marías en Facebook"
                    width="500"
                    height="455"
                    scrolling="no"
                    frameBorder={0}
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    loading="lazy"
                    className="w-full h-[455px] border-0 overflow-hidden block"
                  />
                </div>
              </div>

              {/* Card Bottom Footer */}
              <div className="p-4 sm:px-6 bg-gray-50/80 dark:bg-gray-950/60 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      <span className="text-emerald-600 dark:text-emerald-400">Enlace copiado</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" aria-hidden="true" />
                      <span>Copiar enlace</span>
                    </>
                  )}
                </button>

                <a
                  href={FACEBOOK_POST_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-[#1877F2] dark:hover:bg-[#1877F2] dark:hover:text-white text-xs font-black uppercase tracking-wider transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Ver en Facebook</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
};
