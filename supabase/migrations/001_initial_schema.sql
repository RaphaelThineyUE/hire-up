-- Enable uuid extension
create extension if not exists "uuid-ossp";

-- ── applications ──────────────────────────────────────────────────────────────
create table applications (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  company          text not null,
  role             text not null,
  url              text,
  job_description  text,
  match_score_value integer check (match_score_value between 0 and 100),
  match_score      text generated always as (
    case
      when match_score_value is null then null
      when match_score_value < 40    then 'low'
      when match_score_value < 70    then 'medium'
      else                                'high'
    end
  ) stored,
  status           text not null default 'applied'
                   check (status in ('found','applied','interviewing','offer','rejected')),
  notes            text,
  salary_range     text,
  location         text,
  remote_type      text check (remote_type in ('remote','hybrid','onsite')),
  contract_type    text check (contract_type in ('full-time','part-time','contract','internship')),
  applied_at       timestamptz not null default now(),
  posted_at        date,
  created_at       timestamptz not null default now()
);

-- ── contacts ──────────────────────────────────────────────────────────────────
create table contacts (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  application_id   uuid not null references applications(id) on delete cascade,
  name             text,
  email            text,
  phone            text,
  role             text
);

-- ── cvs ───────────────────────────────────────────────────────────────────────
create table cvs (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null unique references auth.users(id) on delete cascade,
  filename         text not null,
  storage_path     text not null,
  extracted_text   text,
  word_count       integer,
  created_at       timestamptz not null default now()
);

-- ── documents ─────────────────────────────────────────────────────────────────
create table documents (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  application_id   uuid not null references applications(id) on delete cascade,
  type             text not null check (type in ('cover_letter','tailored_cv')),
  filename         text not null,
  storage_path     text not null,
  content_markdown text,
  created_at       timestamptz not null default now()
);

-- ── user_settings ─────────────────────────────────────────────────────────────
create table user_settings (
  user_id                  uuid primary key references auth.users(id) on delete cascade,
  ai_provider              text not null default 'ollama'
                           check (ai_provider in ('ollama','claude','openai')),
  ai_base_url              text not null default 'http://127.0.0.1:1234/v1',
  ai_model                 text not null default '',
  claude_api_key_enc       text not null default '',
  openai_api_key_enc       text not null default '',
  jsearch_api_key_enc      text not null default '',
  find_jobs_candidates     integer not null default 25,
  find_jobs_save_count     integer not null default 10,
  jsearch_query_override   text not null default '',
  jsearch_country          text not null default 'us',
  jsearch_language         text not null default '',
  jsearch_location         text not null default '',
  jsearch_date_posted      text not null default 'month',
  jsearch_work_from_home   boolean not null default false,
  jsearch_employment_types text not null default '',
  jsearch_job_requirements text not null default '',
  jsearch_radius           text not null default '',
  jsearch_exclude_publishers text not null default '',
  jsearch_num_pages        text not null default '2',
  cron_enabled             boolean not null default false,
  cron_hour_utc            integer not null default 8
                           check (cron_hour_utc between 0 and 23)
);

-- ── Row-Level Security ────────────────────────────────────────────────────────
alter table applications  enable row level security;
alter table contacts      enable row level security;
alter table cvs           enable row level security;
alter table documents     enable row level security;
alter table user_settings enable row level security;

create policy "own_applications"  on applications  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_contacts"      on contacts      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_cvs"           on cvs           for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_documents"     on documents     for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_user_settings" on user_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Auto-provision user_settings on signup ────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Storage buckets ───────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('cvs', 'cvs', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
  on conflict (id) do nothing;

create policy "own_cvs_storage" on storage.objects for all
  using  (bucket_id = 'cvs' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'cvs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "own_documents_storage" on storage.objects for all
  using  (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
