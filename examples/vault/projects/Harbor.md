---
type: project
summary: Booking and payments app for small studios, the company's only product
status: beta
---

# Harbor

Harbor lets small studios (yoga, pottery, music lessons) take bookings and payments without a front desk. Built by [[Maya Chen]] and [[Leo Park]], with design by [[Priya Nair]].

## Status

Private beta with 14 studios. Public launch planned in the [[Launch Plan]].

## Stack

- Next.js on the web, a React Native app for studio owners
- Node.js API with Postgres (see [[Use Postgres]])
- Payments through a card processor, with [[Idempotency Keys]] on every charge

## Open questions

- Should studios pay monthly or per booking? See [[Pricing]].
