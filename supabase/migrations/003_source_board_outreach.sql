-- Track which job board each found job came from
alter table applications add column if not exists source_board text;

-- contacts was missing created_at in the initial migration
alter table contacts add column if not exists created_at timestamptz not null default now();

-- Extend documents.type to include outreach emails
alter table documents drop constraint if exists documents_type_check;
alter table documents add constraint documents_type_check
  check (type in ('cover_letter', 'tailored_cv', 'outreach_email'));
