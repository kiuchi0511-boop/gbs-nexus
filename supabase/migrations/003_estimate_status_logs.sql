create table estimate_status_logs (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references estimates(id) on delete cascade,
  old_status text,
  new_status text not null,
  memo text,
  changed_at timestamptz not null default now()
);
