import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { verifyTelegramInitDataNode, type VerifiedTgUser } from './server/telegramAuth.ts';
import type {
  BroadcastMessage,
  CommunityStats,
  DailyActivityPoint,
  NodeTier,
  ReferralEntry,
  TaskItem,
  TransactionItem,
  UserNode,
  UserProfile,
  UserTask,
  WithdrawRequest,
} from './src/types/aura.ts';

interface TavoraDatabase {
  users: Record<string, UserProfile>;
  tasks: TaskItem[];
  userTasks: Record<string, Record<string, UserTask>>;
  userNodes: Record<string, UserNode[]>;
  referrals: Record<string, ReferralEntry[]>;
  withdraws: WithdrawRequest[];
  transactions: Record<string, TransactionItem[]>;
  broadcasts: BroadcastMessage[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'tavora-db.json');

const CHECKIN_REWARDS = [1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 7.0];
const REFERRAL_BONUS = 25.0;
const MIN_WITHDRAW = 50.0;
const TOTAL_POOL_TVR = 900_000_000;

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

const NODE_TIERS: NodeTier[] = [
  {
    id: 'node_s',
    indexLabel: '01',
    name: 'Node S',
    subtitle: 'Starter Reward Node',
    costTvr: 120,
    dailyTvr: 1,
    durationDays: 200,
    totalEarningsTvr: 200,
    saleQuantity: 1000000,
    baseProgressPct: 36,
  },
  {
    id: 'node_1',
    indexLabel: '02',
    name: 'Node 1',
    subtitle: 'Bronze Core Node',
    costTvr: 1000,
    dailyTvr: 20,
    durationDays: 90,
    totalEarningsTvr: 1800,
    saleQuantity: 200000,
    baseProgressPct: 42,
  },
  {
    id: 'node_2',
    indexLabel: '03',
    name: 'Node 2',
    subtitle: 'Amber Relay Node',
    costTvr: 3500,
    dailyTvr: 80,
    durationDays: 90,
    totalEarningsTvr: 7200,
    saleQuantity: 50000,
    baseProgressPct: 28,
  },
  {
    id: 'node_3',
    indexLabel: '04',
    name: 'Node 3',
    subtitle: 'Gilded Vault Node',
    costTvr: 10000,
    dailyTvr: 250,
    durationDays: 80,
    totalEarningsTvr: 20000,
    saleQuantity: 15000,
    baseProgressPct: 19,
  },
  {
    id: 'node_4',
    indexLabel: '05',
    name: 'Node 4',
    subtitle: 'Solaris Cluster Node',
    costTvr: 18000,
    dailyTvr: 450,
    durationDays: 80,
    totalEarningsTvr: 36000,
    saleQuantity: 5000,
    baseProgressPct: 14,
  },
  {
    id: 'node_5',
    indexLabel: '06',
    name: 'Node 5',
    subtitle: 'Aurelia Apex Node',
    costTvr: 35000,
    dailyTvr: 900,
    durationDays: 75,
    totalEarningsTvr: 67500,
    saleQuantity: 2000,
    baseProgressPct: 9,
  },
  {
    id: 'node_6',
    indexLabel: '07',
    name: 'Node 6',
    subtitle: 'Genesis Sovereign Node',
    costTvr: 75000,
    dailyTvr: 2000,
    durationDays: 75,
    totalEarningsTvr: 150000,
    saleQuantity: 500,
    baseProgressPct: 5,
  },
];

const DEFAULT_TASKS: TaskItem[] = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    title: 'Discussion Group',
    subtitle: 'Connect & Share',
    url: 'https://t.me/+I7sfRF2mQgZiZjVl',
    reward: 15,
    category: 'telegram_group',
    is_active: true,
    sort_order: 1,
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    title: 'Official Channel',
    subtitle: 'Follow the latest updates',
    url: 'https://t.me/tanjirul0123',
    reward: 15,
    category: 'telegram_channel',
    is_active: true,
    sort_order: 2,
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    title: 'Follow TAVORA on X',
    subtitle: 'Stay updated on X (Twitter)',
    url: 'https://x.com/tanjirul_king',
    reward: 12,
    category: 'x',
    is_active: true,
    sort_order: 3,
  },
  {
    id: '11111111-1111-1111-1111-111111111104',
    title: 'Like TAVORA on Facebook',
    subtitle: 'Join our Facebook community',
    url: 'https://www.facebook.com/share/18seM3aWbW/',
    reward: 12,
    category: 'facebook',
    is_active: true,
    sort_order: 4,
  },
];

function loadDb(): TavoraDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(DB_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as TavoraDatabase;
      return {
        users: parsed.users || {},
        tasks: parsed.tasks?.length ? parsed.tasks : [...DEFAULT_TASKS],
        userTasks: parsed.userTasks || {},
        userNodes: parsed.userNodes || {},
        referrals: parsed.referrals || {},
        withdraws: parsed.withdraws || [],
        transactions: parsed.transactions || {},
        broadcasts: parsed.broadcasts || [],
      };
    } catch {
      // Fallback to fresh DB
    }
  }
  return {
    users: {},
    tasks: [...DEFAULT_TASKS],
    userTasks: {},
    userNodes: {},
    referrals: {},
    withdraws: [],
    transactions: {},
    broadcasts: [],
  };
}

let db: TavoraDatabase = loadDb();

function saveDb(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function utcDateStr(d = new Date()): string {
  return d.toISOString().slice(0, 10);
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

function pushTx(tgId: string, type: TransactionItem['type'], amount: number, description: string): void {
  if (!db.transactions[tgId]) db.transactions[tgId] = [];
  db.transactions[tgId].unshift({
    id: crypto.randomUUID(),
    tg_id: tgId,
    type,
    amount,
    description,
    created_at: new Date().toISOString(),
  });
  db.transactions[tgId] = db.transactions[tgId].slice(0, 50);
}

async function verifyTelegramMembershipIfPossible(
  task: TaskItem,
  tgId: string,
  botToken: string
): Promise<{ checked: boolean; isMember: boolean }> {
  if (!botToken || task.category !== 'telegram_channel') {
    return { checked: false, isMember: true };
  }
  const match = task.url.match(/https?:\/\/t\.me\/([a-zA-Z0-9_]{4,})/);
  if (!match || match[1].startsWith('+')) {
    return { checked: false, isMember: true };
  }
  const chatUsername = `@${match[1]}`;
  try {
    const resp = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(chatUsername)}&user_id=${encodeURIComponent(tgId)}`
    );
    const json = (await resp.json()) as { ok?: boolean; result?: { status?: string } };
    if (!json.ok || !json.result?.status) {
      return { checked: false, isMember: true };
    }
    const status = json.result.status;
    return {
      checked: true,
      isMember: ['member', 'administrator', 'creator', 'restricted'].includes(status),
    };
  } catch {
    return { checked: false, isMember: true };
  }
}

function resolveTelegramRequest(req: express.Request): {
  user: VerifiedTgUser;
  startParam: string | null;
} {
  const botToken = process.env.BOT_TOKEN || '';
  const initData = String(req.headers['x-telegram-init-data'] || '');

  if (initData) {
    if (!botToken) {
      throw new Error('Server BOT_TOKEN is required to verify Telegram initData');
    }
    const verified = verifyTelegramInitDataNode(initData, botToken);
    return {
      user: verified.user,
      startParam: verified.startParam,
    };
  }

  if (process.env.NODE_ENV !== 'production' || !botToken) {
    const startParam = typeof req.body?.startParam === 'string' ? req.body.startParam : null;
    return {
      user: {
        id: 999000111,
        first_name: 'Tavora',
        last_name: 'Pioneer',
        username: 'tavora_pioneer',
      },
      startParam,
    };
  }

  throw new Error('Unauthorized: Open inside Telegram Mini App');
}

function ensureUser(tgUser: VerifiedTgUser, startParam: string | null): UserProfile {
  const tgId = String(tgUser.id);
  let user = db.users[tgId];
  if (!user) {
    let referredBy: string | null = null;
    const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || 'Pioneer';

    if (startParam && startParam.startsWith('ref_')) {
      const candidate = startParam.slice(4).trim();
      if (candidate && candidate !== tgId && db.users[candidate]) {
        referredBy = candidate;
        const referrer = db.users[candidate];
        referrer.balance = Number((referrer.balance + REFERRAL_BONUS).toFixed(4));
        referrer.valid_invites += 1;
        referrer.referral_earnings = Number((referrer.referral_earnings + REFERRAL_BONUS).toFixed(4));
        pushTx(candidate, 'referral', REFERRAL_BONUS, `1-Level Referral Bonus (${fullName})`);
        if (!db.referrals[candidate]) db.referrals[candidate] = [];
        db.referrals[candidate].unshift({
          tg_id: tgId,
          first_name: fullName,
          username: tgUser.username || null,
          bonus_awarded: REFERRAL_BONUS,
          created_at: new Date().toISOString(),
        });
      }
    }

    user = {
      tg_id: tgId,
      username: tgUser.username || null,
      first_name: tgUser.first_name || 'Pioneer',
      last_name: tgUser.last_name || null,
      photo_url: tgUser.photo_url || null,
      balance: 100,
      daily_earned: 0,
      checkin_streak: 0,
      last_checkin_date: null,
      cumulative_checkin_rewards: 0,
      last_spin_date: null,
      referred_by: referredBy,
      valid_invites: 0,
      referral_earnings: 0,
      created_at: new Date().toISOString(),
    };
    db.users[tgId] = user;
    pushTx(tgId, 'signup', 100, 'Welcome TAVORA registration bonus');
    saveDb();
  } else {
    user.username = tgUser.username ?? user.username;
    user.first_name = tgUser.first_name || user.first_name;
    user.last_name = tgUser.last_name ?? user.last_name;
    user.photo_url = tgUser.photo_url ?? user.photo_url;
  }
  return user;
}

function buildCommunityStats(): CommunityStats {
  const allUsers = Object.values(db.users);
  const allTx = Object.values(db.transactions).flat();

  const totalDistributedTvr = allUsers.reduce((sum, u) => sum + u.balance, 0);

  const dailyActivity: DailyActivityPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    const dayTx = allTx.filter((tx) => tx.created_at.slice(0, 10) === iso && tx.amount > 0);
    dailyActivity.push({
      date: iso,
      label,
      earned: Number(dayTx.reduce((s, tx) => s + tx.amount, 0).toFixed(2)),
      txCount: dayTx.length,
    });
  }

  return {
    totalUsers: allUsers.length,
    totalPoolTvr: TOTAL_POOL_TVR,
    totalDistributedTvr: Number(totalDistributedTvr.toFixed(2)),
    dailyActivity,
  };
}

function buildBootstrap(tgId: string, isAdmin: boolean) {
  const user = db.users[tgId];
  const userTasksMap = db.userTasks[tgId] || {};
  const userTasks = Object.values(userTasksMap);
  const completedTasksCount = userTasks.filter((t) => Boolean(t.completed_at)).length;

  return {
    user,
    isAdmin,
    tasks: db.tasks.filter((t) => t.is_active).sort((a, b) => a.sort_order - b.sort_order),
    userTasks,
    completedTasksCount,
    nodeTiers: NODE_TIERS,
    userNodes: db.userNodes[tgId] || [],
    referrals: db.referrals[tgId] || [],
    withdraws: db.withdraws.filter((w) => w.tg_id === tgId),
    transactions: db.transactions[tgId] || [],
    latestBroadcast: db.broadcasts[0] || null,
    communityStats: buildCommunityStats(),
    serverTime: new Date().toISOString(),
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.post('/api/tavora', async (req, res) => {
    try {
      const { user: tgUser, startParam } = resolveTelegramRequest(req);
      const tgId = String(tgUser.id);
      const adminTgId = (process.env.ADMIN_TG_ID || '').trim();
      const isAdmin = Boolean(adminTgId && tgId === adminTgId);

      const user = ensureUser(tgUser, startParam);
      const action = String(req.body?.action || 'bootstrap');

      if (action === 'checkin') {
        const today = utcDateStr();
        if (user.last_checkin_date === today) {
          return res.status(400).json({ error: 'Already checked in today' });
        }
        const nextStreak = user.last_checkin_date === yesterdayUtcStr() ? user.checkin_streak + 1 : 1;
        const dayIndex = (nextStreak - 1) % 7;
        const reward = CHECKIN_REWARDS[dayIndex];

        user.balance = Number((user.balance + reward).toFixed(4));
        user.daily_earned = Number((user.daily_earned + reward).toFixed(4));
        user.checkin_streak = nextStreak;
        user.last_checkin_date = today;
        user.cumulative_checkin_rewards = Number((user.cumulative_checkin_rewards + reward).toFixed(4));
        pushTx(tgId, 'checkin', reward, `Daily Check-in Day ${dayIndex + 1}`);
        saveDb();
      } else if (action === 'lucky-draw/spin') {
        const today = utcDateStr();
        if (user.last_spin_date === today) {
          return res.status(400).json({ error: 'Daily free spin already used today' });
        }
        const picked = pickWheelSegment();
        user.balance = Number((user.balance + picked.reward).toFixed(4));
        user.daily_earned = Number((user.daily_earned + picked.reward).toFixed(4));
        user.last_spin_date = today;
        pushTx(tgId, 'lucky_draw', picked.reward, `Lucky Draw Wheel Win (+${picked.reward} TVR)`);
        saveDb();
        return res.json({
          segmentIndex: picked.index,
          reward: picked.reward,
          user,
        });
      } else if (action === 'tasks/start') {
        const taskId = String(req.body?.taskId || '');
        if (!db.userTasks[tgId]) db.userTasks[tgId] = {};
        const existing = db.userTasks[tgId][taskId];
        if (!existing) {
          db.userTasks[tgId][taskId] = {
            task_id: taskId,
            started_at: new Date().toISOString(),
            completed_at: null,
            reward_claimed: 0,
          };
          saveDb();
        } else if (!existing.completed_at && !existing.started_at) {
          existing.started_at = new Date().toISOString();
          saveDb();
        }
      } else if (action === 'tasks/verify') {
        const taskId = String(req.body?.taskId || '');
        const task = db.tasks.find((t) => t.id === taskId && t.is_active);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        const ut = db.userTasks[tgId]?.[taskId];
        if (!ut || !ut.started_at) {
          return res.status(400).json({ error: 'Please open the task link first before verifying' });
        }
        if (ut.completed_at) {
          return res.status(400).json({ error: 'Task reward already claimed' });
        }
        if (Date.now() - new Date(ut.started_at).getTime() < 3000) {
          return res.status(400).json({ error: 'Verification in progress — please visit the link for a moment and retry' });
        }

        const botToken = process.env.BOT_TOKEN || '';
        const tgCheck = await verifyTelegramMembershipIfPossible(task, tgId, botToken);
        if (tgCheck.checked && !tgCheck.isMember) {
          return res.status(400).json({ error: 'Please join the official Telegram channel first and then tap Verify.' });
        }

        ut.completed_at = new Date().toISOString();
        ut.reward_claimed = task.reward;
        user.balance = Number((user.balance + task.reward).toFixed(4));
        user.daily_earned = Number((user.daily_earned + task.reward).toFixed(4));
        pushTx(tgId, 'task', task.reward, `Completed task: ${task.title}`);
        saveDb();
      } else if (action === 'node/activate') {
        const tierId = String(req.body?.tierId || '');
        const tier = NODE_TIERS.find((n) => n.id === tierId);
        if (!tier) {
          return res.status(404).json({ error: 'Node tier not found' });
        }
        if (user.balance < tier.costTvr) {
          const needed = Number((tier.costTvr - user.balance).toFixed(2));
          return res.status(400).json({
            error: `Insufficient TVR balance — earn ${needed} more TVR to activate ${tier.name}`,
          });
        }
        user.balance = Number((user.balance - tier.costTvr).toFixed(4));
        if (!db.userNodes[tgId]) db.userNodes[tgId] = [];
        db.userNodes[tgId].unshift({
          id: crypto.randomUUID(),
          tg_id: tgId,
          tier_id: tier.id,
          tier_name: tier.name,
          daily_tvr: tier.dailyTvr,
          duration_days: tier.durationDays,
          days_claimed: 0,
          total_claimed_tvr: 0,
          last_claim_date: null,
          activated_at: new Date().toISOString(),
        });
        pushTx(tgId, 'node_activate', -tier.costTvr, `Activated ${tier.name} (+${tier.dailyTvr} TVR/day)`);
        saveDb();
      } else if (action === 'node/claim') {
        const userNodeId = String(req.body?.userNodeId || '');
        const nodeList = db.userNodes[tgId] || [];
        const owned = nodeList.find((n) => n.id === userNodeId);
        if (!owned) {
          return res.status(404).json({ error: 'Owned node not found' });
        }
        const today = utcDateStr();
        if (owned.last_claim_date === today) {
          return res.status(400).json({ error: `${owned.tier_name} daily reward already claimed today` });
        }
        if (owned.days_claimed >= owned.duration_days) {
          return res.status(400).json({ error: `${owned.tier_name} release cycle completed` });
        }
        owned.days_claimed += 1;
        owned.last_claim_date = today;
        owned.total_claimed_tvr = Number((owned.total_claimed_tvr + owned.daily_tvr).toFixed(4));
        user.balance = Number((user.balance + owned.daily_tvr).toFixed(4));
        user.daily_earned = Number((user.daily_earned + owned.daily_tvr).toFixed(4));
        pushTx(tgId, 'node_claim', owned.daily_tvr, `${owned.tier_name} Daily Release (Day ${owned.days_claimed}/${owned.duration_days})`);
        saveDb();
      } else if (action === 'transfer') {
        const recipientRaw = String(req.body?.recipient || '').trim().replace(/^@/, '').toLowerCase();
        const amount = Number(req.body?.amount || 0);
        if (!recipientRaw || !Number.isFinite(amount) || amount <= 0) {
          return res.status(400).json({ error: 'Invalid recipient or amount' });
        }
        if (amount > user.balance) {
          return res.status(400).json({ error: 'Insufficient TVR balance' });
        }
        const recipient = Object.values(db.users).find(
          (u) => u.tg_id === recipientRaw || (u.username && u.username.toLowerCase() === recipientRaw)
        );
        if (!recipient || recipient.tg_id === tgId) {
          return res.status(404).json({ error: 'Recipient not found' });
        }
        user.balance = Number((user.balance - amount).toFixed(4));
        recipient.balance = Number((recipient.balance + amount).toFixed(4));
        pushTx(tgId, 'transfer_out', -amount, `Transfer to ${recipient.first_name}`);
        pushTx(recipient.tg_id, 'transfer_in', amount, `Received from ${user.first_name}`);
        saveDb();
      } else if (action === 'withdraw') {
        const walletAddress = String(req.body?.walletAddress || '').trim();
        const amount = Number(req.body?.amount || 0);
        if (walletAddress.length < 16) {
          return res.status(400).json({ error: 'Enter a valid destination address (min 16 characters)' });
        }
        if (!Number.isFinite(amount) || amount < MIN_WITHDRAW) {
          return res.status(400).json({ error: `Minimum withdrawal is ${MIN_WITHDRAW} TVR` });
        }
        if (amount > user.balance) {
          return res.status(400).json({ error: 'Insufficient TVR balance' });
        }
        user.balance = Number((user.balance - amount).toFixed(4));
        db.withdraws.unshift({
          id: crypto.randomUUID(),
          tg_id: tgId,
          wallet_address: walletAddress,
          amount,
          status: 'pending',
          admin_note: null,
          created_at: new Date().toISOString(),
          reviewed_at: null,
        });
        pushTx(tgId, 'withdraw', -amount, `Withdraw request (${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)})`);
        saveDb();
      } else if (action.startsWith('admin/')) {
        if (!isAdmin) {
          return res.status(403).json({ error: 'Forbidden: Admin Telegram ID required' });
        }

        if (action === 'admin/overview') {
          const allUsers = Object.values(db.users);
          return res.json({
            users: allUsers,
            tasks: db.tasks.sort((a, b) => a.sort_order - b.sort_order),
            withdraws: db.withdraws.map((w) => ({
              ...w,
              user_name: db.users[w.tg_id]?.first_name || w.tg_id,
            })),
            broadcasts: db.broadcasts,
            stats: {
              totalUsers: allUsers.length,
              totalTvrSupply: allUsers.reduce((sum, u) => sum + u.balance, 0),
              pendingWithdraws: db.withdraws.filter((w) => w.status === 'pending').length,
            },
          });
        }

        if (action === 'admin/task-save') {
          const title = String(req.body?.title || '').trim();
          const subtitle = String(req.body?.subtitle || '').trim();
          const url = String(req.body?.url || '').trim();
          const reward = Number(req.body?.reward || 10);
          const category = req.body?.category || 'custom';
          const is_active = req.body?.is_active !== false;
          if (!title || !url) {
            return res.status(400).json({ error: 'Task title and URL are required' });
          }
          if (req.body?.id) {
            const idx = db.tasks.findIndex((t) => t.id === req.body.id);
            if (idx >= 0) {
              db.tasks[idx] = { ...db.tasks[idx], title, subtitle, url, reward, category, is_active };
            }
          } else {
            db.tasks.push({
              id: crypto.randomUUID(),
              title,
              subtitle,
              url,
              reward,
              category,
              is_active,
              sort_order: db.tasks.length + 1,
            });
          }
          saveDb();
          return res.json({ ok: true });
        }

        if (action === 'admin/task-delete') {
          const id = String(req.body?.id || '');
          db.tasks = db.tasks.filter((t) => t.id !== id);
          saveDb();
          return res.json({ ok: true });
        }

        if (action === 'admin/withdraw-action') {
          const withdrawId = String(req.body?.withdrawId || '');
          const decision = req.body?.decision === 'approved' ? 'approved' : 'rejected';
          const wr = db.withdraws.find((w) => w.id === withdrawId);
          if (!wr || wr.status !== 'pending') {
            return res.status(404).json({ error: 'Pending withdraw request not found' });
          }
          wr.status = decision;
          wr.admin_note = req.body?.note ? String(req.body.note) : null;
          wr.reviewed_at = new Date().toISOString();
          if (decision === 'rejected' && db.users[wr.tg_id]) {
            db.users[wr.tg_id].balance = Number((db.users[wr.tg_id].balance + wr.amount).toFixed(4));
            pushTx(wr.tg_id, 'withdraw_refund', wr.amount, 'Withdraw request rejected — TVR refunded');
          }
          saveDb();
          return res.json({ ok: true });
        }

        if (action === 'admin/broadcast') {
          const title = String(req.body?.title || '').trim() || 'TAVORA Announcement';
          const message = String(req.body?.message || '').trim();
          if (!message) return res.status(400).json({ error: 'Broadcast message is required' });
          db.broadcasts.unshift({
            id: crypto.randomUUID(),
            title,
            message,
            created_at: new Date().toISOString(),
          });
          db.broadcasts = db.broadcasts.slice(0, 20);
          saveDb();

          const botToken = process.env.BOT_TOKEN || '';
          if (botToken) {
            for (const u of Object.values(db.users)) {
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
          return res.json({ ok: true });
        }
      }

      return res.json(buildBootstrap(tgId, isAdmin));
    } catch (err) {
      return res.status(401).json({ error: err instanceof Error ? err.message : 'Unauthorized' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`TAVORA server listening on http://localhost:${port}`);
  });
}

startServer();
