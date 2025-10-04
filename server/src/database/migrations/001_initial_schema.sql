-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
    icon VARCHAR(50), -- Icon name or class
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create affiliate_links table
CREATE TABLE affiliate_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    url TEXT NOT NULL, -- Original URL
    affiliate_url TEXT NOT NULL, -- Affiliate tracking URL
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    tags TEXT[] DEFAULT '{}', -- Array of tags
    image_url TEXT, -- Logo or preview image
    commission_rate DECIMAL(5,2), -- Commission percentage (e.g., 10.50 for 10.5%)
    featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create click_events table for analytics
CREATE TABLE click_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    link_id UUID NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    referrer TEXT,
    ip_address INET,
    session_id VARCHAR(255),
    country_code VARCHAR(2), -- For future geo-analytics
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_affiliate_links_category_id ON affiliate_links(category_id);
CREATE INDEX idx_affiliate_links_status ON affiliate_links(status);
CREATE INDEX idx_affiliate_links_featured ON affiliate_links(featured);
CREATE INDEX idx_affiliate_links_created_at ON affiliate_links(created_at);
CREATE INDEX idx_affiliate_links_click_count ON affiliate_links(click_count);

-- Full-text search index for affiliate links
-- Note: We'll create this index after creating the function to make it immutable
CREATE OR REPLACE FUNCTION affiliate_links_search_vector(title text, description text, tags text[])
RETURNS tsvector
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT to_tsvector('english', title || ' ' || description || ' ' || array_to_string(tags, ' '));
$$;

CREATE INDEX idx_affiliate_links_search ON affiliate_links USING gin(
    affiliate_links_search_vector(title, description, tags)
);

-- Indexes for click_events
CREATE INDEX idx_click_events_link_id ON click_events(link_id);
CREATE INDEX idx_click_events_timestamp ON click_events(timestamp);
CREATE INDEX idx_click_events_session_id ON click_events(session_id);

-- Indexes for categories
CREATE INDEX idx_categories_slug ON categories(slug);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_links_updated_at 
    BEFORE UPDATE ON affiliate_links 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update click count when click event is inserted
CREATE OR REPLACE FUNCTION update_link_click_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE affiliate_links 
    SET click_count = click_count + 1 
    WHERE id = NEW.link_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update click count
CREATE TRIGGER update_click_count_trigger
    AFTER INSERT ON click_events
    FOR EACH ROW EXECUTE FUNCTION update_link_click_count();