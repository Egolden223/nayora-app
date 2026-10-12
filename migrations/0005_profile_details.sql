alter table profiles add column if not exists height_cm integer;
alter table profiles add column if not exists weight_kg integer;
alter table profiles add column if not exists profession text;
alter table profiles add column if not exists languages text[] not null default '{}';
