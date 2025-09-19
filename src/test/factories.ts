import type { AffiliateLink, Category, ClickEvent, AdminUser, CreateLinkRequest } from '../types'

/**
 * Creates a mock category with optional overrides
 */
export function createMockCategory(overrides: Partial<Category> = {}): Category {
  const defaultCategory: Category = {
    id: `cat-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Web Development',
    slug: 'web-development',
    description: 'Tools and services for web developers',
    color: '#3B82F6',
    icon: '💻',
    linkCount: 5
  }

  return { ...defaultCategory, ...overrides }
}

/**
 * Creates a mock affiliate link with optional overrides
 */
export function createMockAffiliateLink(overrides: Partial<AffiliateLink> = {}): AffiliateLink {
  const category = overrides.category || createMockCategory()
  
  const defaultLink: AffiliateLink = {
    id: `link-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Awesome Development Tool',
    description: 'A fantastic tool that helps developers build amazing applications faster and more efficiently.',
    url: 'https://example.com',
    affiliateUrl: 'https://affiliate.example.com/ref123',
    category,
    tags: ['development', 'productivity', 'tools'],
    imageUrl: 'https://example.com/logo.png',
    commissionRate: 15.5,
    featured: false,
    clickCount: 42,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-20T14:45:00Z'),
    status: 'active'
  }

  return { ...defaultLink, ...overrides }
}

/**
 * Creates a mock click event with optional overrides
 */
export function createMockClickEvent(overrides: Partial<ClickEvent> = {}): ClickEvent {
  const defaultEvent: ClickEvent = {
    id: `click-${Math.random().toString(36).substr(2, 9)}`,
    linkId: `link-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    referrer: 'https://google.com',
    ipAddress: '192.168.1.1',
    sessionId: `session-${Math.random().toString(36).substr(2, 9)}`
  }

  return { ...defaultEvent, ...overrides }
}

/**
 * Creates a mock admin user with optional overrides
 */
export function createMockAdminUser(overrides: Partial<AdminUser> = {}): AdminUser {
  const defaultUser: AdminUser = {
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    email: 'admin@example.com',
    name: 'John Admin',
    role: 'admin',
    lastLogin: new Date('2024-01-20T09:00:00Z')
  }

  return { ...defaultUser, ...overrides }
}

/**
 * Creates a mock create link request with optional overrides
 */
export function createMockCreateLinkRequest(overrides: Partial<CreateLinkRequest> = {}): CreateLinkRequest {
  const defaultRequest: CreateLinkRequest = {
    title: 'New Affiliate Link',
    description: 'A new affiliate link for testing purposes',
    url: 'https://example.com',
    affiliateUrl: 'https://affiliate.example.com/ref456',
    categoryId: 'cat-123',
    tags: ['test', 'example'],
    imageUrl: 'https://example.com/image.png',
    commissionRate: 10.0,
    featured: false
  }

  return { ...defaultRequest, ...overrides }
}

/**
 * Creates multiple mock affiliate links
 */
export function createMockAffiliateLinks(count: number, overrides: Partial<AffiliateLink> = {}): AffiliateLink[] {
  return Array.from({ length: count }, (_, index) => 
    createMockAffiliateLink({
      ...overrides,
      title: `${overrides.title || 'Test Link'} ${index + 1}`,
      clickCount: Math.floor(Math.random() * 1000),
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
    })
  )
}

/**
 * Creates multiple mock categories
 */
export function createMockCategories(count: number = 5): Category[] {
  const categoryNames = [
    'Web Development',
    'Design Tools',
    'Marketing',
    'Analytics',
    'E-commerce',
    'Productivity',
    'Cloud Services',
    'Security',
    'Mobile Development',
    'AI & Machine Learning'
  ]

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ]

  const icons = ['💻', '🎨', '📈', '📊', '🛒', '⚡', '☁️', '🔒', '📱', '🤖']

  return Array.from({ length: Math.min(count, categoryNames.length) }, (_, index) => 
    createMockCategory({
      name: categoryNames[index],
      slug: categoryNames[index].toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: `Tools and services for ${categoryNames[index].toLowerCase()}`,
      color: colors[index],
      icon: icons[index],
      linkCount: Math.floor(Math.random() * 20) + 1
    })
  )
}

/**
 * Creates a complete mock dataset for testing
 */
export function createMockDataset() {
  const categories = createMockCategories(5)
  const links = categories.flatMap(category => 
    createMockAffiliateLinks(Math.floor(Math.random() * 5) + 2, { category })
  )
  const users = [
    createMockAdminUser({ role: 'admin' }),
    createMockAdminUser({ role: 'editor', email: 'editor@example.com', name: 'Jane Editor' })
  ]
  const clickEvents = links.flatMap(link => 
    Array.from({ length: Math.floor(Math.random() * 10) }, () => 
      createMockClickEvent({ linkId: link.id })
    )
  )

  return {
    categories,
    links,
    users,
    clickEvents
  }
}