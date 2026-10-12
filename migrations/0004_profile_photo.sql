-- Photo de profil (obligatoire pour les vrais comptes — appliqué côté
-- application dans upsertProfile ; nullable ici pour ne pas casser les
-- profils de démo existants, qui n'en ont pas besoin).
alter table profiles add column if not exists photo_url text;
