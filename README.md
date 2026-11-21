# Orbix (ORX) — Telegram Mini App

A mobile-first (`360–430px`) Telegram Mini App built with React, Vite, Tailwind CSS, and Supabase, featuring a dark espresso-and-gold glassmorphism UI, 7-day Daily Check-in streaks, a daily free Lucky Draw wheel, server-verified social tasks, reward nodes (`Node S` – `Node 6`), a 1-level referral system, internal transfers, withdrawal requests, and an Admin Console gated to `ADMIN_TG_ID`.

> **Points Notice:** All `ORX` balances and rewards are **in-app reward points only** earned from registration bonuses, Daily Check-ins, verified social tasks, free Lucky Draw spins, in-app reward nodes, and 1-level referrals. There is no mining, no daily ROI, no deposits, and no price or exchange listing promises.

---

## Security & Server Architecture

- **Telegram `initData` HMAC-SHA256 Verification**: Every backend request (`supabase/functions/orbix-api` and `server.ts`) reads the `x-telegram-init-data` header and verifies its cryptographic HMAC signature against `BOT_TOKEN` on the server.
- **Server-Authoritative Logic**: Balances, 1-level referral attribution, Daily Check-ins, Lucky Draw outcomes, task verification delays, node activation and daily releases, internal transfers, withdrawals, and admin actions run strictly on the server.
- **Referral Rules**: Each new user can be referred **only once** at first registration via `start_param` (`ref_<telegram_id>`), cannot refer themselves, and awards a fixed **+25 ORX** 1-level bonus recorded in the `referrals` table.
- **Admin Access Control**: Admin endpoints verify `tgUser.id === ADMIN_TG_ID` on the server (`403 Forbidden` otherwise).
- **Secrets Protection**: `BOT_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY` are kept strictly in server/Edge Function environment variables and never exposed to the frontend.

---

## Brand & Logo Customization

To customize the brand name, symbol, or upload your own logo image, edit `/src/config/brand.ts`:
- `name`: `'Orbix'`
- `symbol`: `'ORX'`
- `customLogoUrl`: optional URL/path to your custom logo asset (leave empty to use the built-in gold planet and orbit ring emblem).

---

## 1. Supabase Setup

1. Create a new project in [Supabase](https://supabase.com/).
2. Open **SQL Editor** in your Supabase Dashboard, paste the contents of `supabase/schema.sql`, and run it. This creates all tables (`users`, `tasks`, `user_tasks`, `check_ins`, `lucky_draws`, `referrals`, `withdraw_requests`, `transactions`, `broadcasts`, `user_nodes`) with **Row Level Security (RLS)** enabled and seeds the default tasks.
3. Install the Supabase CLI and link your project:
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```
4. Set Edge Function secrets:
   ```bash
   supabase secrets set \
     BOT_TOKEN="YOUR_TELEGRAM_BOT_TOKEN" \
     ADMIN_TG_ID="YOUR_NUMERIC_TELEGRAM_USER_ID" \
     MINI_APP_URL="https://your-app.vercel.app"
   ```
5. Deploy both Edge Functions:
   ```bash
   supabase functions deploy orbix-api --no-verify-jwt
   supabase functions deploy telegram-webhook --no-verify-jwt
   ```
6. Register your Telegram Bot webhook:
   ```bash
   curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://<PROJECT_REF>.supabase.co/functions/v1/telegram-webhook"}'
   ```

---

## 2. Environment Variables

### Frontend (Vercel / `.env`)
```env
VITE_SUPABASE_URL="https://<PROJECT_REF>.supabase.co"
VITE_SUPABASE_ANON_KEY="<YOUR_SUPABASE_ANON_KEY>"
VITE_BOT_USERNAME="YourBotUsernameWithoutAt"
VITE_APP_SHORT_NAME="app"
```

### Server / Supabase Edge Functions (Secrets Only)
```env
BOT_TOKEN="<YOUR_TELEGRAM_BOT_TOKEN>"
ADMIN_TG_ID="<YOUR_TELEGRAM_NUMERIC_ID>"
SUPABASE_SERVICE_ROLE_KEY="<YOUR_SUPABASE_SERVICE_ROLE_KEY>"
MINI_APP_URL="https://your-app.vercel.app"
```

---

## 3. Deploy Frontend on Vercel

1. Push this repository to GitHub/GitLab/Bitbucket.
2. Import the repository in [Vercel](https://vercel.com/).
3. Set **Framework Preset** to `Vite`, **Build Command** to `npm run build`, and **Output Directory** to `dist`.
4. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_BOT_USERNAME`, and `VITE_APP_SHORT_NAME` in **Project Settings → Environment Variables**.
5. Deploy and copy your Vercel URL (e.g., `https://orbix-app.vercel.app`).
6. Update `MINI_APP_URL` in your Supabase secrets to match your Vercel URL.

---

## 4. Configure the Mini App URL in `@BotFather`

1. Open [@BotFather](https://t.me/BotFather) in Telegram.
2. Select your bot via `/mybots`.
3. Configure the **Menu Button**:
   - **Bot Settings → Menu Button → Configure menu button**
   - Send your Vercel URL: `https://your-app.vercel.app`
   - Send button title: `Open App`
4. Register the Mini App short name via `/newapp` so referral links (`https://t.me/<BOT_USERNAME>/<APP_SHORT_NAME>?startapp=ref_<telegram_id>`) open directly in Telegram:
   - Run `/newapp` in `@BotFather`, select your bot, provide your Vercel URL, and choose a short name (e.g., `app` matching `VITE_APP_SHORT_NAME`).
5. Send `/start` to your bot to verify the **Open App**, **Join Channel**, and **Follow on X** buttons, or `/admin` from your `ADMIN_TG_ID` account.
