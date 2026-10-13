-- Like sur un élément (style Hinge) + commentaire optionnel
alter table likes add column if not exists liked_on text;
alter table likes add column if not exists note text;

-- Events filtrables par univers NAYORA
alter table events add column if not exists universe text;

-- Check-in RDV (partage optionnel lieu/heure)
alter table meetings add column if not exists checkin_note text;
alter table meetings add column if not exists checkin_at timestamptz;
