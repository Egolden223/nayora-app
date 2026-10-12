-- Champs de fiche enrichis (tous optionnels — seule la photo est obligatoire).
alter table profiles add column if not exists height_cm integer;
alter table profiles add column if not exists weight_kg integer;
alter table profiles add column if not exists profession text;
-- Langues parlées, en codes ISO 639-1 (ex. {fr,en,ar}) — permet un matching
-- pertinent maintenant que l'app s'adresse à tous les pays du monde.
alter table profiles add column if not exists languages text[] not null default '{}';
