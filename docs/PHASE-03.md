# Phase 03 — Commerce Core, Applications & Manual Payments

## Product Architecture

Products are independent of Courses but can be linked via `linkedCourseId`. A product has:
- `type` — what it is (COURSE, MENTORSHIP, CONSULTATION, etc.)
- `purchaseMode` — how it can be acquired (DIRECT_PURCHASE, APPLICATION_REQUIRED, etc.)
- `price` — stored as integer minor units (249900 = 2499.00 TRY). **Never store as float.**
- `ProductGrant[]` — what access is granted when the product is paid for
- `ProductInclusion[]` — marketing list of what's included (not access-controlling)
- `ProductTranslation[]` — TR/EN name, description, SEO fields

## ProductGrant → Entitlement Flow

When a payment is approved, `materializeProductGrants(orderId, actorId)` is called:
1. Find the Order and its items → products → grants
2. For each `ProductGrant` with a `resourceId`, check if an `Entitlement` already exists with `sourceReferenceId = orderId` (idempotency check)
3. If not, create the `Entitlement` (sourceType = ORDER, sourceReferenceId = orderId)
4. Update Order status to PAID

This is **idempotent** — safe to call multiple times. It runs inside a DB transaction.

## Application Lifecycle

```
SUBMITTED → UNDER_REVIEW → APPROVED → (user can now purchase)
                          → REJECTED
                          → WAITLISTED
```

Application approval does NOT grant access. It only allows the user to proceed to checkout (for APPLICATION_REQUIRED_BEFORE_PURCHASE products).

## Order Lifecycle

```
(createOrder) → PENDING_PAYMENT
(reportPayment) → PAYMENT_REVIEW
(adminApprovePayment) → PAID  ← materializeProductGrants() called here
(adminRejectPayment) → PENDING_PAYMENT (reverts)
```

Free products skip the payment flow: enrollFree() creates an order that starts as PAID.

## Payment Lifecycle

```
PENDING → REPORTED (user says they paid)
REPORTED → APPROVED (admin confirms) ← triggers materializeProductGrants
REPORTED → REJECTED (admin rejects) ← order reverts to PENDING_PAYMENT
```

## Manual Bank Transfer Flow

1. User goes to `/[locale]/checkout/[slug]`
2. Server checks eligibility (getProductAccessState) — no client-trusted price/role
3. User clicks "Havale/EFT" → createOrder() server action is called (price from DB)
4. Order reference (FA-YYYY-XXXXXX) is shown — user must include it in bank transfer description
5. User fills in receipt number (optional), clicks "Ödemeyi Yaptım" → reportPayment()
6. Order status → PAYMENT_REVIEW
7. Admin sees payment in /admin/payments → approves → materializeProductGrants() → user gets access

## Idempotency Rules

- `createOrder()`: checks for existing pending order before creating — returns existing
- `enrollFree()`: creates order directly as PAID — no duplicate check (could create multiple; TODO: add dedup)
- `materializeProductGrants()`: checks `sourceReferenceId = orderId` before creating each Entitlement
- `adminApprovePayment()`: early-return if payment.status === "APPROVED"

## Security Rules

- **Price is always read server-side** — `createOrder()` fetches product from DB, never trusts client
- **Role is always read server-side** — all admin actions use `requireAdminUser()` which re-fetches from DB
- **Application eligibility is server-side** — checkout page calls `getProductAccessState()` server-side
- **ProductGrant materialization is transactional** — uses `prisma.$transaction()`
- **Bank details come from SiteSettings** — admin controls them, never hardcoded

## What is Intentionally Out of Scope

- Online payment gateways (iyzico, PayTR, Stripe) — not in this phase
- Zoom/calendar integration for consultation sessions
- Refund workflow (order status REFUNDED exists but no UI)
- Email notifications for order/payment/application events
- PDF invoice generation
- Coupon/discount codes
- Multi-currency checkout UI (currency stored but only TRY shown)
