-- Private object storage for receipts, vouchers, assets, and backups.
insert into storage.buckets (id, name, public)
values ('tenant-files', 'tenant-files', false), ('platform-backups', 'platform-backups', false)
on conflict (id) do nothing;

create policy tenant_files_read on storage.objects
for select to authenticated
using (bucket_id = 'tenant-files' and public.is_tenant_member((storage.foldername(name))[1]));

create policy tenant_files_write on storage.objects
for insert to authenticated
with check (bucket_id = 'tenant-files' and public.is_tenant_member((storage.foldername(name))[1], 'accountant'));

create policy platform_backups_read on storage.objects
for select to authenticated
using (bucket_id = 'platform-backups' and public.is_platform_role('platform_admin'));

create policy platform_backups_write on storage.objects
for insert to authenticated
with check (bucket_id = 'platform-backups' and public.is_platform_role('platform_admin'));
