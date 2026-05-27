-- Allow multiple CVs per user (drop unique constraint)
alter table cvs drop constraint if exists cvs_user_id_key;

-- Add is_default flag
alter table cvs add column if not exists is_default boolean not null default false;

-- Set existing CVs as default (they were the only one per user anyway)
update cvs set is_default = true where is_default = false;
