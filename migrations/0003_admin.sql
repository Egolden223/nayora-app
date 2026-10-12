-- Rôles internes (modération) + suivi des signalements.
alter table profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'moderator', 'admin'));
create index if not exists profiles_role_idx on profiles (role) where role <> 'user';
alter table profiles add column if not exists suspended boolean not null default false;
alter table profiles add column if not exists suspended_reason text;
alter table reports
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'dismissed'));
alter table reports add column if not exists resolved_by text;
alter table reports add column if not exists resolved_at timestamptz;
create index if not exists reports_status_idx on reports (status);
