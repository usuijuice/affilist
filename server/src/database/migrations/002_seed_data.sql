-- Insert default categories
INSERT INTO categories (name, slug, description, color, icon) VALUES
('Web Development', 'web-development', 'Tools and services for web developers', '#3B82F6', 'code'),
('Design', 'design', 'Design tools and resources', '#8B5CF6', 'palette'),
('Marketing', 'marketing', 'Marketing and analytics tools', '#EF4444', 'megaphone'),
('Productivity', 'productivity', 'Productivity and collaboration tools', '#10B981', 'zap'),
('E-commerce', 'ecommerce', 'E-commerce platforms and tools', '#F59E0B', 'shopping-cart'),
('Education', 'education', 'Online learning and educational resources', '#06B6D4', 'book-open'),
('Finance', 'finance', 'Financial tools and services', '#84CC16', 'dollar-sign'),
('Hosting', 'hosting', 'Web hosting and cloud services', '#6366F1', 'server');

-- Create default admin user (password: admin123)
-- Note: In production, this should be created through a secure process
INSERT INTO admin_users (email, name, password_hash, role) VALUES
('admin@affilist.com', 'Admin User', '$2a$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQ', 'admin');

-- Insert sample affiliate links
INSERT INTO affiliate_links (title, description, url, affiliate_url, category_id, tags, commission_rate, featured) 
SELECT 
    'GitHub Pro',
    'Advanced collaboration features for software development teams',
    'https://github.com/pricing',
    'https://github.com/pricing?ref=affilist',
    c.id,
    ARRAY['git', 'collaboration', 'development'],
    5.00,
    true
FROM categories c WHERE c.slug = 'web-development';

INSERT INTO affiliate_links (title, description, url, affiliate_url, category_id, tags, commission_rate, featured)
SELECT 
    'Figma Professional',
    'Professional design tool for teams',
    'https://figma.com/pricing',
    'https://figma.com/pricing?ref=affilist',
    c.id,
    ARRAY['design', 'ui', 'collaboration'],
    10.00,
    true
FROM categories c WHERE c.slug = 'design';

INSERT INTO affiliate_links (title, description, url, affiliate_url, category_id, tags, commission_rate, featured)
SELECT 
    'Google Analytics 360',
    'Advanced analytics for enterprise websites',
    'https://marketingplatform.google.com/about/analytics-360/',
    'https://marketingplatform.google.com/about/analytics-360/?ref=affilist',
    c.id,
    ARRAY['analytics', 'tracking', 'enterprise'],
    15.00,
    false
FROM categories c WHERE c.slug = 'marketing';

INSERT INTO affiliate_links (title, description, url, affiliate_url, category_id, tags, commission_rate, featured)
SELECT 
    'Notion Pro',
    'All-in-one workspace for notes, tasks, and collaboration',
    'https://notion.so/pricing',
    'https://notion.so/pricing?ref=affilist',
    c.id,
    ARRAY['productivity', 'notes', 'collaboration'],
    20.00,
    true
FROM categories c WHERE c.slug = 'productivity';

INSERT INTO affiliate_links (title, description, url, affiliate_url, category_id, tags, commission_rate, featured)
SELECT 
    'Shopify Plus',
    'Enterprise e-commerce platform',
    'https://shopify.com/plus',
    'https://shopify.com/plus?ref=affilist',
    c.id,
    ARRAY['ecommerce', 'enterprise', 'platform'],
    25.00,
    true
FROM categories c WHERE c.slug = 'ecommerce';

INSERT INTO affiliate_links (title, description, url, affiliate_url, category_id, tags, commission_rate, featured)
SELECT 
    'Coursera Plus',
    'Unlimited access to online courses and certificates',
    'https://coursera.org/courseraplus',
    'https://coursera.org/courseraplus?ref=affilist',
    c.id,
    ARRAY['education', 'courses', 'certificates'],
    30.00,
    false
FROM categories c WHERE c.slug = 'education';

INSERT INTO affiliate_links (title, description, url, affiliate_url, category_id, tags, commission_rate, featured)
SELECT 
    'QuickBooks Online',
    'Cloud-based accounting software for small businesses',
    'https://quickbooks.intuit.com/pricing/',
    'https://quickbooks.intuit.com/pricing/?ref=affilist',
    c.id,
    ARRAY['accounting', 'finance', 'small-business'],
    35.00,
    false
FROM categories c WHERE c.slug = 'finance';

INSERT INTO affiliate_links (title, description, url, affiliate_url, category_id, tags, commission_rate, featured)
SELECT 
    'DigitalOcean',
    'Cloud infrastructure for developers',
    'https://digitalocean.com/pricing',
    'https://digitalocean.com/pricing?ref=affilist',
    c.id,
    ARRAY['hosting', 'cloud', 'infrastructure'],
    40.00,
    true
FROM categories c WHERE c.slug = 'hosting';