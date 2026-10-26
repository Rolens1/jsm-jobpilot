-- ==============================================================================
-- Migration: 0002_rate_limits.sql
-- Description: Rate limits table and atomic check_rate_limit function
-- ==============================================================================

-- 1. Create rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rate_limits_identifier_endpoint_key UNIQUE (identifier, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits (identifier, endpoint);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow authenticated and anon full access
DROP POLICY IF EXISTS "Allow authenticated and anon access on rate_limits" ON public.rate_limits;
CREATE POLICY "Allow authenticated and anon access on rate_limits"
  ON public.rate_limits
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.rate_limits TO anon, authenticated, postgres;

-- 2. Atomic check_rate_limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_limit INT,
  p_window_seconds INT
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INT,
  remaining INT,
  reset_seconds INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rec public.rate_limits%ROWTYPE;
  v_now TIMESTAMPTZ := now();
  v_elapsed INT;
BEGIN
  -- Lock the row for update to prevent concurrent race conditions
  SELECT * INTO v_rec
  FROM public.rate_limits
  WHERE identifier = p_identifier AND endpoint = p_endpoint
  FOR UPDATE;

  -- First request in this bucket: insert record
  IF NOT FOUND THEN
    INSERT INTO public.rate_limits (identifier, endpoint, count, window_start, updated_at)
    VALUES (p_identifier, p_endpoint, 1, v_now, v_now);

    RETURN QUERY SELECT TRUE, 1, GREATEST(0, p_limit - 1), p_window_seconds;
    RETURN;
  END IF;

  v_elapsed := EXTRACT(EPOCH FROM (v_now - v_rec.window_start))::INT;

  -- Window expired: reset window
  IF v_elapsed >= p_window_seconds THEN
    UPDATE public.rate_limits
    SET count = 1, window_start = v_now, updated_at = v_now
    WHERE id = v_rec.id;

    RETURN QUERY SELECT TRUE, 1, GREATEST(0, p_limit - 1), p_window_seconds;
    RETURN;
  END IF;

  -- Window active and under quota: increment
  IF v_rec.count < p_limit THEN
    UPDATE public.rate_limits
    SET count = v_rec.count + 1, updated_at = v_now
    WHERE id = v_rec.id;

    RETURN QUERY SELECT TRUE, v_rec.count + 1, GREATEST(0, p_limit - (v_rec.count + 1)), p_window_seconds - v_elapsed;
    RETURN;
  ELSE
    -- Quota reached: deny
    RETURN QUERY SELECT FALSE, v_rec.count, 0, p_window_seconds - v_elapsed;
    RETURN;
  END IF;
END;
$$;

-- Grant execution to authenticated, anon, postgres
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, INT, INT) TO anon, authenticated, postgres;
