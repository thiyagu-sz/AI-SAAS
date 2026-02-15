-- =====================================================
-- PRODUCTION DATABASE CONSTRAINTS FOR CHAT HISTORY API
-- =====================================================
-- Run this script to add production-ready constraints
-- and indexes for the chat history API route
-- =====================================================

-- Add constraints to prevent duplicate chat conversations
-- This ensures idempotency at the database level
ALTER TABLE IF EXISTS chat_conversations 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Create unique constraint on user_id + title for basic deduplication
-- This prevents users from creating multiple conversations with the same title
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_conversations_user_title_unique 
ON chat_conversations(user_id, title) 
WHERE title IS NOT NULL AND title != '';

-- Create index on idempotency_key for fast lookups
CREATE INDEX IF NOT EXISTS idx_chat_conversations_idempotency_key 
ON chat_conversations(idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- Create composite index for optimal query performance on the API route
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_updated_desc 
ON chat_conversations(user_id, updated_at DESC);

-- Add constraint to ensure updated_at is always >= created_at
ALTER TABLE chat_conversations 
ADD CONSTRAINT IF NOT EXISTS check_updated_at_gte_created_at 
CHECK (updated_at >= created_at);

-- Add constraint to ensure title is not empty
ALTER TABLE chat_conversations 
ADD CONSTRAINT IF NOT EXISTS check_title_not_empty 
CHECK (title IS NOT NULL AND LENGTH(TRIM(title)) > 0);

-- Add function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on any row modification
DROP TRIGGER IF EXISTS update_chat_conversations_updated_at ON chat_conversations;
CREATE TRIGGER update_chat_conversations_updated_at
    BEFORE UPDATE ON chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create partial index for active (non-deleted) conversations
-- This can be used if you add soft delete functionality later
CREATE INDEX IF NOT EXISTS idx_chat_conversations_active 
ON chat_conversations(user_id, updated_at DESC) 
WHERE deleted_at IS NULL;

-- Add rate limiting support table for API routes
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_ip INET NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(client_ip, endpoint, window_start)
);

-- Index for fast rate limit lookups
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_lookup 
ON api_rate_limits(client_ip, endpoint, window_start DESC);

-- Cleanup old rate limit entries automatically (older than 1 hour)
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_cleanup 
ON api_rate_limits(window_start) 
WHERE window_start < NOW() - INTERVAL '1 hour';

-- Add request tracking table for analytics and debugging
CREATE TABLE IF NOT EXISTS api_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT UNIQUE NOT NULL,
    client_ip INET,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    idempotency_key TEXT,
    cache_hit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for request analytics
CREATE INDEX IF NOT EXISTS idx_api_requests_endpoint_created 
ON api_requests(endpoint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_requests_user_created 
ON api_requests(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_api_requests_errors 
ON api_requests(endpoint, created_at DESC) 
WHERE error_message IS NOT NULL;

-- Partitioning setup for large scale (optional - for high volume)
-- This can be enabled later if the api_requests table grows very large

-- Function to clean up old API request logs (keep only last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_api_requests()
RETURNS void AS $$
BEGIN
    DELETE FROM api_requests 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    DELETE FROM api_rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to run cleanup daily (requires pg_cron extension)
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('cleanup-api-logs', '0 2 * * *', 'SELECT cleanup_old_api_requests();');

-- Add RLS policies for the new tables
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_requests ENABLE ROW LEVEL SECURITY;

-- Rate limits are not user-specific, so create a policy for service role only
CREATE POLICY "Service role can manage rate limits" ON api_rate_limits
    FOR ALL USING (auth.role() = 'service_role');

-- API requests can be viewed by the user who made them
CREATE POLICY "Users can view their own API requests" ON api_requests
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    );

-- Service role can manage all API request records
CREATE POLICY "Service role can manage API requests" ON api_requests
    FOR ALL USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE api_rate_limits IS 'Rate limiting tracking for API endpoints';
COMMENT ON TABLE api_requests IS 'Request logging and analytics for API endpoints';
COMMENT ON COLUMN chat_conversations.idempotency_key IS 'Idempotency key for preventing duplicate operations';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON api_rate_limits TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON api_requests TO service_role;
GRANT USAGE ON SEQUENCE api_rate_limits_id_seq TO service_role;
GRANT USAGE ON SEQUENCE api_requests_id_seq TO service_role;

-- Create view for API analytics (optional)
CREATE OR REPLACE VIEW api_analytics AS
SELECT 
    endpoint,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300) as success_count,
    COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
    COUNT(*) FILTER (WHERE cache_hit = true) as cache_hits,
    AVG(response_time_ms) as avg_response_time,
    MAX(response_time_ms) as max_response_time,
    DATE_TRUNC('hour', created_at) as hour
FROM api_requests 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY endpoint, DATE_TRUNC('hour', created_at)
ORDER BY hour DESC, total_requests DESC;

COMMENT ON VIEW api_analytics IS 'Hourly API performance analytics for the last 24 hours';

-- Grant access to analytics view
GRANT SELECT ON api_analytics TO service_role;