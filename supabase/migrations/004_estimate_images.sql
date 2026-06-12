create table estimate_images (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references estimates(id) on delete cascade,
  image_url text not null,
  prompt text,
  generation_type text default 'spec',
  width_m numeric,
  length_m numeric,
  count int,
  pillar_type int,
  color text,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('estimate-images', 'estimate-images', true)
on conflict (id) do nothing;
