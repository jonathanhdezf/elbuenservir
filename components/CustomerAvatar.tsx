import React, { useEffect, useRef, useState } from 'react';
import lottie, { AnimationItem } from 'lottie-web/build/player/lottie_light';
import avatarAnimationData from '../assets/avatar-animation.json';

interface CustomerAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  className?: string;
  showOnlineBadge?: boolean;
  badgeClassName?: string;
}

export const CustomerAvatar: React.FC<CustomerAvatarProps> = ({
  avatarUrl,
  name,
  className = 'w-10 h-10',
  showOnlineBadge = false,
  badgeClassName = 'w-2.5 h-2.5'
}) => {
  const lottieContainerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const [imgError, setImgError] = useState(false);

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

  return (
    <div className={`relative shrink-0 ${className}`}>
      <div className="w-full h-full rounded-full overflow-hidden border-2 border-primary-500 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
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

      {showOnlineBadge && (
        <span
          className={`absolute bottom-0 right-0 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900 ring-1 ring-emerald-500/20 ${badgeClassName}`}
        />
      )}
    </div>
  );
};
