---
type: concept
summary: How Harbor retries failed payment webhooks with backoff, and why retries must be idempotent
---

# Webhook Retries

The payment processor retries a webhook until it gets a 2xx response, for up to three days. Harbor answers fast and processes the event in a queue.

- Retries use exponential backoff: 1, 5, 25 and 125 minutes.
- Handlers are safe to run twice thanks to [[Idempotency Keys]].
