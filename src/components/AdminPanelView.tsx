import { ArrowLeft, Check, Megaphone, Pencil, Plus, Shield, Trash2, Users, Wallet, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { BRAND } from '../config/brand';
import { orbixApi } from '../services/api';
import type { AdminOverviewResponse, TaskItem } from '../types/orbix';

interface AdminPanelViewProps {
  onBack: () => void;
  onDataChanged: () => Promise<void>;
}

type AdminTab = 'users' | 'tasks' | 'withdraws' | 'broadcast';

export function AdminPanelView({ onBack, onDataChanged }: AdminPanelViewProps) {
  const [tab, setTab] = useState<AdminTab>('users');
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [taskForm, setTaskForm] = useState<{
    id?: string;
    title: string;
    subtitle: string;
    url: string;
    reward: string;
    category: TaskItem['category'];
  }>({
    title: '',
    subtitle: '',
    url: '',
    reward: '10',
    category: 'custom',
  });

  const [broadcastTitle, setBroadcastTitle] = useState(`${BRAND.name} Update`);
  const [broadcastBody, setBroadcastBody] = useState('');

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const overview = await orbixApi.adminOverview();
      setData(overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load admin console');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await orbixApi.adminSaveTask({
      id: taskForm.id,
      title: taskForm.title,
      subtitle: taskForm.subtitle,
      url: taskForm.url,
      reward: Number(taskForm.reward) || 10,
      category: taskForm.category,
      is_active: true,
    });
    setTaskForm({ title: '', subtitle: '', url: '', reward: '10', category: 'custom' });
    setNotice('Task saved');
    await Promise.all([loadOverview(), onDataChanged()]);
  };

  const handleDeleteTask = async (id: string) => {
    await orbixApi.adminDeleteTask(id);
    setNotice('Task removed');
    await Promise.all([loadOverview(), onDataChanged()]);
  };

  const handleWithdrawDecision = async (withdrawId: string, decision: 'approved' | 'rejected') => {
    await orbixApi.adminWithdrawAction(withdrawId, decision);
    setNotice(`Withdraw ${decision}`);
    await Promise.all([loadOverview(), onDataChanged()]);
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastBody.trim()) return;
    await orbixApi.adminBroadcast(broadcastTitle, broadcastBody);
    setBroadcastBody('');
    setNotice('Broadcast published');
    await Promise.all([loadOverview(), onDataChanged()]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -18 }}
      className="pb-28 space-y-5"
    >
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="min-w-[44px] min-h-[44px] rounded-2xl orbix-glass flex items-center justify-center text-[#F3D9B1]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#C48A55]" />
          <span className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-[#F3D9B1]">
            Admin Console
          </span>
        </div>
        <div className="w-[44px]" />
      </div>

      {data && (
        <div className="grid grid-cols-3 gap-2.5">
          <div className="orbix-glass rounded-2xl p-3 text-center">
            <p className="text-[11px] text-[#8E7763]">Users</p>
            <p className="font-display text-lg font-semibold text-[#F7EFE6] font-mono-tabular">
              {data.stats.totalUsers}
            </p>
          </div>
          <div className="orbix-glass rounded-2xl p-3 text-center">
            <p className="text-[11px] text-[#8E7763]">{BRAND.symbol} Supply</p>
            <p className="font-display text-lg font-semibold text-[#F3D9B1] font-mono-tabular">
              {Math.round(data.stats.totalOrxSupply)}
            </p>
          </div>
          <div className="orbix-glass rounded-2xl p-3 text-center">
            <p className="text-[11px] text-[#8E7763]">Pending</p>
            <p className="font-display text-lg font-semibold text-[#E5BE8B] font-mono-tabular">
              {data.stats.pendingWithdraws}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[#1A120C] border border-[#C48A55]/20">
        {(
          [
            { id: 'users', label: 'Users', icon: Users },
            { id: 'tasks', label: 'Tasks', icon: Plus },
            { id: 'withdraws', label: 'Withdraws', icon: Wallet },
            { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`min-h-[42px] rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors ${
              tab === id ? 'orbix-gold-card text-[#1B120B]' : 'text-[#A58E79]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {notice && (
        <div className="rounded-xl bg-[#C48A55]/15 border border-[#C48A55]/40 px-4 py-2 text-xs text-[#F3D9B1]">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-950/50 border border-red-500/35 px-4 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="orbix-glass rounded-[24px] p-8 text-center text-xs text-[#A58E79]">
          Loading admin records...
        </div>
      ) : (
        data && (
          <>
            {tab === 'users' && (
              <div className="space-y-2.5">
                {data.users.map((u) => (
                  <div key={u.tg_id} className="orbix-glass rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F7EFE6] truncate">
                        {u.first_name} {u.last_name || ''}
                      </p>
                      <p className="text-xs text-[#8E7763] font-mono-tabular truncate">
                        ID: {u.tg_id} {u.username ? `· @${u.username}` : ''}
                      </p>
                      <p className="text-[11px] text-[#A58E79] mt-0.5">
                        Invites: {u.valid_invites} · Streak: {u.checkin_streak}d
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono-tabular text-sm font-semibold text-[#F3D9B1]">
                        {u.balance.toFixed(2)} {BRAND.symbol}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'tasks' && (
              <div className="space-y-4">
                <form onSubmit={handleSaveTask} className="orbix-glass rounded-[24px] p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#F3D9B1]">
                    {taskForm.id ? 'Edit Task' : 'Add New Task'}
                  </p>
                  <input
                    type="text"
                    required
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="Task Title"
                    className="w-full min-h-[44px] rounded-xl bg-[#20160E] border border-[#C48A55]/30 px-3 text-xs text-[#F7EFE6]"
                  />
                  <input
                    type="text"
                    value={taskForm.subtitle}
                    onChange={(e) => setTaskForm({ ...taskForm, subtitle: e.target.value })}
                    placeholder="Short Subtitle"
                    className="w-full min-h-[44px] rounded-xl bg-[#20160E] border border-[#C48A55]/30 px-3 text-xs text-[#F7EFE6]"
                  />
                  <input
                    type="url"
                    required
                    value={taskForm.url}
                    onChange={(e) => setTaskForm({ ...taskForm, url: e.target.value })}
                    placeholder="https://..."
                    className="w-full min-h-[44px] rounded-xl bg-[#20160E] border border-[#C48A55]/30 px-3 text-xs text-[#F7EFE6]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={taskForm.reward}
                      onChange={(e) => setTaskForm({ ...taskForm, reward: e.target.value })}
                      placeholder={`Reward ${BRAND.symbol}`}
                      className="min-h-[44px] rounded-xl bg-[#20160E] border border-[#C48A55]/30 px-3 text-xs text-[#F7EFE6]"
                    />
                    <select
                      value={taskForm.category}
                      onChange={(e) =>
                        setTaskForm({
                          ...taskForm,
                          category: e.target.value as TaskItem['category'],
                        })
                      }
                      className="min-h-[44px] rounded-xl bg-[#20160E] border border-[#C48A55]/30 px-3 text-xs text-[#F7EFE6]"
                    >
                      <option value="custom">Custom</option>
                      <option value="telegram_channel">Telegram Channel</option>
                      <option value="telegram_group">Telegram Group</option>
                      <option value="x">X (Twitter)</option>
                      <option value="facebook">Facebook</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 min-h-[44px] rounded-xl orbix-gold-card text-[#1B120B] text-xs font-semibold"
                    >
                      {taskForm.id ? 'Update Task' : 'Create Task'}
                    </button>
                    {taskForm.id && (
                      <button
                        type="button"
                        onClick={() =>
                          setTaskForm({
                            title: '',
                            subtitle: '',
                            url: '',
                            reward: '10',
                            category: 'custom',
                          })
                        }
                        className="px-4 min-h-[44px] rounded-xl bg-[#241910] text-xs text-[#A58E79]"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                <div className="space-y-2">
                  {data.tasks.map((t) => (
                    <div
                      key={t.id}
                      className="orbix-glass rounded-2xl p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#F7EFE6] truncate">{t.title}</p>
                        <p className="text-xs text-[#C48A55]">
                          +{t.reward} {BRAND.symbol}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setTaskForm({
                              id: t.id,
                              title: t.title,
                              subtitle: t.subtitle,
                              url: t.url,
                              reward: String(t.reward),
                              category: t.category,
                            })
                          }
                          aria-label="Edit task"
                          className="min-w-[38px] min-h-[38px] rounded-xl bg-[#241910] flex items-center justify-center text-[#F3D9B1]"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(t.id)}
                          aria-label="Delete task"
                          className="min-w-[38px] min-h-[38px] rounded-xl bg-red-950/50 flex items-center justify-center text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'withdraws' && (
              <div className="space-y-2.5">
                {data.withdraws.length === 0 ? (
                  <div className="orbix-glass rounded-2xl p-6 text-center text-xs text-[#8E7763]">
                    No withdrawal requests yet.
                  </div>
                ) : (
                  data.withdraws.map((w) => (
                    <div key={w.id} className="orbix-glass rounded-2xl p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#F7EFE6]">
                            {w.user_name} ·{' '}
                            <span className="text-[#F3D9B1]">
                              {w.amount} {BRAND.symbol}
                            </span>
                          </p>
                          <p className="text-xs font-mono-tabular text-[#8E7763] break-all mt-0.5">
                            {w.wallet_address}
                          </p>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.14em] text-[#C48A55] font-semibold">
                          {w.status}
                        </span>
                      </div>
                      {w.status === 'pending' && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleWithdrawDecision(w.id, 'approved')}
                            className="min-h-[40px] rounded-xl bg-emerald-900/50 border border-emerald-500/35 text-emerald-200 text-xs font-semibold flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleWithdrawDecision(w.id, 'rejected')}
                            className="min-h-[40px] rounded-xl bg-red-950/60 border border-red-500/35 text-red-200 text-xs font-semibold flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject & Refund</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'broadcast' && (
              <div className="space-y-4">
                <form onSubmit={handleBroadcast} className="orbix-glass rounded-[24px] p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#F3D9B1]">
                    Send Broadcast Announcement
                  </p>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="Headline"
                    className="w-full min-h-[44px] rounded-xl bg-[#20160E] border border-[#C48A55]/30 px-3 text-xs text-[#F7EFE6]"
                  />
                  <textarea
                    rows={4}
                    required
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    placeholder={`Write announcement for all ${BRAND.name} users...`}
                    className="w-full rounded-xl bg-[#20160E] border border-[#C48A55]/30 p-3 text-xs text-[#F7EFE6]"
                  />
                  <button
                    type="submit"
                    className="w-full min-h-[46px] rounded-xl orbix-gold-card text-[#1B120B] text-xs font-semibold"
                  >
                    Publish Broadcast
                  </button>
                </form>

                {data.broadcasts.map((b) => (
                  <div key={b.id} className="orbix-glass rounded-2xl p-3.5 space-y-1">
                    <p className="text-xs font-semibold text-[#F3D9B1]">{b.title}</p>
                    <p className="text-xs text-[#A58E79]">{b.message}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )
      )}
    </motion.div>
  );
}
