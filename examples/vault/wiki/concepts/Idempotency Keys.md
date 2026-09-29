---
type: concept
summary: Why every charge carries a unique key, so a retried request never charges twice
---

# Idempotency Keys

A client sends a unique key with each request that has side effects, such as a charge. If the same key arrives again, the server returns the first result instead of doing the work twice.

In [[Harbor]], the booking ID is the key for its charge. This is what makes [[Webhook Retries]] safe.
