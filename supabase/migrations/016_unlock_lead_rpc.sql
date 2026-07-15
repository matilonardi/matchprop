-- 016_unlock_lead_rpc.sql
--
-- Atomic "unlock lead" (credit deduction + purchase record) as a single
-- Postgres function instead of the previous optimistic-lock dance in
-- src/app/api/pedidos/[id]/unlock/route.ts.
--
-- Why: the old code did
--   1. UPDATE broker_profiles SET credits = credits - 1
--        WHERE id = :id AND credits = :credits_read_earlier   -- optimistic lock
--   2. if 0 rows affected -> re-read credits, retry ONCE
--   3. regardless of whether step 1 or the retry actually succeeded,
--      it unconditionally inserted into lead_purchases / credit_transactions.
-- Under concurrent requests (double-click, retried client request, or a
-- deliberate race by a bad actor), it's possible for the retry to also
-- lose its optimistic-lock race a second time; the code did not check
-- that case and inserted the purchase anyway — granting a free unlock
-- with no credit actually deducted.
--
-- Fix: `select ... for update` takes a row lock on the broker's row for
-- the duration of the transaction, so concurrent unlock_lead() calls for
-- the same broker serialize instead of racing. Idempotent: a broker who
-- already unlocked this request gets the same result without being
-- charged twice.
create or replace function unlock_lead(p_broker_id uuid, p_request_id uuid)
returns table(already_unlocked boolean, credits_remaining int) as $$
declare
  v_credits int;
  v_existing_purchase_id uuid;
begin
  select credits into v_credits
  from broker_profiles
  where id = p_broker_id
  for update;

  if v_credits is null then
    raise exception 'broker_not_found';
  end if;

  select id into v_existing_purchase_id
  from lead_purchases
  where broker_id = p_broker_id and request_id = p_request_id
  limit 1;

  if v_existing_purchase_id is not null then
    return query select true, v_credits;
    return;
  end if;

  if v_credits < 1 then
    raise exception 'insufficient_credits';
  end if;

  update broker_profiles
  set credits = credits - 1
  where id = p_broker_id;

  insert into lead_purchases (broker_id, request_id, credits_spent)
  values (p_broker_id, p_request_id, 1);

  insert into credit_transactions (broker_id, amount, description)
  values (p_broker_id, -1, 'Lead desbloqueado: ' || p_request_id);

  update buyer_requests
  set views_count = views_count + 1
  where id = p_request_id;

  return query select false, v_credits - 1;
end;
$$ language plpgsql security definer;
