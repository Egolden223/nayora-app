alter table messages add column if not exists flagged boolean not null default false;
alter table profiles add column if not exists referral_code text unique;
alter table profiles add column if not exists referred_by text;
create index if not exists profiles_referred_by_idx on profiles (referred_by);
alter table profiles add column if not exists featured_ok boolean not null default false;
alter table profiles add column if not exists reply_total integer not null default 0;
alter table profiles add column if not exists reply_within_day integer not null default 0;
create table if not exists events (
  id           serial primary key,
  title        text not null,
  description  text not null default '',
  city         text not null,
  country      text not null,
  starts_at    timestamptz not null,
  capacity     integer,
  created_by   text not null,
  created_at   timestamptz not null default now()
);
create index if not exists events_starts_at_idx on events (starts_at);
create table if not exists event_rsvps (
  event_id  integer not null references events(id) on delete cascade,
  user_id   text not null,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
create table if not exists curated_suggestions (
  id                serial primary key,
  user_id           text not null,
  suggested_user_id text not null,
  note              text,
  created_by        text not null,
  dismissed         boolean not null default false,
  created_at        timestamptz not null default now()
);
create index if not exists curated_suggestions_user_id_idx on curated_suggestions (user_id);
