import { describe, it, expect } from 'vitest';
import {
  validateAffiliateLink,
  validateCategory,
  validateClickEvent,
  validateAdminUser,
  validateCreateLinkRequest,
  sanitizeString,
  generateSlug,
  isValidUUID,
} from '../validation';
import {
  createMockAffiliateLink,
  createMockCategory,
  createMockClickEvent,
  createMockAdminUser,
  createMockCreateLinkRequest,
} from '../../test/factories';

describe('validateAffiliateLink', () => {
  it('should return no errors for valid affiliate link', () => {
    const validLink = createMockAffiliateLink();
    const errors = validateAffiliateLink(validLink);
    expect(errors).toHaveLength(0);
  });

  it('should return error for missing title', () => {
    const invalidLink = createMockAffiliateLink({ title: '' });
    const errors = validateAffiliateLink(invalidLink);
    expect(errors).toContain('Title is required');
  });

  it('should return error for title too long', () => {
    const invalidLink = createMockAffiliateLink({ title: 'a'.repeat(201) });
    const errors = validateAffiliateLink(invalidLink);
    expect(errors).toContain('Title must be 200 characters or less');
  });

  it('should return error for missing description', () => {
    const invalidLink = createMockAffiliateLink({ description: '' });
    const errors = validateAffiliateLink(invalidLink);
    expect(errors).toContain('Description is required');
  });

  it('should return error for description too long', () => {
    const invalidLink = createMockAffiliateLink({
      description: 'a'.repeat(1001),
    });
    const errors = validateAffiliateLink(invalidLink);
    expect(errors).toContain('Description must be 1000 characters or less');
  });

  it('should return error for invalid URL', () => {
    const invalidLink = createMockAffiliateLink({ url: 'not-a-url' });
    const errors = validateAffiliateLink(invalidLink);
    expect(errors).toContain('Valid URL is required');
  });

  it('should return error for invalid affiliate URL', () => {
    const invalidLink = createMockAffiliateLink({ affiliateUrl: 'not-a-url' });
    const errors = validateAffiliateLink(invalidLink);
    expect(errors).toContain('Valid affiliate URL is required');
  });

  it('should return error for invalid commission rate', () => {
    const invalidLink = createMockAffiliateLink({ commissionRate: 150 });
    const errors = validateAffiliateLink(invalidLink);
    expect(errors).toContain('Commission rate must be between 0 and 100');
  });

  it('should return error for too many tags', () => {
    const invalidLink = createMockAffiliateLink({
      tags: Array(11).fill('tag'),
    });
    const errors = validateAffiliateLink(invalidLink);
    expect(errors).toContain('Maximum 10 tags allowed');
  });

  it('should return error for invalid image URL', () => {
    const invalidLink = createMockAffiliateLink({ imageUrl: 'not-a-url' });
    const errors = validateAffiliateLink(invalidLink);
    expect(errors).toContain('Image URL must be a valid URL');
  });
});

describe('validateCategory', () => {
  it('should return no errors for valid category', () => {
    const validCategory = createMockCategory();
    const errors = validateCategory(validCategory);
    expect(errors).toHaveLength(0);
  });

  it('should return error for missing name', () => {
    const invalidCategory = createMockCategory({ name: '' });
    const errors = validateCategory(invalidCategory);
    expect(errors).toContain('Category name is required');
  });

  it('should return error for name too long', () => {
    const invalidCategory = createMockCategory({ name: 'a'.repeat(101) });
    const errors = validateCategory(invalidCategory);
    expect(errors).toContain('Category name must be 100 characters or less');
  });

  it('should return error for invalid slug', () => {
    const invalidCategory = createMockCategory({ slug: 'Invalid Slug!' });
    const errors = validateCategory(invalidCategory);
    expect(errors).toContain(
      'Category slug must contain only lowercase letters, numbers, and hyphens'
    );
  });

  it('should return error for missing description', () => {
    const invalidCategory = createMockCategory({ description: '' });
    const errors = validateCategory(invalidCategory);
    expect(errors).toContain('Category description is required');
  });

  it('should return error for description too long', () => {
    const invalidCategory = createMockCategory({
      description: 'a'.repeat(501),
    });
    const errors = validateCategory(invalidCategory);
    expect(errors).toContain(
      'Category description must be 500 characters or less'
    );
  });

  it('should return error for invalid color', () => {
    const invalidCategory = createMockCategory({ color: 'red' });
    const errors = validateCategory(invalidCategory);
    expect(errors).toContain('Category color must be a valid hex color code');
  });
});

describe('validateClickEvent', () => {
  it('should return no errors for valid click event', () => {
    const validEvent = createMockClickEvent();
    const errors = validateClickEvent(validEvent);
    expect(errors).toHaveLength(0);
  });

  it('should return error for missing link ID', () => {
    const invalidEvent = createMockClickEvent({ linkId: '' });
    const errors = validateClickEvent(invalidEvent);
    expect(errors).toContain('Link ID is required');
  });

  it('should return error for missing user agent', () => {
    const invalidEvent = createMockClickEvent({ userAgent: '' });
    const errors = validateClickEvent(invalidEvent);
    expect(errors).toContain('User agent is required');
  });

  it('should return error for missing IP address', () => {
    const invalidEvent = createMockClickEvent({ ipAddress: '' });
    const errors = validateClickEvent(invalidEvent);
    expect(errors).toContain('IP address is required');
  });

  it('should return error for missing session ID', () => {
    const invalidEvent = createMockClickEvent({ sessionId: '' });
    const errors = validateClickEvent(invalidEvent);
    expect(errors).toContain('Session ID is required');
  });

  it('should return error for invalid referrer URL', () => {
    const invalidEvent = createMockClickEvent({ referrer: 'not-a-url' });
    const errors = validateClickEvent(invalidEvent);
    expect(errors).toContain('Referrer must be a valid URL');
  });
});

describe('validateAdminUser', () => {
  it('should return no errors for valid admin user', () => {
    const validUser = createMockAdminUser();
    const errors = validateAdminUser(validUser);
    expect(errors).toHaveLength(0);
  });

  it('should return error for invalid email', () => {
    const invalidUser = createMockAdminUser({ email: 'not-an-email' });
    const errors = validateAdminUser(invalidUser);
    expect(errors).toContain('Valid email is required');
  });

  it('should return error for missing name', () => {
    const invalidUser = createMockAdminUser({ name: '' });
    const errors = validateAdminUser(invalidUser);
    expect(errors).toContain('Name is required');
  });

  it('should return error for name too long', () => {
    const invalidUser = createMockAdminUser({ name: 'a'.repeat(101) });
    const errors = validateAdminUser(invalidUser);
    expect(errors).toContain('Name must be 100 characters or less');
  });

  it('should return error for invalid role', () => {
    const invalidUser = createMockAdminUser({ role: 'invalid' as any });
    const errors = validateAdminUser(invalidUser);
    expect(errors).toContain('Role must be either admin or editor');
  });
});

describe('validateCreateLinkRequest', () => {
  it('should return no errors for valid create link request', () => {
    const validRequest = createMockCreateLinkRequest();
    const errors = validateCreateLinkRequest(validRequest);
    expect(errors).toHaveLength(0);
  });

  it('should return error for missing title', () => {
    const invalidRequest = createMockCreateLinkRequest({ title: '' });
    const errors = validateCreateLinkRequest(invalidRequest);
    expect(errors).toContain('Title is required');
  });

  it('should return error for missing category ID', () => {
    const invalidRequest = createMockCreateLinkRequest({ categoryId: '' });
    const errors = validateCreateLinkRequest(invalidRequest);
    expect(errors).toContain('Category ID is required');
  });
});

describe('sanitizeString', () => {
  it('should trim whitespace and remove harmful characters', () => {
    const input = '  <script>alert("xss")</script>  ';
    const result = sanitizeString(input);
    expect(result).toBe('scriptalert("xss")/script');
  });

  it('should handle empty string', () => {
    const result = sanitizeString('');
    expect(result).toBe('');
  });
});

describe('generateSlug', () => {
  it('should generate valid slug from string', () => {
    const input = 'Web Development Tools & Services!';
    const result = generateSlug(input);
    expect(result).toBe('web-development-tools-services');
  });

  it('should handle multiple spaces and special characters', () => {
    const input = '  Multiple   Spaces & Special@Characters!  ';
    const result = generateSlug(input);
    expect(result).toBe('multiple-spaces-specialcharacters');
  });

  it('should handle empty string', () => {
    const result = generateSlug('');
    expect(result).toBe('');
  });
});

describe('isValidUUID', () => {
  it('should return true for valid UUID', () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';
    expect(isValidUUID(validUUID)).toBe(true);
  });

  it('should return false for invalid UUID', () => {
    const invalidUUID = 'not-a-uuid';
    expect(isValidUUID(invalidUUID)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isValidUUID('')).toBe(false);
  });
});
