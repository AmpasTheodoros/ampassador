# Clerk Setup Guide

## 1. Environment Variables

Add these to your `.env.local`:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Database (Neon)
DATABASE_URL="postgresql://..."

# Optional: Webhook secret for lead intake
WEBHOOK_SECRET=your-secure-secret-here
```

## 2. Clerk Dashboard Setup

### Create Organization

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application
3. Copy your API keys to `.env.local`

### Enable Organizations

1. In Clerk Dashboard, go to **Organizations**
2. Enable Organizations feature
3. Configure organization settings:
   - **Slug**: Optional, for organization URLs
   - **Max allowed memberships**: Set per your pricing tier
   - **Roles**: Default roles (admin, member) are fine, you can customize later

### Setup Webhooks

1. Go to **Webhooks** in Clerk Dashboard
2. Click **Add Endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/clerk`
4. Subscribe to these events:
   - `organization.created`
   - `organization.updated`
   - `organizationMembership.created`
   - `organizationMembership.updated`
5. Copy the **Signing Secret** to `CLERK_WEBHOOK_SECRET` in `.env.local`

## 3. Database Migration

After setting up Clerk, run:

```bash
# Generate Prisma Client with new schema
npm run db:generate

# Push schema to database (or use migrate for production)
npm run db:push
```

## 4. Test Authentication

1. Start your dev server: `npm run dev`
2. Navigate to a protected route (e.g., `/en/dashboard`)
3. You should be redirected to Clerk sign-in
4. After signing in, you'll need to create/select an organization

## 5. Organization Switcher (Optional)

Clerk provides a built-in organization switcher component. You can add it to your dashboard:

```tsx
import { OrganizationSwitcher } from "@clerk/nextjs";

<OrganizationSwitcher 
  hidePersonal={true}
  appearance={{
    elements: {
      organizationSwitcherTrigger: "py-2 px-4"
    }
  }}
/>
```

## 6. Billing Integration (Future)

For SaaS billing (charging the law firm for your platform):

1. Enable **Clerk Billing** in your Clerk Dashboard
2. Configure pricing tiers
3. The billing will be handled automatically based on organization membership

For Legal billing (clients paying the law firm):
- This will use **Stripe Connect** (separate setup)
- The `stripeConnectAccountId` field in the Firm model will store the Stripe account

## Troubleshooting

### "Unauthorized: User must be in an organization"

- User needs to create or join an organization
- Create a route at `/[locale]/select-org` for organization selection
- Or use Clerk's built-in organization switcher

### Webhook not syncing organizations

- Check webhook secret matches in Clerk Dashboard and `.env.local`
- Verify webhook endpoint is publicly accessible
- Check server logs for webhook processing errors

### Prisma errors about missing models

- Run `npm run db:generate` after schema changes
- Make sure you've run `npm run db:push` or migrations

