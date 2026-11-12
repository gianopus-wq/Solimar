-- Commercial terms on each placement, used by the contract fulfillment page.
alter table public.engagements
  add column hourly_rate numeric(10, 2) not null default 0 check (hourly_rate >= 0),
  add column hours_per_week numeric(6, 2) not null default 0 check (hours_per_week >= 0),
  add column term_weeks integer not null default 0 check (term_weeks >= 0);

-- Professionals cannot change the terms; only admins (or the automation) can.
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
  new.hourly_rate := old.hourly_rate;
  new.hours_per_week := old.hours_per_week;
  new.term_weeks := old.term_weeks;

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
