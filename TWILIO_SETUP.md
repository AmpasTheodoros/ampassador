# Twilio SMS Integration Setup

Το Ampassador χρησιμοποιεί το **Twilio** για να στέλνει αυτόματα SMS με payment links στους πελάτες.

## 🚀 Quick Setup

### 1. Δημιουργία Twilio Account

1. Πηγαίνετε στο [Twilio Console](https://console.twilio.com/)
2. Δημιουργήστε έναν νέο λογαριασμό (ή συνδεθείτε)
3. Αγοράστε ένα Twilio Phone Number (ή χρησιμοποιήστε trial number για testing)

### 2. Environment Variables

Προσθέστε αυτές τις μεταβλητές στο Vercel dashboard (ή στο `.env.local` για local development):

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890  # Format: +[country code][number]
```

**Πού να βρω αυτά;**
- **Account SID & Auth Token**: Twilio Console → Account → API Credentials
- **Phone Number**: Twilio Console → Phone Numbers → Manage → Active Numbers

### 3. Phone Number Format

Το Twilio απαιτεί E.164 format:
- ✅ `+306912345678` (Greece)
- ✅ `+1234567890` (US)
- ❌ `06912345678` (θα γίνει αυτόματα `+306912345678`)
- ❌ `6912345678` (θα γίνει αυτόματα `+306912345678`)

Το `formatPhoneForSMS()` function κάνει αυτόματα τη μετατροπή.

## 📱 How It Works

### The "360" Workflow

1. **Lead Creation**: Ο πελάτης συμπληρώνει το Public Lead Form με το phone του
2. **AI Analysis**: Το AI αναλύει το Lead και δίνει priority score
3. **Quick Bill**: Ο δικηγόρος πατάει "Άμεση Πληρωμή (150€)"
4. **Auto SMS**: Το σύστημα στέλνει αυτόματα SMS στον πελάτη με το Stripe checkout link
5. **Payment**: Ο πελάτης πληρώνει μέσω του link
6. **Auto Convert**: Το Lead μετατρέπεται αυτόματα σε `CONVERTED` status

### SMS Message Template

```
Γεια σας από το δικηγορικό γραφείο [Firm Name]. 
Για την έναρξη της υπόθεσής σας ([Description]), 
παρακαλούμε ακολουθήστε το σύνδεσμο για την πληρωμή: 
[Stripe Checkout URL]
```

## 🔧 Technical Details

### Files

- `lib/twilio.ts` - Twilio client & SMS utilities
- `app/api/stripe/create-checkout/route.ts` - SMS sending logic

### API Response

Το `/api/stripe/create-checkout` endpoint επιστρέφει:

```json
{
  "success": true,
  "url": "https://checkout.stripe.com/...",
  "invoiceId": "inv_...",
  "sessionId": "cs_...",
  "smsSent": true,  // ή false αν δεν υπάρχει phone ή Twilio error
  "smsError": null  // error message αν αποτύχει
}
```

### Error Handling

- Αν το Twilio **δεν είναι configured**, το SMS απλά δεν στέλνεται (no error)
- Αν το Lead **δεν έχει phone**, το SMS δεν στέλνεται (no error)
- Αν το SMS **αποτύχει**, το error logγεται αλλά το checkout session **δημιουργείται κανονικά**

## 🧪 Testing

### Local Development

1. Χρησιμοποιήστε Twilio Trial Account (free)
2. Trial accounts μπορούν να στείλουν SMS μόνο σε verified numbers
3. Verify your number: Twilio Console → Phone Numbers → Verified Caller IDs

### Production

1. Upgrade Twilio Account (pay-as-you-go)
2. Αγοράστε phone number για το country που θέλετε
3. Set environment variables στο Vercel

## 💰 Pricing

- **Trial**: Free (μόνο verified numbers)
- **Production**: ~$0.0075 per SMS (US) / ~€0.05 per SMS (Greece)

## 🔒 Security

- **Never commit** Twilio credentials στο git
- Χρησιμοποιήστε **Vercel Environment Variables** για production
- Το `TWILIO_AUTH_TOKEN` είναι **secret** - treat it like a password

## 📚 Resources

- [Twilio SMS Documentation](https://www.twilio.com/docs/sms)
- [Twilio Node.js SDK](https://www.twilio.com/docs/libraries/node)
- [E.164 Phone Number Format](https://www.twilio.com/docs/glossary/what-e164)

