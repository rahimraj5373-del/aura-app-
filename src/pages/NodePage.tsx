import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { BRAND } from '../config/brand';
import { triggerHaptic } from '../lib/telegram';
import type { NodeTier, UserNode, UserProfile } from '../types/orbix';

interface NodePageProps {
  user: UserProfile;
  nodeTiers: NodeTier[];
  userNodes: UserNode[];
  inviteBannerTitle: string;
  onOpenInvite: () => void;
  onActivateNode: (tierId: string) => Promise<void>;
  onClaimNode: (userNodeId: string) => Promise<void>;
}

const TIER_GLOW_COLORS = [
  { primary: '#F8DFB2', secondary: '#C48A55', rim: '#FFE8BF' },
  { primary: '#F5CE93', secondary: '#B6763C', rim: '#FFD99E' },
  { primary: '#FAD68A', secondary: '#C98434', rim: '#FFE2A8' },
  { primary: '#FBE1A0', secondary: '#D4943A', rim: '#FFECB8' },
  { primary: '#FFE7AD', secondary: '#DE9F42', rim: '#FFF0C6' },
  { primary: '#FFF0C2', secondary: '#E5AD52', rim: '#FFF6D8' },
  { primary: '#FFF6D9', secondary: '#F0BC65', rim: '#FFFFFF' },
];

export function NodePage({
  user,
  nodeTiers,
  userNodes,
  inviteBannerTitle,
  onOpenInvite,
  onActivateNode,
  onClaimNode,
}: NodePageProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  if (!nodeTiers.length) return null;

  const safeIndex = Math.min(selectedIndex, nodeTiers.length - 1);
  const currentTier = nodeTiers[safeIndex];
  const palette = TIER_GLOW_COLORS[safeIndex % TIER_GLOW_COLORS.length];
  const todayUtc = new Date().toISOString().slice(0, 10);

  const ownedForTier = userNodes.filter((n) => n.tier_id === currentTier.id);
  const claimableNode = ownedForTier.find(
    (n) => n.last_claim_date !== todayUtc && n.days_claimed < n.duration_days
  );

  const handlePrev = () => {
    triggerHaptic('light');
    setFeedback(null);
    setSelectedIndex((prev) => (prev === 0 ? nodeTiers.length - 1 : prev - 1));
  };

  const handleNext = () => {
    triggerHaptic('light');
    setFeedback(null);
    setSelectedIndex((prev) => (prev + 1) % nodeTiers.length);
  };

  const handleActivate = async () => {
    setBusyAction('activate');
    setFeedback(null);
    try {
      await onActivateNode(currentTier.id);
      triggerHaptic('success');
      setFeedback({
        type: 'ok',
        text: `${currentTier.name} activated! Claim +${currentTier.dailyOrx} ${BRAND.symbol} daily.`,
      });
    } catch (err) {
      triggerHaptic('error');
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to activate node',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleClaim = async (userNodeId: string) => {
    setBusyAction(userNodeId);
    setFeedback(null);
    try {
      await onClaimNode(userNodeId);
      triggerHaptic('success');
      setFeedback({
        type: 'ok',
        text: `Claimed +${currentTier.dailyOrx} ${BRAND.symbol} daily node release!`,
      });
    } catch (err) {
      triggerHaptic('error');
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to claim node reward',
      });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="pb-28 space-y-4"
    >
      {/* Top Invite Banner */}
      <section className="orbix-glass rounded-[22px] p-4 relative overflow-hidden min-h-[116px] flex items-center mt-1">
        <img
          src="/src/assets/images/orbix_planet_bg.jpg"
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#130D09] via-[#130D09]/82 to-transparent" />

        <div className="relative z-10 max-w-[66%] space-y-1">
          <h1 className="font-display text-[17px] font-semibold text-[#F7EFE6] leading-snug">
            {inviteBannerTitle}
          </h1>
          <p className="text-[11px] text-[#CBB59F]">View Community Rewards</p>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onOpenInvite();
            }}
            className="pt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[#F3D9B1]"
          >
            <span>Invite Now</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C48A55]" />
          </button>
        </div>

        {/* Golden Community Network Graphic */}
        <svg
          viewBox="0 0 110 90"
          className="relative z-10 ml-auto w-24 h-20 shrink-0 opacity-95"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="nodeInviteGold" x1="0" y1="0" x2="110" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F8E7CA" />
              <stop offset="100%" stopColor="#9E6838" />
            </linearGradient>
          </defs>
          <ellipse cx="55" cy="70" rx="44" ry="12" stroke="#E5BE8B" strokeOpacity="0.35" strokeWidth="1" />
          <circle cx="55" cy="24" r="9" fill="url(#nodeInviteGold)" />
          <path d="M40 52C40 42 46 37 55 37C64 37 70 42 70 52V58H40V52Z" fill="url(#nodeInviteGold)" />
          <circle cx="25" cy="34" r="6.5" fill="url(#nodeInviteGold)" fillOpacity="0.75" />
          <path d="M14 56C14 48 19 44 25 44C31 44 36 48 36 56V60H14V56Z" fill="url(#nodeInviteGold)" fillOpacity="0.75" />
          <circle cx="85" cy="34" r="6.5" fill="url(#nodeInviteGold)" fillOpacity="0.75" />
          <path d="M74 56C74 48 79 44 85 44C91 44 96 48 96 56V60H74V56Z" fill="url(#nodeInviteGold)" fillOpacity="0.75" />
          <rect x="41" y="54" width="28" height="19" rx="3" fill="#2A1B0F" stroke="#F3D9B1" strokeWidth="1.2" />
          <path d="M42 56L55 65L68 56" stroke="#F3D9B1" strokeWidth="1.2" />
        </svg>
      </section>

      {/* Release Plan (Daily) Horizontal Tier Grid */}
      <section className="orbix-glass rounded-[22px] p-4 space-y-3">
        <div className="flex items-center gap-2 text-[#E8DDD0]">
          <Calendar className="w-4 h-4 text-[#C48A55]" />
          <h2 className="text-[13px] font-semibold">Release Plan (Daily)</h2>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {nodeTiers.map((tier, idx) => {
            const active = idx === safeIndex;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setFeedback(null);
                  setSelectedIndex(idx);
                }}
                className={`min-w-[74px] flex-1 rounded-xl px-2 py-2.5 flex flex-col items-center justify-between gap-2.5 border transition-all ${
                  active
                    ? 'bg-[#2A1D12]/90 border-[#F3D9B1]/50 shadow-[0_0_14px_rgba(196,138,85,0.2)]'
                    : 'bg-[#17100A]/70 border-[#C48A55]/12 hover:border-[#C48A55]/30'
                }`}
              >
                <span className={`text-[11px] font-medium ${active ? 'text-[#F3D9B1]' : 'text-[#CBB59F]'}`}>
                  {tier.name}
                </span>
                <div className="w-full h-[2px] rounded-full bg-[#3A291C] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      active ? 'bg-gradient-to-r from-[#F3D9B1] to-[#C48A55]' : 'bg-[#C48A55]/45'
                    }`}
                    style={{ width: `${Math.min(100, 28 + idx * 12)}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono-tabular font-semibold text-[#F7EFE6] whitespace-nowrap">
                  {tier.dailyOrx} {BRAND.symbol}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Dot Pagination Bar (01 / 07) */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {nodeTiers.map((tier, idx) => {
            const active = idx === safeIndex;
            return (
              <button
                key={tier.id}
                type="button"
                aria-label={`Select ${tier.name}`}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedIndex(idx);
                }}
                className={`h-2 rounded-full transition-all ${
                  active
                    ? 'w-7 bg-gradient-to-r from-[#F8E7CA] to-[#C48A55] shadow-[0_0_10px_rgba(243,217,177,0.45)]'
                    : 'w-2 bg-[#4A3828] hover:bg-[#7A5D43]'
                }`}
              />
            );
          })}
        </div>
        <span className="text-xs font-mono-tabular text-[#CBB59F]">
          <span className="text-[#F3D9B1] font-semibold text-sm">{currentTier.indexLabel}</span>
          {' / '}
          {String(nodeTiers.length).padStart(2, '0')}
        </span>
      </div>

      {/* Main Orbix / NFT 3D Cube Showcase Card */}
      <section className="orbix-glass rounded-[26px] overflow-hidden border-[#C48A55]/30">
        <div className="relative h-[300px] bg-[radial-gradient(circle_at_50%_46%,rgba(229,190,139,0.24),rgba(44,29,16,0.55)_45%,#0E0906_82%)] p-4 flex flex-col justify-between">
          {/* Top overlay bar */}
          <div className="flex items-center justify-between z-10">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#CBB59F]">
              {BRAND.name} / NFT
            </span>
            <span className="font-display text-lg font-medium text-[#F3D9B1] font-mono-tabular">
              {currentTier.indexLabel}
            </span>
          </div>

          {/* 3D Isometric Golden Orbix Cube on Pedestal */}
          <div className="relative flex-1 flex items-center justify-center">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous node"
              className="absolute left-0 z-20 w-9 h-9 rounded-full bg-[#1C130C]/80 border border-[#C48A55]/35 flex items-center justify-center text-[#F3D9B1] hover:border-[#F3D9B1]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <motion.svg
              key={currentTier.id}
              initial={{ scale: 0.94, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.22 }}
              viewBox="0 0 240 215"
              className="w-[215px] h-[192px] drop-shadow-[0_14px_30px_rgba(196,138,85,0.35)]"
              fill="none"
            >
              <defs>
                <linearGradient id="cubeTopGrad" x1="70" y1="22" x2="170" y2="82" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor={palette.rim} />
                  <stop offset="55%" stopColor={palette.primary} />
                  <stop offset="100%" stopColor={palette.secondary} />
                </linearGradient>
                <linearGradient id="cubeLeftGrad" x1="56" y1="56" x2="120" y2="158" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#6D4726" />
                  <stop offset="100%" stopColor="#26170B" />
                </linearGradient>
                <linearGradient id="cubeRightGrad" x1="120" y1="56" x2="184" y2="158" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#B87E49" />
                  <stop offset="100%" stopColor="#3B2412" />
                </linearGradient>
                <linearGradient id="pedestalRim" x1="40" y1="165" x2="200" y2="165" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#5C3B1E" />
                  <stop offset="50%" stopColor={palette.rim} />
                  <stop offset="100%" stopColor="#5C3B1E" />
                </linearGradient>
                <radialGradient id="pedestalGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={palette.rim} stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#140C07" stopOpacity="0" />
                </radialGradient>
              </defs>

              <ellipse cx="120" cy="176" rx="92" ry="20" fill="url(#pedestalGlow)" />

              <ellipse cx="120" cy="174" rx="76" ry="16" fill="#1F130A" stroke="url(#pedestalRim)" strokeWidth="2.5" />
              <ellipse cx="120" cy="167" rx="64" ry="12" fill="#2A1A0E" stroke={palette.primary} strokeOpacity="0.7" strokeWidth="1.5" />
              <ellipse cx="120" cy="166" rx="50" ry="8" fill="#140C07" stroke={palette.rim} strokeOpacity="0.45" strokeWidth="1" />

              <polygon
                points="120,24 182,56 120,88 58,56"
                fill="url(#cubeTopGrad)"
                stroke={palette.rim}
                strokeWidth="1.8"
              />
              <polygon
                points="58,56 120,88 120,158 58,126"
                fill="url(#cubeLeftGrad)"
                stroke={palette.primary}
                strokeOpacity="0.75"
                strokeWidth="1.6"
              />
              <polygon
                points="120,88 182,56 182,126 120,158"
                fill="url(#cubeRightGrad)"
                stroke={palette.rim}
                strokeOpacity="0.85"
                strokeWidth="1.6"
              />

              <polygon
                points="120,35 166,58 120,81 74,58"
                fill="#1D120A"
                fillOpacity="0.68"
                stroke={palette.rim}
                strokeWidth="1.3"
              />
              <polygon
                points="68,69 111,91 111,144 68,121"
                fill="#140C07"
                fillOpacity="0.75"
                stroke={palette.primary}
                strokeWidth="1.4"
              />
              <polygon
                points="129,91 172,69 172,121 129,144"
                fill="#1A1008"
                fillOpacity="0.72"
                stroke={palette.rim}
                strokeWidth="1.4"
              />

              {/* Embossed Orbix gold planet & orbit ring emblems on cube faces */}
              <g>
                <circle cx="89" cy="107" r="7.5" fill={palette.primary} fillOpacity="0.92" />
                <ellipse
                  cx="89"
                  cy="107"
                  rx="13.5"
                  ry="4.2"
                  transform="rotate(-18 89 107)"
                  stroke={palette.rim}
                  strokeWidth="1.6"
                />
                <circle cx="99" cy="99" r="1.6" fill="#FFFFFF" />
              </g>
              <g>
                <circle cx="151" cy="107" r="7.5" fill={palette.rim} fillOpacity="0.95" />
                <ellipse
                  cx="151"
                  cy="107"
                  rx="13.5"
                  ry="4.2"
                  transform="rotate(18 151 107)"
                  stroke={palette.primary}
                  strokeWidth="1.6"
                />
                <circle cx="141" cy="99" r="1.6" fill="#FFFFFF" />
              </g>

              <line x1="120" y1="88" x2="120" y2="156" stroke={palette.rim} strokeWidth="2.4" />
              <line x1="63" y1="62" x2="63" y2="124" stroke={palette.primary} strokeWidth="1.5" strokeOpacity="0.8" />
              <line x1="177" y1="62" x2="177" y2="124" stroke={palette.rim} strokeWidth="1.5" strokeOpacity="0.8" />
            </motion.svg>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next node"
              className="absolute right-0 z-20 w-9 h-9 rounded-full bg-[#1C130C]/80 border border-[#C48A55]/35 flex items-center justify-center text-[#F3D9B1] hover:border-[#F3D9B1]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Node badge plate */}
          <div className="flex justify-center z-10">
            <div className="px-7 py-1.5 rounded-xl bg-[#1A110A]/90 border border-[#E5BE8B]/55 shadow-[0_0_20px_rgba(196,138,85,0.28)]">
              <span className="font-display text-lg font-semibold tracking-wide text-[#FBF2E3]">
                {currentTier.name}
              </span>
            </div>
          </div>
        </div>

        {/* Lower Details & Action Area */}
        <div className="p-5 space-y-4 bg-[#140D08]/95 border-t border-[#C48A55]/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-semibold text-[#F7EFE6]">
                {currentTier.name}
              </h3>
              <p className="text-[11px] text-[#A58E79]">
                {currentTier.subtitle} · Balance: {user.balance.toFixed(2)} {BRAND.symbol}
              </p>
            </div>

            {claimableNode ? (
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => handleClaim(claimableNode.id)}
                className="min-h-[40px] px-5 rounded-full orbix-gold-card text-[#1B120B] text-xs font-semibold flex items-center gap-1.5 shadow-[0_4px_16px_rgba(196,138,85,0.35)] disabled:opacity-60"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {busyAction === claimableNode.id
                    ? 'Claiming...'
                    : `Claim +${currentTier.dailyOrx}`}
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={handleActivate}
                className="min-h-[40px] px-6 rounded-full orbix-gold-card text-[#1B120B] text-xs font-semibold shadow-[0_4px_16px_rgba(196,138,85,0.35)] disabled:opacity-60"
              >
                {busyAction === 'activate' ? 'Activating...' : 'Activate'}
              </button>
            )}
          </div>

          {feedback && (
            <div
              className={`rounded-xl px-3.5 py-2.5 text-xs border ${
                feedback.type === 'ok'
                  ? 'bg-[#C48A55]/15 border-[#C48A55]/40 text-[#F3D9B1]'
                  : 'bg-red-950/50 border-red-500/35 text-red-200'
              }`}
            >
              {feedback.text}
            </div>
          )}

          {/* 2x2 Node Specs */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-1 pr-3 border-r border-[#C48A55]/15">
              <p className="text-[11px] text-[#8E7763]">Activation Cost</p>
              <p className="font-display text-lg font-semibold text-[#F7EFE6] font-mono-tabular">
                {currentTier.costOrx}{' '}
                <span className="text-xs font-normal text-[#CBB59F]">{BRAND.symbol}</span>
              </p>
              <p className="text-[10px] text-[#8E7763]">In-app {BRAND.symbol} points</p>
            </div>

            <div className="space-y-1 pl-1">
              <p className="text-[11px] text-[#8E7763]">Daily {BRAND.symbol}</p>
              <p className="font-display text-lg font-semibold text-[#F3D9B1] font-mono-tabular">
                +{currentTier.dailyOrx}
              </p>
              <p className="text-[10px] text-[#8E7763]">Daily point release</p>
            </div>

            <div className="space-y-1 pr-3 border-r border-[#C48A55]/15">
              <p className="text-[11px] text-[#8E7763]">Release Days</p>
              <p className="font-display text-lg font-semibold text-[#F7EFE6] font-mono-tabular">
                {currentTier.durationDays}{' '}
                <span className="text-xs font-normal text-[#CBB59F]">Days</span>
              </p>
            </div>

            <div className="space-y-1 pl-1">
              <p className="text-[11px] text-[#8E7763]">Total {BRAND.symbol} Earnings</p>
              <p className="font-display text-lg font-semibold text-[#F7EFE6] font-mono-tabular">
                {currentTier.totalEarningsOrx}{' '}
                <span className="text-xs font-normal text-[#CBB59F]">{BRAND.symbol}</span>
              </p>
            </div>
          </div>

          {/* Allocation Progress */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8E7763]">Node Allocation Progress</span>
              <span className="font-mono-tabular font-semibold text-[#F3D9B1]">
                {currentTier.baseProgressPct}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#2C1F14] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#F3D9B1] to-[#C48A55]"
                style={{ width: `${currentTier.baseProgressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#8E7763]">
              <span>Owned ({ownedForTier.length})</span>
              <span className="font-mono-tabular">
                Pool Quantity {currentTier.saleQuantity.toLocaleString()}
              </span>
            </div>
          </div>

          {/* View Details toggle */}
          <div className="pt-1 border-t border-[#C48A55]/12">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowDetails((v) => !v);
              }}
              className="w-full py-2 flex items-center justify-center gap-1 text-xs font-medium text-[#CBB59F] hover:text-[#F3D9B1]"
            >
              <span>{showDetails ? 'Hide Details' : 'View Details'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${showDetails ? 'rotate-180' : ''}`}
              />
            </button>

            {showDetails && (
              <div className="mt-2 pt-2 space-y-2.5 text-xs border-t border-[#C48A55]/12">
                <p className="text-[#A58E79] leading-relaxed">
                  Activate {currentTier.name} using your earned in-app {BRAND.symbol} balance.
                  Once active, return daily to claim +{currentTier.dailyOrx} {BRAND.symbol} for{' '}
                  {currentTier.durationDays} days directly on the server.
                </p>

                {ownedForTier.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#C48A55]">
                      Your Active {currentTier.name} Units
                    </p>
                    {ownedForTier.map((unit) => {
                      const claimedToday = unit.last_claim_date === todayUtc;
                      const finished = unit.days_claimed >= unit.duration_days;
                      return (
                        <div
                          key={unit.id}
                          className="rounded-xl bg-[#1D140D] border border-[#C48A55]/25 px-3 py-2.5 flex items-center justify-between gap-2"
                        >
                          <div>
                            <p className="font-semibold text-[#F7EFE6]">
                              {unit.tier_name} · Day {unit.days_claimed}/{unit.duration_days}
                            </p>
                            <p className="text-[11px] text-[#8E7763]">
                              Claimed {unit.total_claimed_orx} {BRAND.symbol}
                            </p>
                          </div>
                          {finished ? (
                            <span className="text-[11px] text-emerald-300 font-medium">Completed</span>
                          ) : claimedToday ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Claimed Today
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={busyAction !== null}
                              onClick={() => handleClaim(unit.id)}
                              className="px-3 py-1.5 rounded-lg orbix-gold-card text-[#1B120B] font-semibold text-[11px]"
                            >
                              {busyAction === unit.id ? '...' : `Claim +${unit.daily_orx}`}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
