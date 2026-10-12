-- NAYORA : services « humains et de confiance » — photos floutées jusqu'au match,
-- rencontres planifiées (visio pro 30 min, mentorat, échange projet d'1 h) avec avis,
-- cercles de 4 à 6 personnes, accompagnement humain (Prestige), avis de voyage.

-- 1) Photos floutées jusqu'au match -----------------------------------------
-- `photo_blur_url` est une miniature floutée générée dans le navigateur ; tant que
-- `blur_photos` est vrai et qu'il n'y a pas de match, le serveur n'envoie QUE celle-ci.
alter table profiles add column if not exists photo_blur_url text;
alter table profiles add column if not exists blur_photos boolean not null default false;

-- 2) Réputation (agrégats mis à jour à chaque avis) -------------------------
alter table profiles add column if not exists meet_count integer not null default 0;
alter table profiles add column if not exists meet_rating_sum integer not null default 0;
alter table profiles add column if not exists trip_review_count integer not null default 0;
alter table profiles add column if not exists trip_rating_sum integer not null default 0;

-- 3) Pages « impact » (max. 5 par membre, validées côté serveur) ------------
alter table profiles add column if not exists impact_stories jsonb not null default '[]'::jsonb;

-- 4) Rencontres planifiées entre deux membres matchés ------------------------
create table if not exists meetings (
  id           serial primary key,
  match_id     integer not null references matches(id) on delete cascade,
  proposer_id  text not null,
  kind         text not null,               -- pro_visio | mentorat | projet_1h | voyage_visio
  starts_at    timestamptz not null,
  duration_min integer not null default 30,
  status       text not null default 'proposed', -- proposed | confirmed | declined | cancelled
  room         text not null,
  created_at   timestamptz not null default now()
);
create index if not exists meetings_match_idx on meetings (match_id, starts_at);

create table if not exists meeting_feedback (
  meeting_id integer not null references meetings(id) on delete cascade,
  user_id    text not null,
  rating     smallint not null check (rating between 1 and 5),
  again      boolean not null default false,
  note       text,
  created_at timestamptz not null default now(),
  primary key (meeting_id, user_id)
);

-- 5) Cercles de 4 à 6 personnes, composés automatiquement --------------------
create table if not exists circle_signups (
  id         serial primary key,
  user_id    text not null,
  city       text not null,
  country    text not null,
  women_only boolean not null default false,
  status     text not null default 'waiting', -- waiting | placed | cancelled
  created_at timestamptz not null default now()
);
create index if not exists circle_signups_status_idx on circle_signups (status, country, city);
create unique index if not exists circle_signups_one_waiting on circle_signups (user_id) where status = 'waiting';

create table if not exists circles (
  id         serial primary key,
  title      text not null,
  city       text not null,
  country    text not null,
  women_only boolean not null default false,
  starts_at  timestamptz not null,
  reveal_at  timestamptz not null,           -- le lieu n'est visible qu'à partir de cette date
  venue      text,                           -- saisi par l'équipe, révélé à reveal_at
  created_by text not null,
  created_at timestamptz not null default now()
);
create index if not exists circles_starts_idx on circles (starts_at);

create table if not exists circle_members (
  circle_id integer not null references circles(id) on delete cascade,
  user_id   text not null,
  primary key (circle_id, user_id)
);
create index if not exists circle_members_user_idx on circle_members (user_id);

-- 6) Accompagnement humain (Prestige) : entremise et préparation au mariage --
create table if not exists matchmaker_requests (
  id         serial primary key,
  user_id    text not null,
  kind       text not null,                  -- entremise | preparation
  brief      text not null default '',
  status     text not null default 'nouvelle', -- nouvelle | en_cours | terminee
  staff_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists matchmaker_requests_status_idx on matchmaker_requests (status, created_at);

-- 7) Avis de voyage (entre membres matchés dans l'univers Travel) -------------
create table if not exists travel_reviews (
  id         serial primary key,
  author_id  text not null,
  subject_id text not null,
  role       text not null,                  -- compagnon | guide | voyageur
  rating     smallint not null check (rating between 1 and 5),
  body       text,
  created_at timestamptz not null default now(),
  unique (author_id, subject_id)
);
create index if not exists travel_reviews_subject_idx on travel_reviews (subject_id);

-- Profils de démonstration : réputation, pages « impact » et guide vérifié.
update profiles set verification_status = 'verifie' where user_id = 'demo-amina';
update profiles set trip_review_count = 4, trip_rating_sum = 19 where user_id = 'demo-amina';
update profiles set meet_count = 6, meet_rating_sum = 29,
  impact_stories = '[{"title":"Atelier code pour lycéennes","summary":"12 jeunes initiées à Python en 3 samedis, avec une association de quartier.","cause":"education"},{"title":"Mentorat de 4 développeurs juniors","summary":"Revue de code et préparation aux entretiens, en visio.","cause":"numerique"}]'::jsonb
  where user_id = 'demo-marc';
update profiles set meet_count = 3, meet_rating_sum = 14 where user_id = 'demo-ibrahim';
