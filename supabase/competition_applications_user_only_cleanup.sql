delete from public.competition_refunds
where application_id in (
  '10000000-0000-4000-8000-000000000101'::uuid,
  '10000000-0000-4000-8000-000000000102'::uuid
);

delete from public.competition_payments
where application_id in (
  '10000000-0000-4000-8000-000000000101'::uuid,
  '10000000-0000-4000-8000-000000000102'::uuid
);

delete from public.competition_applications
where id in (
  '10000000-0000-4000-8000-000000000101'::uuid,
  '10000000-0000-4000-8000-000000000102'::uuid
);

drop policy if exists "Allow authenticated users to insert own competition applications"
on public.competition_applications;

create policy "Allow authenticated users to insert own competition applications"
on public.competition_applications
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  and public.current_crm_role() = 'user'
  and nullif(trim(owner_email), '') is not null
  and nullif(trim(competition_slug), '') is not null
  and nullif(trim(competition_name), '') is not null
  and nullif(trim(stage_id), '') is not null
  and participant_kind in ('owner', 'athlete')
  and registration_kind in ('individual', 'relay', 'long-distance')
  and status = 'submitted'
);
