# Resend Email Integration Setup

Το Ampassador χρησιμοποιεί το **Resend** για να στέλνει αυτόματα Daily AI Summary emails στους δικηγόρους.

## 🚀 Quick Setup

### 1. Δημιουργία Resend Account

1. Πηγαίνετε στο [Resend](https://resend.com/)
2. Δημιουργήστε έναν νέο λογαριασμό (free tier: 3,000 emails/month)
3. Verify your domain (για production) ή χρησιμοποιήστε το default domain για testing

### 2. Environment Variables

Προσθέστε αυτές τις μεταβλητές στο Vercel dashboard (ή στο `.env.local` για local development):

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Ampassador <noreply@yourdomain.com>  # Optional, default: Ampassador <noreply@ampassador.com>
CRON_SECRET=your_random_secret_here  # For protecting the cron endpoint
```

**Πού να βρω το API Key;**
- Resend Dashboard → API Keys → Create API Key
- Copy το key (ξεκινάει με `re_`)

**CRON_SECRET:**
- Generate ένα random string (π.χ. `openssl rand -hex 32`)
- Χρησιμοποιείται για να προστατεύσει το `/api/cron/daily-summary` endpoint

### 3. Domain Verification (Production)

Για production, πρέπει να verify το domain σου:

1. Resend Dashboard → Domains → Add Domain
2. Προσθέστε τα DNS records που σας δίνει το Resend
3. Wait for verification (συνήθως λίγα λεπτά)
4. Χρησιμοποιήστε το verified domain στο `RESEND_FROM_EMAIL`

**Για Testing:**
- Μπορείτε να χρησιμοποιήσετε το default Resend domain: `onboarding@resend.dev`
- Ή το verified domain σας: `noreply@yourdomain.com`

## 📧 Daily AI Summary Email

### Schedule

Το email στέλνεται **κάθε πρωί στις 08:00 UTC** (10:00 EET / 11:00 EEST).

### Περιεχόμενο Email

Το email περιλαμβάνει:

1. **🔥 Νέα Leads** (last 24h)
   - Όνομα πελάτη
   - AI Summary
   - Priority Score (με color-coded badges)
   - Hot Leads highlight (score ≥ 7)

2. **⚠️ Επείγουσες Προθεσμίες** (next 48 hours)
   - Deadline title
   - Associated Matter
   - Due date

3. **📅 Προσεχείς Προθεσμίες** (next 7 days)
   - Upcoming deadlines
   - Matter information

4. **💰 Πρόσφατες Πληρωμές** (last 7 days)
   - Payment amount
   - Description
   - Total revenue

### Email Template

Το email είναι **fully responsive** και **beautifully designed** με:
- Color-coded sections (red for urgent, green for payments)
- Priority badges για leads
- Direct links στο Dashboard
- Professional Greek language

## 🔧 Technical Details

### Files

- `lib/resend.ts` - Resend client & email utilities
- `app/api/cron/daily-summary/route.ts` - Cron job & email generation
- `vercel.json` - Cron schedule configuration

### Cron Job Protection

Το cron endpoint προστατεύεται με `CRON_SECRET`:

```typescript
// Vercel automatically adds this header
Authorization: Bearer ${CRON_SECRET}
```

### Email Sending Logic

- **Sends only if there's activity**: Αν δεν υπάρχουν νέα leads, deadlines, ή payments, το email **δεν** στέλνεται
- **One email per firm**: Στέλνεται στον πρώτο Attorney user του firm
- **Error handling**: Αν αποτύχει το email, logγεται αλλά δεν σπάει το cron job

### Vercel Cron Configuration

Το `vercel.json` ορίζει:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-summary",
      "schedule": "0 8 * * *"  // 08:00 UTC daily
    }
  ]
}
```

**Cron Schedule Format:**
- `0 8 * * *` = Every day at 08:00 UTC
- `0 9 * * 1-5` = Weekdays at 09:00 UTC
- `*/30 * * * *` = Every 30 minutes (for testing)

## 🧪 Testing

### Local Testing

1. **Manual trigger:**
   ```bash
   curl -X GET "http://localhost:3000/api/cron/daily-summary" \
     -H "Authorization: Bearer your_cron_secret"
   ```

2. **Change schedule temporarily:**
   - Edit `vercel.json` → `schedule: "*/5 * * * *"` (every 5 minutes)
   - Deploy to Vercel
   - Wait for cron to trigger
   - Revert back to `0 8 * * *`

### Production Testing

1. **Vercel Dashboard → Cron Jobs**
   - Βλέπετε όλα τα scheduled cron jobs
   - Μπορείτε να trigger manually για testing

2. **Check logs:**
   - Vercel Dashboard → Functions → `/api/cron/daily-summary`
   - Βλέπετε logs για κάθε execution

## 💰 Pricing

- **Free Tier**: 3,000 emails/month
- **Pro Tier**: $20/month για 50,000 emails
- **Perfect for MVP**: Το free tier είναι αρκετό για αρχικό testing

## 🔒 Security

- **Never commit** `RESEND_API_KEY` ή `CRON_SECRET` στο git
- Χρησιμοποιήστε **Vercel Environment Variables** για production
- Το `CRON_SECRET` πρέπει να είναι **unique** και **random**

## 📚 Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend Node.js SDK](https://resend.com/docs/send-with-nodejs)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Cron Schedule Generator](https://crontab.guru/)

## 🎯 Next Steps

1. **Setup Resend account** και verify domain
2. **Add environment variables** στο Vercel
3. **Deploy** το project
4. **Test** το cron job (manual trigger)
5. **Monitor** τα emails και logs

---

**Pro Tip:** Για να δοκιμάσετε το email template χωρίς να περιμένετε το cron, μπορείτε να δημιουργήσετε ένα test endpoint που καλεί την ίδια λογική!

