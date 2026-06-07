-- ============================================================
-- 1. TABLES (no policies yet — avoids forward-reference errors)
-- ============================================================

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique,
  full_name  text,
  avatar_url text,
  created_at timestamptz default now()
);

create table friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at   timestamptz default now(),
  unique (requester_id, addressee_id)
);

create table groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz default now()
);

create table group_members (
  group_id  uuid not null references groups(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

create table splits (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references groups(id) on delete cascade,
  title      text not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz default now()
);

create table split_items (
  id       uuid primary key default gen_random_uuid(),
  split_id uuid not null references splits(id) on delete cascade,
  name     text not null,
  price    numeric(10,2) not null
);

create table split_assignments (
  id            uuid primary key default gen_random_uuid(),
  split_item_id uuid not null references split_items(id) on delete cascade,
  user_id       uuid not null references profiles(id),
  amount        numeric(10,2) not null
);

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================

alter table profiles         enable row level security;
alter table friendships      enable row level security;
alter table groups           enable row level security;
alter table group_members    enable row level security;
alter table splits           enable row level security;
alter table split_items      enable row level security;
alter table split_assignments enable row level security;

-- profiles
create policy "profiles: read own" on profiles for select using (auth.uid() = id);
create policy "profiles: insert own" on profiles for insert with check (auth.uid() = id);
create policy "profiles: update own" on profiles for update using (auth.uid() = id);

-- friendships
create policy "friendships: read own" on friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "friendships: insert as requester" on friendships for insert
  with check (auth.uid() = requester_id);
create policy "friendships: update as addressee" on friendships for update
  using (auth.uid() = addressee_id);

-- groups (group_members now exists)
create policy "groups: read as member" on groups for select
  using (exists (
    select 1 from group_members where group_id = groups.id and user_id = auth.uid()
  ));
create policy "groups: insert" on groups for insert with check (auth.uid() = created_by);

-- group_members
create policy "group_members: read as member" on group_members for select
  using (exists (
    select 1 from group_members gm
    where gm.group_id = group_members.group_id and gm.user_id = auth.uid()
  ));
create policy "group_members: insert as creator" on group_members for insert
  with check (
    exists (select 1 from groups where id = group_id and created_by = auth.uid())
    or user_id = auth.uid()
  );

-- splits
create policy "splits: read as group member" on splits for select
  using (exists (
    select 1 from group_members where group_id = splits.group_id and user_id = auth.uid()
  ));
create policy "splits: insert as group member" on splits for insert
  with check (exists (
    select 1 from group_members where group_id = splits.group_id and user_id = auth.uid()
  ));

-- split_items
create policy "split_items: read via split" on split_items for select
  using (exists (
    select 1 from splits s
    join group_members gm on gm.group_id = s.group_id
    where s.id = split_id and gm.user_id = auth.uid()
  ));
create policy "split_items: insert via split" on split_items for insert
  with check (exists (
    select 1 from splits s
    join group_members gm on gm.group_id = s.group_id
    where s.id = split_id and gm.user_id = auth.uid()
  ));

-- split_assignments
create policy "split_assignments: read via split" on split_assignments for select
  using (exists (
    select 1 from split_items si
    join splits s on s.id = si.split_id
    join group_members gm on gm.group_id = s.group_id
    where si.id = split_item_id and gm.user_id = auth.uid()
  ));
create policy "split_assignments: insert via split" on split_assignments for insert
  with check (exists (
    select 1 from split_items si
    join splits s on s.id = si.split_id
    join group_members gm on gm.group_id = s.group_id
    where si.id = split_item_id and gm.user_id = auth.uid()
  ));

-- ============================================================
-- 3. FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile row on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Auto-add group creator as a member
create or replace function add_creator_to_group()
returns trigger language plpgsql security definer as $$
begin
  insert into group_members (group_id, user_id) values (new.id, new.created_by);
  return new;
end;
$$;
create trigger on_group_created
  after insert on groups
  for each row execute procedure add_creator_to_group();

-- ============================================================
-- 4. VIEWS
-- ============================================================

-- Net balance per (group, payer pair)
create view group_balances as
select
  s.group_id,
  sa.user_id   as owes_id,
  s.created_by as owed_id,
  sum(sa.amount) as amount
from split_assignments sa
join split_items si on si.id = sa.split_item_id
join splits s on s.id = si.split_id
where sa.user_id <> s.created_by
group by s.group_id, sa.user_id, s.created_by;
