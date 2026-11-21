import { ArrowLeft, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { BRAND } from '../config/brand';
import { triggerHaptic } from '../lib/telegram';
import type { UserProfile } from '../types/orbix';
import { OrbixLogo } from './OrbixLogo';

interface LuckyDrawViewProps {
  user: UserProfile;
  onBack: () => void;
  onSpin: () => Promise<{ segmentIndex: number; reward: number }>;
}

const SEGMENTS = [
  { label: '+0.5', value: 0.5 },
  { label: '+1.0', value: 1.0 },
  { label: '+2.0', value: 2.0 },
  { label: '+5.0', value: 5.0 },
  { label: '+0.2', value: 0.2 },
  { label: '+3.0', value: 3.0 },
  { label: '+10', value: 10.0 },
  { label: '+1.5', value: 1.5 },
];

export function LuckyDrawView({ user, onBack, onSpin }: LuckyDrawViewProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winReward, setWinReward] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const todayUtc = new Date().toISOString().slice(0, 10);
  const alreadySpunToday = user.last_spin_date === todayUtc;

  const handleSpin = async () => {
    if (spinning || alreadySpunToday) return;
    setSpinning(true);
    setError(null);
    setWinReward(null);
    try {
      const result = await onSpin();
      const segAngle = 360 / SEGMENTS.length;
      const targetCenter = result.segmentIndex * segAngle + segAngle / 2;
      const extraSpins = 360 * 5;
      const nextAngle = rotation + extraSpins + (360 - (rotation % 360)) + (360 - targetCenter);
      setRotation(nextAngle);
      triggerHaptic('medium');

      setTimeout(() => {
        setWinReward(result.reward);
        setSpinning(false);
        triggerHaptic('success');
      }, 3900);
    } catch (err) {
      setSpinning(false);
      triggerHaptic('error');
      setError(err instanceof Error ? err.message : 'Unable to spin right now');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -18 }}
      transition={{ duration: 0.2 }}
      className="pb-28 space-y-6"
    >
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Activity"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl orbix-glass text-[#F3D9B1]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-display text-lg font-semibold tracking-[0.26em] text-[#F7EFE6] uppercase">
          {BRAND.name}<span className="text-[#C48A55]">.</span>
        </span>
        <div className="w-[44px]" />
      </div>

      <div className="text-center space-y-1.5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#C48A55]">DAILY FORTUNE</p>
        <h1 className="font-display text-3xl font-semibold text-[#F7EFE6]">Lucky Draw</h1>
        <p className="text-sm text-[#A58E79]">
          1 free daily spin · Win instant in-app {BRAND.symbol} rewards
        </p>
      </div>

      <div className="relative flex flex-col items-center justify-center py-4">
        <div className="z-20 -mb-3 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-[#F3D9B1] drop-shadow-[0_4px_10px_rgba(243,217,177,0.65)]" />

        <div className="relative w-[290px] h-[290px] rounded-full p-2.5 bg-gradient-to-br from-[#F3D9B1] via-[#C48A55] to-[#5B3A1D] shadow-[0_0_45px_rgba(196,138,85,0.3)]">
          <div
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 3.8s cubic-bezier(0.16, 1, 0.25, 1)' : 'none',
            }}
            className="w-full h-full rounded-full overflow-hidden relative bg-[#18100A]"
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {SEGMENTS.map((seg, idx) => {
                const startDeg = idx * 45 - 90;
                const endDeg = startDeg + 45;
                const startRad = (startDeg * Math.PI) / 180;
                const endRad = (endDeg * Math.PI) / 180;
                const x1 = 100 + 100 * Math.cos(startRad);
                const y1 = 100 + 100 * Math.sin(startRad);
                const x2 = 100 + 100 * Math.cos(endRad);
                const y2 = 100 + 100 * Math.sin(endRad);
                const isGold = idx % 2 === 0;
                const midAngle = startDeg + 22.5;
                return (
                  <g key={seg.label + idx}>
                    <path
                      d={`M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`}
                      fill={isGold ? '#D6A46F' : '#24180F'}
                      stroke="#593B21"
                      strokeWidth="0.8"
                    />
                    <text
                      x="100"
                      y="30"
                      fill={isGold ? '#1B1109' : '#F3D9B1'}
                      fontSize="11"
                      fontWeight="700"
                      textAnchor="middle"
                      transform={`rotate(${midAngle + 90}, 100, 100)`}
                    >
                      {seg.label}
                    </text>
                    <text
                      x="100"
                      y="43"
                      fill={isGold ? '#3C2614' : '#A58E79'}
                      fontSize="6.5"
                      fontWeight="600"
                      textAnchor="middle"
                      transform={`rotate(${midAngle + 90}, 100, 100)`}
                    >
                      {BRAND.symbol}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <OrbixLogo size={54} className="border-2 border-[#18100A]" />
          </div>
        </div>
      </div>

      {winReward !== null && (
        <div className="orbix-glass rounded-[24px] p-4 text-center border-[#F3D9B1]/45">
          <p className="text-xs uppercase tracking-[0.18em] text-[#C48A55]">Reward Credited</p>
          <p className="font-display text-2xl font-semibold text-[#F3D9B1] mt-1 font-mono-tabular">
            +{winReward} {BRAND.symbol}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-950/50 border border-red-500/35 px-4 py-3 text-xs text-red-200 text-center">
          {error}
        </div>
      )}

      <button
        type="button"
        disabled={spinning || alreadySpunToday}
        onClick={handleSpin}
        className={`w-full min-h-[54px] rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.99] ${
          spinning || alreadySpunToday
            ? 'orbix-glass text-[#A58E79] cursor-not-allowed'
            : 'orbix-gold-card text-[#1B120B] hover:brightness-105'
        }`}
      >
        <Sparkles className="w-5 h-5" />
        <span>
          {spinning
            ? 'Spinning Wheel...'
            : alreadySpunToday
              ? 'Daily Free Spin Used · Come Back Tomorrow'
              : 'Spin Free Daily Wheel'}
        </span>
      </button>
    </motion.div>
  );
}
