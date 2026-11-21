import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Box,
  Check,
  Megaphone,
  Share2,
  Wallet,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { ModalKind } from '../components/ActionSheetModal';
import { OrbixLogo } from '../components/OrbixLogo';
import { BRAND } from '../config/brand';
import { triggerHaptic } from '../lib/telegram';
import type { BroadcastMessage, TransactionItem, UserNode, UserProfile } from '../types/orbix';

interface HomePageProps {
  user: UserProfile;
  userNodes: UserNode[];
  latestBroadcast: BroadcastMessage | null;
  transactions: TransactionItem[];
  labels: {
    totalBalanceTitle: string;
    dailyOrx: string;
    receive: string;
    transfer: string;
    withdrawAction: string;
    invite: string;
    pointAssets: string;
    holdNode: string;
    tokens: string;
  };
  onOpenModal: (kind: ModalKind) => void;
  onGoNode: () => void;
}

export function HomePage({
  user,
  userNodes,
  latestBroadcast,
  transactions,
  labels,
  onOpenModal,
  onGoNode,
}: HomePageProps) {
  const balanceInt = Math.floor(user.balance);
  const balanceDec = (user.balance - balanceInt).toFixed(2).slice(1);
  const totalDailyNodeRate = userNodes.reduce((s, n) => s + n.daily_orx, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="pb-28 space-y-5"
    >
      {/* Top Header */}
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <OrbixLogo size={28} />
          <span className="font-display text-[22px] font-semibold tracking-[0.22em] text-[#F7EFE6] uppercase">
            {BRAND.name}<span className="text-[#C48A55]">.</span>
          </span>
        </div>
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#CBB59F]/80">
          {BRAND.symbol} / WEB3
        </span>
      </header>

      {/* Optional Latest Broadcast */}
      {latestBroadcast && (
        <div className="orbix-glass rounded-2xl px-3.5 py-2.5 flex items-start gap-2.5">
          <Megaphone className="w-4 h-4 text-[#E5BE8B] shrink-0 mt-0.5" />
          <div className="min-w-0 text-xs">
            <span className="font-semibold text-[#F3D9B1]">{latestBroadcast.title}: </span>
            <span className="text-[#CBB59F]">{latestBroadcast.message}</span>
          </div>
        </div>
      )}

      {/* Hero Total Balance */}
      <section className="text-center pt-5 pb-1 space-y-2">
        <p className="text-xs font-medium tracking-[0.06em] text-[#D8C6B4]">
          {labels.totalBalanceTitle}
        </p>
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="font-display text-[48px] leading-none font-normal tracking-tight text-[#FBF6EE] font-mono-tabular">
            {balanceInt}
            <span className="text-[#E9DCCE]">{balanceDec}</span>
          </span>
        </div>
        <p className="text-xs text-[#A58E79] font-mono-tabular">
          ≈ {user.balance.toFixed(2)}{' '}
          <span className="text-[#C48A55] font-semibold ml-0.5">{BRAND.symbol}</span>
        </p>

        {/* Daily ORX Pill */}
        <div className="pt-1.5 flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1C140E]/85 border border-[#C48A55]/25 text-xs text-[#E5BE8B] font-mono-tabular">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5BE8B]" />
            <span>
              {labels.dailyOrx} +{user.daily_earned.toFixed(2)}
            </span>
          </div>
        </div>
      </section>

      {/* 4 Action Buttons */}
      <section className="grid grid-cols-4 gap-2.5 pt-1">
        {(
          [
            { key: 'receive', label: labels.receive, icon: ArrowDownToLine, action: () => onOpenModal('receive') },
            { key: 'transfer', label: labels.transfer, icon: ArrowUpFromLine, action: () => onOpenModal('transfer') },
            { key: 'withdraw', label: labels.withdrawAction, icon: Wallet, action: () => onOpenModal('withdraw') },
            { key: 'invite', label: labels.invite, icon: Share2, action: () => onOpenModal('invite') },
          ] as const
        ).map(({ key, label, icon: Icon, action }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              triggerHaptic('light');
              action();
            }}
            className="orbix-glass rounded-[18px] py-3.5 px-1.5 flex flex-col items-center justify-center gap-2 hover:border-[#F3D9B1]/45 active:scale-[0.97] transition-all min-h-[82px]"
          >
            <Icon className="w-5 h-5 text-[#E5BE8B]" strokeWidth={1.7} />
            <span className="text-[11px] font-medium text-[#E8DDD0] whitespace-nowrap">
              {label}
            </span>
          </button>
        ))}
      </section>

      {/* Two Summary Cards: Token Assets + Hold Node */}
      <section className="grid grid-cols-2 gap-3">
        <div className="orbix-gold-card rounded-[22px] p-4 text-[#1B120B] flex flex-col justify-between min-h-[108px]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Wallet className="w-4 h-4 shrink-0 text-[#2E1E11]" strokeWidth={1.8} />
              <span className="text-xs font-semibold truncate">{labels.pointAssets}</span>
            </div>
            <span className="w-4 h-4 rounded-full bg-[#2E1E11] flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 text-[#F3D9B1]" strokeWidth={3} />
            </span>
          </div>
          <div className="mt-3">
            <p className="font-display text-[22px] font-semibold font-mono-tabular leading-tight">
              {user.balance.toFixed(2)}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3B2614]">
              {BRAND.symbol} Points
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onGoNode();
          }}
          className="orbix-glass rounded-[22px] p-4 text-left flex flex-col justify-between min-h-[108px] hover:border-[#F3D9B1]/40 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Box className="w-4 h-4 shrink-0 text-[#C48A55]" strokeWidth={1.8} />
              <span className="text-xs font-medium text-[#E8DDD0] truncate">
                {labels.holdNode}
              </span>
            </div>
            <span className="text-[11px] font-mono-tabular text-[#E5BE8B]">
              {userNodes.length}
            </span>
          </div>
          <div className="mt-3">
            <p className="font-display text-[22px] font-medium text-[#F7EFE6] font-mono-tabular leading-tight">
              +{totalDailyNodeRate.toFixed(2)}
            </p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#A58E79]">
              {BRAND.symbol} / Day
            </p>
          </div>
        </button>
      </section>

      {/* Tokens List Row */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#F7EFE6]">{labels.tokens}</h2>
        <div className="orbix-glass rounded-[22px] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OrbixLogo size={44} />
            <div>
              <p className="text-sm font-semibold text-[#F7EFE6]">{BRAND.symbol}</p>
              <p className="text-[11px] text-[#A58E79]">{BRAND.name}</p>
              <p className="text-[11px] text-[#8E7763] mt-0.5">In-App Reward Points</p>
            </div>
          </div>
          <div className="text-right font-mono-tabular">
            <p className="text-base font-semibold text-[#F7EFE6]">{user.balance.toFixed(2)}</p>
            <p className="text-xs text-[#A58E79]">{BRAND.symbol}</p>
          </div>
        </div>
      </section>

      {/* Recent Activity Ledger */}
      {transactions.length > 0 && (
        <section className="space-y-2.5">
          <h3 className="text-xs uppercase tracking-[0.16em] text-[#8E7763]">Recent Activity</h3>
          <div className="orbix-glass rounded-[22px] divide-y divide-[#C48A55]/15 overflow-hidden">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#E8DDD0] truncate">{tx.description}</p>
                  <p className="text-[10px] text-[#8E7763]">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs font-mono-tabular font-semibold shrink-0 ${
                    tx.amount >= 0 ? 'text-[#F3D9B1]' : 'text-[#C48A55]'
                  }`}
                >
                  {tx.amount >= 0 ? '+' : ''}
                  {tx.amount.toFixed(2)} {BRAND.symbol}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
