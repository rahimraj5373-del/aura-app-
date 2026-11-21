import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const botToken = Deno.env.get('BOT_TOKEN') ?? '';
  const adminTgId = Deno.env.get('ADMIN_TG_ID') ?? '';
  const miniAppUrl = Deno.env.get('MINI_APP_URL') ?? Deno.env.get('APP_URL') ?? 'https://your-vercel-app.vercel.app';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!botToken) {
    return new Response('BOT_TOKEN missing', { status: 500 });
  }

  const update = await req.json().catch(() => null);
  const message = update?.message;
  if (!message?.chat?.id) {
    return new Response('ok', { status: 200 });
  }

  const chatId = message.chat.id;
  const fromId = String(message.from?.id ?? '');
  const text = String(message.text ?? '').trim();

  async function sendTelegram(payload: Record<string, unknown>) {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, ...payload }),
    });
  }

  if (text.startsWith('/start')) {
    const parts = text.split(' ');
    const refParam = parts[1]?.trim() || '';
    const appLaunchUrl = refParam ? `${miniAppUrl}?tgWebAppStartParam=${encodeURIComponent(refParam)}` : miniAppUrl;

    await sendTelegram({
      text:
        `✨ *Welcome to Orbix*\n\n` +
        `Complete daily check-ins, verify community quests, activate reward nodes, spin the free daily Lucky Draw, and earn in-app ORX rewards by inviting friends.\n\n` +
        `• Welcome Bonus: *100 ORX* (In-App Rewards)\n` +
        `• 1-Level Referral Bonus: *+25 ORX* per valid invite\n\n` +
        `Tap *Open App* below to launch Orbix.`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '✨ Open App', web_app: { url: appLaunchUrl } }],
          [
            { text: '📢 Join Channel', url: 'https://t.me/tanjirul0123' },
            { text: '𝕏 Follow on X', url: 'https://x.com/tanjirul_king' },
          ],
        ],
      },
    });
  } else if (text.startsWith('/admin')) {
    if (!adminTgId || fromId !== adminTgId) {
      await sendTelegram({
        text: '⛔ Access denied. This command is restricted to the Orbix administrator.',
      });
      return new Response('ok', { status: 200 });
    }

    let statsLine = '';
    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey);
      const [{ count: userCount }, { count: pendingCount }] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('withdraw_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      statsLine = `\n• Total Users: *${userCount ?? 0}*\n• Pending Withdraws: *${pendingCount ?? 0}*\n`;
    }

    await sendTelegram({
      text:
        `🛡️ *Orbix Admin Console*\n` +
        statsLine +
        `\nOpen the app and navigate to *My → Admin Panel* to manage users, tasks, withdrawals, and broadcasts.`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '🛡️ Open Orbix Admin', web_app: { url: miniAppUrl } }]],
      },
    });
  }

  return new Response('ok', { status: 200 });
});
