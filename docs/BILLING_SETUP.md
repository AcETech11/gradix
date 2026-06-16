# Gradix Billing Setup

## Pricing

- Starter: NGN 60,000 per term, up to 300 students.
- Standard: NGN 90,000 per term, up to 700 students.
- Premium: NGN 150,000+ per term, up to 1,500+ students.

## Setup Fee

- Launch setup: NGN 50,000.
- Normal setup later: NGN 100,000+.

## First School Offer

- NGN 50,000 setup.
- NGN 60,000 per term.

## Manual Activation Process

1. School pays by bank transfer.
2. Gradix owner confirms payment.
3. Gradix owner updates the school's subscription status, plan, expiry date, and student limit.
4. School continues using Gradix.

## Safe SQL Example

```sql
update public.schools
set subscription_status = 'active',
    subscription_plan = 'standard',
    subscription_started_at = now(),
    subscription_expires_at = now() + interval '4 months',
    student_limit = 700,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'billing_note', 'Manual transfer confirmed',
      'billing_status', 'active'
    ),
    updated_at = now()
where id = 'replace-with-school-id';
```

Use `trialing`, `active`, `past_due`, `paused`, or `canceled` when the existing Supabase enum requires those values. The application maps `paused` and `canceled` to suspended, and maps expired dates or `past_due` to expired.

## Future TODO

- Add Paystack automation.
- Add invoice receipts.
- Add subscription event audit UI.
