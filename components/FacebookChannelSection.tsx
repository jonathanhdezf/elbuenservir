import React, { useState, useRef } from 'react';
import {
  Facebook,
  ExternalLink,
  Share2,
  Check,
  MapPin,
  Clock,
  Utensils,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';

const FACEBOOK_PAGE_URL = 'https://www.facebook.com/tlayoyos3marias/';
const FACEBOOK_POST_URL =
  'https://www.facebook.com/tlayoyos3marias/posts/pfbid0dnroPtqnExEBtkMrRdXkMPbQyh3KXXgjRoZBXU3qcxdaiRRJYR1nLKdvyRjN2weol';

interface FacebookChannelSectionProps {
  onScrollToMenu?: () => void;
}

export const FacebookChannelSection: React.FC<FacebookChannelSectionProps> = ({ onScrollToMenu }) => {
  const [avatarError, setAvatarError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [posterError, setPosterError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const baseUrl = (import.meta as any).env.BASE_URL || '/';
  const videoSrc = `${baseUrl}assets/aistudio/tlayoyo_efa7202e.mp4`;
  const postImageSrc = `${baseUrl}assets/aistudio/494373878_1231809338952223_3147762754903625367_n_0b7eeb8e.jpg`;
  const avatarSrc = `${baseUrl}assets/aistudio/Designer__5__241aba85.png`;

  const handleTogglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  const handleToggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const nextMuted = !isMuted;
    vid.muted = nextMuted;
    setIsMuted(nextMuted);
  };

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

          {/* Right Column: Native Reliable Featured Video & Facebook Post Card */}
          <div className="lg:col-span-6 flex">
            <article className="w-full flex flex-col justify-between bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 rounded-3xl shadow-xl shadow-gray-900/5 dark:shadow-black/30 overflow-hidden">
              {/* Post Header */}
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
                      Publicación destacada · @tlayoyos3marias
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

              {/* Post Copy */}
              <div className="px-5 sm:px-6 py-4 space-y-1.5">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 leading-relaxed">
                  Los tradicionales Tlayoyos de Teziutlán, Puebla. Más de 50 años compartiendo sabor artesanal desde el Mercado Victoria hasta nuestra cocina en Av. Cuauhtémoc #311 - 313.
                </p>
                <p className="text-sm font-black text-primary-600 dark:text-primary-400 italic">
                  ¡Todo bien, todo rico!
                </p>
              </div>

              {/* Video / Media Stage (100% compatible with Vercel & all browsers, zero Meta X-Frame-Options block) */}
              <div className="relative w-full h-72 sm:h-80 bg-gray-950 overflow-hidden group">
                {!videoError ? (
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    poster={postImageSrc}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    onError={() => setVideoError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : !posterError ? (
                  <img
                    src={postImageSrc}
                    alt="Tlayoyos 3 Marías en Facebook"
                    referrerPolicy="no-referrer"
                    onError={() => setPosterError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950 text-white p-6 text-center">
                    <Facebook className="w-10 h-10 mb-2 text-[#1877F2]" aria-hidden="true" />
                    <span className="text-sm font-black uppercase tracking-wider">Tlayoyos 3 Marías</span>
                    <span className="text-xs text-gray-400 mt-1">Video oficial en Facebook</span>
                  </div>
                )}

                {/* Contrast Scrim & Controls */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent flex flex-col justify-between p-4 sm:p-5 pointer-events-none">
                  <div className="flex items-center justify-end gap-2 pointer-events-auto">
                    {!videoError && (
                      <>
                        <button
                          type="button"
                          onClick={handleTogglePlay}
                          aria-label={isPlaying ? 'Pausar video' : 'Reproducir video'}
                          className="p-2.5 rounded-xl bg-black/55 hover:bg-black/75 text-white backdrop-blur-md border border-white/15 transition-colors cursor-pointer"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={handleToggleMute}
                          aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
                          className="p-2.5 rounded-xl bg-black/55 hover:bg-black/75 text-white backdrop-blur-md border border-white/15 transition-colors cursor-pointer"
                        >
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex items-end justify-between gap-3 pointer-events-auto">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                        Facebook · Video oficial
                      </p>
                      <p className="text-sm sm:text-base font-black text-white">
                        Tlayoyos 3 Marías Teziutlán
                      </p>
                    </div>
                    <a
                      href={FACEBOOK_POST_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#1464cf] text-white text-xs font-black uppercase tracking-wider shadow-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Ver video en Facebook</span>
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  </div>
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
                  <span>Abrir publicación</span>
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
