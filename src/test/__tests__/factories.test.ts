import { describe, it, expect } from 'vitest';
import {
  createMockCategory,
  createMockAffiliateLink,
  createMockClickEvent,
  createMockAdminUser,
  createMockCreateLinkRequest,
  createMockAffiliateLinks,
  createMockCategories,
  createMockDataset,
} from '../factories';

describe('createMockCategory', () => {
  it('should create a valid category with default values', () => {
    const category = createMockCategory();

    expect(category).toHaveProperty('id');
    expect(category).toHaveProperty('name');
    expect(category).toHaveProperty('slug');
    expect(category).toHaveProperty('description');
    expect(category).toHaveProperty('color');
    expect(category).toHaveProperty('linkCount');

    expect(typeof category.id).toBe('string');
    expect(typeof category.name).toBe('string');
    expect(typeof category.slug).toBe('string');
    expect(typeof category.description).toBe('string');
    expect(typeof category.color).toBe('string');
    expect(typeof category.linkCount).toBe('number');
  });

  it('should apply overrides correctly', () => {
    const overrides = {
      name: 'Custom Category',
      slug: 'custom-category',
      color: '#FF0000',
    };

    const category = createMockCategory(overrides);

    expect(category.name).toBe('Custom Category');
    expect(category.slug).toBe('custom-category');
    expect(category.color).toBe('#FF0000');
  });
});

describe('createMockAffiliateLink', () => {
  it('should create a valid affiliate link with default values', () => {
    const link = createMockAffiliateLink();

    expect(link).toHaveProperty('id');
    expect(link).toHaveProperty('title');
    expect(link).toHaveProperty('description');
    expect(link).toHaveProperty('url');
    expect(link).toHaveProperty('affiliateUrl');
    expect(link).toHaveProperty('category');
    expect(link).toHaveProperty('tags');
    expect(link).toHaveProperty('featured');
    expect(link).toHaveProperty('clickCount');
    expect(link).toHaveProperty('createdAt');
    expect(link).toHaveProperty('updatedAt');
    expect(link).toHaveProperty('status');

    expect(typeof link.id).toBe('string');
    expect(typeof link.title).toBe('string');
    expect(typeof link.description).toBe('string');
    expect(typeof link.url).toBe('string');
    expect(typeof link.affiliateUrl).toBe('string');
    expect(typeof link.category).toBe('object');
    expect(Array.isArray(link.tags)).toBe(true);
    expect(typeof link.featured).toBe('boolean');
    expect(typeof link.clickCount).toBe('number');
    expect(link.createdAt instanceof Date).toBe(true);
    expect(link.updatedAt instanceof Date).toBe(true);
    expect(['active', 'inactive', 'pending']).toContain(link.status);
  });

  it('should apply overrides correctly', () => {
    const overrides = {
      title: 'Custom Link',
      featured: true,
      clickCount: 999,
    };

    const link = createMockAffiliateLink(overrides);

    expect(link.title).toBe('Custom Link');
    expect(link.featured).toBe(true);
    expect(link.clickCount).toBe(999);
  });
});

describe('createMockClickEvent', () => {
  it('should create a valid click event with default values', () => {
    const event = createMockClickEvent();

    expect(event).toHaveProperty('id');
    expect(event).toHaveProperty('linkId');
    expect(event).toHaveProperty('timestamp');
    expect(event).toHaveProperty('userAgent');
    expect(event).toHaveProperty('ipAddress');
    expect(event).toHaveProperty('sessionId');

    expect(typeof event.id).toBe('string');
    expect(typeof event.linkId).toBe('string');
    expect(event.timestamp instanceof Date).toBe(true);
    expect(typeof event.userAgent).toBe('string');
    expect(typeof event.ipAddress).toBe('string');
    expect(typeof event.sessionId).toBe('string');
  });

  it('should apply overrides correctly', () => {
    const overrides = {
      linkId: 'custom-link-id',
      ipAddress: '127.0.0.1',
    };

    const event = createMockClickEvent(overrides);

    expect(event.linkId).toBe('custom-link-id');
    expect(event.ipAddress).toBe('127.0.0.1');
  });
});

describe('createMockAdminUser', () => {
  it('should create a valid admin user with default values', () => {
    const user = createMockAdminUser();

    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('role');
    expect(user).toHaveProperty('lastLogin');

    expect(typeof user.id).toBe('string');
    expect(typeof user.email).toBe('string');
    expect(typeof user.name).toBe('string');
    expect(['admin', 'editor']).toContain(user.role);
    expect(user.lastLogin instanceof Date).toBe(true);
  });

  it('should apply overrides correctly', () => {
    const overrides = {
      email: 'custom@example.com',
      role: 'editor' as const,
    };

    const user = createMockAdminUser(overrides);

    expect(user.email).toBe('custom@example.com');
    expect(user.role).toBe('editor');
  });
});

describe('createMockCreateLinkRequest', () => {
  it('should create a valid create link request with default values', () => {
    const request = createMockCreateLinkRequest();

    expect(request).toHaveProperty('title');
    expect(request).toHaveProperty('description');
    expect(request).toHaveProperty('url');
    expect(request).toHaveProperty('affiliateUrl');
    expect(request).toHaveProperty('categoryId');
    expect(request).toHaveProperty('tags');
    expect(request).toHaveProperty('featured');

    expect(typeof request.title).toBe('string');
    expect(typeof request.description).toBe('string');
    expect(typeof request.url).toBe('string');
    expect(typeof request.affiliateUrl).toBe('string');
    expect(typeof request.categoryId).toBe('string');
    expect(Array.isArray(request.tags)).toBe(true);
    expect(typeof request.featured).toBe('boolean');
  });

  it('should apply overrides correctly', () => {
    const overrides = {
      title: 'Custom Request',
      featured: true,
    };

    const request = createMockCreateLinkRequest(overrides);

    expect(request.title).toBe('Custom Request');
    expect(request.featured).toBe(true);
  });
});

describe('createMockAffiliateLinks', () => {
  it('should create multiple affiliate links', () => {
    const links = createMockAffiliateLinks(3);

    expect(links).toHaveLength(3);
    expect(links.every((link) => typeof link.id === 'string')).toBe(true);
    expect(links.every((link) => typeof link.title === 'string')).toBe(true);
  });

  it('should apply overrides to all links', () => {
    const overrides = { featured: true };
    const links = createMockAffiliateLinks(2, overrides);

    expect(links.every((link) => link.featured === true)).toBe(true);
  });

  it('should create unique titles when base title is provided', () => {
    const links = createMockAffiliateLinks(3, { title: 'Base Title' });

    expect(links[0].title).toBe('Base Title 1');
    expect(links[1].title).toBe('Base Title 2');
    expect(links[2].title).toBe('Base Title 3');
  });
});

describe('createMockCategories', () => {
  it('should create multiple categories with default count', () => {
    const categories = createMockCategories();

    expect(categories).toHaveLength(5);
    expect(categories.every((cat) => typeof cat.id === 'string')).toBe(true);
    expect(categories.every((cat) => typeof cat.name === 'string')).toBe(true);
  });

  it('should create specified number of categories', () => {
    const categories = createMockCategories(3);

    expect(categories).toHaveLength(3);
  });

  it('should have unique names and slugs', () => {
    const categories = createMockCategories(3);
    const names = categories.map((cat) => cat.name);
    const slugs = categories.map((cat) => cat.slug);

    expect(new Set(names).size).toBe(names.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('createMockDataset', () => {
  it('should create a complete dataset with all entities', () => {
    const dataset = createMockDataset();

    expect(dataset).toHaveProperty('categories');
    expect(dataset).toHaveProperty('links');
    expect(dataset).toHaveProperty('users');
    expect(dataset).toHaveProperty('clickEvents');

    expect(Array.isArray(dataset.categories)).toBe(true);
    expect(Array.isArray(dataset.links)).toBe(true);
    expect(Array.isArray(dataset.users)).toBe(true);
    expect(Array.isArray(dataset.clickEvents)).toBe(true);

    expect(dataset.categories.length).toBeGreaterThan(0);
    expect(dataset.links.length).toBeGreaterThan(0);
    expect(dataset.users.length).toBe(2);
    expect(dataset.clickEvents.length).toBeGreaterThan(0);
  });

  it('should have links associated with categories', () => {
    const dataset = createMockDataset();
    const categoryIds = dataset.categories.map((cat) => cat.id);

    expect(
      dataset.links.every((link) => categoryIds.includes(link.category.id))
    ).toBe(true);
  });

  it('should have click events associated with links', () => {
    const dataset = createMockDataset();
    const linkIds = dataset.links.map((link) => link.id);

    expect(
      dataset.clickEvents.every((event) => linkIds.includes(event.linkId))
    ).toBe(true);
  });

  it('should have both admin and editor users', () => {
    const dataset = createMockDataset();
    const roles = dataset.users.map((user) => user.role);

    expect(roles).toContain('admin');
    expect(roles).toContain('editor');
  });
});
