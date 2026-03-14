const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// ── CORS — allow requests from the WebApp (Netlify) ──────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── CONFIG ────────────────────────────────────────────────
const BOT_TOKEN    = '8706815270:AAEAIuXcAV19QwC3VtYa3f2pHX0XxPOMZ98';
const SUPABASE_URL = 'https://vmpwngiahouuvaosdoke.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtcHduZ2lhaG91dXZhb3Nkb2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNjQxMjYsImV4cCI6MjA4Nzk0MDEyNn0.Qjil6gdVcbNGDOk2lIYWVbHJF2nOeTfHaXUsn75Bn0I';
const APP_URL      = process.env.APP_URL || 'https://goldtask.netlify.app/app.html';
const PORT         = process.env.PORT || 3000;

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── HELPERS ───────────────────────────────────────────────
async function sendMsg(chatId, text, extra = {}) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', ...extra })
    });
    const data = await res.json();
    if (!data.ok) console.error('sendMsg failed:', data.description);
  } catch (e) {
    console.error('sendMsg error:', e.message);
  }
}

// Build the WebApp button — if a refCode exists, append it to the URL
// e.g. https://goldtask.netlify.app/app.html?ref=TITAN1234
function appButton(refCode = null) {
  const url = refCode ? `${APP_URL}?ref=${encodeURIComponent(refCode)}` : APP_URL;
  return {
    reply_markup: JSON.stringify({
      inline_keyboard: [[
        { text: '🚀 Open QuickTask App', web_app: { url } }
      ]]
    })
  };
}

async function getRefBonus() {
  try {
    const { data } = await db.from('settings').select('value').eq('key', 'ref_bonus').single();
    return data ? parseFloat(data.value) || 0.50 : 0.50;
  } catch (e) { return 0.50; }
}

// ── /start HANDLER ────────────────────────────────────────
// NEW FLOW:
//   1. Bot receives /start REFCODE
//   2. Bot sends WebApp button with ?ref=REFCODE in the URL
//   3. WebApp reads ?ref= and calls /register to handle user creation + bonus
//   4. Bot does NOT create the user or credit anyone here
async function handleStart(msg, refCode) {
  const tgUser    = msg.from;
  const tid       = String(tgUser.id);
  const firstName = tgUser.first_name || 'User';

  console.log(`/start from ${firstName} (${tid}) | ref: ${refCode || 'none'}`);

  // Returning user — open app normally, no ref code needed
  const { data: existing } = await db
    .from('users').select('id,balance').eq('telegram_id', tid).single();

  if (existing) {
    await sendMsg(tid,
      `👋 Welcome back, *${firstName}*!\n\nBalance: *$${parseFloat(existing.balance || 0).toFixed(2)}*\n\nTap below to continue earning 👇`,
      appButton() // no ref code for returning users
    );
    return;
  }

  // New user — pass refCode in the WebApp URL so the WebApp can handle it
  await sendMsg(tid,
    `🎉 Welcome to *QuickTask*, ${firstName}!\n\n` +
    `💰 Complete tasks and earn real money\n` +
    `👥 Refer friends and earn *$0.50* per referral\n` +
    `💸 Withdraw via USDT, Bank Transfer, Mobile Money & more\n\n` +
    `Tap below to start earning 👇`,
    appButton(refCode) // ← refCode baked into the URL
  );

  console.log(`New user welcomed: ${firstName} (${tid}) | WebApp URL includes ref: ${refCode || 'none'}`);
}

// ── /register ENDPOINT ────────────────────────────────────
// Called by app.html during init() when the user is NEW.
// Handles: user creation, referral validation, bonus credit, notification.
// app.html sends: { telegram_id, name, ref_code (new user's own code), ref_by (from ?ref= URL param) }
app.post('/register', async (req, res) => {
  const { telegram_id, name, ref_code, ref_by } = req.body;

  if (!telegram_id || !name || !ref_code) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }

  const tid = String(telegram_id);

  try {
    // Double-check — don't create if already exists (race condition guard)
    const { data: existing } = await db
      .from('users').select('id').eq('telegram_id', tid).single();

    if (existing) {
      console.log(`/register: user ${tid} already exists, skipping`);
      return res.json({ ok: true, already_existed: true });
    }

    // Validate referrer — must exist and must not be self
    let validRefBy = null;
    let referrer   = null;

    if (ref_by) {
      const { data: ref } = await db
        .from('users').select('*').eq('ref_code', ref_by).single();

      if (ref && String(ref.telegram_id) !== tid) {
        validRefBy = ref_by;
        referrer   = ref;
        console.log(`Valid referral: ${name} referred by ${ref.name}`);
      } else if (ref && String(ref.telegram_id) === tid) {
        console.log(`Self-referral blocked for ${name}`);
      } else {
        console.log(`Referral code ${ref_by} not found`);
      }
    }

    // Create the new user in Supabase
    const { data: newUser, error: insertError } = await db.from('users').insert([{
      telegram_id:     tid,
      name:            name,
      email:           `${tid}@tg.user`,
      password:        `tg_${tid}`,
      ref_code:        ref_code,
      ref_by:          validRefBy,
      ref_bonus_paid:  validRefBy ? true : false, // mark paid immediately since we pay now
      balance:         0,
      tasks_completed: 0,
      referrals:       0,
      withdrawn:       0,
      join_date:       new Date().toLocaleDateString()
    }]).select().single();

    if (insertError) {
      console.error('/register insert error:', insertError.message);
      return res.status(500).json({ ok: false, error: insertError.message });
    }

    console.log(`✅ New user registered: ${name} (${tid})`);

    // Respond to app immediately so UI doesn't wait
    res.json({ ok: true, user: newUser });

    // ── NOW handle referral bonus (after user created) ──
    if (referrer && validRefBy) {
      const bonus      = await getRefBonus();
      const newBalance = parseFloat(referrer.balance || 0) + bonus;
      const newRefs    = (referrer.referrals || 0) + 1;

      // 1. Credit referrer balance
      await db.from('users').update({
        balance:   newBalance,
        referrals: newRefs
      }).eq('id', referrer.id);

      // 2. Insert referral transaction in submissions table (shows in referrer's history)
      await db.from('submissions').insert([{
        user_id:    referrer.id,
        user_name:  referrer.name,
        user_email: referrer.email || '',
        task_id:    null,
        task_title: `Referral Bonus — ${name}`,
        reward:     bonus,
        status:     'approved',
        proof:      'referral',
        date:       new Date().toLocaleDateString()
      }]);

      console.log(`✅ Referral bonus $${bonus} credited to ${referrer.name} for referring ${name}`);

      // 3. Notify referrer via Telegram
      await sendMsg(String(referrer.telegram_id),
        `💰 *Referral Bonus Received!*\n\n` +
        `*${name}* just joined and opened the app using your link!\n` +
        `*+$${bonus.toFixed(2)}* has been added to your balance 🎉\n\n` +
        `New balance: *$${newBalance.toFixed(2)}*`
      );
    }

  } catch (e) {
    console.error('/register error:', e.message);
    if (!res.headersSent) res.status(500).json({ ok: false, error: e.message });
  }
});

// ── /notify ENDPOINT ──────────────────────────────────────
// Admin panel uses this to send approval/rejection/withdrawal notifications
app.post('/notify', async (req, res) => {
  const { telegram_id, message } = req.body;
  if (!telegram_id || !message) return res.status(400).json({ error: 'Missing fields' });
  try {
    await sendMsg(String(telegram_id), message);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── TELEGRAM WEBHOOK ──────────────────────────────────────
app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // always respond fast
  try {
    const update = req.body;
    if (!update.message) return;

    const msg  = update.message;
    const text = msg.text || '';
    const tid  = String(msg.from.id);

    if (text.startsWith('/start')) {
      const refCode = text.split(' ')[1] || null;
      await handleStart(msg, refCode);

    } else if (text === '/balance') {
      const { data: u } = await db
        .from('users').select('balance,tasks_completed,referrals').eq('telegram_id', tid).single();
      if (u) {
        await sendMsg(tid,
          `💰 *Your Balance*\n\n` +
          `Available: *$${parseFloat(u.balance || 0).toFixed(2)}*\n` +
          `Tasks done: *${u.tasks_completed || 0}*\n` +
          `Referrals: *${u.referrals || 0}*`,
          appButton()
        );
      } else {
        await sendMsg(tid, `You don't have an account yet. Tap below to get started!`, appButton());
      }

    } else if (text === '/help') {
      await sendMsg(tid,
        `🤖 *QuickTask Commands*\n\n` +
        `/start — Open the app\n` +
        `/balance — Check your balance\n` +
        `/help — Show this menu`,
        appButton()
      );
    }

  } catch (err) {
    console.error('Webhook error:', err.message);
  }
});

// ── /send-reminders ENDPOINT ─────────────────────────────
// Called by admin panel or a cron job (UptimeRobot etc)
// Sends re-engagement message to users inactive > configured days
app.post('/send-reminders', async (req, res) => {
  res.json({ ok: true, message: 'Reminders processing in background' });
  try {
    const daysRes = await db.from('settings').select('value').eq('key','inactive_days').single();
    const days    = daysRes.data ? parseInt(daysRes.data.value) || 3 : 3;
    const cutoff  = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { data: users } = await db
      .from('users')
      .select('telegram_id,name,last_seen')
      .eq('banned', false);

    const inactive = (users || []).filter(u => {
      if (!u.telegram_id) return false;
      if (!u.last_seen)   return true;
      return new Date(u.last_seen) < cutoff;
    });

    let sent = 0;
    for (const u of inactive) {
      try {
        await sendMsg(String(u.telegram_id),
          `👋 Hey *${u.name.split(' ')[0]}*! Miss you on GoldTask!\n\n` +
          `⚡ New tasks are waiting for you\n` +
          `🎁 Don't forget your daily check-in bonus\n\n` +
          `Tap below to start earning again 👇`,
          {
            reply_markup: JSON.stringify({
              inline_keyboard: [[{ text: '🚀 Open GoldTask', web_app: { url: APP_URL } }]]
            })
          }
        );
        sent++;
        await new Promise(r => setTimeout(r, 100)); // rate limit safety
      } catch(e) { console.error('Reminder failed for', u.telegram_id, e.message); }
    }
    console.log(`✅ Reminders sent to ${sent}/${inactive.length} inactive users`);
  } catch(e) {
    console.error('send-reminders error:', e.message);
  }
});

// ── HEALTH CHECK ──────────────────────────────────────────
app.get('/', (req, res) => res.json({
  status:    'GoldTask Bot ✅',
  time:      new Date().toISOString(),
  endpoints: ['/webhook', '/register', '/notify', '/send-reminders']
}));

app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));
