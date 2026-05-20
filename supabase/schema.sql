-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────
create type property_type as enum ('casa', 'departamento', 'duplex', 'ph', 'terreno', 'local');
create type financing_type as enum ('efectivo', 'credito', 'ambos');
create type request_status as enum ('active', 'matched', 'closed', 'expired');
create type broker_subscription as enum ('free', 'starter', 'pro');

-- ─────────────────────────────────────────
-- BROKER PROFILES
-- ─────────────────────────────────────────
create table broker_profiles (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade,
  name         text not null,
  agency_name  text,
  phone        text,
  email        text not null,
  zones        text[] default '{}',         -- zonas de especialidad
  credits      int not null default 0,
  subscription broker_subscription default 'free',
  verified     boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table broker_profiles enable row level security;

create policy "Brokers can view/edit own profile"
  on broker_profiles for all
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- BUYER REQUESTS
-- ─────────────────────────────────────────
create table buyer_requests (
  id              uuid primary key default uuid_generate_v4(),
  
  -- Datos de la búsqueda (públicos)
  property_types  property_type[] not null,
  zones           text[] not null,
  bedrooms_min    int,
  bedrooms_max    int,
  bathrooms_min   int,
  budget_usd      int not null,
  financing       financing_type not null,
  requirements    text[] default '{}',      -- pileta, cochera, seguridad, etc.
  description     text,
  urgency         text,                     -- 'esta_semana' | 'este_mes' | 'en_3_meses'
  
  -- Contacto (privado, solo visible al pagar)
  contact_name    text not null,
  contact_phone   text not null,
  contact_email   text,
  
  -- Estado
  status          request_status default 'active',
  views_count     int default 0,
  leads_count     int default 0,
  
  -- AI embedding para matching
  embedding       vector(1536),
  
  created_at      timestamptz default now(),
  expires_at      timestamptz default now() + interval '60 days'
);

alter table buyer_requests enable row level security;

-- Cualquiera puede leer pedidos activos (sin contacto — eso lo maneja la API)
create policy "Public can read active requests"
  on buyer_requests for select
  using (status = 'active');

-- Solo insertar desde server (service role)
create policy "Service role can insert"
  on buyer_requests for insert
  with check (true);

-- ─────────────────────────────────────────
-- LEAD PURCHASES (broker desbloquea contacto)
-- ─────────────────────────────────────────
create table lead_purchases (
  id          uuid primary key default uuid_generate_v4(),
  broker_id   uuid references broker_profiles(id) on delete cascade,
  request_id  uuid references buyer_requests(id) on delete cascade,
  credits_spent int not null default 1,
  purchased_at  timestamptz default now(),
  unique(broker_id, request_id)
);

alter table lead_purchases enable row level security;

create policy "Brokers can view own purchases"
  on lead_purchases for all
  using (
    broker_id in (
      select id from broker_profiles where user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────
-- CREDIT TRANSACTIONS
-- ─────────────────────────────────────────
create table credit_transactions (
  id          uuid primary key default uuid_generate_v4(),
  broker_id   uuid references broker_profiles(id) on delete cascade,
  amount      int not null,               -- positivo = compra, negativo = gasto
  description text,
  mp_payment_id text,                     -- MercadoPago reference
  created_at  timestamptz default now()
);

alter table credit_transactions enable row level security;

create policy "Brokers can view own transactions"
  on credit_transactions for select
  using (
    broker_id in (
      select id from broker_profiles where user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────
-- BROKER ZONE ALERTS (para notificaciones)
-- ─────────────────────────────────────────
create table broker_alerts (
  id         uuid primary key default uuid_generate_v4(),
  broker_id  uuid references broker_profiles(id) on delete cascade,
  request_id uuid references buyer_requests(id) on delete cascade,
  sent_at    timestamptz default now(),
  opened     boolean default false,
  unique(broker_id, request_id)
);

-- ─────────────────────────────────────────
-- FUNCTIONS
-- ─────────────────────────────────────────

-- Incrementar vistas de un pedido
create or replace function increment_request_views(req_id uuid)
returns void as $$
  update buyer_requests set views_count = views_count + 1 where id = req_id;
$$ language sql security definer;

-- Matching simple por zona (usado como fallback sin embeddings)
create or replace function get_brokers_for_request(req_id uuid)
returns table(broker_id uuid, email text, name text) as $$
  select bp.id, bp.email, bp.name
  from broker_profiles bp
  where bp.zones && (select zones from buyer_requests where id = req_id)
  and bp.subscription != 'free'
  limit 50;
$$ language sql security definer;
