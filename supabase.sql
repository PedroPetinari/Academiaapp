-- Cole tudo isto no Supabase: menu "SQL Editor" -> New query -> Run.
create table if not exists casal (
  code text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Ninguém acessa a tabela diretamente; só pelas duas funções abaixo, que exigem o código.
alter table casal enable row level security;

create or replace function get_casal(p_code text) returns jsonb
language sql security definer set search_path = public as $$
  select data from casal where code = p_code
$$;

create or replace function save_casal(p_code text, p_data jsonb) returns void
language sql security definer set search_path = public as $$
  insert into casal (code, data, updated_at) values (p_code, p_data, now())
  on conflict (code) do update set data = excluded.data, updated_at = now()
$$;

revoke all on function get_casal(text) from public;
revoke all on function save_casal(text, jsonb) from public;
grant execute on function get_casal(text) to anon;
grant execute on function save_casal(text, jsonb) to anon;

-- ======================= FOTOS (rode também, para as fotos aparecerem nos dois aparelhos) =======================
create table if not exists fotos (
  code text not null,
  id   text not null,
  d    text not null default '',
  cap  text not null default '',
  at   bigint not null default 0,
  data text not null,
  primary key (code, id)
);
alter table fotos enable row level security;

create or replace function lista_fotos(p_code text) returns jsonb
language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'd', d, 'cap', cap, 'at', at) order by at), '[]'::jsonb)
  from fotos where code = p_code
$$;

create or replace function pega_foto(p_code text, p_id text) returns text
language sql security definer set search_path = public as $$
  select data from fotos where code = p_code and id = p_id
$$;

create or replace function salva_foto(p_code text, p_id text, p_d text, p_cap text, p_at bigint, p_data text) returns void
language sql security definer set search_path = public as $$
  insert into fotos (code, id, d, cap, at, data) values (p_code, p_id, p_d, p_cap, p_at, p_data)
  on conflict (code, id) do update set d = excluded.d, cap = excluded.cap, at = excluded.at, data = excluded.data
$$;

create or replace function legenda_foto(p_code text, p_id text, p_cap text) returns void
language sql security definer set search_path = public as $$
  update fotos set cap = p_cap where code = p_code and id = p_id
$$;

create or replace function apaga_foto(p_code text, p_id text) returns void
language sql security definer set search_path = public as $$
  delete from fotos where code = p_code and id = p_id
$$;

revoke all on function lista_fotos(text) from public;
revoke all on function pega_foto(text, text) from public;
revoke all on function salva_foto(text, text, text, text, bigint, text) from public;
revoke all on function legenda_foto(text, text, text) from public;
revoke all on function apaga_foto(text, text) from public;
grant execute on function lista_fotos(text) to anon;
grant execute on function pega_foto(text, text) to anon;
grant execute on function salva_foto(text, text, text, text, bigint, text) to anon;
grant execute on function legenda_foto(text, text, text) to anon;
grant execute on function apaga_foto(text, text) to anon;
