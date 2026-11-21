import { ArrowRight, ArrowUpRight, CheckCircle2, Headphones, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { DailyCheckinView } from '../components/DailyCheckinView';
import { LuckyDrawView } from '../components/LuckyDrawView';
import { OrbixLogo } from '../components/OrbixLogo';
import { BRAND } from '../config/brand';
import { openExternalUrl, triggerHaptic } from '../lib/telegram';
import type { TaskItem, UserProfile, UserTask } from '../types/orbix';

interface ActivityPageProps {
  user: UserProfile;
  tasks: TaskItem[];
  userTasks: UserTask[];
  labels: {
    activityTitle: string;
    participate: string;
    dailyCheckin: string;
    luckyDraw: string;
  };
  onOpenSupport: () => void;
  onStartTask: (taskId: string) => Promise<void>;
  onVerifyTask: (taskId: string) => Promise<void>;
  onCheckIn: () => Promise<void>;
  onSpinWheel: () => Promise<{ segmentIndex: number; reward: number }>;
  onRefresh: () => Promise<void>;
}

export function ActivityPage({
  user,
  tasks,
  userTasks,
  labels,
  onOpenSupport,
  onStartTask,
  onVerifyTask,
  onCheckIn,
  onSpinWheel,
  onRefresh,
}: ActivityPageProps) {
  const [subView, setSubView] = useState<'main' | 'checkin' | 'lucky'>('main');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);

  if (subView === 'checkin') {
    return (
      <DailyCheckinView
        user={user}
        onBack={() => setSubView('main')}
        onCheckIn={onCheckIn}
        onRefresh={onRefresh}
      />
    );
  }

  if (subView === 'lucky') {
    return (
      <LuckyDrawView
        user={user}
        onBack={() => setSubView('main')}
        onSpin={onSpinWheel}
      />
    );
  }

  const userTaskMap = new Map(userTasks.map((ut) => [ut.task_id, ut]));

  const groupTask = tasks.find((t) => t.category === 'telegram_group') || tasks[0];
  const channelTask = tasks.find((t) => t.category === 'telegram_channel') || tasks[1];
  const otherTasks = tasks.filter((t) => t.id !== groupTask?.id && t.id !== channelTask?.id);

  const handleTaskAction = async (task: TaskItem) => {
    setTaskError(null);
    const state = userTaskMap.get(task.id);
    if (state?.completed_at) return;

    if (!state?.started_at) {
      triggerHaptic('light');
      openExternalUrl(task.url);
      await onStartTask(task.id);
      return;
    }

    setVerifyingId(task.id);
    try {
      await onVerifyTask(task.id);
      triggerHaptic('success');
    } catch (err) {
      triggerHaptic('error');
      setTaskError(err instanceof Error ? err.message : 'Verification pending');
    } finally {
      setVerifyingId(null);
    }
  };

  const renderTopCard = (task: TaskItem | undefined) => {
    if (!task) return null;
    const state = userTaskMap.get(task.id);
    const completed = Boolean(state?.completed_at);
    const started = Boolean(state?.started_at) && !completed;
    const isVerifying = verifyingId === task.id;

    return (
      <div className="orbix-glass rounded-[22px] p-4 flex flex-col justify-between min-h-[192px]">
        <div className="pt-2 flex justify-center">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#F3D9B1] to-[#C48A55] flex items-center justify-center text-[#1B120B] shadow-[0_6px_18px_rgba(196,138,85,0.28)]">
            <Send className="w-5 h-5 -translate-x-[1px] translate-y-[1px]" />
          </div>
        </div>

        <div className="mt-4 text-left space-y-1">
          <h3 className="text-[14px] font-semibold text-[#F7EFE6] leading-tight">
            {task.title}
          </h3>
          <p className="text-[11px] text-[#A58E79] line-clamp-1">{task.subtitle}</p>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#C48A55]/15 flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={completed || isVerifying}
            onClick={() => handleTaskAction(task)}
            className="text-xs font-semibold text-[#F3D9B1] inline-flex items-center gap-1 min-h-[34px] disabled:opacity-60"
          >
            <span>
              {completed
                ? 'Done'
                : isVerifying
                  ? 'Checking...'
                  : started
                    ? 'Verify'
                    : 'Complete'}
            </span>
            {completed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ArrowUpRight className="w-3.5 h-3.5 text-[#C48A55]" />
            )}
          </button>
          <span className="text-[11px] font-mono-tabular text-[#E5BE8B]">
            +{task.reward} {BRAND.symbol}
          </span>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="pb-28 space-y-5"
    >
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

      <section className="grid grid-cols-2 gap-3">
        {renderTopCard(groupTask)}
        {renderTopCard(channelTask)}
      </section>

      {taskError && (
        <div className="rounded-2xl bg-red-950/50 border border-red-500/35 px-4 py-2.5 text-xs text-red-200">
          {taskError}
        </div>
      )}

      <section className="space-y-3">
        <p className="text-xs text-[#CBB59F]">{labels.activityTitle}</p>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setSubView('checkin');
          }}
          className="w-full orbix-glass rounded-[24px] overflow-hidden relative text-left min-h-[126px] flex items-center hover:border-[#F3D9B1]/45 transition-colors"
        >
          <img
            src="/src/assets/images/orbix_checkin_card.jpg"
            alt="Daily Check-in"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#130D09] via-[#130D09]/85 to-transparent" />
          <div className="relative z-10 p-5 space-y-1.5 max-w-[68%]">
            <p className="text-[11px] font-mono-tabular text-[#C48A55]">01</p>
            <h3 className="font-display text-lg font-semibold text-[#F7EFE6]">
              {labels.dailyCheckin}
            </h3>
            <p className="text-xs text-[#A58E79]">Daily check-in, accumulate rewards</p>
            <div className="pt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#F3D9B1]">
              <span>Go to Check-in</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C48A55]" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setSubView('lucky');
          }}
          className="w-full orbix-glass rounded-[24px] overflow-hidden relative text-left min-h-[126px] flex items-center hover:border-[#F3D9B1]/45 transition-colors"
        >
          <img
            src="/src/assets/images/orbix_lucky_wheel.jpg"
            alt="Lucky Draw Wheel"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#130D09] via-[#130D09]/85 to-transparent" />
          <div className="relative z-10 p-5 space-y-1.5 max-w-[68%]">
            <p className="text-[11px] font-mono-tabular text-[#C48A55]">02</p>
            <h3 className="font-display text-lg font-semibold text-[#F7EFE6]">
              {labels.luckyDraw}
            </h3>
            <p className="text-xs text-[#A58E79]">Free daily spin · Win in-app {BRAND.symbol}</p>
            <div className="pt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#F3D9B1]">
              <span>Go to Lottery</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C48A55]" />
            </div>
          </div>
        </button>
      </section>

      {otherTasks.length > 0 && (
        <section className="space-y-2.5">
          <h3 className="text-xs uppercase tracking-[0.16em] text-[#C48A55]">
            {labels.participate}
          </h3>
          <div className="space-y-2.5">
            {otherTasks.map((task) => {
              const state = userTaskMap.get(task.id);
              const completed = Boolean(state?.completed_at);
              const started = Boolean(state?.started_at) && !completed;
              const isVerifying = verifyingId === task.id;
              return (
                <div
                  key={task.id}
                  className="orbix-glass rounded-[20px] p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#F7EFE6] truncate">{task.title}</p>
                    <p className="text-xs text-[#A58E79] truncate">
                      {task.subtitle} ·{' '}
                      <span className="text-[#E5BE8B]">
                        +{task.reward} {BRAND.symbol}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={completed || isVerifying}
                    onClick={() => handleTaskAction(task)}
                    className={`min-h-[40px] px-4 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                      completed
                        ? 'bg-[#251B12] text-emerald-300 border border-emerald-500/30'
                        : started
                          ? 'orbix-gold-card text-[#1B120B]'
                          : 'bg-[#261B12] border border-[#C48A55]/35 text-[#F3D9B1] hover:border-[#F3D9B1]/60'
                    }`}
                  >
                    {completed
                      ? 'Completed'
                      : isVerifying
                        ? 'Verifying...'
                        : started
                          ? 'Verify & Claim'
                          : 'Open Link'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </motion.div>
  );
}
