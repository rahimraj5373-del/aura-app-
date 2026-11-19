export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export interface VerifiedTelegramData {
  user: TelegramWebAppUser;
  startParam: string | null;
  authDate: number;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function verifyTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 86400
): Promise<VerifiedTelegramData> {
  if (!initData || !botToken) {
    throw new Error('Missing Telegram initData or BOT_TOKEN');
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) {
    throw new Error('Missing Telegram HMAC hash');
  }

  const authDate = Number(params.get('auth_date') || '0');
  if (!authDate || Math.floor(Date.now() / 1000) - authDate > maxAgeSeconds) {
    throw new Error('Telegram initData expired');
  }

  const entries: [string, string][] = [];
  params.forEach((value, key) => {
    if (key !== 'hash') {
      entries.push([key, value]);
    }
  });
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  const encoder = new TextEncoder();
  const webAppKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const secretKeyBytes = await crypto.subtle.sign(
    'HMAC',
    webAppKey,
    encoder.encode(botToken)
  );

  const secretKey = await crypto.subtle.importKey(
    'raw',
    secretKeyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    secretKey,
    encoder.encode(dataCheckString)
  );

  const calculatedHash = toHex(signature);
  if (!timingSafeEqual(calculatedHash, hash.toLowerCase())) {
    throw new Error('Invalid Telegram HMAC signature');
  }

  const userRaw = params.get('user');
  if (!userRaw) {
    throw new Error('Missing Telegram user payload');
  }

  const user = JSON.parse(userRaw) as TelegramWebAppUser;
  if (!user?.id) {
    throw new Error('Invalid Telegram user payload');
  }

  return {
    user,
    startParam: params.get('start_param'),
    authDate,
  };
}
