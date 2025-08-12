-- Create admin user with proper bcrypt hash for password: admin123
-- This hash was generated using bcrypt with 12 rounds
INSERT INTO users (email, password_hash, name, role, is_verified) VALUES
('admin@blog.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uK.G', 'Admin User', 'admin', true)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_verified = EXCLUDED.is_verified;

-- Create a test author user with password: author123
INSERT INTO users (email, password_hash, name, role, is_verified) VALUES
('author@blog.com', '$2b$12$8KQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uK.G', 'Test Author', 'author', true)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_verified = EXCLUDED.is_verified;
