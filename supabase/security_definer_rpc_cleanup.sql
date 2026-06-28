revoke execute on function public.sync_crm_user_name_from_account_profile() from public, anon, authenticated;

create or replace function public.current_crm_email()
returns text
language sql
stable
set search_path = public
as $$
  select lower(trim(coalesce(auth.jwt() ->> 'email', '')));
$$;

grant execute on function public.current_crm_email() to authenticated;
revoke execute on function public.current_crm_email() from public, anon;
