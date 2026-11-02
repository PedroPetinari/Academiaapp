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
