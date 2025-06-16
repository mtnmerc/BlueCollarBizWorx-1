-- Add api_secret column to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS api_secret TEXT UNIQUE;

-- Update existing businesses with API secrets
UPDATE businesses 
SET api_secret = 'sk_' || substr(md5(random()::text), 1, 40) || extract(epoch from now())::text
WHERE api_key IS NOT NULL AND api_secret IS NULL;

-- Show current state
SELECT id, name, 
       CASE WHEN api_key IS NOT NULL THEN 'Has Key' ELSE 'No Key' END as api_key_status,
       CASE WHEN api_secret IS NOT NULL THEN 'Has Secret' ELSE 'No Secret' END as api_secret_status
FROM businesses 
ORDER BY id;