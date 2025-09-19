import type { AffiliateLink, Category, ClickEvent, AdminUser, CreateLinkRequest } from '../types'

// URL validation regex
const URL_REGEX = /^https?:\/\/.+/

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validates an affiliate link object
 */
export function validateAffiliateLink(link: Partial<AffiliateLink>): string[] {
  const errors: string[] = []

  if (!link.title || link.title.trim().length === 0) {
    errors.push('Title is required')
  } else if (link.title.length > 200) {
    errors.push('Title must be 200 characters or less')
  }

  if (!link.description || link.description.trim().length === 0) {
    errors.push('Description is required')
  } else if (link.description.length > 1000) {
    errors.push('Description must be 1000 characters or less')
  }

  if (!link.url || !URL_REGEX.test(link.url)) {
    errors.push('Valid URL is required')
  }

  if (!link.affiliateUrl || !URL_REGEX.test(link.affiliateUrl)) {
    errors.push('Valid affiliate URL is required')
  }

  if (!link.category || !link.category.id) {
    errors.push('Category is required')
  }

  if (link.commissionRate !== undefined && (link.commissionRate < 0 || link.commissionRate > 100)) {
    errors.push('Commission rate must be between 0 and 100')
  }

  if (link.tags && link.tags.length > 10) {
    errors.push('Maximum 10 tags allowed')
  }

  if (link.imageUrl && !URL_REGEX.test(link.imageUrl)) {
    errors.push('Image URL must be a valid URL')
  }

  return errors
}

/**
 * Validates a category object
 */
export function validateCategory(category: Partial<Category>): string[] {
  const errors: string[] = []

  if (!category.name || category.name.trim().length === 0) {
    errors.push('Category name is required')
  } else if (category.name.length > 100) {
    errors.push('Category name must be 100 characters or less')
  }

  if (!category.slug || category.slug.trim().length === 0) {
    errors.push('Category slug is required')
  } else if (!/^[a-z0-9-]+$/.test(category.slug)) {
    errors.push('Category slug must contain only lowercase letters, numbers, and hyphens')
  }

  if (!category.description || category.description.trim().length === 0) {
    errors.push('Category description is required')
  } else if (category.description.length > 500) {
    errors.push('Category description must be 500 characters or less')
  }

  if (!category.color || !/^#[0-9A-Fa-f]{6}$/.test(category.color)) {
    errors.push('Category color must be a valid hex color code')
  }

  return errors
}

/**
 * Validates a click event object
 */
export function validateClickEvent(event: Partial<ClickEvent>): string[] {
  const errors: string[] = []

  if (!event.linkId || event.linkId.trim().length === 0) {
    errors.push('Link ID is required')
  }

  if (!event.userAgent || event.userAgent.trim().length === 0) {
    errors.push('User agent is required')
  }

  if (!event.ipAddress || event.ipAddress.trim().length === 0) {
    errors.push('IP address is required')
  }

  if (!event.sessionId || event.sessionId.trim().length === 0) {
    errors.push('Session ID is required')
  }

  if (event.referrer && !URL_REGEX.test(event.referrer)) {
    errors.push('Referrer must be a valid URL')
  }

  return errors
}

/**
 * Validates an admin user object
 */
export function validateAdminUser(user: Partial<AdminUser>): string[] {
  const errors: string[] = []

  if (!user.email || !EMAIL_REGEX.test(user.email)) {
    errors.push('Valid email is required')
  }

  if (!user.name || user.name.trim().length === 0) {
    errors.push('Name is required')
  } else if (user.name.length > 100) {
    errors.push('Name must be 100 characters or less')
  }

  if (!user.role || !['admin', 'editor'].includes(user.role)) {
    errors.push('Role must be either admin or editor')
  }

  return errors
}

/**
 * Validates a create link request
 */
export function validateCreateLinkRequest(request: Partial<CreateLinkRequest>): string[] {
  const errors: string[] = []

  if (!request.title || request.title.trim().length === 0) {
    errors.push('Title is required')
  } else if (request.title.length > 200) {
    errors.push('Title must be 200 characters or less')
  }

  if (!request.description || request.description.trim().length === 0) {
    errors.push('Description is required')
  } else if (request.description.length > 1000) {
    errors.push('Description must be 1000 characters or less')
  }

  if (!request.url || !URL_REGEX.test(request.url)) {
    errors.push('Valid URL is required')
  }

  if (!request.affiliateUrl || !URL_REGEX.test(request.affiliateUrl)) {
    errors.push('Valid affiliate URL is required')
  }

  if (!request.categoryId || request.categoryId.trim().length === 0) {
    errors.push('Category ID is required')
  }

  if (request.commissionRate !== undefined && (request.commissionRate < 0 || request.commissionRate > 100)) {
    errors.push('Commission rate must be between 0 and 100')
  }

  if (request.tags && request.tags.length > 10) {
    errors.push('Maximum 10 tags allowed')
  }

  if (request.imageUrl && !URL_REGEX.test(request.imageUrl)) {
    errors.push('Image URL must be a valid URL')
  }

  return errors
}

/**
 * Sanitizes a string by trimming whitespace and removing potentially harmful characters
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

/**
 * Generates a URL-friendly slug from a string
 */
export function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Validates if a string is a valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}