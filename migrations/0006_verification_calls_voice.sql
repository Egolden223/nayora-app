-- Vérification par selfie (optionnelle) : un profil ne devient "vérifié"
-- qu'après soumission d'un selfie ET validation par un modérateur.
alter table profiles add column if not exists selfie_url text;

-- Petit questionnaire de personnalité (facultatif, affiné le matching).
alter table profiles add column if not exists love_language text;
alter table profiles add column if not exists weekend_style text;

-- Contact d'urgence (facultatif) pour le bouton de sécurité en rendez-vous.
alter table profiles add column if not exists emergency_name text;
alter table profiles add column if not exists emergency_phone text;

-- Messages vocaux : un message est soit du texte, soit un audio (jamais les
-- deux) ; body garde un libellé court pour les aperçus de conversation.
alter table messages add column if not exists kind text not null default 'text';
alter table messages add column if not exists audio_url text;

-- Appels vidéo à consentement mutuel — même schéma que contact_requests :
-- une demande doit être acceptée par l'autre personne avant que quiconque
-- ne voie la salle d'appel.
create table if not exists call_requests (
  id            serial primary key,
  match_id      integer not null references matches(id) on delete cascade,
  requester_id  text not null,
  status        text not null default 'pending',
  room          text not null,
  created_at    timestamptz not null default now()
);
create index if not exists call_requests_match_id_idx on call_requests (match_id);
