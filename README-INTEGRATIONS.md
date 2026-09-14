# Connecting real M-Pesa, SMS, and email

The code is real and functional — these three integrations only work once you plug in real
credentials, because they come from external providers who need to verify *you*, not your code.
None of this can be done on your behalf; here's exactly how to do each one.

## 1. M-Pesa (Safaricom Daraja) — for real STK Push payments

**Sandbox (free, works today, fake money):**
1. Go to https://developer.safaricom.co.ke and create a free account.
2. Dashboard → **My Apps** → **Add a new App**. Select the **Lipa Na M-Pesa Sandbox** product.
3. Copy the **Consumer Key** and **Consumer Secret** it generates.
4. Safaricom's public sandbox shortcode is `174379` and its sandbox passkey is published on their docs page for the Lipa Na M-Pesa Online sandbox — copy it from the "Test Credentials" section of https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate.
5. On Render, open your `yourplug-api` service → **Environment**, set:
   ```
   MPESA_ENV=sandbox
   MPESA_CONSUMER_KEY=<from step 3>
   MPESA_CONSUMER_SECRET=<from step 3>
   MPESA_SHORTCODE=174379
   MPESA_PASSKEY=<from step 4>
   MPESA_CALLBACK_URL=https://yourplug-api.onrender.com/api/payments/mpesa/webhook
   ```
   (use your actual API URL — the callback must be a real public HTTPS URL, which Render already gives you)
6. Save — the API redeploys automatically.
7. Sandbox STK pushes only work with Safaricom's test phone numbers, not your real phone — see their docs for the current test MSISDN. This proves the flow works end to end before you go live.

**Going live (real money, real customers):**
1. On the same Safaricom developer portal, apply for a **production Lipa Na M-Pesa Online (till or paybill)** — this requires an actual registered business (KRA PIN, business registration documents). Safaricom reviews this; it's not instant.
2. Once approved, you get a production Consumer Key/Secret, your real shortcode, and your real passkey.
3. Update the same environment variables with `MPESA_ENV=production` and the production values.

## 2. SMS (Africa's Talking)

1. Go to https://africastalking.com → **Sign Up** (free sandbox app available immediately, no business verification needed to start).
2. Dashboard → **Sandbox** app → copy your **Username** (literally `sandbox` for the test app) and generate an **API Key**.
3. On Render, `yourplug-api` → Environment:
   ```
   AT_ENV=sandbox
   AT_USERNAME=sandbox
   AT_API_KEY=<your generated key>
   ```
4. Sandbox SMS only delivers to numbers you've added as a simulator recipient in the AT dashboard (Sandbox → Settings → add a test number) — this is Africa's Talking's own limitation, not this codebase.
5. **To send real SMS to any number:** apply for a production app in the AT dashboard, buy credits, get your live API key/username, and switch `AT_ENV=production`.

## 3. Email (any SMTP provider)

Simplest to start: a free transactional email account.

**Option A — Gmail (fastest to test, fine for low volume):**
1. Turn on 2-Step Verification on a Gmail account.
2. Create an **App Password** at https://myaccount.google.com/apppasswords.
3. Set on Render:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=youraddress@gmail.com
   SMTP_PASS=<the 16-character app password>
   SMTP_FROM="YourPlug Management <youraddress@gmail.com>"
   ```

**Option B — a real transactional provider (recommended for production volume):** Resend, SendGrid, Mailgun, or Postmark. Each gives you SMTP host/port/user/password after you verify a sending domain — plug those into the same four `SMTP_*` variables, no code changes needed.

## After setting any of these

Environment variable changes on a **Web Service** (like `yourplug-api`) trigger an automatic redeploy on Render — just save and wait for it to go Live again. No code change needed on your end for any of this; the integration code already reads these variables and falls back to logging (safely, without crashing) if a variable is missing.

## Applying the code changes

Copy these files into your local project at the same paths (create new ones, overwrite existing ones), then `git add . && git commit -m "Add M-Pesa, SMS, and email integrations" && git push`:

```
backend/prisma/schema.prisma          (updated — Payment model now tracks M-Pesa fields)
backend/src/integrations/mpesa.ts     (new)
backend/src/integrations/sms.ts       (new)
backend/src/integrations/email.ts     (new)
backend/src/utils/notify.ts           (new)
backend/src/routes/payments.ts        (new)
backend/src/routes/auth.ts            (updated — sends real verification codes)
backend/src/routes/requests.ts        (updated — sends real status-change notifications)
backend/src/index.ts                  (updated — mounts the payments router)
backend/package.json                  (updated — adds nodemailer)
backend/.env.example                  (updated — documents the new variables)
frontend/src/lib/api.js               (updated — adds initiateMpesa/mpesaStatus)
frontend/src/App.jsx                  (updated — real Payments panel with M-Pesa STK push)
```

Because your `docker-entrypoint.sh` runs `prisma db push` on every boot, the new `Payment` columns will be added to your existing Render Postgres database automatically on the next deploy — no manual migration step needed.
