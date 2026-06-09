create table company_settings (
  id serial primary key,
  company_name text not null default '株式会社児山製作所',
  department text default 'オリジナルプロダクトアンドセールス事業部',
  representative text default '代表取締役　児山　司',
  postal_code text default '〒491-0005',
  address text default '愛知県一宮市明地字井之内3-3',
  tel text default '0586-52-6108',
  fax text default '0586-69-5081',
  email text default 'info@musee.world',
  logo_text text default 'G.B.S',
  updated_at timestamptz default now()
);

-- 初期データ投入
insert into company_settings (id) values (1)
on conflict (id) do nothing;
