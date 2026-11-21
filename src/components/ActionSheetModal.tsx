import {
  Check,
  Copy,
  ExternalLink,
  HelpCircle,
  Headphones,
  Send,
  Share2,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { BRAND } from '../config/brand';
import { openExternalUrl, triggerHaptic } from '../lib/telegram';
import type { ReferralEntry, UserProfile, WithdrawRequest } from '../types/orbix';
import { OrbixLogo } from './OrbixLogo';

export type ModalKind =
  | 'receive'
  | 'transfer'
  | 'withdraw'
  | 'invite'
  | 'help'
  | 'support'
  | 'about'
  | null;

interface ActionSheetModalProps {
  kind: ModalKind;
  user: UserProfile;
  referrals: ReferralEntry[];
  withdraws: WithdrawRequest[];
  onClose: () => void;
  onTransfer: (recipient: string, amount: number) => Promise<void>;
  onWithdraw: (walletAddress: string, amount: number) => Promise<void>;
}

const SOCIAL_LINKS = [
  {
    name: 'Telegram Channel',
    handle: '@tanjirul0123',
    url: 'https://t.me/tanjirul0123',
    badge: 'TG',
  },
  {
    name: 'Telegram Group',
    handle: 'Official Community',
    url: 'https://t.me/+I7sfRF2mQgZiZjVl',
    badge: 'GRP',
  },
  {
    name: 'X (Twitter)',
    handle: '@tanjirul_king',
    url: 'https://x.com/tanjirul_king',
    badge: '𝕏',
  },
  {
    name: 'Facebook',
    handle: `${BRAND.name} Community`,
    url: 'https://www.facebook.com/share/18seM3aWbW/',
    badge: 'FB',
  },
];

function buildIdMatrix(tgId: string): boolean[][] {
  const size = 11;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const seed = tgId.split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 4 && c < 4;
      const inTopRight = r < 4 && c >= size - 4;
      const inBottomLeft = r >= size - 4 && c < 4;
      if (inTopLeft || inTopRight || inBottomLeft) {
        const lr = r >= size - 4 ? r - (size - 4) : r;
        const lc = c >= size - 4 ? c - (size - 4) : c;
        grid[r][c] = lr === 0 || lr === 3 || lc === 0 || lc === 3 || (lr === 1 && lc === 1) || (lr === 2 && lc === 2);
      } else {
        const hash = Math.abs((seed * (r + 3) + c * 17 + r * c * 13) % 97);
        grid[r][c] = hash % 2 === 0;
      }
    }
  }
  return grid;
}

export function ActionSheetModal({
  kind,
  user,
  referrals,
  withdraws,
  onClose,
  onTransfer,
  onWithdraw,
}: ActionSheetModalProps) {
  const [copied, setCopied] = useState(false);
  const [transferMode, setTransferMode] = useState<'internal' | 'withdraw'>('internal');
  const [recipient, setRecipient] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const qrMatrix = useMemo(() => buildIdMatrix(user.tg_id), [user.tg_id]);

  if (!kind) return null;

  const copyText = async (val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      triggerHaptic('light');
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatusMsg(null);
    try {
      const numericAmount = Number(amount);
      if (transferMode === 'withdraw' || kind === 'withdraw') {
        await onWithdraw(walletAddress.trim(), numericAmount);
        setWalletAddress('');
        setAmount('');
        setStatusMsg({ type: 'ok', text: 'Withdraw request submitted for admin approval.' });
      } else {
        await onTransfer(recipient.trim(), numericAmount);
        setRecipient('');
        setAmount('');
        setStatusMsg({ type: 'ok', text: `${BRAND.symbol} points transferred successfully.` });
      }
      triggerHaptic('success');
    } catch (err) {
      triggerHaptic('error');
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'Action failed' });
    } finally {
      setBusy(false);
    }
  };

  const showWithdrawForm = kind === 'withdraw' || (kind === 'transfer' && transferMode === 'withdraw');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[430px] max-h-[88dvh] overflow-y-auto rounded-t-[28px] bg-[#160F0A] border-t border-x border-[#C48A55]/30 p-5 pb-8 shadow-[0_-18px_50px_rgba(0,0,0,0.85)]"
      >
        <div className="w-10 h-1 rounded-full bg-[#C48A55]/40 mx-auto mb-4" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold uppercase tracking-[0.12em] text-[#F3D9B1]">
            {kind === 'receive' && `Receive ${BRAND.symbol}`}
            {kind === 'transfer' && 'Transfer & Withdraw'}
            {kind === 'withdraw' && `Withdraw ${BRAND.symbol}`}
            {kind === 'invite' && 'Invite Friends'}
            {kind === 'help' && 'Help & Guide'}
            {kind === 'support' && 'Customer Service'}
            {kind === 'about' && `About ${BRAND.name}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-w-[40px] min-h-[40px] rounded-xl bg-[#241910] border border-[#C48A55]/25 flex items-center justify-center text-[#CBB59F] hover:text-[#F7EFE6]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* RECEIVE */}
        {kind === 'receive' && (
          <div className="space-y-4">
            <div className="orbix-glass rounded-[24px] p-5 text-center space-y-3.5">
              <div className="mx-auto w-36 h-36 rounded-2xl bg-[#F3D9B1] p-3 flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 11 11" className="w-full h-full" shapeRendering="crispEdges">
                  {qrMatrix.map((row, r) =>
                    row.map((on, c) =>
                      on ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#1B120B" /> : null
                    )
                  )}
                </svg>
              </div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#C48A55]">
                Your {BRAND.name} Telegram Account ID
              </p>
              <p className="font-mono-tabular text-xl font-semibold text-[#F7EFE6]">{user.tg_id}</p>
              {user.username && <p className="text-xs text-[#A58E79]">@{user.username}</p>}
              <button
                type="button"
                onClick={() => copyText(user.tg_id)}
                className="w-full min-h-[46px] rounded-xl orbix-gold-card text-[#1B120B] font-semibold text-sm flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'ID Copied' : 'Copy Account ID'}</span>
              </button>
            </div>
            <p className="text-xs text-[#8E7763] text-center leading-relaxed">
              Share your Telegram ID or @username with other {BRAND.name} members to receive
              in-app {BRAND.symbol} reward transfers.
            </p>
          </div>
        )}

        {/* TRANSFER OR WITHDRAW */}
        {(kind === 'transfer' || kind === 'withdraw') && (
          <div className="space-y-4">
            {kind === 'transfer' && (
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#22170E] border border-[#C48A55]/20">
                <button
                  type="button"
                  onClick={() => {
                    setTransferMode('internal');
                    setStatusMsg(null);
                  }}
                  className={`min-h-[42px] rounded-xl text-xs font-semibold transition-colors ${
                    transferMode === 'internal'
                      ? 'orbix-gold-card text-[#1B120B]'
                      : 'text-[#A58E79] hover:text-[#F3D9B1]'
                  }`}
                >
                  Internal Transfer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTransferMode('withdraw');
                    setStatusMsg(null);
                  }}
                  className={`min-h-[42px] rounded-xl text-xs font-semibold transition-colors ${
                    transferMode === 'withdraw'
                      ? 'orbix-gold-card text-[#1B120B]'
                      : 'text-[#A58E79] hover:text-[#F3D9B1]'
                  }`}
                >
                  Withdraw Request
                </button>
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-3.5">
              <div className="orbix-glass rounded-2xl px-4 py-3 flex items-center justify-between text-xs">
                <span className="text-[#A58E79]">Available Points</span>
                <span className="font-mono-tabular font-semibold text-[#F3D9B1]">
                  {user.balance.toFixed(2)} {BRAND.symbol}
                </span>
              </div>

              {showWithdrawForm ? (
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-[0.14em] text-[#C48A55] block">
                    Destination Address
                  </label>
                  <input
                    type="text"
                    required
                    minLength={16}
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Enter destination wallet address"
                    className="w-full min-h-[48px] rounded-xl bg-[#20160E] border border-[#C48A55]/30 px-3.5 text-sm text-[#F7EFE6] placeholder:text-[#6E5B4B] focus:outline-none focus:border-[#F3D9B1]"
                  />
                  <p className="text-[11px] text-[#8E7763]">
                    Minimum request: 50 {BRAND.symbol} · Requests are reviewed by Admin.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-[0.14em] text-[#C48A55] block">
                    Recipient Telegram ID or @username
                  </label>
                  <input
                    type="text"
                    required
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="e.g. 123456789 or @username"
                    className="w-full min-h-[48px] rounded-xl bg-[#20160E] border border-[#C48A55]/30 px-3.5 text-sm text-[#F7EFE6] placeholder:text-[#6E5B4B] focus:outline-none focus:border-[#F3D9B1]"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-[0.14em] text-[#C48A55]">
                    Amount ({BRAND.symbol})
                  </label>
                  <button
                    type="button"
                    onClick={() => setAmount(String(Math.floor(user.balance * 100) / 100))}
                    className="text-xs text-[#F3D9B1] font-medium"
                  >
                    Max
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min={showWithdrawForm ? '50' : '0.01'}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={showWithdrawForm ? `Min 50 ${BRAND.symbol}` : '0.00'}
                  className="w-full min-h-[48px] rounded-xl bg-[#20160E] border border-[#C48A55]/30 px-3.5 text-sm font-mono-tabular text-[#F7EFE6] placeholder:text-[#6E5B4B] focus:outline-none focus:border-[#F3D9B1]"
                />
              </div>

              {statusMsg && (
                <div
                  className={`rounded-xl px-3.5 py-2.5 text-xs border ${
                    statusMsg.type === 'ok'
                      ? 'bg-[#C48A55]/15 border-[#C48A55]/40 text-[#F3D9B1]'
                      : 'bg-red-950/50 border-red-500/35 text-red-200'
                  }`}
                >
                  {statusMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full min-h-[50px] rounded-2xl orbix-gold-card text-[#1B120B] font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {showWithdrawForm ? <Wallet className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                <span>
                  {busy
                    ? 'Submitting...'
                    : showWithdrawForm
                      ? 'Submit Withdraw Request'
                      : `Send ${BRAND.symbol} Points`}
                </span>
              </button>
            </form>

            {showWithdrawForm && withdraws.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs uppercase tracking-[0.14em] text-[#A58E79]">
                  Your Withdraw History
                </p>
                <div className="space-y-2">
                  {withdraws.slice(0, 5).map((w) => (
                    <div
                      key={w.id}
                      className="orbix-glass rounded-2xl px-3.5 py-2.5 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-mono-tabular text-[#F7EFE6] font-medium">
                          {w.amount} {BRAND.symbol}
                        </p>
                        <p className="text-[#8E7763] truncate max-w-[180px]">{w.wallet_address}</p>
                      </div>
                      <span
                        className={`uppercase tracking-[0.1em] text-[10px] font-semibold px-2.5 py-1 rounded-lg ${
                          w.status === 'approved'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                            : w.status === 'rejected'
                              ? 'bg-red-950/60 text-red-300 border border-red-500/30'
                              : 'bg-[#C48A55]/20 text-[#F3D9B1] border border-[#C48A55]/35'
                        }`}
                      >
                        {w.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* INVITE / REFERRAL */}
        {kind === 'invite' && (() => {
          const botUsername = (import.meta.env.VITE_BOT_USERNAME as string) || 'OrbixBot';
          const appShortName = (import.meta.env.VITE_APP_SHORT_NAME as string) || 'app';
          const inviteLink = `https://t.me/${botUsername}/${appShortName}?startapp=ref_${user.tg_id}`;
          const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(
            `Join ${BRAND.name} on Telegram and claim 100 ${BRAND.symbol} welcome reward points!`
          )}`;

          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="orbix-glass rounded-2xl p-3.5">
                  <p className="text-[11px] text-[#8E7763]">Total Invites</p>
                  <p className="font-display text-2xl font-semibold text-[#F7EFE6] font-mono-tabular mt-0.5">
                    {user.valid_invites}
                  </p>
                </div>
                <div className="orbix-glass rounded-2xl p-3.5">
                  <p className="text-[11px] text-[#8E7763]">Total Earned</p>
                  <p className="font-display text-2xl font-semibold text-[#F3D9B1] font-mono-tabular mt-0.5">
                    +{user.referral_earnings.toFixed(0)}{' '}
                    <span className="text-xs font-normal text-[#C48A55]">{BRAND.symbol}</span>
                  </p>
                </div>
              </div>

              <div className="orbix-glass rounded-[22px] p-4 space-y-3">
                <p className="text-xs text-[#CBB59F]">
                  Earn <span className="text-[#F3D9B1] font-semibold">+25 {BRAND.symbol}</span> for every new user who registers through your 1-level referral link.
                </p>
                <div className="rounded-xl bg-[#120C08] border border-[#C48A55]/25 px-3 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono-tabular text-[#CBB59F] truncate">{inviteLink}</span>
                  <button
                    type="button"
                    onClick={() => copyText(inviteLink)}
                    className="min-w-[38px] min-h-[38px] rounded-lg bg-[#241910] flex items-center justify-center text-[#F3D9B1] shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => copyText(inviteLink)}
                    className="min-h-[44px] rounded-xl bg-[#22170E] border border-[#C48A55]/35 text-[#F3D9B1] font-semibold text-xs flex items-center justify-center gap-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy Link'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      openExternalUrl(shareUrl);
                    }}
                    className="min-h-[44px] rounded-xl orbix-gold-card text-[#1B120B] font-semibold text-xs flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Telegram</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#C48A55]">
                  Invited Friends ({referrals.length})
                </p>
                {referrals.length === 0 ? (
                  <div className="orbix-glass rounded-2xl p-4 text-center text-xs text-[#8E7763]">
                    No invited friends yet. Share your link above!
                  </div>
                ) : (
                  <div className="orbix-glass rounded-2xl divide-y divide-[#C48A55]/15 overflow-hidden">
                    {referrals.map((r) => (
                      <div key={r.tg_id} className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold text-[#F7EFE6] truncate">{r.first_name}</p>
                          <p className="text-[10px] text-[#8E7763]">
                            {new Date(r.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="font-mono-tabular font-semibold text-[#F3D9B1]">
                          +{r.bonus_awarded} {BRAND.symbol}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* HELP */}
        {kind === 'help' && (
          <div className="space-y-3 text-xs text-[#CBB59F] leading-relaxed">
            <div className="orbix-glass rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-[#F3D9B1] font-semibold">
                <HelpCircle className="w-4 h-4 text-[#C48A55]" />
                <span>How do I earn {BRAND.symbol} points?</span>
              </div>
              <p className="text-[#A58E79]">
                Earn in-app {BRAND.symbol} points from your registration welcome bonus, 7-day
                Daily Check-in streaks, verified social quests, daily Node releases, your daily
                free Lucky Draw spin, and 1-level friend referrals.
              </p>
            </div>
            <div className="orbix-glass rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-[#F3D9B1] font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#C48A55]" />
                <span>How does the Referral System work?</span>
              </div>
              <p className="text-[#A58E79]">
                Share your unique Telegram Mini App referral link from Promotion or Node. When a new
                user joins for the first time through your link, you receive a fixed +25{' '}
                {BRAND.symbol} bonus (1-level only).
              </p>
            </div>
            <div className="orbix-glass rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-[#F3D9B1] font-semibold">
                <Wallet className="w-4 h-4 text-[#C48A55]" />
                <span>How do Withdrawals work?</span>
              </div>
              <p className="text-[#A58E79]">
                Once you hold at least 50 {BRAND.symbol}, submit a withdraw request with your
                address. Requests are queued for Admin review.
              </p>
            </div>
          </div>
        )}

        {/* CUSTOMER SERVICE */}
        {kind === 'support' && (
          <div className="space-y-4">
            <div className="orbix-glass rounded-[24px] p-5 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#C48A55]/18 border border-[#C48A55]/35 flex items-center justify-center mx-auto text-[#F3D9B1]">
                <Headphones className="w-7 h-7" />
              </div>
              <h3 className="font-display text-base font-semibold text-[#F7EFE6]">
                {BRAND.name} Community Support
              </h3>
              <p className="text-xs text-[#A58E79] leading-relaxed">
                Need help with task verification, referrals, or a pending withdrawal? Join our
                official Telegram Discussion Group for fast assistance.
              </p>
              <button
                type="button"
                onClick={() => openExternalUrl('https://t.me/+I7sfRF2mQgZiZjVl')}
                className="w-full min-h-[48px] rounded-2xl orbix-gold-card text-[#1B120B] font-semibold text-sm flex items-center justify-center gap-2"
              >
                <span>Open Support Group</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ABOUT US */}
        {kind === 'about' && (
          <div className="space-y-4">
            <div className="orbix-glass rounded-[24px] p-4 flex items-center gap-3.5">
              <OrbixLogo size={52} />
              <div>
                <h3 className="font-display text-base font-semibold tracking-[0.14em] text-[#F7EFE6]">
                  {BRAND.name}
                </h3>
                <p className="text-xs text-[#A58E79]">
                  Community-driven Telegram Mini App powered by in-app {BRAND.symbol} reward
                  points.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#C48A55]">
                Official Social Channels
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {SOCIAL_LINKS.map((s) => (
                  <button
                    key={s.url}
                    type="button"
                    onClick={() => openExternalUrl(s.url)}
                    className="orbix-glass rounded-2xl p-3.5 text-left hover:border-[#F3D9B1]/45 transition-colors flex flex-col justify-between min-h-[84px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-lg bg-[#C48A55]/20 border border-[#C48A55]/35 flex items-center justify-center text-[11px] font-bold text-[#F3D9B1]">
                        {s.badge}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#8E7763]" />
                    </div>
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-[#F7EFE6] truncate">{s.name}</p>
                      <p className="text-[11px] text-[#8E7763] truncate">{s.handle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
