---
type: decision
summary: Chose Postgres over a document database for bookings, decided on 2026-06-12
date: 2026-06-12
---

# Use Postgres

**Decision:** bookings, payments and studios live in Postgres.

**Why:** bookings need transactions across the schedule and the payment, and overlapping slots are easier to prevent with constraints than in application code.

**Decided by:** [[Leo Park]], with [[Maya Chen]].
