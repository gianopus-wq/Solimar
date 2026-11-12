-- Solimar: schema, row level security, and storage.

create schema if not exists private;
grant usage on schema private to authenticated;

-- ───────────── Roles ─────────────

-- Emails that become admins when they sign up. Not reachable from the API.
create table public.admin_emails (
  email text primary key check (email = lower(email))
);
alter table public.admin_emails enable row level security;
revoke all on public.admin_emails from anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'talent' check (role in ('talent', 'admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Admin = profile role 'admin' on an account whose email has been confirmed.
create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and u.email_confirmed_at is not null
  );
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

-- ───────────── Talent ─────────────

create table public.talents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  location text not null default '',
  role text not null default '',
  headline text not null default '',
  bio text not null default '',
  qualities jsonb not null default '[]',
  skills jsonb not null default '[]',
  education jsonb not null default '[]',
  experience jsonb not null default '[]',
  video_path text not null default '',
  video_name text not null default '',
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.talents enable row level security;

-- Professionals may edit their own profile but cannot approve themselves or
-- mark their own skills as verified. Approval by an admin verifies all skills.
create function private.guard_talent_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if (select auth.uid()) is null then
    return new; -- service / SQL editor
  end if;

  if private.is_admin() then
    if new.status = 'approved' and old.status is distinct from 'approved' then
      new.skills := coalesce((
        select jsonb_agg(jsonb_build_object('name', s ->> 'name', 'verified', true))
        from jsonb_array_elements(new.skills) s
      ), '[]'::jsonb);
    end if;
    return new;
  end if;

  new.user_id := old.user_id;
  if new.status is distinct from old.status
     and not (new.status = 'pending' and old.status in ('draft', 'rejected')) then
    raise exception 'Only Solimar can change approval status';
  end if;
  new.skills := coalesce((
    select jsonb_agg(jsonb_build_object(
      'name', s ->> 'name',
      'verified', exists (
        select 1 from jsonb_array_elements(old.skills) o
        where o ->> 'name' = s ->> 'name' and (o ->> 'verified')::boolean
      )))
    from jsonb_array_elements(new.skills) s
  ), '[]'::jsonb);
  return new;
end $$;

create trigger talents_guard before update on public.talents
for each row execute function private.guard_talent_update();

-- New sign-ups get a profile, and (unless they are an admin) an empty talent record.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  r text;
begin
  r := case
    when exists (select 1 from public.admin_emails a where a.email = lower(new.email)) then 'admin'
    else 'talent'
  end;
  insert into public.profiles (id, role) values (new.id, r);
  if r = 'talent' then
    insert into public.talents (user_id, email) values (new.id, coalesce(new.email, ''));
  end if;
  return new;
end $$;
revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();

-- ───────────── Engagements (client links and placements) ─────────────

create table public.engagements (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  talent_id uuid not null references public.talents (id) on delete cascade,
  company text not null check (char_length(company) between 1 and 200),
  contact_email text not null default '',
  tools jsonb not null default '[]',
  standup text not null default '',
  status text not null default 'invited' check (status in ('invited', 'pending_setup', 'active')),
  steps jsonb not null default '[]',
  created_at timestamptz not null default now(),
  requested_at timestamptz,
  confirmed_at timestamptz
);
create index engagements_talent_id_idx on public.engagements (talent_id);
alter table public.engagements enable row level security;

-- Professionals may only tick off steps and confirm setup on their own engagements.
create function private.guard_engagement_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (select auth.uid()) is null or private.is_admin() then
    return new;
  end if;

  new.token := old.token;
  new.talent_id := old.talent_id;
  new.company := old.company;
  new.contact_email := old.contact_email;
  new.tools := old.tools;
  new.standup := old.standup;
  new.created_at := old.created_at;
  new.requested_at := old.requested_at;

  if old.status <> 'pending_setup' then
    new.steps := old.steps;
  end if;
  if new.status is distinct from old.status then
    if old.status = 'pending_setup' and new.status = 'active' then
      new.confirmed_at := now();
    else
      raise exception 'This status change is not allowed';
    end if;
  else
    new.confirmed_at := old.confirmed_at;
  end if;
  return new;
end $$;

create trigger engagements_guard before update on public.engagements
for each row execute function private.guard_engagement_update();

-- ───────────── Leads, invoices, contract templates ─────────────

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  notes text not null default '' check (char_length(notes) <= 4000),
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed')),
  received_at timestamptz not null default now()
);
alter table public.leads enable row level security;

create sequence public.invoice_number_seq;

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default 'INV-' || lpad(nextval('public.invoice_number_seq')::text, 4, '0'),
  company text not null check (char_length(company) between 1 and 200),
  talent_id uuid references public.talents (id) on delete set null,
  period text not null default '',
  amount numeric(12, 2) not null check (amount > 0),
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid')),
  issued_at timestamptz not null default now()
);
create index invoices_talent_id_idx on public.invoices (talent_id);
alter table public.invoices enable row level security;

create table public.contract_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  file_name text not null,
  file_path text not null,
  size bigint not null default 0,
  is_default boolean not null default false,
  uploaded_at timestamptz not null default now()
);
create unique index contract_templates_one_default on public.contract_templates (is_default) where is_default;
alter table public.contract_templates enable row level security;

-- ───────────── Grants and policies ─────────────

grant select on public.profiles to authenticated;
grant select, update on public.talents to authenticated;
grant select, insert, update, delete on public.engagements to authenticated;
grant select, insert, update on public.leads to authenticated;
grant insert on public.leads to anon;
grant select, insert, update on public.invoices to authenticated;
grant usage on sequence public.invoice_number_seq to authenticated;
grant select, insert, update, delete on public.contract_templates to authenticated;

create policy "Read own profile" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

create policy "Read own talent record or admin" on public.talents for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "Update own talent record or admin" on public.talents for update to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()))
  with check (user_id = (select auth.uid()) or (select private.is_admin()));

create policy "Read own engagements or admin" on public.engagements for select to authenticated
  using (
    (select private.is_admin())
    or exists (select 1 from public.talents t where t.id = talent_id and t.user_id = (select auth.uid()))
  );
create policy "Update own engagements or admin" on public.engagements for update to authenticated
  using (
    (select private.is_admin())
    or exists (select 1 from public.talents t where t.id = talent_id and t.user_id = (select auth.uid()))
  )
  with check (
    (select private.is_admin())
    or exists (select 1 from public.talents t where t.id = talent_id and t.user_id = (select auth.uid()))
  );
create policy "Admins create engagements" on public.engagements for insert to authenticated
  with check ((select private.is_admin()));
create policy "Admins delete engagements" on public.engagements for delete to authenticated
  using ((select private.is_admin()));

-- The public "Schedule a call" form may add a lead, nothing else.
create policy "Anyone can submit a lead" on public.leads for insert to anon, authenticated
  with check (status = 'new');
create policy "Admins read leads" on public.leads for select to authenticated
  using ((select private.is_admin()));
create policy "Admins update leads" on public.leads for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "Admins read invoices" on public.invoices for select to authenticated
  using ((select private.is_admin()));
create policy "Admins create invoices" on public.invoices for insert to authenticated
  with check ((select private.is_admin()));
create policy "Admins update invoices" on public.invoices for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "Admins manage contract templates" on public.contract_templates for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- ───────────── Client link (no sign-in) ─────────────
-- The link's token is the credential. These two functions are the only way an
-- anonymous visitor can reach engagement data, and they return a curated subset.

create function public.get_invite(p_token text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'engagement', jsonb_build_object(
      'id', e.id, 'company', e.company, 'contactEmail', e.contact_email,
      'tools', e.tools, 'standup', e.standup, 'status', e.status),
    'talent', jsonb_build_object(
      'name', t.name, 'role', t.role, 'location', t.location, 'headline', t.headline,
      'bio', t.bio, 'qualities', t.qualities, 'skills', t.skills,
      'education', t.education, 'experience', t.experience,
      'videoPath', t.video_path, 'videoName', t.video_name))
  from public.engagements e
  join public.talents t on t.id = e.talent_id
  where char_length(p_token) >= 20 and e.token = p_token and t.status = 'approved';
$$;

create function public.request_onboarding(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  e public.engagements;
  t public.talents;
begin
  if p_token is null or char_length(p_token) < 20 then
    return null;
  end if;
  update public.engagements g
     set status = 'pending_setup', requested_at = now()
    from public.talents p
   where g.token = p_token and g.status = 'invited' and p.id = g.talent_id and p.status = 'approved'
  returning g.* into e;
  if not found then
    return null;
  end if;
  select * into t from public.talents where id = e.talent_id;
  return jsonb_build_object(
    'engagementId', e.id, 'company', e.company, 'clientContactEmail', e.contact_email,
    'tools', e.tools, 'standup', e.standup,
    'contractTemplate', (select c.file_name from public.contract_templates c where c.is_default),
    'talent', jsonb_build_object('name', t.name, 'email', t.email, 'role', t.role));
end $$;

revoke all on function public.get_invite(text) from public;
revoke all on function public.request_onboarding(text) from public;
grant execute on function public.get_invite(text) to anon, authenticated;
grant execute on function public.request_onboarding(text) to anon, authenticated;

-- ───────────── Storage ─────────────

insert into storage.buckets (id, name, public, file_size_limit) values
  ('intro-videos', 'intro-videos', true, 52428800),
  ('agreements', 'agreements', false, 20971520),
  ('contracts', 'contracts', false, 20971520);

-- Intro videos: public to view by URL; each professional manages their own folder.
create policy "Own intro video: read" on storage.objects for select to authenticated
  using (bucket_id = 'intro-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Own intro video: add" on storage.objects for insert to authenticated
  with check (bucket_id = 'intro-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Own intro video: replace" on storage.objects for update to authenticated
  using (bucket_id = 'intro-videos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'intro-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Own intro video: delete" on storage.objects for delete to authenticated
  using (bucket_id = 'intro-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Signed agreements: private; the professional uploads, admins can read.
create policy "Agreements: read own or admin" on storage.objects for select to authenticated
  using (bucket_id = 'agreements'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_admin())));
create policy "Agreements: add own" on storage.objects for insert to authenticated
  with check (bucket_id = 'agreements' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Agreements: replace own" on storage.objects for update to authenticated
  using (bucket_id = 'agreements' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'agreements' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Contract templates: admins only.
create policy "Contracts: admins" on storage.objects for all to authenticated
  using (bucket_id = 'contracts' and (select private.is_admin()))
  with check (bucket_id = 'contracts' and (select private.is_admin()));
