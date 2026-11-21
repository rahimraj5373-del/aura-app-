import { ArrowLeft, ArrowRight, Check, Gift, Info, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { BRAND } from '../config/brand';
import { triggerHaptic } from '../lib/telegram';
import type { UserProfile } from '../types/orbix';

interface DailyCheckinViewProps {
  user: UserProfile;
  onBack: () => void;
  onCheckIn: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

const CHECKIN_SCHEDULE = [
  { day: 1, label: 'Day 1', reward: 1.0 },
  { day: 2, label: 'Day 2', reward: 1.5 },
  { day: 3, label: 'Day 3', reward: 2.0 },
  { day: 4, label: 'Day 4', reward: 2.5 },
  { day: 5, label: 'Day 5', reward: 3.0 },
  { day: 6, label: 'Day 6', reward: 4.0 },
  { day: 7, label: 'Day 7', reward: 7.0 },
];

export function DailyCheckinView({ user, onBack, onCheckIn, onRefresh }: DailyCheckinViewProps) {
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const todayUtc = new Date().toISOString().slice(0, 10);
  const checkedInToday = user.last_checkin_date === todayUtc;

  const currentCycleCompleted = checkedInToday
    ? ((user.checkin_streak - 1) % 7) + 1
    : user.checkin_streak % 7;
  const nextRewardIndex = checkedInToday ? (user.checkin_streak - 1) % 7 : user.checkin_streak % 7;
  const todayReward = CHECKIN_SCHEDULE[nextRewardIndex].reward;

  const handleCheckIn = async () => {
    if (checkedInToday || submitting) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await onCheckIn();
      triggerHaptic('success');
      setFeedback({ type: 'ok', text: `+${todayReward} ${BRAND.symbol} credited to your balance!` });
    } catch (err) {
      triggerHaptic('error');
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Check-in failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -18 }}
      transition={{ duration: 0.2 }}
      className="pb-28 space-y-5"
    >
      {/* Top Sub-bar */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Activity"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl orbix-glass text-[#F3D9B1] hover:border-[#F3D9B1]/40 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-display text-lg font-semibold tracking-[0.26em] text-[#F7EFE6] uppercase">
          {BRAND.name}<span className="text-[#C48A55]">.</span>
        </span>
        <button
          type="button"
          onClick={handleRefresh}
          aria-label="Refresh Check-in"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl orbix-glass text-[#C48A55] hover:text-[#F3D9B1] transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Hero Reward Display */}
      <div className="text-center space-y-2 pt-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#C48A55] font-medium">
          {BRAND.name} / DAILY REWARDS
        </p>
        <h1 className="font-display text-3xl font-semibold text-[#F7EFE6]">Daily Check-in</h1>
        <p className="text-sm text-[#A58E79]">Daily check-in, accumulate in-app {BRAND.symbol} rewards</p>

        <div className="pt-3 pb-1">
          <div className="font-display text-5xl font-semibold tracking-tight orbix-gold-text font-mono-tabular">
            +{todayReward.toFixed(1)}
          </div>
          <div className="text-xs tracking-[0.2em] uppercase text-[#CBB59F] mt-1">{BRAND.symbol}</div>
        </div>

        <div className="inline-flex items-center gap-2 text-xs text-[#A58E79] pb-2">
          <Gift className="w-4 h-4 text-[#C48A55]" />
          <span>{checkedInToday ? "Today's Reward Claimed" : "Today's Check-in Reward"}</span>
        </div>

        {feedback && (
          <div
            className={`mx-auto max-w-xs text-xs px-4 py-2 rounded-xl border ${
              feedback.type === 'ok'
                ? 'bg-[#C48A55]/15 border-[#C48A55]/40 text-[#F3D9B1]'
                : 'bg-red-950/50 border-red-500/35 text-red-200'
            }`}
          >
            {feedback.text}
          </div>
        )}

        <button
          type="button"
          disabled={checkedInToday || submitting}
          onClick={handleCheckIn}
          className={`w-full min-h-[54px] rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.99] ${
            checkedInToday
              ? 'orbix-glass text-[#A58E79] cursor-not-allowed'
              : 'orbix-gold-card text-[#1B120B] hover:brightness-105'
          }`}
        >
          <span>
            {submitting
              ? 'Verifying Check-in...'
              : checkedInToday
                ? 'Checked in today'
                : 'Check in now'}
          </span>
          {checkedInToday ? <Check className="w-5 h-5 text-[#E5BE8B]" /> : <ArrowRight className="w-5 h-5" />}
        </button>
      </div>

      {/* 7-Day Progress Grid */}
      <div className="space-y-3 pt-2">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#C48A55]">DAILY JOURNEY</p>
            <h2 className="font-display text-lg font-semibold text-[#F7EFE6]">Check-in Progress</h2>
          </div>
          <div className="text-right">
            <span className="font-display text-2xl font-semibold text-[#F3D9B1] font-mono-tabular">
              {user.checkin_streak}
            </span>
            <span className="text-xs text-[#A58E79] ml-1">Days</span>
            <p className="text-[11px] text-[#8E7763]">Consecutive Check-ins</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {CHECKIN_SCHEDULE.map((item, idx) => {
            const isCompleted = idx < currentCycleCompleted;
            const isCurrentTarget = !checkedInToday && idx === nextRewardIndex;
            const isDay7 = item.day === 7;
            return (
              <div
                key={item.day}
                className={`rounded-[20px] p-3.5 flex flex-col justify-between transition-all ${
                  isDay7 ? 'col-span-3 flex-row items-center' : 'min-h-[92px]'
                } ${
                  isCurrentTarget
                    ? 'orbix-gold-card text-[#1B120B]'
                    : isCompleted
                      ? 'bg-[#C48A55]/20 border border-[#E5BE8B]/50 text-[#F7EFE6]'
                      : 'orbix-glass text-[#CBB59F]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-medium ${
                      isCurrentTarget ? 'text-[#2D1D10]' : 'text-[#A58E79]'
                    }`}
                  >
                    {isCurrentTarget ? 'Today' : item.label}
                  </span>
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-[#F3D9B1]" />
                  ) : (
                    <Gift
                      className={`w-4 h-4 ${isCurrentTarget ? 'text-[#2D1D10]' : 'text-[#C48A55]'}`}
                    />
                  )}
                </div>
                <div className={isDay7 ? 'text-right' : 'mt-2'}>
                  <div className="font-display text-lg font-semibold font-mono-tabular">
                    +{item.reward}
                  </div>
                  <div
                    className={`text-[10px] uppercase tracking-[0.14em] ${
                      isCurrentTarget ? 'text-[#3A2716]' : 'text-[#8E7763]'
                    }`}
                  >
                    {BRAND.symbol}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Balance & Cumulative Summary */}
      <div className="orbix-glass rounded-[24px] p-5 grid grid-cols-2 divide-x divide-[#C48A55]/20">
        <div className="pr-4">
          <p className="text-xs text-[#A58E79]">Account Balance</p>
          <p className="font-display text-2xl font-semibold text-[#F7EFE6] mt-1 font-mono-tabular">
            {user.balance.toFixed(2)}
          </p>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#C48A55]">{BRAND.symbol}</p>
        </div>
        <div className="pl-4">
          <p className="text-xs text-[#A58E79]">Cumulative Check-in Rewards</p>
          <p className="font-display text-2xl font-semibold text-[#F3D9B1] mt-1 font-mono-tabular">
            {user.cumulative_checkin_rewards.toFixed(2)}
          </p>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#C48A55]">{BRAND.symbol}</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="orbix-glass rounded-[24px] p-4 flex gap-3 items-start">
        <Info className="w-5 h-5 text-[#C48A55] shrink-0 mt-0.5" />
        <div className="space-y-1.5 text-xs text-[#A58E79] leading-relaxed">
          <p className="font-semibold text-[#E5BE8B]">Check-in instructions</p>
          <p>
            Visit this page daily (UTC) and tap Check in now to accumulate consecutive rewards.
            Missing a day resets your 7-day cycle back to Day 1.
          </p>
          <p>All rewards are verified server-side and credited immediately as in-app {BRAND.symbol} points.</p>
        </div>
      </div>
    </motion.div>
  );
}
