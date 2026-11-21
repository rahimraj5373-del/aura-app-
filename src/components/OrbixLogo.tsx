import { useState } from 'react';
import { BRAND } from '../config/brand';

interface OrbixLogoProps {
  size?: number;
  className?: string;
}

export function OrbixLogo({ size = 40, className = '' }: OrbixLogoProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full overflow-hidden shrink-0 border border-[#C48A55]/50 bg-gradient-to-br from-[#3A2514] via-[#1E130B] to-[#0E0906] flex items-center justify-center shadow-[0_0_20px_rgba(196,138,85,0.32)] ${className}`}
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
            <radialGradient id="orbixCoinBg" cx="35%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#462D19" />
              <stop offset="60%" stopColor="#21140B" />
              <stop offset="100%" stopColor="#0E0805" />
            </radialGradient>
            <linearGradient id="orbixRim" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F9E8CD" />
              <stop offset="50%" stopColor="#D7A16B" />
              <stop offset="100%" stopColor="#7C4E26" />
            </linearGradient>
            <radialGradient id="orbixPlanetGrad" cx="34%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFF3D8" />
              <stop offset="42%" stopColor="#E4B278" />
              <stop offset="82%" stopColor="#9B6330" />
              <stop offset="100%" stopColor="#5C3616" />
            </radialGradient>
            <linearGradient id="orbixRingGrad" x1="8" y1="44" x2="56" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#A66D3A" />
              <stop offset="50%" stopColor="#FFF0D1" />
              <stop offset="100%" stopColor="#B97E47" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="30" fill="url(#orbixCoinBg)" stroke="url(#orbixRim)" strokeWidth="2.2" />
          <circle cx="32" cy="32" r="24.5" stroke="#F3D9B1" strokeOpacity="0.18" strokeWidth="1" />
          {/* Back arc of thin orbit ring */}
          <path
            d="M11.5 36.5C9.5 27.5 19.5 19 33 17.5C45.5 16 54.5 21.5 52.5 28.5"
            stroke="url(#orbixRingGrad)"
            strokeOpacity="0.35"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* Gold planet core */}
          <circle cx="32" cy="32" r="13.5" fill="url(#orbixPlanetGrad)" />
          <ellipse cx="27.5" cy="27" rx="4.5" ry="2.6" transform="rotate(-24 27.5 27)" fill="#FFF8E8" fillOpacity="0.45" />
          {/* Front arc of thin orbit ring */}
          <path
            d="M10.5 35.5C14.5 43.2 27.2 43.8 39.2 38.8C50.2 34.2 55.6 27.2 52.5 21.5"
            stroke="url(#orbixRingGrad)"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          {/* Orbital satellite dot */}
          <circle cx="48.5" cy="19.5" r="2" fill="#FFF3D8" />
        </svg>
      )}
    </div>
  );
}
