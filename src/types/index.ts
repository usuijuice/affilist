// Core data types for the affiliate link aggregator

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon?: string;
  linkCount: number;
}

export interface AffiliateLink {
  id: string;
  title: string;
  description: string;
  url: string;
  affiliateUrl: string;
  category: Category;
  tags: string[];
  imageUrl?: string;
  commissionRate?: number;
  featured: boolean;
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive' | 'pending';
}

export interface ClickEvent {
  id: string;
  linkId: string;
  timestamp: Date;
  userAgent: string;
  referrer?: string;
  ipAddress: string;
  sessionId: string;
}

// Click tracking types
export interface ClickTrackingData {
  linkId: string;
  timestamp: Date;
  userAgent: string;
  referrer?: string;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface SessionData {
  sessionId: string;
  userId?: string;
  startTime: Date;
  lastActivity: Date;
  userAgent: string;
  referrer?: string;
  clickCount: number;
}

export interface ClickTrackingConfig {
  enableTracking: boolean;
  sessionTimeout: number; // in milliseconds
  batchSize: number;
  flushInterval: number; // in milliseconds
  enableLocalStorage: boolean;
  enableAnalytics: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
  lastLogin: Date;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AdminUser;
  token: string;
  expiresAt: Date;
}

export interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface FilterState {
  categories: string[];
  commissionRateMin?: number;
  commissionRateMax?: number;
  featuredOnly: boolean;
  searchQuery: string;
  sortBy: SortOption;
}

export type SortOption =
  | 'popularity'
  | 'newest'
  | 'commission'
  | 'alphabetical';

// API response types
export interface GetLinksResponse {
  links: AffiliateLink[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface GetCategoriesResponse {
  categories: Category[];
}

export interface CreateLinkRequest {
  title: string;
  description: string;
  url: string;
  affiliateUrl: string;
  categoryId: string;
  tags: string[];
  imageUrl?: string;
  commissionRate?: number;
  featured: boolean;
}

export interface AnalyticsResponse {
  totalClicks: number;
  totalRevenue: number;
  topLinks: Array<{
    link: AffiliateLink;
    clicks: number;
    revenue: number;
  }>;
  clicksByDate: Array<{
    date: string;
    clicks: number;
  }>;
}
