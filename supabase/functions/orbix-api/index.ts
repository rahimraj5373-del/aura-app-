import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { verifyTelegramInitData } from '../_shared/telegram.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-init-data',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CHECKIN_REWARDS = [1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 7.0];
const REFERRAL_BONUS = 25.0;
const MIN_WITHDRAW = 50.0;
const TOTAL_POOL_ORX = 900_000_000;

const WHEEL_SEGMENTS = [
  { reward: 0.5, weight: 30 },
  { reward: 1.0, weight: 25 },
  { reward: 2.0, weight: 15 },
  { reward: 5.0, weight: 6 },
  { reward: 0.2, weight: 10 },
  { reward: 3.0, weight: 8 },
  { reward: 10.0, weight: 2 },
  { reward: 1.5, weight: 4 },
];

const NODE_TIERS = [
  { id: 'node_s', indexLabel: '01', name: 'Node S', subtitle: 'Starter Reward Node', costOrx: 120, dailyOrx: 1, durationDays: 200, totalEarningsOrx: 200, saleQuantity: 1000000, baseProgressPct: 36 },
  { id: 'node_1', indexLabel: '02', name: 'Node 1', subtitle: 'Bronze Core Node', costOrx: 1000, dailyOrx: 20, durationDays: 90, totalEarningsOrx: 1800, saleQuantity: 200000, baseProgressPct: 42 },
  { id: 'node_2', indexLabel: '03', name: 'Node 2', subtitle: 'Amber Relay Node', costOrx: 3500, dailyOrx: 80, durationDays: 90, totalEarningsOrx: 7200, saleQuantity: 50000, baseProgressPct: 28 },
  { id: 'node_3', indexLabel: '04', name: 'Node 3', subtitle: 'Gilded Vault Node', costOrx: 10000, dailyOrx: 250, durationDays: 80, totalEarningsOrx: 20000, saleQuantity: 15000, baseProgressPct: 19 },
  { id: 'node_4', indexLabel: '05', name: 'Node 4', subtitle: 'Solaris Cluster Node', costOrx: 18000, dailyOrx: 450, durationDays: 80, totalEarningsOrx: 36000, saleQuantity: 5000, baseProgressPct: 14 },
  { id: 'node_5', indexLabel: '06', name: 'Node 5', subtitle: 'Aurelia Apex Node', costOrx: 35000, dailyOrx: 900, durationDays: 75, totalEarningsOrx: 67500, saleQuantity: 2000, baseProgressPct: 9 },
  { id: 'node_6', indexLabel: '07', name: 'Node 6', subtitle: 'Genesis Sovereign Node', costOrx: 75000, dailyOrx: 2000, durationDays: 75, totalEarningsOrx: 150000, saleQuantity: 500, baseProgressPct: 5 },
];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function utcDateStr(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function yesterdayUtcStr(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function pickWheelSegment(): { index: number; reward: number } {
  const total = WHEEL_SEGMENTS.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
    roll -= WHEEL_SEGMENTS[i].weight;
    if (roll <= 0) {
      return { index: i, reward: WHEEL_SEGMENTS[i].reward };
    }
  }
  return { index: 0, reward: WHEEL_SEGMENTS[0].reward };
}

async function verifyTelegramMembershipIfPossible(
  taskUrl: string,
  category: string,
  tgId: string,
  botToken: string
): Promise<{ checked: boolean; isMember: boolean }> {
  if (!botToken || category !== 'telegram_channel') {
    return { checked: false, isMember: true };
  }
  const match = taskUrl.match(/https?:\/\/t\.me\/([a-zA-Z0-9_]{4,})/);
  if (!match || match[1].startsWith('+')) {
    return { checked: false, isMember: true };
  }
  const chatUsername = `@${match[1]}`;
  try {
    const resp = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(chatUsername)}&user_id=${encodeURIComponent(tgId)}`
    );
    const data = await resp.json();
    if (!data?.ok || !data?.result?.status) {
      return { checked: false, isMember: true };
    }
    const status = String(data.result.status);
    return {
      checked: true,
      isMember: ['member', 'administrator', 'creator', 'restricted'].includes(status),
    };
  } catch {
    return { checked: false, isMember: true };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get('BOT_TOKEN') ?? '';
    const adminTgId = Deno.env.get('ADMIN_TG_ID') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const initData = req.headers.get('x-telegram-init-data') ?? '';
    const verified = await verifyTelegramInitData(initData, botToken);
    const tgUser = verified.user;
    const tgId = String(tgUser.id);
    const isAdmin = Boolean(adminTgId && tgId === adminTgId);

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? 'bootstrap');

    let { data: user } = await supabase.from('users').select('*').eq('tg_id', tgId).maybeSingle();

    if (!user) {
      let referredBy: string | null = null;
      const rawStartParam = verified.startParam || (typeof body.startParam === 'string' ? body.startParam : null);

      if (rawStartParam && rawStartParam.startsWith('ref_')) {
        const candidate = rawStartParam.slice(4).trim();
        if (candidate && candidate !== tgId) {
          const { data: refUser } = await supabase
            .from('users')
            .select('tg_id, balance, valid_invites, referral_earnings')
            .eq('tg_id', candidate)
            .maybeSingle();

          if (refUser) {
            referredBy = candidate;
          }
        }
      }

      const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || 'Pioneer';

      const { data: created, error: createErr } = await supabase
        .from('users')
        .insert({
          tg_id: tgId,
          username: tgUser.username ?? null,
          first_name: tgUser.first_name || 'Pioneer',
          last_name: tgUser.last_name ?? null,
          photo_url: tgUser.photo_url ?? null,
          balance: 100,
          referred_by: referredBy,
        })
        .select('*')
        .single();

      if (createErr) throw createErr;
      user = created;

      await supabase.from('transactions').insert({
        tg_id: tgId,
        type: 'signup',
        amount: 100,
        description: 'Welcome Orbix registration bonus',
      });

      if (referredBy) {
        const { error: refInsertErr } = await supabase.from('referrals').insert({
          referrer_tg_id: referredBy,
          referred_tg_id: tgId,
          referred_name: fullName,
          referred_username: tgUser.username ?? null,
          bonus_awarded: REFERRAL_BONUS,
        });

        if (!refInsertErr) {
          const { data: refOwner } = await supabase
            .from('users')
            .select('balance, valid_invites, referral_earnings')
            .eq('tg_id', referredBy)
            .maybeSingle();

          if (refOwner) {
            await supabase
              .from('users')
              .update({
                balance: Number(refOwner.balance) + REFERRAL_BONUS,
                valid_invites: Number(refOwner.valid_invites) + 1,
                referral_earnings: Number(refOwner.referral_earnings) + REFERRAL_BONUS,
              })
              .eq('tg_id', referredBy);

            await supabase.from('transactions').insert({
              tg_id: referredBy,
              type: 'referral',
              amount: REFERRAL_BONUS,
              description: `1-Level Referral Bonus (${fullName})`,
            });
          }
        }
      }
    } else {
      await supabase
        .from('users')
        .update({
          username: tgUser.username ?? user.username,
          first_name: tgUser.first_name || user.first_name,
          last_name: tgUser.last_name ?? user.last_name,
          photo_url: tgUser.photo_url ?? user.photo_url,
          updated_at: new Date().toISOString(),
        })
        .eq('tg_id', tgId);
    }

    if (action === 'checkin') {
      const today = utcDateStr();
      if (user.last_checkin_date === today) {
        return json({ error: 'Already checked in today' }, 400);
      }
      const nextStreak = user.last_checkin_date === yesterdayUtcStr() ? Number(user.checkin_streak) + 1 : 1;
      const dayIndex = (nextStreak - 1) % 7;
      const reward = CHECKIN_REWARDS[dayIndex];

      await supabase.from('check_ins').insert({
        tg_id: tgId,
        checkin_date: today,
        streak_day: dayIndex + 1,
        reward,
      });

      await supabase
        .from('users')
        .update({
          balance: Number(user.balance) + reward,
          daily_earned: Number(user.daily_earned) + reward,
          checkin_streak: nextStreak,
          last_checkin_date: today,
          cumulative_checkin_rewards: Number(user.cumulative_checkin_rewards) + reward,
        })
        .eq('tg_id', tgId);

      await supabase.from('transactions').insert({
        tg_id: tgId,
        type: 'checkin',
        amount: reward,
        description: `Daily Check-in Day ${dayIndex + 1}`,
      });
    } else if (action === 'lucky-draw/spin') {
      const today = utcDateStr();
      if (user.last_spin_date === today) {
        return json({ error: 'Daily free spin already used today' }, 400);
      }
      const picked = pickWheelSegment();
      await supabase.from('lucky_draws').insert({
        tg_id: tgId,
        spin_date: today,
        segment_index: picked.index,
        reward: picked.reward,
      });
      await supabase
        .from('users')
        .update({
          balance: Number(user.balance) + picked.reward,
          daily_earned: Number(user.daily_earned) + picked.reward,
          last_spin_date: today,
        })
        .eq('tg_id', tgId);
      await supabase.from('transactions').insert({
        tg_id: tgId,
        type: 'lucky_draw',
        amount: picked.reward,
        description: `Lucky Draw Wheel Win (+${picked.reward} ORX)`,
      });

      const { data: updatedUser } = await supabase.from('users').select('*').eq('tg_id', tgId).single();
      return json({
        segmentIndex: picked.index,
        reward: picked.reward,
        user: updatedUser,
      });
    } else if (action === 'tasks/start') {
      const taskId = String(body.taskId ?? '');
      const { data: existing } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('tg_id', tgId)
        .eq('task_id', taskId)
        .maybeSingle();

      if (!existing) {
        await supabase.from('user_tasks').insert({
          tg_id: tgId,
          task_id: taskId,
          started_at: new Date().toISOString(),
        });
      } else if (!existing.completed_at && !existing.started_at) {
        await supabase
          .from('user_tasks')
          .update({ started_at: new Date().toISOString() })
          .eq('id', existing.id);
      }
    } else if (action === 'tasks/verify') {
      const taskId = String(body.taskId ?? '');
      const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).eq('is_active', true).maybeSingle();
      if (!task) return json({ error: 'Task not found' }, 404);

      const { data: ut } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('tg_id', tgId)
        .eq('task_id', taskId)
        .maybeSingle();

      if (!ut || !ut.started_at) {
        return json({ error: 'Please open the task link first before verifying' }, 400);
      }
      if (ut.completed_at) {
        return json({ error: 'Task reward already claimed' }, 400);
      }
      if (Date.now() - new Date(ut.started_at).getTime() < 3000) {
        return json({ error: 'Verification in progress — please visit the link for a moment and retry' }, 400);
      }

      const tgCheck = await verifyTelegramMembershipIfPossible(task.url, task.category, tgId, botToken);
      if (tgCheck.checked && !tgCheck.isMember) {
        return json({ error: 'Please join the official Telegram channel first and then tap Verify.' }, 400);
      }

      const reward = Number(task.reward);
      await supabase
        .from('user_tasks')
        .update({ completed_at: new Date().toISOString(), reward_claimed: reward })
        .eq('id', ut.id);

      await supabase
        .from('users')
        .update({
          balance: Number(user.balance) + reward,
          daily_earned: Number(user.daily_earned) + reward,
        })
        .eq('tg_id', tgId);

      await supabase.from('transactions').insert({
        tg_id: tgId,
        type: 'task',
        amount: reward,
        description: `Completed task: ${task.title}`,
      });
    } else if (action === 'node/activate') {
      const tierId = String(body.tierId ?? '');
      const tier = NODE_TIERS.find((n) => n.id === tierId);
      if (!tier) return json({ error: 'Node tier not found' }, 404);
      if (Number(user.balance) < tier.costOrx) {
        const needed = Number((tier.costOrx - Number(user.balance)).toFixed(2));
        return json({ error: `Insufficient ORX balance — earn ${needed} more ORX to activate ${tier.name}` }, 400);
      }

      await supabase.from('users').update({ balance: Number(user.balance) - tier.costOrx }).eq('tg_id', tgId);
      await supabase.from('user_nodes').insert({
        tg_id: tgId,
        tier_id: tier.id,
        tier_name: tier.name,
        daily_orx: tier.dailyOrx,
        duration_days: tier.durationDays,
      });
      await supabase.from('transactions').insert({
        tg_id: tgId,
        type: 'node_activate',
        amount: -tier.costOrx,
        description: `Activated ${tier.name} (+${tier.dailyOrx} ORX/day)`,
      });
    } else if (action === 'node/claim') {
      const userNodeId = String(body.userNodeId ?? '');
      const { data: owned } = await supabase
        .from('user_nodes')
        .select('*')
        .eq('id', userNodeId)
        .eq('tg_id', tgId)
        .maybeSingle();

      if (!owned) return json({ error: 'Owned node not found' }, 404);
      const today = utcDateStr();
      if (owned.last_claim_date === today) {
        return json({ error: `${owned.tier_name} daily reward already claimed today` }, 400);
      }
      if (Number(owned.days_claimed) >= Number(owned.duration_days)) {
        return json({ error: `${owned.tier_name} release cycle completed` }, 400);
      }

      const nextDays = Number(owned.days_claimed) + 1;
      const dailyReward = Number(owned.daily_orx);

      await supabase
        .from('user_nodes')
        .update({
          days_claimed: nextDays,
          last_claim_date: today,
          total_claimed_orx: Number(owned.total_claimed_orx) + dailyReward,
        })
        .eq('id', userNodeId);

      await supabase
        .from('users')
        .update({
          balance: Number(user.balance) + dailyReward,
          daily_earned: Number(user.daily_earned) + dailyReward,
        })
        .eq('tg_id', tgId);

      await supabase.from('transactions').insert({
        tg_id: tgId,
        type: 'node_claim',
        amount: dailyReward,
        description: `${owned.tier_name} Daily Release (Day ${nextDays}/${owned.duration_days})`,
      });
    } else if (action === 'transfer') {
      const recipientRaw = String(body.recipient ?? '').trim().replace(/^@/, '');
      const amount = Number(body.amount ?? 0);
      if (!recipientRaw || !Number.isFinite(amount) || amount <= 0) {
        return json({ error: 'Invalid recipient or amount' }, 400);
      }
      if (amount > Number(user.balance)) {
        return json({ error: 'Insufficient ORX balance' }, 400);
      }
      const { data: recipient } = await supabase
        .from('users')
        .select('*')
        .or(`tg_id.eq.${recipientRaw},username.ilike.${recipientRaw}`)
        .maybeSingle();

      if (!recipient || recipient.tg_id === tgId) {
        return json({ error: 'Recipient not found' }, 404);
      }

      await supabase.from('users').update({ balance: Number(user.balance) - amount }).eq('tg_id', tgId);
      await supabase.from('users').update({ balance: Number(recipient.balance) + amount }).eq('tg_id', recipient.tg_id);
      await supabase.from('transactions').insert([
        { tg_id: tgId, type: 'transfer_out', amount: -amount, description: `Transfer to ${recipient.first_name}` },
        { tg_id: recipient.tg_id, type: 'transfer_in', amount, description: `Received from ${user.first_name}` },
      ]);
    } else if (action === 'withdraw') {
      const walletAddress = String(body.walletAddress ?? '').trim();
      const amount = Number(body.amount ?? 0);
      if (walletAddress.length < 16) {
        return json({ error: 'Enter a valid destination address (min 16 characters)' }, 400);
      }
      if (!Number.isFinite(amount) || amount < MIN_WITHDRAW) {
        return json({ error: `Minimum withdrawal is ${MIN_WITHDRAW} ORX` }, 400);
      }
      if (amount > Number(user.balance)) {
        return json({ error: 'Insufficient ORX balance' }, 400);
      }

      await supabase.from('users').update({ balance: Number(user.balance) - amount }).eq('tg_id', tgId);
      await supabase.from('withdraw_requests').insert({
        tg_id: tgId,
        wallet_address: walletAddress,
        amount,
        status: 'pending',
      });
      await supabase.from('transactions').insert({
        tg_id: tgId,
        type: 'withdraw',
        amount: -amount,
        description: `Withdraw request (${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)})`,
      });
    } else if (action.startsWith('admin/')) {
      if (!isAdmin) {
        return json({ error: 'Forbidden: Admin Telegram ID required' }, 403);
      }

      if (action === 'admin/overview') {
        const [{ data: users }, { data: tasks }, { data: withdraws }, { data: broadcasts }] = await Promise.all([
          supabase.from('users').select('*').order('created_at', { ascending: false }),
          supabase.from('tasks').select('*').order('sort_order', { ascending: true }),
          supabase.from('withdraw_requests').select('*').order('created_at', { ascending: false }),
          supabase.from('broadcasts').select('*').order('created_at', { ascending: false }).limit(20),
        ]);

        const userMap = new Map((users ?? []).map((u) => [u.tg_id, u.first_name]));
        const enrichedWithdraws = (withdraws ?? []).map((w) => ({
          ...w,
          user_name: userMap.get(w.tg_id) ?? w.tg_id,
        }));

        return json({
          users: users ?? [],
          tasks: tasks ?? [],
          withdraws: enrichedWithdraws,
          broadcasts: broadcasts ?? [],
          stats: {
            totalUsers: (users ?? []).length,
            totalOrxSupply: (users ?? []).reduce((s, u) => s + Number(u.balance), 0),
            pendingWithdraws: (withdraws ?? []).filter((w) => w.status === 'pending').length,
          },
        });
      }

      if (action === 'admin/task-save') {
        const taskPayload = {
          title: String(body.title ?? '').trim(),
          subtitle: String(body.subtitle ?? '').trim(),
          url: String(body.url ?? '').trim(),
          reward: Number(body.reward ?? 10),
          category: body.category || 'custom',
          is_active: body.is_active !== false,
        };
        if (!taskPayload.title || !taskPayload.url) {
          return json({ error: 'Task title and URL are required' }, 400);
        }
        if (body.id) {
          await supabase.from('tasks').update(taskPayload).eq('id', body.id);
        } else {
          await supabase.from('tasks').insert(taskPayload);
        }
        return json({ ok: true });
      }

      if (action === 'admin/task-delete') {
        await supabase.from('tasks').delete().eq('id', String(body.id ?? ''));
        return json({ ok: true });
      }

      if (action === 'admin/withdraw-action') {
        const withdrawId = String(body.withdrawId ?? '');
        const decision = body.decision === 'approved' ? 'approved' : 'rejected';
        const { data: wr } = await supabase.from('withdraw_requests').select('*').eq('id', withdrawId).maybeSingle();
        if (!wr || wr.status !== 'pending') {
          return json({ error: 'Pending withdraw request not found' }, 404);
        }

        await supabase
          .from('withdraw_requests')
          .update({
            status: decision,
            admin_note: body.note ? String(body.note) : null,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', withdrawId);

        if (decision === 'rejected') {
          const { data: targetUser } = await supabase.from('users').select('balance').eq('tg_id', wr.tg_id).single();
          if (targetUser) {
            await supabase
              .from('users')
              .update({ balance: Number(targetUser.balance) + Number(wr.amount) })
              .eq('tg_id', wr.tg_id);
            await supabase.from('transactions').insert({
              tg_id: wr.tg_id,
              type: 'withdraw_refund',
              amount: Number(wr.amount),
              description: 'Withdraw request rejected — ORX refunded',
            });
          }
        }
        return json({ ok: true });
      }

      if (action === 'admin/broadcast') {
        const title = String(body.title ?? '').trim() || 'Orbix Announcement';
        const message = String(body.message ?? '').trim();
        if (!message) return json({ error: 'Broadcast message is required' }, 400);

        await supabase.from('broadcasts').insert({ title, message, created_by: tgId });

        if (botToken) {
          const { data: allUsers } = await supabase.from('users').select('tg_id');
          for (const u of allUsers ?? []) {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: u.tg_id,
                text: `✨ *${title}*\n\n${message}`,
                parse_mode: 'Markdown',
              }),
            }).catch(() => {});
          }
        }
        return json({ ok: true });
      }
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);

    const [
      { data: freshUser },
      { data: tasks },
      { data: userTasks },
      { data: userNodes },
      { data: referrals },
      { data: withdraws },
      { data: transactions },
      { data: latestBroadcast },
      { data: allBalances },
      { data: recentGlobalTx },
    ] = await Promise.all([
      supabase.from('users').select('*').eq('tg_id', tgId).single(),
      supabase.from('tasks').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      supabase.from('user_tasks').select('task_id, started_at, completed_at, reward_claimed').eq('tg_id', tgId),
      supabase.from('user_nodes').select('*').eq('tg_id', tgId).order('activated_at', { ascending: false }),
      supabase
        .from('referrals')
        .select('referred_tg_id, referred_name, referred_username, bonus_awarded, created_at')
        .eq('referrer_tg_id', tgId)
        .order('created_at', { ascending: false }),
      supabase.from('withdraw_requests').select('*').eq('tg_id', tgId).order('created_at', { ascending: false }),
      supabase.from('transactions').select('*').eq('tg_id', tgId).order('created_at', { ascending: false }).limit(25),
      supabase.from('broadcasts').select('id, title, message, created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('users').select('balance'),
      supabase.from('transactions').select('amount, created_at').gte('created_at', sevenDaysAgo.toISOString()),
    ]);

    const totalUsers = (allBalances ?? []).length;
    const totalDistributedOrx = (allBalances ?? []).reduce((s, r) => s + Number(r.balance), 0);

    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      const dayTx = (recentGlobalTx ?? []).filter(
        (tx) => String(tx.created_at).slice(0, 10) === iso && Number(tx.amount) > 0
      );
      dailyActivity.push({
        date: iso,
        label,
        earned: Number(dayTx.reduce((s, tx) => s + Number(tx.amount), 0).toFixed(2)),
        txCount: dayTx.length,
      });
    }

    return json({
      user: freshUser,
      isAdmin,
      tasks: tasks ?? [],
      userTasks: userTasks ?? [],
      completedTasksCount: (userTasks ?? []).filter((t) => t.completed_at).length,
      nodeTiers: NODE_TIERS,
      userNodes: userNodes ?? [],
      referrals: (referrals ?? []).map((r) => ({
        tg_id: r.referred_tg_id,
        first_name: r.referred_name || `User ${r.referred_tg_id.slice(-4)}`,
        username: r.referred_username ?? null,
        bonus_awarded: Number(r.bonus_awarded),
        created_at: r.created_at,
      })),
      withdraws: withdraws ?? [],
      transactions: transactions ?? [],
      latestBroadcast: latestBroadcast ?? null,
      communityStats: {
        totalUsers,
        totalPoolOrx: TOTAL_POOL_ORX,
        totalDistributedOrx: Number(totalDistributedOrx.toFixed(2)),
        dailyActivity,
      },
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Server error' }, 401);
  }
});
