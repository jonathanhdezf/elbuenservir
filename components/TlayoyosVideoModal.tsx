import React, { useEffect } from 'react';
import { X, PlayCircle, ExternalLink } from 'lucide-react';
import { soundManager } from '../utils/soundManager';

interface TlayoyosVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const YOUTUBE_VIDEO_ID = 'FAYgJgaPiGE';
const YOUTUBE_WATCH_URL = `https://www.youtube.com/watch?v=${YOUTUBE_VIDEO_ID}`;
const YOUTUBE_EMBED_URL = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0`;

export const TlayoyosVideoModal: React.FC<TlayoyosVideoModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    try {
      soundManager.play('click');
    } catch (e) {}
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[620] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tlayoyos-video-modal-title"
    >
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />

      <div className="relative z-10 w-full max-w-4xl bg-white dark:bg-[#110a10] rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between gap-4 bg-gray-50/80 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
              <PlayCircle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3
                id="tlayoyos-video-modal-title"
                className="text-base sm:text-lg font-black tracking-tight text-gray-900 dark:text-white truncate"
              >
                Como se hacen / How are Tlayoyos Made?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Elaboración tradicional de tlayoyos · Tlayoyos 3 Marías
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar video"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 16:9 Video Player */}
        <div className="relative w-full aspect-video bg-black">
          <iframe
            className="w-full h-full border-0"
            src={YOUTUBE_EMBED_URL}
            title="Como se hacen / How are Tlayoyos Made?"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-7 py-3.5 sm:py-4 border-t border-gray-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 bg-gray-50/60 dark:bg-white/[0.02]">
          <a
            href={YOUTUBE_WATCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors min-h-[40px]"
          >
            <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Ver directamente en YouTube</span>
          </a>

          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-primary-500 hover:bg-gray-800 dark:hover:bg-primary-600 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer min-h-[40px]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TlayoyosVideoModal;
