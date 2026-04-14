-- MultaCheck — Initial schema (Phase 3)
-- Mirrors packages/db/src/types.ts and adds RLS, triggers, storage bucket.

-- ─────────────────────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────────
do $$ begin
  create type public.tipo_infrazione as enum (
    'velocita', 'sosta', 'ztl', 'semaforo', 'telefono', 'altro'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.livello_contestabilita as enum ('verde', 'giallo', 'rosso');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.stato_pratica as enum (
    'analisi',
    'pagamento',
    'generazione_ricorso',
    'invio_pec',
    'attesa_risposta',
    'chiusa'
  );
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: updated_at trigger
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  full_name    text,
  avatar_url   text,
  fiscal_code  text,
  phone        text,
  address      text,
  city         text,
  province     text,
  zip_code     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- verbali
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.verbali (
  id                         uuid primary key default gen_random_uuid(),
  user_id                    uuid not null references public.profiles(id) on delete cascade,

  -- Dati estratti / inseriti
  numero_verbale             text,
  data_violazione            date,
  ora_violazione             text,
  luogo                      text,
  via                        text,
  comune                     text,
  provincia                  text,
  tipo_infrazione            public.tipo_infrazione not null default 'altro',
  articolo_cds               text,
  comma                      text,
  importo                    numeric(10, 2),
  importo_ridotto            numeric(10, 2),
  punti_patente              integer,
  targa                      text,
  data_notifica              date,
  organo_accertatore         text,
  modello_apparecchio        text,
  velocita_rilevata          integer,
  velocita_consentita        integer,

  -- File e OCR
  image_path                 text,
  image_url                  text,
  ocr_raw_text               text,
  parsed_json                jsonb,

  -- Analisi
  livello                    public.livello_contestabilita,
  score                      integer check (score is null or (score >= 0 and score <= 100)),
  vizi                       jsonb,

  -- Scadenze calcolate
  scadenza_pagamento_ridotto date,
  scadenza_ricorso_prefetto  date,
  scadenza_ricorso_gdp       date,

  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create index if not exists verbali_user_id_idx on public.verbali(user_id);
create index if not exists verbali_created_at_idx on public.verbali(created_at desc);

drop trigger if exists verbali_set_updated_at on public.verbali;
create trigger verbali_set_updated_at
before update on public.verbali
for each row execute function public.set_updated_at();

alter table public.verbali enable row level security;

drop policy if exists "verbali_select_own" on public.verbali;
create policy "verbali_select_own"
  on public.verbali for select
  using (auth.uid() = user_id);

drop policy if exists "verbali_insert_own" on public.verbali;
create policy "verbali_insert_own"
  on public.verbali for insert
  with check (auth.uid() = user_id);

drop policy if exists "verbali_update_own" on public.verbali;
create policy "verbali_update_own"
  on public.verbali for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "verbali_delete_own" on public.verbali;
create policy "verbali_delete_own"
  on public.verbali for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- pratiche
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.pratiche (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.profiles(id) on delete cascade,
  verbale_id                  uuid not null references public.verbali(id) on delete cascade,

  stato                       public.stato_pratica not null default 'analisi',
  piano                       text,

  -- Pagamento Stripe
  stripe_checkout_session_id  text,
  stripe_payment_intent_id    text,
  importo_pagato              numeric(10, 2),
  pagato_at                   timestamptz,

  -- Ricorso
  ricorso_testo               text,
  ricorso_pdf_path            text,
  ricorso_pdf_url             text,
  ricorso_generato_at         timestamptz,

  -- Invio PEC
  pec_destinatario            text,
  pec_inviata_at              timestamptz,
  pec_ricevuta_at             timestamptz,
  pec_stato                   text,
  pec_message_id              text,

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists pratiche_user_id_idx on public.pratiche(user_id);
create index if not exists pratiche_verbale_id_idx on public.pratiche(verbale_id);
create index if not exists pratiche_stato_idx on public.pratiche(stato);

drop trigger if exists pratiche_set_updated_at on public.pratiche;
create trigger pratiche_set_updated_at
before update on public.pratiche
for each row execute function public.set_updated_at();

alter table public.pratiche enable row level security;

drop policy if exists "pratiche_select_own" on public.pratiche;
create policy "pratiche_select_own"
  on public.pratiche for select
  using (auth.uid() = user_id);

drop policy if exists "pratiche_insert_own" on public.pratiche;
create policy "pratiche_insert_own"
  on public.pratiche for insert
  with check (auth.uid() = user_id);

drop policy if exists "pratiche_update_own" on public.pratiche;
create policy "pratiche_update_own"
  on public.pratiche for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "pratiche_delete_own" on public.pratiche;
create policy "pratiche_delete_own"
  on public.pratiche for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- autovelox_omologati (tabella pubblica in sola lettura)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.autovelox_omologati (
  id                    uuid primary key default gen_random_uuid(),
  modello               text not null,
  costruttore           text,
  tipo                  text,
  decreto_omologazione  text,
  data_omologazione     date,
  attivo                boolean not null default true,
  note                  text,
  created_at            timestamptz not null default now()
);

create index if not exists autovelox_modello_idx on public.autovelox_omologati(modello);

alter table public.autovelox_omologati enable row level security;

drop policy if exists "autovelox_public_read" on public.autovelox_omologati;
create policy "autovelox_public_read"
  on public.autovelox_omologati for select
  using (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- prefetture (tabella pubblica in sola lettura)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.prefetture (
  id         uuid primary key default gen_random_uuid(),
  provincia  text not null,
  nome       text not null,
  pec        text not null,
  indirizzo  text,
  telefono   text,
  created_at timestamptz not null default now()
);

create unique index if not exists prefetture_provincia_uniq on public.prefetture(provincia);

alter table public.prefetture enable row level security;

drop policy if exists "prefetture_public_read" on public.prefetture;
create policy "prefetture_public_read"
  on public.prefetture for select
  using (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- consents (log GDPR)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.consents (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  tipo       text not null,
  accettato  boolean not null default true,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists consents_user_id_idx on public.consents(user_id);

alter table public.consents enable row level security;

drop policy if exists "consents_select_own" on public.consents;
create policy "consents_select_own"
  on public.consents for select
  using (auth.uid() = user_id);

drop policy if exists "consents_insert_own" on public.consents;
create policy "consents_insert_own"
  on public.consents for insert
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Storage: bucket 'verbali' (privato, accesso per owner)
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('verbali', 'verbali', false)
on conflict (id) do nothing;

drop policy if exists "verbali_storage_select_own" on storage.objects;
create policy "verbali_storage_select_own"
  on storage.objects for select
  using (
    bucket_id = 'verbali'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "verbali_storage_insert_own" on storage.objects;
create policy "verbali_storage_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'verbali'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "verbali_storage_update_own" on storage.objects;
create policy "verbali_storage_update_own"
  on storage.objects for update
  using (
    bucket_id = 'verbali'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "verbali_storage_delete_own" on storage.objects;
create policy "verbali_storage_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'verbali'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
