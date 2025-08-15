-- Add OTP codes table for email verification
CREATE TABLE IF NOT EXISTS otp_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint on email and purpose
CREATE UNIQUE INDEX IF NOT EXISTS idx_otp_codes_email_purpose ON otp_codes(email, purpose);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

-- Create index on created_at for ordering
CREATE INDEX IF NOT EXISTS idx_otp_codes_created_at ON otp_codes(created_at);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_otp_codes_updated_at
    BEFORE UPDATE ON otp_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Clean up expired OTP codes (optional: you can run this periodically)
-- DELETE FROM otp_codes WHERE expires_at < NOW();
