-- Identité légale privée + pseudo public.
alter table profiles add column if not exists legal_first_name text;
alter table profiles add column if not exists legal_last_name text;
alter table profiles add column if not exists birth_date date;
alter table profiles add column if not exists birth_place text;
