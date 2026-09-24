# Runtime hardening production runbook

## Canonical hosts

Run from outside Vercel after every domain change:

```bash
for host in www.cultcodex.me cultcodex.xyz www.cultcodex.xyz; do
  curl --silent --show-error --head --max-redirs 0 "https://$host/episodes/example?from=hardening-check"
done
```

Each response must be a single `308` with:

```text
Location: https://cultcodex.me/episodes/example?from=hardening-check
```

A `307`, multiple hops, a missing path/query, or a successful HTML response is a
failure. Configure the redirect at the Vercel domain edge: that layer may answer
before the Next.js proxy.

## PostgreSQL TLS

Production startup normalizes every accepted connection URL to
`sslmode=verify-full` and rejects `disable` and `allow`. After deployment:

1. Exercise a database-backed health/read route.
2. Confirm there are no certificate hostname or trust-chain errors.
3. Confirm the configured database hostname is the certificate hostname, not an
   IP address or an alias absent from the certificate.
4. Do not weaken verification to restore connectivity; correct the hostname or
   CA chain.

## Forwarded client identity

In a temporary production diagnostic, record only whether each header exists and
whether it parses as an IP; never log the IP value. Verify that Vercel supplies
`x-vercel-forwarded-for` and that sending a client-controlled header does not
replace the edge-authored value. Remove the diagnostic after verification.

Unidentifiable callers intentionally share `ip:unknown`, a fail-closed bucket.
Direct/self-hosted deployments must strip client-supplied `x-forwarded-for` and
`x-real-ip` before requests reach the app.

## Metrics and alert thresholds

The runtime emits structured JSON events:

- `{"metric":"rate_limit","event":"denied",...}`
- `{"metric":"rate_limit","event":"store_error",...}`
- `{"metric":"youtube_player_unavailable","event":"client_report",...}`

Create production alerts for:

| Signal | Initial alert |
| --- | --- |
| Shared limiter store errors | Any event for 5 minutes |
| Limiter query duration | p95 above 250 ms for 10 minutes |
| 429 responses | More than 5× the seven-day baseline |
| Unknown client bucket | Any sustained traffic after edge verification |
| Player-unavailable reports | More than 20 reports/video/hour or 3× baseline |
| RateLimitBucket growth | More than 100,000 rows or uninterrupted daily growth |

Review thresholds after seven days of normal traffic. Player reports are
untrusted telemetry; only an authenticated administrative workflow may change an
Episode status.

## Database checks

```sql
SELECT count(*) AS bucket_count,
       count(*) FILTER (WHERE "resetAt" < now() - interval '1 day') AS stale_count
FROM "RateLimitBucket";

EXPLAIN (ANALYZE, BUFFERS)
DELETE FROM "RateLimitBucket"
WHERE "resetAt" < now() - interval '1 day';
```

Run the destructive `EXPLAIN ANALYZE DELETE` only in a test database. In
production, inspect the equivalent plan inside a transaction that is rolled back.
