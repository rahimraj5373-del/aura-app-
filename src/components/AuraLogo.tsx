import { useState } from 'react';
import { BRAND } from '../config/brand';

interface AuraLogoProps {
  size?: number;
  className?: string;
}

export function AuraLogo({ size = 40, className = '' }: AuraLogoProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full overflow-hidden shrink-0 border border-[#C48A55]/50 bg-gradient-to-br from-[#4D341F] via-[#27190E] to-[#130C07] flex items-center justify-center shadow-[0_0_18px_rgba(196,138,85,0.3)] ${className}`}
    >
      {BRAND.customLogoUrl && !imgError ? (
        <img
          src={BRAND.customLogoUrl}
          alt={`${BRAND.name} Logo`}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" aria-label={`${BRAND.name} Emblem`}>
          <defs>
            <radialGradient id="tvrCoinBg" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#9C6A3D" />
              <stop offset="55%" stopColor="#5C3A1E" />
              <stop offset="100%" stopColor="#26160B" />
            </radialGradient>
            <linearGradient id="tvrRim" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F9E8CD" />
              <stop offset="50%" stopColor="#D7A16B" />
              <stop offset="100%" stopColor="#7C4E26" />
            </linearGradient>
            <linearGradient id="tvrGoldT" x1="18" y1="16" x2="46" y2="50" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFF0D6" />
              <stop offset="48%" stopColor="#E6B882" />
              <stop offset="100%" stopColor="#B87A44" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="30" fill="url(#tvrCoinBg)" stroke="url(#tvrRim)" strokeWidth="2.5" />
          <circle cx="32" cy="32" r="24" stroke="#F3D9B1" strokeOpacity="0.25" strokeWidth="1" />
          <path
            d="M17 20H47L44 27H35.5V48H28.5V27H20L17 20Z"
            fill="url(#tvrGoldT)"
          />
        </svg>
      )}
    </div>
  );
}
