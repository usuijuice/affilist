import { describe, it, expect } from 'vitest'
import {
  filterAffiliateLinks,
  sortAffiliateLinks,
  searchAffiliateLinks,
  groupLinksByCategory,
  calculateCategoryStats,
  formatCommissionRate,
  formatClickCount,
  timeAgo,
  truncateText,
  generateId,
  highlightSearchText
} from '../helpers'
import { createMockAffiliateLink, createMockCategory, createMockAffiliateLinks } from '../../test/factories'
import type { FilterState } from '../../types'

describe('filterAffiliateLinks', () => {
  const category1 = createMockCategory({ id: 'cat1', name: 'Web Dev' })
  const category2 = createMockCategory({ id: 'cat2', name: 'Design' })
  
  const links = [
    createMockAffiliateLink({ 
      id: 'link1', 
      category: category1, 
      commissionRate: 10, 
      featured: true,
      title: 'React Framework',
      tags: ['react', 'frontend']
    }),
    createMockAffiliateLink({ 
      id: 'link2', 
      category: category2, 
      commissionRate: 20, 
      featured: false,
      title: 'Design Tool',
      tags: ['design', 'ui']
    }),
    createMockAffiliateLink({ 
      id: 'link3', 
      category: category1, 
      commissionRate: 15, 
      featured: true,
      title: 'Vue Framework',
      tags: ['vue', 'frontend']
    })
  ]

  it('should filter by categories', () => {
    const filters: FilterState = {
      categories: ['cat1'],
      commissionRateMin: undefined,
      commissionRateMax: undefined,
      featuredOnly: false,
      searchQuery: '',
      sortBy: 'popularity'
    }

    const result = filterAffiliateLinks(links, filters)
    expect(result).toHaveLength(2)
    expect(result.every(link => link.category.id === 'cat1')).toBe(true)
  })

  it('should filter by commission rate range', () => {
    const filters: FilterState = {
      categories: [],
      commissionRateMin: 15,
      commissionRateMax: 25,
      featuredOnly: false,
      searchQuery: '',
      sortBy: 'popularity'
    }

    const result = filterAffiliateLinks(links, filters)
    expect(result).toHaveLength(2)
    expect(result.every(link => (link.commissionRate || 0) >= 15 && (link.commissionRate || 0) <= 25)).toBe(true)
  })

  it('should filter by featured status', () => {
    const filters: FilterState = {
      categories: [],
      commissionRateMin: undefined,
      commissionRateMax: undefined,
      featuredOnly: true,
      searchQuery: '',
      sortBy: 'popularity'
    }

    const result = filterAffiliateLinks(links, filters)
    expect(result).toHaveLength(2)
    expect(result.every(link => link.featured)).toBe(true)
  })

  it('should filter by search query', () => {
    const filters: FilterState = {
      categories: [],
      commissionRateMin: undefined,
      commissionRateMax: undefined,
      featuredOnly: false,
      searchQuery: 'react',
      sortBy: 'popularity'
    }

    const result = filterAffiliateLinks(links, filters)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('React Framework')
  })

  it('should combine multiple filters', () => {
    const filters: FilterState = {
      categories: ['cat1'],
      commissionRateMin: undefined,
      commissionRateMax: undefined,
      featuredOnly: true,
      searchQuery: 'framework',
      sortBy: 'popularity'
    }

    const result = filterAffiliateLinks(links, filters)
    expect(result).toHaveLength(2)
  })
})

describe('sortAffiliateLinks', () => {
  const links = [
    createMockAffiliateLink({ 
      id: 'link1', 
      title: 'B Tool',
      clickCount: 100, 
      commissionRate: 10,
      createdAt: new Date('2024-01-01')
    }),
    createMockAffiliateLink({ 
      id: 'link2', 
      title: 'A Tool',
      clickCount: 200, 
      commissionRate: 20,
      createdAt: new Date('2024-01-02')
    }),
    createMockAffiliateLink({ 
      id: 'link3', 
      title: 'C Tool',
      clickCount: 50, 
      commissionRate: 15,
      createdAt: new Date('2024-01-03')
    })
  ]

  it('should sort by popularity (click count)', () => {
    const result = sortAffiliateLinks(links, 'popularity')
    expect(result[0].clickCount).toBe(200)
    expect(result[1].clickCount).toBe(100)
    expect(result[2].clickCount).toBe(50)
  })

  it('should sort by newest', () => {
    const result = sortAffiliateLinks(links, 'newest')
    expect(result[0].createdAt.getTime()).toBeGreaterThan(result[1].createdAt.getTime())
    expect(result[1].createdAt.getTime()).toBeGreaterThan(result[2].createdAt.getTime())
  })

  it('should sort by commission rate', () => {
    const result = sortAffiliateLinks(links, 'commission')
    expect(result[0].commissionRate).toBe(20)
    expect(result[1].commissionRate).toBe(15)
    expect(result[2].commissionRate).toBe(10)
  })

  it('should sort alphabetically', () => {
    const result = sortAffiliateLinks(links, 'alphabetical')
    expect(result[0].title).toBe('A Tool')
    expect(result[1].title).toBe('B Tool')
    expect(result[2].title).toBe('C Tool')
  })
})

describe('searchAffiliateLinks', () => {
  const links = [
    createMockAffiliateLink({ 
      title: 'React Development Tool',
      description: 'A tool for React developers',
      tags: ['react', 'frontend']
    }),
    createMockAffiliateLink({ 
      title: 'Vue Framework',
      description: 'Progressive JavaScript framework',
      tags: ['vue', 'javascript']
    })
  ]

  it('should search by title', () => {
    const result = searchAffiliateLinks(links, 'react')
    expect(result).toHaveLength(1)
    expect(result[0].title).toContain('React')
  })

  it('should search by description', () => {
    const result = searchAffiliateLinks(links, 'progressive')
    expect(result).toHaveLength(1)
    expect(result[0].description).toContain('Progressive')
  })

  it('should search by tags', () => {
    const result = searchAffiliateLinks(links, 'javascript')
    expect(result).toHaveLength(1)
    expect(result[0].tags).toContain('javascript')
  })

  it('should return all links for empty query', () => {
    const result = searchAffiliateLinks(links, '')
    expect(result).toHaveLength(2)
  })
})

describe('groupLinksByCategory', () => {
  const category1 = createMockCategory({ id: 'cat1' })
  const category2 = createMockCategory({ id: 'cat2' })
  
  const links = [
    createMockAffiliateLink({ category: category1 }),
    createMockAffiliateLink({ category: category1 }),
    createMockAffiliateLink({ category: category2 })
  ]

  it('should group links by category', () => {
    const result = groupLinksByCategory(links)
    expect(result['cat1']).toHaveLength(2)
    expect(result['cat2']).toHaveLength(1)
  })
})

describe('calculateCategoryStats', () => {
  const category1 = createMockCategory({ id: 'cat1', name: 'Web Dev' })
  const category2 = createMockCategory({ id: 'cat2', name: 'Design' })
  
  const links = [
    createMockAffiliateLink({ category: category1, clickCount: 100, commissionRate: 10 }),
    createMockAffiliateLink({ category: category1, clickCount: 200, commissionRate: 20 }),
    createMockAffiliateLink({ category: category2, clickCount: 50, commissionRate: 15 })
  ]

  it('should calculate category statistics', () => {
    const result = calculateCategoryStats(links, [category1, category2])
    
    const cat1Stats = result.find(cat => cat.id === 'cat1')
    expect(cat1Stats?.linkCount).toBe(2)
    expect(cat1Stats?.totalClicks).toBe(300)
    expect(cat1Stats?.averageCommission).toBe(15)

    const cat2Stats = result.find(cat => cat.id === 'cat2')
    expect(cat2Stats?.linkCount).toBe(1)
    expect(cat2Stats?.totalClicks).toBe(50)
    expect(cat2Stats?.averageCommission).toBe(15)
  })
})

describe('formatCommissionRate', () => {
  it('should format commission rate as percentage', () => {
    expect(formatCommissionRate(15.5)).toBe('15.5%')
    expect(formatCommissionRate(10)).toBe('10.0%')
  })

  it('should handle undefined rate', () => {
    expect(formatCommissionRate(undefined)).toBe('N/A')
    expect(formatCommissionRate(null as any)).toBe('N/A')
  })
})

describe('formatClickCount', () => {
  it('should format large numbers with units', () => {
    expect(formatClickCount(1500000)).toBe('1.5M')
    expect(formatClickCount(2500)).toBe('2.5K')
    expect(formatClickCount(500)).toBe('500')
  })
})

describe('timeAgo', () => {
  it('should format time differences correctly', () => {
    const now = new Date()
    
    // Just now
    const justNow = new Date(now.getTime() - 30 * 1000)
    expect(timeAgo(justNow)).toBe('just now')
    
    // Minutes ago
    const minutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    expect(timeAgo(minutesAgo)).toBe('5 minutes ago')
    
    // Hours ago
    const hoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)
    expect(timeAgo(hoursAgo)).toBe('3 hours ago')
    
    // Days ago
    const daysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
    expect(timeAgo(daysAgo)).toBe('5 days ago')
  })
})

describe('truncateText', () => {
  it('should truncate long text with ellipsis', () => {
    const longText = 'This is a very long text that should be truncated'
    const result = truncateText(longText, 20)
    expect(result).toBe('This is a very lo...')
    expect(result.length).toBe(20)
  })

  it('should not truncate short text', () => {
    const shortText = 'Short text'
    const result = truncateText(shortText, 20)
    expect(result).toBe('Short text')
  })
})

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
    expect(typeof id1).toBe('string')
    expect(id1.length).toBeGreaterThan(0)
  })
})

describe('highlightSearchText', () => {
  it('should highlight matching text with mark tags', () => {
    const result = highlightSearchText('Hello world', 'world')
    expect(result).toBe('Hello <mark class="bg-yellow-200 px-1 rounded">world</mark>')
  })

  it('should be case insensitive', () => {
    const result = highlightSearchText('Hello World', 'world')
    expect(result).toBe('Hello <mark class="bg-yellow-200 px-1 rounded">World</mark>')
  })

  it('should highlight multiple matches', () => {
    const result = highlightSearchText('Hello world, wonderful world', 'world')
    expect(result).toBe('Hello <mark class="bg-yellow-200 px-1 rounded">world</mark>, wonderful <mark class="bg-yellow-200 px-1 rounded">world</mark>')
  })

  it('should escape special regex characters', () => {
    const result = highlightSearchText('Price: $10.99', '$10.99')
    expect(result).toBe('Price: <mark class="bg-yellow-200 px-1 rounded">$10.99</mark>')
  })

  it('should handle parentheses', () => {
    const result = highlightSearchText('Test (special) case', '(special)')
    expect(result).toBe('Test <mark class="bg-yellow-200 px-1 rounded">(special)</mark> case')
  })

  it('should return original text when no search query', () => {
    const result = highlightSearchText('Hello world', '')
    expect(result).toBe('Hello world')
  })

  it('should return original text when no match found', () => {
    const result = highlightSearchText('Hello world', 'xyz')
    expect(result).toBe('Hello world')
  })

  it('should handle whitespace-only search query', () => {
    const result = highlightSearchText('Hello world', '   ')
    expect(result).toBe('Hello world')
  })
})