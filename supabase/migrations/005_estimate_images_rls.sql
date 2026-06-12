-- estimate_images テーブル・Storage の RLS ポリシー（認証ユーザー向け）
alter table estimate_images enable row level security;

create policy "Authenticated users can select estimate_images"
  on estimate_images for select
  to authenticated
  using (true);

create policy "Authenticated users can insert estimate_images"
  on estimate_images for insert
  to authenticated
  with check (true);

create policy "Authenticated users can delete estimate_images"
  on estimate_images for delete
  to authenticated
  using (true);

-- Storage: estimate-images バケット
create policy "Authenticated users can upload estimate images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'estimate-images');

create policy "Authenticated users can delete estimate images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'estimate-images');

create policy "Public can view estimate images"
  on storage.objects for select
  to public
  using (bucket_id = 'estimate-images');
