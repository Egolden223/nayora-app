-- NAYORA (ex-Alliance Sereine / Aura) — schéma de connexions. Nom de fichier conservé : le runner suit les migrations par nom.

create table if not exists profiles (
  id                   serial primary key,
  user_id              text not null unique,
  first_name           text not null,
  age_band             text not null,
  gender               text not null,
  looking_for          text not null,
  city                 text not null default '',
  country              text not null default 'CI',
  family_status        text not null default 'celibataire',
  intention            text not null default 'mariage',
  pro_domain           text,
  bio                  text not null default '',
  phone                text,
  is_premium           boolean not null default false,
  bonus_chats          integer not null default 0,
  verification_status  text not null default 'en_revue',
  reliability_score    integer not null default 100,
  charter_accepted     boolean not null default false,
  is_demo              boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists profiles_country_idx on profiles (country);
create index if not exists profiles_intention_idx on profiles (intention);

create table if not exists likes (
  id          serial primary key,
  liker_id    text not null,
  liked_id    text not null,
  created_at  timestamptz not null default now(),
  unique (liker_id, liked_id)
);
create index if not exists likes_liked_id_idx on likes (liked_id);

create table if not exists passes (
  id          serial primary key,
  passer_id   text not null,
  passed_id   text not null,
  created_at  timestamptz not null default now(),
  unique (passer_id, passed_id)
);

create table if not exists matches (
  id          serial primary key,
  user_a      text not null,
  user_b      text not null,
  created_at  timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a < user_b)
);
create index if not exists matches_user_a_idx on matches (user_a);
create index if not exists matches_user_b_idx on matches (user_b);

create table if not exists messages (
  id          serial primary key,
  match_id    integer not null references matches(id) on delete cascade,
  sender_id   text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists messages_match_id_idx on messages (match_id);

create table if not exists contact_requests (
  id            serial primary key,
  match_id      integer not null references matches(id) on delete cascade,
  requester_id  text not null,
  status        text not null default 'pending',
  created_at    timestamptz not null default now()
);

create table if not exists blocks (
  id          serial primary key,
  blocker_id  text not null,
  blocked_id  text not null,
  reason      text,
  created_at  timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

create table if not exists reports (
  id           serial primary key,
  reporter_id  text not null,
  reported_id  text not null,
  reason       text not null,
  created_at   timestamptz not null default now()
);

-- Demo profiles so a first visitor can live the full journey.
insert into profiles (
  user_id, first_name, age_band, gender, looking_for, city, country,
  family_status, intention, pro_domain, bio, verification_status,
  reliability_score, charter_accepted, is_demo
) values
(
  'demo-elena', 'Elena', '25-29', 'femme', 'homme', 'Bamako', 'ML',
  'celibataire', 'mariage', null,
  'Architecte de formation, curieuse de tout. Je cherche quelqu''un de vrai pour partager de bons cafés et de longues conversations.',
  'verifie', 100, true, true
),
(
  'demo-marc', 'Marc', '30-34', 'homme', 'femme', 'Dakar', 'SN',
  'celibataire', 'professionnel', 'tech',
  'Entrepreneur dans la tech. Passionné de musique, de voyages et de week-ends improvisés. En quête de sincérité — aussi bien en affaires qu''en amour.',
  'verifie', 98, true, true
),
(
  'demo-amina', 'Amina', '25-29', 'femme', 'homme', 'Abidjan', 'CI',
  'celibataire', 'mariage', 'sante',
  'Médecin et amoureuse des grands espaces. Je crois aux rencontres qui font battre le cœur un peu plus fort, sans précipitation.',
  'verifie', 100, true, true
),
(
  'demo-yann', 'Yann', '35-39', 'homme', 'femme', 'Cotonou', 'BJ',
  'divorce', 'voyage', null,
  'Photographe. J''immortalise les gens et les instants. À la recherche d''une belle histoire à écrire ensemble, sur les routes et ailleurs.',
  'verifie', 96, true, true
),
(
  'demo-nadia', 'Nadia', '30-34', 'femme', 'homme', 'Ouagadougou', 'BF',
  'celibataire', 'amitie', null,
  'Professeure de lettres, éternelle rêveuse. Un bon livre, un sourire sincère, et tout devient possible.',
  'verifie', 100, true, true
),
(
  'demo-ken', 'Ken', '25-29', 'homme', 'femme', 'Lomé', 'TG',
  'celibataire', 'professionnel', 'autre',
  'Ingénieur du son. J''aime les marchés animés, la bonne cuisine et les discussions qui durent toute la nuit.',
  'verifie', 94, true, true
),
(
  'demo-lea', 'Léa', '25-29', 'femme', 'homme', 'Conakry', 'GN',
  'celibataire', 'voyage', null,
  'Designer et apprentie céramiste. Positive par nature, je cherche un partenaire pour partager mes projets fous.',
  'verifie', 99, true, true
),
(
  'demo-sofiane', 'Sofiane', '30-34', 'homme', 'femme', 'Casablanca', 'MA',
  'divorce', 'mariage', null,
  'Commerçant et passionné de sport. Loyal, simple et direct : je préfère la franchise aux détours.',
  'verifie', 97, true, true
),
(
  'demo-ines', 'Inès', '18-24', 'femme', 'tous', 'Paris', 'FR',
  'celibataire', 'amitie', null,
  'Étudiante en droit, entre deux bibliothèques. Je veux des amitiés vraies, peut-être plus si les valeurs s''alignent.',
  'verifie', 100, true, true
),
(
  'demo-ibrahim', 'Ibrahim', '35-39', 'homme', 'femme', 'Abidjan', 'CI',
  'celibataire', 'professionnel', 'finance',
  'Banquier d''affaires, weekend randonneur. Ouvert à un réseau sérieux et, si le courant passe, à une relation durable.',
  'verifie', 95, true, true
)
on conflict (user_id) do nothing;
