-- Vecais process pēc 0010 migrācijas vēl dažas minūtes turpināja zemes pilno kārtu ar ievietošanas laiku "tagad".
UPDATE "listings" SET "created_at" = TIMESTAMPTZ '2026-11-06 12:00:00+00'
WHERE "source" = 'ss.com' AND "property_type" = 'Zeme'
  AND "created_at" BETWEEN TIMESTAMPTZ '2026-11-07 14:50:00+00' AND TIMESTAMPTZ '2026-11-07 15:06:00+00';
