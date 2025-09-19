# Design Document

## Overview

The affiliate link aggregator will be built as a modern React single-page application (SPA) with a clean, responsive design similar to freelance.indieverse.co.jp. The application will feature a component-based architecture with state management, routing, and a backend API for data persistence and analytics.

## Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **State Management**: React Context API with useReducer for global state, local state for component-specific data
- **Routing**: React Router v6 for client-side navigation
- **Styling**: Tailwind CSS for utility-first styling with custom components
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **API**: Node.js with Express.js RESTful API
- **Database**: PostgreSQL for relational data with proper indexing
- **Authentication**: JWT tokens for admin authentication
- **File Storage**: Local file system for images with CDN consideration for production

### Deployment Architecture
- **Frontend**: Static hosting (Vercel/Netlify) with CDN
- **Backend**: Node.js hosting (Railway/Render) with environment-based configuration
- **Database**: Managed PostgreSQL instance

## Components and Interfaces

### Core Components

#### 1. Layout Components
```typescript
// Header component with navigation and search
interface HeaderProps {
  onSearch: (query: string) => void;
  searchQuery: string;
}

// Footer component with links and information
interface FooterProps {
  categories: Category[];
}

// Main layout wrapper
interface LayoutProps {
  children: React.ReactNode;
}
```

#### 2. Affiliate Link Components
```typescript
// Individual affiliate link card
interface AffiliateLinkCardProps {
  link: AffiliateLink;
  onLinkClick: (linkId: string) => void;
  featured?: boolean;
}

// Grid container for affiliate links
interface AffiliateLinkGridProps {
  links: AffiliateLink[];
  loading: boolean;
  onLinkClick: (linkId: string) => void;
}

// Detailed view modal/page for affiliate links
interface AffiliateLinkDetailProps {
  link: AffiliateLink;
  onClose: () => void;
}
```

#### 3. Filter and Search Components
```typescript
// Category filter sidebar
interface CategoryFilterProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoryChange: (categoryIds: string[]) => void;
}

// Search and sort controls
interface SearchSortControlsProps {
  searchQuery: string;
  sortBy: SortOption;
  onSearchChange: (query: string) => void;
  onSortChange: (sort: SortOption) => void;
}

// Advanced filters panel
interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}
```

#### 4. Admin Components
```typescript
// Admin dashboard layout
interface AdminDashboardProps {
  user: AdminUser;
}

// Affiliate link management table
interface LinkManagementTableProps {
  links: AffiliateLink[];
  onEdit: (link: AffiliateLink) => void;
  onDelete: (linkId: string) => void;
}

// Link creation/editing form
interface LinkFormProps {
  link?: AffiliateLink;
  onSubmit: (linkData: AffiliateLinkData) => void;
  onCancel: () => void;
}

// Analytics dashboard
interface AnalyticsDashboardProps {
  metrics: AnalyticsData;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}
```

## Data Models

### Core Data Types
```typescript
interface AffiliateLink {
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

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon?: string;
  linkCount: number;
}

interface ClickEvent {
  id: string;
  linkId: string;
  timestamp: Date;
  userAgent: string;
  referrer?: string;
  ipAddress: string;
  sessionId: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
  lastLogin: Date;
}

interface FilterState {
  categories: string[];
  commissionRateMin?: number;
  commissionRateMax?: number;
  featuredOnly: boolean;
  searchQuery: string;
  sortBy: SortOption;
}

type SortOption = 'popularity' | 'newest' | 'commission' | 'alphabetical';
```

### API Interfaces
```typescript
// Public API responses
interface GetLinksResponse {
  links: AffiliateLink[];
  total: number;
  page: number;
  hasMore: boolean;
}

interface GetCategoriesResponse {
  categories: Category[];
}

// Admin API requests/responses
interface CreateLinkRequest {
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

interface AnalyticsResponse {
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
```

## Error Handling

### Frontend Error Handling
- **Error Boundaries**: React error boundaries to catch and display component errors gracefully
- **API Error Handling**: Centralized error handling with user-friendly messages and retry mechanisms
- **Form Validation**: Real-time validation with clear error messages
- **Network Errors**: Offline detection and retry logic for failed requests

### Backend Error Handling
- **Validation Errors**: Input validation with detailed error messages
- **Database Errors**: Proper error logging and generic user messages
- **Authentication Errors**: Clear unauthorized/forbidden responses
- **Rate Limiting**: Protection against abuse with appropriate error responses

### Error Recovery Strategies
```typescript
// Error boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// API error handling hook
interface UseApiErrorReturn {
  error: string | null;
  clearError: () => void;
  handleError: (error: unknown) => void;
}

// Retry mechanism for failed requests
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
}
```

## Testing Strategy

### Frontend Testing
- **Unit Tests**: Jest + React Testing Library for component testing
- **Integration Tests**: Testing user workflows and component interactions
- **E2E Tests**: Playwright for critical user journeys
- **Visual Regression**: Chromatic or similar for UI consistency

### Backend Testing
- **Unit Tests**: Jest for business logic and utility functions
- **Integration Tests**: Supertest for API endpoint testing
- **Database Tests**: Test database with proper setup/teardown
- **Performance Tests**: Load testing for high-traffic scenarios

### Test Coverage Goals
- **Frontend**: 80% code coverage with focus on critical user paths
- **Backend**: 90% code coverage for API endpoints and business logic
- **E2E**: Cover all major user workflows and admin functions

### Testing Infrastructure
```typescript
// Test utilities and helpers
interface TestRenderOptions {
  initialState?: Partial<AppState>;
  user?: AdminUser;
}

// Mock data factories
interface MockDataFactory {
  createAffiliateLink: (overrides?: Partial<AffiliateLink>) => AffiliateLink;
  createCategory: (overrides?: Partial<Category>) => Category;
  createClickEvent: (overrides?: Partial<ClickEvent>) => ClickEvent;
}

// API mocking setup
interface ApiMockConfig {
  baseUrl: string;
  handlers: RequestHandler[];
}
```

### Performance Considerations
- **Code Splitting**: Route-based and component-based lazy loading
- **Image Optimization**: WebP format with fallbacks, lazy loading
- **Caching**: Browser caching for static assets, API response caching
- **Bundle Optimization**: Tree shaking, minification, and compression
- **Database Optimization**: Proper indexing, query optimization, connection pooling