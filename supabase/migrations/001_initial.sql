-- 見積書テーブル
create table estimates (
  id              uuid primary key default gen_random_uuid(),
  estimate_no     text not null,
  estimate_date   date not null default current_date,
  client_name     text not null,
  client_person   text,
  job_name        text not null,
  pattern         text,
  shade_area_m2   numeric,
  pillar_type     int check (pillar_type in (1,2,3)),
  duration        text,
  trade_method    text,
  notes           text,
  discount_amount numeric not null default 0,
  discount_reason text,
  status          text not null default 'draft'
                  check (status in ('draft','submitted','won','lost')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

-- 見積書明細テーブル
create table estimate_items (
  id              uuid primary key default gen_random_uuid(),
  estimate_id     uuid not null references estimates(id) on delete cascade,
  section         int not null check (section in (1,2,3,4)),
  sub_category    text,
  item_name       text not null,
  specification   text,
  quantity        numeric not null default 1,
  unit            text not null default '式',
  unit_price      numeric not null default 0,
  cost_price      numeric not null default 0,
  note            text,
  is_active       boolean not null default true,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);

-- GBS㎡単価マスタ
create table price_master (
  id              serial primary key,
  pillar_type     int not null check (pillar_type in (1,2,3)),
  area_max_m2     int,
  unit_price_low  numeric not null,
  unit_price_high numeric,
  updated_at      timestamptz not null default now()
);

-- 工事項目マスタ
create table item_master (
  id              uuid primary key default gen_random_uuid(),
  section         int not null check (section in (1,2,3,4)),
  sub_category    text,
  item_name       text not null,
  specification   text,
  unit            text not null default '式',
  default_price   numeric not null default 0,
  default_cost    numeric not null default 0,
  note_template   text,
  is_active       boolean not null default true,
  sort_order      int not null default 0
);

-- updated_at 自動更新トリガー
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger estimates_updated_at
  before update on estimates
  for each row execute function update_updated_at();

-- GBS単価マスタ 初期データ
insert into price_master (pillar_type, area_max_m2, unit_price_low, unit_price_high) values
  (1, 50,  60000, 70000),
  (1, 100, 58000, null),
  (1, 300, 52000, null),
  (1, 500, 45000, null),
  (2, 50,  50000, 55000),
  (2, 100, 48000, null),
  (2, 300, 45000, null),
  (2, 500, 40000, null),
  (3, 50,  45000, 42000),
  (3, 100, 42000, null),
  (3, 300, 38000, null),
  (3, 500, 35000, null);

-- 工事項目マスタ 初期データ
insert into item_master (section, sub_category, item_name, unit, default_price, default_cost, sort_order) values
  -- 基礎工事
  (1, '仮設費', '水盛遣り方',                        '式',   41700,  35000, 10),
  (1, '仮設費', '清掃養生費',                        '式',   27800,  23000, 20),
  (1, '工事費', '支柱建て用基礎工事（残土処分含む）', '箇所', 138900, 116000, 30),
  (1, '工事費', '重機回送費',                        '式',   34800,  29000, 40),
  (1, '工事費', '重機使用費',                        '式',   55600,  46000, 50),
  -- 鉄骨工事
  (2, '部材', '支柱鉄骨 t4.5角125×125×L3600',        '本',   30600,  25700, 10),
  (2, '部材', '上記役物及び補強鉄骨部材',              '式',   17800,  14900, 20),
  (2, '部材', '補強柱支持鉄骨 t3.2角100×100×L1800',   '本',   13900,  11700, 30),
  (2, '部材', '梁鉄骨 H125×125×L4000',               '本',   45900,  38600, 40),
  (2, '部材', 'ジョイント補強材・副資材',              '式',   27800,  23300, 50),
  (2, '部材', 'ベースプレート材（アンカーボルト含む）', '枚',   80600,  67700, 60),
  (2, '部材', '上記加工製作費',                       '式',  627800, 527300, 70),
  (2, '工事費', '現場建込設置費',                     '式',  437500, 367500, 80),
  (2, '工事費', '塗装費',                             '式',  180600, 151700, 90),
  (2, '工事費', 'ユニック車・高所作業リフター手配・オペ費', '式', 55600, 46700, 100),
  -- シェード工事
  (3, '部材', '開閉式メッシュテント 4m×18m（テイジン・クッキー）', '式', 720000, 604800, 10),
  (3, '部材', '副資材一式（GSX-25・GHX-6・メッキワイヤー等）',     '式', 1663900, 1397700, 20),
  (3, '工事費', '上記組込み及び取付費',                '面',  112500,  94500, 30),
  (3, '工事費', 'ユニック車・高所作業リフター手配・オペ費', '式', 55600, 46700, 40),
  -- 諸経費
  (4, '', '現場管理費',  '式',  80000, 0, 10),
  (4, '', '安全対策費',  '式',  20000, 0, 20),
  (4, '', '設計・製図費', '式', 130000, 0, 30),
  (4, '', '運搬・諸経費', '式', 200000, 0, 40),
  (4, '', '法定福利費',  '式',  72240, 0, 50);
