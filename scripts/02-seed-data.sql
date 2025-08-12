-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
('Technology', 'technology', 'Posts about technology, programming, and digital trends'),
('Lifestyle', 'lifestyle', 'Posts about lifestyle, health, and personal development'),
('Business', 'business', 'Posts about business, entrepreneurship, and finance'),
('Travel', 'travel', 'Posts about travel experiences and destinations')
ON CONFLICT (slug) DO NOTHING;

-- Insert default tags
INSERT INTO tags (name, slug) VALUES
('JavaScript', 'javascript'),
('React', 'react'),
('Next.js', 'nextjs'),
('Web Development', 'web-development'),
('Tutorial', 'tutorial'),
('Tips', 'tips'),
('Guide', 'guide'),
('Review', 'review')
ON CONFLICT (slug) DO NOTHING;

-- Create admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role, is_verified) VALUES
('admin@blog.com', '$2b$10$rQZ8kHWKtGY5uJQJ5vQJ5eKQJ5vQJ5eKQJ5vQJ5eKQJ5vQJ5eKQJ5e', 'Admin User', 'admin', true)
ON CONFLICT (email) DO NOTHING;
