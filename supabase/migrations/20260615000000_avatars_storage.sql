-- Avatar photos: public "avatars" bucket + RLS so each user manages only
-- files under a folder named by their uid (avatars/{uid}/...). Read is public.
-- Idempotent: safe to re-run.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Public read of avatar files (bucket is public, but be explicit for SELECT).
drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated users can upload into their own folder.
drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ...and overwrite it (we upsert to a fixed path per user).
drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ...and delete it.
drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
