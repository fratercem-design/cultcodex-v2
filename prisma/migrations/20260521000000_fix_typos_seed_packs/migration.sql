-- Fix known episode title/description typos surfaced in site audit.
-- UPDATE is conditional on exact match so applying twice is a no-op.

UPDATE "Episode"
SET title = 'Truth Is Fierce — Curry Panel'
WHERE title = 'truth is fierce curry';

UPDATE "Episode"
SET title = 'Party Continues — Open Panel'
WHERE title = 'Party Continues Ooen Panel';

-- Normalise any leftover lowercase/run-on variants (safe: only matches exact string)
UPDATE "Episode"
SET title = regexp_replace(title, '  +', ' ', 'g')
WHERE title ~ '  +';

-- ─── Seed initial card packs ─────────────────────────────────────────────────
-- ON CONFLICT DO NOTHING makes this idempotent; re-running is safe.

-- "price" is a legacy INTEGER NOT NULL column from the original CardPack schema
-- predating the signal-credits "cost" column. Mirror cost value for consistency.
INSERT INTO "CardPack" (
  id, slug, name, description,
  price, cost, "cardCount", "isAvailable", "sortOrder",
  "weightStatic", "weightSignal", "weightTransmission", "weightAnomaly",
  "weightOracle", "weightLegendary", "weightMythic", "weightForbidden",
  "artTheme", "createdAt", "updatedAt"
) VALUES
  (
    'pack_static_transmission',
    'static-transmission',
    'Static Transmission',
    'Low-noise entry pack. Mostly foundational Signal and Static cards — the bedrock of the archive.',
    75, 75, 3, true, 10,
    55, 30, 10, 4,
    1, 0, 0, 0,
    'terminal',
    NOW(), NOW()
  ),
  (
    'pack_occult_signal',
    'occult-signal',
    'Occult Signal',
    'Deeper into the archive. Higher Signal and Transmission weight — rare patterns begin to surface.',
    150, 150, 3, true, 20,
    35, 35, 20, 7,
    2.5, 0.5, 0, 0,
    'occult',
    NOW(), NOW()
  ),
  (
    'pack_oracles_cache',
    'oracles-cache',
    'Oracle''s Cache',
    'From the deepest strata. Anomaly and Oracle cards emerge. Foil probability tripled.',
    400, 400, 5, true, 30,
    20, 28, 22, 16,
    8, 3.5, 2, 0.5,
    'chaos',
    NOW(), NOW()
  )
ON CONFLICT (slug) DO NOTHING;
