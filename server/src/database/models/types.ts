// Database model types matching the schema

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface AffiliateLink {
  id: string;
  title: string;
  description: string;
  url: string;
  affiliate_url: string;
  category_id: string;
  tags: string[];
  image_url: string | null;
  commission_rate: number | null;
  featured: boolean;
  status: 'active' | 'inactive' | 'pending';
  click_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ClickEvent {
  id: string;
  link_id: string;
  timestamp: Date;
  user_agent: string | null;
  referrer: string | null;
  ip_address: string | null;
  session_id: string | null;
  country_code: string | null;
  created_at: Date;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: 'admin' | 'editor';
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Input types for creating/updating records
export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface CreateAffiliateLinkInput {
  title: string;
  description: string;
  url: string;
  affiliate_url: string;
  category_id: string;
  tags?: string[];
  image_url?: string;
  commission_rate?: number;
  featured?: boolean;
  status?: 'active' | 'inactive' | 'pending';
}

export interface UpdateAffiliateLinkInput {
  title?: string;
  description?: string;
  url?: string;
  affiliate_url?: string;
  category_id?: string;
  tags?: string[];
  image_url?: string;
  commission_rate?: number;
  featured?: boolean;
  status?: 'active' | 'inactive' | 'pending';
}

export interface CreateClickEventInput {
  link_id: string;
  user_agent?: string;
  referrer?: string;
  ip_address?: string;
  session_id?: string;
  country_code?: string;
}

export interface CreateAdminUserInput {
  email: string;
  name: string;
  password_hash: string;
  role?: 'admin' | 'editor';
}

export interface UpdateAdminUserInput {
  email?: string;
  name?: string;
  password_hash?: string;
  role?: 'admin' | 'editor';
  last_login?: Date;
}

// Query filter types
export interface AffiliateLinkFilters {
  category_id?: string;
  status?: 'active' | 'inactive' | 'pending';
  featured?: boolean;
  search?: string;
  tags?: string[];
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}