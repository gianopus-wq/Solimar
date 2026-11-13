-- Pay rate is set per hire (per professional, the W-2 employee). Admin-only.
alter table public.talents
  add column pay_rate numeric(10, 2) not null default 0 check (pay_rate >= 0);

-- Professionals cannot change their own pay rate.
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
  new.pay_rate := old.pay_rate;
  if new.status is distinct from old.status
     and not (new.status = 'pending' and old.status in ('draft', 'rejected')) then
    raise exception 'Only Naboria can change approval status';
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
