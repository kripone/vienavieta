-- ss.com sludinājumi pirmajās pilnajās kārtās tika ievietoti ar vienu un to pašu laiku pa sadaļām,
-- tāpēc "jaunākie" sākumlapā bija tikai viena sadaļa. Tiem nosakām vienādu agrāku laiku; secību vienādam
-- laikam nosaka nejaušais id, tāpēc sadaļas sajaucas. Jaunie no ātrajām kārtām paliek augšā.
UPDATE "listings" SET "created_at" = TIMESTAMPTZ '2026-11-06 12:00:00+00'
WHERE "source" = 'ss.com' AND "created_at" > TIMESTAMPTZ '2026-11-07 00:00:00+00' AND "created_at" < TIMESTAMPTZ '2026-11-07 16:00:00+00';
