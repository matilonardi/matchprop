CREATE TABLE IF NOT EXISTS request_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid REFERENCES buyer_requests(id) ON DELETE CASCADE NOT NULL,
  broker_id uuid REFERENCES broker_profiles(id) ON DELETE SET NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS request_reports_request_id_idx ON request_reports(request_id);
CREATE INDEX IF NOT EXISTS request_reports_status_idx ON request_reports(status);
