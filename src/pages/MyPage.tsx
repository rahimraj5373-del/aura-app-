import {
  ChevronRight,
  Globe,
  Headphones,
  HelpCircle,
  Info,
  Shield,
  Wallet,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import type { ModalKind } from '../components/ActionSheetModal';
import { BRAND } from '../config/brand';
import { LANGUAGES } from '../lib/i18n';
import type { LanguageCode, UserProfile } from '../types/orbix';

interface MyPageProps {
  user: UserProfile;
  isAdmin: boolean;
  language: LanguageCode;
  labels: {
    withdraw: string;
    adminPanel: string;
    language: string;
    help: string;
    customerService: string;
    aboutUs: string;
  };
  onChangeLanguage: (lang: LanguageCode) => void;
  onOpenModal: (kind: ModalKind) => void;
  onOpenAdmin: () => void;
}

export function MyPage({
  user,
  isAdmin,
  language,
  labels,
  onChangeLanguage,
  onOpenModal,
  onOpenAdmin,
}: MyPageProps) {
  const [showLangPicker, setShowLangPicker] = useState(false);

  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(' ') || `${BRAND.name} Pioneer`;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="pb-28 space-y-6"
    >
      {/* Profile Avatar with Orbital Ring */}
      <section className="pt-8 pb-2 flex flex-col items-center text-center space-y-3">
        <div className="relative flex items-center justify-center">
          <div className="pointer-events-none absolute w-44 h-20 rounded-[100%] border border-[#C48A55]/25 -rotate-12" />
          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-[#F3D9B1]/65 to-[#C48A55]/25 shadow-[0_0_32px_rgba(196,138,85,0.28)] relative z-10">
            {user.photo_url ? (
              <img
                src={user.photo_url}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#24180F] flex items-center justify-center font-display text-2xl font-semibold text-[#F3D9B1]">
                {initials}
              </div>
            )}
          </div>
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold tracking-wide text-[#F7EFE6]">
            {displayName}
          </h1>
          <p className="text-xs text-[#A58E79] mt-0.5 font-mono-tabular">
            {user.username ? `@${user.username}` : `TG ID · ${user.tg_id}`}
          </p>
        </div>
      </section>

      <section className="orbix-glass rounded-[24px] divide-y divide-[#C48A55]/15 overflow-hidden">
        <button
          type="button"
          onClick={() => onOpenModal('withdraw')}
          className="w-full min-h-[60px] px-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3.5">
            <Wallet className="w-5 h-5 text-[#C48A55]" />
            <span className="text-sm font-medium text-[#F7EFE6]">{labels.withdraw}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#A58E79]">
            <span className="font-mono-tabular text-[#F3D9B1]">
              {user.balance.toFixed(0)} {BRAND.symbol}
            </span>
            <ChevronRight className="w-4 h-4 text-[#8E7763]" />
          </div>
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={onOpenAdmin}
            className="w-full min-h-[60px] px-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <Shield className="w-5 h-5 text-[#F3D9B1]" />
              <span className="text-sm font-semibold text-[#F3D9B1]">{labels.adminPanel}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#C48A55]" />
          </button>
        )}

        <div>
          <button
            type="button"
            onClick={() => setShowLangPicker((v) => !v)}
            className="w-full min-h-[60px] px-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <Globe className="w-5 h-5 text-[#C48A55]" />
              <span className="text-sm font-medium text-[#F7EFE6]">{labels.language}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#A58E79]">
              <span className="uppercase">{language}</span>
              <ChevronRight
                className={`w-4 h-4 text-[#8E7763] transition-transform ${
                  showLangPicker ? 'rotate-90' : ''
                }`}
              />
            </div>
          </button>

          {showLangPicker && (
            <div className="px-5 pb-4 grid grid-cols-2 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    onChangeLanguage(lang.code);
                    setShowLangPicker(false);
                  }}
                  className={`min-h-[40px] rounded-xl text-xs font-medium px-3 flex items-center justify-between border transition-colors ${
                    language === lang.code
                      ? 'orbix-gold-card text-[#1B120B] border-transparent font-semibold'
                      : 'bg-[#1D140D] border-[#C48A55]/25 text-[#CBB59F]'
                  }`}
                >
                  <span>{lang.native}</span>
                  <span className="uppercase text-[10px] opacity-75">{lang.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onOpenModal('help')}
          className="w-full min-h-[60px] px-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3.5">
            <HelpCircle className="w-5 h-5 text-[#C48A55]" />
            <span className="text-sm font-medium text-[#F7EFE6]">{labels.help}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8E7763]" />
        </button>

        <button
          type="button"
          onClick={() => onOpenModal('support')}
          className="w-full min-h-[60px] px-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3.5">
            <Headphones className="w-5 h-5 text-[#C48A55]" />
            <span className="text-sm font-medium text-[#F7EFE6]">{labels.customerService}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8E7763]" />
        </button>

        <button
          type="button"
          onClick={() => onOpenModal('about')}
          className="w-full min-h-[60px] px-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3.5">
            <Info className="w-5 h-5 text-[#C48A55]" />
            <span className="text-sm font-medium text-[#F7EFE6]">{labels.aboutUs}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8E7763]" />
        </button>
      </section>

      <footer className="pt-4 text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-12 bg-[#C48A55]/30" />
          <span className="font-display text-lg font-semibold tracking-[0.3em] text-[#CBB59F] uppercase">
            {BRAND.name}.
          </span>
          <span className="h-px w-12 bg-[#C48A55]/30" />
        </div>
        <p className="text-xs text-[#8E7763]">{BRAND.tagline}</p>
        <p className="text-[10px] uppercase tracking-[0.26em] text-[#6E5B4B]">{BRAND.subLabel}</p>
      </footer>
    </motion.div>
  );
}
