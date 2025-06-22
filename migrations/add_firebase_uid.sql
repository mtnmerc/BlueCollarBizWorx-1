-- Add firebase_uid column to businesses table
ALTER TABLE businesses ADD COLUMN firebase_uid TEXT UNIQUE;

-- Add index for better performance
CREATE INDEX idx_businesses_firebase_uid ON businesses(firebase_uid); 