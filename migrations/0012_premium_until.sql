-- Prestige : date de fin d'abonnement (jours restants côté client)
alter table profiles
  add column if not exists premium_until timestamptz;

comment on column profiles.premium_until is 'Fin de l''abonnement Prestige. Null + is_premium = legacy/permanent.';
