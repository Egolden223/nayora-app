-- Report penalties, warnings, escalation
alter table profiles add column if not exists visibility_penalty integer not null default 0;
alter table profiles add column if not exists report_warning_tier integer not null default 0;

alter table reports add column if not exists escalated boolean not null default false;

create table if not exists user_alerts (
  id serial primary key,
  user_id text not null,
  kind text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists user_alerts_user_idx on user_alerts (user_id, read, created_at desc);
create index if not exists reports_escalated_idx on reports (escalated) where escalated = true;
