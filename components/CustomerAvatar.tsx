import React, { useEffect, useRef, useState } from 'react';
import lottie, { AnimationItem } from 'lottie-web/build/player/lottie_light';
import avatarAnimationData from '../assets/avatar-animation.json';

interface CustomerAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  className?: string;
  showOnlineBadge?: boolean;
  badgeClassName?: string;
  alternateWithInitial?: boolean;
  alternateIntervalMs?: number;
}

export const CustomerAvatar: React.FC<CustomerAvatarProps> = ({
  avatarUrl,
  name,
  className = 'w-10 h-10',
  showOnlineBadge = false,
  badgeClassName = 'w-2.5 h-2.5',
  alternateWithInitial = false,
  alternateIntervalMs = 3500
}) => {
  const lottieContainerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const [imgError, setImgError] = useState(false);
  const [showInitial, setShowInitial] = useState(false);

  // Check if avatarUrl is a custom static image or file
  const isCustomImage = !!(
    avatarUrl &&
    !imgError &&
    avatarUrl !== 'default' &&
    avatarUrl !== 'default_lottie' &&
    avatarUrl !== 'Avatar.lottie' &&
    avatarUrl !== '/assets/Avatar.lottie' &&
    (avatarUrl.startsWith('http') ||
      avatarUrl.startsWith('data:') ||
      avatarUrl.startsWith('blob:') ||
      /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(avatarUrl))
  );

  useEffect(() => {
    // Reset image error if avatarUrl changes
    setImgError(false);
  }, [avatarUrl]);

  // Alternation timer
  useEffect(() => {
    if (!alternateWithInitial || !name) {
      setShowInitial(false);
      return;
    }

    const interval = setInterval(() => {
      setShowInitial(prev => !prev);
    }, alternateIntervalMs);

    return () => clearInterval(interval);
  }, [alternateWithInitial, name, alternateIntervalMs]);

  useEffect(() => {
    // Only load Lottie if we are rendering the default animation
    if (!isCustomImage && lottieContainerRef.current) {
      if (animRef.current) {
        animRef.current.destroy();
      }

      try {
        animRef.current = lottie.loadAnimation({
          container: lottieContainerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: avatarAnimationData,
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
            progressiveLoad: true
          }
        });
      } catch (err) {
        console.error('Failed to load avatar animation:', err);
      }
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, [isCustomImage]);

  const initialLetter = (name || 'C').trim().charAt(0).toUpperCase();

  return (
    <div className={`relative shrink-0 ${className}`}>
      <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-primary-500 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
        {/* Layer 1: Avatar Image or Animated Lottie */}
        <div
          className={`absolute inset-0 w-full h-full flex items-center justify-center transition-all duration-700 ease-in-out ${
            alternateWithInitial && showInitial
              ? 'opacity-0 scale-75 rotate-12 pointer-events-none'
              : 'opacity-100 scale-100 rotate-0'
          }`}
        >
          {isCustomImage ? (
            <img
              src={avatarUrl!}
              alt={name || 'Avatar'}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              ref={lottieContainerRef}
              className="w-full h-full flex items-center justify-center pointer-events-none transform scale-110"
              title={name ? `Avatar de ${name}` : 'Avatar'}
            />
          )}
        </div>

        {/* Layer 2: Initial Badge (Alternating) */}
        {alternateWithInitial && (
          <div
            className={`absolute inset-0 w-full h-full rounded-full bg-gradient-to-tr from-primary-500/25 via-amber-500/20 to-primary-600/30 dark:from-primary-950 dark:via-amber-950/40 dark:to-primary-900/50 flex items-center justify-center transition-all duration-700 ease-in-out ${
              showInitial
                ? 'opacity-100 scale-100 rotate-0'
                : 'opacity-0 scale-75 -rotate-12 pointer-events-none'
            }`}
          >
            <span className="font-black text-primary-600 dark:text-primary-400 select-none tracking-tight text-xs sm:text-sm">
              {initialLetter}
            </span>
          </div>
        )}
      </div>

      {showOnlineBadge && (
        <span
          className={`absolute bottom-0 right-0 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900 ring-1 ring-emerald-500/20 z-10 ${badgeClassName}`}
        />
      )}
    </div>
  );
};
