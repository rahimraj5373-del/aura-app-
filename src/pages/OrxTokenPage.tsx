import { Headphones, Layers, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { OrbixLogo } from '../components/OrbixLogo';
import { BRAND } from '../config/brand';
import type { CommunityStats, TransactionItem, UserProfile } from '../types/orbix';

interface OrxTokenPageProps {
  user: UserProfile;
  transactions: TransactionItem[];
  communityStats: CommunityStats;
  onOpenSupport: () => void;
}

export function OrxTokenPage({
  user,
  transactions,
  communityStats,
  onOpenSupport,
}: OrxTokenPageProps) {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);

  const series = communityStats.dailyActivity;
  const maxDayEarned = useMemo(
    () => Math.max(25, ...series.map((d) => d.earned)),
    [series]
  );

  const activeDay =
    selectedDayIdx !== null ? series[selectedDayIdx] : series[series.length - 1];

  const breakdown = useMemo(() => {
    const sums = {
      signup: 0,
      checkin: 0,
      task: 0,
      lucky_draw: 0,
      referral: 0,
    };
    for (const tx of transactions) {
      if (tx.amount > 0 && tx.type in sums) {
        sums[tx.type as keyof typeof sums] += tx.amount;
      }
    }
    return [
      { label: 'Welcome Bonus', value: sums.signup || 100 },
      { label: 'Daily Check-in', value: sums.checkin || user.cumulative_checkin_rewards },
      { label: 'Social Quests', value: sums.task },
      { label: 'Lucky Draw', value: sums.lucky_draw },
      { label: 'Referrals', value: sums.referral || user.referral_earnings },
    ];
  }, [transactions, user]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="pb-28 space-y-5"
    >
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <OrbixLogo size={28} />
          <span className="font-display text-[22px] font-semibold tracking-[0.22em] text-[#F7EFE6] uppercase">
            {BRAND.name}<span className="text-[#C48A55]">.</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenSupport}
          aria-label="Customer Service"
          className="min-w-[44px] min-h-[44px] rounded-2xl orbix-glass flex items-center justify-center text-[#E5BE8B]"
        >
          <Headphones className="w-5 h-5" />
        </button>
      </header>

      {/* Main Stats & Interactive Activity Trend Card */}
      <section className="orbix-glass rounded-[24px] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <OrbixLogo size={34} />
            <p className="text-sm font-semibold text-[#F7EFE6]">
              {BRAND.symbol} <span className="text-xs font-normal text-[#A58E79]">/ Points</span>
            </p>
          </div>
          <span className="text-[11px] px-3 py-1 rounded-full bg-[#241910]/90 border border-[#C48A55]/30 text-[#CBB59F]">
            In-App Rewards
          </span>
        </div>

        <div className="grid grid-cols-2 gap-y-2.5 text-xs border-b border-[#C48A55]/15 pb-3.5">
          <div>
            <p className="text-[#8E7763]">Total Pool</p>
            <p className="font-mono-tabular font-semibold text-[#F7EFE6] mt-0.5">
              {communityStats.totalPoolOrx.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[#8E7763]">Total Distributed</p>
            <p className="font-mono-tabular font-semibold text-[#F7EFE6] mt-0.5">
              {communityStats.totalDistributedOrx.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[#8E7763]">Active Members</p>
            <p className="font-mono-tabular font-semibold text-[#F7EFE6] mt-0.5">
              {communityStats.totalUsers.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[#8E7763]">Your Streak</p>
            <p className="font-mono-tabular font-semibold text-[#F7EFE6] mt-0.5">
              {user.checkin_streak} Days
            </p>
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2.5">
            <span className="font-display text-3xl font-semibold text-[#F3D9B1] font-mono-tabular">
              {user.balance.toFixed(2)} {BRAND.symbol}
            </span>
            <span className="text-xs font-mono-tabular text-emerald-300 bg-emerald-950/50 border border-emerald-500/25 px-2 py-0.5 rounded-lg">
              +{user.daily_earned.toFixed(2)} · Today
            </span>
          </div>
        </div>

        {/* Interactive 7-Day Real Activity Trend Chart */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#CBB59F] font-medium">Reward Activity Trend</span>
            <span className="text-[#8E7763] font-mono-tabular">{BRAND.symbol} / 7D</span>
          </div>

          <div className="rounded-2xl bg-[#110B07]/85 border border-[#C48A55]/15 p-3">
            {activeDay && (
              <div className="flex items-center justify-between text-[11px] font-mono-tabular text-[#A58E79] mb-2">
                <span>{activeDay.label}</span>
                <span>
                  Distributed: <strong className="text-[#F3D9B1]">+{activeDay.earned} {BRAND.symbol}</strong> ·{' '}
                  {activeDay.txCount} tx
                </span>
              </div>
            )}

            <svg viewBox="0 0 320 145" className="w-full h-36 overflow-visible">
              {[0, 0.5, 1].map((t) => {
                const y = 16 + t * 96;
                const val = Math.round(maxDayEarned * (1 - t));
                return (
                  <g key={t}>
                    <line
                      x1="0"
                      y1={y}
                      x2="282"
                      y2={y}
                      stroke="rgba(196,138,85,0.14)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x="288"
                      y={y + 3}
                      fill="#8E7763"
                      fontSize="8.5"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {series.map((pt, idx) => {
                const slot = 280 / series.length;
                const cx = idx * slot + slot / 2;
                const barH = Math.max(4, (pt.earned / maxDayEarned) * 96);
                const isSelected = selectedDayIdx === idx || (selectedDayIdx === null && idx === series.length - 1);
                return (
                  <g
                    key={pt.date}
                    onMouseEnter={() => setSelectedDayIdx(idx)}
                    onClick={() => setSelectedDayIdx(idx)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={cx - 9}
                      y={112 - barH}
                      width="18"
                      height={barH}
                      rx="4"
                      fill={isSelected ? '#F3D9B1' : 'rgba(196,138,85,0.48)'}
                    />
                    <text
                      x={cx}
                      y="132"
                      textAnchor="middle"
                      fill={isSelected ? '#F3D9B1' : '#8E7763'}
                      fontSize="8"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="space-y-4 pt-1">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#C48A55]">
            Explore Value · Community Rewards
          </p>
          <h2 className="font-display text-2xl font-semibold text-[#F7EFE6] mt-0.5">
            Points Ecosystem
          </h2>
          <p className="text-xs text-[#A58E79]">
            Live server-verified metrics & reward guidelines
          </p>
        </div>

        {/* 01 / POINTS */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#F7EFE6]">Points Info</span>
            <span className="font-mono-tabular text-[#8E7763]">01 / POINTS</span>
          </div>

          <div className="orbix-glass rounded-[24px] p-4 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#C48A55]/15">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F3D9B1] to-[#C48A55] flex items-center justify-center text-[#1B120B]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#F7EFE6]">{BRAND.symbol}</p>
                <p className="text-[11px] text-[#A58E79]">{BRAND.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[#8E7763]">Reward Type</p>
                <p className="font-semibold text-[#F7EFE6] mt-0.5">In-App Points Only</p>
              </div>
              <div>
                <p className="text-[#8E7763]">Welcome Bonus</p>
                <p className="font-mono-tabular font-semibold text-[#F7EFE6] mt-0.5">
                  100 {BRAND.symbol}
                </p>
              </div>
              <div>
                <p className="text-[#8E7763]">1-Level Referral</p>
                <p className="font-mono-tabular font-semibold text-[#F3D9B1] mt-0.5">
                  +25 {BRAND.symbol}
                </p>
              </div>
              <div>
                <p className="text-[#8E7763]">Min Withdraw Request</p>
                <p className="font-mono-tabular font-semibold text-[#F7EFE6] mt-0.5">
                  50 {BRAND.symbol}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ORX Allocation and Release */}
        <div className="orbix-glass rounded-[24px] p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F7EFE6]">
              {BRAND.symbol} Allocation and Release
            </h3>
            <span className="text-[11px] font-mono-tabular text-[#C48A55]">LIVE</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#110B07]/85 border border-[#C48A55]/18 p-3.5">
              <p className="text-[11px] text-[#8E7763]">Total {BRAND.symbol} Allocated</p>
              <p className="font-display text-lg font-semibold text-[#F7EFE6] font-mono-tabular mt-1">
                {communityStats.totalPoolOrx.toLocaleString()}
              </p>
              <p className="text-[10px] text-[#8E7763] mt-0.5">{BRAND.symbol}</p>
            </div>
            <div className="rounded-2xl bg-[#110B07]/85 border border-[#C48A55]/18 p-3.5">
              <p className="text-[11px] text-[#8E7763]">Total {BRAND.symbol} Distributed</p>
              <p className="font-display text-lg font-semibold text-[#F3D9B1] font-mono-tabular mt-1">
                {communityStats.totalDistributedOrx.toLocaleString()}
              </p>
              <p className="text-[10px] text-[#8E7763] mt-0.5">{BRAND.symbol}</p>
            </div>
          </div>

          <p className="text-[11px] text-[#A58E79] leading-relaxed">
            Live data comes directly from {BRAND.name} server records, covering registration
            bonuses, Daily Check-in streaks, verified social quests, free Lucky Draw spins, and
            1-level referral rewards.
          </p>
        </div>

        {/* Your Source Breakdown */}
        <div className="orbix-glass rounded-[24px] p-4 space-y-2.5">
          <p className="text-xs font-semibold text-[#F7EFE6]">Your Earned Breakdown</p>
          {breakdown.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <span className="text-[#A58E79]">{item.label}</span>
              <span className="font-mono-tabular text-[#F3D9B1]">
                +{item.value.toFixed(2)} {BRAND.symbol}
              </span>
            </div>
          ))}
        </div>

        {/* 02 / POLICY */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#F7EFE6]">Transparency & Rules</span>
            <span className="font-mono-tabular text-[#8E7763]">02 / POLICY</span>
          </div>

          <div className="orbix-glass rounded-[24px] p-4 flex gap-3 items-start text-xs text-[#A58E79] leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-[#C48A55] shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="font-semibold text-[#F7EFE6]">In-App Points Only</p>
              <p>
                {BRAND.name} does not sell nodes, offer investment plans or daily ROI, or make
                promises of market price, exchange listings, or external audits. All rewards are
                verified server-side.
              </p>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
