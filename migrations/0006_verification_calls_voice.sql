alter table profiles add column if not exists selfie_url text;
alter table profiles add column if not exists love_language text;
alter table profiles add column if not exists weekend_style text;
alter table profiles add column if not exists emergency_name text;
alter table profiles add column if not exists emergency_phone text;
alter table messages add column if not exists kind text not null default 'text';
alter table messages add column if not exists audio_url text;
create table if not exists call_requests (
  id            serial primary key,
  match_id      integer not null references matches(id) on delete cascade,
  requester_id  text not null,
  status        text not null default 'pending',
  room          text not null,
  created_at    timestamptz not null default now()
);
create index if not exists call_requests_match_id_idx on call_requests (match_id);
