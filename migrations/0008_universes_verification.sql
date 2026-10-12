-- NAYORA : multi-univers + vérification d'identité (niveau 3).
alter table profiles add column if not exists universes text not null default '';
update profiles set universes = intention where universes = '';
create index if not exists profiles_universes_idx on profiles (universes);
alter table profiles add column if not exists phone_verified boolean not null default false;
alter table profiles add column if not exists id_document_url text;
alter table profiles add column if not exists id_document_status text not null default 'non_soumis';
update profiles set universes = 'professionnel,projets' where user_id = 'demo-marc' and universes = 'professionnel';
