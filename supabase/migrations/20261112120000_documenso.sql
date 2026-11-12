-- Documenso e-signature: employment agreements (talent) and MSA / SOW (client).
-- Envelope IDs and signing timestamps are written only by the automation (service role).

alter table public.talents
  add column employment_envelope_id text not null default '',
  add column employment_signed_at timestamptz;

alter table public.engagements
  add column msa_envelope_id text not null default '',
  add column msa_signed_at timestamptz,
  add column sow_envelope_id text not null default '',
  add column sow_signed_at timestamptz;

-- Professionals cannot change their own signature fields.
create or replace function private.guard_talent_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if (select auth.uid()) is null then
    return new; -- service role (automation) or SQL editor
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
  new.employment_envelope_id := old.employment_envelope_id;
  new.employment_signed_at := old.employment_signed_at;
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

-- Professionals may tick steps and confirm setup, but only after their employment agreement is signed.
create or replace function private.guard_engagement_update() returns trigger
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
  new.msa_envelope_id := old.msa_envelope_id;
  new.msa_signed_at := old.msa_signed_at;
  new.sow_envelope_id := old.sow_envelope_id;
  new.sow_signed_at := old.sow_signed_at;

  if old.status <> 'pending_setup' then
    new.steps := old.steps;
  end if;
  if new.status is distinct from old.status then
    if old.status = 'pending_setup' and new.status = 'active' then
      if not exists (
        select 1 from public.talents t
        where t.id = old.talent_id and t.employment_signed_at is not null
      ) then
        raise exception 'The employment agreement must be signed before starting work';
      end if;
      new.confirmed_at := now();
    else
      raise exception 'This status change is not allowed';
    end if;
  else
    new.confirmed_at := old.confirmed_at;
  end if;
  return new;
end $$;
