import type { AffiliateLink, Category, FilterState, SortOption } from '../types'

/**
 * Filters affiliate links based on the provided filter state
 */
export function filterAffiliateLinks(links: AffiliateLink[], filters: FilterState): AffiliateLink[] {
  return links.filter(link => {
    // Category filter
    if (filters.categories.length > 0 && !filters.categories.includes(link.category.id)) {
      return false
    }

    // Commission rate filter
    if (filters.commissionRateMin !== undefined && (link.commissionRate || 0) < filters.commissionRateMin) {
      return false
    }

    if (filters.commissionRateMax !== undefined && (link.commissionRate || 0) > filters.commissionRateMax) {
      return false
    }

    // Featured filter
    if (filters.featuredOnly && !link.featured) {
      return false
    }

    // Search query filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase()
      const searchableText = [
        link.title,
        link.description,
        link.category.name,
        ...link.tags
      ].join(' ').toLowerCase()

      if (!searchableText.includes(query)) {
        return false
      }
    }

    return true
  })
}

/**
 * Sorts affiliate links based on the provided sort option
 */
export function sortAffiliateLinks(links: AffiliateLink[], sortBy: SortOption): AffiliateLink[] {
  const sortedLinks = [...links]

  switch (sortBy) {
    case 'popularity':
      return sortedLinks.sort((a, b) => b.clickCount - a.clickCount)
    
    case 'newest':
      return sortedLinks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    case 'commission':
      return sortedLinks.sort((a, b) => (b.commissionRate || 0) - (a.commissionRate || 0))
    
    case 'alphabetical':
      return sortedLinks.sort((a, b) => a.title.localeCompare(b.title))
    
    default:
      return sortedLinks
  }
}

/**
 * Searches affiliate links by query string
 */
export function searchAffiliateLinks(links: AffiliateLink[], query: string): AffiliateLink[] {
  if (!query.trim()) {
    return links
  }

  const searchTerm = query.toLowerCase()
  
  return links.filter(link => {
    const searchableFields = [
      link.title,
      link.description,
      link.category.name,
      ...link.tags
    ].join(' ').toLowerCase()

    return searchableFields.includes(searchTerm)
  })
}

/**
 * Groups affiliate links by category
 */
export function groupLinksByCategory(links: AffiliateLink[]): Record<string, AffiliateLink[]> {
  return links.reduce((groups, link) => {
    const categoryId = link.category.id
    if (!groups[categoryId]) {
      groups[categoryId] = []
    }
    groups[categoryId].push(link)
    return groups
  }, {} as Record<string, AffiliateLink[]>)
}

/**
 * Calculates category statistics
 */
export function calculateCategoryStats(links: AffiliateLink[], categories: Category[]) {
  const linksByCategory = groupLinksByCategory(links)
  
  return categories.map(category => ({
    ...category,
    linkCount: linksByCategory[category.id]?.length || 0,
    totalClicks: linksByCategory[category.id]?.reduce((sum, link) => sum + link.clickCount, 0) || 0,
    averageCommission: linksByCategory[category.id]?.length 
      ? linksByCategory[category.id].reduce((sum, link) => sum + (link.commissionRate || 0), 0) / linksByCategory[category.id].length
      : 0
  }))
}

/**
 * Formats commission rate as percentage
 */
export function formatCommissionRate(rate?: number): string {
  if (rate === undefined || rate === null) {
    return 'N/A'
  }
  return `${rate.toFixed(1)}%`
}

/**
 * Formats click count with appropriate units
 */
export function formatClickCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

/**
 * Calculates time ago from a date
 */
export function timeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`
}

/**
 * Truncates text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Generates a random ID (for mock data)
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

/**
 * Highlights search terms in text
 */
export function highlightSearchText(text: string, searchQuery: string): string {
  if (!searchQuery.trim()) {
    return text
  }

  const regex = new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}