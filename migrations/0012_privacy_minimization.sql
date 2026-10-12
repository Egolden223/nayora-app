-- Minimisation des données : on ne collecte plus le nom légal ni le lieu de naissance
alter table profiles drop column if exists legal_first_name;
alter table profiles drop column if exists legal_last_name;
alter table profiles drop column if exists birth_place;
